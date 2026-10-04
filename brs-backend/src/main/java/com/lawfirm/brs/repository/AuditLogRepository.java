package com.lawfirm.brs.repository;

import com.lawfirm.brs.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Audit log repository.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findByUserId(UUID userId);

    List<AuditLog> findByAction(String action);

    List<AuditLog> findByEntityTypeAndEntityId(String entityType, UUID entityId);

    List<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, UUID entityId);

    List<AuditLog> findByActionAndCreatedAtBetween(String action, Instant from, Instant to);

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByCreatedAtBefore(Instant before);

    long deleteByCreatedAtBefore(Instant before);

    @Query(value = "SELECT a.* FROM audit_logs a "
            + "WHERE (CAST(:userId AS uuid) IS NULL OR a.user_id = CAST(:userId AS uuid)) "
            + "AND (CAST(:action AS varchar) IS NULL OR LOWER(a.action::text) = LOWER(CAST(:action AS varchar))) "
            + "AND (CAST(:entityType AS varchar) IS NULL OR LOWER(a.entity_type::text) = LOWER(CAST(:entityType AS varchar))) "
            + "AND (CAST(:entityId AS uuid) IS NULL OR a.entity_id = CAST(:entityId AS uuid)) "
            + "AND a.created_at >= CAST(:ts_from AS timestamp) "
            + "AND a.created_at < CAST(:ts_to AS timestamp) ",
        countQuery = "SELECT COUNT(*) FROM audit_logs a "
            + "WHERE (CAST(:userId AS uuid) IS NULL OR a.user_id = CAST(:userId AS uuid)) "
            + "AND (CAST(:action AS varchar) IS NULL OR LOWER(a.action::text) = LOWER(CAST(:action AS varchar))) "
            + "AND (CAST(:entityType AS varchar) IS NULL OR LOWER(a.entity_type::text) = LOWER(CAST(:entityType AS varchar))) "
            + "AND (CAST(:entityId AS uuid) IS NULL OR a.entity_id = CAST(:entityId AS uuid)) "
            + "AND a.created_at >= CAST(:ts_from AS timestamp) "
            + "AND a.created_at < CAST(:ts_to AS timestamp) ",
        nativeQuery = true)
    Page<AuditLog> search(
        @Param("userId") UUID userId,
        @Param("action") String action,
        @Param("entityType") String entityType,
        @Param("entityId") UUID entityId,
        @Param("ts_from") Instant from,
        @Param("ts_to") Instant to,
        Pageable pageable
    );
}
