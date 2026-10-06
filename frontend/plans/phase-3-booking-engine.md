# Phase 3: Booking Engine
## Week 5-6 — Công ty Luật TNHH ICRC

---

## Phase Overview

**Mục tiêu**: Xây dựng booking engine 4 bước cho website ICRC Law, cho phép khách hàng chọn dịch vụ, luật sư, khung giờ và gửi yêu cầu tư vấn với cơ chế **slot reservation** để tránh double booking.

**Design Reference**: `frontend/demo/booking.html` — **ĐÂY LÀ NGUỒN THAM KHAO CHÍNH XÁC CHO BOOKING UI/UX**

**Source of Truth**:
- `frontend/demo/booking.html` — layout, spacing, component states, responsive behavior, copy structure, interaction flow
- `frontend/plans/BRS_v2_FRONTEND.md` — đặc biệt phần `Phase 3: Booking Engine`
- Trạng thái hiện tại của app trong `frontend/vp-luat/src/app`
- Các public entry points đã hoàn thành ở Phase 2 để dẫn người dùng sang `/booking`

**Timeline**: Week 5-6 (14 ngày)

**Ship Criteria**:
- Booking flow hoạt động end-to-end
- Giữ state khi refresh
- Xử lý conflict / reservation expiry rõ ràng
- Có test cho các luồng quan trọng
- **Giao diện bám sát `frontend/demo/booking.html` về hierarchy, spacing, states và responsive behavior**

---

## Executive Summary

Phase 3 không được hiểu là “làm một form booking có logic đúng”.

Phase này phải đạt đồng thời 3 tầng chất lượng:

1. **Tầng thị giác**
   - Booking page phải nhìn và vận hành như demo tại `frontend/demo/booking.html`
   - Không tái thiết kế layout theo hướng dashboard, generic form wizard, hay checkout pattern khác demo

2. **Tầng nghiệp vụ**
   - Có chọn dịch vụ, luật sư, ngày/giờ, hình thức tư vấn, thông tin khách hàng
   - Có reservation lifecycle để tránh double booking

3. **Tầng độ bền hệ thống**
   - Refresh không phá flow
   - Conflict / expiry xử lý recoverable
   - State và API contract sẵn sàng tái sử dụng cho chatbot/admin ở Phase sau

Nếu chỉ đạt logic mà không đạt demo parity thì Phase 3 **chưa được xem là done**.

---

## Demo Booking Page Analysis

Dựa trên `frontend/demo/booking.html`, booking page có cấu trúc trải nghiệm chính như sau:

```text
1. Mini Nav
   - Brand icon + firm name
   - Hotline nổi bật

2. Booking Hero
   - Gradient dark background
   - H1
   - Supporting text
   - 3 trust indicators

3. Progress Bar
   - 3 visible progress nodes trong demo
   - active/done states
   - line fill animation

4. Step 1
   - Heading + subheading
   - Service selection grid (8 cards)
   - Lawyer section xuất hiện sau khi chọn service
   - Lawyer grid (3 cards)
   - Next CTA

5. Step 2
   - Heading + subheading
   - 2-column datetime grid
   - Left: calendar card
   - Right: available slots card + consultation type
   - Back + Next CTA

6. Step 3
   - Heading + subheading
   - 2-column layout
   - Left: info form
   - Right: sticky summary card
   - Back + submit CTA

7. Step 4
   - Success confirmation
   - Receipt card
   - Notice
   - CTA actions

8. Footer
   - Simple legal footer riêng cho booking page demo
```

### Important Note About Step Count

Demo HTML hiển thị **3 progress labels**:
- Chọn dịch vụ
- Chọn lịch
- Thông tin

Nhưng về business flow của Phase 3, project có thể tiếp tục dùng mô hình nội bộ 4 bước logic:
- service
- lawyer
- datetime
- info/confirm

**Khuyến nghị triển khai**:
- Ở UI, giữ progress shell giống demo
- Ở domain/state, vẫn có thể tách lawyer thành sub-step hoặc logical step riêng nếu cần
- Không để việc tách step nội bộ làm thay đổi visual flow so với demo

---

## Non-Negotiable Principles

### 1. Demo-First, Not Reinvention
- Không sáng tạo booking UI mới
- Không đổi thứ tự block lớn nếu không có lý do kỹ thuật rất mạnh
- Không thay đổi tone visual của booking page sang style khác homepage demo

### 2. Componentize Without Losing Shape
- Chuyển demo HTML sang React components nhỏ
- Nhưng phải giữ nguyên hierarchy của DOM và CSS states quan trọng
- Refactor kiến trúc được phép, refactor trải nghiệm thì không

### 3. Accessibility Is Additive
- Có thể thêm ARIA, keyboard support, semantic labels
- Nhưng không được làm lệch spacing, state, transition, density của demo

### 4. Business Logic Must Be Stronger Than Demo
- Demo chỉ có flow client-side đơn giản
- Product implementation thật phải thêm reservation, persistence, recovery, analytics, testing
- Những phần “mạnh hơn demo” phải được cài phía dưới, không phá visual demo

---

## Visual Fidelity Requirements

Booking phase phải đạt các mức tương đồng sau với `frontend/demo/booking.html`.

### 1. Layout Fidelity
- Mini-nav, hero, progress bar và booking body giữ đúng thứ tự như demo
- `max-width`, padding ngang, khoảng cách dọc, card radius, border, shadow phải bám demo
- Step 2 dùng 2 cột `calendar + slots`
- Step 3 dùng 2 cột `form + sticky summary`
- Footer booking không được phình thành global footer nặng nếu làm sai cảm giác demo page

### 2. Component Fidelity
- Service cards có selected state với accent border + check badge góc phải
- Lawyer cards có avatar initials, specialty, rating, availability pill
- Calendar có weekday row, today state, has-slot dot, selected state, disabled weekends/past dates
- Slots có hover, selected, booked state rõ ràng
- Consultation type cards có radio-like selected treatment
- Form inputs có focus ring, error border, inline field error giống tinh thần demo
- Summary card có icon blocks, grouped rows, highlighted “Miễn phí” box, security note
- Confirmation page có success icon, receipt card, notice panel, dual CTA

