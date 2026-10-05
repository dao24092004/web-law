package com.lawfirm.brs.controller.crm;

import com.lawfirm.brs.dto.request.NewsletterSubscribeRequest;
import com.lawfirm.brs.dto.response.ApiResponse;
import com.lawfirm.brs.service.crm.NewsletterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for newsletter subscriptions.
 */
@RestController
@RequestMapping("/api/crm/newsletter")
@RequiredArgsConstructor
@Tag(name = "CRM - Newsletter", description = "Newsletter subscription endpoints")
public class NewsletterController {

    private final NewsletterService newsletterService;
    private final com.lawfirm.brs.security.ClientIpResolver clientIpResolver;

    @PostMapping("/subscribe")
    @Operation(summary = "Subscribe to newsletter")
    public ResponseEntity<ApiResponse<String>> subscribe(
            @Valid @RequestBody NewsletterSubscribeRequest request,
            HttpServletRequest httpRequest) {
        String ip = getClientIp(httpRequest);
        newsletterService.subscribe(request, ip);
        return ResponseEntity.ok(ApiResponse.success("Subscription successful. Please check your email to confirm."));
    }

    @GetMapping("/confirm")
    @Operation(summary = "Confirm newsletter subscription")
    public ResponseEntity<ApiResponse<String>> confirm(@RequestParam String token) {
        newsletterService.confirmSubscription(token);
        return ResponseEntity.ok(ApiResponse.success("Subscription confirmed successfully."));
    }

    @PostMapping("/unsubscribe")
    @Operation(summary = "Unsubscribe from newsletter")
    public ResponseEntity<ApiResponse<String>> unsubscribe(@RequestParam String email) {
        newsletterService.unsubscribe(email);
        return ResponseEntity.ok(ApiResponse.success("Unsubscribed successfully."));
    }

    /**
     * Lấy IP client đã được chuẩn hoá. Xem {@link ClientIpResolver} — không
     * được đọc trực tiếp X-Forwarded-For vì client kiểm soát phần tử đầu.
     */
    private String getClientIp(HttpServletRequest request) {
        return clientIpResolver.resolve(request);
    }
}
