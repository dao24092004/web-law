'use client';

import { useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAvailability,
  fetchLawyerById,
  fetchLawyers,
  releaseReservation,
  reserveSlot,
  submitBooking,
  verifyReservation,
  type ReserveSlotPayload,
  type SubmitBookingPayload,
} from '../api';

export function useLawyersQuery(serviceSlug?: string) {
  return useQuery({
    queryKey: ['booking-lawyers', serviceSlug],
    queryFn: () => fetchLawyers(serviceSlug),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLawyerByIdQuery(lawyerId: string | null) {
  return useQuery({
    queryKey: ['booking-lawyer', lawyerId],
    queryFn: () => fetchLawyerById(lawyerId!),
    enabled: Boolean(lawyerId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAvailabilityQuery(params: { lawyerId: string | null; date: string | null }) {
  return useQuery({
    queryKey: ['booking-slots', params.lawyerId, params.date],
    queryFn: () => fetchAvailability({ lawyerId: params.lawyerId!, date: params.date! }),
    enabled: Boolean(params.lawyerId && params.date),
  });
}

export function useReserveSlotMutation() {
  return useMutation({
    mutationFn: (payload: ReserveSlotPayload) => reserveSlot(payload),
  });
}

export function useReleaseReservationMutation() {
  return useMutation({
    mutationFn: (reservationId: string) => releaseReservation(reservationId),
  });
}

export function useVerifyReservationQuery(reservationId: string | null) {
  return useQuery({
    queryKey: ['booking-reservation', reservationId],
    queryFn: () => verifyReservation(reservationId!),
    enabled: Boolean(reservationId),
    refetchOnWindowFocus: true,
  });
}

export function useSubmitBookingMutation() {
  return useMutation({
    mutationFn: (payload: SubmitBookingPayload) => submitBooking(payload),
  });
}

const POLL_INTERVAL_MS = 30_000;

export function useSlotPolling(lawyerId: string | null, date: string | null) {
  const queryClient = useQueryClient();

  const poll = useCallback(() => {
    if (!lawyerId || !date) {
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['booking-slots', lawyerId, date] });
  }, [queryClient, lawyerId, date]);

  useEffect(() => {
    if (!lawyerId || !date) {
      return;
    }

    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [lawyerId, date, poll]);
}

export function useReservationPolling(reservationId: string | null) {
  const queryClient = useQueryClient();

  const poll = useCallback(() => {
    if (!reservationId) {
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['booking-reservation', reservationId] });
  }, [queryClient, reservationId]);

  useEffect(() => {
    if (!reservationId) {
      return;
    }

    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [reservationId, poll]);
}

export function useVisibilityRefetch(lawyerId: string | null, date: string | null, reservationId: string | null) {
  const queryClient = useQueryClient();

  const refetchOnFocus = useCallback(() => {
    if (document.visibilityState !== 'visible') {
      return;
    }

    if (lawyerId && date) {
      queryClient.invalidateQueries({ queryKey: ['booking-slots', lawyerId, date] });
    }

    if (reservationId) {
      queryClient.invalidateQueries({ queryKey: ['booking-reservation', reservationId] });
    }
  }, [queryClient, lawyerId, date, reservationId]);

  useEffect(() => {
    document.addEventListener('visibilitychange', refetchOnFocus);
    return () => document.removeEventListener('visibilitychange', refetchOnFocus);
  }, [refetchOnFocus]);
}
