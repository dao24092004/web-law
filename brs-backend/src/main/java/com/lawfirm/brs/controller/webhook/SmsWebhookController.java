package com.lawfirm.brs.controller.webhook;

import com.lawfirm.brs.dto.response.ApiResponse;
import com.lawfirm.brs.service.notification.SmsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.util.DigestUtils;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Controller for handling SMS and OTP webhooks from external providers.
 *
 * <p>The previous implementation routed SMS delivery and OTP callbacks directly
 * into Spring MVC handlers that threw on every request because the providers'
 * signature scheme and payload shape were never finalized. The endpoints are
 * re-enabled here with a thin, log-only handler so we can validate that traffic
 * is reaching us before wiring business logic. Once the provider contract is
 * locked down, swap the {@code log.info} lines for the real services.
 */
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Webhooks", description = "Webhook endpoints for external services")
public class SmsWebhookController {

    private final SmsService smsService;

    @Value("${webhooks.sms.secret:}")
    private String smsSecret;

    @Value("${webhooks.otp.secret:}")
    private String otpSecret;

    @GetMapping("/health")
    @Operation(summary = "Webhook health check")
    public ResponseEntity<ApiResponse<Map<String, String>>> healthCheck() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "UP",
                "service", "webhook-handler"
        )));
    }

    /**
     * SMS delivery status callback. Validates the HMAC-style signature carried
     * in {@code X-Webhook-Signature} when a secret is configured; otherwise the
     * payload is accepted for local development and only logged.
     */
    @PostMapping("/sms")
    @Operation(summary = "SMS delivery status callback from provider")
    public ResponseEntity<ApiResponse<Map<String, String>>> smsCallback(
            @RequestBody SmsWebhookPayload payload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature) {
        if (!verifySignature(smsSecret, payload, signature)) {
            log.warn("Rejected SMS webhook: invalid signature (provider={}, messageId={})",
                    payload.provider(), payload.messageId());
            return ResponseEntity.status(401).body(ApiResponse.error("INVALID_SIGNATURE"));
        }
        log.info("SMS webhook received: provider={} messageId={} status={} phone={}",
                payload.provider(), payload.messageId(), payload.status(), payload.phone());
        // Business logic intentionally deferred until the provider contract is finalized.
        return ResponseEntity.ok(ApiResponse.success(Map.of("received", "true")));
    }

    /**
     * OTP verification callback for the SMS provider. Same signature rules as
     * the SMS endpoint above.
     */
    @PostMapping("/otp-callback")
    @Operation(summary = "OTP verification callback from provider")
    public ResponseEntity<ApiResponse<Map<String, String>>> otpCallback(
            @RequestBody OtpCallbackPayload payload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature) {
        if (!verifySignature(otpSecret, payload, signature)) {
            log.warn("Rejected OTP webhook: invalid signature (phone={})", payload.phone());
            return ResponseEntity.status(401).body(ApiResponse.error("INVALID_SIGNATURE"));
        }
        log.info("OTP webhook received: phone={} status={} attempts={}",
                payload.phone(), payload.status(), payload.attempts());
        return ResponseEntity.ok(ApiResponse.success(Map.of("received", "true")));
    }

    /**
     * Cheap shared-secret check. Production should use HMAC-SHA256 with a
     * per-provider secret; for now we accept any header when no secret is
     * configured so local development still works.
     */
    private boolean verifySignature(String secret, Object payload, String providedSignature) {
        if (secret == null || secret.isEmpty()) {
            return true;
        }
        if (providedSignature == null || providedSignature.isEmpty()) {
            return false;
        }
        String computed = DigestUtils.md5DigestAsHex(
                (secret + payload.toString()).getBytes(StandardCharsets.UTF_8));
        return computed.equalsIgnoreCase(providedSignature);
    }

    public record SmsWebhookPayload(
            String provider,
            String messageId,
            String status,
            String phone,
            Long timestamp,
            String errorCode,
            String errorMessage
    ) {}

    public record OtpCallbackPayload(
            String phone,
            String status,
            String code,
            Integer attempts,
            Long expiresAt,
            String provider
    ) {}
}
