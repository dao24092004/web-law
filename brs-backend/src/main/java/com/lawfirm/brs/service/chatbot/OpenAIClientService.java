package com.lawfirm.brs.service.chatbot;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Service for integrating with OpenAI GPT API for chatbot.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OpenAIClientService {

    private final RestTemplate restTemplate;

    @Value("${app.openai.api-key:}")
    private String apiKey;

    @Value("${app.openai.model:gpt-3.5-turbo}")
    private String model;

    @Value("${app.openai.max-tokens:500}")
    private int maxTokens;

    @Value("${app.openai.temperature:0.7}")
    private double temperature;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    /**
     * Send message to OpenAI and get response
     */
    @SuppressWarnings("unchecked")
    public String sendMessage(String sessionId, String userMessage, List<ChatMessage> conversationHistory) {
        log.info("Sending message to OpenAI for session: {}", sessionId);

        try {
            List<ChatMessage> messages = buildMessages(userMessage, conversationHistory);

            Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", messages,
                "max_tokens", maxTokens,
                "temperature", temperature
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(
                OPENAI_API_URL,
                HttpMethod.POST,
                request,
                (Class<Map>) (Class<?>) Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, Object> message = (Map<String, Object>) choice.get("message");
                    return (String) message.get("content");
                }
            }

            log.warn("Unexpected response from OpenAI: {}", response.getStatusCode());
            return getFallbackResponse();

        } catch (Exception e) {
            log.error("Failed to get response from OpenAI for session: {}", sessionId, e);
            return getFallbackResponse();
        }
    }

    /**
     * Build message list with system prompt and conversation history
     */
    private List<ChatMessage> buildMessages(String userMessage, List<ChatMessage> conversationHistory) {
        List<ChatMessage> messages = new ArrayList<>();

        // System prompt
        messages.add(new ChatMessage(
            "system",
            getSystemPrompt()
        ));

        // Conversation history (limit to last 10 messages to save tokens)
        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            int start = Math.max(0, conversationHistory.size() - 10);
            messages.addAll(conversationHistory.subList(start, conversationHistory.size()));
        }

        // Current user message
        messages.add(new ChatMessage("user", userMessage));

        return messages;
    }

    /**
     * Get system prompt for the chatbot
     */
    private String getSystemPrompt() {
        return """
            Bạn là trợ lý ảo của Văn phòng Luật sư, chuyên cung cấp thông tin về các dịch vụ pháp lý.
            
            Vai trò và khả năng:
            - Tư vấn sơ bộ về các vấn đề pháp lý
            - Giới thiệu các dịch vụ của văn phòng
            - Hướng dẫn khách hàng đặt lịch hẹn với luật sư
            - Trả lời các câu hỏi thường gặp
            
            Nguyên tắc:
            - Trả lời bằng tiếng Việt
            - Thân thiện và chuyên nghiệp
            - Không đưa ra ý kiến pháp lý chính thức (cần luật sư tư vấn trực tiếp)
            - Nếu câu hỏi phức tạp, hãy đề nghị khách hàng đặt lịch tư vấn
            - Cung cấp thông tin liên hệ khi cần thiết
            
            Thông tin liên hệ:
            - Hotline: 0969 967 389 - 0975 967 364
            - Email: contact@icrclaw.com
            - Địa chỉ: [địa chỉ văn phòng]
            """;
    }

    /**
     * Get fallback response when OpenAI API fails
     */
    private String getFallbackResponse() {
        return "Xin lỗi, hiện tại tôi đang gặp sự cố kết nối. Vui lòng liên hệ trực tiếp qua hotline 0969 967 389 - 0975 967 364 hoặc email contact@icrclaw.com để được hỗ trợ nhanh hơn.";
    }

    /**
     * Check if OpenAI API is configured
     */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Test OpenAI API connection
     */
    @SuppressWarnings("unchecked")
    public boolean testConnection() {
        if (!isConfigured()) {
            return false;
        }

        try {
            Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", "Hello")),
                "max_tokens", 5
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(
                OPENAI_API_URL,
                HttpMethod.POST,
                request,
                (Class<Map>) (Class<?>) Map.class
            );

            return response.getStatusCode() == HttpStatus.OK;

        } catch (Exception e) {
            log.error("OpenAI API connection test failed", e);
            return false;
        }
    }

    /**
     * Chat message record
     */
    public record ChatMessage(String role, String content) {}
}
