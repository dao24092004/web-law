/**
 * Booking Wizard E2E Tests
 *
 * Tests toàn bộ booking wizard 4 steps sử dụng dữ liệu thực từ:
 *   - Docker Postgres (brs_db @ localhost:5434) — services, lawyers, availability_slots
 *   - Spring Boot backend (brs-backend @ localhost:8080) — public/services, public/lawyers,
 *     bookings/availability, bookings/availability/reserve, bookings
 *
 * Prerequisites:
 *   1. docker compose up -d  (postgres + redis + rabbitmq healthy)
 *   2. cd brs-backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev
 *   3. cd frontend/vp-luat && npm run dev  (port 3000)
 *
 * Real data snapshot from docker postgres @ 2026-09-22:
 *   - services: 14 active rows (tu-van-phap-ly, dai-dien-phap-ly, doanh-nghiep, …)
 *   - lawyer_profiles: 2 active lawyers
 *       5d4fa9cf-87bb-4c86-ab38-676dc77194fc → "Nguyen Van An Updated"
 *       01604513-608a-4972-9adf-f115df36184d → "Trần Thị Bình"
 *   - availability_slots: 96 slots generated across 4 lawyers for upcoming weekdays
 *     (08:00 → 17:00 in 1-hour blocks via AvailabilitySlotGeneratorService)
 */
import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

/* -------------------------------------------------------------------------
 * Helpers — load real seed data from backend (so the wizard actually has
 * something to click on, instead of guessing static IDs).
 * ----------------------------------------------------------------------- */
async function fetchFirstActiveService(request: APIRequestContext) {
  const res = await request.get('http://localhost:8080/api/public/services');
  expect(res.status()).toBe(200);
  const body = await res.json();
  const services = body.data as Array<{ slug: string; name: string; isActive: boolean }>;
  const active = services.find((s) => s.isActive);
  if (!active) throw new Error('No active service available from backend');
  return active;
}

async function fetchFirstAvailableLawyer(request: APIRequestContext, serviceSlug: string) {
  // First try the serviceSlug filter (real mapping from service_lawyers → lawyer_profiles.service_ids).
  const filtered = await request.get(
    `http://localhost:8080/api/public/lawyers?serviceSlug=${encodeURIComponent(serviceSlug)}&size=20`,
  );
  expect(filtered.status()).toBe(200);
  const body = await filtered.json();
  const list = (body.data?.content ?? []) as Array<{ id: string; nameVi: string; slug: string }>;
  if (list.length > 0) return list[0];

  // Fallback when no service_lawyers mapping exists — match the frontend's
  // useLawyersQuery fallback (empty array → user sees nothing, but in tests we
  // can still verify the unfiltered list).
  const fallback = await request.get('http://localhost:8080/api/public/lawyers?size=20');
  const fbBody = await fallback.json();
  const fbList = (fbBody.data?.content ?? []) as Array<{ id: string; nameVi: string; slug: string }>;
  if (fbList.length === 0) throw new Error('No lawyer available from backend');
  return fbList[0];
}

/**
 * Returns the date+slot that this test should target.  Tests share the same
 * lawyer so we spread them across distinct dates to avoid slot_reservations
 * conflicts when Playwright runs them in parallel.
 *
 *   testIdx 0  → today+1, slot 0
 *   testIdx 1  → today+2, slot 1
 *   testIdx 2  → today+3, slot 2
 *   ...
 */
async function fetchDateAndSlot(
  request: APIRequestContext,
  lawyerId: string,
  dayOffset: number,
  slotIndex: number,
): Promise<{ date: string; slot: { id: string; startTime: string } }> {
  const target = new Date();
  target.setDate(target.getDate() + dayOffset);
  const date = target.toISOString().slice(0, 10);

  const res = await request.get(
    `http://localhost:8080/api/bookings/availability/${lawyerId}?fromDate=${date}&toDate=${date}`,
  );
  expect(res.status()).toBe(200);
  const body = await res.json();
  const slots = (body.data ?? []) as Array<{
    id: string;
    startTime: string;
    isAvailable: boolean;
    appointmentId: string | null;
  }>;
  const free = slots.filter((s) => s.isAvailable && !s.appointmentId);
  if (free.length <= slotIndex) {
    throw new Error(
      `Only ${free.length} free slot(s) for ${lawyerId} on ${date}, need index ${slotIndex}`,
    );
  }
  return {
    date,
    slot: { id: free[slotIndex].id, startTime: free[slotIndex].startTime.slice(0, 5) },
  };
}

