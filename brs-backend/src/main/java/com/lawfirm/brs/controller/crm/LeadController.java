package com.lawfirm.brs.controller.crm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.lawfirm.brs.dto.request.LeadRequest;
import com.lawfirm.brs.dto.response.ActivityLogResponse;
import com.lawfirm.brs.dto.response.ApiResponse;
import com.lawfirm.brs.dto.response.AppointmentDTO;
import com.lawfirm.brs.dto.response.BulkImportResponse;
import com.lawfirm.brs.dto.response.LeadDTO;
import com.lawfirm.brs.dto.response.LeadNoteDTO;
import com.lawfirm.brs.dto.response.PageResponse;
import com.lawfirm.brs.service.booking.BookingService;
import com.lawfirm.brs.service.crm.LeadService;
import com.lawfirm.brs.service.erp.LeadPipelineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

/**
 * Controller for lead management (CRM).
 */
@RestController
@RequestMapping("/api/crm")
@RequiredArgsConstructor
@Tag(name = "CRM - Leads", description = "Lead management endpoints")
public class LeadController {

    private final LeadService leadService;
    private final LeadPipelineService pipeline;
    private final BookingService bookingService;
    private final com.lawfirm.brs.security.ClientIpResolver clientIpResolver;

    @PostMapping("/leads")
    @Operation(summary = "Create a new lead (public)")
    public ResponseEntity<ApiResponse<LeadDTO>> createLead(
            @Valid @RequestBody LeadRequest request,
            HttpServletRequest httpRequest) {
        if (request.ipAddress() == null) {
            request = new LeadRequest(
                request.name(), request.email(), request.phone(),
                request.serviceId(), request.message(), request.source(),
                request.channel(), request.campaignId(), request.adGroupId(),
                request.utmSource(), request.utmMedium(), request.utmCampaign(),
                getClientIp(httpRequest), request.userAgent()
            );
        }
        LeadDTO lead = leadService.createLead(request);
        return ResponseEntity.ok(ApiResponse.success("Lead created successfully", lead));
    }

