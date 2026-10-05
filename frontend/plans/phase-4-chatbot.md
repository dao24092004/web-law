# Phase 4: Chatbot AI + Floating Widgets
## Week 7 — Công ty Luật TNHH ICRC

---

## Phase Overview

**Mục tiêu**: Xây dựng Chatbot AI 24/7 cho website ICRC Law — tích hợp conversational AI hỗ trợ khách hàng, phân loại intent, streaming response, persistence, và handoff mượt sang booking/lead. Đồng thời tái hiện toàn bộ floating widgets từ demo (`frontend/demo/index.html`).

**Design Reference**: `frontend/demo/index.html` — **Chatbot UI từ lines ~1790-1962 (styles) và ~3210-3263 (markup)**

---

## Demo UI Reference Summary

### Chatbot Widget (từ demo)

**FAB (Floating Action Button)**:
- Kích thước: `58px × 58px`, bo tròn 50%
- Background: `--primary (#1E3A5F)`, shadow `0 4px 20px rgba(30,58,95,0.45)`
- Icon: `fa-comment-dots` (đóng → `fa-xmark`)
- Badge đỏ góc phải trên, animation pulse
- Hover: `background: --primary-light`, scale 1.05
- Open state: background `--gray-500`, scale 0.9

**Chat Window**:
- Kích thước: `380px × 580px` desktop, `calc(100vw - 32px) × calc(100vh - 120px)` mobile
- Bo góc: `var(--radius-xl)`
- Box shadow: `var(--shadow-xl)`
- Animation mở: `opacity 0→1 + translateY(20px→0) scale(0.95→1)`, `0.35s cubic-bezier(0.34, 1.2, 0.64, 1)`
- Border: `1px solid var(--gray-100)`

**Chat Header**:
- Background: `--primary`
- Avatar tròn 40px, icon robot, border trắng mờ
- Name: "Trợ lý Pháp Lý AI" + status dot xanh lập lòe
- Subtitle: "Phản hồi trong vài giây"
- Actions: minimize + close buttons

**Messages Area**:
- Scroll tùy chỉnh, màu `--gray-50`
- Bot messages: avatar tròn 28px `--primary`, bubble trắng, border `--gray-100`
- User messages: avatar tròn 28px `--accent`, bubble `--primary`, border-radius đặc biệt (góc phải-trên vuông)
- Animation msgIn: `opacity 0→1 + translateY(8px→0) scale(0.97→1)`, `0.35s cubic-bezier(0.34, 1.2, 0.64, 1)`

**Quick Replies**:
- Pill buttons, border `--primary`, text `--primary`
- Hover: background `--primary`, text trắng
- Icon kèm theo từng option

**Typing Indicator**:
- 3 dots, animation bounce lên xuống
- Background trắng, border `--gray-100`

**Input Area**:
- Border top `1px solid --gray-100`
- Input wrap: bg `--gray-50`, border `--gray-200`, bo `--radius-lg`
- Focus: border `--primary`
- Send button: `34×34px`, bg `--primary`, icon paper-plane

**Handoff Banner**:
- Gradient `--primary → --primary-light`
- Dot đỏ lập lòe
- Nút accent "Kết nối tư vấn viên" → link `/booking`

**Bubble Popup** (pre-open):
- Xuất hiện 3s sau load, có mũi tên
- Text: "Xin chào! Tôi có thể giúp gì cho bạn?"
- Close button

**Chat Input Footer**:
- Font 0.64rem, màu `--gray-400`
- "Powered by AI | Không thay thế tư vấn pháp lý"

### Floating Widgets (từ demo)

**Back to Top**: Nút tròn `50×50px`, bg `--primary`, màu trắng, `↑`, position fixed bottom-right

**Call Widget**: Nút tròn `50×50px`, bg `--primary`, icon `fa-phone`, link `tel:`

---

## Product Goals for Phase 4

Chatbot AI cần giải được 6 mục tiêu sản phẩm:

1. **Hỗ trợ 24/7 không gián đoạn**
   - Khách hàng có thể hỏi bất kỳ lúc nào
   - Phân loại intent tự động, fallback rõ ràng

2. **Dẫn dắt đến booking/lead**
   - Intent "đặt lịch" → deep link `/booking`
   - Intent "cần luật sư" → thu thập thông tin (handoff)
   - Intent "tư vấn dịch vụ" → trả lời có cấu trúc + CTA

