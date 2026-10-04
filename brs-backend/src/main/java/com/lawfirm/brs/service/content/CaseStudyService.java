package com.lawfirm.brs.service.content;

import com.lawfirm.brs.dto.request.CaseStudyRequest;
import com.lawfirm.brs.entity.ServiceEntity;
import com.lawfirm.brs.exception.ResourceNotFoundException;
import com.lawfirm.brs.repository.CaseStudyRepository;
import com.lawfirm.brs.repository.ServiceEntityRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CaseStudyService {

    private final CaseStudyRepository caseStudyRepository;
    private final ServiceEntityRepository serviceRepository;
    private final ContentSanitizerService contentSanitizer;

    @Transactional
    public CaseStudy createCaseStudy(CaseStudyRequest request, UUID createdBy) {
        com.lawfirm.brs.entity.CaseStudy entity = new com.lawfirm.brs.entity.CaseStudy();
        apply(entity, request);
        entity.setCreatedBy(createdBy);
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        return toDto(caseStudyRepository.save(entity));
    }

    @Transactional
    public CaseStudy updateCaseStudy(UUID id, CaseStudyRequest request) {
        com.lawfirm.brs.entity.CaseStudy entity = getEntity(id);
        apply(entity, request);
        entity.setUpdatedAt(Instant.now());
        return toDto(caseStudyRepository.save(entity));
    }

    public CaseStudy getCaseStudy(UUID id) {
        return toDto(getEntity(id));
    }

    public CaseStudy getCaseStudyBySlug(String slug) {
        return toDto(caseStudyRepository.findBySlugAndDeletedAtIsNull(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Case study not found: " + slug)));
    }

    public List<CaseStudy> listCaseStudies(boolean publishedOnly) {
        List<com.lawfirm.brs.entity.CaseStudy> rows = publishedOnly
            ? caseStudyRepository.findAllByPublishedTrueAndDeletedAtIsNullOrderByUpdatedAtDesc()
            : caseStudyRepository.findAllByDeletedAtIsNullOrderByUpdatedAtDesc();
        return rows.stream().map(this::toDto).toList();
    }

    public List<CaseStudy> listCaseStudiesByService(UUID serviceId, boolean publishedOnly) {
        return caseStudyRepository.findByServiceId(serviceId, publishedOnly).stream().map(this::toDto).toList();
    }

    @Transactional
    public void deleteCaseStudy(UUID id) {
        com.lawfirm.brs.entity.CaseStudy entity = getEntity(id);
        entity.setDeletedAt(Instant.now());
        entity.setPublished(false);
        caseStudyRepository.save(entity);
    }

    @Transactional
    public CaseStudy publishCaseStudy(UUID id) {
        com.lawfirm.brs.entity.CaseStudy entity = getEntity(id);
        entity.setPublished(true);
        entity.setPublishedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        return toDto(caseStudyRepository.save(entity));
    }

    @Transactional
    public CaseStudy unpublishCaseStudy(UUID id) {
        com.lawfirm.brs.entity.CaseStudy entity = getEntity(id);
        entity.setPublished(false);
        entity.setUpdatedAt(Instant.now());
        return toDto(caseStudyRepository.save(entity));
    }

    private com.lawfirm.brs.entity.CaseStudy getEntity(UUID id) {
        return caseStudyRepository.findById(id)
            .filter(entity -> entity.getDeletedAt() == null)
            .orElseThrow(() -> new ResourceNotFoundException("Case study not found: " + id));
    }

    private void apply(com.lawfirm.brs.entity.CaseStudy entity, CaseStudyRequest request) {
        if (request.titleVi() != null) entity.setTitleVi(request.titleVi());
        if (request.titleEn() != null) entity.setTitleEn(request.titleEn());
        if (request.slug() != null) entity.setSlug(request.slug());
        if (request.excerptVi() != null) entity.setExcerptVi(request.excerptVi());
        if (request.excerptEn() != null) entity.setExcerptEn(request.excerptEn());
        if (request.contentVi() != null) entity.setContentVi(contentSanitizer.sanitizeRelaxed(request.contentVi()));
        if (request.contentEn() != null) entity.setContentEn(contentSanitizer.sanitizeRelaxed(request.contentEn()));
        if (request.outcome() != null) entity.setOutcome(request.outcome());
        if (request.thumbnailUrl() != null) entity.setThumbnailUrl(request.thumbnailUrl());
        if (request.ogImageUrl() != null) entity.setOgImageUrl(request.ogImageUrl());
        if (request.isPublished() != null) entity.setPublished(request.isPublished());
        if (request.isFeatured() != null) entity.setFeatured(request.isFeatured());
        if (request.serviceIds() != null) {
            List<ServiceEntity> services = new ArrayList<>();
            for (String serviceId : request.serviceIds()) {
                UUID id = UUID.fromString(serviceId);
                services.add(serviceRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Service not found: " + id)));
            }
            entity.setServices(services);
        }
    }

    private CaseStudy toDto(com.lawfirm.brs.entity.CaseStudy entity) {
        CaseStudy dto = new CaseStudy();
        dto.setId(entity.getId());
        dto.setSlug(entity.getSlug());
        dto.setTitleVi(entity.getTitleVi());
        dto.setTitleEn(entity.getTitleEn());
        dto.setExcerptVi(entity.getExcerptVi());
        dto.setExcerptEn(entity.getExcerptEn());
        dto.setContentVi(entity.getContentVi());
        dto.setContentEn(entity.getContentEn());
        dto.setOutcome(entity.getOutcome());
        dto.setThumbnailUrl(entity.getThumbnailUrl());
        dto.setOgImageUrl(entity.getOgImageUrl());
        // Map services lazily to avoid LazyInitializationException after the transaction closes
        if (entity.getServices() != null) {
            List<ServiceEntity> serviceRefs = new ArrayList<>();
            for (ServiceEntity svc : entity.getServices()) {
                ServiceEntity ref = new ServiceEntity();
                ref.setId(svc.getId());
                ref.setName(svc.getName());
                ref.setSlug(svc.getSlug());
                serviceRefs.add(ref);
            }
            dto.setServices(serviceRefs);
        }
        dto.setPublished(entity.isPublished());
        dto.setFeatured(entity.isFeatured());
        dto.setPublishedAt(entity.getPublishedAt());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setCreatedBy(entity.getCreatedBy());
        return dto;
    }

    @Data
    public static class CaseStudy {
        private UUID id;
        private String slug;
        private String titleVi;
        private String titleEn;
        private String excerptVi;
        private String excerptEn;
        private String contentVi;
        private String contentEn;
        private String outcome;
        private String thumbnailUrl;
        private String ogImageUrl;
        private List<ServiceEntity> services;
        private boolean published;
        private boolean featured;
        private Instant publishedAt;
        private Instant createdAt;
        private Instant updatedAt;
        private UUID createdBy;
    }
}
