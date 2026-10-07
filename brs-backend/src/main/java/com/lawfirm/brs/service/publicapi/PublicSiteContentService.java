package com.lawfirm.brs.service.publicapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lawfirm.brs.entity.SettingsNamespace;
import com.lawfirm.brs.service.admin.SystemSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PublicSiteContentService {
    private final SystemSettingsService settingsService;
    private final ObjectMapper objectMapper;

    public JsonNode get(String locale) {
        JsonNode site = settingsService.get(SettingsNamespace.PUBLIC_SITE);
        if (!site.isObject()) {
            return emptyContent();
        }
        JsonNode localized = site.get(locale == null ? "vi" : locale.toLowerCase());
        if (localized != null && localized.isObject()) {
            return withSocialLinkDefaults((ObjectNode) localized);
        }
        JsonNode vietnamese = site.get("vi");
        return vietnamese != null && vietnamese.isObject()
            ? withSocialLinkDefaults((ObjectNode) vietnamese)
            : emptyContent();
    }

    private JsonNode withSocialLinkDefaults(ObjectNode content) {
        ObjectNode result = content.deepCopy();
        JsonNode existing = result.get("socialLinks");
        ObjectNode socialLinks = existing != null && existing.isObject()
            ? (ObjectNode) existing
            : result.putObject("socialLinks");

        putDefaultIfBlank(socialLinks, "facebook", "https://facebook.com/vpluat");
        putDefaultIfBlank(socialLinks, "linkedin", "https://linkedin.com/company/vpluat");
        putDefaultIfBlank(socialLinks, "youtube", "https://youtube.com/@vpluat");
        putDefaultIfBlank(socialLinks, "instagram", "https://instagram.com/vpluat");
        return result;
    }

    private void putDefaultIfBlank(ObjectNode node, String field, String defaultValue) {
        JsonNode current = node.get(field);
        if (current == null || !current.isTextual() || current.asText().isBlank()) {
            node.put(field, defaultValue);
        }
    }

    private JsonNode emptyContent() {
        ObjectNode empty = objectMapper.createObjectNode();
        empty.putObject("contact");
        empty.putObject("socialLinks");
        empty.putArray("offices");
        empty.putObject("heroStats");
        empty.putArray("processSteps");
        empty.putArray("faqs");
        return withSocialLinkDefaults(empty);
    }
}