### 3. Motion Fidelity
- Step chuyển trang có animation nhẹ kiểu `stepIn`
- Lawyer section xuất hiện bằng fade/slide sau khi chọn service
- Hover states dịch chuyển rất nhẹ, không aggressive
- Progress line fill có animation mượt
- Confirmation icon có cảm giác “pop in” giống demo

### 4. Responsive Fidelity
- `<= 768px`
  - service grid từ 4 cột → 2 cột
  - lawyer grid từ 3 cột → 2 cột
  - datetime grid → 1 cột
  - step3 grid → 1 cột
  - summary card bỏ sticky
  - confirmation actions xếp dọc
- `<= 480px`
  - lawyer grid → 1 cột
  - mini-nav ẩn bớt firm name
  - progress labels nhỏ lại
  - slots grid giữ mật độ hợp lý

### 5. Copy Fidelity
- Headings, subheadings, trust indicators, labels và CTA text nên giữ gần demo
- Chỉ thay đổi copy khi phục vụ logic thật như reservation expiry, conflict, validation, retry

---

## Current State Assessment

Dựa trên codebase hiện tại:

- Public website đã có nền tảng route và layout chung
- Homepage đang render theo hướng feature-based tại `src/app/page.tsx`
- Layout gốc đã có providers, footer và floating widgets tại `src/app/layout.tsx`
- Landing pages đã có module riêng trong `src/features/landing-pages/`
- Chưa có booking route riêng
- Chưa có `src/features/booking/`
- Chưa có booking store chuyên biệt
- Chưa có booking API layer typed rõ ràng

**Kết luận**:
Phase 3 nên dựng mới bounded context `booking` theo đúng kiến trúc feature-first, nhưng **shape UI phải xuất phát trực tiếp từ demo booking page**.

---

## Product Goals for Phase 3

Booking engine cần giải được 7 mục tiêu sản phẩm:

1. **Chuyển đổi tốt từ public pages sang booking**
   - CTA từ homepage, service pages, lawyer pages, FAQ, contact blocks đều dẫn được sang `/booking`

2. **Đặt lịch rõ ràng, ít ma sát**
   - Luồng dễ hiểu
   - Tiến trình rõ ràng
   - Thông tin tóm tắt luôn nhìn thấy ở step cuối

3. **Giữ cảm giác cao cấp, tin cậy như demo**
   - Booking page là một landing transactional page, không phải form kỹ thuật khô cứng

4. **Tránh double booking**
   - Slot phải được reserve trước khi submit
   - Reservation có `reservationId` và `expiresAt` từ server

5. **Bền vững khi refresh / idle / back**
   - Persist state bằng `sessionStorage`
   - Revalidate reservation trước khi cho submit tiếp

6. **Hỗ trợ recovery rõ ràng khi lỗi**
   - Conflict, expiry, validation, network fail đều có đường lui hợp lý

7. **Sẵn sàng cho Phase 4-5**
   - Analytics funnel đủ tốt để nối với chatbot/admin/reporting sau này

---

## User Journey

### Happy Path

```text
User click CTA từ public page
→ vào /booking
→ thấy mini-nav + hero + trust indicators
→ chọn service
→ luật sư section hiện ra
→ chọn lawyer
→ bấm tiếp theo
→ chọn ngày
→ chọn giờ
→ chọn hình thức tư vấn
→ reserve slot
→ sang bước nhập thông tin
→ điền form
→ xem summary
→ xác nhận đặt lịch
→ booking thành công
→ xem receipt + CTA tiếp theo
```

### Error / Recovery Branches

- Slot vừa bị người khác giữ
  - báo conflict
  - refetch slot list
  - giữ các lựa chọn khác nếu còn hợp lệ

- Reservation hết hạn trong lúc user nhập form
  - thông báo rõ
  - clear reservation
  - quay về step chọn lịch

- Submit lỗi 422
  - map lỗi về field / form region
  - không mất dữ liệu đã nhập

- Submit lỗi 5xx / network
  - show retry path
  - giữ nguyên summary và form data

- Refresh giữa chừng
  - restore state từ session
  - verify reservation với server
  - nếu invalid thì rollback mềm về bước chọn giờ

- User đổi service sau khi đã chọn slot
  - reset lawyer/date/slot/reservation phụ thuộc
  - không để local state mâu thuẫn

---

## Phase Scope

### In Scope

- Route public `/booking`
- Booking wizard theo shape demo
- Progress indicator và step shell
- Client state cho booking flow
- Persist state bằng `sessionStorage`
- Availability fetch + slot reservation + release flow
- Countdown timer theo `expiresAt` từ server
- Booking submit + conflict recovery
- Error boundary riêng cho booking subtree
- Analytics events cho booking funnel
- Unit / integration / E2E coverage cho critical flows
- **Visual parity với `frontend/demo/booking.html` cho toàn bộ booking page**

### Out of Scope

- Thanh toán online
- Đồng bộ Google Calendar / Outlook server-side thật
- CRM admin booking management UI
- Reschedule / cancel booking bởi end user
- Chatbot-triggered booking handoff
- Multi-language booking copy production hoàn chỉnh
- Thiết kế lại booking page khác demo
- Thay progress shell demo bằng checkout UI hoặc form wizard generic

### Visual Scope Mapping from Demo

Các khối UI sau phải được map trực tiếp từ demo sang implementation:

- `.mini-nav`
- `.booking-hero`
- `.progress-bar`
- `.service-grid` / `.service-card`
- `.lawyer-section` / `.lawyer-grid` / `.lawyer-select-card`
- `.datetime-grid` / `.calendar-card` / `.slots-card`
- `.consult-type` / `.consult-option`
- `.step3-grid` / `.info-form` / `.summary-card`
- `.confirmation` / `.booking-receipt`
- `.booking-footer`
- selected / booked / disabled / empty / error / done / active states

---

## Architecture Direction

### 1. Feature-First Module

Tạo bounded context mới:

```text
src/features/booking/
  api/
  components/
  config/
  constants/
  hooks/
  schemas/
  state/
  types/
  utils/
  index.ts
```