3. **Cảm giác premium, đáng tin cậy**
   - UI giống demo, font đúng, màu đúng, animation mượt
   - Disclaimer rõ ràng: "Không thay thế tư vấn pháp lý chuyên nghiệp"

4. **Memory và context**
   - Lưu conversation history trong session
   - Khi reopen, khôi phục context
   - Phân biệt được intent qua các message

5. **Streaming response**
   - AI typing indicator hiện trong khi đang generate
   - Không blocking UI
   - Cancel được nếu user gửi message mới

6. **Fallback khi AI bận/lỗi**
   - Khi AI fail → thông báo rõ, cho retry
   - Khi backend offline → thông báo "Bot tạm bảo trì"
   - Handoff button luôn sẵn sàng

---

## User Journey

### Happy Path — Hỏi về dịch vụ

```
User mở chatbot
→ thấy greeting + quick replies (5 lĩnh vực)
→ click "Luật Doanh nghiệp"
→ bot reply với structured content + sub-quick-replies
→ click "Thành lập công ty"
→ bot reply chi tiết (checklist, thời gian, chi phí)
→ click "Đặt lịch tư vấn"
→ deep link sang /booking
→ booking engine tiếp quản
```

### Happy Path — Lead Collection

```
User hỏi "cần luật sư"
→ bot xác nhận, hỏi tên
→ user reply tên
→ bot xác nhận tên, hỏi số điện thoại
→ user reply số điện thoại
→ bot cảm ơn + handoff banner hiện
→ user click "Kết nối tư vấn viên"
→ deep link /booking với prefill tên + phone
```

### Error / Recovery Branches

- **AI timeout (>30s)**: show error message, offer retry button
- **Network offline**: show "Mất kết nối", auto-retry on reconnect
- **Invalid intent**: fallback greeting với quick replies
- **User idle > 5min**: có thể show reminder bubble
- **Chat window closed mid-conversation**: reopen giữ nguyên history

---

## Phase Scope

### In Scope

- Chatbot FAB widget (floating, bottom-right)
- Chat window (open/close/minimize)
- Message bubbles (bot + user)
- Quick replies (interactive pill buttons)
- Typing indicator (streaming)
- Handoff banner (deep link to booking)
- Lead collection flow (name → phone → booking)
- Chat message input + send
- Conversation memory (sessionStorage)
- Bubble popup (pre-open teaser)
- Floating widgets: back-to-top, call button
- AI streaming response display
- Intent classification (basic keyword-based)
- Chatbot API integration
- MSW mock handlers cho chatbot
- Unit + E2E tests cho chatbot flows
- **Visual parity với `frontend/demo/index.html` cho chatbot section**

### Out of Scope

- Full AI training/fine-tuning
- Multi-language chatbot (VN only trong phase này)
- Persistent chat history across devices/sessions
- Real-time agent handoff chat
- Chatbot admin panel (Phase 5)
- A/B testing cho chatbot scripts

---

## Architecture Direction

### 1. Feature-First Module

Tạo bounded context mới:

```
src/features/chatbot/
  api/
  components/
  config/
  constants/
  hooks/
  lib/
  types/
  utils/
  index.ts
```

### 2. Route Strategy

- Chatbot là **widget toàn cục**, không có route riêng
- Render trong root layout hoặc provider
- `position: fixed` bottom-right, z-index cao
- Toggle state managed by Zustand

### 3. State Strategy

- **Zustand** cho widget open/close, message list, streaming state
- **TanStack Query** cho message history (nếu backend persist)
- **sessionStorage** cho conversation memory persistence
- Streaming tokens accumulated via `useReducer` hoặc local state

### 4. API Contract Strategy

Frontend cần chuẩn bị cho các endpoint:

- `POST /chatbot/message` — gửi message + nhận AI response (SSE)
- `GET /chatbot/sessions/:sessionId/history` — lấy lịch sử chat
- `POST /chatbot/sessions` — tạo session mới

Nếu backend chưa hoàn tất, Phase 4 vẫn phải có mock handlers để unblock UI.

### 5. Streaming Strategy

Dùng `fetch` + `ReadableStream` (hoặc `EventSource` nếu backend dùng SSE):

```typescript
async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  const response = await fetch('/api/chatbot/message', {
    method: 'POST',
    body: JSON.stringify({ messages }),
    headers: { 'Content-Type': 'application/json' },
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value);
  }
}
```

### 6. Widget Placement