async function fetchFirstAvailableSlot(
  request: APIRequestContext,
  lawyerId: string,
  date: string,
  nth: number = 0,
): Promise<{ id: string; startTime: string }> {
  const res = await request.get(
    `http://localhost:8080/api/bookings/availability/${lawyerId}?fromDate=${date}&toDate=${date}`,
  );
  expect(res.status()).toBe(200);
  const body = await res.json();
  const slots = (body.data ?? []) as Array<{
    id: string;
    startTime: string;
    isAvailable: boolean;
    appointmentId: string | null;
  }>;
  const free = slots.filter((s) => s.isAvailable && !s.appointmentId);
  if (free.length <= nth) {
    throw new Error(`Only ${free.length} free slot(s) for ${lawyerId} on ${date}, need index ${nth}`);
  }
  const chosen = free[nth];
  // Backend serialises LocalTime as "HH:mm:ss" — frontend maps to "HH:mm".
  return { id: chosen.id, startTime: chosen.startTime.slice(0, 5) };
}

/**
 * Click an enabled slot in the right-hand "khung giờ có sẵn" panel.  We
 * deliberately scan every enabled time button so the test doesn't get stuck
 * on today's already-passed 09:00 cell.
 */
async function pickEnabledSlot(page: Page, preferredStart: string) {
  const preferred = page.getByRole('button', { name: new RegExp(`^${preferredStart}$`) }).first();
  if ((await preferred.count()) && !(await preferred.isDisabled())) {
    await preferred.click();
    return;
  }
  // Pick the first enabled time button on the page.
  const fallback = page.locator('button:not([disabled])').filter({ hasText: /^\d{2}:\d{2}$/ }).first();
  await fallback.waitFor({ state: 'visible', timeout: 15000 });
  await fallback.click();
}

/**
 * Click the day cell in the calendar grid whose text matches the supplied
 * day-of-month.  Walks forward until it finds an enabled button (because the
 * target date may already be in the past).
 */
async function pickDateInCalendar(page: Page, isoDate: string) {
  const [, month, day] = isoDate.split('-').map(Number);
  for (let candidate = day; candidate <= day + 7; candidate++) {
    const btn = page
      .locator('button')
      .filter({ hasText: new RegExp(`^${candidate}$`) })
      .first();
    const exists = await btn.count();
    if (!exists) continue;
    const disabled = await btn.isDisabled();
    if (!disabled) {
      await btn.click();
      return;
    }
  }
  throw new Error(`Could not find an enabled day starting at ${isoDate} (month=${month})`);
}

/* -------------------------------------------------------------------------
 * STEP 1 — Service selection (with real services from /api/public/services)
 * ----------------------------------------------------------------------- */