### 2. Route Strategy

- Public route: `src/app/booking/page.tsx`
- Error route: `src/app/booking/error.tsx`
- Loading route: `src/app/booking/loading.tsx`
- Không đặt business logic nặng trong page file
- Page chỉ compose shell + provider + root booking component

### 3. State Strategy

Khuyến nghị:

- **Zustand** cho wizard business state
- **TanStack Query** cho server state: availability, reservation verification, reserve/release/submit mutations
- Persist qua `sessionStorage`
- Không persist transient loading/error states
- Persist versioned state để tránh schema mismatch sau deploy

### 4. API Contract Strategy

Frontend cần chuẩn bị cho các endpoint sau:

- `GET /availability?lawyerId=...&date=...`
- `POST /availability/reserve`
- `POST /availability/release`
- `GET /availability/reservations/:id`
- `POST /bookings`

Nếu backend chưa hoàn tất contract, Phase 3 vẫn phải có mock handlers để unblock UI và test.

### 5. Error Handling Strategy

Tách riêng:

- validation errors
- slot conflict / reservation expiry
- recoverable network errors
- unrecoverable render/runtime errors trong booking subtree
- hydration mismatch / stale persisted state

### 6. Rendering Strategy

- UI shell và content có thể render SSR/Server Component shell nhẹ
- Booking interaction core phải là client components
- Animation và store logic nên ở client boundary gọn
- Không để hydration gây nháy layout rõ rệt làm mất cảm giác demo

---

## Suggested File Plan

### App Routes

- `src/app/booking/page.tsx`
- `src/app/booking/error.tsx`
- `src/app/booking/loading.tsx`

### Feature Entry

- `src/features/booking/index.ts`
- `src/features/booking/components/booking-page.tsx`
- `src/features/booking/components/booking-shell.tsx`
- `src/features/booking/components/booking-provider.tsx`

### Structural Components

- `src/features/booking/components/mini-nav.tsx`
- `src/features/booking/components/booking-hero.tsx`
- `src/features/booking/components/booking-progress.tsx`
- `src/features/booking/components/booking-footer.tsx`

### Step Components

- `src/features/booking/components/step-service.tsx`
- `src/features/booking/components/step-datetime.tsx`
- `src/features/booking/components/step-info.tsx`
- `src/features/booking/components/step-confirmation.tsx`

### Service / Lawyer Components

- `src/features/booking/components/service-grid.tsx`
- `src/features/booking/components/service-card.tsx`
- `src/features/booking/components/lawyer-section.tsx`
- `src/features/booking/components/lawyer-grid.tsx`
- `src/features/booking/components/lawyer-card.tsx`

### DateTime Components

- `src/features/booking/components/calendar-card.tsx`
- `src/features/booking/components/calendar-grid.tsx`
- `src/features/booking/components/slots-card.tsx`
- `src/features/booking/components/time-slots.tsx`
- `src/features/booking/components/consult-type.tsx`
- `src/features/booking/components/consult-type-option.tsx`
- `src/features/booking/components/slot-reservation-timer.tsx`

### Info / Summary / Confirmation Components

- `src/features/booking/components/info-form.tsx`
- `src/features/booking/components/form-check.tsx`
- `src/features/booking/components/summary-card.tsx`
- `src/features/booking/components/summary-item.tsx`
- `src/features/booking/components/booking-receipt.tsx`
- `src/features/booking/components/confirmation-actions.tsx`

### State / Hooks / API / Types

- `src/features/booking/state/booking.store.ts`
- `src/features/booking/hooks/use-booking-flow.ts`
- `src/features/booking/hooks/use-availability.ts`
- `src/features/booking/hooks/use-reservation.ts`
- `src/features/booking/hooks/use-booking-submit.ts`
- `src/features/booking/hooks/use-booking-summary.ts`
- `src/features/booking/api/booking-api.ts`
- `src/features/booking/types/index.ts`
- `src/features/booking/schemas/booking.schema.ts`
- `src/features/booking/constants/demo-booking.ts`
- `src/features/booking/utils/date.ts`
- `src/features/booking/utils/phone.ts`
- `src/features/booking/utils/summary.ts`
- `src/features/booking/utils/reservation.ts`

### Shared / Cross-Cutting

- `src/lib/analytics.ts` *(update nếu đã có)*
- `tests/mocks/handlers/booking.ts`
- `tests/unit/booking.store.test.ts`
- `tests/unit/booking.schema.test.ts`
- `tests/unit/reservation-utils.test.ts`
- `tests/integration/booking-flow.test.tsx`
- `tests/e2e/flows/booking.spec.ts`

---

## Demo Class → React Component Mapping

Bảng này là ràng buộc triển khai. Khi code, nên map từng block demo thành component tương ứng.

| Demo class / block | React component đề xuất | Ghi chú triển khai |
|---|---|---|
| `.mini-nav` | `MiniNav` | giữ brand + hotline | 
| `.booking-hero` | `BookingHero` | giữ gradient, trust items |
| `.progress-bar` | `BookingProgress` | active/done/fill states |
| `.step` | `BookingStepShell` hoặc switch trong `BookingPage` | step animation |
| `.service-grid` | `ServiceGrid` | grid responsive theo demo |
| `.service-card` | `ServiceCard` | selected + hover + check badge |
| `.lawyer-section` | `LawyerSection` | chỉ hiện sau khi chọn service |
| `.lawyer-grid` | `LawyerGrid` | 3 cột desktop |
| `.lawyer-select-card` | `LawyerCard` | avatar + rating + availability |
| `.datetime-grid` | `StepDatetime` layout | 2 cột desktop |
| `.calendar-card` | `CalendarCard` | header + nav + weekdays + grid |
| `.calendar__day` | `CalendarDayButton` | states: today, selected, disabled, has-slot |
| `.slots-card` | `SlotsCard` | date label + empty state |
| `.slot-btn` | `TimeSlotButton` | selected/booked/hover |
| `.consult-type` | `ConsultType` | radio-card options |
| `.consult-option` | `ConsultTypeOption` | selected style giống demo |
| `.step3-grid` | `StepInfo` layout | form + sticky summary |
| `.info-form` | `InfoForm` | RHF + zod |
| `.form-check` | `AgreementCheck` | custom checkbox UI |
| `.summary-card` | `SummaryCard` | sticky desktop |
| `.summary-item` | `SummaryItem` | icon + label + value |
| `.confirmation` | `StepConfirmation` | success shell |
| `.booking-receipt` | `BookingReceipt` | receipt rows |
| `.confirmation__actions` | `ConfirmationActions` | add calendar + home |
| `.booking-footer` | `BookingFooter` | lightweight footer |

