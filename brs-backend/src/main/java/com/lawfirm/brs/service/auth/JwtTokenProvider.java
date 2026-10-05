package com.lawfirm.brs.service.auth;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * JWT Token Provider - RS256 implementation with key rotation support.
 * [IMPROVED v2] Uses RSA key files instead of JWT_SECRET string
 */
@Service
@Slf4j
public class JwtTokenProvider {

    @Value("${app.jwt.access-token-expiry:15m}")
    private String accessTokenExpiry;

    @Value("${app.jwt.refresh-token-expiry:7d}")
    private String refreshTokenExpiry;

    @Value("${app.jwt.issuer:brs-lawfirm}")
    private String issuer;

    @Value("${app.jwt.private-key-path:keys/jwt-private.pem}")
    private String privateKeyPath;

    @Value("${app.jwt.public-key-path:keys/jwt-public.pem}")
    private String publicKeyPath;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    private PrivateKey privateKey;
    private PublicKey publicKey;

    private final RefreshTokenStore refreshTokenStore;
    private final org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    public JwtTokenProvider(
        RefreshTokenStore refreshTokenStore,
        @org.springframework.beans.factory.annotation.Qualifier("customUserDetailsService")
        org.springframework.security.core.userdetails.UserDetailsService userDetailsService
    ) {
        this.refreshTokenStore = refreshTokenStore;
        this.userDetailsService = userDetailsService;
    }

    @PostConstruct
    public void init() {
        try {
            this.privateKey = loadPrivateKey(Path.of(privateKeyPath));
            this.publicKey = loadPublicKey(Path.of(publicKeyPath));
            log.info("JWT keys loaded successfully from {} and {}", privateKeyPath, publicKeyPath);
        } catch (Exception e) {
            if ("prod".equalsIgnoreCase(activeProfile)) {
                throw new IllegalStateException(
                    "Production JWT keys could not be loaded from configured paths: "
                        + privateKeyPath + " and " + publicKeyPath,
                    e);
            }

            log.warn("Could not load JWT keys from files, generating temporary keys for development");
            KeyPair keyPair = generateKeyPair();
            this.privateKey = keyPair.getPrivate();
            this.publicKey = keyPair.getPublic();
        }
    }

    /**
     * Generate access token for user
     */
    public String generateAccessToken(UserDetails userDetails) {
        Instant now = Instant.now();
        Instant expiry = calculateExpiry(accessTokenExpiry);
        
        return Jwts.builder()
            .subject(userDetails.getUsername())
            .claim("role", userDetails.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .collect(Collectors.toList()))
            .issuer(issuer)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .id(UUID.randomUUID().toString()) // jti
            .signWith(privateKey, Jwts.SIG.RS256)
            .compact();
    }

    /**
     * Generate token pair for user
     */
    public TokenPair generateTokenPair(UserDetails userDetails) {
        String accessToken = generateAccessToken(userDetails);
        String refreshToken = generateRefreshToken(userDetails);
        
        return new TokenPair(
            accessToken,
            refreshToken,
            calculateExpiry(accessTokenExpiry),
            calculateExpiry(refreshTokenExpiry)
        );
    }

    /**
     * Generate refresh token
     */
    public String generateRefreshToken(UserDetails userDetails) {
        Instant now = Instant.now();
        Instant expiry = calculateExpiry(refreshTokenExpiry);
        
        String token = Jwts.builder()
            .subject(userDetails.getUsername())
            .claim("type", "refresh")
            .issuer(issuer)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .id(UUID.randomUUID().toString()) // jti
            .signWith(privateKey, Jwts.SIG.RS256)
            .compact();
        
        // Store JTI for revocation tracking
        refreshTokenStore.saveForUser(userDetails.getUsername(), extractJti(token));
        
        return token;
    }

