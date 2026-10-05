package com.lawfirm.brs.controller.webhook;

import com.lawfirm.brs.dto.response.ApiResponse;
import com.lawfirm.brs.service.notification.SmsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
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

    @Value("${webhooks.sms.secret:${WEBHOOKS_SMS_SECRET:}}")
    private String smsSecret;

    @Value("${webhooks.otp.secret:${WEBHOOKS_OTP_SECRET:}}")
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
        if (!verifySignature(smsSecret, serialize(payload), signature)) {
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
        if (!verifySignature(otpSecret, serialize(payload), signature)) {
            log.warn("Rejected OTP webhook: invalid signature (phone={})", payload.phone());
            return ResponseEntity.status(401).body(ApiResponse.error("INVALID_SIGNATURE"));
        }
        log.info("OTP webhook received: phone={} status={} attempts={}",
                payload.phone(), payload.status(), payload.attempts());
        return ResponseEntity.ok(ApiResponse.success(Map.of("received", "true")));
    }

    /** Tái tạo đúng chuỗi JSON mà bên gửi đã ký. */
    private String serialize(Object payload) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Không serialize được payload webhook: {}", e.getMessage());
            return "";
        }
    }

    /**
     * Xác thực chữ ký HMAC-SHA256 của webhook.
     *
     * <p>Fail-closed: nếu chưa cấu hình secret thì <b>từ chối</b> mọi request
     * thay vì chấp nhận. Trước đây hàm trả về {@code true} khi secret rỗng,
     * biến endpoint thành công kênh mở không cần xác thực.
     *
     * <p>Dùng HMAC-SHA256 trên <b>raw body</b> thay vì MD5 trên
     * {@code payload.toString()}: {@code toString()} của record phụ thuộc thứ tự
     * trường và không phải byte thật trên wire, nên hai bên dễ lệch chữ ký.
     */
    private boolean verifySignature(String secret, String rawBody, String providedSignature) {
        if (secret == null || secret.isBlank()) {
            log.error("Webhook secret chưa cấu hình — từ chối mọi webhook. "
                    + "Đặt WEBHOOKS_SMS_SECRET / WEBHOOKS_OTP_SECRET trong .env.production");
            return false;
        }
        if (providedSignature == null || providedSignature.isBlank()) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String expected = HexFormat.of().formatHex(digest);

            // So sánh kiểu constant-time để không rò rỉ thông tin qua thời gian.
            return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                providedSignature.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Lỗi tính HMAC cho webhook: {}", e.getMessage());
            return false;
        }
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
