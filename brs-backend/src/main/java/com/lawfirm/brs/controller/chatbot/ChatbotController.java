package com.lawfirm.brs.controller.chatbot;

import com.lawfirm.brs.dto.request.ChatbotMessageRequest;
import com.lawfirm.brs.dto.response.ApiResponse;
import com.lawfirm.brs.dto.response.ChatbotStreamResponse;
import com.lawfirm.brs.entity.ChatbotSession;
import com.lawfirm.brs.exception.ResourceNotFoundException;
import com.lawfirm.brs.service.chatbot.ChatbotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for chatbot.
 */
@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@Tag(name = "Chatbot", description = "Chatbot endpoints")
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final com.lawfirm.brs.security.ClientIpResolver clientIpResolver;

    @PostMapping("/message")
    @Operation(summary = "Send message to chatbot")
    public ResponseEntity<ApiResponse<ChatbotStreamResponse>> sendMessage(
            @Valid @RequestBody ChatbotMessageRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        ChatbotSession session = chatbotService.processMessage(request, clientIp, userAgent);

        ChatbotService.IntentResultSnapshot intentResult = chatbotService.lastIntentResult();

        ChatbotStreamResponse body = ChatbotStreamResponse.builder()
            .sessionId(session.getSessionId())
            .content(chatbotService.lastResponseText())
            .intent(intentResult.intent())
            .confidence(intentResult.confidence())
            .escalated(Boolean.TRUE.equals(session.getEscalated()))
            .action(chatbotService.lastAction())
            .suggestedFaqs(chatbotService.lastSuggestedFaqs())
            .done(true)
            .timestamp(java.time.Instant.now())
            .build();

        return ResponseEntity.ok(ApiResponse.success(body));
    }

    @GetMapping("/history/{sessionId}")
    @Operation(summary = "Get chat history")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getHistory(
            @PathVariable String sessionId,
            @RequestHeader(value = "X-Session-Id", required = false) String headerSessionId) {
        if (!sessionId.equals(headerSessionId)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Access denied to this chat session"));
        }

        List<Map<String, String>> history = chatbotService.getHistory(sessionId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @PostMapping("/handoff")
    @Operation(summary = "Request human handoff")
    public ResponseEntity<ApiResponse<ChatbotStreamResponse>> requestHandoff(@RequestParam String sessionId) {
        chatbotService.requestHandoff(sessionId);
        ChatbotStreamResponse body = ChatbotStreamResponse.builder()
            .sessionId(sessionId)
            .content("Đang chuyển bạn đến bộ phận chăm sóc khách hàng. Vui lòng đợi trong giây lát.")
            .intent("HANDOVER")
            .action("HANDOVER")
            .escalated(true)
            .done(true)
            .timestamp(java.time.Instant.now())
            .build();
        return ResponseEntity.ok(ApiResponse.success(body));
    }

    /**
     * Lấy IP client đã được chuẩn hoá. Xem {@link ClientIpResolver} — không
     * được đọc trực tiếp X-Forwarded-For vì client kiểm soát phần tử đầu.
     */
    private String getClientIp(HttpServletRequest request) {
        return clientIpResolver.resolve(request);
    }
}