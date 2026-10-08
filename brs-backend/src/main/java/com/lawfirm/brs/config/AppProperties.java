package com.lawfirm.brs.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Application configuration properties.
 */
@Configuration
@ConfigurationProperties(prefix = "app")
@Getter
@Setter
public class AppProperties {

    private Jwt jwt = new Jwt();
    private Cors cors = new Cors();
    private RateLimit rateLimit = new RateLimit();
    private Cache cache = new Cache();
    private Upload upload = new Upload();
    private Mail mail = new Mail();
    private Sms sms = new Sms();
    private Seed seed = new Seed();

    @Getter
    @Setter
    public static class Seed {
        private boolean enabled = false;
        /** Seeds ICRC company profile (contact info, services, team) once at startup. */
        private boolean profileEnabled = true;
        private String key = "initial-content-v1";
        private Mode mode = Mode.IF_EMPTY;
        private String adminEmail;
        private String adminPassword;
        private String adminName = "Quan tri vien";
        private String adminPhone;

        public enum Mode {
            IF_EMPTY,
            FORCE_EXISTING
        }
    }

    @Getter
    @Setter
    public static class Jwt {
        private String privateKeyPath;
        private String publicKeyPath;
        private String accessTokenExpiry = "15m";
        private String refreshTokenExpiry = "7d";
        private String issuer = "brs-lawfirm";
    }

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins;
        private List<String> allowedMethods = List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
        private List<String> allowedHeaders = List.of("*");
        private boolean allowCredentials = true;
        private int maxAge = 3600;
    }

    @Getter
    @Setter
    public static class RateLimit {
        private int auth = 5;
        private int booking = 3;
        private int lead = 5;
        private int search = 60;
        private int chatbotPerSession = 30;
    }

    @Getter
    @Setter
    public static class Cache {
        private int services = 5;
        private int lawyers = 5;
        private int faqs = 10;
        private int posts = 2;
        private int search = 2;
    }

    @Getter
    @Setter
    public static class Upload {
        private String baseDir = "/app/uploads";
        private String maxFileSize = "10MB";
        private String maxRequestSize = "50MB";
        private List<String> allowedExtensions = List.of("jpg", "jpeg", "png", "gif", "pdf", "doc", "docx", "xls", "xlsx");
    }

    @Getter
    @Setter
    public static class Mail {
        private boolean enabled = false;
        private String host;
        private int port = 587;
        private String username;
        private String password;
        private String fromAddress = "noreply@icrclaw.com";
        private String fromName = "Van Phong Luat";
        private boolean startTls = true;
    }

    @Getter
    @Setter
    public static class Sms {
        private String provider;
        private String apiKey;
        private String apiSecret;
        private String fromNumber;
    }
}
