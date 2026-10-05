package com.lawfirm.brs.service.notification;

import com.lawfirm.brs.entity.User;
import com.lawfirm.brs.exception.BusinessException;
import com.lawfirm.brs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Unified notification service for sending notifications via multiple channels.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final EmailService emailService;
    private final SmsService smsService;
    private final UserRepository userRepository;

    public enum Channel {
        EMAIL, SMS, NOTIFICATION, ALL
    }

    /**
     * Send email notification
     */
    @Async
    public void sendEmail(String to, String subject, String template, Map<String, Object> data) {
        log.info("Sending email to: {}, subject: {}", to, subject);

        try {
            String body = renderTemplate(template, data);
            emailService.sendEmail(to, subject, body);
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to: {}", to, e);
            throw new BusinessException("EMAIL_SEND_FAILED", "Failed to send email: " + e.getMessage());
        }
    }

    /**
     * Send SMS notification
     */
    @Async
    public void sendSms(String phone, String message) {
        log.info("Sending SMS to: {}", phone);

        try {
            smsService.sendSms(phone, message);
            log.info("SMS sent successfully to: {}", phone);
        } catch (Exception e) {
            log.error("Failed to send SMS to: {}", phone, e);
            throw new BusinessException("SMS_SEND_FAILED", "Failed to send SMS: " + e.getMessage());
        }
    }

    /**
     * Send notification to user via specified channel(s)
     */
    @Async
    public void sendNotification(UUID userId, Channel channel, String content) {
        log.info("Sending notification to user: {}, channel: {}", userId, channel);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new com.lawfirm.brs.exception.ResourceNotFoundException("User not found: " + userId));

        if (!user.getIsActive()) {
            log.warn("Cannot send notification to inactive user: {}", userId);
            return;
        }

        switch (channel) {
            case EMAIL -> sendEmail(user.getEmail(), "Notification", null, Map.of("content", content));
            case SMS -> {
                if (user.getPhone() != null) {
                    sendSms(user.getPhone(), content);
                }
            }
            case ALL -> {
                sendEmail(user.getEmail(), "Notification", null, Map.of("content", content));
                if (user.getPhone() != null) {
                    sendSms(user.getPhone(), content);
                }
            }
            default -> log.warn("Unsupported notification channel: {}", channel);
        }
    }

    /**
     * Send notification to multiple users
     */
    @Async
    public void sendBulkNotification(List<UUID> userIds, Channel channel, String content) {
        log.info("Sending bulk notification to {} users, channel: {}", userIds.size(), channel);

        for (UUID userId : userIds) {
            try {
                sendNotification(userId, channel, content);
            } catch (Exception e) {
                log.error("Failed to send notification to user: {}", userId, e);
            }
        }
    }

    /**
     * Send appointment confirmation notification
     */
    @Async
    public void sendAppointmentConfirmation(String email, String phone, String clientName,
                                           String dateTime, String lawyerName) {
        log.info("Sending appointment confirmation to: {}", email);

        String emailSubject = "Xác nhận lịch hẹn - Văn phòng Luật";
        String emailBody = String.format("""
            Xin chào %s,
            
            Lịch hẹn của bạn đã được xác nhận:
            
            Thời gian: %s
            Luật sư: %s
            
            Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.
            
            Trân trọng,
            Văn phòng Luật
            """, clientName, dateTime, lawyerName);

        emailService.sendEmail(email, emailSubject, emailBody);

        if (phone != null) {
            String smsMessage = String.format(
                "Xac nhan lich hen: %s, Luat su: %s. Vui long lien he neu can thay doi.",
                dateTime, lawyerName
            );
            smsService.sendSms(phone, smsMessage);
        }
    }

    /**
     * Send appointment reminder notification
     */
    @Async
    public void sendAppointmentReminder(String email, String phone, String clientName,
                                       String dateTime, String lawyerName) {
        log.info("Sending appointment reminder to: {}", email);

        String emailSubject = "Nhắc nhở lịch hẹn - Văn phòng Luật";
        String emailBody = String.format("""
            Xin chào %s,
            
            Đây là lời nhắc nhở về lịch hẹn của bạn:
            
            Thời gian: %s
            Luật sư: %s
            
            Vui lòng đến đúng giờ hoặc liên hệ với chúng tôi nếu cần thay đổi.
            
            Trân trọng,
            Văn phòng Luật
            """, clientName, dateTime, lawyerName);

        emailService.sendEmail(email, emailSubject, emailBody);

        if (phone != null) {
            String smsMessage = String.format(
                "Nhac nho: %s, Gap %s. Den dung gio hoac lien he 0969 967 389 - 0975 967 364 de doi lich.",
                dateTime, lawyerName
            );
            smsService.sendSms(phone, smsMessage);
        }
    }

    /**
     * Send lead notification
     */
    @Async
    public void sendLeadNotification(UUID assignedToUserId, String leadName, String message) {
        log.info("Sending lead notification to user: {}", assignedToUserId);

        User user = userRepository.findById(assignedToUserId)
            .orElse(null);

        if (user != null && user.getIsActive()) {
            String content = String.format("New lead: %s. Message: %s", leadName, message);
            if (user.getEmail() != null) {
                emailService.sendEmail(
                    user.getEmail(),
                    "New Lead Assigned",
                    content
                );
            }
        }
    }

    private String renderTemplate(String template, Map<String, Object> data) {
        if (template == null || data == null || data.isEmpty()) {
            return template;
        }

        String result = template;
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}",
                entry.getValue() != null ? entry.getValue().toString() : "");
        }
        return result;
    }
}
