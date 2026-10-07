package com.lawfirm.brs.controller.publicapi;

import com.lawfirm.brs.dto.response.ApiResponse;
import com.lawfirm.brs.dto.response.LawyerDTO;
import com.lawfirm.brs.dto.response.PageResponse;
import com.lawfirm.brs.service.publicapi.LawyerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public controller for lawyers.
 */
@RestController
@RequestMapping("/api/public/lawyers")
@RequiredArgsConstructor
@Tag(name = "Public - Lawyers", description = "Public endpoints for lawyer profiles")
public class PublicLawyerController {

    private final LawyerService lawyerService;

    @GetMapping
    @Operation(summary = "Get all lawyers with pagination")
    public ResponseEntity<ApiResponse<PageResponse<LawyerDTO>>> getAllLawyers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String serviceId,
            @RequestParam(required = false) String serviceSlug) {
        var lawyersPage = lawyerService.getLawyers(PageRequest.of(page, size), serviceId, serviceSlug);
        PageResponse<LawyerDTO> response = PageResponse.of(
            lawyersPage.getContent(),
            page,
            size,
            lawyersPage.getTotalElements()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/featured")
    @Operation(summary = "Get featured lawyers")
    public ResponseEntity<ApiResponse<List<LawyerDTO>>> getFeaturedLawyers() {
        List<LawyerDTO> lawyers = lawyerService.getFeaturedLawyers();
        return ResponseEntity.ok(ApiResponse.success(lawyers));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get lawyer by slug")
    public ResponseEntity<ApiResponse<LawyerDTO>> getLawyerBySlug(@PathVariable String slug) {
        LawyerDTO lawyer = lawyerService.getLawyerBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(lawyer));
    }

    @GetMapping("/by-id/{id}")
    @Operation(summary = "Get lawyer by id")
    public ResponseEntity<ApiResponse<LawyerDTO>> getLawyerById(@PathVariable java.util.UUID id) {
        LawyerDTO lawyer = lawyerService.getLawyerById(id);
        return ResponseEntity.ok(ApiResponse.success(lawyer));
    }

    @GetMapping("/search")
    @Operation(summary = "Search lawyers")
    public ResponseEntity<ApiResponse<List<LawyerDTO>>> searchLawyers(@RequestParam String query) {
        List<LawyerDTO> lawyers = lawyerService.searchLawyers(query);
        return ResponseEntity.ok(ApiResponse.success(lawyers));
    }
}