- Chatbot widget render ở `src/app/layout.tsx` hoặc trong một global provider
- Đặt trong `<div className="fixed bottom-6 right-6 z-[9999]">`
- Back-to-top và call widget cùng vị trí, stacked

---

## Suggested File Plan

### Feature Entry

- `src/features/chatbot/index.ts`
- `src/features/chatbot/components/chatbot-widget.tsx`
- `src/features/chatbot/components/chatbot-provider.tsx`

### Widget Components

- `src/features/chatbot/components/chatbot-fab.tsx`
- `src/features/chatbot/components/chat-bubble-popup.tsx`
- `src/features/chatbot/components/chat-window.tsx`
- `src/features/chatbot/components/chat-header.tsx`
- `src/features/chatbot/components/chat-messages.tsx`
- `src/features/chatbot/components/chat-message-item.tsx`
- `src/features/chatbot/components/chat-quick-replies.tsx`
- `src/features/chatbot/components/chat-typing-indicator.tsx`
- `src/features/chatbot/components/chat-input-area.tsx`
- `src/features/chatbot/components/chat-handoff-banner.tsx`

### Floating Widgets

- `src/features/chatbot/components/floating-widgets.tsx`
- `src/features/chatbot/components/back-to-top.tsx`
- `src/features/chatbot/components/call-widget.tsx`

### State / Hooks / API / Types

- `src/features/chatbot/state/chatbot.store.ts`
- `src/features/chatbot/hooks/use-chatbot.ts`
- `src/features/chatbot/hooks/use-streaming.ts`
- `src/features/chatbot/hooks/use-chatbot-widget.ts`
- `src/features/chatbot/api/chatbot-api.ts`
- `src/features/chatbot/types/index.ts`
- `src/features/chatbot/schemas/chatbot.schema.ts`
- `src/features/chatbot/constants/conversation-flow.ts`
- `src/features/chatbot/utils/scroll.ts`

### Tests / Mocks

- `tests/mocks/handlers/chatbot.ts`
- `tests/unit/chatbot.store.test.ts`
- `tests/unit/chatbot-schema.test.ts`
- `tests/e2e/flows/chatbot.spec.ts`

---

## Demo Class → React Component Mapping

Bảng này là ràng buộc triển khai.

| Demo class / block | React component đề xuất | Ghi chú |
|---|---|---|
| `.chatbot__fab` | `ChatbotFab` | FAB button, badge, open/close state |
| `.chat-window` | `ChatWindow` | Container có animation open/close |
| `.chat-header` | `ChatHeader` | Avatar, name, status, minimize/close |
| `.chat-messages` | `ChatMessages` | Scroll area, message list |
| `.msg` + `.msg--bot/msg--user` | `ChatMessageItem` | Bubble, avatar, timestamp |
| `.quick-replies` | `ChatQuickReplies` | Pill buttons grid |
| `.typing-indicator` | `ChatTypingIndicator` | 3-dot bounce animation |
| `.handoff-banner` | `ChatHandoffBanner` | Gradient banner + CTA |
| `.chat-input-area` | `ChatInputArea` | Textarea + send button |
| `.bubble-popup` | `ChatBubblePopup` | Pre-open teaser |
| `.floating-widget` | `FloatingWidgets` | Stacked container |
| `.back-to-top` | `BackToTop` | Scroll to top |
| `.call-widget` | `CallWidget` | Tel: link |

---

## Design Tokens to Preserve (Chatbot)

Từ demo `index.html`, các token visual sau phải được giữ nguyên:

### Colors
- `--primary: #1E3A5F`
- `--primary-light: #2A4F7A`
- `--accent: #C9A84C`
- `--green: #059669`
- `--red: #DC2626`
- `--gray-50: #F8F9FA`
- `--gray-100: #F0F2F5`
- `--gray-200: #E4E8EF`
- `--gray-300: #CBD2DC`
- `--gray-400: #9CA3AF`
- `--gray-500: #6B7280`
- `--white: #FFFFFF`

### Radii
- `--radius-sm: 4px`
- `--radius-lg: 12px`
- `--radius-xl: 16px`

### Shadows
- `--shadow-sm: 0 2px 8px rgba(0,0,0,0.07)`
- `--shadow-xl: 0 16px 60px rgba(0,0,0,0.15)`

### Motion
- `--transition-fast: 0.2s ease`
- `--transition-base: 0.3s ease`
- Chat open: `0.35s cubic-bezier(0.34, 1.2, 0.64, 1)`
- Message in: `0.35s cubic-bezier(0.34, 1.2, 0.64, 1)`
- Typing bounce: `1.2s ease-in-out infinite`

