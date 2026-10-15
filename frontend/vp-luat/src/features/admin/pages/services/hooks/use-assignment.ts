'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from '@/lib/api/hooks';
import { ghiAudit, notifySuccess, notifyError } from '@/features/admin/lib';
import { useServices } from './use-services';
import { useLawyers } from './use-lawyers';

// Share types with the other hooks files
export type { Service, Lawyer } from './use-services';

import type { Service, Lawyer } from './use-services';

export function useAssignment() {
  const { data: services = [], refetch: refetchServices, error: servicesError } = useServices();
  const { data: lawyers = [], refetch: refetchLawyers, error: lawyersError } = useLawyers();

  const qc = useQueryClient();

  const updateServiceMutation = useApiMutation<Service, { id: string; body: Partial<Service> }>(
    'PUT',
    (vars) => `/admin/services/${vars.id}`,
    {
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: ['services'] });
        ghiAudit({
          action: 'assign',
          entity: 'service_assignment',
          entityId: data.id,
          entityLabel: data.name,
        });
      },
      onError: (e) => {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể cập nhật phân công');
      },
    },
  );

  const updateLawyerMutation = useApiMutation<Lawyer, { id: string; body: Partial<Lawyer> }>(
    'PATCH',
    (vars) => `/admin/lawyers/${vars.id}`,
    {
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: ['lawyers'] });
        ghiAudit({
          action: 'assign',
          entity: 'service_assignment',
          entityId: data.id,
          entityLabel: data.name,
        });
      },
      onError: (e) => {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể cập nhật phân công');
      },
    },
  );

  const isAssigned = useCallback(
    (serviceId: string, lawyerId: string): boolean => {
      const svc = services.find((s) => s.id === serviceId);
      return Boolean(svc?.lawyerIds?.includes(lawyerId));
    },
    [services],
  );

  const toggle = useCallback(
    (serviceId: string, lawyerId: string) => {
      const svc = services.find((s) => s.id === serviceId);
      const lwy = lawyers.find((l) => l.id === lawyerId);
      if (!svc || !lwy) return;

      const isOn = svc.lawyerIds?.includes(lawyerId) ?? false;
      const newServiceLawyerIds = isOn
        ? (svc.lawyerIds ?? []).filter((id) => id !== lawyerId)
        : [...(svc.lawyerIds ?? []), lawyerId];
      const newLawyerServiceIds = isOn
        ? (lwy.serviceIds ?? []).filter((id) => id !== serviceId)
        : [...(lwy.serviceIds ?? []), serviceId];

      // Backend ServiceRequest requires slug + name (@NotBlank), so send them along.
      updateServiceMutation.mutate({
        id: serviceId,
        body: { slug: svc.slug, name: svc.name, lawyerIds: newServiceLawyerIds },
      });
      updateLawyerMutation.mutate({ id: lawyerId, body: { serviceIds: newLawyerServiceIds } });

      ghiAudit({
        action: 'assign',
        entity: 'service_assignment',
        entityId: `${serviceId}:${lawyerId}`,
        entityLabel: `${svc.name} ↔ ${lwy.name}`,
      });
    },
    [services, lawyers, updateServiceMutation, updateLawyerMutation],
  );

  const saveBatch = useCallback(
    async (matrix: Record<string, string[]>) => {
      try {
        let changes = 0;
        for (const [serviceId, lawyerIds] of Object.entries(matrix)) {
          const svc = services.find((s) => s.id === serviceId);
          if (!svc) continue;
          const oldSet = new Set(svc.lawyerIds ?? []);
          const newSet = new Set(lawyerIds);
          if (
            oldSet.size === newSet.size &&
            [...oldSet].every((id) => newSet.has(id))
          ) {
            continue;
          }
          updateServiceMutation.mutate({
            id: serviceId,
            body: { slug: svc.slug, name: svc.name, lawyerIds },
          });
          for (const lid of lawyerIds) {
            const lwy = lawyers.find((l) => l.id === lid);
            if (lwy && !(lwy.serviceIds ?? []).includes(serviceId)) {
              updateLawyerMutation.mutate({
                id: lid,
                body: { serviceIds: [...(lwy.serviceIds ?? []), serviceId] },
              });
            }
          }
          for (const oldLid of oldSet) {
            if (!newSet.has(oldLid)) {
              const lwy = lawyers.find((l) => l.id === oldLid);
              if (lwy) {
                updateLawyerMutation.mutate({
                  id: oldLid,
                  body: { serviceIds: (lwy.serviceIds ?? []).filter((id) => id !== serviceId) },
                });
              }
            }
          }
          changes += 1;
        }
        if (changes > 0) {
          ghiAudit({
            action: 'update',
            entity: 'assignment_matrix',
            entityId: 'batch',
            entityLabel: `${changes} dịch vụ`,
          });
          notifySuccess(`Đã lưu phân công (${changes} dịch vụ thay đổi)`);
        } else {
          notifySuccess('Không có thay đổi');
        }
        refetchServices();
        refetchLawyers();
      } catch (e) {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể lưu');
      }
    },
    [services, lawyers, refetchServices, refetchLawyers, updateServiceMutation, updateLawyerMutation],
  );

  return {
    services: services.filter((s) => s.isActive),
    lawyers: lawyers.filter((l) => l.isActive),
    servicesError,
    lawyersError,
    isAssigned,
    toggle,
    saveBatch,
  };
}