---

## Design Tokens to Preserve

Từ demo `booking.html`, các token visual sau phải được giữ nguyên hoặc map rất sát:

### Colors
- `--primary: #1E3A5F`
- `--primary-dark: #152A45`
- `--primary-light: #2A4F7A`
- `--primary-faint: #EFF3F8`
- `--accent: #C9A84C`
- `--accent-dark: #B8953D`
- `--accent-light: #D4B76A`
- `--green: #059669`
- `--green-bg: #ECFDF5`
- `--red: #DC2626`
- `--red-bg: #FEF2F2`
- gray scale 50–600 đúng demo

### Radii
- `--radius-sm: 4px`
- `--radius-md: 8px`
- `--radius-lg: 12px`
- `--radius-xl: 16px`
- `--radius-full: 9999px`

### Shadows
- `--shadow-xs`
- `--shadow-sm`
- `--shadow-md`
- `--shadow-lg`

### Typography
- `--font-heading: Cormorant Garamond`
- `--font-body: Plus Jakarta Sans`

### Motion
- `--transition-fast: 0.2s ease`
- `--transition-base: 0.3s ease`

---

## Booking Data Model

### Wizard State

```ts
type BookingWizardStep = 'service' | 'datetime' | 'info' | 'confirmation';

interface BookingState {
  step: BookingWizardStep;
  service: BookingServiceOption | null;
  lawyer: BookingLawyerOption | null;
  date: string | null;
  timeSlot: BookingTimeSlot | null;
  consultationType: 'office' | 'video' | 'phone';
  reservation: BookingReservation | null;
  customerInfo: BookingCustomerInfo;
  confirmation: BookingConfirmation | null;
  isHydrated: boolean;
  lastValidatedAt: string | null;
}
```

### Service Option

```ts
interface BookingServiceOption {
  id: string;
  slug: string;
  name: string;
  icon: string;
}
```

### Lawyer Option

```ts
interface BookingLawyerOption {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  rating: number;
  availabilityLabel: string;
  avatarGradient: string;
}
```

### Time Slot

```ts
interface BookingTimeSlot {
  slotId: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'reserved' | 'booked' | 'expired';
}
```

### Reservation

```ts
interface BookingReservation {
  reservationId: string;
  slotId: string;
  lawyerId: string;
  date: string;
  startTime: string;
  endTime: string;
  expiresAt: string;
}
```

### Customer Info

```ts
interface BookingCustomerInfo {
  fullName: string;
  phone: string;
  email: string;
  issueSummary: string;
  agreedToTerms: boolean;
}
```

### Confirmation

```ts
interface BookingConfirmation {
  bookingId: string;
  status: 'confirmed' | 'pending_confirmation';
  createdAt: string;
}
```

---

## State Machine

### Visible UI Steps

```text
service-selection
→ datetime-selection
→ info-entry
→ confirmation
```

### Underlying Logical Transitions

```text
idle
→ service-selected
→ lawyer-selected
→ datetime-selected
→ slot-reserved
→ info-valid
→ submit-pending
→ confirmed
```

### Reset Rules

- Đổi `service` → reset `lawyer`, `date`, `timeSlot`, `reservation`
- Đổi `lawyer` → reset `date`, `timeSlot`, `reservation`
- Đổi `date` → reset `timeSlot`, `reservation`
- Chọn slot mới → release reservation cũ nếu contract yêu cầu
- Reservation expired → reset `timeSlot`, `reservation`, quay về datetime step

### Navigation Rules

- Không qua step datetime nếu chưa có service + lawyer
- Không qua step info nếu chưa có date + slot hợp lệ + reservation hợp lệ
- Không submit nếu form invalid hoặc reservation invalid
- Không cho confirmation render nếu submit chưa success

---

## API Contract Proposal

### 1. Get Availability

**Request**

```http
GET /availability?lawyerId=lawyer-1&date=2026-06-10
```

**Response**

```json
{
  "date": "2026-06-10",
  "lawyerId": "lawyer-1",
  "slots": [
    {
      "slotId": "slot-0800",
      "startTime": "08:00",
      "endTime": "08:45",
      "status": "booked"
    },
    {
      "slotId": "slot-0830",
      "startTime": "08:30",
      "endTime": "09:15",
      "status": "available"
    }
  ]
}
```

### 2. Reserve Slot

**Request**

```json
{
  "lawyerId": "lawyer-1",
  "date": "2026-06-10",
  "slotId": "slot-0830"
}
```

**Response**

```json
{
  "reservationId": "res_123",
  "slotId": "slot-0830",
  "lawyerId": "lawyer-1",
  "date": "2026-06-10",
  "startTime": "08:30",
  "endTime": "09:15",
  "expiresAt": "2026-06-10T09:00:00Z"
}
```

### 3. Verify Reservation

**Request**

```http
GET /availability/reservations/res_123
```

**Response**

```json
{
  "reservationId": "res_123",
  "status": "active",
  "expiresAt": "2026-06-10T09:00:00Z"
}
```

Possible statuses:
- `active`
- `expired`
- `released`
- `converted`

### 4. Release Reservation

**Request**

```json
{
  "reservationId": "res_123"
}
```

### 5. Submit Booking

**Request**

```json
{
  "reservationId": "res_123",
  "serviceId": "service-doanh-nghiep",
  "lawyerId": "lawyer-1",
  "consultationType": "office",
  "customer": {
    "fullName": "Nguyễn Văn A",
    "phone": "0912345678",
    "email": "a@example.com",
    "issueSummary": "Cần tư vấn tranh chấp hợp đồng"
  }
}
```

