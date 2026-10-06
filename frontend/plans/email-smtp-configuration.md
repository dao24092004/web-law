# SMTP Email Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cấu hình SMTP server để gửi email thực sự thay vì log warn như hiện tại.

**Architecture:** Spring Boot sử dụng `spring-boot-starter-mail` với JavaMailSender. Cấu hình qua environment variables để hỗ trợ nhiều provider (Gmail, SendGrid, SMTP riêng). Template email sử dụng Thymeleaf cho email có HTML đẹp hơn.

**Tech Stack:** Spring Boot Mail, Thymeleaf, HTML email templates, Environment-based configuration

---

## File Structure

```
brs-backend/
├── src/main/resources/
│   ├── application.yml          # Thêm cấu hình mail server
│   ├── application-dev.yml      # Cấu hình dev (mock/test SMTP)
│   ├── application-prod.yml     # Cấu hình production
│   └── mail-templates/
│       ├── appointment-confirmation.html
│       ├── appointment-reminder.html
│       └── lead-assigned.html
├── src/main/java/com/lawfirm/brs/
│   ├── config/
│   │   └── AppProperties.java   # Thêm property class Mail
│   └── service/notification/
│       ├── EmailService.java    # Nâng cấp hỗ trợ HTML template
│       └── EmailTemplateService.java  # Tạo mới - render template
└── .env                         # Thêm SMTP credentials
```

---

## Tasks

### Task 1: Thêm Mail property vào AppProperties

**Files:**
- Modify: `brs-backend/src/main/java/com/lawfirm/brs/config/AppProperties.java:17-26`
- Modify: `brs-backend/src/main/resources/application.yml:1-181`

- [ ] **Step 1: Thêm Mail inner class vào AppProperties.java**

Mở `AppProperties.java` và thêm vào sau `Cloudinary` class:

```java
@Getter
@Setter
public static class Mail {
    private boolean enabled = false;
    private String host;
    private int port = 587;
    private String username;
    private String password;
    private String fromAddress = "noreply@lawfirm.vn";
    private String fromName = "ICRC Law";
    private boolean startTls = true;
    private String propertiesMail = "true";
}
```

Và thêm field vào AppProperties:

```java
private Mail mail = new Mail();
```

- [ ] **Step 2: Commit**

```bash
git add brs-backend/src/main/java/com/lawfirm/brs/config/AppProperties.java
git commit -m "feat: add Mail property class to AppProperties"
```

---

### Task 2: Cấu hình Spring Mail trong application.yml

**Files:**
- Modify: `brs-backend/src/main/resources/application.yml:141-142` (thêm sau phần OpenAI)

- [ ] **Step 1: Thêm cấu hình mail vào application.yml**

Thêm vào cuối file, trước phần `# Logging Configuration`:

```yaml
# ============================================================
# Email / SMTP Configuration
# ============================================================
spring:
  mail:
    host: ${MAIL_HOST:smtp.gmail.com}
    port: ${MAIL_PORT:587}
    username: ${MAIL_USERNAME:}
    password: ${MAIL_PASSWORD:}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: ${MAIL_STARTTLS:true}
          connectiontimeout: 5000
          timeout: 5000
          writetimeout: 5000
    from: ${MAIL_FROM_ADDRESS:noreply@lawfirm.vn}

app:
  mail:
    enabled: ${MAIL_ENABLED:false}
    from-address: ${MAIL_FROM_ADDRESS:noreply@lawfirm.vn}
    from-name: ${MAIL_FROM_NAME:ICRC Law}
```

- [ ] **Step 2: Commit**

```bash
git add brs-backend/src/main/resources/application.yml
git commit -m "feat: configure Spring Mail SMTP in application.yml"
```

---

### Task 3: Thêm SMTP credentials vào .env

**Files:**
- Modify: `brs-backend/.env:47-52` (thêm vào cuối file)

- [ ] **Step 1: Thêm mail config vào .env**

Thêm vào cuối file:

```bash
# ============================================================
# SMTP / Email Configuration
# ============================================================
# Enable email sending (set to true in production)
MAIL_ENABLED=false

# SMTP Server Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Mail sender identity
MAIL_FROM_ADDRESS=noreply@lawfirm.vn
MAIL_FROM_NAME=ICRC Law
MAIL_STARTTLS=true
```

- [ ] **Step 2: Commit**

```bash
git add brs-backend/.env
git commit -m "feat: add SMTP credentials to .env"
```

---

