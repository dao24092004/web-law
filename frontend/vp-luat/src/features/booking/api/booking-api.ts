import { apiClient } from '@/lib/api';
import type {
  BookingConfirmation,
  BookingConsultationType,
  BookingReservation,
  BookingTimeSlot,
} from '../types';

export interface LawyerApiResponse {
  id: string;
  userId: string;
  userEmail: string;
  slug: string;
  nameVi: string;
  nameEn: string;
  bioVi?: string;
  bioEn?: string;
  positionVi?: string;
  positionEn?: string;
  avatarUrl?: string;
  isFeatured?: boolean;
  rating?: number;
  reviewCount?: number;
  isAvailableToday?: boolean;
  serviceIds?: string[];
  serviceNames?: string[];
  serviceSlugs?: string[];
}

export interface AvailabilitySlot {
  id: string;
  lawyerId: string;
  slotDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss (LocalTime serialized)
  endTime: string;   // HH:mm:ss
  isAvailable: boolean;
  appointmentId: string | null;
}

export interface AvailabilityResponse {
  date: string;
  lawyerId: string;
  slots: BookingTimeSlot[];
}

export interface ReserveSlotPayload {
  lawyerId: string;
  date: string;       // YYYY-MM-DD
  slotId: string;     // AvailabilitySlot.id (UUID)
}

export interface SubmitBookingPayload {
  reservationId: string;
  serviceId: string;
  lawyerId: string;
  consultationType: BookingConsultationType;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
    issueSummary: string;
  };
}

/**
 * Backend wraps payloads in { success, message, data, timestamp }.
 * The availability endpoint returns `data` as a flat array, while
 * reserve/release/verify return `data` as a single object.
 */
function unwrap<T>(payload: { data?: T; success?: boolean } | T): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as object) && 'success' in (payload as object)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function formatLocalTime(value: string): string {
  // Backend serializes LocalTime as "HH:mm:ss" (or "HH:mm:ss.SSS").
  // The frontend expects the shorter "HH:mm" form.
  if (!value) {
    return value;
  }
  const match = value.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : value;
}

function toBookingTimeSlot(slot: AvailabilitySlot): BookingTimeSlot {
  return {
    slotId: slot.id,
    startTime: formatLocalTime(slot.startTime),
    endTime: formatLocalTime(slot.endTime),
    status: slot.isAvailable && !slot.appointmentId ? 'available' : 'booked',
  };
}

export async function fetchAvailability(params: {
  lawyerId: string;
  date: string;
}): Promise<AvailabilityResponse> {
  const response = await apiClient.get<{ data: AvailabilitySlot[] }>(
    `/bookings/availability/${params.lawyerId}`,
    {
      params: { fromDate: params.date, toDate: params.date },
    },
  );

  const unwrapped = unwrap(response.data);
  const slots = (Array.isArray(unwrapped) ? unwrapped : []).map(toBookingTimeSlot);
  return { date: params.date, lawyerId: params.lawyerId, slots };
}

export async function reserveSlot(payload: ReserveSlotPayload): Promise<BookingReservation> {
  const response = await apiClient.post<{ data: BookingReservation }>(
    '/bookings/availability/reserve',
    { lawyerId: payload.lawyerId, date: payload.date, slotId: payload.slotId },
  );
  return unwrap(response.data);
}

export async function releaseReservation(reservationId: string): Promise<void> {
  await apiClient.post('/bookings/availability/release', { reservationId });
}

export async function verifyReservation(reservationId: string): Promise<BookingReservation> {
  const response = await apiClient.get<{ data: BookingReservation }>(
    `/bookings/availability/reservations/${reservationId}`,
  );
  return unwrap(response.data);
}

// Backend returns the full AppointmentDTO (which has `id`, not `bookingId`).
// Map the response into the slim shape the booking store expects.
interface AppointmentResponse {
  id?: string;
  status?: string;
  createdAt?: string;
}

export async function submitBooking(payload: SubmitBookingPayload): Promise<BookingConfirmation> {
  const response = await apiClient.post<{ data: AppointmentResponse }>('/bookings', payload);
  const appt = unwrap(response.data) ?? {};
  return {
    bookingId: appt.id ?? '',
    status:
      appt.status === 'CONFIRMED'
        ? 'confirmed'
        : 'pending_confirmation',
    createdAt: appt.createdAt ?? new Date().toISOString(),
  };
}

export async function fetchLawyers(serviceSlug?: string): Promise<LawyerApiResponse[]> {
  const params: Record<string, string> = {};
  if (serviceSlug) params.serviceSlug = serviceSlug;

  const response = await apiClient.get<{ data: { content: LawyerApiResponse[] } }>('/public/lawyers', { params });
  return unwrap(response.data).content;
}

export async function fetchLawyerById(lawyerId: string): Promise<LawyerApiResponse | null> {
  try {
    const response = await apiClient.get<{ data: LawyerApiResponse }>(`/public/lawyers/by-id/${lawyerId}`);
    return unwrap(response.data) ?? null;
  } catch (error) {
    console.error('Failed to fetch lawyer by id:', error);
    return null;
  }
}