**Response**

```json
{
  "bookingId": "LC123456",
  "status": "confirmed",
  "reservationId": "res_123",
  "createdAt": "2026-06-10T08:40:00Z"
}
```

### Error Codes

- `409 SLOT_ALREADY_RESERVED`
- `410 RESERVATION_EXPIRED`
- `422 VALIDATION_ERROR`
- `404 RESERVATION_NOT_FOUND`
- `429 TOO_MANY_REQUESTS`
- `500 INTERNAL_SERVER_ERROR`

---

## Detailed UI Specification by Section

## 1. Mini Nav

### Purpose
- Tách booking flow khỏi full public navbar
- Giảm nhiễu điều hướng
- Giữ branding và trust nhanh

### Required Content
- Firm icon
- Firm name
- Hotline

### Required Visual Rules
- Height ~ `60px`
- Dark background `primary`
- Brand icon accent block
- Hotline accent color
- Mobile có thể ẩn firm name, nhưng brand icon + hotline phải còn

### Required Behavior
- Không sticky chồng lên hero kiểu public navbar
- Click hotline có thể dùng `tel:` trong app thật
- Brand có thể link về home hoặc không, tùy UX final, nhưng không được làm lệch layout

---

## 2. Booking Hero

### Purpose
- Đặt context cho flow booking
- Tăng trust trước khi user chọn dịch vụ

### Required Content
- H1
- Subtitle
- 3 trust indicators

### Visual Rules
- Gradient background `primary → primary-dark`
- Pattern overlay nhẹ
- Title dùng heading font
- Subtext nhạt hơn
- Trust items nằm ngang, wrap khi nhỏ màn hình

### Copy Rules
- Phần trust nên giữ gần demo:
  - miễn phí lần đầu tư vấn
  - phản hồi trong 15 phút
  - bảo mật thông tin 100%

---

## 3. Progress Bar

### Purpose
- Cho user biết họ đang ở đâu trong flow

### Required Visual Structure
- White strip dưới hero
- Step circles căn giữa
- Connecting line phía sau
- Fill line animate khi tiến bước

### Required States
- `default`
- `active`
- `done`

### Accessibility
- Step labels readable trên mobile
- Có `aria-current="step"` cho step active nếu phù hợp

### Implementation Note
- Có thể giữ 3 visual progress nodes như demo dù business state nội bộ có nhiều sub-step hơn

---

## 4. Step 1 — Service Selection

### Required Blocks
- Heading
- Subheading
- Service grid
- Lawyer section ẩn ban đầu
- Next button ở phải

### Service Grid Spec
- 8 cards theo demo sample
- Desktop: 4 cột
- Tablet/mobile: 2 cột
- Card padding, border, radius, hover và selected theo demo

### Service Card Required States
- default
- hover
- selected

### Interaction Rules
- Chọn 1 card thì deselect card khác
- Cập nhật summary ngay
- Hiện lawyer section bằng animation nhẹ
- Nếu user đổi service sau đó, reset lawyer + downstream state

### Data Rules
- Service object nên có `id`, `slug`, `name`, `icon`
- Tên hiển thị phải trùng style demo hoặc bản nội dung final đã approved

---

## 5. Lawyer Section

### Required Blocks
- Section title
- Lawyer grid
- 3 lawyer cards mẫu hoặc dynamic list từ API/mock

### Lawyer Card Spec
- Avatar initials với gradient background
- Name
- Specialty
- Rating row với stars
- Availability pill
- Selected check badge góc phải

### Required States
- default
- hover
- selected

### Interaction Rules
- Chọn 1 luật sư thì deselect luật sư khác
- Update summary ngay
- Enable Next khi đã có service + lawyer
- Đổi lawyer phải reset date + slot + reservation

### Data Rules
- `rating` có thể là mock nếu backend chưa cấp
- `availabilityLabel` có thể derive từ availability API hoặc mock label

---

## 6. Step 2 — Date & Time Selection

### Overall Layout
- `datetime-grid`
- Desktop 2 cột
- Mobile collapse 1 cột

### Calendar Card Spec
- Header có title tháng/năm
- 2 nút prev/next month
- Weekday row: T2–CN
- Day cells hình vuông, bo góc nhẹ

### Calendar Day States
- `default`
- `today`
- `has-slot`
- `selected`
- `disabled`
- `other-month`

### Rules
- Không chọn ngày quá khứ
- Không chọn cuối tuần nếu business rule giữ như demo
- Chỉ show `has-slot` nếu API trả còn slot
- Khi chọn date phải reset selected slot và reservation cũ

### Slots Card Spec
- Title “Khung giờ có sẵn”
- Date label ngay dưới title
- Empty state nếu chưa chọn ngày
- Grid slot buttons

### Slot States
- `default`
- `hover`
- `selected`
- `booked`
- `reserved-by-other`
- `expired`

### Consultation Type Spec
- 3 options:
  - office
  - video
  - phone
- Visual giống radio-card demo

### Interaction Rules
- Chọn date → fetch slots
- Chọn slot → reserve slot
- Reserve success → update summary + enable Next
- Reserve fail/conflict → toast + refetch slots + giữ user ở step 2

### Reservation UX Rules
- Nếu user đổi consultation type, không cần reset reservation
- Nếu user đổi date/lawyer, phải clear reservation cũ
- Nếu reservation đang active, step 2 nên hiển thị countdown nhỏ hoặc state indicator nếu hợp lý

---

## 7. Step 3 — Info + Summary

### Overall Layout
- `step3-grid`
- Left: `info-form`
- Right: `summary-card`
- Summary sticky ở desktop

### Info Form Fields
- fullName (required)
- phone (required)
- email (optional)
- issueSummary (required)
- agreedToTerms (required)

### Form Visual Rules
- Label font weight giống demo
- Required marker đỏ
- Input border mảnh, radius vừa
- Focus state dùng primary ring nhẹ
- Error state dùng red border + inline message
- Phone input có prefix UI nếu team giữ design này