    /**
     * Validate and parse JWT token
     */
    public Claims parseToken(String token) {
        try {
            return Jwts.parser()
                .verifyWith(publicKey)
                .clockSkewSeconds(30) // Allow 30 seconds clock skew
                .build()
                .parseSignedClaims(token)
                .getPayload();
        } catch (ExpiredJwtException e) {
            log.debug("JWT token expired: {}", e.getMessage());
            throw e;
        } catch (JwtException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Extract username from token
     */
    public String getUsernameFromToken(String token) {
        return parseToken(token).getSubject();
    }

    /**
     * Extract JTI from token
     */
    public String extractJti(String token) {
        return parseToken(token).getId();
    }

    /**
     * Check if token is valid (not expired, not revoked)
     */
    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseToken(token);
            String jti = claims.getId();
            
            // Check if token is revoked
            if (refreshTokenStore.isRevoked(jti)) {
                return false;
            }
            
            return !claims.getExpiration().before(Date.from(Instant.now()));
        } catch (JwtException e) {
            return false;
        }
    }

    /**
     * Rotate refresh token - invalidate old and generate new pair.
     *
     * <p>The incoming token <strong>must</strong> be a refresh token.  We
     * enforce the {@code type=refresh} claim so an attacker can't use a
     * (short-lived) access token to mint a fresh long-lived refresh token.
     */
    public TokenPair rotateRefreshToken(String oldRefreshToken) {
        Claims claims = parseToken(oldRefreshToken);
        String jti = claims.getId();

        // Reject access tokens masquerading as refresh tokens.
        Object typeClaim = claims.get("type");
        if (!"refresh".equals(typeClaim)) {
            throw new io.jsonwebtoken.JwtException("Not a refresh token");
        }

        // Check for reuse attack
        if (refreshTokenStore.isRevoked(jti)) {
            // Token reuse detected - revoke all user tokens
            refreshTokenStore.revokeAllForUser(claims.getSubject());
            throw new SecurityException("Refresh token reuse detected");
        }

        // Revoke old token
        refreshTokenStore.revoke(jti);

        // Load user from DB to keep roles/permissions fresh. If the user
        // no longer exists or is locked/inactive, fail fast so we don't
        // issue a token that bypasses account state.
        UserDetails userDetails;
        try {
            userDetails = userDetailsService.loadUserByUsername(claims.getSubject());
        } catch (UsernameNotFoundException e) {
            throw new io.jsonwebtoken.JwtException("User not found for refresh");
        }

        // Generate new token pair
        String newAccessToken = generateAccessToken(userDetails);
        String newRefreshToken = generateRefreshToken(userDetails);

        return new TokenPair(
            newAccessToken,
            newRefreshToken,
            calculateExpiry(accessTokenExpiry),
            calculateExpiry(refreshTokenExpiry)
        );
    }

    /**
     * Revoke all tokens for a user
     */
    public void revokeAllUserTokens(String username) {
        refreshTokenStore.revokeAllForUser(username);
    }

    private Instant calculateExpiry(String expiry) {
        if (expiry.endsWith("m")) {
            return Instant.now().plus(Long.parseLong(expiry.replace("m", "")), ChronoUnit.MINUTES);
        } else if (expiry.endsWith("h")) {
            return Instant.now().plus(Long.parseLong(expiry.replace("h", "")), ChronoUnit.HOURS);
        } else if (expiry.endsWith("d")) {
            return Instant.now().plus(Long.parseLong(expiry.replace("d", "")), ChronoUnit.DAYS);
        }
        return Instant.now().plus(15, ChronoUnit.MINUTES);
    }

    private PrivateKey loadPrivateKey(Path path) throws Exception {
        String key = Files.readString(path);
        key = key.replace("-----BEGIN PRIVATE KEY-----", "")
                 .replace("-----END PRIVATE KEY-----", "")
                 .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(key);
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(decoded);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePrivate(keySpec);
    }

    private PublicKey loadPublicKey(Path path) throws Exception {
        String key = Files.readString(path);
        key = key.replace("-----BEGIN PUBLIC KEY-----", "")
                 .replace("-----END PUBLIC KEY-----", "")
                 .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(key);
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(decoded);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePublic(keySpec);
    }

    private KeyPair generateKeyPair() {
        java.security.KeyPairGenerator keyGen;
        try {
            keyGen = java.security.KeyPairGenerator.getInstance("RSA");
            keyGen.initialize(2048);
            return keyGen.generateKeyPair();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate key pair", e);
        }
    }

    /**
     * Token pair record
     */
    public record TokenPair(
        String accessToken,
        String refreshToken,
        Instant accessTokenExpiry,
        Instant refreshTokenExpiry
    ) {}
}
