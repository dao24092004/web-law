package com.lawfirm.brs.controller.erp;

import com.lawfirm.brs.dto.response.ApiResponse;
import com.lawfirm.brs.dto.response.ActivityLogResponse;
import com.lawfirm.brs.dto.response.PageResponse;
import com.lawfirm.brs.entity.AuditLog;
import com.lawfirm.brs.repository.AuditLogRepository;
import com.lawfirm.brs.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Admin audit log query and export.
 */
@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('MANAGER')")
@Tag(name = "Admin - Audit Logs", description = "Audit trail query and export")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "List audit logs with filters")
    public ResponseEntity<ApiResponse<PageResponse<ActivityLogResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID entityId,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        Instant f = from == null ? Instant.EPOCH : from;
        Instant t = to == null ? Instant.now().plusSeconds(60) : to;
        Page<AuditLog> result = auditLogRepository.search(
            userId, action, entityType, entityId, f, t,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

        Map<UUID, String> nameById = userRepository.findAll().stream()
            .filter(u -> u.getId() != null)
            .collect(Collectors.toMap(u -> u.getId(), u -> u.getFullName() == null ? "user" : u.getFullName()));

        List<ActivityLogResponse> dtos = result.getContent().stream()
            .map(a -> ActivityLogResponse.builder()
                .id(a.getId())
                .actorName(a.getUserId() == null ? "system" : nameById.getOrDefault(a.getUserId(), "user"))
                .action(a.getAction())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .summary(buildSummary(a))
                .createdAt(a.getCreatedAt())
                .build())
            .toList();
        return ResponseEntity.ok(ApiResponse.success(
            PageResponse.of(dtos, page, size, result.getTotalElements())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get audit log entry detail")
    public ResponseEntity<ApiResponse<ActivityLogResponse>> get(@PathVariable UUID id) {
        AuditLog a = auditLogRepository.findById(id).orElse(null);
        if (a == null) return ResponseEntity.ok(ApiResponse.success(null));
        return ResponseEntity.ok(ApiResponse.success(
            ActivityLogResponse.builder()
                .id(a.getId())
                .actorName(a.getUserId() == null ? "system" : "user")
                .action(a.getAction())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .summary(buildSummary(a))
                .createdAt(a.getCreatedAt())
                .build()));
    }

    @DeleteMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Purge audit logs")
    public ResponseEntity<ApiResponse<Map<String, Long>>> purge(
            @RequestParam(required = false) Instant before) {
        long deleted = before == null
            ? auditLogRepository.count()
            : auditLogRepository.countByCreatedAtBefore(before);
        if (before == null) {
            auditLogRepository.deleteAllInBatch();
        } else {
            auditLogRepository.deleteByCreatedAtBefore(before);
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of("deleted", deleted)));
    }

    @GetMapping("/export/csv")
    @Operation(summary = "Export audit logs as CSV")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        Instant f = from == null ? Instant.EPOCH : from;
        Instant t = to == null ? Instant.now().plusSeconds(60) : to;
        List<AuditLog> rows = auditLogRepository.findAll().stream()
            .filter(a -> !a.getCreatedAt().isBefore(f) && a.getCreatedAt().isBefore(t))
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .toList();
        StringWriter sw = new StringWriter();
        try (PrintWriter pw = new PrintWriter(sw)) {
            pw.println("createdAt,userId,action,entityType,entityId");
            for (AuditLog a : rows) {
                pw.printf("%s,%s,%s,%s,%s%n",
                    a.getCreatedAt(), a.getUserId(),
                    csv(a.getAction()), csv(a.getEntityType()), a.getEntityId());
            }
        }
        byte[] body = sw.toString().getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=utf-8"));
        headers.setContentDispositionFormData("attachment", "audit-logs.csv");
        return ResponseEntity.ok().headers(headers).body(body);
    }

    private String buildSummary(AuditLog a) {
        if (a.getAction() == null) return "";
        StringBuilder sb = new StringBuilder(a.getAction());
        if (a.getEntityType() != null) sb.append(' ').append(a.getEntityType());
        if (a.getEntityId() != null) sb.append('#').append(a.getEntityId());
        return sb.toString();
    }

    private String csv(String s) {
        if (s == null) return "";
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}