---

## Chatbot Data Model

### Message

```typescript
interface ChatMessage {
  id: string;
  from: 'user' | 'bot' | 'system';
  content: string;
  timestamp: string;
  quickReplies?: QuickReply[];
  inputPrompt?: InputPrompt;
  isStreaming?: boolean;
}

interface QuickReply {
  label: string;
  icon: string;
  reply: string;
}

interface InputPrompt {
  placeholder: string;
  type: 'text' | 'tel' | 'email';
}
```

### Session

```typescript
interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  context: {
    userName?: string;
    userPhone?: string;
    intent?: string;
    selectedService?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Widget State

```typescript
interface ChatbotWidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  hasSeenPopup: boolean;
  popupDismissed: boolean;
  sessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamedContent: string;
  error: string | null;
}
```

---

## Conversation Flow State Machine

### Bot Greeting State

```text
BOT_GREETING
→ user clicks quick reply "Luật Doanh nghiệp"
→ BOT_SERVICE_SELECTED
```

### Service Selected State

```text
BOT_SERVICE_SELECTED
→ bot shows structured content + sub-quick-replies
→ user clicks "Thành lập công ty"
→ BOT_COMPANY_SETUP
```

### Company Setup State

```text
BOT_COMPANY_SETUP
→ bot shows detailed info + CTA "Đặt lịch tư vấn"
→ user clicks "Đặt lịch tư vấn"
→ HANDOFF_BOOKING → navigate('/booking')
```

### Lead Collection State

```text
BOT_GREETING
→ user types "cần luật sư" / "tư vấn"
→ BOT_LEAD_NAME
→ user types name
→ BOT_LEAD_PHONE
→ user types phone
→ BOT_LEAD_COMPLETE
→ show handoff banner
→ navigate('/booking?prefill=...')
```

---

## API Contract Proposal

### 1. Send Message (SSE Streaming)

**Request**

```http
POST /api/chatbot/message
Content-Type: application/json

{
  "sessionId": "sess_abc123",
  "message": {
    "from": "user",
    "content": "Luật doanh nghiệp"
  },
  "context": {
    "userName": "Nguyễn Văn A",
    "userPhone": "0912345678"
  }
}
```

**Response** (SSE stream)

```
data: {"content": "Về ", "done": false}
data: {"content": "Luật Doanh nghiệp", "done": false}
data: {"content": ", tôi có thể ", "done": false}
...
data: {"content": "...toàn bộ...", "done": true, "quickReplies": [...], "intent": "service_inquiry"}
```

### 2. Create Session

**Request**

```http
POST /api/chatbot/sessions
```

**Response**

```json
{
  "sessionId": "sess_abc123",
  "createdAt": "2026-06-15T08:00:00Z"
}
```

### 3. Get Session History

**Request**

```http
GET /api/chatbot/sessions/sess_abc123
```

**Response**

```json
{
  "sessionId": "sess_abc123",
  "messages": [...],
  "context": {
    "userName": "Nguyễn Văn A"
  },
  "createdAt": "2026-06-15T08:00:00Z"
}
```

### Error Codes

- `429 RATE_LIMITED`
- `500 AI_SERVICE_ERROR`
- `503 AI_UNAVAILABLE`

---

## Detailed UI Specification

### 1. Chatbot FAB

**Visual Spec**:
- Kích thước: `58×58px`, `border-radius: 50%`
- Background: `--primary`, shadow: `0 4px 20px rgba(30,58,95,0.45)`
- Icon `comment-dots` → `xmark` khi open
- Badge: `19×19px`, `--red`, border `--primary`, animation pulse
- Hover: bg `--primary-light`, scale 1.05

**Behavior**:
- Click → toggle open/close
- Open → badge ẩn, icon đổi thành xmark, window hiện với animation
- Close → icon đổi lại, badge hiện lại nếu có message mới

### 2. Chat Window

**Visual Spec**:
- Desktop: `380×580px`, fixed bottom-right (bottom: 24px, right: 24px)
- Mobile: `calc(100vw - 32px) × calc(100vh - 120px)`
- Border-radius: `var(--radius-xl)`
- Box-shadow: `var(--shadow-xl)`
- Border: `1px solid var(--gray-100)`
- Open animation: `opacity 0→1, translateY(20px→0) scale(0.95→1)`, `0.35s cubic-bezier(0.34, 1.2, 0.64, 1)`

### 3. Chat Header

**Visual Spec**:
- Height: auto (padding 14px 16px)
- Background: `--primary`
- Avatar: `40×40px`, bo tròn, border `2px solid rgba(255,255,255,0.25)`, icon robot
- Name: "Trợ lý Pháp Lý AI" + status dot xanh lập lòe
- Subtitle: "Phản hồi trong vài giây"
- Minimize/Close buttons: `28×28px`, bg mờ

### 4. Messages Area

**Visual Spec**:
- Flex column, gap 10px
- Scrollbar ẩn, màu `--gray-200`
- Padding: 14px
- Background: `--gray-50`

### 5. Bot Message Bubble

**Visual Spec**:
- Avatar: `28×28px`, `--primary`, icon robot
- Bubble: bg white, border `1px solid --gray-100`, border-radius `4px var(--radius-lg) var(--radius-lg) var(--radius-lg)`
- Shadow: `--shadow-sm`
- Font: 0.82rem, line-height 1.5, color `--gray-700`
- Disclaimer box: bg `#FEF2F2`, border-left `3px solid #DC2626`, icon warning, font 0.78rem

