package com.lawfirm.brs.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lawfirm.brs.constants.Roles;
import com.lawfirm.brs.entity.LawyerProfile;
import com.lawfirm.brs.entity.SeedRun;
import com.lawfirm.brs.entity.ServiceEntity;
import com.lawfirm.brs.entity.SettingsNamespace;
import com.lawfirm.brs.entity.SystemSetting;
import com.lawfirm.brs.entity.User;
import com.lawfirm.brs.repository.LawyerProfileRepository;
import com.lawfirm.brs.repository.SeedRunRepository;
import com.lawfirm.brs.repository.ServiceEntityRepository;
import com.lawfirm.brs.repository.SystemSettingRepository;
import com.lawfirm.brs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.cache.CacheManager;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Seeds the real ICRC Law profile (contact info, practice areas, team) once at startup.
 * Guarded by a seed_runs marker so admin edits made afterwards are never overwritten.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(110)
public class IcrcProfileSeedRunner implements ApplicationRunner {

    static final String SEED_KEY = "icrc-profile-v1";
    private static final long ADVISORY_LOCK_KEY = 4_824_915_732L;

    private static final String ADDRESS_VI = "Đường 381, Xã Nguyễn Văn Linh, Tỉnh Hưng Yên";
    private static final String ADDRESS_EN = "381 Street, Nguyen Van Linh Commune, Hung Yen Province";
    private static final String HOTLINE = "0969 967 389";
    private static final String EMAIL = "icrclawhy@gmail.com";
    private static final String MAP_URL = "https://maps.app.goo.gl/XoRAtjkQM9PTaqLU7?g_st=iz";
    private static final String FACEBOOK = "https://web.facebook.com/dichvuhotrodoanhnghiephn";

    private final AppProperties appProperties;
    private final JdbcTemplate jdbcTemplate;
    private final PlatformTransactionManager transactionManager;
    private final SeedRunRepository seedRunRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final ServiceEntityRepository serviceRepository;
    private final LawyerProfileRepository lawyerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final CacheManager cacheManager;

    private record ServiceSeed(String slug, String name, String icon, boolean featured, String description) {}

    private record LawyerSeed(String slug, String name, String position, Integer years, String bio, List<String> serviceSlugs) {}

    private static final List<ServiceSeed> SERVICES = List.of(
        new ServiceSeed("lao-dong", "Lao động | Bảo hiểm", "users", true, "Tư vấn pháp luật lao động, hợp đồng lao động, bảo hiểm xã hội và bảo hiểm y tế."),
        new ServiceSeed("ho-tich-hon-nhan-gia-dinh", "Hộ tịch | Hôn nhân gia đình", "home", true, "Tư vấn và hỗ trợ thủ tục hộ tịch, kết hôn, ly hôn, nuôi con và tranh chấp gia đình."),
        new ServiceSeed("dan-su-thua-ke-dat-dai", "Dân sự | Thừa kế | Đất đai", "scale", true, "Tư vấn và đại diện giải quyết tranh chấp dân sự, thừa kế, đất đai và nhà ở."),
        new ServiceSeed("thue-ke-toan", "Thuế | Kế toán", "folder", false, "Tư vấn nghĩa vụ thuế, kế toán và tuân thủ pháp luật tài chính cho cá nhân, doanh nghiệp."),
        new ServiceSeed("dau-tu-kinh-doanh-giay-phep", "Đầu tư | Kinh doanh | Giấy phép", "briefcase", true, "Tư vấn đầu tư, thành lập doanh nghiệp, hoạt động kinh doanh và xin cấp giấy phép."),
        new ServiceSeed("giao-thong", "Giao thông", "flag", false, "Tư vấn pháp luật giao thông, xử phạt vi phạm hành chính và giải quyết tai nạn giao thông."),
        new ServiceSeed("quan-tri-doanh-nghiep", "Quản trị doanh nghiệp", "briefcase", false, "Tư vấn quản trị, điều hành doanh nghiệp, hợp đồng thương mại và tuân thủ pháp luật."),
        new ServiceSeed("hinh-su", "Hình sự", "gavel", false, "Tư vấn và bào chữa, bảo vệ quyền lợi hợp pháp trong các vụ việc hình sự."),
        new ServiceSeed("so-huu-tri-tue", "Sở hữu trí tuệ", "lightbulb", false, "Đăng ký và bảo hộ nhãn hiệu, bản quyền, sáng chế và các tài sản trí tuệ."),
        new ServiceSeed("linh-vuc-khac", "Các lĩnh vực pháp luật khác", "scale", false, "Tư vấn các vấn đề pháp lý khác theo yêu cầu của khách hàng.")
    );

