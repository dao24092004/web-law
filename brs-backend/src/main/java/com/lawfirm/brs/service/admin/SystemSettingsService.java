package com.lawfirm.brs.service.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lawfirm.brs.entity.SettingsNamespace;
import com.lawfirm.brs.entity.SystemSetting;
import com.lawfirm.brs.exception.BusinessException;
import com.lawfirm.brs.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SystemSettingsService {
    private static final String SMTP_NAMESPACE = "SMTP";
    private static final String SMTP_PASSWORD = "smtpPassword";

    private final SystemSettingRepository repository;
    private final ObjectMapper objectMapper;

    public JsonNode get(SettingsNamespace namespace) {
        JsonNode value = repository.findByNamespace(namespace)
            .map(SystemSetting::getValueJson)
            .map(this::readJson)
            .orElseGet(() -> objectMapper.createObjectNode());

        if (SMTP_NAMESPACE.equals(namespace.name()) && value.isObject()) {
            ObjectNode safeValue = ((ObjectNode) value).deepCopy();
            if (safeValue.hasNonNull(SMTP_PASSWORD)) {
                safeValue.put(SMTP_PASSWORD, "");
            }
            return safeValue;
        }
        return value;
    }

    @Transactional
    public JsonNode update(SettingsNamespace namespace, JsonNode patch) {
        if (patch == null || !patch.isObject()) {
            throw new BusinessException("INVALID_SETTINGS", "Settings payload must be a JSON object");
        }

        SystemSetting setting = repository.findByNamespace(namespace)
            .orElseGet(() -> {
                SystemSetting created = new SystemSetting();
                created.setNamespace(namespace);
                created.setValueJson(objectMapper.createObjectNode());
                return created;
            });

        ObjectNode merged = readJson(setting.getValueJson()).deepCopy();
        ((ObjectNode) patch).fields().forEachRemaining(entry -> {
            if (SMTP_NAMESPACE.equals(namespace.name())
                && SMTP_PASSWORD.equals(entry.getKey())
                && entry.getValue().isTextual()
                && entry.getValue().asText().isBlank()) {
                return;
            }
            merged.set(entry.getKey(), entry.getValue());
        });
        setting.setValueJson(merged);
        repository.save(setting);
        return getStoredValue(merged, namespace);
    }

    private ObjectNode readJson(JsonNode valueJson) {
        JsonNode parsed = valueJson == null || valueJson.isNull()
            ? objectMapper.createObjectNode()
            : valueJson;
        if (!parsed.isObject()) {
            throw new BusinessException("INVALID_SETTINGS", "Stored settings must be a JSON object");
        }
        return (ObjectNode) parsed;
    }

    private JsonNode getStoredValue(ObjectNode value, SettingsNamespace namespace) {
        if (!SMTP_NAMESPACE.equals(namespace.name())) {
            return value;
        }
        ObjectNode safeValue = value.deepCopy();
        if (safeValue.hasNonNull(SMTP_PASSWORD)) {
            safeValue.put(SMTP_PASSWORD, "");
        }
        return safeValue;
    }
}