    @GetMapping("/leads")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EDITOR') or hasRole('CSKH') or hasRole('MANAGER')")
    @Operation(summary = "List leads with pagination and filters")
    public ResponseEntity<ApiResponse<PageResponse<LeadDTO>>> getAllLeads(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) UUID assignedTo,
            @RequestParam(required = false) String search) {
        PageResponse<LeadDTO> leads = leadService.getAllLeads(page, size, status, source, assignedTo, search);
        return ResponseEntity.ok(ApiResponse.success(leads));
    }

    @GetMapping("/leads/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EDITOR') or hasRole('CSKH') or hasRole('MANAGER')")
    @Operation(summary = "Get lead by ID")
    public ResponseEntity<ApiResponse<LeadDTO>> getLeadById(@PathVariable UUID id) {
        LeadDTO lead = leadService.getLeadById(id);
        return ResponseEntity.ok(ApiResponse.success(lead));
    }

    @GetMapping("/leads/pipeline")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EDITOR') or hasRole('CSKH') or hasRole('MANAGER') or hasRole('LAWYER')")
    @Operation(summary = "Get lead pipeline stats grouped by status (real counts from DB)")
    public ResponseEntity<ApiResponse<PipelineStatsResponse>> getPipelineStats() {
        return ResponseEntity.ok(ApiResponse.success(leadService.getPipelineStats()));
    }

    @GetMapping("/leads/{id}/timeline")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EDITOR') or hasRole('CSKH') or hasRole('MANAGER')")
    @Operation(summary = "Get lead activity timeline")
    public ResponseEntity<ApiResponse<List<ActivityLogResponse>>> getTimeline(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(pipeline.getTimeline(id)));
    }

    @PatchMapping("/leads/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EDITOR') or hasRole('CSKH') or hasRole('MANAGER')")
    @Operation(summary = "Update lead status / assign / notes")
    public ResponseEntity<ApiResponse<LeadDTO>> updateLeadStatus(
            @PathVariable UUID id,
            @RequestBody UpdateLeadRequest request,
            @RequestParam(required = false) UUID actorId) {
        LeadDTO lead = leadService.updateLeadStatus(
            id,
            request.status(),
            request.assignedTo(),
            request.notes(),
            request.name(),
            request.phone(),
            request.email(),
            request.serviceId(),
            request.source(),
            request.assignedToName(),
            request.serviceName()
        );
        pipeline.recordActivity(id, actorId, "STATUS_CHANGED",
            request.notes() != null ? request.notes() : "status=" + request.status(),
            null);
        return ResponseEntity.ok(ApiResponse.success("Lead updated successfully", lead));
    }

    @PatchMapping("/leads/{id}/assign")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EDITOR') or hasRole('CSKH') or hasRole('MANAGER')")
    @Operation(summary = "Assign lead to a user")
    public ResponseEntity<ApiResponse<LeadDTO>> assign(
            @PathVariable UUID id,
            @RequestBody AssignRequest request,
            @RequestParam(required = false) UUID actorId) {
        LeadDTO lead = pipeline.assign(id, request.assigneeId(), actorId);
        return ResponseEntity.ok(ApiResponse.success("Lead assigned", lead));
    }

    @PostMapping("/leads/{id}/notes")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EDITOR') or hasRole('CSKH') or hasRole('MANAGER')")
    @Operation(summary = "Add note to lead")
    public ResponseEntity<ApiResponse<LeadDTO>> addNote(
            @PathVariable UUID id,
            @RequestBody AddNoteRequest request,
            @RequestParam(required = false) UUID actorId) {
        LeadDTO lead = leadService.addNote(id, request.note(), actorId);
        pipeline.recordActivity(id, actorId, "NOTED", request.note(), null);
        return ResponseEntity.ok(ApiResponse.success("Note added successfully", lead));
    }

    @GetMapping("/leads/{id}/notes")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('CSKH') or hasRole('MANAGER') or hasRole('LAWYER')")
    @Operation(summary = "List note history for a lead, newest first")
    public ResponseEntity<ApiResponse<List<LeadNoteDTO>>> listNotes(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Notes retrieved", leadService.getNotes(id)));
    }

    @GetMapping("/leads/{id}/bookings")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('CSKH') or hasRole('MANAGER')")
    @Operation(summary = "List appointments for a lead, newest first")
    public ResponseEntity<ApiResponse<List<AppointmentDTO>>> listBookings(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.getBookingsByLeadId(id)));
    }

    @DeleteMapping("/leads/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Soft-delete a lead")
    public ResponseEntity<Void> deleteLead(@PathVariable UUID id) {
        leadService.deleteLead(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/leads/bulk/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EDITOR') or hasRole('CSKH') or hasRole('MANAGER')")
    @Operation(summary = "Bulk import leads from CSV")
    public ResponseEntity<ApiResponse<BulkImportResponse>> bulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) UUID actorId) {
        return ResponseEntity.ok(ApiResponse.success(
            pipeline.bulkImport(file, actorId)));
    }

    @GetMapping("/leads/export/csv")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EDITOR') or hasRole('CSKH') or hasRole('MANAGER')")
    @Operation(summary = "Export leads as CSV")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String source) {
        String csv = pipeline.exportCsv(status, source);
        byte[] body = csv.getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=utf-8"));
        headers.setContentDispositionFormData("attachment", "leads.csv");
        return ResponseEntity.ok().headers(headers).body(body);
    }

    /**
     * Lấy IP client đã được chuẩn hoá. Xem {@link ClientIpResolver} — không
     * được đọc trực tiếp X-Forwarded-For vì client kiểm soát phần tử đầu.
     */
    private String getClientIp(HttpServletRequest request) {
        return clientIpResolver.resolve(request);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UpdateLeadRequest(
            String status,
            UUID assignedTo,
            String notes,
            String name,
            String phone,
            String email,
            UUID serviceId,
            String source,
            String assignedToName,
            String serviceName
    ) {}
    public record AddNoteRequest(String note) {}
    public record AssignRequest(UUID assigneeId) {}
    public record PipelineStatsResponse(
            long total,
            long newCount,
            long contacted,
            long qualified,
            long converted,
            long lost,
            double conversionRate
    ) {}
}
