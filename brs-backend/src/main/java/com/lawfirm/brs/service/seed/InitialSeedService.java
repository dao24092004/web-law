package com.lawfirm.brs.service.seed;

import com.lawfirm.brs.config.AppProperties;
import com.lawfirm.brs.constants.Roles;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawfirm.brs.entity.SeedRun;
import com.lawfirm.brs.entity.SettingsNamespace;
import com.lawfirm.brs.entity.SystemSetting;
import com.lawfirm.brs.entity.User;
import com.lawfirm.brs.repository.SeedRunRepository;
import com.lawfirm.brs.repository.ServiceEntityRepository;
import com.lawfirm.brs.repository.SystemSettingRepository;
import com.lawfirm.brs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class InitialSeedService {

    private static final long ADVISORY_LOCK_KEY = 4_824_915_731L;

    private final AppProperties appProperties;
    private final JdbcTemplate jdbcTemplate;
    private final SeedRunRepository seedRunRepository;
    private final UserRepository userRepository;
    private final ServiceEntityRepository serviceRepository;
    private final PasswordEncoder passwordEncoder;
    private final SystemSettingRepository systemSettingRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void runOnce() {
        AppProperties.Seed seed = appProperties.getSeed();
        if (!seed.isEnabled()) {
            log.info("Initial seed disabled");
            return;
        }

        jdbcTemplate.queryForObject("SELECT pg_advisory_xact_lock(?)", Long.class, ADVISORY_LOCK_KEY);

        SeedRun existing = seedRunRepository.findById(seed.getKey()).orElse(null);
        if (existing != null && existing.getStatus() == SeedRun.SeedRunStatus.COMPLETED) {
            log.info("Initial seed already completed: key={}", seed.getKey());
            return;
        }

        SeedRun run = existing == null
            ? SeedRun.builder().seedKey(seed.getKey()).build()
            : existing;
        run.setStatus(SeedRun.SeedRunStatus.RUNNING);
        run.setStartedAt(Instant.now());
        run.setCompletedAt(null);
        run.setErrorMessage(null);
        seedRunRepository.saveAndFlush(run);

        try {
            if (hasExistingApplicationData() && seed.getMode() != AppProperties.Seed.Mode.FORCE_EXISTING) {
                seedPublicSite();
                complete(run, "Existing application data detected; public site content seeded without legacy data changes");
                return;
            }

            seedAdmin(seed);
            seedPublicSite();
            complete(run, "Initial seed completed");
        } catch (RuntimeException exception) {
            run.setStatus(SeedRun.SeedRunStatus.FAILED);
            run.setErrorMessage(safeErrorMessage(exception));
            seedRunRepository.saveAndFlush(run);
            throw exception;
        }
    }

    private boolean hasExistingApplicationData() {
        return userRepository.count() > 0 || serviceRepository.count() > 0;
    }

    private void seedAdmin(AppProperties.Seed seed) {
        if (seed.getAdminEmail() == null || seed.getAdminEmail().isBlank()
            || seed.getAdminPassword() == null || seed.getAdminPassword().isBlank()) {
            throw new IllegalStateException("Seed admin credentials are required when initial seed is enabled");
        }

        if (userRepository.existsByEmail(seed.getAdminEmail())) {
            return;
        }

        User admin = User.builder()
            .email(seed.getAdminEmail().trim().toLowerCase())
            .passwordHash(passwordEncoder.encode(seed.getAdminPassword()))
            .fullName(seed.getAdminName())
            .phone(seed.getAdminPhone())
            .role(Roles.SUPER_ADMIN)
            .isActive(true)
            .build();
        userRepository.save(admin);
    }

    private void seedPublicSite() {
        if (systemSettingRepository.findByNamespace(SettingsNamespace.PUBLIC_SITE).isPresent()) {
            return;
        }

        SystemSetting setting = new SystemSetting();
        setting.setNamespace(SettingsNamespace.PUBLIC_SITE);
        setting.setValueJson(parseJson(publicSiteJson()));
        systemSettingRepository.save(setting);
    }

    private JsonNode parseJson(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to parse initial public site content", exception);
        }
    }

    private String publicSiteJson() {
        try {
            return objectMapper.writeValueAsString(java.util.Map.of(
                "vi", java.util.Map.of(
                    "contact", java.util.Map.of("hotline", "0969 967 389 - 0975 967 364", "email", "lienhe@icrclaw.com", "address", "Đường 381, Xã Nguyễn Văn Linh, Tỉnh Hưng Yên", "workingHours", "T2 - T7: 8:00 - 18:00", "zaloUrl", "https://zalo.me/19001234"),
                    "socialLinks", java.util.Map.of("facebook", "https://facebook.com/vpluat", "linkedin", "https://linkedin.com/company/vpluat", "youtube", "https://youtube.com/@vpluat", "instagram", "https://instagram.com/vpluat"),
                    "legalLinks", java.util.Map.of("privacyPolicy", "/privacy-policy", "termsOfUse", "/terms-of-use"),
                    "offices", java.util.List.of(java.util.Map.of("city", "Hà Nội", "address", "Đường 381, Xã Nguyễn Văn Linh, Tỉnh Hưng Yên", "phone", "0969 967 389 - 0975 967 364", "email", "lienhe@icrclaw.com", "workingHours", "T2 - T7: 8:00 - 18:00", "isMain", true)),
                    "heroStats", java.util.Map.of("successfulCases", 200, "successRate", 98, "yearsExperience", 10, "clients", 200),
                    "processSteps", java.util.List.of(java.util.Map.of("step", 1, "title", "Tiếp nhận & Tư vấn", "description", "Lắng nghe nhu cầu, phân tích vấn đề và tư vấn hướng giải quyết tối ưu."), java.util.Map.of("step", 2, "title", "Ký hợp đồng dịch vụ", "description", "Thống nhất phạm vi công việc, phí dịch vụ và thời gian thực hiện."), java.util.Map.of("step", 3, "title", "Triển khai & Cập nhật", "description", "Đội ngũ luật sư thực hiện công việc và cập nhật tiến độ thường xuyên."), java.util.Map.of("step", 4, "title", "Bàn giao & Hỗ trợ", "description", "Bàn giao kết quả và hỗ trợ sau dịch vụ.")),
                    "faqs", java.util.List.of(java.util.Map.of("id", "1", "question", "Tôi cần chuẩn bị gì khi tư vấn lần đầu?", "answer", "Bạn nên mang theo các giấy tờ liên quan đến vụ việc và ghi lại diễn biến theo thời gian."), java.util.Map.of("id", "2", "question", "Phí tư vấn pháp lý được tính thế nào?", "answer", "Buổi tư vấn đầu tiên miễn phí; các dịch vụ tiếp theo được báo giá minh bạch trước khi thực hiện."))
                ),
                "en", java.util.Map.of(
                    "contact", java.util.Map.of("hotline", "0969 967 389 - 0975 967 364", "email", "lienhe@icrclaw.com", "address", "381 Street, Nguyen Van Linh Commune, Hung Yen Province", "workingHours", "Mon - Sat: 8:00 - 18:00", "zaloUrl", "https://zalo.me/19001234"),
                    "socialLinks", java.util.Map.of("facebook", "https://facebook.com/vpluat", "linkedin", "https://linkedin.com/company/vpluat", "youtube", "https://youtube.com/@vpluat", "instagram", "https://instagram.com/vpluat"),
                    "legalLinks", java.util.Map.of("privacyPolicy", "/privacy-policy", "termsOfUse", "/terms-of-use"),
                    "offices", java.util.List.of(java.util.Map.of("city", "Hanoi", "address", "381 Street, Nguyen Van Linh Commune, Hung Yen Province", "phone", "0969 967 389 - 0975 967 364", "email", "lienhe@icrclaw.com", "workingHours", "Mon - Sat: 8:00 - 18:00", "isMain", true)),
                    "heroStats", java.util.Map.of("successfulCases", 200, "successRate", 98, "yearsExperience", 10, "clients", 200),
                    "processSteps", java.util.List.of(java.util.Map.of("step", 1, "title", "Intake and consultation", "description", "We listen to your needs, analyze the matter, and recommend the best solution."), java.util.Map.of("step", 2, "title", "Sign the service agreement", "description", "We agree on the scope of work, fees, and timeline."), java.util.Map.of("step", 3, "title", "Execution and updates", "description", "Our lawyers handle the work and provide regular progress updates."), java.util.Map.of("step", 4, "title", "Handover and support", "description", "We deliver the results and provide post-service support.")),
                    "faqs", java.util.List.of(java.util.Map.of("id", "1", "question", "What should I prepare for my first consultation?", "answer", "Bring documents related to your matter and a timeline of the relevant events."), java.util.Map.of("id", "2", "question", "How are legal consultation fees calculated?", "answer", "The first consultation is free; further services are quoted transparently before work begins."))
                )
            ));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize initial public site content", exception);
        }
    }

    private void complete(SeedRun run, String message) {
        run.setStatus(SeedRun.SeedRunStatus.COMPLETED);
        run.setCompletedAt(Instant.now());
        run.setErrorMessage(null);
        seedRunRepository.saveAndFlush(run);
        log.info("{}: key={}", message, run.getSeedKey());
    }

    private String safeErrorMessage(RuntimeException exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            return exception.getClass().getSimpleName();
        }
        return message.length() > 500 ? message.substring(0, 500) : message;
    }
}
