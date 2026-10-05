package com.lawfirm.brs.service.chatbot;

import com.lawfirm.brs.dto.request.ChatbotMessageRequest;
import com.lawfirm.brs.dto.response.ChatbotStreamResponse;
import com.lawfirm.brs.entity.ChatbotSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Main chatbot service orchestrator. Session and messages are persisted
 * to PostgreSQL via {@link ChatSessionService}; this class only carries
 * intent-classification side effects and exposes the last turn to the
 * controller for response shaping.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final ChatSessionService sessionService;
    private final IntentClassifier intentClassifier;
    private final FaqSuggestionService faqSuggestionService;

    private static final Map<String, String> INTENT_RESPONSES = Map.ofEntries(
        Map.entry("GREETING", "Xin chào! Tôi là trợ lý ảo của Văn phòng Luật. Tôi có thể giúp gì cho bạn hôm nay?"),
        Map.entry("BOOKING", "Bạn muốn đặt lịch tư vấn với luật sư? Vui lòng cung cấp thông tin liên hệ để chúng tôi có thể liên hệ lại với bạn."),
        Map.entry("SERVICE_INQUIRY", "Chúng tôi cung cấp các dịch vụ pháp lý đa dạng. Bạn quan tâm đến lĩnh vực nào?"),
        Map.entry("LAWYER_INQUIRY", "Đội ngũ luật sư của chúng tôi gồm nhiều chuyên gia với nhiều năm kinh nghiệm. Bạn muốn tìm hiểu về lĩnh vực nào?"),
        Map.entry("FAQ", "Tôi có thể trả lời các câu hỏi thường gặp. Bạn muốn hỏi về vấn đề gì?"),
        Map.entry("CONTACT", "Bạn có thể liên hệ với chúng tôi qua:\n📞 Hotline: 0969 967 389 - 0975 967 364\n📧 Email: contact@icrclaw.com\n📍 Địa chỉ: [địa chỉ]"),
        Map.entry("THANKS", "Cảm ơn bạn! Nếu cần thêm hỗ trợ, đừng ngần ngại hỏi nhé!"),
        Map.entry("GOODBYE", "Tạm biệt! Chúc bạn một ngày tốt lành!"),
        Map.entry("COMPLAINT", "Tôi rất tiếc khi nghe điều này. Để được hỗ trợ tốt hơn, tôi sẽ chuyển bạn đến bộ phận chăm sóc khách hàng."),
        Map.entry("FEEDBACK", "Cảm ơn ý kiến đóng góp của bạn! Chúng tôi luôn lắng nghe để cải thiện dịch vụ.")
    );

    private final ThreadLocal<String> lastResponseText = new ThreadLocal<>();
    private final ThreadLocal<String> lastAction = new ThreadLocal<>();
    private final ThreadLocal<IntentClassifier.IntentResult> lastIntentResult = new ThreadLocal<>();
    private final ThreadLocal<java.util.List<com.lawfirm.brs.dto.response.FaqSuggestionDTO>> lastSuggestedFaqs =
        new ThreadLocal<>();

    /**
     * Process a user message: persist session, persist USER turn, classify
     * intent, persist BOT response, and apply escalation side effects.
     * Returns the session so the controller can build a response.
     */
    public ChatbotSession processMessage(ChatbotMessageRequest request, String clientIp, String userAgent) {
        log.info("Processing chatbot message: {}", request.message());

        ChatbotSession session = sessionService.createOrGetSession(
            request.sessionId(), clientIp, userAgent, request.language());

        // Persist the USER turn first so the message is always recorded even
        // when the session is escalated/closed. Customer messages must NEVER
        // be silently dropped.
        sessionService.addMessage(session.getSessionId(), "USER", request.message(), null, null);

        // Block further processing if the session is closed.
        if (session.getEndedAt() != null || Boolean.TRUE.equals(session.getResolved())) {
            this.lastResponseText.set("Phiên hỗ trợ đã kết thúc. Vui lòng tạo cuộc trò chuyện mới.");
            this.lastAction.set("CLOSED");
            return session;
        }

        // CRITICAL: when the session has already been escalated to a human agent,
        // do NOT run intent classification or BOT reply — the staff member must
        // see the message and reply manually. The USER message was already
        // persisted above so the admin UI sees it.
        if (Boolean.TRUE.equals(session.getEscalated())) {
            ChatbotStreamResponse body = ChatbotStreamResponse.builder()
                .sessionId(session.getSessionId())
                .content("Đã gửi tin nhắn đến nhân viên tư vấn. Vui lòng đợi phản hồi.")
                .intent("HANDED_OFF")
                .escalated(true)
                .action("WAITING_AGENT")
                .done(true)
                .timestamp(java.time.Instant.now())
                .build();
            this.lastResponseText.set(body.getContent());
            this.lastAction.set(body.getAction());
            return session;
        }

        IntentClassifier.IntentResult intentResult = intentClassifier.classify(request.message());
        String responseText;
        String action = null;

        if (intentClassifier.isLowConfidence(intentResult)) {
            responseText = "Xin lỗi, tôi chưa hiểu rõ ý bạn. Bạn có thể diễn đạt chi tiết hơn không? Hoặc liên hệ trực tiếp qua hotline để được hỗ trợ nhanh hơn.";
            if ("COMPLAINT".equals(intentResult.intent()) || "BOOKING".equals(intentResult.intent())) {
                sessionService.markEscalated(session.getSessionId());
                action = "HANDOVER";
            }
        } else {
            responseText = INTENT_RESPONSES.getOrDefault(intentResult.intent(),
                "Cảm ơn bạn đã liên hệ. Bạn có thể mô tả chi tiết hơn về vấn đề của mình không?");

            if ("BOOKING".equals(intentResult.intent())) {
                action = "BOOKING_INTENT";
            }
            if ("CONTACT".equals(intentResult.intent()) || "COMPLAINT".equals(intentResult.intent())) {
                sessionService.markEscalated(session.getSessionId());
                action = "HANDOVER";
            }
        }

        sessionService.addMessage(session.getSessionId(), "BOT", responseText,
            intentResult.intent(), intentResult.confidence());

        // Re-fetch so the controller sees the latest escalated/message_count state.
        session = sessionService.createOrGetSession(session.getSessionId(), clientIp, userAgent, request.language());

        lastResponseText.set(responseText);
        lastAction.set(action);
        lastIntentResult.set(intentResult);
        lastSuggestedFaqs.set(faqSuggestionService.suggest(
            request.message(), intentResult.intent(), request.language(), 3));
        return session;
    }

    public List<Map<String, String>> getHistory(String sessionId) {
        return sessionService.getHistory(sessionId);
    }

    /**
     * Manually trigger a handoff — marks session escalated, persists a
     * system message, and exposes a friendly reply string for the FE.
     * Throws {@link IllegalStateException} if the session does not exist.
     */
    public void requestHandoff(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException("sessionId is required");
        }
        // markEscalated is idempotent; addMessage throws if the session is missing.
        sessionService.markEscalated(sessionId);
        sessionService.addMessage(sessionId, "SYSTEM",
            "Yêu cầu chuyển sang nhân viên tư vấn.", "HANDOVER", null);
        lastResponseText.set("Đang chuyển bạn đến bộ phận chăm sóc khách hàng. Vui lòng đợi trong giây lát.");
        lastAction.set("HANDOVER");
    }

    public String lastResponseText() {
        return lastResponseText.get();
    }

    public String lastAction() {
        return lastAction.get();
    }

    /**
     * Returns the intent classification from the last call to {@link #processMessage}.
     * Uses a self-contained record (rather than {@code IntentClassifier.IntentResult})
     * so the controller doesn't pull the heavy {@code IntentClassifier} bean into
     * its constructor — classification already happened inside {@code processMessage}.
     */
    public IntentResultSnapshot lastIntentResult() {
        IntentClassifier.IntentResult r = lastIntentResult.get();
        return r != null
            ? new IntentResultSnapshot(r.intent(), r.confidence())
            : new IntentResultSnapshot("UNKNOWN", 0.0);
    }

    /**
     * Lightweight DTO mirroring {@code IntentClassifier.IntentResult} so callers
     * don't need to depend on the {@code IntentClassifier} class.
     */
    public record IntentResultSnapshot(String intent, double confidence) {}

    public java.util.List<com.lawfirm.brs.dto.response.FaqSuggestionDTO> lastSuggestedFaqs() {
        java.util.List<com.lawfirm.brs.dto.response.FaqSuggestionDTO> result = lastSuggestedFaqs.get();
        return result == null ? java.util.List.of() : result;
    }
}