import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

interface Service {
  name: string;
  slug: string;
  isActive?: boolean;
}

interface Lawyer {
  id: string;
  nameVi: string;
}

async function fetchServices(request: APIRequestContext): Promise<Service[]> {
  const response = await request.get(
    "http://localhost:8080/api/public/services",
  );
  expect(response.status()).toBe(200);
  const body = await response.json();
  return (body.data as Service[]).filter((item) => item.isActive !== false);
}

async function fetchFirstService(request: APIRequestContext): Promise<Service> {
  const service = (await fetchServices(request))[0];
  if (!service) throw new Error("No active service available from backend");
  return service;
}

async function fetchLawyer(
  request: APIRequestContext,
  service: Service,
): Promise<Lawyer> {
  const response = await request.get(
    `http://localhost:8080/api/public/lawyers?serviceSlug=${encodeURIComponent(service.slug)}&size=20`,
  );
  expect(response.status()).toBe(200);
  const body = await response.json();
  const lawyers = (body.data?.content ?? []) as Lawyer[];
  if (!lawyers.length)
    throw new Error(`No lawyer available for service ${service.slug}`);
  return lawyers[0];
}

function textRegex(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

async function selectServiceAndLawyer(
  page: Page,
  request: APIRequestContext,
): Promise<{ service: Service; lawyer: Lawyer }> {
  const services = await fetchServices(request);
  await expect(
    page.getByRole("heading", { name: /bạn cần tư vấn/i }),
  ).toBeVisible({
    timeout: 15000,
  });

  const serviceButton = page.getByRole("button").filter({ hasText: /.+/ });
  let service: Service | undefined;
  for (const candidate of services) {
    if (
      await serviceButton.filter({ hasText: textRegex(candidate.name) }).count()
    ) {
      service = candidate;
      break;
    }
  }
  if (!service) throw new Error("No active service rendered by booking page");

  const lawyer = await fetchLawyer(request, service);
  await serviceButton
    .filter({ hasText: textRegex(service.name) })
    .first()
    .click();
  await page
    .getByRole("button")
    .filter({ hasText: textRegex(lawyer.nameVi) })
    .first()
    .click();
  return { service, lawyer };
}

async function fetchDateWithFreeSlot(
  request: APIRequestContext,
  lawyerId: string,
): Promise<string> {
  for (let offset = 1; offset <= 14; offset += 1) {
    const target = new Date();
    target.setDate(target.getDate() + offset);
    const date = target.toISOString().slice(0, 10);
    const response = await request.get(
      `http://localhost:8080/api/bookings/availability/${lawyerId}?fromDate=${date}&toDate=${date}`,
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    const hasFreeSlot = (body.data ?? []).some(
      (slot: { isAvailable?: boolean; appointmentId?: string | null }) =>
        slot.isAvailable && !slot.appointmentId,
    );
    if (hasFreeSlot) return date;
  }
  throw new Error(`No free availability found for lawyer ${lawyerId}`);
}

async function selectCalendarDate(page: Page, isoDate: string): Promise<void> {
  const day = page
    .locator("button:not([disabled])")
    .filter({ hasText: new RegExp(`^${Number(isoDate.slice(-2))}$`) })
    .first();
  await day.waitFor({ state: "visible", timeout: 15000 });
  await day.click();
}

test.describe("booking flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/booking");
  });

  test("renders booking page and service step", async ({ page, request }) => {
    await expect(
      page.getByRole("heading", { name: /đặt lịch tư vấn/i }),
    ).toBeVisible();
    await selectServiceAndLawyer(page, request).then(({ service }) =>
      expect(service.name).toBeTruthy(),
    );
  });

  test("selects service and lawyer then proceeds to datetime step", async ({
    page,
    request,
  }) => {
    await selectServiceAndLawyer(page, request);
    const nextButton = page.getByRole("button", { name: /^tiếp theo$/i });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    await expect(
      page.getByRole("heading", { name: /chọn ngày và giờ/i }),
    ).toBeVisible();
  });

  test("back navigation from datetime to service step", async ({
    page,
    request,
  }) => {
    await selectServiceAndLawyer(page, request);
    await page.getByRole("button", { name: /^tiếp theo$/i }).click();
    await page.getByRole("button", { name: /quay lại/i }).click();
    await expect(
      page.getByRole("heading", { name: /bạn cần tư vấn về lĩnh vực nào/i }),
    ).toBeVisible();
  });

  test("service grid is responsive at mobile width", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/booking");
    const service = await fetchFirstService(request);
    await expect(
      page
        .getByRole("button")
        .filter({ hasText: textRegex(service.name) })
        .first(),
    ).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("heading", { name: /đặt lịch tư vấn/i }),
    ).toBeVisible();
  });
});

test.describe("booking slot conflict", () => {
  test("shows conflict error when slot already reserved", async ({
    page,
    request,
  }) => {
    await page.goto("/booking");
    const { lawyer } = await selectServiceAndLawyer(page, request);
    const date = await fetchDateWithFreeSlot(request, lawyer.id);

    const reserveResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/bookings/availability/reserve") &&
        response.request().method() === "POST",
    );

    await page.route("**/api/bookings/availability/reserve", async (route) => {
      const payload = route.request().postDataJSON() as {
        lawyerId?: string;
        date?: string;
        slotId?: string;
      };
      expect(payload.lawyerId).toBe(lawyer.id);
      expect(payload.date).toBe(date);
      expect(payload.slotId).toBeTruthy();
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          code: "SLOT_ALREADY_BOOKED",
          message: "This slot is no longer available",
        }),
      });
    });

    await page.getByRole("button", { name: /^tiếp theo$/i }).click();
    await expect(
      page.getByRole("heading", { name: /chọn ngày và giờ/i }),
    ).toBeVisible();
    await selectCalendarDate(page, date);

    const slot = page
      .locator("button:not([disabled])")
      .filter({ hasText: /^\d{2}:\d{2}$/ })
      .first();
    await slot.waitFor({ state: "visible", timeout: 15000 });
    await slot.click();
    expect((await reserveResponse).status()).toBe(400);

    await expect(
      page.getByText(/khung giờ này vừa được người khác giữ/i),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("button", { name: /^tiếp theo$/i }),
    ).toBeDisabled();
  });
});