### Validation Rules
- fullName: trim, min 2 ký tự
- phone: validate số Việt Nam hợp lệ
- email: optional nhưng đúng format nếu có
- issueSummary: non-empty, nên có min length nhỏ nếu muốn
- agreedToTerms: bắt buộc

### Summary Card Spec
- Title với icon
- Summary rows:
  - service
  - lawyer
  - date
  - time
  - method
- Price box “MIỄN PHÍ”
- Security note cuối card
- Thêm reservation countdown nếu build thật

### Interaction Rules
- Summary cập nhật realtime theo store
- Nếu reservation invalid giữa lúc ở step 3:
  - hiển thị banner/warning
  - disable submit
  - CTA quay lại chọn lịch

### Submit Button
- Full width
- Accent background
- Icon + uppercase label theo tinh thần demo
- Disabled khi form invalid / submitting / reservation invalid

---

## 8. Step 4 — Confirmation

### Required Blocks
- Success icon circle
- Confirmation title
- Confirmation subtitle
- Receipt card
- Notice panel
- 2 CTA actions

### Receipt Required Fields
- bookingId
- status
- customer name
- service
- lawyer
- date
- time
- consultation method
- contact phone

### Visual Rules
- Receipt card phải sạch, premium, rất gần demo
- Status pill dùng green background
- Receipt rows có icon block + label + value

### CTA Rules
- Primary: Add to Google Calendar
- Outline: về trang chủ
- Có thể đổi route thật, nhưng visual pattern giữ theo demo

### Business Rules
- Confirmation chỉ xuất hiện sau submit success thật
- Booking ID đến từ backend, không generate random ở frontend production

---

## Validation & Error UX Specification

### Field Validation
- Error message inline dưới field
- Border đỏ ở input lỗi
- Không show tất cả lỗi ngay từ đầu nếu user chưa interact, trừ lúc submit

### Step Validation
- Step 1 invalid:
  - shake target area hoặc toast nhẹ
  - không cho qua step 2
- Step 2 invalid:
  - highlight slots area
  - không cho qua step 3
- Step 3 invalid:
  - show field errors
  - shake agreement area nếu chưa tick

### Reservation Expiry UX
- Banner/warning rõ ràng
- Copy ví dụ:
  - “Khung giờ bạn giữ đã hết hạn. Vui lòng chọn lại giờ tư vấn.”
- CTA nên đưa user về step 2

### Conflict UX
- Copy ví dụ:
  - “Khung giờ này vừa được người khác đặt. Vui lòng chọn khung giờ khác.”
- Refetch slot list ngay sau conflict

### Network Failure UX
- Không làm mất form data
- Cho retry button nếu action recoverable
- Toast hoặc inline alert phải nói rõ bước tiếp theo

---

## Session Persistence Strategy

### Persist What
- service
- lawyer
- date
- consultationType
- customerInfo
- reservation minimal payload
- current visible step nếu hợp lệ

### Do Not Persist
- loading flags
- temporary mutation errors
- confirmation success tạm nếu không có backend confirmation thật

### Rehydrate Rules
- On hydration:
  1. restore local state
  2. if reservation exists → verify with server
  3. if invalid → clear reservation + slot, rollback to step datetime
  4. if persisted step no longer valid → correct it automatically

### TTL Rules
- Có thể lưu `persistedAt`
- Nếu state quá cũ, có thể reset mềm

---

## Polling / Revalidation Strategy

### When to Poll
- Khi user đang ở step datetime
- Khi user đang ở step info nhưng có reservation active

### When to Revalidate Immediately
- Tab refocus
- Trước submit
- Sau network reconnect

### When Not to Poll
- Khi ở confirmation step
- Khi chưa chọn lawyer/date
- Khi tab background lâu nếu muốn tối ưu network

---

## Analytics Specification

### Required Events
- `booking_started`
- `booking_service_selected`
- `booking_lawyer_selected`
- `booking_date_selected`
- `booking_slot_reserved`
- `booking_slot_conflict`
- `booking_reservation_expired`
- `booking_step_completed`
- `booking_submit_started`
- `booking_submit_succeeded`
- `booking_submit_failed`

### Safe Metadata
- service slug
- lawyer id
- date
- slot id
- consultation type
- step name
- error code

### Never Send
- full name
- raw phone
- email
- issue summary

---

## Week-by-Week Implementation Plan

## Week 5 — Demo Shell + Wizard Foundation + Reservation Lifecycle

### Task 3.1: Route Shell + Demo Structure Port

**Mục tiêu**: Dựng `/booking` theo đúng skeleton demo.

**Phải có**:
- mini-nav
- booking-hero
- progress-bar
- booking-body
- booking-footer

**Yêu cầu**:
- Phải dựng theo cấu trúc visual của `frontend/demo/booking.html`
- Không reuse hero/contact layout của homepage nếu làm lệch demo booking
- Tách thành React components nhỏ nhưng hierarchy phải giống demo

**Exit Criteria**:
- [ ] `/booking` render ổn định
- [ ] Mini-nav, hero, progress bar, booking body, footer giống demo về hierarchy
- [ ] Shell responsive giống demo

---

### Task 3.2: Booking Store + Session Persistence

**Mục tiêu**: Tạo nguồn state trung tâm cho toàn bộ wizard.

**Yêu cầu**:
- Dùng `persist(... createJSONStorage(() => sessionStorage))`
- Giữ step, selected entities, customer info, reservation state
- Có reset rules cho state phụ thuộc
- Có hydration guard và reservation verify logic

**Exit Criteria**:
- [ ] Refresh vẫn giữ state nếu reservation còn hợp lệ
- [ ] Reservation invalid thì rollback về step chọn slot
- [ ] Không persist loading/error flags tạm thời

---

### Task 3.3: Step 1 — Service + Lawyer

**Mục tiêu**: Hoàn thiện step đầu tiên giống demo.

**Yêu cầu**:
- Service cards 4-column grid + selected state + check badge
- Lawyer section ẩn ban đầu, hiện ra sau khi chọn service
- Lawyer cards 3-column grid + avatar + specialty + rating + availability
- Next disabled khi chưa đủ service + lawyer