    private static final List<LawyerSeed> LAWYERS = List.of(
        new LawyerSeed("nguyen-dinh-duy", "Nguyễn Đình Duy", "Giám đốc", null,
            "Giám đốc, người đại diện theo pháp luật của Công ty Luật TNHH ICRC.", List.of()),
        new LawyerSeed("dinh-phu-xuan-toan", "Đinh Phú Xuân Toàn", "Phó Giám đốc", null,
            "Phó Giám đốc Công ty Luật TNHH ICRC.", List.of()),
        new LawyerSeed("nguyen-thuy-hoang", "Nguyễn Thủy Hoàng", "Chánh văn phòng", 5,
            "Cử nhân luật, 5 năm kinh nghiệm về đất đai, doanh nghiệp.",
            List.of("dan-su-thua-ke-dat-dai", "quan-tri-doanh-nghiep")),
        new LawyerSeed("phan-van-thang", "Phan Văn Thắng", "Chuyên viên pháp lý", 5,
            "Cử nhân, 5 năm kinh nghiệm về đất đai, doanh nghiệp.",
            List.of("dan-su-thua-ke-dat-dai", "quan-tri-doanh-nghiep")),
        new LawyerSeed("pham-thi-huyen", "Phạm Thị Huyền", "Chuyên viên pháp lý", 5,
            "Cử nhân quản trị, 5 năm kinh nghiệm về quản trị doanh nghiệp.",
            List.of("quan-tri-doanh-nghiep")),
        new LawyerSeed("hoang-xuan-truong", "Hoàng Xuân Trường", "Chuyên viên pháp lý", 8,
            "Cử nhân Luật, 8 năm kinh nghiệm về hình sự, dân sự và tranh tụng.",
            List.of("hinh-su", "dan-su-thua-ke-dat-dai"))
    );

