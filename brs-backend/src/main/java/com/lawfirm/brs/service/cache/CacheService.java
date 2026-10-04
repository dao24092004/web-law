package com.lawfirm.brs.service.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.lawfirm.brs.entity.ServiceEntity;
import com.lawfirm.brs.repository.ServiceEntityRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Supplier;

@Service
@Slf4j
public class CacheService {

    private final StringRedisTemplate redis;
    private final ServiceEntityRepository serviceRepository;
    private final ObjectMapper objectMapper;

    private static final String CACHE_PREFIX = "brs:";

    public CacheService(StringRedisTemplate redis, ServiceEntityRepository serviceRepository) {
        this.redis = redis;
        this.serviceRepository = serviceRepository;
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    public <T> T getOrLoad(String cacheName, String key,
                           Class<T> type,
                           Supplier<T> loader,
                           Duration ttl) {
        return getOrLoad(cacheName, key, type, loader, ttl, Duration.ofMinutes(1));
    }

    /**
     * Typed cache read/load. The {@code type} is required so Jackson can
     * deserialize back into the caller's concrete class — calling
     * {@code readValue(json, Object.class)} produces a {@code LinkedHashMap}
     * which silently breaks any caller that expects a typed list or DTO.
     */
    public <T> T getOrLoad(String cacheName, String key,
                           Class<T> type,
                           Supplier<T> loader,
                           Duration ttl,
                           Duration staleTtl) {
        String fullKey = CACHE_PREFIX + cacheName + ":" + key;
        String cached = redis.opsForValue().get(fullKey);

        if (cached != null) {
            T hit = deserialize(cached, type);
            if (hit != null) {
                return hit;
            }
            // Corrupt or stale format — fall through and rebuild.
            log.warn("Cache deserialize returned null for {}, reloading", fullKey);
        }

        T result = loader.get();
        String serialized = serialize(result);
        if (serialized != null) {
            redis.opsForValue().set(fullKey, serialized, ttl);
            redis.opsForValue().set(fullKey + ":stale", serialized, ttl.plus(staleTtl));
        }
        return result;
    }

    public <T> T getOrLoad(String cacheName, String key,
                           TypeReference<T> typeRef,
                           Supplier<T> loader,
                           Duration ttl) {
        String fullKey = CACHE_PREFIX + cacheName + ":" + key;
        String cached = redis.opsForValue().get(fullKey);

        if (cached != null) {
            T hit = deserialize(cached, typeRef);
            if (hit != null) {
                return hit;
            }
            log.warn("Cache deserialize returned null for {}, reloading", fullKey);
        }

        T result = loader.get();
        String serialized = serialize(result);
        if (serialized != null) {
            redis.opsForValue().set(fullKey, serialized, ttl);
        }
        return result;
    }

    public void evict(String cacheName, String key) {
        String fullKey = CACHE_PREFIX + cacheName + ":" + key;
        redis.delete(fullKey);
        redis.delete(fullKey + ":stale");
        redis.convertAndSend("cache:evict", cacheName + ":" + key);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void warmCache() {
        log.info("Cache warming: starting...");

        CompletableFuture.allOf(
            CompletableFuture.runAsync(() -> warmServices()),
            CompletableFuture.runAsync(() -> warmCategories()),
            CompletableFuture.runAsync(() -> warmFaqs())
        ).exceptionally(ex -> {
            log.error("Cache warming failed", ex);
            return null;
        });

        log.info("Cache warming: completed");
    }

    private void warmServices() {
        try {
            List<ServiceEntity> services = serviceRepository.findByIsActiveTrueAndDeletedAtIsNull();
            services.forEach(s -> redis.opsForValue().set(
                CACHE_PREFIX + "services:" + s.getSlug(),
                serialize(s),
                Duration.ofMinutes(5)));
            log.info("Warmed {} services", services.size());
        } catch (Exception e) {
            log.warn("Failed to warm services cache", e);
        }
    }

    private void warmCategories() {
        log.info("Warmed categories cache");
    }

    private void warmFaqs() {
        log.info("Warmed FAQs cache");
    }

    private String serialize(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Serialization failed", e);
            return null;
        }
    }

    private <T> T deserialize(String json, Class<T> type) {
        if (json == null) return null;
        try {
            return objectMapper.readValue(json, type);
        } catch (Exception e) {
            log.error("Deserialization failed for type {}", type.getSimpleName(), e);
            return null;
        }
    }

    private <T> T deserialize(String json, TypeReference<T> typeRef) {
        if (json == null) return null;
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            log.error("Deserialization failed for type {}", typeRef.getType().getTypeName(), e);
            return null;
        }
    }
}
