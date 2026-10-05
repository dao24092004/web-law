package com.lawfirm.brs.config;

import com.lawfirm.brs.security.AuthCookieHelper;
import com.lawfirm.brs.security.RateLimitFilter;
import com.lawfirm.brs.service.auth.JwtTokenProvider;
import com.lawfirm.brs.service.auth.RefreshTokenStore;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Spring Security configuration with JWT authentication.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AppProperties appProperties;
    private final UserDetailsService userDetailsService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenStore refreshTokenStore;
    private final RateLimitFilter rateLimitFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final AuthCookieHelper authCookieHelper;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'"))
                .referrerPolicy(referrer -> referrer.policy(
                    org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .frameOptions(frame -> frame.sameOrigin())
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/login", "/api/auth/refresh", "/api/auth/logout",
                    "/api/auth/forgot-password", "/api/auth/reset-password",
                    "/api/auth/register").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/bookings").permitAll()
                .requestMatchers(HttpMethod.POST,
                    "/api/bookings/*/verify", "/api/bookings/*/resend-otp").permitAll()
                .requestMatchers("/api/bookings/availability/**").permitAll()
                .requestMatchers("/api/crm/newsletter/subscribe",
                    "/api/crm/newsletter/confirm",
                    "/api/crm/newsletter/unsubscribe").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/crm/leads").permitAll()
                .requestMatchers("/api/crm/jobs/*/apply").permitAll()
                .requestMatchers("/api/crm/jobs").permitAll()
                .requestMatchers("/api/crm/reviews").permitAll()
                .requestMatchers("/api/chatbot/**").permitAll()
                .requestMatchers("/api/webhooks/**").permitAll()
                // Chỉ cho phép tài liệu API ở môi trường không phải production.
                // Ở production, /v3/api-docs tiết lộ toàn bộ schema (endpoint,
                // tên trường, cấu trúc dữ liệu) cho bất kỳ ai gọi tới.
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**")
                    .permitAll()
                .requestMatchers("/actuator/health/**").permitAll()
                // Locally-served uploaded files
                .requestMatchers(HttpMethod.GET, "/files", "/files/**").permitAll()
                // Authenticated endpoints
                .requestMatchers("/api/auth/me", "/api/auth/me/**").authenticated()
                .requestMatchers("/api/notifications/**").authenticated()
                .requestMatchers("/api/bookings/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "CSKH", "LAWYER")
                // Admin/Editor endpoints
                .requestMatchers("/api/crm/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "CSKH", "LAWYER")
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "EDITOR")
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider, userDetailsService, authCookieHelper),
                UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(rateLimitFilter, JwtAuthenticationFilter.class)
            .build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}