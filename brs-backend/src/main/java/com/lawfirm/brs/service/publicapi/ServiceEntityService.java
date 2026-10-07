package com.lawfirm.brs.service.publicapi;

import com.lawfirm.brs.dto.response.ServiceDTO;
import com.lawfirm.brs.entity.ServiceEntity;
import com.lawfirm.brs.exception.ResourceNotFoundException;
import com.lawfirm.brs.mapper.ServiceEntityMapper;
import com.lawfirm.brs.repository.ServiceEntityRepository;
import com.lawfirm.brs.repository.ServiceLawyerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Service for managing legal services (public-facing).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ServiceEntityService {

    private final ServiceEntityRepository serviceRepository;
    private final ServiceEntityMapper serviceMapper;
    private final ServiceLawyerRepository serviceLawyerRepository;

    @Cacheable(value = "services", key = "'all-active'")
    public List<ServiceDTO> getActiveServices() {
        log.debug("Fetching all active services");
        List<ServiceDTO> dtos = serviceMapper.toDTOList(serviceRepository.findByIsActiveTrueAndDeletedAtIsNull());
        populateLawyerIds(dtos);
        return dtos;
    }

    @Cacheable(value = "services", key = "'featured'")
    public List<ServiceDTO> getFeaturedServices() {
        log.debug("Fetching featured services");
        List<ServiceDTO> dtos = serviceMapper.toDTOList(serviceRepository.findByIsFeaturedTrueAndIsActiveTrueAndDeletedAtIsNull());
        populateLawyerIds(dtos);
        return dtos;
    }

    @Cacheable(value = "services", key = "#slug")
    public ServiceDTO getServiceBySlug(String slug) {
        log.debug("Fetching service by slug: {}", slug);
        ServiceEntity service = serviceRepository.findBySlugAndDeletedAtIsNull(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Service not found: " + slug));
        ServiceDTO dto = serviceMapper.toDTOWithDetails(service);
        dto.setLawyerIds(serviceLawyerRepository.findLawyerIdsByServiceId(dto.getId()));
        return dto;
    }

    public ServiceDTO getServiceById(UUID id) {
        log.debug("Fetching service by id: {}", id);
        ServiceEntity service = serviceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Service not found: " + id));
        ServiceDTO dto = serviceMapper.toDTOWithDetails(service);
        dto.setLawyerIds(serviceLawyerRepository.findLawyerIdsByServiceId(dto.getId()));
        return dto;
    }

    public List<ServiceDTO> getServicesByParent(UUID parentId) {
        log.debug("Fetching services by parent id: {}", parentId);
        List<ServiceDTO> dtos = serviceMapper.toDTOList(serviceRepository.findByParentIdAndDeletedAtIsNull(parentId));
        populateLawyerIds(dtos);
        return dtos;
    }

    /**
     * Bulk-populate {@code lawyerIds} for a list of DTOs from the
     * {@code service_lawyers} join table, mirroring the admin-side service's
     * batching strategy so the public catalog and detail endpoints stay in
     * sync with lawyer assignments.
     */
    private void populateLawyerIds(List<ServiceDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) return;
        Set<UUID> serviceIds = new HashSet<>();
        for (ServiceDTO dto : dtos) {
            if (dto.getId() != null) serviceIds.add(dto.getId());
        }
        if (serviceIds.isEmpty()) return;

        Map<UUID, List<UUID>> grouped = new HashMap<>();
        for (UUID serviceId : serviceIds) {
            grouped.put(serviceId, serviceLawyerRepository.findLawyerIdsByServiceId(serviceId));
        }
        for (ServiceDTO dto : dtos) {
            if (dto.getId() != null) {
                dto.setLawyerIds(grouped.getOrDefault(dto.getId(), List.of()));
            }
        }
    }
}
