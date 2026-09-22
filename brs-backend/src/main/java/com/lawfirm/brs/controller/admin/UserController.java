package com.lawfirm.brs.controller.admin;

import com.lawfirm.brs.dto.request.RegisterRequest;
import com.lawfirm.brs.dto.response.ActivityLogResponse;
import com.lawfirm.brs.dto.response.ApiResponse;
import com.lawfirm.brs.dto.response.PageResponse;
import com.lawfirm.brs.dto.response.UserDTO;
import com.lawfirm.brs.repository.AuditLogRepository;
import com.lawfirm.brs.service.admin.UserManagementService;
import com.lawfirm.brs.service.erp.DashboardErpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for user management (admin).
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
@Tag(name = "Admin - Users", description = "User management endpoints")
public class UserController {

    private final UserManagementService userService;
    private final DashboardErpService dashboardService;
    private final AuditLogRepository auditLogRepository;
    private final com.lawfirm.brs.controller.admin.RoleController roleController;

    @GetMapping
    @Operation(summary = "Get all users with pagination (Admin)")
    public ResponseEntity<ApiResponse<PageResponse<UserDTO>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive) {
        PageResponse<UserDTO> users = userService.getAllUsers(page, size, role, isActive);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    /**
     * Dedicated route to list all system roles.
     * Declared BEFORE the {@code /{id}} mapping so it is matched first
     * and the "roles" path segment is not treated as a UUID.
     */
    @GetMapping("/roles")
    @Operation(summary = "List all system roles (Admin)")
    public ResponseEntity<ApiResponse<List<com.lawfirm.brs.dto.response.RoleDTO>>> listRoles() {
        // Delegate to RoleController implementation by reusing the bean
        return roleController.getAllRoles();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID (Admin)")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable UUID id) {
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping
    @Operation(summary = "Create a new user (SuperAdmin)")
    public ResponseEntity<ApiResponse<UserDTO>> createUser(
            @Valid @RequestBody RegisterRequest request) {
        UserDTO user = userService.createUser(request);
        return ResponseEntity.ok(ApiResponse.success("User created successfully", user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a user (Admin)")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UserManagementService.UpdateUserRequest request) {
        UserDTO user = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", user));
    }

    @PatchMapping("/{id}/role")
    @Operation(summary = "Change user role (SuperAdmin)")
    public ResponseEntity<ApiResponse<UserDTO>> changeUserRole(
            @PathVariable UUID id,
            @RequestBody ChangeRoleRequest request) {
        UserDTO user = userService.changeUserRole(id, request.role());
        return ResponseEntity.ok(ApiResponse.success("User role changed successfully", user));
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate/deactivate a user (Admin)")
    public ResponseEntity<ApiResponse<UserDTO>> toggleUserActive(@PathVariable UUID id) {
        UserDTO user = userService.toggleUserActive(id);
        return ResponseEntity.ok(ApiResponse.success("User active status toggled successfully", user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a user (SuperAdmin)")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    @GetMapping("/{id}/activity")
    @Operation(summary = "Recent activity entries by a specific user")
    public ResponseEntity<ApiResponse<List<ActivityLogResponse>>> activity(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "50") int limit) {
        var entries = auditLogRepository.findByUserIdOrderByCreatedAtDesc(id);
        var u = userService.getUserById(id);
        var name = u == null ? "user" : u.getFullName();
        var mapped = entries.stream().limit(limit)
            .map(a -> ActivityLogResponse.builder()
                .id(a.getId())
                .actorName(name)
                .action(a.getAction())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .summary(a.getAction() + (a.getEntityType() == null ? "" : " " + a.getEntityType()))
                .createdAt(a.getCreatedAt())
                .build())
            .toList();
        return ResponseEntity.ok(ApiResponse.success(mapped));
    }

    public record ChangeRoleRequest(String role) {}
}