**Exit Criteria**:
- [ ] Step 1 hoạt động độc lập, dễ test
- [ ] Reset downstream state đúng khi upstream đổi
- [ ] Grid layout và selected states bám sát demo

---

### Task 3.4: Step 2 — DateTime + Availability UI

**Mục tiêu**: Hiển thị calendar và time slots theo luật sư/ngày.

**Yêu cầu**:
- Calendar card giống demo
- Slots card giống demo
- Consultation type cards giống demo
- Query key rõ nghĩa như `['booking-slots', lawyerId, date]`
- Trạng thái slot: `available`, `reserved`, `booked`, `expired`

**Exit Criteria**:
- [ ] Slot list cập nhật đúng theo selection
- [ ] Calendar grid và slot states giống demo
- [ ] Consultation type section giống demo
- [ ] Không cho đi tiếp nếu chưa có slot hợp lệ

---

### Task 3.5: Reservation API + Countdown Timer

**Mục tiêu**: Chặn race condition bằng reserve-before-submit.

**Luồng chuẩn**:
1. User chọn slot
2. Frontend gọi reserve endpoint
3. Backend trả `reservationId` + `expiresAt`
4. Store lưu reservation
5. Timer hiển thị ở step info/summary
6. Hết hạn thì clear reservation và đưa về step chọn lịch

**Exit Criteria**:
- [ ] Timer chạy theo `expiresAt` từ server
- [ ] Conflict không làm kẹt local state
- [ ] Có mock handlers cho success / conflict / expired

---

## Week 6 — Info, Submit, Recovery, Verification

### Task 3.6: Step 3 — Info Form + Summary

**Mục tiêu**: Thu thập thông tin khách hàng và hiển thị summary như demo.

**Yêu cầu**:
- Form card bám `.info-form`
- Summary card bám `.summary-card`
- Sticky summary desktop
- Validation bằng Zod + React Hook Form
- Show reservation time remaining rõ ràng

**Exit Criteria**:
- [ ] Form + summary layout bám sát demo
- [ ] Summary luôn hiển thị thông tin booking quan trọng
- [ ] Submit disable khi invalid / reservation invalid

---

### Task 3.7: Submit Booking + Conflict Recovery

**Mục tiêu**: Tạo booking cuối cùng và xử lý lỗi concurrency.

**Failure cases bắt buộc**:
- `409 SLOT_ALREADY_RESERVED`
- `410 RESERVATION_EXPIRED`
- `422 VALIDATION_ERROR`
- `5xx SERVER_ERROR`

**Exit Criteria**:
- [ ] Submit success dẫn tới confirmation state rõ ràng
- [ ] Submit fail vẫn giữ được form data cần thiết
- [ ] API error mapping nhất quán

---

### Task 3.8: Step 4 — Confirmation + Receipt

**Mục tiêu**: Render success screen premium giống demo.

**Yêu cầu**:
- Confirmation icon
- Receipt card
- Notice panel
- Add to Calendar CTA
- Back home CTA

**Exit Criteria**:
- [ ] Confirmation UI bám sát demo
- [ ] Receipt data lấy từ response thật
- [ ] CTA actions hoạt động đúng

---

### Task 3.9: Booking Error Boundary + Recovery Paths

**Mục tiêu**: Bảo vệ booking subtree khỏi runtime/render errors.

**Yêu cầu**:
- Có boundary riêng cho booking
- Retry path cố giữ wizard state nếu còn valid
- Nếu reservation không còn hợp lệ khi recover thì quay mềm về bước chọn giờ

**Exit Criteria**:
- [ ] Booking subtree không phụ thuộc hoàn toàn root boundary
- [ ] Recovery path hợp lý với user state

---

### Task 3.10: Polling + Revalidation

**Mục tiêu**: Đồng bộ local state với server tốt hơn.

**Yêu cầu**:
- Poll slot availability khi ở step datetime
- Revalidate reservation khi ở step info
- Refocus tab → sync lại state
- Không poll dư ở các step không cần thiết

**Exit Criteria**:
- [ ] Refocus tab đồng bộ lại slot state
- [ ] Phát hiện reservation invalid sớm trước submit
- [ ] Không tạo tải mạng thừa

---

### Task 3.11: Analytics Funnel

**Mục tiêu**: Đo được rơi rụng và conversion của booking flow.

**Exit Criteria**:
- [ ] Đo được funnel theo bước
- [ ] Không rò rỉ dữ liệu nhạy cảm

---

### Task 3.12: Test Coverage

**Mục tiêu**: Khóa chất lượng trước khi ship.

**Test matrix tối thiểu**:
- Unit: booking store persist / rehydrate
- Unit: schema validation phone / email / required fields
- Unit: reservation / expiry utils
- Integration: reserve success / conflict / release / submit fail
- E2E: happy path
- E2E: slot conflict
- E2E: reservation expired after refresh
- E2E: responsive visual smoke cho booking shell

**Exit Criteria**:
- [ ] Có test tự động cho critical flows
- [ ] Có ít nhất 1 test cho refresh + rehydrate + revalidation
- [ ] Mock handlers phản ánh đúng API contract

---

## Responsive Specification

### Desktop `> 768px`
- Service grid: 4 cột
- Lawyer grid: 3 cột
- DateTime grid: 2 cột bằng nhau
- Step3 grid: `1fr 340px`
- Summary sticky

### Tablet `<= 768px`
- Service grid: 2 cột
- Lawyer grid: 2 cột
- DateTime grid: 1 cột
- Step3 grid: 1 cột
- Summary static
- Confirmation actions xếp dọc nếu cần

### Mobile `<= 480px`
- Lawyer grid: 1 cột
- Mini-nav ẩn brand text nếu cần
- Progress labels nhỏ hơn
- Trust items wrap gọn
- Slots grid 3 cột hoặc mật độ phù hợp với chạm tay

---

## Accessibility Requirements

- Tất cả button tương tác phải keyboard accessible
- Selected states nên phản ánh bằng `aria-pressed`, `aria-selected`, hoặc radio semantics tùy component
- Step headings dùng semantic heading levels đúng
- Validation errors liên kết với input qua `aria-describedby`
- Progress step active có thể dùng `aria-current="step"`
- Color không là tín hiệu duy nhất, phải có icon/text/state class đi kèm