### 6. User Message Bubble

**Visual Spec**:
- Avatar: `28×28px`, `--accent`, icon user
- Bubble: bg `--primary`, color white, border-radius `var(--radius-lg) 4px var(--radius-lg) var(--radius-lg)`
- Align: flex-end

### 7. Quick Replies

**Visual Spec**:
- Wrap flex, gap 6px
- Button: pill shape, border `1.5px solid --primary`, color `--primary`, bg white
- Font: 0.74rem, font-weight 600
- Icon: 0.68rem, trước label
- Hover: bg `--primary`, color white

### 8. Typing Indicator

**Visual Spec**:
- Avatar bot + bubble trắng
- 3 dots: `6×6px`, `--gray-400`, bounce animation
- `nth-child(2)` delay 0.15s, `nth-child(3)` delay 0.3s
- Animation: `translateY(-6px)` + color change thành `--primary`

### 9. Handoff Banner

**Visual Spec**:
- Gradient: `--primary → --primary-light`
- Border-radius: `var(--radius-lg)`
- Dot đỏ: `9×9px`, animation blink
- Text: 0.76rem, white, font-weight 600
- Button: bg `--accent`, color `--primary-dark`, font 0.72rem

### 10. Input Area

**Visual Spec**:
- Border-top: `1px solid --gray-100`
- Input wrap: bg `--gray-50`, border `1.5px solid --gray-200`, border-radius `var(--radius-lg)`
- Focus-within: border `--primary`
- Textarea: auto-resize, max-height 72px, font 0.85rem
- Send button: `34×34px`, bg `--primary`, icon paper-plane

### 11. Bubble Popup (Pre-open)

**Visual Spec**:
- Xuất hiện 3s sau page load
- Background white, border-radius `var(--radius-xl)`, shadow `--shadow-xl`
- Mũi tên chỉ xuống FAB
- Close button góc trên phải
- Text: 0.82rem, color `--primary`
- Font chính: Plus Jakarta Sans

### 12. Floating Widgets

**Back-to-Top**:
- Nút tròn `50×50px`, bg `--primary`, color white
- Icon mũi tên lên
- Visibility: ẩn khi scroll top < 300px, hiện khi > 300px
- Smooth scroll to top

**Call Widget**:
- Nút tròn `50×50px`, bg `--primary`, color white
- Icon phone
- `tel:0969967389` link

---

## Responsive Behavior

### Desktop `> 768px`
- FAB: bottom 24px, right 24px
- Chat window: 380×580px, bottom-right
- Widgets stack: FAB trên cùng, back-to-top dưới

### Mobile `<= 768px`
- FAB: bottom 16px, right 16px
- Chat window: full-width - 32px, full-height - 120px
- Back-to-top: ẩn hoặc chỉ hiện khi scroll rất sâu

---

## Accessibility Requirements

- FAB: `aria-label="Mở chat với trợ lý pháp lý"`, `aria-expanded`
- Chat window: `role="dialog"`, `aria-label`
- Messages: `role="log"`, `aria-live="polite"`
- Quick replies: `role="group"`, buttons `aria-label`
- Input: `aria-label="Nhập tin nhắn"`, send button `aria-label="Gửi tin nhắn"`
- Typing indicator: `aria-label="Đang trả lời..."`
- Error messages: `role="alert"`
- All interactive elements keyboard accessible

