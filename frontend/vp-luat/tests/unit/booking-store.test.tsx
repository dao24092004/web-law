import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useBookingStore } from '@/features/booking/hooks';
import type { BookingServiceOption, BookingLawyerOption, BookingTimeSlot, BookingReservation } from '@/features/booking/types';

const mockService: BookingServiceOption = {
  id: 'service-doanh-nghiep',
  slug: 'doanh-nghiep',
  name: 'Luật Doanh nghiệp',
  icon: 'building',
};

const mockLawyer: BookingLawyerOption = {
  id: 'lawyer-nguyen-van-hung',
  name: 'Ls. Nguyễn Văn Hùng',
  initials: 'NVH',
  specialty: 'Doanh nghiệp & M&A',
  rating: 4.9,
  availabilityLabel: 'Còn lịch hôm nay',
  avatarGradient: 'linear-gradient(135deg, #1E3A5F, #2A4F7A)',
};

const mockSlot: BookingTimeSlot = {
  slotId: '2026-06-10-08:30',
  startTime: '08:30',
  endTime: '09:15',
  status: 'available',
};

const mockReservation: BookingReservation = {
  reservationId: 'res_test_123',
  slotId: '2026-06-10-08:30',
  lawyerId: 'lawyer-nguyen-van-hung',
  date: '2026-06-10',
  startTime: '08:30',
  endTime: '09:15',
  expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
};

function createWrapper() {
  function TestQueryProvider({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
  }

  return TestQueryProvider;
}

describe('booking store', () => {
  it('starts at service step with empty state', () => {
    const { result } = renderHook(() => useBookingStore(), { wrapper: createWrapper() });
    expect(result.current.step).toBe('service');
    expect(result.current.service).toBeNull();
    expect(result.current.lawyer).toBeNull();
    expect(result.current.reservation).toBeNull();
    expect(result.current.confirmation).toBeNull();
  });

  it('sets service and resets downstream on different service', () => {
    const { result } = renderHook(() => useBookingStore(), { wrapper: createWrapper() });

    act(() => {
      result.current.setService(mockService);
    });
    expect(result.current.service?.id).toBe('service-doanh-nghiep');

    act(() => {
      result.current.setLawyer(mockLawyer);
    });
    expect(result.current.lawyer?.id).toBe('lawyer-nguyen-van-hung');

    act(() => {
      result.current.setDate('2026-06-10');
    });
    expect(result.current.date).toBe('2026-06-10');

    act(() => {
      result.current.setTimeSlot(mockSlot);
    });
    expect(result.current.timeSlot?.slotId).toBe(mockSlot.slotId);

    act(() => {
      result.current.setReservation(mockReservation);
    });
    expect(result.current.reservation?.reservationId).toBe(mockReservation.reservationId);

    act(() => {
      result.current.setService({ ...mockService, id: 'service-hinh-su', slug: 'hinh-su', name: 'Luật Hình sự', icon: 'gavel' });
    });

    expect(result.current.service?.id).toBe('service-hinh-su');
    expect(result.current.lawyer).toBeNull();
    expect(result.current.date).toBeNull();
    expect(result.current.timeSlot).toBeNull();
    expect(result.current.reservation).toBeNull();
  });

  it('sets lawyer and resets downstream on different lawyer', () => {
    const { result } = renderHook(() => useBookingStore(), { wrapper: createWrapper() });

    act(() => {
      result.current.setService(mockService);
      result.current.setLawyer(mockLawyer);
      result.current.setDate('2026-06-10');
      result.current.setTimeSlot(mockSlot);
      result.current.setReservation(mockReservation);
    });

    act(() => {
      result.current.setLawyer({ ...mockLawyer, id: 'lawyer-tran-thi-lan', name: 'Ls. Trần Thị Lan', initials: 'TTL', specialty: 'Hình sự', rating: 4.7, availabilityLabel: 'Còn lịch', avatarGradient: 'linear-gradient(135deg, #2A4F7A, #C9A84C)' });
    });

    expect(result.current.lawyer?.id).toBe('lawyer-tran-thi-lan');
    expect(result.current.date).toBeNull();
    expect(result.current.timeSlot).toBeNull();
    expect(result.current.reservation).toBeNull();
  });

  it('sets date and resets slot/reservation on date change', () => {
    const { result } = renderHook(() => useBookingStore(), { wrapper: createWrapper() });

    act(() => {
      result.current.setService(mockService);
      result.current.setLawyer(mockLawyer);
      result.current.setDate('2026-06-10');
      result.current.setTimeSlot(mockSlot);
      result.current.setReservation(mockReservation);
    });

    act(() => {
      result.current.setDate('2026-06-11');
    });

    expect(result.current.date).toBe('2026-06-11');
    expect(result.current.timeSlot).toBeNull();
    expect(result.current.reservation).toBeNull();
  });

  it('updates customer info without resetting other state', () => {
    const { result } = renderHook(() => useBookingStore(), { wrapper: createWrapper() });

    act(() => {
      result.current.setCustomerInfo({ fullName: 'Nguyễn Văn A', phone: '0912345678' });
    });

    expect(result.current.customerInfo.fullName).toBe('Nguyễn Văn A');
    expect(result.current.customerInfo.phone).toBe('0912345678');

    act(() => {
      result.current.setCustomerInfo({ email: 'a@example.com' });
    });

    expect(result.current.customerInfo.email).toBe('a@example.com');
    expect(result.current.customerInfo.fullName).toBe('Nguyễn Văn A');
  });

  it('resets all state on resetAll', () => {
    const { result } = renderHook(() => useBookingStore(), { wrapper: createWrapper() });

    act(() => {
      result.current.setService(mockService);
      result.current.setLawyer(mockLawyer);
      result.current.setDate('2026-06-10');
      result.current.setTimeSlot(mockSlot);
      result.current.setReservation(mockReservation);
      result.current.setCustomerInfo({ fullName: 'Nguyễn Văn A' });
      result.current.setConfirmation({ bookingId: 'LC123456', status: 'confirmed', createdAt: new Date().toISOString() });
      result.current.setStep('info');
    });

    act(() => {
      result.current.resetAll();
    });

    expect(result.current.step).toBe('service');
    expect(result.current.service).toBeNull();
    expect(result.current.lawyer).toBeNull();
    expect(result.current.reservation).toBeNull();
    expect(result.current.customerInfo.fullName).toBe('');
  });
});