### Task 4: Tạo EmailTemplateService với Thymeleaf

**Files:**
- Create: `brs-backend/src/main/java/com/lawfirm/brs/service/notification/EmailTemplateService.java`
- Create: `brs-backend/src/main/resources/mail-templates/appointment-confirmation.html`
- Create: `brs-backend/src/main/resources/mail-templates/appointment-reminder.html`
- Create: `brs-backend/src/main/resources/mail-templates/lead-assigned.html`

- [ ] **Step 1: Thêm Thymeleaf dependency vào pom.xml**

Mở `brs-backend/pom.xml`, tìm phần dependencies và thêm:

```xml
<!-- Thymeleaf for email templates -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

- [ ] **Step 2: Tạo EmailTemplateService.java**

```java
package com.lawfirm.brs.service.notification;

import com.lawfirm.brs.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.util.Map;

/**
 * Email template rendering service using Thymeleaf.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailTemplateService {

    private final AppProperties appProperties;
    private final TemplateEngine templateEngine;

    public String renderAppointmentConfirmation(Map<String, Object> data) {
        Context context = new Context();
        context.setVariables(data);
        return templateEngine.process("mail-templates/appointment-confirmation", context);
    }

    public String renderAppointmentReminder(Map<String, Object> data) {
        Context context = new Context();
        context.setVariables(data);
        return templateEngine.process("mail-templates/appointment-reminder", context);
    }

    public String renderLeadAssigned(Map<String, Object> data) {
        Context context = new Context();
        context.setVariables(data);
        return templateEngine.process("mail-templates/lead-assigned", context);
    }

    public String renderTemplate(String templateName, Map<String, Object> data) {
        Context context = new Context();
        if (data != null) {
            context.setVariables(data);
        }
        return templateEngine.process(templateName, context);
    }
}
```

- [ ] **Step 3: Cấu hình Thymeleaf bean**

Thêm vào `brs-backend/src/main/java/com/lawfirm/brs/config/` (tạo file mới):

```java
package com.lawfirm.brs.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

@Configuration
public class ThymeleafConfig {

    @Bean
    public ClassLoaderTemplateResolver emailTemplateResolver() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCheckExistence(true);
        resolver.setCacheable(false); // Disable cache for development
        return resolver;
    }

    @Bean
    public SpringTemplateEngine templateEngine() {
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(emailTemplateResolver());
        return engine;
    }
}
```

- [ ] **Step 4: Tạo appointment-confirmation.html**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận lịch hẹn</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #666; font-weight: 500; }
        .value { color: #1e3a5f; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .cta-button { display: inline-block; background: #2c5282; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>✉️ Xác nhận lịch hẹn</h1>
    </div>
    <div class="content">
        <p>Xin chào <strong th:text="${clientName}">Khách hàng</strong>,</p>
        <p>Lịch hẹn của bạn đã được xác nhận thành công. Vui lòng đến đúng giờ hoặc liên hệ với chúng tôi nếu cần thay đổi.</p>

        <div class="info-box">
            <div class="info-row">
                <span class="label">📅 Ngày hẹn</span>
                <span class="value" th:text="${dateTime}">--</span>
            </div>
            <div class="info-row">
                <span class="label">👨‍💼 Luật sư</span>
                <span class="value" th:text="${lawyerName}">--</span>
            </div>
            <div class="info-row" th:if="${serviceName}">
                <span class="label">📋 Dịch vụ</span>
                <span class="value" th:text="${serviceName}">--</span>
            </div>
            <div class="info-row" th:if="${meetingType}">
                <span class="label">🏢 Hình thức</span>
                <span class="value" th:text="${meetingType}">--</span>
            </div>
        </div>

        <p>Nếu bạn cần hủy hoặc đổi lịch, vui lòng liên hệ với chúng tôi ít nhất 24 giờ trước giờ hẹn.</p>

        <p style="margin-top: 30px;">Trân trọng,<br><strong>ICRC Law</strong></p>
    </div>
    <div class="footer">
        <p>Email này được gửi tự động từ ICRC Law. Vui lòng không trả lời email này.</p>
        <p>Hotline: 1900-xxxx | Email: contact@lawfirm.vn</p>
    </div>
</body>
</html>
```

- [ ] **Step 5: Tạo appointment-reminder.html**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nhắc nhở lịch hẹn</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .reminder-box { background: #fff5f5; border: 2px solid #e53e3e; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .big-time { font-size: 32px; font-weight: bold; color: #c53030; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; }
        .value { color: #1e3a5f; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⏰ Nhắc nhở lịch hẹn</h1>
        <p>Đến giờ hẹn rồi!</p>
    </div>
    <div class="content">
        <p>Xin chào <strong th:text="${clientName}">Khách hàng</strong>,</p>

        <div class="reminder-box">
            <p style="margin: 0 0 10px 0;">Lịch hẹn của bạn diễn ra vào lúc</p>
            <p class="big-time" th:text="${dateTime}">--</p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px;">
            <div class="info-row">
                <span class="label">👨‍💼 Luật sư</span>
                <span class="value" th:text="${lawyerName}">--</span>
            </div>
            <div class="info-row" th:if="${meetingType}">
                <span class="label">🏢 Hình thức</span>
                <span class="value" th:text="${meetingType}">--</span>
            </div>
        </div>

        <p style="margin-top: 20px;">Vui lòng đến đúng giờ. Nếu bạn cần đổi lịch, hãy liên hệ ngay với chúng tôi.</p>
    </div>
    <div class="footer">
        <p>ICRC Law | Hotline: 1900-xxxx</p>
    </div>
</body>
</html>
```

- [ ] **Step 6: Tạo lead-assigned.html**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lead mới được phân công</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #38a169 0%, #276749 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; font-size: 14px; }
        .value { color: #1e3a5f; font-weight: 600; font-size: 16px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .cta-button { display: inline-block; background: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Lead mới được phân công</h1>
    </div>
    <div class="content">
        <p>Xin chào <strong th:text="${userName}">Luật sư</strong>,</p>
        <p>Một lead mới vừa được phân công cho bạn:</p>

        <div class="info-box">
            <div class="info-row">
                <span class="label">Tên khách hàng</span>
                <span class="value" th:text="${leadName}">--</span>
            </div>
            <div class="info-row" th:if="${leadPhone}">
                <span class="label">Số điện thoại</span>
                <span class="value" th:text="${leadPhone}">--</span>
            </div>
            <div class="info-row" th:if="${leadEmail}">
                <span class="label">Email</span>
                <span class="value" th:text="${leadEmail}">--</span>
            </div>
            <div class="info-row" th:if="${leadService}">
                <span class="label">Dịch vụ quan tâm</span>
                <span class="value" th:text="${leadService}">--</span>
            </div>
            <div class="info-row" th:if="${leadMessage}">
                <span class="label">Tin nhắn</span>
                <span class="value" th:text="${leadMessage}">--</span>
            </div>
        </div>

        <p>Vui lòng liên hệ với khách hàng trong thời gian sớm nhất.</p>
    </div>
    <div class="footer">
        <p>ICRC Law CRM</p>
    </div>
</body>
</html>
```

- [ ] **Step 7: Commit**

```bash
git add brs-backend/pom.xml
git add brs-backend/src/main/java/com/lawfirm/brs/config/ThymeleafConfig.java
git add brs-backend/src/main/java/com/lawfirm/brs/service/notification/EmailTemplateService.java
git add brs-backend/src/main/resources/templates/mail-templates/*.html
git commit -m "feat: add Thymeleaf email templates and EmailTemplateService"
```

---

### Task 5: Nâng cấp EmailService để hỗ trợ HTML và template

**Files:**
- Modify: `brs-backend/src/main/java/com/lawfirm/brs/service/notification/EmailService.java`

- [ ] **Step 1: Cập nhật EmailService.java**

Thay thế toàn bộ nội dung:

```java
package com.lawfirm.brs.service.notification;

import com.lawfirm.brs.config.AppProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

/**
 * Email service for sending notifications with HTML support.
 */