    @Override
    public void run(ApplicationArguments args) {
        if (!appProperties.getSeed().isProfileEnabled()) {
            log.info("ICRC profile seed disabled");
            return;
        }
        try {
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> seed());
        } catch (RuntimeException exception) {
            log.warn("ICRC profile seed failed but application will continue: {}", exception.getMessage());
        }
    }

    private void seed() {
        jdbcTemplate.queryForObject("SELECT pg_advisory_xact_lock(?)", Long.class, ADVISORY_LOCK_KEY);
        SeedRun existing = seedRunRepository.findById(SEED_KEY).orElse(null);
        if (existing != null && existing.getStatus() == SeedRun.SeedRunStatus.COMPLETED) {
            log.info("ICRC profile seed already completed: key={}", SEED_KEY);
            return;
        }

        SeedRun run = existing != null ? existing : SeedRun.builder().seedKey(SEED_KEY).build();
        run.setStatus(SeedRun.SeedRunStatus.RUNNING);
        run.setStartedAt(Instant.now());
        run.setCompletedAt(null);
        run.setErrorMessage(null);
        seedRunRepository.saveAndFlush(run);

        seedPublicSite();
        Map<String, ServiceEntity> services = seedServices();
        seedLawyers(services);

        run.setStatus(SeedRun.SeedRunStatus.COMPLETED);
        run.setCompletedAt(Instant.now());
        seedRunRepository.saveAndFlush(run);
        evictCaches();
        log.info("ICRC profile seed completed: key={}", SEED_KEY);
    }

    private void seedPublicSite() {
        SystemSetting setting = systemSettingRepository.findByNamespace(SettingsNamespace.PUBLIC_SITE)
            .orElseGet(() -> {
                SystemSetting created = new SystemSetting();
                created.setNamespace(SettingsNamespace.PUBLIC_SITE);
                created.setValueJson(objectMapper.createObjectNode());
                return created;
            });
        ObjectNode root = setting.getValueJson() != null && setting.getValueJson().isObject()
            ? ((ObjectNode) setting.getValueJson()).deepCopy()
            : objectMapper.createObjectNode();

        applyLocale(root, "vi", ADDRESS_VI, "Giờ hành chính: 8:00 - 17:00", "Hưng Yên");
        applyLocale(root, "en", ADDRESS_EN, "Office hours: 8:00 - 17:00", "Hung Yen");
        setting.setValueJson(root);
        systemSettingRepository.save(setting);
    }

    private void applyLocale(ObjectNode root, String locale, String address, String hours, String city) {
        ObjectNode content = child(root, locale);

        ObjectNode contact = child(content, "contact");
        contact.put("hotline", HOTLINE);
        contact.put("email", EMAIL);
        contact.put("address", address);
        contact.put("workingHours", hours);
        contact.put("mapUrl", MAP_URL);
        // zaloUrl is intentionally left untouched (no new value was provided).

        child(content, "socialLinks").put("facebook", FACEBOOK);

        ObjectNode office = objectMapper.createObjectNode();
        office.put("city", city);
        office.put("address", address);
        office.put("phone", HOTLINE);
        office.put("email", EMAIL);
        office.put("workingHours", hours);
        office.put("isMain", true);
        ArrayNode offices = objectMapper.createArrayNode();
        offices.add(office);
        content.set("offices", offices);

        ObjectNode company = child(content, "company");
        company.put("name", "CÔNG TY LUẬT TRÁCH NHIỆM HỮU HẠN ICRC");
        company.put("taxCode", "0110964173");
        company.put("type", "Công ty luật");
        company.put("issuedDate", "24/02/2025");
        company.put("status", "Đang hoạt động");
        company.put("legalRepresentative", "NGUYỄN ĐÌNH DUY");
        company.put("phone", "0976006099");
        company.put("registeredAddress", "Tổ 9, Thành phố Hà Nội, Việt Nam");
    }

    private ObjectNode child(ObjectNode parent, String field) {
        JsonNode current = parent.get(field);
        if (current != null && current.isObject()) {
            return (ObjectNode) current;
        }
        return parent.putObject(field);
    }

    private Map<String, ServiceEntity> seedServices() {
        Map<String, ServiceEntity> result = new LinkedHashMap<>();
        int order = 1;
        for (ServiceSeed seed : SERVICES) {
            ServiceEntity service = serviceRepository.findBySlug(seed.slug()).orElseGet(() ->
                ServiceEntity.builder().slug(seed.slug()).build());
            service.setName(seed.name());
            service.setIcon(seed.icon());
            service.setIsFeatured(seed.featured());
            service.setDisplayOrder(order++);
            service.setIsActive(true);
            service.setDeletedAt(null);
            service.setCategory(seed.slug());
            if (service.getDescription() == null || service.getDescription().isBlank()) {
                service.setDescription(seed.description());
            }
            result.put(seed.slug(), serviceRepository.save(service));
        }
        return result;
    }

    private void seedLawyers(Map<String, ServiceEntity> services) {
        for (LawyerSeed seed : LAWYERS) {
            List<UUID> serviceIds = new ArrayList<>();
            for (String slug : seed.serviceSlugs()) {
                serviceIds.add(services.get(slug).getId());
            }

            LawyerProfile profile = lawyerRepository.findBySlug(seed.slug()).orElse(null);
            if (profile == null) {
                profile = LawyerProfile.builder()
                    .slug(seed.slug())
                    .user(createLawyerUser(seed))
                    .languages(new String[] {"vi"})
                    .workingHours(Map.of())
                    .build();
            }
            profile.setNameVi(seed.name());
            profile.setNameEn(seed.name());
            profile.setPositionVi(seed.position());
            profile.setPositionEn(seed.position());
            profile.setBioVi(seed.bio());
            profile.setBioEn(seed.bio());
            profile.setExperienceYears(seed.years());
            profile.setIsActive(true);
            profile.setServiceIds(serviceIds);
            LawyerProfile saved = lawyerRepository.save(profile);

            for (UUID serviceId : serviceIds) {
                jdbcTemplate.update(
                    "INSERT INTO service_lawyers (service_id, lawyer_id, is_primary) VALUES (?, ?, FALSE) "
                        + "ON CONFLICT (service_id, lawyer_id) DO NOTHING",
                    serviceId, saved.getId());
            }
        }
    }

    /**
     * Public lawyer queries join on an active user, so each profile needs one.
     * Accounts get a random password (no login possible until an admin resets it)
     * and a placeholder email because no real addresses were provided.
     */
    private User createLawyerUser(LawyerSeed seed) {
        String email = seed.slug() + "@lawyers.icrc.invalid";
        return userRepository.findByEmail(email).orElseGet(() -> userRepository.save(User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
            .fullName(seed.name())
            .role(Roles.LAWYER)
            .isActive(true)
            .build()));
    }

    private void evictCaches() {
        for (String name : List.of("services", "lawyers")) {
            try {
                if (cacheManager.getCache(name) != null) {
                    cacheManager.getCache(name).clear();
                }
            } catch (RuntimeException exception) {
                log.warn("Could not clear cache '{}': {}", name, exception.getMessage());
            }
        }
    }
}
