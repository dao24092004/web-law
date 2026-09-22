package com.lawfirm.brs.controller.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lawfirm.brs.dto.response.ApiResponse;
import com.lawfirm.brs.entity.SettingsNamespace;
import com.lawfirm.brs.exception.BusinessException;
import com.lawfirm.brs.repository.SystemSettingRepository;
import com.lawfirm.brs.entity.SystemSetting;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Landing Page builder endpoints.
 *
 * <p>Pages are stored as a JSON array in the {@code LANDING_PAGES} slot of the
 * system settings table. Each page carries {@code id}, {@code slug},
 * {@code title}, {@code status}, {@code blocks}, and {@code metrics}.</p>
 */
@RestController
@RequestMapping("/api/admin/landing-pages")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EDITOR')")
@Tag(name = "Admin - Landing Pages", description = "Manage marketing landing pages")
public class LandingPageController {

    private final SystemSettingRepository settingRepository;
    private final ObjectMapper objectMapper;

    @GetMapping
    @Operation(summary = "List all landing pages")
    public ResponseEntity<ApiResponse<List<JsonNode>>> list() {
        return ResponseEntity.ok(ApiResponse.success(loadPages()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a landing page by id")
    public ResponseEntity<ApiResponse<JsonNode>> get(@PathVariable String id) {
        for (JsonNode page : loadPages()) {
            if (id.equals(text(page, "id"))) {
                return ResponseEntity.ok(ApiResponse.success(page));
            }
        }
        throw new BusinessException("LANDING_PAGE_NOT_FOUND", "Landing page not found: " + id);
    }

    @PostMapping
    @Operation(summary = "Create a new landing page")
    public ResponseEntity<ApiResponse<JsonNode>> create(@RequestBody JsonNode payload) {
        List<JsonNode> pages = new ArrayList<>(loadPages());
        ObjectNode created = (ObjectNode) payload.deepCopy();
        if (!created.has("id") || created.get("id").isNull()) {
            created.put("id", UUID.randomUUID().toString());
        }
        created.put("createdAt", Instant.now().toString());
        created.put("updatedAt", Instant.now().toString());
        pages.add(created);
        persist(pages);
        return ResponseEntity.ok(ApiResponse.success("Landing page created", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing landing page")
    public ResponseEntity<ApiResponse<JsonNode>> update(@PathVariable String id,
                                                       @RequestBody JsonNode payload) {
        List<JsonNode> pages = new ArrayList<>();
        JsonNode found = null;
        for (JsonNode page : loadPages()) {
            if (id.equals(text(page, "id"))) {
                ObjectNode update = (ObjectNode) payload.deepCopy();
                update.put("id", id);
                update.put("updatedAt", Instant.now().toString());
                pages.add(update);
                found = update;
            } else {
                pages.add(page);
            }
        }
        if (found == null) {
            throw new BusinessException("LANDING_PAGE_NOT_FOUND", "Landing page not found: " + id);
        }
        persist(pages);
        return ResponseEntity.ok(ApiResponse.success("Landing page updated", found));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Partially update a landing page (e.g. status toggle)")
    public ResponseEntity<ApiResponse<JsonNode>> patch(@PathVariable String id,
                                                      @RequestBody JsonNode payload) {
        List<JsonNode> pages = new ArrayList<>();
        JsonNode found = null;
        for (JsonNode page : loadPages()) {
            if (id.equals(text(page, "id"))) {
                ObjectNode update = (ObjectNode) page.deepCopy();
                payload.fields().forEachRemaining(e -> update.set(e.getKey(), e.getValue().deepCopy()));
                update.put("updatedAt", Instant.now().toString());
                pages.add(update);
                found = update;
            } else {
                pages.add(page);
            }
        }
        if (found == null) {
            throw new BusinessException("LANDING_PAGE_NOT_FOUND", "Landing page not found: " + id);
        }
        persist(pages);
        return ResponseEntity.ok(ApiResponse.success(found));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a landing page")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        List<JsonNode> pages = new ArrayList<>();
        boolean removed = false;
        for (JsonNode page : loadPages()) {
            if (id.equals(text(page, "id"))) {
                removed = true;
                continue;
            }
            pages.add(page);
        }
        if (!removed) {
            throw new BusinessException("LANDING_PAGE_NOT_FOUND", "Landing page not found: " + id);
        }
        persist(pages);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{id}/stats")
    @Operation(summary = "Stats (visits / conversions) for a landing page")
    public ResponseEntity<ApiResponse<JsonNode>> stats(@PathVariable String id) {
        for (JsonNode page : loadPages()) {
            if (id.equals(text(page, "id"))) {
                ObjectNode stats = objectMapper.createObjectNode();
                stats.put("pageId", id);
                stats.put("visits", page.path("visits").asLong(0));
                stats.put("conversions", page.path("conversions").asLong(0));
                stats.put("conversionRate", page.path("conversionRate").asDouble(0.0));
                stats.put("lastViewedAt", page.path("lastViewedAt").asText(null));
                return ResponseEntity.ok(ApiResponse.success(stats));
            }
        }
        throw new BusinessException("LANDING_PAGE_NOT_FOUND", "Landing page not found: " + id);
    }

    @PutMapping("/{id}/blocks")
    @Operation(summary = "Replace the page block tree")
    public ResponseEntity<ApiResponse<JsonNode>> replaceBlocks(@PathVariable String id,
                                                              @RequestBody JsonNode payload) {
        return update(id, ((ObjectNode) payload).put("blocksFieldOverridden", true));
    }

    // ------------------------------------------------------------------
    // Helpers — keep storage in the SystemSetting jsonb column
    // ------------------------------------------------------------------

    private List<JsonNode> loadPages() {
        return settingRepository.findByNamespace(SettingsNamespace.LANDING_PAGES)
            .map(setting -> parsePages(setting.getValueJson()))
            .orElseGet(this::seedDefaults);
    }

    private List<JsonNode> parsePages(String valueJson) {
        try {
            JsonNode node = objectMapper.readTree(valueJson == null ? "[]" : valueJson);
            if (!node.isArray()) {
                ArrayNode arr = objectMapper.createArrayNode();
                arr.add(node);
                return arrayList(arr);
            }
            return arrayList((ArrayNode) node);
        } catch (Exception ex) {
            throw new BusinessException("INVALID_LANDING_PAGES_PAYLOAD",
                "Stored landing pages payload is invalid");
        }
    }

    private List<JsonNode> arrayList(ArrayNode arr) {
        List<JsonNode> list = new ArrayList<>();
        arr.forEach(list::add);
        return list;
    }

    private List<JsonNode> seedDefaults() {
        // First-time read returns empty list — FE can build its own pages via POST.
        return new ArrayList<>();
    }

    private void persist(List<JsonNode> pages) {
        ArrayNode arr = objectMapper.createArrayNode();
        pages.forEach(p -> arr.add(p.deepCopy()));
        String body;
        try {
            body = objectMapper.writeValueAsString(arr);
        } catch (Exception ex) {
            throw new BusinessException("LANDING_PAGE_SERIALIZE_FAILED",
                "Failed to serialize landing pages");
        }
        SystemSetting setting = settingRepository
            .findByNamespace(SettingsNamespace.LANDING_PAGES)
            .orElseGet(() -> {
                SystemSetting s = new SystemSetting();
                s.setNamespace(SettingsNamespace.LANDING_PAGES);
                s.setUpdatedAt(Instant.now());
                return s;
            });
        setting.setValueJson(body);
        setting.setUpdatedAt(Instant.now());
        settingRepository.save(setting);
    }

    private String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return v == null || v.isNull() ? null : v.asText();
    }
}
