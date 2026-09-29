import { http, HttpResponse } from 'msw';

const bookedTimes = new Set(['08:00', '09:30', '10:00', '15:00']);
const reservationStore = new Map<string, { expiresAt: string }>();

function createSlots(date: string) {
  const times = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

  return times.map((time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const endHours = minutes + 45 >= 60 ? hours + 1 : hours;
    const endMinutes = (minutes + 45) % 60;

    return {
      slotId: `${date}-${time}`,
      startTime: time,
      endTime: `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`,
      status: bookedTimes.has(time) ? 'booked' : 'available',
    };
  });
}

export const bookingHandlers = [
  // Matches the real backend path used by fetchAvailability:
  //   GET /api/bookings/availability/{lawyerId}?fromDate=...&toDate=...
  http.get('http://localhost:8080/api/bookings/availability/:lawyerId', ({ request, params }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get('fromDate') ?? '2026-06-10';
    const lawyerId = (params.lawyerId as string) ?? 'lawyer-nguyen-van-hung';

    return HttpResponse.json({
      success: true,
      data: createSlots(date).map((slot) => ({
        id: slot.slotId,
        lawyerId,
        slotDate: date,
        startTime: `${slot.startTime}:00`,
        endTime: `${slot.endTime}:00`,
        isAvailable: slot.status === 'available',
        appointmentId: null,
      })),
      timestamp: new Date().toISOString(),
    });
  }),

  // Matches the real backend path used by reserveSlot:
  //   POST /api/bookings/availability/reserve
  http.post('http://localhost:8080/api/bookings/availability/reserve', async ({ request }) => {
    const body = (await request.json()) as {
      lawyerId: string;
      date: string;
      slotId: string;
    };

    if (body.slotId.endsWith('08:00') || body.slotId.endsWith('09:30')) {
      return HttpResponse.json(
        { code: 'SLOT_ALREADY_RESERVED', message: 'Slot already reserved' },
        { status: 409 },
      );
    }

    const [date, startTime] = body.slotId.split(/-(?=\d{2}:\d{2}$)/);
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = minutes + 45 >= 60 ? hours + 1 : hours;
    const endMinutes = (minutes + 45) % 60;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const reservationId = `res_${body.slotId}`;

    reservationStore.set(reservationId, { expiresAt });

    return HttpResponse.json({
      success: true,
      data: {
        reservationId,
        slotId: body.slotId,
        lawyerId: body.lawyerId,
        date,
        startTime,
        endTime: `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`,
        expiresAt,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Matches the real backend path used by releaseReservation:
  //   POST /api/bookings/availability/release
  http.post('http://localhost:8080/api/bookings/availability/release', async ({ request }) => {
    const body = (await request.json()) as { reservationId: string };
    reservationStore.delete(body.reservationId);
    return HttpResponse.json({ success: true, data: null, timestamp: new Date().toISOString() });
  }),

  // Matches the real backend path used by verifyReservation:
  //   GET /api/bookings/availability/reservations/{reservationId}
  http.get('http://localhost:8080/api/bookings/availability/reservations/:reservationId', ({ params }) => {
    const reservationId = params.reservationId as string;
    const reservation = reservationStore.get(reservationId);

    if (!reservation) {
      return HttpResponse.json({
        success: true,
        data: {
          reservationId,
          status: 'expired',
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    return HttpResponse.json({
      success: true,
      data: {
        reservationId,
        status: 'active',
        expiresAt: reservation.expiresAt,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Matches the real backend path used by submitBooking:
  //   POST /api/bookings
  http.post('http://localhost:8080/api/bookings', async ({ request }) => {
    const body = (await request.json()) as {
      reservationId: string;
      serviceId: string;
      lawyerId: string;
      consultationType: string;
      customer: {
        fullName: string;
        phone: string;
        email?: string;
        issueSummary: string;
      };
    };

    if (!reservationStore.has(body.reservationId)) {
      return HttpResponse.json(
        { code: 'RESERVATION_EXPIRED', message: 'Reservation expired' },
        { status: 410 },
      );
    }

    reservationStore.delete(body.reservationId);

    return HttpResponse.json(
      {
        success: true,
        data: {
          id: 'LC123456',
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
];