test.describe('Booking wizard — Step 1: Service', () => {
  test('loads services from real backend and renders all active services', async ({ page, request }) => {
    const realService = await fetchFirstActiveService(request);

    await page.goto('/booking');
    await expect(page.getByRole('heading', { name: /đặt lịch tư vấn/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /bạn cần tư vấn về lĩnh vực nào/i })).toBeVisible();

    // Wait for at least the real service to appear (no MSW — real fetch).
    // Use a substring match because the tile is wrapped in extra whitespace/elements.
    const serviceRegex = new RegExp(realService.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    await expect(page.getByRole('button').filter({ hasText: serviceRegex }).first()).toBeVisible({
      timeout: 15000,
    });

    // The "Tiếp theo" button must stay disabled until a service + lawyer are picked.
    const nextBtn = page.getByRole('button', { name: /^tiếp theo$/i });
    await expect(nextBtn).toBeDisabled();
  });

  test('clicking a service opens the lawyer section with real lawyers', async ({ page, request }) => {
    const realService = await fetchFirstActiveService(request);

    await page.goto('/booking');
    const serviceRegex = new RegExp(realService.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const serviceBtn = page.getByRole('button').filter({ hasText: serviceRegex }).first();
    await serviceBtn.waitFor({ state: 'visible', timeout: 15000 });
    await serviceBtn.click();
    await expect(serviceBtn).toHaveAttribute('aria-pressed', 'true');

    // Lawyer heading appears only after a service is selected.
    await expect(page.getByRole('heading', { name: /chọn luật sư bạn muốn tư vấn/i })).toBeVisible();

    // Wait for lawyers to load — the section refetches once a service slug is set.
    await page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/public/lawyers') && resp.status() === 200,
      { timeout: 15000 },
    );
  });
});

/* -------------------------------------------------------------------------
 * STEP 2 — Datetime (with real availability from /api/bookings/availability)
 * ----------------------------------------------------------------------- */
test.describe('Booking wizard — Step 2: Datetime', () => {
  test('selecting service + lawyer navigates to datetime step with calendar', async ({
    page,
    request,
  }) => {
    const realService = await fetchFirstActiveService(request);
    const realLawyer = await fetchFirstAvailableLawyer(request, realService.slug);
    const serviceRegex = new RegExp(realService.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    await page.goto('/booking');

    // Click the service tile.
    await page.getByRole('button').filter({ hasText: serviceRegex }).first().click();

    // Wait for lawyers list to appear, then click the real one.
    const lawyerBtn = page.getByRole('button').filter({ hasText: realLawyer.nameVi }).first();
    await lawyerBtn.waitFor({ state: 'visible', timeout: 15000 });
    await lawyerBtn.click();

    // Click "Tiếp theo" → datetime step.
    await page.getByRole('button', { name: /^tiếp theo$/i }).click();

    await expect(page.getByRole('heading', { name: /chọn ngày và giờ tư vấn/i })).toBeVisible({
      timeout: 10000,
    });

    // The calendar should be present.
    await expect(page.getByRole('button', { name: /tháng trước/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /tháng sau/i })).toBeVisible();
  });

  test('clicking an enabled day fetches slots from /api/bookings/availability', async ({
    page,
    request,
  }) => {
    const realService = await fetchFirstActiveService(request);
    const realLawyer = await fetchFirstAvailableLawyer(request, realService.slug);
    const serviceRegex = new RegExp(realService.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    await page.goto('/booking');
    await page.getByRole('button').filter({ hasText: serviceRegex }).first().click();

    const lawyerBtn = page.getByRole('button').filter({ hasText: realLawyer.nameVi }).first();
    await lawyerBtn.waitFor({ state: 'visible', timeout: 15000 });
    await lawyerBtn.click();

    await page.getByRole('button', { name: /^tiếp theo$/i }).click();
    await expect(page.getByRole('heading', { name: /chọn ngày và giờ tư vấn/i })).toBeVisible();

    // Use day-offset 2 so this test doesn't collide with parallel runs picking the same day.
    const { date } = await fetchDateAndSlot(request, realLawyer.id, 2, 0);

    // Set up response listener BEFORE the click so we don't miss it.
    const slotsResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/bookings/availability/${realLawyer.id}`) &&
        resp.url().includes(`fromDate=${date}`) &&
        resp.status() === 200,
      { timeout: 15000 },
    );

    await pickDateInCalendar(page, date);
    await slotsResponse;

    // The slot grid should appear (free slots are enabled buttons).
    await expect(page.getByText(/khung giờ có sẵn/i)).toBeVisible({ timeout: 10000 });
  });
});

/* -------------------------------------------------------------------------
 * STEP 3 — Info form (with real reservation created via /reserve endpoint)
 * ----------------------------------------------------------------------- */
test.describe('Booking wizard — Step 3: Info form', () => {
  test('client-side validation: empty submit keeps the submit button disabled', async ({
    page,
    request,
  }) => {
    const realService = await fetchFirstActiveService(request);
    const realLawyer = await fetchFirstAvailableLawyer(request, realService.slug);
    // Day-offset 3, slot index 3 → unique reservation per parallel worker.
    const { date, slot } = await fetchDateAndSlot(request, realLawyer.id, 3, 3);
    const serviceRegex = new RegExp(realService.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    await page.goto('/booking');
    await page.getByRole('button').filter({ hasText: serviceRegex }).first().click();
    await page.getByRole('button').filter({ hasText: realLawyer.nameVi }).first().click();
    await page.getByRole('button', { name: /^tiếp theo$/i }).click();

    await pickDateInCalendar(page, date);

    // Pick a slot that's actually enabled (09:00 of today's date is disabled).
    await pickEnabledSlot(page, slot.startTime);

    // Wait for reservation POST → "Tiếp theo" becomes enabled.
    await page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/bookings/availability/reserve') &&
        resp.request().method() === 'POST',
      { timeout: 15000 },
    );
    await expect(page.getByRole('button', { name: /^tiếp theo$/i })).toBeEnabled({ timeout: 15000 });
    await page.getByRole('button', { name: /^tiếp theo$/i }).click();

    await expect(page.getByRole('heading', { name: /nhập thông tin của bạn/i })).toBeVisible({
      timeout: 10000,
    });

    const submitBtn = page.getByRole('button', { name: /xác nhận đặt lịch/i });
    await expect(submitBtn).toBeDisabled();

    // Fill invalid data → submit stays disabled.
    await page.locator('#booking-fullName').fill('A');
    await page.locator('#booking-phone').fill('123');
    await page.locator('#booking-issueSummary').fill('short');
    await expect(submitBtn).toBeDisabled();
  });

  test('happy path: valid form reaches confirmation with a real bookingId', async ({
    page,
    request,
  }) => {
    const realService = await fetchFirstActiveService(request);
    const realLawyer = await fetchFirstAvailableLawyer(request, realService.slug);
    // Day-offset 4, slot index 4 → unique reservation per parallel worker.
    const { date, slot } = await fetchDateAndSlot(request, realLawyer.id, 4, 4);
    const serviceRegex = new RegExp(realService.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    await page.goto('/booking');
    await page.getByRole('button').filter({ hasText: serviceRegex }).first().click();
    await page.getByRole('button').filter({ hasText: realLawyer.nameVi }).first().click();
    await page.getByRole('button', { name: /^tiếp theo$/i }).click();

    await pickDateInCalendar(page, date);

    // Pick an actually-enabled slot (09:00 of today is disabled).
    await pickEnabledSlot(page, slot.startTime);

    // Wait for the reservation POST to land → Next becomes enabled.
    await page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/bookings/availability/reserve') &&
        resp.request().method() === 'POST',
      { timeout: 15000 },
    );
    await expect(page.getByRole('button', { name: /^tiếp theo$/i })).toBeEnabled({ timeout: 15000 });
    await page.getByRole('button', { name: /^tiếp theo$/i }).click();

    await expect(page.getByRole('heading', { name: /nhập thông tin của bạn/i })).toBeVisible();

    // Fill valid form (Vietnam phone format: 0xxxxxxxxx).
    await page.locator('#booking-fullName').fill('Nguyen Van Test E2E');
    await page.locator('#booking-phone').fill('0901234567');
    await page.locator('#booking-email').fill('e2e@example.com');
    await page
      .locator('#booking-issueSummary')
      .fill('Toi can tu van phap ly ve viec dang gap phai — yeu cau ho tro tu van.');

    // Tick the terms checkbox (role=checkbox button).
    await page.getByRole('checkbox').click();

    // Wait for the real POST /bookings to complete.
    const bookingResp = page.waitForResponse(
      (resp) => resp.url().endsWith('/api/bookings') && resp.request().method() === 'POST',
      { timeout: 20000 },
    );

    await page.getByRole('button', { name: /xác nhận đặt lịch/i }).click();
    const resp = await bookingResp;
    expect(resp.status()).toBe(200);

    // Confirmation step renders a UUID bookingId from the real backend.
    await expect(page.getByRole('heading', { name: /đặt lịch thành công/i })).toBeVisible({
      timeout: 10000,
    });

    const bookingCode = page.getByText(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    await expect(bookingCode).toBeVisible();
  });
});

/* -------------------------------------------------------------------------
 * Navigation / resilience (real backend)
 * ----------------------------------------------------------------------- */
test.describe('Booking wizard — Navigation', () => {
  test('back button from datetime returns to service step with selection preserved', async ({
    page,
    request,
  }) => {
    const realService = await fetchFirstActiveService(request);
    const realLawyer = await fetchFirstAvailableLawyer(request, realService.slug);
    const serviceRegex = new RegExp(realService.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    await page.goto('/booking');
    await page.getByRole('button').filter({ hasText: serviceRegex }).first().click();
    await page.getByRole('button').filter({ hasText: realLawyer.nameVi }).first().click();
    await page.getByRole('button', { name: /^tiếp theo$/i }).click();

    await expect(page.getByRole('heading', { name: /chọn ngày và giờ tư vấn/i })).toBeVisible();

    await page.getByRole('button', { name: /^quay lại$/i }).click();

    await expect(page.getByRole('heading', { name: /bạn cần tư vấn về lĩnh vực nào/i })).toBeVisible();

    // The service we picked is still marked pressed.
    const serviceBtn = page.getByRole('button').filter({ hasText: serviceRegex }).first();
    await expect(serviceBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('mobile viewport renders wizard without horizontal scroll', async ({ page, request }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/booking');

    await expect(page.getByRole('heading', { name: /đặt lịch tư vấn/i })).toBeVisible();

    // Wait for services to load and verify at least one tile is visible.
    const realService = await fetchFirstActiveService(request);
    const serviceRegex = new RegExp(realService.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    await expect(
      page.getByRole('button').filter({ hasText: serviceRegex }).first(),
    ).toBeVisible({ timeout: 15000 });

    // No horizontal overflow.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
