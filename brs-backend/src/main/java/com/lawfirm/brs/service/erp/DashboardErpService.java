package com.lawfirm.brs.service.erp;

import com.lawfirm.brs.constants.LeadStatus;
import com.lawfirm.brs.dto.response.*;
import com.lawfirm.brs.entity.AuditLog;
import com.lawfirm.brs.repository.AppointmentRepository;
import com.lawfirm.brs.repository.AuditLogRepository;
import com.lawfirm.brs.repository.LeadRepository;
import com.lawfirm.brs.repository.UserRepository;
import com.lawfirm.brs.service.cache.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;

/**
 * Extended dashboard features: charts, activity feed, CSV export.
 * Sits alongside {@link com.lawfirm.brs.service.admin.DashboardService}
 * which provides the top-level stats endpoint.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardErpService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final int CACHE_TTL_SECONDS = 60;

    private final LeadRepository leadRepository;
    private final AppointmentRepository appointmentRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final CacheService cacheService;

    /**
     * List today's appointments with details for dashboard widget.
     */
    @Transactional(readOnly = true)
    public List<AppointmentSummaryResponse> todayAppointments() {
        ZoneId zone = ZoneId.systemDefault();
        Instant dayStart = LocalDate.now(zone).atStartOfDay(zone).toInstant();
        Instant dayEnd = dayStart.plus(1, ChronoUnit.DAYS);

        return appointmentRepository.findAll().stream()
            .filter(a -> a.getScheduledAt() != null
                && !a.getScheduledAt().isBefore(dayStart)
                && a.getScheduledAt().isBefore(dayEnd))
            .sorted(Comparator.comparing(a -> a.getScheduledAt() != null ? a.getScheduledAt() : Instant.MAX))
            .map(a -> AppointmentSummaryResponse.builder()
                .id(a.getId())
                .clientName(a.getClientName())
                .clientPhone(a.getClientPhone())
                .lawyerName(a.getLawyer() != null ? a.getLawyer().getNameVi() : null)
                .scheduledAt(a.getScheduledAt())
                .status(a.getStatus())
                .serviceType(a.getService() != null ? a.getService().getSlug() : null)
                .notes(a.getInternalNotes())
                .build())
            .collect(Collectors.toList());
    }

    /**
     * Visitors / leads time-series for the last N days.
     */
    @Transactional(readOnly = true)
    public List<TimeSeriesPoint> visitorSeries(int days) {
        Supplier<List<TimeSeriesPoint>> loader = () -> {
            LocalDate today = LocalDate.now();
            LocalDate from = today.minusDays(days - 1L);
            Instant fromInstant = from.atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant toInstant = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

            List<TimeSeriesPoint> points = new ArrayList<>();
            Map<LocalDate, Long> counts = new HashMap<>();
            leadRepository.findAll().stream()
                .filter(l -> !l.getCreatedAt().isBefore(fromInstant) && l.getCreatedAt().isBefore(toInstant))
                .forEach(l -> counts.merge(
                    l.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate(), 1L, Long::sum));

            for (int i = 0; i < days; i++) {
                LocalDate d = from.plusDays(i);
                points.add(TimeSeriesPoint.builder()
                    .date(d)
                    .value(counts.getOrDefault(d, 0L))
                    .label(d.format(ISO))
                    .build());
            }
            return points;
        };
        return cacheService.getOrLoad("dashboard", "visitors:" + days,
            new com.fasterxml.jackson.core.type.TypeReference<List<TimeSeriesPoint>>() {},
            loader, Duration.ofSeconds(CACHE_TTL_SECONDS));
    }

    /**
     * Service distribution: lead count grouped by service.
     */
    @Transactional(readOnly = true)
    public List<DistributionSlice> serviceDistribution(String range) {
        Instant[] window = rangeWindow(range);
        List<Object[]> rows = leadRepository.countByServiceInRange(window[0], window[1]);
        long total = rows.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
        if (total == 0) {
            return List.of();
        }
        return rows.stream()
            .map(r -> {
                String label = (String) r[0];
                long count = ((Number) r[1]).longValue();
                return DistributionSlice.builder()
                    .label(label == null ? "(unknown)" : label)
                    .count(count)
                    .percentage(round2(count * 100.0 / total))
                    .build();
            })
            .collect(Collectors.toList());
    }

    /**
     * Lead conversion funnel for the given range.
     */
    @Transactional(readOnly = true)
    public LeadFunnelResponse leadFunnel(String range) {
        Instant[] window = rangeWindow(range);
        long total = leadRepository.countByCreatedAtBetween(window[0], window[1]);
        long contacted = leadRepository.countByStatusAndCreatedAtBetween(LeadStatus.CONTACTED, window[0], window[1]);
        long qualified = leadRepository.countByStatusAndCreatedAtBetween(LeadStatus.QUALIFIED, window[0], window[1]);
        long converted = leadRepository.countByStatusAndCreatedAtBetween(LeadStatus.WON, window[0], window[1]);
        double rate = total == 0 ? 0 : round2(converted * 100.0 / total);
        return LeadFunnelResponse.builder()
            .total(total)
            .contacted(contacted)
            .qualified(qualified)
            .converted(converted)
            .conversionRate(rate)
            .build();
    }

    /**
     * Revenue time-series using confirmed appointments bucketed by day.
     */
    @Transactional(readOnly = true)
    public List<TimeSeriesPoint> revenueSeries(String range) {
        Instant[] window = rangeWindow(range);
        long days = ChronoUnit.DAYS.between(window[0], window[1]);
        long bucketCount = Math.max(1, Math.min(days, 90));

        List<TimeSeriesPoint> points = new ArrayList<>();
        var confirmed = appointmentRepository.findConfirmedAppointmentsInRange(window[0], window[1]);
        Map<LocalDate, Long> counts = new HashMap<>();
        for (var a : confirmed) {
            LocalDate d = a.getScheduledAt().atZone(ZoneId.systemDefault()).toLocalDate();
            counts.merge(d, 1L, Long::sum);
        }
        LocalDate from = window[0].atZone(ZoneId.systemDefault()).toLocalDate();
        for (long i = 0; i < bucketCount; i++) {
            LocalDate d = from.plusDays(i);
            points.add(TimeSeriesPoint.builder()
                .date(d)
                .value(counts.getOrDefault(d, 0L))
                .label(d.format(ISO))
                .build());
        }
        return points;
    }

    /**
     * Recent admin activity entries for the dashboard feed.
     */
    @Transactional(readOnly = true)
    public List<ActivityLogResponse> recentActivity(int limit) {
        Pageable pageable = PageRequest.of(0, Math.min(limit, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        var users = userRepository.findAll();
        Map<UUID, String> nameById = users.stream()
            .filter(u -> u.getId() != null)
            .collect(Collectors.toMap(u -> u.getId(), u -> u.getFullName() == null ? "system" : u.getFullName()));
        return auditLogRepository.findAll(pageable).getContent().stream()
            .map(a -> toActivityLog(a, nameById))
            .collect(Collectors.toList());
    }

    /**
     * Build a CSV dump of dashboard KPIs for the current range.
     */
    public String exportCsv(String range) {
        Instant[] window = rangeWindow(range);
        var funnel = leadFunnel(range);
        var services = serviceDistribution(range);
        long days = ChronoUnit.DAYS.between(window[0], window[1]);
        var visitors = visitorSeries((int) Math.min(30, Math.max(1, days)));

        StringWriter sw = new StringWriter();
        try (PrintWriter pw = new PrintWriter(sw)) {
            pw.println("BRS Dashboard Export");
            pw.println("Range," + range);
            pw.println("From," + window[0]);
            pw.println("To," + window[1]);
            pw.println();
            pw.println("== Funnel ==");
            pw.println("Metric,Value");
            pw.println("Total leads," + funnel.getTotal());
            pw.println("Contacted," + funnel.getContacted());
            pw.println("Qualified," + funnel.getQualified());
            pw.println("Converted," + funnel.getConverted());
            pw.println("Conversion rate (%)," + funnel.getConversionRate());
            pw.println();
            pw.println("== Service distribution ==");
            pw.println("Service,Count,Percentage");
            services.forEach(s -> pw.printf("%s,%d,%.2f%n", s.getLabel(), s.getCount(), s.getPercentage()));
            pw.println();
            pw.println("== Visitors ==");
            pw.println("Date,Count");
            visitors.forEach(v -> pw.printf("%s,%d%n", v.getLabel(), v.getValue()));
        }
        return sw.toString();
    }

    private ActivityLogResponse toActivityLog(AuditLog a, Map<UUID, String> nameById) {
        String actor = a.getUserId() == null ? "system" : nameById.getOrDefault(a.getUserId(), "user");
        return ActivityLogResponse.builder()
            .id(a.getId())
            .actorName(actor)
            .action(a.getAction())
            .entityType(a.getEntityType())
            .entityId(a.getEntityId())
            .summary(buildSummary(a))
            .createdAt(a.getCreatedAt())
            .build();
    }

    private String buildSummary(AuditLog a) {
        if (a.getAction() == null) {
            return "";
        }
        String action = a.getAction();
        String entity = a.getEntityType() == null ? "" : a.getEntityType();
        String entityId = a.getEntityId() == null ? "" : a.getEntityId().toString();
        String newData = a.getNewData();
        String oldData = a.getOldData();

        return switch (action + ":" + entity) {
            case "CREATE:lead" -> "Tạo lead" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "UPDATE:lead" -> "Cập nhật lead" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "DELETE:lead" -> "Xóa lead" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "STATUS_CHANGE:lead" -> {
                String from = extractDetail(oldData, "status");
                String to = extractDetail(newData, "status");
                if (!to.isEmpty()) {
                    yield "Đổi trạng thái lead " + (entityId.isEmpty() ? "" : "#" + entityId) + " → " + translateStatus(to);
                }
                yield "Đổi trạng thái lead" + (entityId.isEmpty() ? "" : " #" + entityId);
            }
            case "ASSIGN:lead" -> "Gán lead" + (entityId.isEmpty() ? "" : " #" + entityId);

            case "CREATE:appointment", "CREATE:booking" -> "Tạo lịch hẹn" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "UPDATE:appointment", "UPDATE:booking" -> "Cập nhật lịch hẹn" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "DELETE:appointment", "DELETE:booking" -> "Xóa lịch hẹn" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "STATUS_CHANGE:appointment", "STATUS_CHANGE:booking" -> "Đổi trạng thái lịch hẹn" + (entityId.isEmpty() ? "" : " #" + entityId);

            case "CREATE:post" -> "Tạo bài viết" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "UPDATE:post" -> "Cập nhật bài viết" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "DELETE:post" -> "Xóa bài viết" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "PUBLISH:post" -> "Xuất bản bài viết" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "UNPUBLISH:post" -> "Gỡ bài viết" + (entityId.isEmpty() ? "" : " #" + entityId);

            case "CREATE:review" -> "Tạo đánh giá" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "UPDATE:review" -> "Cập nhật đánh giá" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "STATUS_CHANGE:review" -> "Duyệt/từ chối đánh giá" + (entityId.isEmpty() ? "" : " #" + entityId);

            case "CREATE:user" -> "Tạo người dùng" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "UPDATE:user" -> "Cập nhật người dùng" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "DELETE:user" -> "Xóa người dùng" + (entityId.isEmpty() ? "" : " #" + entityId);

            case "CREATE:campaign" -> "Tạo chiến dịch" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "UPDATE:campaign" -> "Cập nhật chiến dịch" + (entityId.isEmpty() ? "" : " #" + entityId);

            case "CREATE:landing_page" -> "Tạo landing page" + (entityId.isEmpty() ? "" : " #" + entityId);
            case "UPDATE:landing_page" -> "Cập nhật landing page" + (entityId.isEmpty() ? "" : " #" + entityId);

            case "LOGIN" -> "Đăng nhập hệ thống";
            case "LOGOUT" -> "Đăng xuất hệ thống";
            case "IMPERSONATE" -> "Đăng nhập thay (impersonate)";
            default -> {
                String actionLabel = switch (action) {
                    case "CREATE" -> "Tạo";
                    case "UPDATE" -> "Cập nhật";
                    case "DELETE" -> "Xóa";
                    case "STATUS_CHANGE" -> "Đổi trạng thái";
                    case "ASSIGN" -> "Gán";
                    case "PUBLISH" -> "Xuất bản";
                    case "UNPUBLISH" -> "Gỡ";
                    default -> action;
                };
                yield actionLabel + " " + entity + (entityId.isEmpty() ? "" : " #" + entityId);
            }
        };
    }

    private String extractDetail(String json, String key) {
        if (json == null || json.isEmpty()) {
            return "";
        }
        String search = "\"" + key + "\"";
        int idx = json.indexOf(search);
        if (idx < 0) {
            return "";
        }
        idx = json.indexOf(":", idx);
        if (idx < 0) {
            return "";
        }
        idx++;
        // Skip whitespace
        while (idx < json.length() && (json.charAt(idx) == ' ' || json.charAt(idx) == '"')) {
            if (json.charAt(idx) == '"') idx++;
            else break;
        }
        int end = idx;
        while (end < json.length()) {
            char c = json.charAt(end);
            if (c == '"' || c == ',' || c == '}') {
                break;
            }
            end++;
        }
        String value = json.substring(idx, end).trim();
        return value;
    }

    private String translateStatus(String status) {
        if (status == null) return "";
        return switch (status.toLowerCase()) {
            case "new" -> "Mới";
            case "contacted" -> "Đã liên hệ";
            case "in_progress", "progress" -> "Đang tư vấn";
            case "qualified" -> "Đã qualify";
            case "won", "converted" -> "Đã chuyển đổi";
            case "lost" -> "Đã mất";
            case "pending" -> "Chờ xác nhận";
            case "confirmed" -> "Đã xác nhận";
            case "completed" -> "Hoàn tất";
            case "cancelled" -> "Đã hủy";
            case "approved" -> "Đã duyệt";
            case "rejected" -> "Từ chối";
            default -> status;
        };
    }

    private static Instant[] rangeWindow(String range) {
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now();
        LocalDate from;
        if (range == null) range = "week";
        switch (range.toLowerCase(Locale.ROOT)) {
            case "today":
                from = today;
                break;
            case "month":
                from = today.minusMonths(1);
                break;
            case "quarter":
                from = today.minusMonths(3);
                break;
            case "year":
                from = today.minusYears(1);
                break;
            case "week":
            default:
                from = today.minusDays(7);
                break;
        }
        Instant fromInstant = from.atStartOfDay(zone).toInstant();
        Instant toInstant = today.plusDays(1).atStartOfDay(zone).toInstant();
        return new Instant[] { fromInstant, toInstant };
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