---

## Integration Points from Phase 2

Các điểm cần nối từ public pages đã có:

- Homepage CTA trong hero / services / contact
- Landing page CTA blocks trong `src/features/landing-pages/`
- Floating widgets / hotline / contact entry points
- Footer/contact blocks dẫn đến booking thay vì chỉ về form liên hệ tĩnh khi phù hợp

### CTA Strategy

Chuẩn hóa CTA chính cho conversion cao thành:
- `Đặt lịch tư vấn`
- Link tới `/booking`
- Có thể truyền prefill query params nếu cần sau này, ví dụ:
  - `?service=doanh-nghiep`
  - `?lawyer=lawyer-1`

---

## Risks & Mitigations

### Risk 1: Backend contract chưa ổn định
**Giảm thiểu**:
- khóa mock contract sớm trong `tests/mocks/handlers/booking.ts`
- tách typed API layer khỏi component

### Risk 2: Reservation lệch do clock client/server
**Giảm thiểu**:
- chỉ tin `expiresAt` từ server
- verify reservation trước submit và khi refocus

### Risk 3: State wizard bị rối khi back/refresh
**Giảm thiểu**:
- mọi business state đi qua store duy nhất
- reset downstream state có quy tắc rõ ràng

### Risk 4: UI đúng logic nhưng lệch demo
**Giảm thiểu**:
- bắt buộc đối chiếu theo mapping class → component
- review visual với `frontend/demo/booking.html` từng step
- chụp screenshot diff desktop/mobile trước khi done

### Risk 5: Test E2E flaky vì timer/polling
**Giảm thiểu**:
- mock time hoặc kiểm soát clock trong test
- tách timer utility để unit test độc lập

### Risk 6: Hydration mismatch gây nháy layout
**Giảm thiểu**:
- tách shell và interactive layer
- gate hydrate states cẩn thận
- không render derived booking state mâu thuẫn giữa server/client

---

## Definition of Done

Phase 3 được xem là hoàn tất khi:

- [ ] `/booking` hoạt động end-to-end trên desktop và mobile
- [ ] Refresh không làm mất tiến trình nếu reservation còn valid
- [ ] Reservation hết hạn được phát hiện và recover đúng
- [ ] Submit không tạo duplicate booking khi slot không còn hợp lệ
- [ ] Có error boundary riêng cho booking flow
- [ ] Có analytics funnel cơ bản
- [ ] Có unit + integration + E2E cho critical paths
- [ ] Booking page nhìn và vận hành gần như `frontend/demo/booking.html`

### Visual Acceptance Checklist

Trước khi xem Phase 3 là hoàn thành, cần đối chiếu trực tiếp với `frontend/demo/booking.html` theo checklist sau:

- [ ] Mini-nav giống demo về vị trí, tỷ lệ và hierarchy nội dung
- [ ] Hero booking giống demo về nền, typography, trust indicators và spacing
- [ ] Progress bar giống demo về active/done states, line fill và label placement
- [ ] Service cards giống demo về grid, selected state, icon block và density
- [ ] Lawyer cards giống demo về avatar, badges, rating và selected state
- [ ] Calendar/slots giống demo về trạng thái tương tác và bố cục
- [ ] Consult type options giống demo về radio-card treatment
- [ ] Info form + summary card giống demo về layout, sticky behavior và grouping thông tin
- [ ] Confirmation + receipt giống demo về hierarchy, notice, CTA
- [ ] Mobile layout vẫn nhận ra rõ cùng một trải nghiệm booking của demo

### Logic Acceptance Checklist

- [ ] Không qua step 2 nếu thiếu service/lawyer
- [ ] Không qua step 3 nếu thiếu date/slot/reservation hợp lệ
- [ ] Conflict trả user về trạng thái có thể chọn lại slot
- [ ] Expiry không làm mất toàn bộ form data không cần thiết
- [ ] Submit success render receipt theo dữ liệu server

---

## Recommended Execution Order

1. Port shell demo booking vào React components
2. Thiết lập booking store + persistence
3. Hoàn thiện Step 1 service/lawyer
4. Hoàn thiện Step 2 calendar/slots/consult type
5. Nối reservation lifecycle
6. Hoàn thiện Step 3 info + summary
7. Submit booking + confirmation receipt
8. Error boundary + revalidation
9. Analytics
10. Test coverage
11. Visual QA desktop/tablet/mobile đối chiếu demo

---

## Suggested Deliverables

Sau Phase 3, team nên có:

- Booking route hoàn chỉnh
- Booking feature module độc lập, dễ mở rộng cho chatbot/admin
- Typed contract cho slot / reservation / booking submit
- Booking UI gần như bản React hóa của `frontend/demo/booking.html`
- Bộ test đủ để tự tin bước sang Phase 4 Chatbot AI

---

## Next Phase Dependency

Phase 4 (Chatbot AI) nên tận dụng output của Phase 3 ở các điểm:

- chatbot có thể deep-link sang `/booking`
- chatbot handoff dùng lại service/lawyer metadata
- booking analytics là nền cho lead funnel tổng thể
- admin sau này có thể tái sử dụng booking types/API layer
- reservation flow có thể dùng lại cho assisted booking do chatbot tạo

---

## Final Recommendation

Không nên mở rộng Phase 3 thành “booking + chatbot lite” trong cùng đợt.

Nên giữ scope **Booking Engine thuần**, nhưng làm thật chắc ở cả 2 mặt:

### Mặt 1 — Demo Fidelity
- dựng cực sát `frontend/demo/booking.html`
- không redesign
- không generic hóa quá sớm

### Mặt 2 — Product Robustness
- reservation lifecycle
- refresh persistence
- conflict recovery
- typed API layer
- test coverage

Nếu làm tốt phase này, các phase sau sẽ nhẹ hơn đáng kể vì team đã có một public transactional flow vừa đẹp, vừa ổn định, vừa sẵn sàng mở rộng.