@Service
@Slf4j
public class EmailService {

    private final Optional<JavaMailSender> mailSender;
    private final AppProperties appProperties;
    private final EmailTemplateService templateService;

    public EmailService(Optional<JavaMailSender> mailSender,
                        AppProperties appProperties,
                        EmailTemplateService templateService) {
        this.mailSender = mailSender;
        this.appProperties = appProperties;
        this.templateService = templateService;
    }

    /**
     * Send plain text email
     */
    @Async
    public void sendEmail(String to, String subject, String body) {
        sendEmail(to, subject, body, false);
    }

    /**
     * Send email with optional HTML support
     */
    @Async
    public void sendEmail(String to, String subject, String body, boolean isHtml) {
        if (!appProperties.getMail().isEnabled()) {
            log.warn("Email disabled. Would send to: {}, subject: {}", to, subject);
            return;
        }

        if (mailSender.isEmpty()) {
            log.error("JavaMailSender not configured. Cannot send email to: {}", to);
            return;
        }

        try {
            MimeMessage message = mailSender.get().createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, isHtml);

            // Set from address
            String fromAddress = appProperties.getMail().getFromAddress();
            String fromName = appProperties.getMail().getFromName();
            helper.setFrom(fromAddress, fromName);

            mailSender.get().send(message);
            log.info("Email sent to: {} with subject: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to create email message for: {}", to, e);
        } catch (Exception e) {
            log.error("Failed to send email to: {}", to, e);
        }
    }

    /**
     * Send email using a Thymeleaf template
     */
    @Async
    public void sendTemplateEmail(String to, String subject, String templateName, Map<String, Object> data) {
        try {
            String htmlContent = templateService.renderTemplate(templateName, data);
            sendEmail(to, subject, htmlContent, true);
        } catch (Exception e) {
            log.error("Failed to send template email to: {}", to, e);
            // Fallback to plain text
            sendEmail(to, subject, "Email content unavailable");
        }
    }

    @Async
    public void sendAppointmentConfirmation(String to, String clientName, String dateTime, String lawyerName) {
        String subject = "Xác nhận lịch hẹn - ICRC Law";
        Map<String, Object> data = Map.of(
            "clientName", clientName,
            "dateTime", dateTime,
            "lawyerName", lawyerName
        );
        sendTemplateEmail(to, subject, "mail-templates/appointment-confirmation", data);
    }

    @Async
    public void sendAppointmentReminder(String to, String clientName, String dateTime, String lawyerName) {
        String subject = "Nhắc nhở lịch hẹn - ICRC Law";
        Map<String, Object> data = Map.of(
            "clientName", clientName,
            "dateTime", dateTime,
            "lawyerName", lawyerName
        );
        sendTemplateEmail(to, subject, "mail-templates/appointment-reminder", data);
    }

    @Async
    public void sendLeadAssigned(String to, String userName, String leadName,
                                  String leadPhone, String leadEmail, String leadService, String leadMessage) {
        String subject = "Lead mới được phân công - ICRC Law";
        Map<String, Object> data = Map.of(
            "userName", userName,
            "leadName", leadName,
            "leadPhone", leadPhone != null ? leadPhone : "",
            "leadEmail", leadEmail != null ? leadEmail : "",
            "leadService", leadService != null ? leadService : "",
            "leadMessage", leadMessage != null ? leadMessage : ""
        );
        sendTemplateEmail(to, subject, "mail-templates/lead-assigned", data);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add brs-backend/src/main/java/com/lawfirm/brs/service/notification/EmailService.java
git commit -m "feat: upgrade EmailService with HTML template support"
```

---

### Task 6: Tạo Admin API endpoint để test email

**Files:**
- Create: `brs-backend/src/main/java/com/lawfirm/brs/controller/admin/EmailTestController.java`

- [ ] **Step 1: Tạo EmailTestController.java**

```java
package com.lawfirm.brs.controller.admin;

import com.lawfirm.brs.config.AppProperties;
import com.lawfirm.brs.service.notification.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin controller for testing email configuration.
 * Only accessible by ADMIN role.
 */
@RestController
@RequestMapping("/api/admin/email")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class EmailTestController {

    private final EmailService emailService;
    private final AppProperties appProperties;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getEmailStatus() {
        return ResponseEntity.ok(Map.of(
            "enabled", appProperties.getMail().isEnabled(),
            "host", appProperties.getMail().getHost(),
            "port", appProperties.getMail().getPort(),
            "username", appProperties.getMail().getUsername() != null ?
                        "***" + appProperties.getMail().getUsername().substring(
                            Math.max(0, appProperties.getMail().getUsername().length() - 4)) : null
        ));
    }

    @PostMapping("/test")
    public ResponseEntity<Map<String, String>> sendTestEmail(@RequestBody Map<String, String> request) {
        String to = request.get("to");
        if (to == null || to.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email 'to' is required"));
        }

        try {
            emailService.sendEmail(
                to,
                "Test Email - ICRC Law",
                """
                    Đây là email test từ ICRC Law.

                    Nếu bạn nhận được email này, cấu hình SMTP đã hoạt động!

                    Trân trọng,
                    ICRC Law
                    """
            );
            return ResponseEntity.ok(Map.of("message", "Test email sent to: " + to));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to send email: " + e.getMessage()));
        }
    }

    @PostMapping("/test/appointment-confirmation")
    public ResponseEntity<Map<String, String>> sendAppointmentTest(@RequestBody Map<String, String> request) {
        String to = request.get("to");
        if (to == null || to.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email 'to' is required"));
        }

        emailService.sendAppointmentConfirmation(
            to,
            "Test Khách hàng",
            "25/06/2026 10:00",
            "Luật sư Nguyễn Văn A"
        );
        return ResponseEntity.ok(Map.of("message", "Appointment confirmation email sent to: " + to));
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add brs-backend/src/main/java/com/lawfirm/brs/controller/admin/EmailTestController.java
git commit -m "feat: add admin API endpoint to test email configuration"
```

---

### Task 7: Tạo migration database cho email settings

**Files:**
- Create: `brs-backend/src/main/resources/db/migration/V8__email_settings.sql`

- [ ] **Step 1: Tạo migration V8**

```sql
-- Email configuration settings table
CREATE TABLE IF NOT EXISTS email_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO email_settings (key, value, description) VALUES
    ('smtp_host', 'smtp.gmail.com', 'SMTP server hostname'),
    ('smtp_port', '587', 'SMTP server port'),
    ('smtp_username', '', 'SMTP username'),
    ('smtp_password_encrypted', '', 'Encrypted SMTP password'),
    ('mail_from_address', 'noreply@lawfirm.vn', 'Default from email address'),
    ('mail_from_name', 'ICRC Law', 'Default from name'),
    ('email_enabled', 'false', 'Enable/disable email sending');

-- Email log table for audit trail
CREATE TABLE IF NOT EXISTS email_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    template_name VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_log_status ON email_log(status);
CREATE INDEX idx_email_log_recipient ON email_log(recipient);
CREATE INDEX idx_email_log_created_at ON email_log(created_at);
```

- [ ] **Step 2: Commit**

```bash
git add brs-backend/src/main/resources/db/migration/V8__email_settings.sql
git commit -m "feat: add V8 migration for email settings and audit log"
```

---

### Task 8: Cập nhật docker-compose.yml cho mailhog (dev)

**Files:**
- Modify: `brs-backend/docker/docker-compose.yml`

- [ ] **Step 1: Thêm MailHog service vào docker-compose.yml**

Thêm vào cuối file docker-compose.yml:

```yaml
  mailhog:
    image: mailhog/mailhog:latest
    container_name: brs-mailhog
    ports:
      - "1025:1025"  # SMTP server
      - "8025:8025"  # Web UI
    networks:
      - brs-network
```

- [ ] **Step 2: Thêm cấu hình dev trong application-dev.yml**

Tạo hoặc cập nhật `brs-backend/src/main/resources/application-dev.yml`:

```yaml
spring:
  mail:
    host: localhost
    port: 1025
    username: ""
    password: ""

app:
  mail:
    enabled: true
    from-address: noreply@lawfirm.vn
    from-name: ICRC Law (Dev)
```

- [ ] **Step 3: Commit**

```bash
git add brs-backend/docker/docker-compose.yml
git add brs-backend/src/main/resources/application-dev.yml
git commit -m "feat: add MailHog for local email testing in development"
```

---

## Summary

| Task | Mô tả | Files |
|------|--------|-------|
| 1 | Thêm Mail property class | `AppProperties.java` |
| 2 | Cấu hình Spring Mail | `application.yml` |
| 3 | Thêm credentials vào .env | `.env` |
| 4 | Tạo EmailTemplateService + HTML templates | New service + 3 templates |
| 5 | Nâng cấp EmailService | `EmailService.java` |
| 6 | Admin API test email | New controller |
| 7 | Database migration | `V8__email_settings.sql` |
| 8 | Docker MailHog | `docker-compose.yml`, `application-dev.yml` |

## Hướng dẫn cấu hình Gmail SMTP

1. Bật 2-Factor Authentication trên Google Account
2. Vào https://myaccount.google.com/apppasswords
3. Tạo App Password mới (16 ký tự)
4. Cập nhật `.env`:
```bash
MAIL_ENABLED=true
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx  # App Password đã tạo
```

## Testing

1. Restart backend: `./mvnw spring-boot:run`
2. Test với Postman: `POST /api/admin/email/test` với body `{"to": "test@example.com"}`
3. Hoặc mở MailHog UI: http://localhost:8025