---

## Integration Points

### From Public Pages
- Homepage load → show bubble popup sau 3s
- Service page → chatbot greeting với contextual hints
- FAQ page → "Hỏi chatbot" CTA floating

### To Booking
- Handoff banner → `router.push('/booking')` với prefill params
- Quick reply "Đặt lịch tư vấn" → same prefill behavior

### To Lead Collection
- Nếu user đã nhập tên/sđt trong chat → persist vào store
- Khi handoff → prefill booking form

---

## Risks & Mitigations

### Risk 1: Backend AI chưa ready
**Giảm thiểu**: Dùng MSW mock với scripted responses giống hệt demo flow

### Risk 2: Streaming bị interrupt
**Giảm thiểu**: AbortController để cancel stream, hiển thị partial content + retry

### Risk 3: Chat history grows unbounded
**Giảm thiểu**: Giới hạn 50 messages trong session, oldest first

### Risk 4: Mobile keyboard covers input
**Giảm thiểu**: `visualViewport` API hoặc scrollIntoView khi input focus

### Risk 5: Performance — widget bundle size
**Giảm thiểu**: Dynamic import chatbot, chỉ load khi page hydrate

---

## Definition of Done

Phase 4 được xem là hoàn tất khi:

- [ ] FAB + chat window hoạt động end-to-end
- [ ] Bot greeting + quick replies giống demo
- [ ] User có thể type và nhận bot response
- [ ] Streaming response với typing indicator
- [ ] Quick replies navigation hoạt động
- [ ] Lead collection flow (name → phone → booking prefill)
- [ ] Handoff banner → booking page
- [ ] Bubble popup hiện sau 3s, dismiss được
- [ ] Back-to-top hoạt động
- [ ] Call widget có link đúng
- [ ] Mobile responsive đúng spec
- [ ] Accessibility keyboard navigation
- [ ] Visual parity với demo chatbot section
- [ ] Unit + E2E tests cho critical flows

### Visual Acceptance Checklist

- [ ] FAB kích thước, màu, shadow, badge, hover state giống demo
- [ ] Chat window open/close animation mượt như demo
- [ ] Message bubbles (bot/user) giống demo về màu, border-radius, avatar
- [ ] Quick replies pill styling đúng
- [ ] Typing indicator bounce animation đúng
- [ ] Handoff banner gradient + dot lập lòe đúng
- [ ] Input area styling đúng
- [ ] Bubble popup timing + arrow đúng
- [ ] Back-to-top visible/hidden logic đúng
- [ ] Mobile layout không bị tràn

---

## Recommended Execution Order

1. Setup chatbot feature module + store
2. Port FAB + chat window shell (open/close)
3. Implement message bubbles + message list
4. Implement quick replies
5. Implement typing indicator + streaming
6. Wire mock AI responses (MSW)
7. Implement lead collection flow
8. Implement handoff → booking
9. Add bubble popup
10. Add floating widgets (back-to-top, call)
11. Polish animations + responsive
12. Accessibility audit
13. Unit + E2E tests

---

## Suggested Deliverables

Sau Phase 4, team nên có:

- Chatbot widget toàn cục, có thể import vào bất kỳ page nào
- Chatbot feature module độc lập
- Typed API layer cho chatbot backend
- Conversation memory với sessionStorage
- Lead collection → booking prefill flow
- UI gần như bản React hóa của `frontend/demo/index.html` chatbot section
- Bộ test đủ để tự tin bước sang Phase 5 Admin

---

## Next Phase Dependency

Phase 5 (Admin) nên tận dụng output của Phase 4 ở các điểm:

- Admin có thể xem chat transcripts
- Admin có thể trigger chatbot response
- Analytics chatbot conversation data
- Chatbot handoff → booking data correlation

---

## Final Recommendation

Không nên mở rộng Phase 4 thành "chatbot + agent panel" trong cùng đợt.

Nên giữ scope **Chatbot AI widget thuần**, nhưng làm thật chắc ở cả 2 mặt:

### Mặt 1 — Demo Fidelity
- dựng cực sát `frontend/demo/index.html` chatbot section
- không redesign
- giữ animation timing chính xác

### Mặt 2 — Product Robustness
- streaming response
- conversation memory
- lead collection → booking
- error recovery
- typed API layer
- test coverage

Nếu làm tốt phase này, Phase 5 Admin có thể reuse chatbot data layer cho transcript viewing và analytics.
