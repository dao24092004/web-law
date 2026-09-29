package com.lawfirm.brs.service.erp;

import com.lawfirm.brs.repository.AppointmentRepository;
import com.lawfirm.brs.repository.AuditLogRepository;
import com.lawfirm.brs.repository.LeadRepository;
import com.lawfirm.brs.repository.UserRepository;
import com.lawfirm.brs.service.cache.CacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardErpServiceTest {

    @Mock private LeadRepository leadRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private UserRepository userRepository;
    @Mock private CacheService cacheService;

    private DashboardErpService service;

    @BeforeEach
    void setUp() {
        service = new DashboardErpService(
            leadRepository, appointmentRepository, auditLogRepository, userRepository, cacheService);
    }

    @Test
    @DisplayName("leadFunnel returns zero counts when no leads in range")
    void leadFunnel_empty() {
        when(leadRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
        when(leadRepository.countByStatusAndCreatedAtBetween(any(), any(), any())).thenReturn(0L);

        var result = service.leadFunnel("week");

        assertThat(result.getTotal()).isZero();
        assertThat(result.getConverted()).isZero();
        assertThat(result.getConversionRate()).isZero();
    }

    @Test
    @DisplayName("leadFunnel computes conversion rate correctly")
    void leadFunnel_withData() {
        when(leadRepository.countByCreatedAtBetween(any(), any())).thenReturn(20L);
        when(leadRepository.countByStatusAndCreatedAtBetween(eq(com.lawfirm.brs.constants.LeadStatus.CONTACTED), any(), any())).thenReturn(10L);
        when(leadRepository.countByStatusAndCreatedAtBetween(eq(com.lawfirm.brs.constants.LeadStatus.QUALIFIED), any(), any())).thenReturn(5L);
        when(leadRepository.countByStatusAndCreatedAtBetween(eq(com.lawfirm.brs.constants.LeadStatus.WON), any(), any())).thenReturn(4L);

        var result = service.leadFunnel("week");

        assertThat(result.getTotal()).isEqualTo(20L);
        assertThat(result.getContacted()).isEqualTo(10L);
        assertThat(result.getQualified()).isEqualTo(5L);
        assertThat(result.getConverted()).isEqualTo(4L);
        assertThat(result.getConversionRate()).isEqualTo(20.0);
    }

    @Test
    @DisplayName("serviceDistribution returns empty list when no data")
    void serviceDistribution_empty() {
        when(leadRepository.countByServiceInRange(any(), any())).thenReturn(List.of());

        var result = service.serviceDistribution("week");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("serviceDistribution computes percentages")
    void serviceDistribution_withData() {
        when(leadRepository.countByServiceInRange(any(), any())).thenReturn(List.of(
            new Object[] { "tu-van-doanh-nghiep", 6L },
            new Object[] { "so-huu-tri-tue", 4L }
        ));

        var result = service.serviceDistribution("week");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getLabel()).isEqualTo("tu-van-doanh-nghiep");
        assertThat(result.get(0).getCount()).isEqualTo(6L);
        assertThat(result.get(0).getPercentage()).isEqualTo(60.0);
        assertThat(result.get(1).getPercentage()).isEqualTo(40.0);
    }

    @Test
    @DisplayName("visitorSeries returns N days of buckets")
    void visitorSeries_buckets() {
        when(cacheService.getOrLoad(anyString(), anyString(), any(com.fasterxml.jackson.core.type.TypeReference.class), any(), any(java.time.Duration.class)))
            .thenAnswer(inv -> ((java.util.function.Supplier<?>) inv.getArgument(3)).get());
        when(leadRepository.findAll()).thenReturn(List.of());

        var result = service.visitorSeries(7);

        assertThat(result).hasSize(7);
        assertThat(result.get(0).getLabel()).isNotBlank();
    }
}
