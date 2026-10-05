# BRS v2.0 — Frontend Next.js React

## Website Công ty Luật TNHH ICRC

| | |
| :- | :- |
| **Phiên bản** | 2.0 |
| **Ngày** | Tháng 5 / 2026 |
| **Mức độ bảo mật** | NỘI BỘ |
| **Dự án** | Law Firm Website – Frontend Platform |
| **Trạng thái** | Bản nháp kiến trúc — Sẵn sàng review |
| **Backend** | Java Spring Boot 3.3 — xem `BRS_v2_BACKEND.md` |

---

# MỤC LỤC

| # | Section | Mô tả |
| :- | :- | :- |
| 01 | Tổng quan | Mục tiêu, design system |
| 02 | Kiến trúc tổng thể | Feature-first, state, cache, observability |
| 03 | Feature Architecture | Mỗi bounded context là một feature module |
| 04 | Cấu trúc Project | Directory tree đầy đủ |
| 05 | Các trang | 16+ public pages, 4 auth pages, 13 admin pages |
| 06 | Booking Flow | 4-step wizard, optimistic locking, slot reservation |
| 07 | Chatbot AI | Streaming, memory, AI fallback, persistence |
| 08 | Landing Page Builder | CMS-ready: registry, versioning, autosave, A/B |
| 09 | Auth & RBAC | Enterprise auth, permission matrix, team ownership |
| 10 | Cache Strategy | Phân tầng cache, tag-based invalidation |
| 11 | Performance | Dynamic imports, partial hydration, mobile-first |
| 12 | Observability | Sentry, Web Vitals, PostHog funnel tracking |
| 13 | API Integration | Axios, TanStack Query, hooks pattern |
| 14 | Design System | shadcn/ui, Tailwind, Icon Strategy |
| 15 | Error Handling | Zod validation, React Hook Form, error boundaries |
| 16 | Testing | Playwright E2E, MSW, Storybook, Chromatic |
| 17 | Deployment | Vercel, Docker, env vars, CI/CD |
| 18 | Development Workflow | Git, commit convention, PR checklist |
| 19 | Phase Delivery | 9-tuần với task breakdown |
| 20 | References | Links tới docs |

---

# 01. TỔNG QUAN

## 1.1 Mục tiêu dự án

Xây dựng website Next.js React hoàn chỉnh cho Công ty Luật TNHH ICRC — một **feature-first enterprise system** với:

- Website công ty (public pages): trang chủ, dịch vụ, luật sư, blog, tin tức, FAQ, liên hệ
- **Landing pages động** cho chiến dịch marketing (Google Ads, Facebook Ads, email, affiliate) với A/B testing
- Trang đặt lịch tư vấn (booking) với multi-step form + chống race condition
- Chatbot AI hỗ trợ khách hàng 24/7 (streaming, memory, persistence)
- Trang admin dashboard đầy đủ chức năng (CRM, Booking, Blog, Review, Chatbot, Newsletter, Users, Settings, Landing Pages)
- Newsletter subscription
- SEO + performance tối ưu cho mobile + desktop
- i18n: Tiếng Việt (mặc định) + Tiếng Anh
- Observability đầy đủ: error tracking, funnel analytics, Web Vitals

## 1.2 Design System — Thương hiệu ICRC Law

### Color Palette

```css
/* Primary */
--primary: #1E3A5F;
--primary-dark: #152A45;
--primary-light: #2A4F7A;
--primary-faint: #EFF3F8;

/* Accent */
--accent: #C9A84C;
--accent-dark: #B8953D;
--accent-light: #D4B76A;

/* Neutral */
--white: #FFFFFF;
--off-white: #F8F9FA;
--gray-50: #F8F9FA;
--gray-100: #F0F2F5;
--gray-200: #E4E8EF;
--gray-300: #CBD2DC;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;

/* Semantic */
--green: #059669;
--green-bg: #ECFDF5;
--red: #DC2626;
--red-bg: #FEF2F2;
--yellow: #D97706;
--yellow-bg: #FFFBEB;
--blue: #2563EB;
--blue-bg: #EFF6FF;

/* Shadows */
--shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
--shadow-sm: 0 2px 8px rgba(0,0,0,0.07);
--shadow-md: 0 4px 20px rgba(0,0,0,0.08);
--shadow-lg: 0 8px 40px rgba(0,0,0,0.12);

/* Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;

/* Transition */
--transition-fast: 0.2s ease;
--transition-base: 0.3s ease;

/* Typography */
--font-heading: 'Cormorant Garamond', Georgia, serif;
--font-body: 'Plus Jakarta Sans', -apple-system, sans-serif;
```

### Typography Scale

| Token | Size | Weight | Usage |
| :- | :- | :- | :- |
| `--text-xs` | 12px | 400 | Captions, labels |
| `--text-sm` | 14px | 400/500 | Body small, metadata |
| `--text-base` | 16px | 400 | Body text |
| `--text-lg` | 18px | 500 | Lead text |
| `--text-xl` | 20px | 600 | H5 |
| `--text-2xl` | 24px | 700 | H4 |
| `--text-3xl` | 30px | 700 | H3 |
| `--text-4xl` | 36px | 700 | H2 |
| `--text-5xl` | 48px | 700 | H1 (mobile) |
| `--text-6xl` | 60px | 700 | H1 (desktop) |

---

# 02. KIẾN TRÚC TỔNG THỂ

## 2.1 Architecture Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE DECISION TREE                              │
│                                                                               │
│  1. FEATURE-FIRST                                                               │
│     Mỗi bounded context = independent feature module                      │
│     → booking/, chatbot/, crm/, landing-pages/, blog/                       │
│                                                                               │
│  2. SERVER COMPONENTS MAXIMUM                                                    │
│     Chỉ dùng "use client" khi CẦN thiết                                    │
│     → Header, Footer, ServiceCard = Server Components                       │
│     → BookingWizard, ChatPanel, AdminChart = Client Components             │
│                                                                               │
│  3. PHÂN TẦNG CACHE                                                           │
│     Static → ISR → SWR → No-cache                                            │
│     → Tùy data type, không dùng chung strategy                           │
│                                                                               │
│  4. STATE MANAGEMENT                                                            │
│     Zustand (global client) + TanStack Query (server state)                │
│     → Context API chỉ cho provider wrappers đơn giản                       │
│                                                                               │
│  5. CODE SPLITTING                                                            │
│     Admin → lazy load features nặng (charts, editors, kanban)               │
│     Public → ISR + streaming HTML                                           │
│                                                                               │
│  6. OBSERVABILITY                                                            │
│     Sentry (errors) + PostHog (funnels) + Web Vitals (performance)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 State Management — Zustand + TanStack Query

### Nguyên tắc

| Loại state | Công cụ | Lý do |
| :- | :- | :- |
| **Server data** (API calls, caching) | TanStack Query v5 | Auto-retry, stale-while-revalidate, cache management |
| **Domain/Business state** | XState v5 | Finite state machine: booking, chatbot lifecycle |
| **UI ephemeral state** | Zustand v4 | Sidebar, modals, toasts, theme (purely UI) |
| **Server Components data** | React cache / fetch | Server-only, no bundle impact |
| **Form state** | React Hook Form | Performance, validation integration |

---

## 2.2 State Architecture — Purpose-Built

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT — PURPOSE-BUILT                              │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    XState — Booking Flow (Finite State Machine)      │   │
│  │                                                                     │   │
│  │  IDLE → SERVICE_SELECTED → LAWYER_SELECTED → SLOT_RESERVED        │   │
│  │       → SLOT_CONFLICT ─────────────────→ FORM_FILLED → SUBMITTING │   │
│  │       → SLOT_EXPIRED ─────────────────→ SLOT_RESERVED             │   │
│  │       → SUBMITTING ──→ CONFIRMED                                │   │
│  │                                                                     │   │
│  │  ✅ XState: predictable transitions, guards, actions, history    │   │
│  │  ✅ Persist state machine to sessionStorage                    │   │
│  │  ✅ Easy to test, debug, visualize                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    TanStack Query — Chatbot (Cache + Streaming)       │   │
│  │                                                                     │   │
│  │  TanStack Query Cache:                                              │   │
│  │  ├── Chat history (keyed by sessionId)                         │   │
│  │  ├── Message list with infinite queries                       │   │
│  │  └── Optimistic updates for send                           │   │
│  │                                                                     │   │
│  │  Streaming Reducer:                                               │   │
│  │  └── useReducer for streaming token accumulation              │   │
│  │                                                                     │   │
│  │  ✅ Cache = source of truth for history                      │   │
│  │  ✅ Easy pagination, prefetch                              │   │
│  │  ✅ Background refetch                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Zustand — UI Ephemeral State Only                  │   │
│  │                                                                     │   │
│  │  ✅ Sidebar: open/close, collapsed/expanded                     │   │
│  │  ✅ Modal: which modal open, props passed                    │   │
│  │  ✅ Toast: queue, dismiss                                        │   │
│  │  ✅ Theme: dark/light                                         │   │
│  │  ✅ Mobile menu: open/close                                 │   │
│  │                                                                     │   │
│  │  ❌ KHÔNG dùng Zustand cho:                              │   │
│  │     • Auth business logic                                    │   │
│  │     • Booking domain state                                     │   │
│  │     • Chatbot conversation state                               │   │
│  │     • Any state có domain complexity                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Booking — XState Finite State Machine

```typescript
// features/booking/machines/booking-machine.ts
import { createMachine, assign } from 'xstate';
import { create } from 'zustand';

// Booking context
interface BookingContext {
  serviceId: string | null;
  lawyerId: string | null;
  date: string | null;
  timeSlot: string | null;
  reservationId: string | null;
  reservationExpiresAt: number | null;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
    issueDescription: string;
  } | null;
  bookingId: string | null;
  error: string | null;
}

// Events
type BookingEvent =
  | { type: 'SELECT_SERVICE'; serviceId: string }
  | { type: 'SELECT_LAWYER'; lawyerId: string }
  | { type: 'SELECT_DATETIME'; date: string; timeSlot: string }
  | { type: 'SLOT_RESERVED'; reservationId: string; expiresAt: number }
  | { type: 'SLOT_CONFLICT' }
  | { type: 'SLOT_EXPIRED' }
  | { type: 'UPDATE_INFO'; customerInfo: BookingContext['customerInfo'] }
  | { type: 'SUBMIT'; customerInfo: BookingContext['customerInfo'] }
  | { type: 'SUBMIT_SUCCESS'; bookingId: string }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'RESET' };

// XState machine
export const bookingMachine = createMachine<BookingContext, BookingEvent>({
  id: 'booking',
  initial: 'idle',
  context: {
    serviceId: null,
    lawyerId: null,
    date: null,
    timeSlot: null,
    reservationId: null,
    reservationExpiresAt: null,
    customerInfo: null,
    bookingId: null,
    error: null,
  },
  states: {
    idle: {
      on: {
        SELECT_SERVICE: {
          target: 'service_selected',
          actions: assign({ serviceId: ({ event }) => event.serviceId }),
        },
      },
    },
    service_selected: {
      on: {
        SELECT_LAWYER: {
          target: 'lawyer_selected',
          actions: assign({ lawyerId: ({ event }) => event.lawyerId }),
        },
        RESET: { target: 'idle', actions: 'resetContext' },
      },
    },
    lawyer_selected: {
      on: {
        SELECT_DATETIME: {
          target: 'reserving_slot',
          actions: assign({
            date: ({ event }) => event.date,
            timeSlot: ({ event }) => event.timeSlot,
          }),
        },
        RESET: { target: 'idle', actions: 'resetContext' },
      },
    },
    reserving_slot: {
      invoke: {
        src: 'reserveSlot',
        input: ({ context }) => ({
          lawyerId: context.lawyerId!,
          date: context.date!,
          timeSlot: context.timeSlot!,
        }),
        onDone: {
          target: 'slot_reserved',
          actions: assign({
            reservationId: ({ event }) => event.output.reservationId,
            reservationExpiresAt: ({ event }) => event.output.expiresAt,
          }),
        },
        onError: {
          target: 'slot_conflict',
          actions: assign({ error: ({ event }) => event.errorMessage }),
        },
      },
    },
    slot_reserved: {
      on: {
        UPDATE_INFO: {
          target: 'form_filled',
          actions: assign({ customerInfo: ({ event }) => event.customerInfo }),
        },
        SLOT_EXPIRED: {
          target: 'lawyer_selected',
          actions: assign({
            timeSlot: () => null,
            reservationId: () => null,
            reservationExpiresAt: () => null,
          }),
        },
        RESET: { target: 'idle', actions: 'resetContext' },
      },
    },
    slot_conflict: {
      on: {
        SELECT_DATETIME: {
          target: 'reserving_slot',
          actions: assign({
            date: ({ event }) => event.date,
            timeSlot: ({ event }) => event.timeSlot,
            error: () => null,
          }),
        },
        RESET: { target: 'idle', actions: 'resetContext' },
      },
    },
    form_filled: {
      on: {
        SUBMIT: {
          target: 'submitting',
          actions: assign({ customerInfo: ({ event }) => event.customerInfo }),
        },
        SELECT_DATETIME: {
          target: 'reserving_slot',
          actions: assign({
            customerInfo: () => null,
            date: ({ event }) => event.date,
            timeSlot: ({ event }) => event.timeSlot,
          }),
        },
        RESET: { target: 'idle', actions: 'resetContext' },
      },
    },
    submitting: {
      invoke: {
        src: 'submitBooking',
        input: ({ context }) => context,
        onDone: {
          target: 'confirmed',
          actions: assign({ bookingId: ({ event }) => event.output.bookingId }),
        },
        onError: {
          target: 'form_filled',
          actions: assign({ error: ({ event }) => event.errorMessage }),
        },
      },
    },
    confirmed: {
      type: 'final',
    },
  },
}, {
  actions: {
    resetContext: assign({
      serviceId: () => null,
      lawyerId: () => null,
      date: () => null,
      timeSlot: () => null,
      reservationId: () => null,
      reservationExpiresAt: () => null,
      customerInfo: () => null,
      bookingId: () => null,
      error: () => null,
    }),
  },
});
```

### Zustand — UI Ephemeral State Only

```typescript
// stores/ui.store.ts — CHỈ UI state, KHÔNG có business logic

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Modal
  activeModal: string | null;
  modalProps: Record<string, unknown>;
  openModal: (modalId: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Toast
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: UIState['theme']) => void;

  // Mobile menu
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  // Sidebar
  sidebarOpen: true,
  sidebarCollapsed: false,
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Modal
  activeModal: null,
  modalProps: {},
  openModal: (modalId, props = {}) => set({ activeModal: modalId, modalProps: props }),
  closeModal: () => set({ activeModal: null, modalProps: {} }),

  // Toast
  toasts: [],
  addToast: (toast) => set(state => ({
    toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
  })),
  removeToast: (id) => set(state => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),

  // Theme
  theme: 'system',
  setTheme: (theme) => {
    document.documentElement.classList.remove('light', 'dark');
    if (theme !== 'system') {
      document.documentElement.classList.add(theme);
    }
    set({ theme });
  },

  // Mobile menu
  mobileMenuOpen: false,
  toggleMobileMenu: () => set(state => ({ mobileMenuOpen: !state.mobileMenuOpen })),
}));
```

### API Client — Session Manager Unified

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUTH ARCHITECTURE — SINGLE RESPONSIBILITY                    │
│                                                                               │
│  lib/auth/                                                                   │
│  └── session-manager.ts   # DUY NHẤT một nơi quản lý:                     │
│      ├── Token refresh logic                                              │
│      ├── Session sync (NextAuth ↔ Zustand)                                 │
│      ├── Auth state (loading, authenticated, error)                        │
│      ├── Logout + token cleanup                                           │
│      └── Retry queue (pending requests khi refresh)                       │
│                                                                               │
│  lib/api/                                                                   │
│  ├── server-client.ts   # Server Components — Bearer token từ session      │
│  └── client.ts         # Client Components — gọi session-manager          │
│                                                                               │
│  CÁC COMPONENT KHÔNG TỰ QUẢN LÝ AUTH → GỌI session-manager            │
└─────────────────────────────────────────────────────────────────────────────┘
```

```typescript
// lib/auth/session-manager.ts
// SINGLE SOURCE OF TRUTH cho auth flow — KHÔNG duplicate ở interceptor

class SessionManager {
  private static instance: SessionManager;
  private _isRefreshing = false;
  private _refreshSubscribers: Array<(token: string) => void> = [];

  // Event emitters cho reactive auth state
  private _listeners: Set<(state: AuthState) => void> = new Set();
  private _state: AuthState = {
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  };

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // ── Reactive State ───────────────────────────────────────────
  subscribe(listener: (state: AuthState) => void): () => void {
    this._listeners.add(listener);
    listener(this._state); // Emit current state
    return () => this._listeners.delete(listener);
  }

  private _emit(state: Partial<AuthState>) {
    this._state = { ...this._state, ...state };
    this._listeners.forEach(listener => listener(this._state));
  }

  // ── Session Sync (NextAuth ↔ Zustand) ─────────────────────────
  // Gọi khi useSession() thay đổi
  syncFromNextAuth(session: Session | null, status: 'loading' | 'authenticated' | 'unauthenticated') {
    if (status === 'loading') {
      this._emit({ isLoading: true });
      return;
    }

    if (status === 'authenticated' && session?.user) {
      this._emit({
        isAuthenticated: true,
        isLoading: false,
        user: session.user as User,
        error: null,
      });
    } else {
      this._emit({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    }
  }

  // ── Token Refresh ─────────────────────────────────────────────
  async refreshToken(): Promise<string | null> {
    if (this._isRefreshing) {
      // Wait for existing refresh
      return new Promise((resolve) => {
        this._refreshSubscribers.push(resolve);
      });
    }

    this._isRefreshing = true;

    try {
      // Gọi NextAuth refresh endpoint
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.accessToken) {
        // Notify waiting requests
        this._refreshSubscribers.forEach(cb => cb(data.accessToken));
        this._refreshSubscribers = [];
        return data.accessToken;
      }

      // Refresh failed → logout
      await this.logout();
      return null;
    } catch (error) {
      console.error('[SessionManager] Token refresh failed:', error);
      await this.logout();
      return null;
    } finally {
      this._isRefreshing = false;
    }
  }

  // ── Logout ─────────────────────────────────────────────────
  async logout() {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (e) {
      // Ignore logout API errors
    }

    // Clear all state
    this._emit({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
    });

    // Redirect
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // ── Handle 401 ──────────────────────────────────────────────
  async handleUnauthorized(): Promise<boolean> {
    const token = await this.refreshToken();
    return token !== null;
  }

  get state(): AuthState {
    return this._state;
  }
}

// Export singleton
export const sessionManager = SessionManager.getInstance();

// Hook for components
export function useSessionManager() {
  const [state, setState] = useState<AuthState>(sessionManager.state);

  useEffect(() => {
    return sessionManager.subscribe(setState);
  }, []);

  return {
    ...state,
    logout: () => sessionManager.logout(),
    refreshToken: () => sessionManager.refreshToken(),
  };
}
```

```typescript
// lib/api/client.ts — GỌI session-manager, KHÔNG tự quản lý auth

import axios from 'axios';
import { sessionManager } from '@/lib/auth/session-manager';

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — Gọi session-manager
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401: Delegate to session manager
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshed = await sessionManager.handleUnauthorized();

      if (refreshed) {
        return client(originalRequest); // Retry
      }
    }

    return Promise.reject(error);
  }
);

export { client as apiClient };
```

```typescript
// lib/api/server-client.ts — Server-side, dùng NextAuth trực tiếp
import axios from 'axios';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/features/auth/providers/auth-provider';

export async function serverFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const session = await getServerSession(authOptions);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// Usage
const bookings = await serverFetch<Booking[]>('/bookings');
```

### Feature State — Vertical Slice (Flat Structure)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FEATURE STRUCTURE — VERTICAL SLICE                          │
│                                                                               │
│  BEFORE (quá sâu):                      AFTER (flat):                   │
│  features/chatbot/ui/                   features/chatbot/              │
│  features/chatbot/state/                     components/                  │
│  features/chatbot/transport/               hooks/                       │
│  features/chatbot/ai/                      machines/                    │
│  features/chatbot/memory/                  types/                       │
│  features/chatbot/analytics/               lib/                        │
│  features/chatbot/prompts/                 index.ts                     │
│                                                                               │
│  PROBLEM:                          SOLUTION:                              │
│  • Import paths quá dài              • Giới hạn 2 levels: feature/       │
│  • Navigate khó                     • Chỉ tách khi thật sự cần       │
│  • Mental overhead lớn              • exports qua index.ts            │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
features/
├── booking/
│   ├── components/        # UI components
│   ├── hooks/            # use-booking, use-availability
│   ├── machines/         # XState booking machine
│   ├── types/            # TypeScript types
│   ├── lib/             # Helpers (không có sub-folders)
│   └── index.ts         # Public exports
│
├── chatbot/
│   ├── components/       # ChatPanel, MessageBubble, ChatInput
│   ├── hooks/            # use-chat, use-stream
│   ├── machines/         # Chat state machine
│   ├── types/           # ChatMessage, ChatSession
│   ├── lib/             # AI processor, prompt builder
│   └── index.ts
│
├── crm/
│   ├── components/       # LeadTable, KanbanBoard
│   ├── hooks/           # use-leads, use-kanban
│   ├── types/
│   ├── lib/
│   └── index.ts
│
├── landing-pages/
│   ├── components/       # SectionRenderer, SectionRegistry
│   ├── admin/           # Builder, ABTestPanel
│   ├── hooks/
│   ├── types/
│   ├── lib/             # A/B testing, versioning
│   └── index.ts
│
└── blog/
    ├── components/       # BlogCard, BlogEditor
    ├── hooks/
    ├── types/
    ├── lib/
    └── index.ts
```

### Server Actions — Mutations on Server

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SERVER ACTIONS — WHERE TO USE                                │
│                                                                               │
│  USE SERVER ACTIONS:                                                         │
│  ✅ Form submissions (login, contact, newsletter)                          │
│  ✅ Booking submission (with server-side validation)                        │
│  ✅ Data mutations that don't need immediate UI feedback                      │
│  ✅ Progressive enhancement (works without JS)                                │
│  ✅ Mutations requiring server-side auth validation                           │
│                                                                               │
│  USE API ROUTES + TanStack Query:                                           │
│  ⚠️  Complex data fetching with pagination, filters                         │
│  ⚠️  Real-time data (polling)                                              │
│  ⚠️  Mutations requiring optimistic updates                                 │
│  ⚠️  Complex client-side state management                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

```typescript
// app/actions/auth-actions.ts
'use server';

import { signIn } from '@/features/auth/providers/auth-provider';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: 'Email hoặc mật khẩu không đúng' };
    }

    redirect('/admin');
  } catch (error) {
    console.error('[loginAction]', error);
    return { error: 'Đã xảy ra lỗi. Vui lòng thử lại.' };
  }
}

export async function logoutAction() {
  const { signOut } = await import('@/features/auth/providers/auth-provider');
  await signOut({ redirect: false });
  redirect('/login');
}

// app/actions/contact-actions.ts
export async function submitContactAction(formData: FormData) {
  // Server-side validation
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().regex(/^0[1-9]\d{8,9}$/),
    message: z.string().min(10),
  });

  const data = schema.parse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    message: formData.get('message'),
  });

  // Send to backend
  await serverFetch('/contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Send notification email
  await sendEmail({
    to: 'contact@luathung.vn',
    subject: `Liên hệ từ ${data.name}`,
    body: data.message,
  });

  return { success: true };
}
```

### Auth Security Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AUTH SECURITY — BẮT BUỘC                              │
│                                                                               │
│  ✅ HttpOnly Cookie — Token được lưu trong cookie HttpOnly                │
│     → JavaScript không đọc được → Không XSS lấy token                     │
│                                                                               │
│  ✅ SameSite=Strict/Lax — Cookie không được gửi cross-origin              │
│     → Chống CSRF                                                           │
│                                                                               │
│  ✅ HTTPS Only — Cookie chỉ gửi qua HTTPS                                  │
│     → Chống man-in-the-middle                                             │
│                                                                               │
│  ✅ Secure Flag — Cookie chỉ gửi qua HTTPS                                 │
│     → Production bắt buộc                                                   │
│                                                                               │
│  ✅ Session Expiry — JWT hết hạn sau 1 giờ, refresh token 7 ngày         │
│     → Giảm thiểu risk nếu token bị leak                                   │
│                                                                               │
│  ❌ KHÔNG BAO GIỜ lưu token trong:                                          │
│     • localStorage                                                           │
│     • sessionStorage                                                         │
│     • Zustand persist (localStorage mặc định)                               │
│     • URL parameters                                                         │
│     • Console logs                                                           │
│                                                                               │
│  ❌ KHÔNG BAO GIỜ expose token ra client-side JavaScript                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### NextAuth.js — HttpOnly Cookie + Silent Refresh

```typescript
// features/auth/providers/auth-provider.tsx
// NextAuth.js v5 — Token được quản lý qua HttpOnly Cookie + Silent Refresh

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authApi } from '@/features/auth/api/auth-api';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string };
        const result = await authApi.login(email, password);
        if (result.user && result.token) {
          return {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
            permissions: result.user.permissions,
          };
        }
        return null;
      },
    }),
  ],

  callbacks: {
    jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
      }

      // ⚠️ Silent refresh: Cập nhật token nếu cần
      if (trigger === 'update') {
        // Token được update từ client (ví dụ: role thay đổi)
        return { ...token, ...(trigger === 'update' ? user : {}) };
      }

      return token;
    },

    session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  // ⚠️ Session strategy với refresh
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // Access token: 1 giờ
  },

  // ⚠️ Cookie configuration — HttpOnly, Secure, SameSite
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
    },
  },
});
```

### Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SILENT TOKEN REFRESH FLOW                                 │
│                                                                               │
│  1. User login → NextAuth set HttpOnly Cookie (access token)                │
│  2. Client gửi request với HttpOnly Cookie                                 │
│  3. Backend nhận request, verify token                                     │
│  4. Token hết hạn (401)                                                   │
│     ↓                                                                       │
│  5. Client interceptor bắt 401                                              │
│     ↓                                                                       │
│  6. Gọi POST /api/auth/session (refresh)                                   │
│     ↓                                                                       │
│  7. Backend verify refresh token, issue access token mới                   │
│     ↓                                                                       │
│  8. Client retry request gốc với token mới                                 │
│     ↓                                                                       │
│  9. Refresh token hết hạn → redirect /login                                │
│                                                                               │
│  ⚠️ Refresh token: HttpOnly Cookie riêng, expiry dài hơn (7 ngày)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backend Refresh Token Endpoint (Spring Boot)

```java
// Backend: Refresh token endpoint
@PostMapping("/auth/refresh")
public ResponseEntity<?> refreshToken(HttpServletRequest request,
                                     HttpServletResponse response) {
    String refreshToken = extractRefreshTokenFromCookie(request);

    if (refreshToken == null || jwtProvider.isExpired(refreshToken)) {
        return ResponseEntity.status(401).body(Map.of("error", "REFRESH_TOKEN_EXPIRED"));
    }

    // Issue new access token
    String userId = jwtProvider.getUserIdFromToken(refreshToken);
    User user = userRepository.findById(userId).orElseThrow();

    String newAccessToken = jwtProvider.generateAccessToken(user);

    // Set new HttpOnly cookie
    Cookie accessCookie = new Cookie("access_token", newAccessToken);
    accessCookie.setHttpOnly(true);
    accessCookie.setSecure(true);
    accessCookie.setSameSite("Lax");
    accessCookie.setMaxAge(3600); // 1 hour
    response.addCookie(accessCookie);

    return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
}
```

// Server Component: Lấy session bất kỳ đâu
// app/admin/page.tsx
import { auth } from '@/features/auth/providers/auth-provider';

export default async function AdminPage() {
  const session = await auth();  // Đọc từ HttpOnly Cookie — KHÔNG cần token

  if (!session) {
    redirect('/login');
  }

  return <AdminDashboard user={session.user} />;
}

// API Route: Lấy session
// app/api/protected/route.ts
import { auth } from '@/features/auth/providers/auth-provider';

export async function GET() {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return Response.json({ data: 'secret' });
}
```

### RBAC Permission Matrix

```typescript
// features/auth/utils/permissions.ts — Giữ nguyên
// KHÔNG thay đổi phần này
```

// stores/booking.store.ts

interface ReservedSlot {
  slotId: string;
  expiresAt: number;       // Unix timestamp
  serverReservationId: string; // Backend reservation ID
}

interface BookingState {
  // Wizard state
  step: 1 | 2 | 3 | 4;
  service: string | null;
  lawyer: string | null;
  date: string | null;
  timeSlot: string | null;
  // Slot reservation (prevent race condition)
  reservedSlot: ReservedSlot | null;
  // Form data
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
    issueDescription: string;
  } | null;
  // Hydration
  isHydrated: boolean;
  // Actions
  setStep: (step: 1 | 2 | 3 | 4) => void;
  reserveSlot: (slotId: string) => Promise<boolean>;
  releaseSlot: () => void;
  submitBooking: (data: BookingFormData) => Promise<string>;
  checkSlotStatus: () => Promise<'valid' | 'expired' | 'conflict'>;
  reset: () => void;
}

// stores/booking.store.ts — PERSIST STRATEGY
// Dùng sessionStorage (không phải localStorage) để:
// 1. Tự động xóa khi tab đóng
// 2. Không share giữa các tabs
// 3. Refresh trang vẫn giữ state
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      step: 1,
      service: null,
      lawyer: null,
      date: null,
      timeSlot: null,
      reservedSlot: null,
      customerInfo: null,
      isHydrated: false,

      setStep: (step) => set({ step }),

      reserveSlot: async (slotId) => {
        try {
          const res = await clientClient.post('/availability/reserve', { slotId });

          if (res.status === 200) {
            const { expiresAt, reservationId } = res.data;
            set({
              reservedSlot: {
                slotId,
                expiresAt: new Date(expiresAt).getTime(),
                serverReservationId: reservationId,
              },
            });
            return true;
          }

          if (res.status === 409) {
            // Slot đã bị đặt bởi người khác
            toast.error('Slot này vừa được đặt. Vui lòng chọn slot khác.');
            return false;
          }

          return false;
        } catch (error) {
          toast.error('Không thể giữ chỗ. Vui lòng thử lại.');
          return false;
        }
      },

      releaseSlot: async () => {
        const { reservedSlot } = get();
        if (!reservedSlot) return;

        try {
          await clientClient.delete(`/availability/reserve/${reservedSlot.serverReservationId}`);
        } catch (error) {
          console.error('Failed to release slot:', error);
        }

        set({ reservedSlot: null, timeSlot: null });
      },

      // Kiểm tra slot reservation còn valid không khi reload trang
      checkSlotStatus: async () => {
        const { reservedSlot } = get();
        if (!reservedSlot) return 'expired';

        // 1. Check local expiry
        const now = Date.now();
        if (now > reservedSlot.expiresAt) {
          set({ reservedSlot: null, step: 2 });
          toast.warning('Lịch hẹn của bạn đã hết hạn giữ chỗ.');
          return 'expired';
        }

        // 2. Verify với server
        try {
          const res = await clientClient.get(`/availability/reserve/${reservedSlot.serverReservationId}`);

          if (res.status === 200 && res.data.valid) {
            return 'valid';
          }

          // Server says invalid
          set({ reservedSlot: null, step: 2 });
          return 'expired';
        } catch {
          set({ reservedSlot: null, step: 2 });
          return 'expired';
        }
      },

      submitBooking: async (data: BookingFormData) => {
        const { reservedSlot } = get();
        if (!reservedSlot) throw new Error('No reserved slot');

        const res = await clientClient.post('/bookings', {
          ...data,
          reservationId: reservedSlot.serverReservationId,
        });

        set({ reservedSlot: null }); // Clear after success
        return res.data.bookingId;
      },

      reset: () => set({
        step: 1,
        service: null,
        lawyer: null,
        date: null,
        timeSlot: null,
        reservedSlot: null,
        customerInfo: null,
      }),
    }),
    {
      name: 'booking-state',           // sessionStorage key
      storage: createJSONStorage(() => sessionStorage), // Tab-specific, auto-clear on close
      partialize: (state) => ({
        step: state.step,
        service: state.service,
        lawyer: state.lawyer,
        date: state.date,
        timeSlot: state.timeSlot,
        reservedSlot: state.reservedSlot,
        customerInfo: state.customerInfo,
      }),
      onRehydrateStorage: () => (state) => {
        // Sau khi hydrate từ sessionStorage → verify slot với server
        if (state) {
          state.isHydrated = true;
          if (state.reservedSlot) {
            state.checkSlotStatus();
          }
        }
      },
    }
  )
);

// Component: BookingWizard — Reload-safe
function BookingWizard() {
  const { step, isHydrated, reservedSlot } = useBookingStore();

  // Chờ hydrate từ sessionStorage
  if (!isHydrated) {
    return <BookingSkeleton />;
  }

  // Check slot còn valid không
  useEffect(() => {
    if (reservedSlot) {
      const interval = setInterval(async () => {
        const status = useBookingStore.getState().checkSlotStatus();
        if (status === 'expired') {
          clearInterval(interval);
        }
      }, 60_000); // Check mỗi phút

      return () => clearInterval(interval);
    }
  }, [reservedSlot]);

  return (
    <div>
      {step === 1 && <StepService />}
      {step === 2 && <StepLawyer />}
      {step === 3 && <StepDatetime />}
      {step === 4 && <StepConfirm />}
    </div>
  );
}
```

## 2.3 Cache Strategy — Đơn giản hóa

### Cache Decision Matrix (Simplified)

| Data Type | Strategy | Revalidation | Notes |
| :- | :- | :- | :- |
| Blog posts | ISR | 1 giờ | SEO-heavy, rarely change |
| Services | ISR | 30 phút | Marketing pages |
| Lawyers | ISR | 1 giờ | Public profiles |
| FAQ | ISR | 24 giờ | Rarely change |
| Landing pages | ISR | 5 phút | Campaign pages |
| Booking slots | SWR | 30 giây | Real-time availability |
| Admin dashboard | No-cache | — | Always fresh |
| CRM leads | No-cache | — | Real-time |
| Chat history | SWR | 60 giây | Persistence |

### Cache Tags — Chỉ khi cần

```typescript
// Cache tags CHỈ dùng khi:
// 1. Cần on-demand invalidation từ CMS
// 2. Data thay đổi không predictable

// Nếu không cần on-demand → dùng time-based ISR đủ rồi

// On-demand revalidation webhook
// app/api/revalidate/route.ts
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  const { tag, path, secret } = await req.json();

  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: 'Invalid secret' }, { status: 401 });
  }

  if (tag) {
    revalidateTag(tag);
  }
  if (path) {
    revalidatePath(path);
  }

  return Response.json({ revalidated: true });
}
```

## 2.4 Observability Stack

### Sentry — Error Tracking

```typescript
// instrumentation.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Tag pages by route
  beforeSend(event) {
    event.tags = { ...event.tags, environment: process.env.NODE_ENV };
    return event;
  },

  // Ignore hydration errors that are noise
  ignoreErrors: [
    'Hydration mismatch',
    'Text content does not match',
  ],
});

// Custom error boundary
// ErrorBoundary component wrap entire app
// → Catch: runtime errors, 404, 500, API failures
// → Report: Sentry with full context
// → UX: Graceful fallback UI, not blank page
```

### PostHog — Product Analytics

```typescript
// lib/analytics.ts
import { posthog } from 'posthog-js';
import { isServer } from '@/lib/utils';

// PageView tracking
export function trackPageView(url: string, properties?: Record<string, any>) {
  posthog.capture('$pageview', { url, ...properties });
}

// Funnel: Landing Page → Booking
export function trackBookingFunnel(steps: {
  landingPageView?: boolean;
  bookingStart?: boolean;
  bookingStep2?: boolean;
  bookingStep3?: boolean;
  bookingComplete?: boolean;
}) {
  posthog.capture('booking_funnel', steps);
}

// Track: Chatbot conversations
export function trackChatbot(event: string, properties?: Record<string, any>) {
  posthog.capture(`chatbot_${event}`, properties);
}

// Track: Lead quality by source
export function trackLeadConversion(lead: {
  source: 'google_ads' | 'facebook_ads' | 'organic' | 'chatbot';
  service?: string;
  value?: number;
}) {
  posthog.capture('lead_converted', lead);
}

// Web Vitals tracking
export function trackWebVitals(metric: NextWebVitalsMetric) {
  posthog.capture('web_vitals', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  });
}
```

### Web Vitals Targets

| Metric | Target | Current Strategy |
| :- | :- | :- |
| **LCP** | < 2.5s | ISR, priority images, font preload |
| **CLS** | < 0.1 | Reserved image dimensions, font-display: swap |
| **INP** | < 200ms | Server components, minimal JS, code splitting |
| **TTFB** | < 600ms | Edge caching, CDN |

---

## 2.5 Logging Strategy — Audit, Business, Security

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LOGGING STRATEGY                                       │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    FRONTEND LOGGING                                   │   │
│  │                                                                     │   │
│  │  1. Sentry (Error)                                                │   │
│  │     ├── Runtime errors                                              │   │
│  │     ├── API failures                                               │   │
│  │     ├── Hydration errors                                            │   │
│  │     └── Performance issues                                          │   │
│  │                                                                     │   │
│  │  2. PostHog (Business)                                            │   │
│  │     ├── User actions                                                │   │
│  │     ├── Feature usage                                               │   │
│  │     └── Conversion funnels                                          │   │
│  │                                                                     │   │
│  │  3. Console (Development only)                                     │   │
│  │     └── Debug logs, stripped in production                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    BACKEND LOGGING (Spring Boot)                     │   │
│  │                                                                     │   │
│  │  1. Audit Log — Law Firm Required                                   │   │
│  │     ├── User login/logout                                           │   │
│  │     ├── Permission changes                                          │   │
│  │     ├── Role changes                                               │   │
│  │     ├── CRUD operations on:                                         │   │
│  │     │   ├── Blog posts                                            │   │
│  │     │   ├── Landing pages                                         │   │
│  │     │   ├── User accounts                                         │   │
│  │     │   └── Booking data                                          │   │
│  │     └── Failed login attempts                                      │   │
│  │                                                                     │   │
│  │  2. Security Log                                                   │   │
│  │     ├── XSS attempts                                               │   │
│  │     ├── SQL injection attempts                                      │   │
│  │     ├── Unauthorized access attempts                                │   │
│  │     └── Rate limit violations                                      │   │
│  │                                                                     │   │
│  │  3. Business Log                                                   │   │
│  │     ├── Booking events                                             │   │
│  │     ├── Lead creation                                              │   │
│  │     ├── Newsletter subscription                                    │   │
│  │     └── Chatbot escalations                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Frontend Audit Events

```typescript
// lib/audit/audit-logger.ts
// Frontend chỉ gửi audit event lên backend

interface AuditEvent {
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

const AUDIT_EVENTS = {
  // Auth
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  LOGIN_FAILED: 'auth.login_failed',

  // Blog
  BLOG_CREATED: 'blog.created',
  BLOG_UPDATED: 'blog.updated',
  BLOG_DELETED: 'blog.deleted',
  BLOG_PUBLISHED: 'blog.published',

  // Landing pages
  LP_CREATED: 'landing_page.created',
  LP_EDITED: 'landing_page.edited',
  LP_PUBLISHED: 'landing_page.published',

  // Users
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_ROLE_CHANGED: 'user.role_changed',
  USER_DELETED: 'user.deleted',

  // Booking
  BOOKING_CREATED: 'booking.created',
  BOOKING_CANCELLED: 'booking.cancelled',
} as const;

class AuditLogger {
  private queue: AuditEvent[] = [];
  private flushInterval: number;

  constructor(flushInterval = 5000) {
    this.flushInterval = flushInterval;
    setInterval(() => this.flush(), flushInterval);
  }

  log(action: keyof typeof AUDIT_EVENTS, resource: string, resourceId?: string, metadata?: Record<string, unknown>) {
    const event: AuditEvent = {
      timestamp: new Date().toISOString(),
      userId: getCurrentUserId(),
      action: AUDIT_EVENTS[action],
      resource,
      resourceId,
      metadata,
    };

    this.queue.push(event);
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch('/api/audit', {
        method: 'POST',
        body: JSON.stringify({ events }),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      // Re-queue on failure
      this.queue.unshift(...events);
    }
  }
}

export const auditLogger = new AuditLogger();

// Usage
auditLogger.log('BLOG_PUBLISHED', 'post', postId, { previousStatus: 'draft' });
auditLogger.log('USER_ROLE_CHANGED', 'user', userId, {
  previousRole: 'EDITOR',
  newRole: 'ADMIN',
});
```

---

## 2.6 Rate Limiting & Spam Prevention

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RATE LIMITING STRATEGY                                       │
│                                                                               │
│  LAYER 1: FRONTEND (UX Level)                                              │
│  ├── Debounce: Search input (300ms), Form submit (prevent double-click)   │
│  ├── Disable button: Disable trong khi đang submit                         │
│  └── Spam detection: Block nếu user click > 5 lần trong 10s              │
│                                                                               │
│  LAYER 2: API (Server Level)                                              │
│  ├── Booking: 3 requests/phút/user                                         │
│  ├── Contact form: 5 requests/phút/IP                                       │
│  ├── Newsletter: 2 requests/phút/email                                     │
│  └── Chatbot: 20 messages/phút/user                                        │
│                                                                               │
│  LAYER 3: CDN/WAF (Infrastructure)                                         │
│  └── Rate limit headers + blocking                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Frontend Rate Limiting

```typescript
// lib/rate-limit/rate-limiter.ts

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMITS = {
  booking: { maxRequests: 3, windowMs: 60_000 },
  contact: { maxRequests: 5, windowMs: 60_000 },
  newsletter: { maxRequests: 2, windowMs: 60_000 },
  chatbot: { maxRequests: 20, windowMs: 60_000 },
} as const;

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  check(action: keyof typeof RATE_LIMITS): { allowed: boolean; remaining: number; resetIn: number } {
    const key = `${action}_${getCurrentUserId()}`;
    const config = RATE_LIMITS[action];
    const now = Date.now();

    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(t => now - t < config.windowMs);

    if (validTimestamps.length >= config.maxRequests) {
      const oldest = Math.min(...validTimestamps);
      const resetIn = config.windowMs - (now - oldest);
      return { allowed: false, remaining: 0, resetIn };
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return {
      allowed: true,
      remaining: config.maxRequests - validTimestamps.length,
      resetIn: 0,
    };
  }
}

export const rateLimiter = new RateLimiter();

// Hook usage
function useSubmitBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (data: BookingData) => {
    const limit = rateLimiter.check('booking');
    if (!limit.allowed) {
      toast.error(`Vui lòng chờ ${Math.ceil(limit.resetIn / 1000)}s`);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitBooking(data);
      toast.success('Đặt lịch thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting };
}
```

### Debounce & Anti-Spam

```typescript
// lib/hooks/use-debounce-submit.ts

// Debounce cho search
export function useDebounceSearch<T>(callback: (value: T) => void, delay = 300) {
  const [value, setValue] = useState<T>(null as unknown as T);

  useEffect(() => {
    const timer = setTimeout(() => {
      callback(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay, callback]);

  return setValue;
}

// Anti-double-click submit
export function useSubmitOnce<T, R>(asyncFn: (data: T) => Promise<R>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (data: T): Promise<R | null> => {
    if (isSubmitting) return null;

    setIsSubmitting(true);
    try {
      return await asyncFn(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting };
}
```

---

## 2.7 Offline & Poor Network Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OFFLINE / POOR NETWORK STRATEGY                              │
│                                                                               │
│  PROBLEM: Mobile Vietnam network                                            │
│  ├── Mạng yếu, packet loss cao                                          │
│  ├── Refresh giữa chừng                                                    │
│  ├── SSE disconnect/reconnect                                               │
│  └── Request timeout                                                        │
│                                                                               │
│  SOLUTIONS:                                                                  │
│  1. Optimistic UI — Cập nhật UI trước, rollback nếu fail               │
│  2. Retry Queue — Queue request khi offline, replay khi online             │
│  3. SSE Reconnect — Auto-reconnect với exponential backoff                 │
│  4. Timeout Handling — Timeout rõ ràng, user feedback                     │
│  5. Offline Detection — Detect offline, disable actions cần network          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Optimistic UI & Rollback

```typescript
// lib/hooks/use-optimistic-mutation.ts

interface OptimisticConfig<TData, TVariables, TError> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  updateFn: (data: TData, variables: TVariables) => void;
  rollbackFn: (variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
}

function useOptimisticMutation<TData, TVariables, TError>({
  mutationFn,
  updateFn,
  rollbackFn,
  onError,
}: OptimisticConfig<TData, TVariables, TError>) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationFn,

    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries();

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistic update
      queryClient.setQueryData(queryKey, (old: unknown) => updateFn(old as TData, variables));

      return { previousData };
    },

    onError: (error, variables, context) => {
      // Rollback
      queryClient.setQueryData(queryKey, context?.previousData);

      onError?.(error, variables);
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// Usage: Newsletter subscription
const subscribe = useOptimisticMutation({
  mutationFn: (email: string) => api.post('/newsletter', { email }),
  updateFn: (data, email) => ({ ...data, pending: true }),
  rollbackFn: () => {},
  onError: () => toast.error('Không thể đăng ký. Vui lòng thử lại.'),
});
```

### SSE Reconnect with Backoff

```typescript
// features/chatbot/lib/stream-reconnect.ts

class StreamReconnect {
  private url: string;
  private maxRetries = 5;
  private baseDelay = 1000;
  private reader: ReadableStreamDefaultReader | null = null;
  private onMessage: (data: string) => void;
  private onError: (error: Error) => void;
  private abortController: AbortController;

  constructor(
    url: string,
    onMessage: (data: string) => void,
    onError: (error: Error) => void
  ) {
    this.url = url;
    this.onMessage = onMessage;
    this.onError = onError;
    this.abortController = new AbortController();
  }

  async connect() {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(this.url, {
          signal: this.abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        this.reader = reader;
        this.readStream(); // Start reading
        return; // Success
      } catch (error) {
        if (this.abortController.signal.aborted) return;

        const delay = this.baseDelay * Math.pow(2, attempt);
        console.log(`[StreamReconnect] Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);

        await this.sleep(delay);
      }
    }

    this.onError(new Error('Max retries exceeded'));
  }

  private async readStream() {
    const decoder = new TextDecoder();

    while (true) {
      try {
        const { done, value } = await this.reader!.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            this.onMessage(line.slice(6));
          }
        }
      } catch (error) {
        if (!this.abortController.signal.aborted) {
          this.onError(error as Error);
          this.connect(); // Reconnect
        }
        break;
      }
    }
  }

  disconnect() {
    this.abortController.abort();
    this.reader?.cancel();
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 2.8 Accessibility (A11y) Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ACCESSIBILITY — ENTERPRISE REQUIREMENT                       │
│                                                                               │
│  WHY: Law firm website phải accessible cho:                               │
│  ├── Người khuyết tật (blind, low vision, motor impairment)            │
│  ├── Người lớn tuổi (reduced dexterity, vision)                          │
│  └── SEO + Legal compliance                                              │
│                                                                               │
│  PRIORITY LEVELS:                                                          │
│  P0: WCAG 2.1 AA — Bắt buộc                                             │
│  ├── Keyboard navigation                                               │
│  ├── Focus management                                                  │
│  ├── Screen reader support (aria)                                       │
│  └── Color contrast                                                    │
│                                                                               │
│  P1: Enhanced accessibility                                             │
│  ├── Focus trap (modals)                                              │
│  ├── Skip links                                                       │
│  └── Reduced motion                                                  │
│                                                                               │
│  P2: Nice-to-have                                                    │
│  ├── High contrast mode                                               │
│  └── Font size controls                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### WCAG 2.1 AA Checklist

```typescript
// lib/a11y/a11y-checklist.ts

const A11Y_REQUIREMENTS = {
  // Keyboard Navigation
  'keyboard-nav': [
    'All interactive elements reachable via Tab',
    'Logical tab order',
    'No keyboard traps',
    'Custom components have keyboard handlers',
  ],

  // Focus Management
  'focus': [
    'Visible focus indicator (2px outline)',
    'Focus not stolen unexpectedly',
    'Focus returned after modal close',
    'Focus moved to new content',
  ],

  // ARIA
  'aria': [
    'aria-label for icon-only buttons',
    'aria-describedby for complex inputs',
    'aria-live for dynamic content',
    'aria-expanded for collapsible',
    'role for custom components',
  ],

  // Color Contrast
  'contrast': [
    'Normal text: 4.5:1 minimum',
    'Large text (18px+): 3:1 minimum',
    'UI components: 3:1 minimum',
  ],
};
```

### Focus Trap Component

```typescript
// components/ui/focus-trap.tsx
'use client';

import { useEffect, useRef } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
}

export function FocusTrap({ children, active = true }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store previous active element
    const previousActive = document.activeElement as HTMLElement;

    // Focus first element
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      previousActive?.focus();
    };
  }, [active]);

  return <div ref={containerRef}>{children}</div>;
}
```

### Skip Link Component

```typescript
// components/ui/skip-link.tsx

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-black"
    >
      Skip to main content
    </a>
  );
}

// Usage in layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <SkipLink />
        <Header />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
```

### Accessible Button with Loading State

```typescript
// components/ui/accessible-button.tsx

interface AccessibleButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export function AccessibleButton({
  children,
  loading,
  loadingText,
  disabled,
  ...props
}: AccessibleButtonProps) {
  const isLoading = loading || disabled;

  return (
    <Button
      {...props}
      disabled={isLoading}
      aria-disabled={isLoading}
      aria-busy={isLoading}
    >
      {isLoading && (
        <>
          <span className="sr-only">{loadingText || 'Loading...'}</span>
          <LoadingSpinner aria-hidden="true" />
        </>
      )}
      <span className={isLoading ? 'opacity-50' : ''}>{children}</span>
    </Button>
  );
}
```

### Reduced Motion Support

```typescript
// lib/hooks/use-reduced-motion.ts

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

// Usage in animations
function AnimatedComponent({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

### Color Contrast Tokens

```css
/* Design tokens — đảm bảo 4.5:1 contrast ratio */

:root {
  /* Primary — navy on white: 9.8:1 ✅ */
  --primary: #1E3A5F;

  /* Text colors — đạt WCAG AA */
  --text-primary: #1a1a1a;    /* 15.9:1 on white */
  --text-secondary: #4b5563;    /* 7.0:1 on white */
  --text-muted: #6b7280;        /* 4.7:1 on white — OK for large text */

  /* Focus ring — visible on all backgrounds */
  --focus-ring: 0 0 0 2px #fff, 0 0 0 4px #1E3A5F;

  /* Error — đạt 4.5:1 */
  --error: #b91c1c;             /* 5.9:1 on white */
  --error-bg: #fef2f2;
}
```

### ARIA Live Regions

```typescript
// lib/hooks/use-aria-live.ts

interface UseAriaLiveOptions {
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
}

export function useAriaLive(message: string, options: UseAriaLiveOptions = {}) {
  const { politeness = 'polite', atomic = true } = options;
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    if (message) {
      setLiveMessage(message);
      // Clear after announcement
      const timer = setTimeout(() => setLiveMessage(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {liveMessage}
    </div>
  );
}

// Usage: Announce booking success
function BookingConfirmation() {
  const [announced, setAnnounced] = useState('');
  const { submit } = useBooking();

  const handleSubmit = async () => {
    const result = await submit(data);
    setAnnounced(`Đặt lịch thành công. Mã đặt lịch: ${result.bookingId}`);
  };

  return (
    <>
      <BookingForm onSubmit={handleSubmit} />
      <AriaLiveRegion message={announced} />
    </>
  );
}
```

---

# 03. FEATURE ARCHITECTURE

## 3.1 Bounded Contexts

Mỗi feature là một **self-contained module** chứa đầy đủ responsibility:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FEATURE MODULE TEMPLATE                                  │
│                                                                               │
│  features/{feature-name}/                                                   │
│  ├── components/          # Shared UI components (public)                   │
│  │   ├── index.ts                                                       │
│  │   └── ...                                                            │
│  ├── admin/               # Admin-specific components                      │
│  │   ├── index.ts                                                       │
│  │   └── ...                                                            │
│  ├── hooks/               # TanStack Query hooks + Zustand hooks          │
│  │   ├── use-*.ts                                                       │
│  │   └── index.ts                                                        │
│  ├── api/                 # API client functions                           │
│  │   └── *.ts                                                           │
│  ├── schemas/             # Zod validation schemas                       │
│  │   └── *.ts                                                            │
│  ├── types/                # TypeScript types                            │
│  │   └── index.ts                                                        │
│  ├── utils/                # Helpers                                      │
│  │   └── index.ts                                                        │
│  └── index.ts             # Public exports                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Feature Inventory

| Feature | Owner | Đặc điểm |
| :- | :- | :- |
| `auth` | Team Auth | JWT, RBAC, OAuth |
| `booking` | Team Core | Real-time slots, reservation timer |
| `chatbot` | Team AI | Streaming SSE, AI processing |
| `crm` | Team Sales | Kanban, lead scoring |
| `landing-pages` | Team Marketing | CMS, A/B testing, drag-drop |
| `blog` | Team Content | Rich editor, SEO, ISR |
| `services` | Team Core | Service catalog |
| `lawyers` | Team Core | Lawyer profiles |
| `newsletter` | Team Marketing | Email campaigns |
| `reviews` | Team Content | Moderation workflow |
| `admin` | Team Platform | Dashboard, charts, user management |

---

# 04. CẤU TRÚC PROJECT

## 4.1 Directory Structure

```
frontend/
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── .env.local
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── sentry.client.config.ts
├── sentry.server.config.ts
├── instrumentation.ts
│
├── public/
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
│
├── src/
│   │
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                  # Homepage
│   │   ├── not-found.tsx
│   │   ├── error.tsx                 # Root error boundary
│   │   ├── loading.tsx
│   │   │
│   │   ├── (public)/                 # Route Group: Public pages
│   │   │   ├── layout.tsx            # Public layout (Header + Footer)
│   │   │   ├── page.tsx
│   │   │   ├── about/page.tsx
│   │   │   ├── services/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── lawyers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── news/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── booking/page.tsx
│   │   │   ├── case-studies/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── documents/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   └── lp/
│   │   │       ├── page.tsx
│   │   │       └── [slug]/page.tsx   # Landing page SSR
│   │   │
│   │   ├── (auth)/                   # Route Group: Auth pages
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── verify-otp/page.tsx
│   │   │
│   │   ├── (admin)/                  # Route Group: Admin (lazy-loaded)
│   │   │   ├── layout.tsx           # Admin layout (Sidebar + Topbar)
│   │   │   ├── page.tsx             # /admin
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── bookings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── calendar/page.tsx
│   │   │   ├── crm/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── leads/page.tsx
│   │   │   │   ├── leads/[id]/page.tsx
│   │   │   │   └── analytics/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   ├── [id]/edit/page.tsx
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   ├── categories/page.tsx
│   │   │   │   └── tags/page.tsx
│   │   │   ├── services/page.tsx
│   │   │   ├── lawyers/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── chatbot/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── logs/page.tsx
│   │   │   │   └── config/page.tsx
│   │   │   ├── newsletter/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── subscribers/page.tsx
│   │   │   │   ├── campaigns/page.tsx
│   │   │   │   └── campaigns/[id]/page.tsx
│   │   │   ├── users/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── landing-pages/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   ├── [id]/edit/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── general/page.tsx
│   │   │   │   ├── appearance/page.tsx
│   │   │   │   ├── seo/page.tsx
│   │   │   │   └── notifications/page.tsx
│   │   │   └── case-studies/page.tsx
│   │   │
│   │   └── api/                       # Next.js API Routes
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── revalidate/route.ts   # ISR webhook
│   │       └── upload/route.ts
│   │
│   │
│   ├── components/                    # Shared UI components
│   │   │
│   │   ├── ui/                       # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── drawer.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── accordion.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── spinner.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── label.tsx
│   │   │   └── form.tsx
│   │   │
│   │   ├── layout/                   # Layout components
│   │   │   ├── header/
│   │   │   │   ├── header.tsx
│   │   │   │   ├── mobile-menu.tsx
│   │   │   │   ├── nav-links.tsx
│   │   │   │   └── language-switcher.tsx
│   │   │   ├── footer/
│   │   │   │   ├── footer.tsx
│   │   │   │   ├── footer-columns.tsx
│   │   │   │   └── newsletter-form.tsx
│   │   │   ├── admin-sidebar/
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── sidebar-items.tsx
│   │   │   │   └── sidebar-user.tsx
│   │   │   ├── admin-topbar/
│   │   │   │   └── topbar.tsx
│   │   │   ├── page-header.tsx
│   │   │   └── container.tsx
│   │   │
│   │   ├── common/                   # Shared business components
│   │   │   ├── service-card.tsx
│   │   │   ├── lawyer-card.tsx
│   │   │   ├── blog-card.tsx
│   │   │   ├── case-study-card.tsx
│   │   │   ├── review-card.tsx
│   │   │   ├── faq-item.tsx
│   │   │   ├── hero-section.tsx
│   │   │   ├── cta-section.tsx
│   │   │   ├── testimonial-slider.tsx
│   │   │   ├── trust-badges.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── empty-state.tsx
│   │   │   └── error-state.tsx
│   │   │
│   │   └── admin/                   # Admin shared components
│   │       ├── table/
│   │       ├── forms/
│   │       ├── modals/
│   │       ├── filters/
│   │       └── kanban/
│   │
│   │
│   ├── features/                     # Feature modules (FEATURE-FIRST)
│   │   │
│   │   ├── booking/
│   │   │   ├── components/
│   │   │   │   ├── booking-provider.tsx   # Booking context provider
│   │   │   │   ├── booking-progress.tsx
│   │   │   │   ├── step-service.tsx
│   │   │   │   ├── step-lawyer.tsx
│   │   │   │   ├── step-datetime.tsx
│   │   │   │   ├── step-info.tsx
│   │   │   │   ├── step-confirm.tsx
│   │   │   │   ├── booking-summary.tsx
│   │   │   │   ├── calendar.tsx
│   │   │   │   ├── time-slots.tsx
│   │   │   │   ├── slot-reservation-timer.tsx  # Race condition prevention
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-booking.ts
│   │   │   │   ├── use-slots.ts
│   │   │   │   └── index.ts
│   │   │   ├── api/
│   │   │   │   └── booking-api.ts
│   │   │   ├── schemas/
│   │   │   │   └── booking.schema.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── utils/
│   │   │       └── index.ts
│   │   │
│   │   ├── chatbot/
│   │   │   ├── ui/
│   │   │   │   ├── chatbot-widget.tsx
│   │   │   │   ├── chat-panel.tsx
│   │   │   │   ├── chat-messages.tsx
│   │   │   │   ├── chat-input.tsx
│   │   │   │   ├── chat-bubble.tsx
│   │   │   │   ├── quick-replies.tsx
│   │   │   │   ├── typing-indicator.tsx
│   │   │   │   └── index.ts
│   │   │   ├── state/                 # Zustand store
│   │   │   │   ├── chat.store.ts
│   │   │   │   └── index.ts
│   │   │   ├── transport/             # SSE / streaming
│   │   │   │   ├── chat-client.ts
│   │   │   │   └── index.ts
│   │   │   ├── ai/                   # AI processing
│   │   │   │   ├── processor.ts
│   │   │   │   └── index.ts
│   │   │   ├── memory/               # Conversation history
│   │   │   │   ├── conversation-history.ts
│   │   │   │   └── index.ts
│   │   │   ├── analytics/
│   │   │   │   └── index.ts
│   │   │   ├── prompts/
│   │   │   │   └── system-prompt.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── crm/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   ├── schemas/
│   │   │   └── types/
│   │   │
│   │   ├── landing-pages/
│   │   │   ├── components/
│   │   │   │   ├── landing-page-renderer.tsx
│   │   │   │   ├── sections/         # Section registry
│   │   │   │   │   ├── hero-section.tsx
│   │   │   │   │   ├── pain-points.tsx
│   │   │   │   │   ├── benefits.tsx
│   │   │   │   │   ├── process-steps.tsx
│   │   │   │   │   ├── pricing.tsx
│   │   │   │   │   ├── testimonials.tsx
│   │   │   │   │   ├── faq-section.tsx
│   │   │   │   │   ├── cta-banner.tsx
│   │   │   │   │   ├── lead-form.tsx
│   │   │   │   │   ├── video-embed.tsx
│   │   │   │   │   ├── logos-section.tsx
│   │   │   │   │   ├── stats-counter.tsx
│   │   │   │   │   ├── lawyers-highlight.tsx
│   │   │   │   │   ├── comparison-table.tsx
│   │   │   │   │   ├── content-block.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── section-registry.ts  # Component registry với versioning
│   │   │   │   └── index.ts
│   │   │   ├── admin/
│   │   │   │   ├── landing-page-list.tsx
│   │   │   │   ├── landing-page-editor.tsx  # Drag-drop builder
│   │   │   │   ├── section-picker.tsx
│   │   │   │   ├── ab-test-manager.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   ├── schemas/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   │
│   │   ├── blog/
│   │   │   ├── components/
│   │   │   ├── admin/               # Blog editor + management
│   │   │   │   ├── blog-list.tsx
│   │   │   │   ├── blog-editor.tsx   # TipTap rich editor
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   ├── schemas/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   │
│   │   ├── auth/
│   │   │   ├── hooks/
│   │   │   │   ├── use-auth.ts
│   │   │   │   └── index.ts
│   │   │   ├── api/
│   │   │   └── utils/
│   │   │       └── permissions.ts    # RBAC permission matrix
│   │   │
│   │   └── shared/                   # Cross-feature shared
│   │       ├── components/
│   │       ├── hooks/
│   │       └── utils/
│   │
│   │
│   ├── stores/                        # Zustand global stores
│   │   ├── auth.store.ts
│   │   ├── ui.store.ts
│   │   ├── booking.store.ts
│   │   └── chatbot.store.ts
│   │
│   │
│   ├── lib/                           # Shared utilities
│   │   ├── api/
│   │   │   ├── client.ts             # Axios client + interceptors
│   │   │   ├── endpoints.ts
│   │   │   └── error-handler.ts
│   │   ├── hooks/
│   │   │   ├── use-debounce.ts
│   │   │   ├── use-media-query.ts
│   │   │   ├── use-click-outside.ts
│   │   │   └── use-keyboard-shortcut.ts
│   │   ├── utils/
│   │   │   ├── cn.ts
│   │   │   ├── format-date.ts
│   │   │   ├── format-phone.ts
│   │   │   ├── slugify.ts
│   │   │   ├── debounce.ts
│   │   │   ├── validators.ts         # Zod schemas
│   │   │   └── constants.ts
│   │   ├── analytics.ts              # PostHog wrapper
│   │   └── i18n.ts                  # next-intl config
│   │
│   │
│   ├── providers/                    # React Context providers
│   │   ├── providers.tsx             # Combine all providers
│   │   ├── query-provider.tsx        # TanStack Query provider
│   │   ├── toast-provider.tsx        # Sonner toast
│   │   ├── i18n-provider.tsx
│   │   └── admin-providers.tsx
│   │
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   ├── typography.css
│   │   └── animations.css
│   │
│   │
│   └── i18n/
│       ├── request.ts
│       ├── config.ts
│       └── messages/
│           ├── vi.json
│           └── en.json
│
│
├── storybook/                         # Storybook stories
│   ├── Button.stories.tsx
│   ├── Card.stories.tsx
│   └── ...
│
├── tests/
│   ├── e2e/                          # Playwright
│   ├── unit/                         # Vitest
│   └── mocks/                         # MSW handlers
│       └── handlers/
│           ├── booking.ts
│           ├── blog.ts
│           └── ...
│
└── scripts/
    └── generate-icons.ts             # Auto-generate icon components
```

## 4.2 Technology Stack

| Category | Technology | Version |
| :- | :- | :- |
| **Framework** | Next.js (App Router) | 15.x |
| **UI Library** | shadcn/ui + Radix UI | latest |
| **Styling** | Tailwind CSS v4 | 4.x |
| **Language** | TypeScript | 5.x |
| **State — Server** | TanStack Query (React Query) | 5.x |
| **State — Global Client** | Zustand | 4.x |
| **Forms** | React Hook Form + Zod | 7.x / 3.x |
| **Auth** | NextAuth.js (Auth.js) stable | 5.x |
| **i18n** | next-intl | 3.x |
| **Rich Text** | TipTap Editor | 2.x |
| **Charts** | Recharts | 2.x |
| **Tables** | TanStack Table | 8.x |
| **Icons** | Lucide React (default) + Font Awesome 6 (branded) | latest + 6.x |
| **Animations** | Framer Motion | 11.x |
| **HTTP Client** | Axios | 1.x |
| **Error Tracking** | Sentry | 8.x |
| **Analytics** | PostHog | latest |
| **Mock API** | MSW (Mock Service Worker) | 2.x |
| **Component Docs** | Storybook + Chromatic | latest |
| **E2E Testing** | Playwright | latest |
| **Unit Testing** | Vitest | latest |
| **Linting** | ESLint + Prettier | latest |

## 4.3 Code Splitting Strategy

### Admin Lazy Loading

```typescript
// app/(admin)/layout.tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy admin features
const AdminCharts = lazy(() => import('@/features/admin/charts'));
const AdminKanban = lazy(() => import('@/features/admin/kanban'));
const AdminEditor = lazy(() => import('@/features/admin/rich-editor'));
const LandingBuilder = lazy(() => import('@/features/landing-pages/admin/builder'));

// Loading skeleton
function ChartSkeleton() {
  return <div className="h-[300px] animate-pulse bg-gray-100 rounded-lg" />;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <AdminSidebar />
      <main>
        {children}
        {/* Lazy loaded — no impact on initial bundle */}
        <Suspense fallback={<ChartSkeleton />}>
          <AdminCharts />
        </Suspense>
      </main>
    </div>
  );
}
```

### Route-Based Splitting

```
Admin bundle chunks:
├── vendors.chunk.js           # React, Next.js runtime
├── admin-layout.chunk.js     # Sidebar, topbar, shared
├── admin-dashboard.chunk.js  # Dashboard page
├── admin-crm.chunk.js        # CRM + Kanban (lazy)
├── admin-blog.chunk.js       # Blog + TipTap (lazy)
├── admin-charts.chunk.js     # Recharts (lazy)
├── admin-landing-builder.js   # Landing builder (lazy, heaviest)
└── admin-chatbot.chunk.js    # Chatbot config (lazy)
```

---

# 05. CÁC TRANG (PAGES)

## 5.1 Public Pages

| Page | Route | Rendering | Cache |
| :- | :- | :- | :- |
| Homepage | `/` | SSG + ISR | 1 giờ |
| Services | `/services` | SSG + ISR | 30 phút |
| Service Detail | `/services/[slug]` | SSG + ISR | 30 phút |
| Lawyers | `/lawyers` | SSG + ISR | 1 giờ |
| Lawyer Detail | `/lawyers/[slug]` | SSG + ISR | 1 giờ |
| Blog List | `/blog` | ISR | 1 giờ |
| Blog Detail | `/blog/[slug]` | ISR | 1 giờ |
| FAQ | `/faq` | ISR | 24 giờ |
| Contact | `/contact` | SSG | — |
| Booking | `/booking` | SSG | — |
| Landing Page | `/lp/[slug]` | ISR + On-demand | 5 phút |
| Case Studies | `/case-studies` | ISR | 1 giờ |
| Reviews | `/reviews` | ISR | 1 giờ |
| Documents | `/documents` | ISR | 24 giờ |
| Search | `/search` | Dynamic | — |

## 5.2 Auth Pages

| Page | Route |
| :- | :- |
| Login | `/login` |
| Register | `/register` |
| Forgot Password | `/forgot-password` |
| Verify OTP | `/verify-otp` |

## 5.3 Admin Pages

| Section | Route | Lazy |
| :- | :- | :- |
| Dashboard | `/admin` | No |
| Bookings | `/admin/bookings` | No |
| CRM | `/admin/crm` | No |
| Blog | `/admin/blog` | Yes (TipTap) |
| Services | `/admin/services` | No |
| Lawyers | `/admin/lawyers` | No |
| Reviews | `/admin/reviews` | No |
| Chatbot | `/admin/chatbot` | No |
| Newsletter | `/admin/newsletter` | No |
| **Landing Pages** | `/admin/landing-pages` | **Yes (Builder)** |
| Users | `/admin/users` | No |
| Settings | `/admin/settings` | No |

---

# 06. BOOKING FLOW

## 6.1 Race Condition Prevention

### Problem

```
User A và User B cùng chọn slot 09:30.
Backend chỉ nhận 1 request trước.
→ Double booking = bad UX
→ Revenue loss
```

### Solution: Optimistic Slot Reservation

```typescript
// Step 1: Reserve slot client-side (5 phút timeout)
const reserveSlot = async (slotId: string): Promise<boolean> => {
  const res = await api.post('/availability/reserve', { slotId });
  if (res.ok) {
    const { expiresAt } = res.json();
    // Lưu reservation vào store
    useBookingStore.getState().setReservedSlot({ slotId, expiresAt });
    // Start countdown timer
    startReservationTimer(expiresAt);
  }
  return res.ok;
};

// Step 2: Backend — Optimistic locking
// PUT /api/availability/{slotId}/reserve
// Request body: { version: number }
// Response: { success: boolean; expiresAt: ISO8601; conflict?: boolean }

// If slot was taken by another user:
// → Return 409 Conflict
// → UI: "Slot này vừa được đặt. Vui lòng chọn slot khác."
```

### Reservation Timer UI

```tsx
// SlotReservationTimer — hiển thị countdown 5 phút
// Khi hết giờ:
// → Tự động release slot
// → Thông báo user: "Lịch hẹn của bạn đã hết hạn giữ chỗ. Vui lòng chọn lại."
// → Reset booking wizard về step 2
```

## 6.2 Booking State Machine

```
[IDLE] ──select service──> [SERVICE_SELECTED]
[SERVICE_SELECTED] ──select lawyer──> [LAWYER_SELECTED]
[LAWYER_SELECTED] ──reserve slot──> [SLOT_RESERVED] (5 phút timer)
[SLOT_RESERVED] ──timeout/conflict──> [SLOT_EXPIRED] ──reselect──> [SLOT_RESERVED]
[SLOT_RESERVED] ──fill form──> [FORM_FILLED]
[FORM_FILLED] ──submit──> [SUBMITTING]
[SUBMITTING] ──success──> [CONFIRMED]
[SUBMITTING] ──error──> [FORM_FILLED] (với error message)
```

## 6.3 Real-Time Slot Sync

```typescript
// Khi user đặt thành công → WebSocket/SSE notify all clients
// Các client khác đang xem slot → Cập nhật UI tức thì:
// → Slot đã đặt → hiển thị "Đã đặt" (disabled)
// → Slot mới trống → hiển thị available

// SSE endpoint: /api/availability/stream?lawyerId=X&date=Y
// Hoặc polling SWR với interval: 30 giây
const { data: slots } = useSWR(
  ['/availability', lawyerId, date],
  () => fetchSlots(lawyerId, date),
  { refreshInterval: 30000 }  // 30 seconds
);
```

---

# 07. CHATBOT AI

## 7.1 Chatbot Architecture — Rõ ràng Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CHATBOT DATA FLOW (Server-side AI Processing)               │
│                                                                               │
│  FRONTEND                    NEXT.JS ROUTE HANDLER           BACKEND          │
│  (Browser)                  (/api/chatbot/stream)           (Spring Boot)     │
│                                                                               │
│     │                            │                              │             │
│     │ User message               │                              │             │
│     │ ──────────────────────────▶│                              │             │
│     │                            │                              │             │
│     │                            │ Validate session            │             │
│     │                            │ ───────────────────────────▶│             │
│     │                            │                            │              │
│     │                            │ Call AI (GPT-4o)            │             │
│     │                            │ OPENAI_API_KEY (server)     │             │
│     │                            │ ───────────────────────────▶│             │
│     │                            │                            │              │
│     │                            │◀───────────────────────────│ SSE stream   │
│     │◀───────────────────────────│◀───────────────────────────│              │
│     │◀── streaming tokens ───────│◀── streaming tokens ──────│              │
│     │                            │                              │             │
│     │ Save to DB                 │                              │             │
│     │ ───────────────────────────▶│                              │             │
│     │                            │                              │             │
│  ⚠️  API Key KHÔNG bao giờ ở frontend                                          │
│  ⚠️  OPENAI_API_KEY chỉ ở: Next.js Route Handler (server-only)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### AI Processing Layer — Backend-first

```
AI Processing CHẠY Ở BACKEND (Spring Boot), không phải frontend

┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI PROCESSING PIPELINE                               │
│                                                                               │
│  1. FRONTEND ──POST /api/chatbot/stream──▶ Spring Boot                    │
│                                                                               │
│  2. SPRING BOOT:                                                            │
│     ├── Validate session + user auth                                        │
│     ├── Load conversation history từ DB                                     │
│     ├── Load knowledge base context                                         │
│     ├── Build system prompt (legal context, BRS info)                     │
│     ├── Call GPT-4o API (API key ở backend env)                           │
│     ├── Stream response về frontend via SSE                                 │
│     └── Save message to DB                                                 │
│                                                                               │
│  3. FALLBACK (AI fails):                                                    │
│     ├── Rule-based response (keyword matching)                             │
│     └── Escalate to human (email/notification)                             │
│                                                                               │
│  ⚠️ ANTI-PATTERN: Intent classification ở client-side                       │
│     → API key exposure risk                                                 │
│     → Dễ bypass bảo mật                                                   │
│     → Không kiểm soát được AI behavior                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Frontend: UI + Streaming Display

```typescript
// features/chatbot/ui/chat-panel.tsx
// Frontend: Chỉ handle UI + streaming display, KHÔNG xử lý AI

function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSend = async (message: string) => {
    // 1. Add user message immediately
    const userMessage: ChatMessage = {
      id: uuid(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // 2. Add placeholder for bot response
    const botMessageId = uuid();
    setMessages(prev => [...prev, {
      id: botMessageId,
      role: 'assistant',
      content: '',
      streaming: true,
    }]);
    setIsStreaming(true);

    try {
      // 3. Stream from backend (SSE)
      // Backend handles: auth, AI call, streaming
      const response = await fetch('/api/chatbot/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId: chatStore.getState().sessionId,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const token = JSON.parse(line.slice(6)) as { content: string; done: boolean };

            if (token.done) {
              // Stream complete
              setIsStreaming(false);
              updateMessage(botMessageId, { streaming: false });
            } else {
              // Append token
              appendToMessage(botMessageId, token.content);
            }
          }
        }
      }
    } catch (error) {
      updateMessage(botMessageId, {
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ trực tiếp.',
        streaming: false,
      });
      setIsStreaming(false);
    }
  };

  return (
    <div className="chat-panel">
      <div className="messages">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
```

### Backend: Next.js Route Handler (API Key Safe)

```typescript
// app/api/chatbot/stream/route.ts
// API Key chỉ ở server-side, không bao giờ gửi về frontend

import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Server-only, not NEXT_PUBLIC_
});

// System prompt — legal domain context
const SYSTEM_PROMPT = `
Bạn là trợ lý pháp lý của Công ty Luật TNHH ICRC.
...

Thông tin về dịch vụ, luật sư, giờ làm việc: [from database]
`;

export async function POST(req: NextRequest) {
  const { message, sessionId } = await req.json();

  // 1. Validate session (from HttpOnly Cookie, server-side)
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Load conversation history từ backend DB
  const history = await fetchChatHistory(sessionId);

  // 3. Build messages array
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: message },
  ];

  // 4. Stream response từ OpenAI
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    stream: true,
  });

  // 5. Return SSE stream
  const encoder = new TextEncoder();

  const streamResponse = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n`));
        }
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n`));
    },
  });

  // 6. Save message to DB (sau khi stream xong)
  // Implementation...

  return new Response(streamResponse, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Backend: Spring Boot Chatbot Controller

```java
// Spring Boot: ChatbotController.java
// Xử lý AI chính — API Key an toàn ở backend

@RestController
@RequestMapping("/api/v1/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final ConversationHistoryRepository historyRepo;

    @PostMapping("/stream")
    public ResponseEntity<StreamingResponseBody> stream(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody ChatRequest request) {

        // 1. Validate user session
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        // 2. Load conversation history
        List<ChatMessage> history = historyRepo.findBySessionId(request.getSessionId());

        // 3. Build AI request
        ChatRequest aiRequest = ChatRequest.builder()
                .sessionId(request.getSessionId())
                .message(request.getMessage())
                .history(history)
                .userContext(buildUserContext(user))
                .build();

        // 4. Return streaming response
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_EVENT_STREAM)
                .body(chatbotService.streamResponse(aiRequest));
    }

    // Non-streaming fallback
    @PostMapping("/message")
    public ResponseEntity<ChatResponse> sendMessage(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody ChatRequest request) {

        ChatResponse response = chatbotService.processMessage(
                request.getMessage(),
                request.getSessionId(),
                user
        );

        return ResponseEntity.ok(response);
    }
}
```

## 7.2 AI Service — OpenAI Integration

```java
// Spring Boot: OpenAI Service

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenAIService {

    @Value("${openai.api.key}")
    private String openAiApiKey; // Backend env, KHÔNG bao giờ gửi về frontend

    private final WebClient openAiClient;

    @PostConstruct
    public void init() {
        openAiClient = WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + openAiApiKey)
                .build();
    }

    public Flux<String> streamChat(String systemPrompt, List<ChatMessage> history, String userMessage) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        history.forEach(h -> messages.add(Map.of(
                "role", h.getRole(),
                "content", h.getContent()
        )));

        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> body = Map.of(
                "model", "gpt-4o",
                "messages", messages,
                "stream", true,
                "temperature", 0.7
        );

        return openAiClient.post()
                .uri("/chat/completions")
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(String.class)
                .filter(line -> line.startsWith("data: "))
                .filter(line -> !line.equals("data: [DONE]"))
                .map(line -> {
                    // Parse SSE data
                    String json = line.substring(6);
                    // Extract content from OpenAI response
                    return extractContent(json);
                });
    }
}
```

## 7.3 Intent Classification

| Intent | Keywords | Response Type |
| :- | :- | :- |
| `greeting` | xin chào, hello, chào bạn | Welcome + quick actions |
| `service_inquiry` | dịch vụ gì, luật doanh nghiệp | Service list + link |
| `booking` | đặt lịch, hẹn luật sư | Trigger booking flow |
| `lawyer_info` | luật sư nào, thông tin ls | Lawyer profiles |
| `pricing` | giá bao nhiêu, phí | Pricing info + free consult |
| `faq` | câu hỏi, thắc mắc | FAQ suggestions |
| `contact` | liên hệ, số điện thoại | Contact info |
| `complaint` | khiếu nại, phản ánh | Escalate to human |
| `bye` | cảm ơn, bye | Goodbye + rating |

## 7.4 Message Persistence

```typescript
// memory/conversation-history.ts
interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    latency?: number;
  };
}

// Save to backend on each message
const saveMessage = async (message: ChatMessage) => {
  await api.post('/chatbot/messages', message);
};

// Load conversation history on page load
const loadHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  const res = await api.get(`/chatbot/sessions/${sessionId}/messages`);
  return res.json();
};
```

---

# 08. LANDING PAGE BUILDER — CMS-READY

## 8.1 Section Registry với Versioning

```typescript
// features/landing-pages/components/section-registry.ts

interface SectionDefinition<T = Record<string, unknown>> {
  type: string;
  version: number;                    // Versioning để tránh breaking changes
  label: string;
  icon: string;                    // Lucide icon name
  component: React.ComponentType<T>;
  schema: z.ZodType<T>;              // Zod schema cho props validation
  defaultProps: T;                   // Default props
  preview?: string;                  // Preview image URL
}

export const sectionRegistry: Record<string, SectionDefinition> = {
  hero: {
    type: 'hero',
    version: 2,
    label: 'Hero Banner',
    icon: 'Sparkles',
    component: HeroSection,
    schema: z.object({
      headline: z.string().min(5).max(60),
      subheadline: z.string().max(120).optional(),
      ctaText: z.string(),
      ctaLink: z.string().url(),
      backgroundType: z.enum(['gradient', 'image', 'video']),
      backgroundValue: z.string(),
      showTrustBadges: z.boolean().default(true),
    }),
    defaultProps: {
      headline: 'Giải pháp pháp lý toàn diện',
      ctaText: 'Đặt lịch tư vấn',
      ctaLink: '/booking',
      backgroundType: 'gradient',
      backgroundValue: '#1E3A5F',
      showTrustBadges: true,
    },
  },

  pricing: {
    type: 'pricing',
    version: 1,
    label: 'Bảng giá',
    icon: 'Receipt',
    component: PricingSection,
    schema: z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      packages: z.array(z.object({
        name: z.string(),
        price: z.number(),
        period: z.string().optional(),
        features: z.array(z.string()),
        ctaText: z.string(),
        highlighted: z.boolean().default(false),
      })),
    }),
    defaultProps: {
      title: 'Bảng giá dịch vụ',
      packages: [],
    },
  },

  lead_form: {
    type: 'lead_form',
    version: 2,
    label: 'Form thu thập Lead',
    icon: 'UserPlus',
    component: LeadFormSection,
    schema: z.object({
      variant: z.enum(['inline', 'sidebar', 'modal', 'fullscreen']),
      title: z.string(),
      subtitle: z.string().optional(),
      fields: z.array(z.enum(['name', 'phone', 'email', 'service', 'message'])),
      submitText: z.string(),
      successMessage: z.string(),
      tracking: z.object({
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
      }).optional(),
    }),
    defaultProps: {
      variant: 'inline',
      title: 'Đăng ký tư vấn',
      fields: ['name', 'phone', 'email'],
      submitText: 'Gửi',
      successMessage: 'Cảm ơn! Chúng tôi sẽ liên hệ trong 15 phút.',
    },
  },

  // ... more sections: faq, testimonials, benefits, etc.
};

// LandingPageRenderer — Dynamic section rendering
export function LandingPageRenderer({ sections }: { sections: LandingSection[] }) {
  return (
    <div className="landing-page">
      {sections.map((section, index) => {
        const definition = sectionRegistry[section.type];

        if (!definition) {
          console.warn(`Unknown section type: ${section.type}`);
          return null;
        }

        // Version compatibility check
        if (section.version && section.version !== definition.version) {
          // Migrate old version to new version
          const migratedProps = migrateSection(section, definition);
          return <definition.component key={index} {...migratedProps} />;
        }

        return <definition.component key={index} {...section.props} />;
      })}
    </div>
  );
}
```

## 8.2 Versioned Section Schema

```typescript
// LandingPage data model với versioning
interface LandingSection {
  id: string;
  type: string;
  version: number;        // Schema version — để migration
  props: Record<string, unknown>;  // Typed via Zod schema
  order: number;          // Drag-drop order
}

interface LandingPage {
  id: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  meta: {
    title: string;
    description: string;
    ogImage: string;
    noIndex?: boolean;
  };
  sections: LandingSection[];     // Ordered array
  variants?: LandingVariant[];   // A/B testing
  publishedAt?: string;
  updatedAt: string;
  version: number;              // Page-level version
}
```

## 8.3 Landing Page Builder — Pessimistic Locking

### Problem: Concurrent Editing Race Condition

```
User A (Marketing) ──opens──▶ /admin/landing-pages/123/edit
                                    │
                                    ▼
                              Acquires lock
                                    │
User B (Marketing) ──opens──▶ /admin/landing-pages/123/edit
                                    │
                                    ▼
                              ❌ Lock denied
                              → Read-only mode
                              → "Trang đang được chỉnh sửa bởi User A"
```

### Solution: Pessimistic Locking + Heartbeat

```typescript
// features/landing-pages/admin/landing-page-editor.tsx

// Lock state types
interface LockInfo {
  pageId: string;
  lockedBy: {
    id: string;
    name: string;
  };
  lockedAt: string;
  expiresAt: string; // Auto-release if heartbeat stops
}

interface LockState {
  status: 'loading' | 'locked' | 'locked_by_other' | 'editable';
  lock: LockInfo | null;
  isDirty: boolean;
  lastSaved: Date | null;
}

// Hook: Quản lý lock lifecycle
function usePageLock(pageId: string) {
  const [lockState, setLockState] = useState<LockState>({ status: 'loading', lock: null, isDirty: false, lastSaved: null });
  const [isDirty, setIsDirty] = useState(false);
  const [history, setHistory] = useState<LandingPage[]>([]);

  // 1. Acquire lock on mount
  useEffect(() => {
    const acquireLock = async () => {
      const res = await api.post(`/landing-pages/${pageId}/lock`);

      if (res.status === 200) {
        const { lock } = res.json();
        setLockState({ status: 'locked', lock, isDirty, lastSaved: null });

        // Start heartbeat
        startHeartbeat(pageId);
      } else if (res.status === 409) {
        // Locked by another user
        const { lock } = res.json();
        setLockState({ status: 'locked_by_other', lock, isDirty: false, lastSaved: null });
      }
    };

    acquireLock();
  }, [pageId]);

  // 2. Heartbeat — keep lock alive every 30s
  const startHeartbeat = (pageId: string) => {
    const interval = setInterval(async () => {
      try {
        await api.post(`/landing-pages/${pageId}/lock/heartbeat`);
      } catch (error) {
        // Lock lost (tab closed, network issue)
        clearInterval(interval);
        toast.error('Mất kết nối. Lock đã được giải phóng.');
        setLockState(prev => ({ ...prev, status: 'editable' }));
      }
    }, 30_000); // 30 seconds

    return () => clearInterval(interval);
  };

  // 3. Release lock on unmount or close
  const releaseLock = async () => {
    try {
      await api.delete(`/landing-pages/${pageId}/lock`);
    } catch (error) {
      console.error('Failed to release lock:', error);
    }
  };

  useEffect(() => {
    return () => {
      releaseLock();
    };
  }, []);

  // 4. Auto-release after 1 minute of no heartbeat (browser crash)
  // Backend tự động release lock nếu heartbeat không được nhận

  return { lockState, releaseLock };
}

// Main Editor Component
function LandingPageEditor({ pageId }: { pageId: string }) {
  const { lockState, releaseLock } = usePageLock(pageId);
  const [page, setPage] = useState<LandingPage | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Autosave: debounce 2 giây (chỉ khi lock thành công)
  const autosave = useDebouncedCallback(async () => {
    if (lockState.status !== 'locked') return;
    if (!isDirty) return;

    try {
      await api.put(`/landing-pages/${pageId}`, page);
      setIsDirty(false);
      setLockState(prev => ({ ...prev, lastSaved: new Date() }));
    } catch (error) {
      toast.error('Lưu thất bại. Đang thử lại...');
    }
  }, 2000);

  // Handle changes
  const handleChange = (updated: LandingPage) => {
    setPage(updated);
    setIsDirty(true);
    setHistory(prev => [...prev.slice(-20), page]);
    autosave();
  };

  // Lock lost handler
  if (lockState.status === 'locked_by_other') {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <LockIcon className="w-5 h-5 text-yellow-600" />
          <div className="text-left">
            <p className="font-medium text-yellow-800">
              Trang đang được chỉnh sửa bởi
            </p>
            <p className="font-semibold text-yellow-900">
              {lockState.lock.lockedBy.name}
            </p>
            <p className="text-sm text-yellow-600">
              Mở lúc: {formatDate(lockState.lock.lockedAt)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push('/admin/landing-pages')}>
            Quay lại danh sách
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>

        {/* Read-only preview */}
        <div className="mt-8 opacity-60 pointer-events-none">
          <LandingPageRenderer sections={page.sections} />
        </div>
      </div>
    );
  }

  // Editable mode
  return (
    <div className="flex h-screen">
      {/* Lock status bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <LockOpenIcon className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-600">
              Đang chỉnh sửa
            </span>
            {isDirty && (
              <Badge variant="warning">Chưa lưu</Badge>
            )}
            {lockState.lastSaved && (
              <span className="text-xs text-gray-400">
                Đã lưu: {formatTime(lockState.lastSaved)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.push('/admin/landing-pages')}>
              Hủy
            </Button>
            <Button
              onClick={async () => {
                await publishPage(page);
                releaseLock();
                router.push('/admin/landing-pages');
              }}
            >
              Xuất bản
            </Button>
          </div>
        </div>
      </div>

      {/* Section Picker */}
      <SectionPicker onAdd={(type) => handleChange(addSection(page, type))} />

      {/* Canvas — Drag-drop sortable */}
      <DndContext onDragEnd={handleDragEnd}>
        <SortableContext items={page.sections.map(s => s.id)}>
          {page.sections.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              isSelected={selectedSectionId === section.id}
              onSelect={() => setSelectedSectionId(section.id)}
              onUpdate={(props) => handleChange(updateSectionProps(page, section.id, props))}
              onDelete={() => handleChange(deleteSection(page, section.id))}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Properties Panel */}
      {selectedSectionId && (
        <SectionProperties
          section={page.sections.find(s => s.id === selectedSectionId)}
          schema={sectionRegistry[page.sections.find(s => s.id === selectedSectionId).type].schema}
          onChange={(props) => handleChange(updateSectionProps(page, selectedSectionId, props))}
        />
      )}
    </div>
  );
}
```

### Backend Lock API

```typescript
// Backend: Spring Boot Controller

@PostMapping("/{id}/lock")
public ResponseEntity<?> acquireLock(
  @PathVariable Long id,
  @AuthenticationPrincipal UserDetails user
) {
  LandingPage page = landingPageRepository.findById(id)
    .orElseThrow(() -> new NotFoundException("Page not found"));

  // Check existing lock
  if (page.isLocked()) {
    LockInfo existingLock = page.getLockInfo();

    // If locked by another user and not expired
    if (!existingLock.getLockedBy().getId().equals(user.getId())
        && !existingLock.isExpired()) {
      return ResponseEntity.status(409)
        .body(Map.of(
          "error", "LOCKED_BY_ANOTHER_USER",
          "lock", existingLock
        ));
    }

    // Lock expired or owned by same user — release and re-acquire
    page.releaseLock();
  }

  // Acquire lock
  LockInfo lock = new LockInfo(
    page.getId(),
    user.getId(),
    user.getName(),
    Instant.now(),
    Instant.now().plusSeconds(60) // 1 minute expiry
  );
  page.setLock(lock);
  landingPageRepository.save(page);

  return ResponseEntity.ok(Map.of("lock", lock));
}

@PostMapping("/{id}/lock/heartbeat")
public ResponseEntity<?> heartbeat(
  @PathVariable Long id,
  @AuthenticationPrincipal UserDetails user
) {
  LandingPage page = landingPageRepository.findById(id)
    .orElseThrow(() -> new NotFoundException("Page not found"));

  LockInfo lock = page.getLockInfo();

  // Verify ownership
  if (lock == null || !lock.getLockedBy().getId().equals(user.getId())) {
    return ResponseEntity.status(403).body(Map.of("error", "NOT_LOCK_OWNER"));
  }

  // Extend lock expiry
  lock.setExpiresAt(Instant.now().plusSeconds(60));
  page.setLock(lock);
  landingPageRepository.save(page);

  return ResponseEntity.ok(Map.of("lock", lock));
}

@DeleteMapping("/{id}/lock")
public ResponseEntity<?> releaseLock(
  @PathVariable Long id,
  @AuthenticationPrincipal UserDetails user
) {
  LandingPage page = landingPageRepository.findById(id)
    .orElseThrow(() -> new NotFoundException("Page not found"));

  LockInfo lock = page.getLockInfo();

  // Verify ownership before release
  if (lock != null && lock.getLockedBy().getId().equals(user.getId())) {
    page.releaseLock();
    landingPageRepository.save(page);
  }

  return ResponseEntity.ok(Map.of("released", true));
}

// Scheduled task: Auto-release expired locks (runs every minute)
@Scheduled(fixedRate = 60000)
public void cleanupExpiredLocks() {
  landingPageRepository.findAll().forEach(page -> {
    if (page.getLockInfo() != null && page.getLockInfo().isExpired()) {
      page.releaseLock();
      landingPageRepository.save(page);
    }
  });
}
```

### Lock Entity Model

```typescript
// LandingPage entity với lock support

interface LockInfo {
  lockedBy: {
    id: string;
    name: string;
  };
  lockedAt: string;     // ISO timestamp
  expiresAt: string;    // Auto-expire if heartbeat stops
}

interface LandingPage {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  sections: LandingSection[];
  // Lock fields
  lock: LockInfo | null;

  isLocked(): boolean;
  getLockInfo(): LockInfo | null;
  releaseLock(): void;
}

// Frontend: Lock timeout detection
interface LockInfo {
  // ...
  isExpired(): boolean {
    return Instant.now().isAfter(Instant.parse(this.expiresAt));
  }
}
```

## 8.4 A/B Testing — Implementation Details

### A/B Test Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           A/B TEST LIFECYCLE                                  │
│                                                                               │
│  1. CREATE → Admin tạo variants + traffic split trong Landing Builder      │
│  2. ASSIGN → User truy cập → hệ thống assign variant (sticky)            │
│  3. TRACK  → PostHog ghi: view, conversion, funnel                        │
│  4. ANALYZE→ Đủ sample + statistical significance                          │
│  5. DECIDE → Admin declare winner hoặc continue testing                   │
│  6. DEPLOY → Winner được deploy hoặc keep testing                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Variant Assignment — Cookie-based Sticky Assignment

```typescript
// features/landing-pages/lib/ab-testing.ts

interface ABTestConfig {
  testId: string;
  variants: Variant[];
  trafficAllocation: number;       // % traffic included in test (rest = control)
  minSampleSize: number;          // Minimum visitors per variant before analysis
  significanceLevel: number;       // p-value threshold: 0.05 = 95% confidence
  maxDuration: number;            // Max days before auto-stop
  goalEvent: string;              // PostHog event for conversion
}

interface Variant {
  id: string;
  name: string;
  sections: LandingSection[];      // Sections cho variant này
  trafficAllocation: number;      // % traffic: [50, 50] hoặc [70, 30]
}

// 30 ngày, 95% confidence, 1000 visitors/variant
const DEFAULT_TEST_CONFIG: ABTestConfig = {
  testId: '',
  variants: [],
  trafficAllocation: 100,         // Test 100% traffic
  minSampleSize: 1000,
  significanceLevel: 0.05,
  maxDuration: 30,
  goalEvent: 'booking_started',
};

// resolveVariant: Sticky assignment via cookie
async function resolveVariant(slug: string): Promise<Variant | null> {
  const page = await getLandingPage(slug);

  // No active test
  if (!page.activeTest) return null;

  const test = page.activeTest;

  // Cookie-based sticky assignment
  const cookieKey = `ab_${test.testId}`;
  let assignment = getCookie(cookieKey); // Server-side cookie read

  if (!assignment) {
    // New visitor — assign variant based on traffic split
    const random = Math.random() * 100; // 0-100
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.trafficAllocation;
      if (random < cumulative) {
        assignment = variant.id;
        break;
      }
    }

    // Set cookie (HttpOnly: false for JS read, SameSite: Lax)
    setCookie(cookieKey, assignment, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      httpOnly: false,            // Allow PostHog to read
    });
  }

  // Track view in PostHog
  posthog.capture('ab_test_viewed', {
    test_id: test.testId,
    variant_id: assignment,
    slug,
  });

  return test.variants.find(v => v.id === assignment) || null;
}
```

### PostHog Analytics — Conversion Tracking

```typescript
// Track conversion events

// View event: fired when user sees a variant
posthog.capture('ab_test_viewed', {
  test_id: 'homepage-hero-may-2026',
  variant_id: 'variant-a',
  source: 'google-ads',        // UTM source
  slug: 'luat-doanh-nghiep',
});

// Conversion event: fired on goal completion
posthog.capture('ab_test_converted', {
  test_id: 'homepage-hero-may-2026',
  variant_id: 'variant-a',
  conversion_goal: 'booking_started',  // Matches goalEvent in config
  value: 1,
});

// A/B Test funnel in PostHog:
// Step 1: ab_test_viewed
// Step 2: booking_started
// → PostHog tự tính conversion rate + statistical significance
```

### Admin UI — Manage A/B Tests

```tsx
// features/landing-pages/admin/ab-test-manager.tsx

interface ABTestPanelProps {
  pageId: string;
}

function ABTestPanel({ pageId }: ABTestPanelProps) {
  const { data: test } = useABTest(pageId);
  const { data: stats } = useABTestStats(test?.testId);

  const isSignificant = stats?.pValue < 0.05;
  const hasEnoughData = stats?.visitorsPerVariant >= 1000;

  return (
    <div className="ab-test-panel">
      <div className="flex items-center justify-between">
        <h3>A/B Test</h3>
        <Button onClick={startTest} disabled={test?.status === 'running'}>
          Bắt đầu test
        </Button>
      </div>

      {test?.status === 'running' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {test.variants.map(variant => {
              const variantStats = stats?.variants[variant.id];
              const isWinner = isSignificant &&
                variantStats.conversionRate === Math.max(...Object.values(stats?.variants || {}).map(v => v.conversionRate));

              return (
                <div key={variant.id} className={cn(
                  "p-4 border rounded-lg",
                  isWinner && "border-green-500 bg-green-50"
                )}>
                  <div className="font-medium">{variant.name}</div>
                  <div className="text-2xl font-bold">
                    {(variantStats?.conversionRate * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {variantStats?.visitors} visitors
                  </div>
                  {isWinner && (
                    <Badge variant="success">Winner (95% confidence)</Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Statistical significance bar */}
          <div className="mt-4">
            <div className="text-sm text-gray-600">
              Confidence: {(stats?.confidence * 100).toFixed(1)}%
              {stats?.pValue && ` (p=${stats.pValue.toFixed(4)})`}
            </div>
            <Progress
              value={Math.min(stats?.confidence * 100 || 0, 100)}
              className="mt-2"
            />
            {!hasEnoughData && (
              <p className="text-xs text-yellow-600 mt-1">
                Cần thêm {1000 - (stats?.visitorsPerVariant || 0)} visitors để có kết quả đáng tin
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => stopTest('stopped')}
            >
              Dừng test
            </Button>
            <Button
              onClick={() => stopTest('winner_selected')}
              disabled={!isSignificant}
            >
              Declare winner
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
```

### Winner Declaration Flow

```typescript
// Admin declares winner → Apply variant to main page
async function declareWinner(testId: string, winnerVariantId: string) {
  const test = await getABTest(testId);
  const winner = test.variants.find(v => v.id === winnerVariantId);

  // Update page: replace sections with winner
  await updateLandingPage(test.pageId, {
    sections: winner.sections,
    status: 'published',
  });

  // Archive test
  await updateABTest(testId, {
    status: 'completed',
    winnerId: winnerVariantId,
    endedAt: new Date().toISOString(),
  });

  // Track
  posthog.capture('ab_test_completed', {
    test_id: testId,
    winner_id: winnerVariantId,
    winner_name: winner.name,
    improvement: calculateLift(test),
  });

  // Revalidate landing page
  revalidatePath(`/lp/${test.slug}`);
  revalidateTag('landing-pages');
}
```

### Cookie vs localStorage

| Storage | Use Case | Reason |
| :--- | :--- | :--- |
| **Cookie** | Variant assignment | Server-side readable, shareable across subdomains, PostHog can read |
| **localStorage** | ❌ Không dùng | Server-side không đọc được, không share được, PostHog không track được |

```typescript
// Server Component: Read variant from cookie
// app/lp/[slug]/page.tsx
import { cookies } from 'next/headers';

export default async function LandingPage({ params }: { params: { slug: string } }) {
  const cookieStore = cookies();
  const assignmentCookie = cookieStore.get(`ab_${params.slug}`);

  let variant: Variant | null = null;

  if (assignmentCookie) {
    // User có assignment → load variant từ DB
    variant = await getVariantFromCookie(params.slug, assignmentCookie.value);
  }

  // Render với variant hoặc default sections
  const sections = variant?.sections || defaultSections;

  return <LandingPageRenderer sections={sections} />;
}
```

### Statistical Significance

```typescript
// Backend: Calculate statistical significance
// Chi-squared test hoặc z-test cho conversion rates

interface ABTestResults {
  testId: string;
  variants: Record<string, {
    visitors: number;
    conversions: number;
    conversionRate: number;
  }>;
  pValue: number;
  confidence: number;           // 1 - pValue
  winner: string | null;
  recommendation: 'continue' | 'declare_winner' | 'no_winner';
}

// Recommendation logic
function analyzeResults(results: ABTestResults): ABTestResults['recommendation'] {
  const { pValue, variants } = results;
  const maxRate = Math.max(...Object.values(variants).map(v => v.conversionRate));
  const minRate = Math.min(...Object.values(variants).map(v => v.conversionRate));

  // Not enough data
  const totalVisitors = Object.values(variants).reduce((sum, v) => sum + v.visitors, 0);
  if (totalVisitors < 2000) return 'continue';

  // Statistically significant
  if (pValue < 0.05) {
    const winnerExists = Object.values(variants).some(v => v.conversionRate === maxRate);
    return winnerExists ? 'declare_winner' : 'no_winner';
  }

  return 'continue';
}
```

---

# 09. AUTH & RBAC

## 9.1 Permission Matrix

```typescript
// features/auth/utils/permissions.ts

type Permission =
  | 'dashboard:read'
  | 'bookings:read' | 'bookings:write' | 'bookings:delete'
  | 'leads:read' | 'leads:write' | 'leads:delete' | 'leads:assign'
  | 'posts:read' | 'posts:write' | 'posts:publish' | 'posts:delete'
  | 'services:read' | 'services:write' | 'services:delete'
  | 'lawyers:read' | 'lawyers:write' | 'lawyers:delete'
  | 'reviews:moderate'
  | 'chatbot:read_logs' | 'chatbot:config'
  | 'newsletter:read' | 'newsletter:send'
  | 'landing_pages:read' | 'landing_pages:write' | 'landing_pages:publish' | 'landing_pages:delete'
  | 'users:read' | 'users:write' | 'users:delete'
  | 'settings:read' | 'settings:write';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ['*'],  // All permissions

  ADMIN: [
    'dashboard:read',
    'bookings:read', 'bookings:write', 'bookings:delete',
    'leads:read', 'leads:write', 'leads:delete', 'leads:assign',
    'posts:read', 'posts:write', 'posts:publish', 'posts:delete',
    'services:read', 'services:write', 'services:delete',
    'lawyers:read', 'lawyers:write', 'lawyers:delete',
    'reviews:moderate',
    'chatbot:read_logs', 'chatbot:config',
    'newsletter:read', 'newsletter:send',
    'landing_pages:read', 'landing_pages:write', 'landing_pages:publish', 'landing_pages:delete',
    'users:read', 'users:write',
    'settings:read', 'settings:write',
  ],

  EDITOR: [
    'dashboard:read',
    'posts:read', 'posts:write', 'posts:publish',
    'services:read',
    'lawyers:read',
    'reviews:moderate',
    'landing_pages:read', 'landing_pages:write', 'landing_pages:publish',
  ],

  LAWYER: [
    'dashboard:read',
    'bookings:read', 'bookings:write',
    'leads:read', 'leads:assign',
    'posts:read',
    'services:read',
    'lawyers:read', 'lawyers:write',
  ],

  CRM_STAFF: [
    'dashboard:read',
    'bookings:read', 'bookings:write',
    'leads:read', 'leads:write', 'leads:assign',
    'services:read',
    'lawyers:read',
  ],

  MARKETING: [
    'dashboard:read',
    'posts:read', 'posts:write', 'posts:publish',
    'services:read',
    'reviews:moderate',
    'chatbot:read_logs', 'chatbot:config',
    'newsletter:read', 'newsletter:send',
    'landing_pages:read', 'landing_pages:write', 'landing_pages:publish', 'landing_pages:delete',
  ],

  VIEWER: ['dashboard:read'],
};

// Permission checking helper
export function can(userRole: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.includes('*') || permissions.includes(permission);
}

// React hook
export function usePermission(permission: Permission): boolean {
  const { user } = useAuthStore();
  return user ? can(user.role, permission) : false;
}

// Usage in components
{can(user.role, 'landing_pages:write') && <EditButton />}

<Button disabled={!can(user.role, 'posts:publish')}>
  Xuất bản
</Button>
```

---

# 10. CACHE STRATEGY (MỞ RỘNG)

## 10.1 Per-Feature Cache Tags

```typescript
// Next.js Route Handler với Cache Tags

// app/blog/page.tsx — ISR 1 giờ, tagged 'blog'
export default async function BlogPage() {
  const posts = await getCachedPosts();

  return <BlogList posts={posts} />;
}

// app/admin/blog/page.tsx — No cache (always fresh)
async function AdminBlogPage() {
  // TanStack Query handles caching với SWR
  const { data } = usePosts();

  return <AdminBlogList posts={data} />;
}

// On-demand revalidation patterns
// 1. CMS publishes post → revalidateTag('blog')
// 2. Admin updates service → revalidateTag('services')
// 3. Lawyer profile change → revalidateTag('lawyers')

async function handlePublish(postId: string) {
  await updatePostStatus(postId, 'published');
  // Revalidate both blog listing and the specific post page
  revalidateTag('blog');
  revalidatePath(`/blog/${postSlug}`);  // Specific page
}
```

## 10.2 SWR với TanStack Query

```typescript
// TanStack Query configuration
// providers/query-provider.tsx
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,           // 1 minute default
      gcTime: 1000 * 60 * 10,       // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,

      // Per-query overrides
      queries: {
        '/availability': {
          staleTime: 30 * 1000,      // Slots: 30 seconds
          refetchInterval: 30 * 1000, // Real-time slot sync
        },
        '/blog': {
          staleTime: 60 * 60 * 1000, // Blog: 1 hour
        },
        '/leads': {
          staleTime: 0,              // CRM: no stale
          refetchOnMount: true,
        },
      },
    },
  },
});
```

---

# 10.1 i18n — Static + Dynamic Content

## 10.1.1 Content Strategy: Backend-first

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    i18n CONTENT STRATEGY                                        │
│                                                                               │
│  STATIC UI TEXT                DYNAMIC CONTENT                              │
│  ────────────────               ────────────────                              │
│  next-intl (vi/en)             Backend returns localized content              │
│  Button labels                  Blog posts, services, lawyer bios           │
│  Navigation                     FAQ, landing page sections                    │
│  Error messages                 Meta descriptions                            │
│  Toast messages                                                           │
│                                                                               │
│  RULE: Static UI = next-intl. Dynamic content = Backend i18n field.       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Static UI — next-intl Configuration

```typescript
// i18n/config.ts
import { notFound } from 'next/navigation';

export const locales = ['vi', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'vi';

export const localeNames: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
};

// Dictionary type for static messages
export type Dictionary = typeof import('./messages/vi.json');
```

### Backend API — Localized Response

```typescript
// Backend: API trả về content đã được i18n
// GET /api/v1/posts?locale=vi
// GET /api/v1/posts?locale=en

interface LocalizedPost {
  id: string;
  slug: string;
  locale: 'vi' | 'en';
  title: string;
  content: string;
  excerpt: string;
  meta: {
    title: string;
    description: string;
    ogImage: string;
  };
  // Related content in other languages
  translations?: {
    locale: Locale;
    slug: string;
  }[];
}

// Server Component: Fetch localized data
// app/(public)/blog/[slug]/page.tsx
export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const locale = extractLocaleFromParams(params); // 'vi' | 'en'

  // Fetch từ backend với locale
  const post = await fetchFromAPI(`/posts/${params.slug}?locale=${locale}`);

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
      {/* Language switcher */}
      {post.translations && (
        <div className="lang-switcher">
          {post.translations.map(t => (
            <Link key={t.locale} href={`/${t.locale}/blog/${t.slug}`}>
              {localeNames[t.locale]}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
```

### Localized URL Strategy

```
URL STRUCTURE:

vi (default):           /dich-vu/luat-doanh-nghiep
en:                    /en/services/corporate-law

URL không dịch hoàn toàn:
- Backend trả slug theo locale
- Frontend dùng slug từ backend
- Không auto-translate slug

IMPLEMENTATION:

app/
├── [locale]/                  # Locale prefix (optional, SEO)
│   ├── page.tsx              # Homepage vi/en
│   ├── services/
│   │   ├── page.tsx         # /services hoặc /en/services
│   │   └── [slug]/page.tsx # /services/luat-doanh-nghiep
│   └── blog/
│       └── [slug]/page.tsx
└── (public)/                 # Không có locale prefix (default = vi)
    ├── services/
    │   └── [slug]/page.tsx
    └── blog/
        └── [slug]/page.tsx
```

### i18n Usage Pattern

```tsx
// Static UI text: Dùng next-intl
import { useTranslations } from 'next-intl';

function ServiceCard({ service }: { service: LocalizedService }) {
  const t = useTranslations('Services');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{service.name}</CardTitle>      {/* Dynamic: từ backend */}
        <CardDescription>{service.description}</CardDescription> {/* Backend */}
      </CardHeader>
      <CardContent>
        <Button>
          {t('book_now')}                              {/* Static: next-intl */}
        </Button>
        <span className="text-sm text-gray-500">
          {t('starting_from', { price: service.price })}  {/* Mixed */}
        </span>
      </CardContent>
    </Card>
  );
}

// messages/vi.json
{
  "Services": {
    "book_now": "Đặt lịch ngay",
    "starting_from": "Từ {{price}} VNĐ"
  }
}

// messages/en.json
{
  "Services": {
    "book_now": "Book now",
    "starting_from": "From {{price}} VND"
  }
}
```

### SEO — hreflang Tags

```tsx
// app/(public)/blog/[slug]/page.tsx
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const [viPost, enPost] = await Promise.all([
    fetchFromAPI(`/posts/${params.slug}?locale=vi`),
    fetchFromAPI(`/posts/${params.slug}?locale=en`),
  ]);

  return {
    title: viPost.meta.title,
    description: viPost.meta.description,
    alternates: {
      languages: {
        'vi': `/blog/${viPost.slug}`,
        'en': `/en/blog/${enPost.slug}`,
      },
    },
    openGraph: {
      images: [viPost.meta.ogImage],
    },
  };
}
```

---

# 11. PERFORMANCE

## 11.1 Server vs Client Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              SERVER vs CLIENT COMPONENT DECISION GUIDE                        │
│                                                                               │
│  USE SERVER COMPONENT (Default) ────────────────────────────────────────────  │
│                                                                               │
│  ✅ Landing pages (SEO heavy)                                             │
│  ✅ Homepage sections: Header, Footer, Hero, Service Cards                  │
│  ✅ Blog list, Blog detail                                                 │
│  ✅ Service list, Lawyer profiles                                          │
│  ✅ FAQ page                                                                │
│  ✅ Contact page (static info)                                              │
│  ✅ SEO metadata generation                                                │
│  ✅ Data fetching from backend                                              │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  USE CLIENT COMPONENT ("use client") ────────────────────────────────────   │
│                                                                               │
│  ⚠️  Booking wizard (multi-step form, state machine)                      │
│  ⚠️  Chatbot panel (streaming, WebSocket/SSE)                             │
│  ⚠️  Admin dashboard (charts, real-time data)                             │
│  ⚠️  Landing page builder (drag-drop, undo/redo)                           │
│  ⚠️  Kanban board (drag-drop)                                              │
│  ⚠️  Rich text editor (TipTap)                                               │
│  ⚠️  Interactive forms với real-time validation                            │
│  ⚠️  Theme toggle, language switcher                                        │
│  ⚠️  Mobile menu (toggle state)                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 11.2 Image Optimization

```typescript
// Tất cả images dùng Next/Image

import Image from 'next/image';

// Hero images — priority load, AVIF/WebP
<Image
  src="/images/hero-law-firm.jpg"
  alt="Công ty Luật TNHH ICRC"
  fill
  priority
  sizes="100vw"
  className="object-cover"
  placeholder="blur"
  blurDataURL={heroBlur}
/>

// Blog thumbnails — lazy load, responsive sizes
<Image
  src={post.thumbnail}
  alt={post.title}
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover rounded-lg"
/>

// Lawyer avatars — small, square
<Image
  src={lawyer.avatar}
  alt={lawyer.name}
  width={64}
  height={64}
  className="rounded-full"
/>
```

## 11.3 Font Optimization

```typescript
// app/layout.tsx
import { Plus_Jakarta_Sans, Cormorant_Garamond } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700'],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${plusJakarta.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

# 12. DESIGN SYSTEM — ICON STRATEGY

## 12.1 Icon Decision Tree

| Use Case | Library | Reason |
| :- | :- | :- |
| UI elements (nav, buttons, forms) | **Lucide React** | Outline style, tree-shakeable, consistent stroke |
| Social media (Facebook, Google, Zalo) | **Font Awesome 6** | Official brand logos |
| Legal domain icons | **FA Free** (gavel, scale, handshake, landmark) | Lucide không có |
| Custom illustrations | **Inline SVG** | Favicon, hero graphics |

## 12.2 Icon Checklist — BẮT BUỘC

- [ ] **Lucide React** là default cho UI elements
- [ ] **Font Awesome 6** chỉ dùng cho social brands + legal domain icons
- [ ] Size **luôn nhất quán** — Tailwind classes hoặc CSS variables
- [ ] Stroke weight **đồng nhất** — `strokeWidth={2}` (Lucide default)
- [ ] Accessibility — `aria-label` cho icons không có adjacent text
- [ ] **TUYỆT ĐỐI KHÔNG DÙNG emoji** trong UI — cấm hoàn toàn

---

# 13. ERROR HANDLING

## 13.1 Error Boundary Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ERROR BOUNDARY HIERARCHY                             │
│                                                                               │
│  Root Error Boundary                                                          │
│  ├── app/error.tsx — Toàn app, crash recovery                            │
│  │   ├── Fallback: Custom error page                                       │
│  │   ├── Sentry: Full error report                                        │
│  │   └── Recovery: Retry button + Go Home                                 │
│  │                                                                         │
│  ├── app/not-found.tsx — 404 handler                                     │
│  │   └── Fallback: Custom 404 page                                        │
│  │                                                                         │
│  └── Feature Error Boundaries                                               │
│      ├── BookingBoundary — app/(admin)/bookings                             │
│      │   ├── Fallback: "Đặt lịch tạm thời gián đoạn"                   │
│      │   ├── State: Giữ booking state đã điền, user không mất dữ liệu   │
│      │   └── Recovery: Retry button                                        │
│      │                                                                       │
│      ├── ChatbotBoundary — ChatPanel                                       │
│      │   ├── Fallback: "Chatbot đang bảo trì. Liên hệ hotline"         │
│      │   ├── State: Giữ conversation history                               │
│      │   └── Recovery: Auto-retry sau 30s                                  │
│      │                                                                       │
│      ├── AdminBoundary — app/(admin)/layout                                │
│      │   ├── Fallback: "Dashboard tạm thời không khả dụng"              │
│      │   └── Recovery: Sidebar vẫn hoạt động                              │
│      │                                                                       │
│      └── Component Boundaries                                                │
│          ├── ChartBoundary — Recharts                                       │
│          │   ├── Fallback: "Biểu đồ tạm thời không tải được"           │
│          │   └── Recovery: Manual retry                                     │
│          │                                                                   │
│          ├── EditorBoundary — TipTap                                         │
│          │   ├── Fallback: "Trình soạn thảo đang tải..."                 │
│          │   └── Recovery: Auto-reload editor                              │
│          │                                                                   │
│          └── ImageBoundary — Next/Image                                    │
│              ├── Fallback: Blur placeholder                                 │
│              └── Recovery: Auto-retry on visibility                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Root Error Boundary

```typescript
// app/error.tsx
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry
    Sentry.captureException(error, {
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Đã xảy ra lỗi
        </h1>
        <p className="text-gray-600 mb-6">
          Chúng tôi đã ghi nhận lỗi này và sẽ khắc phục sớm nhất có thể.
        </p>

        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            <Home className="w-4 h-4 mr-2" />
            Về trang chủ
          </Button>
        </div>

        {error.digest && (
          <p className="mt-4 text-xs text-gray-400">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
```

### Feature Error Boundary — Booking

```typescript
// features/booking/components/booking-error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class BookingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      extra: { errorInfo },
      tags: { feature: 'booking' },
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-red-800">
                Đặt lịch tạm thời gián đoạn
              </h3>
              <p className="text-sm text-red-600 mt-1">
                Chức năng đặt lịch đang gặp sự cố. Vui lòng thử lại trong giây lát.
              </p>
              <p className="text-xs text-red-500 mt-2">
                Dữ liệu bạn đã nhập vẫn được lưu.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={() => this.setState({ hasError: false, error: null })}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Feature Error Boundary — Chatbot

```typescript
// features/chatbot/ui/chatbot-error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  retryCount: number;
}

export class ChatbotErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, retryCount: 0 };
  }

  componentDidCatch(error: Error) {
    console.error('Chatbot error:', error);
    // Auto-retry sau 30 giây
    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
    }, 30_000);
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleRetry = () => {
    this.setState(prev => ({ hasError: false, retryCount: prev.retryCount + 1 }));
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
          <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="font-medium text-gray-700 mb-2">
            Chatbot đang bảo trì
          </h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            Trợ lý pháp lý tạm thời không khả dụng.
            <br />
            Vui lòng liên hệ trực tiếp:
          </p>
          <div className="flex flex-col gap-2 w-full">
            <Button
              variant="outline"
              onClick={this.handleRetry}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại ({30 - this.state.retryCount * 10}s)
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/contact'}
              className="w-full"
            >
              <Phone className="w-4 h-4 mr-2" />
              Liên hệ hotline
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Feature Error Boundary — Admin Dashboard

```typescript
// app/(admin)/admin-error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  section?: string;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Extract section từ error message hoặc route
    return {
      hasError: true,
      section: 'phần này',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                <LayoutDashboard className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Dashboard tạm thời không khả dụng
              </h2>
              <p className="text-gray-600">
                {this.state.section} đang gặp sự cố. Sidebar vẫn hoạt động bình thường.
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => this.setState({ hasError: false })}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Thử lại
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Component Error Boundary — Charts & Editor

```typescript
// features/admin/components/chart-error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
}

export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <BarChart3 className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Biểu đồ tạm thời không tải được
          </p>
          {this.props.title && (
            <p className="text-xs text-gray-400 mt-1">{this.props.title}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => this.setState({ hasError: false })}
            className="mt-3"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Tải lại
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// features/admin/components/editor-error-boundary.tsx
export class EditorErrorBoundary extends Component<{}, { hasError: boolean }> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-red-200 bg-red-50 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium">Trình soạn thảo gặp lỗi</p>
          <p className="text-sm text-red-600 mt-1">
            Vui lòng tải lại trang để tiếp tục
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-3"
          >
            Tải lại trang
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Error Recovery Actions Matrix

| Boundary | Error Type | Fallback UI | Recovery Action | State Preserved |
| :--- | :--- | :--- | :--- | :--- |
| Root | Runtime crash | Error page + retry | Manual retry | ❌ None |
| Booking | API failure | "Đặt lịch gián đoạn" | Retry button | ✅ Wizard state |
| Booking | Slot conflict | Toast notification | Auto-retry | ✅ Wizard state |
| Chatbot | Stream error | "Bot bảo trì" | Auto-retry 30s | ✅ History |
| Chatbot | Network lost | Offline indicator | Auto-reconnect | ✅ History |
| Admin | Lazy chunk fail | Section error | Retry button | ✅ Sidebar |
| Chart | Recharts fail | Error placeholder | Manual retry | ❌ None |
| Editor | TipTap crash | Error card | Reload page | ❌ Content lost |

### Usage in Components

```tsx
// app/(admin)/bookings/page.tsx
import { BookingErrorBoundary } from '@/features/booking/components/booking-error-boundary';

export default function BookingsPage() {
  return (
    <div>
      <PageHeader title="Quản lý đặt lịch" />
      <BookingErrorBoundary>
        <BookingTable />
        <BookingCalendar />
      </BookingErrorBoundary>
    </div>
  );
}

// app/booking/page.tsx
import { BookingErrorBoundary } from '@/features/booking/components/booking-error-boundary';

export default function BookingPage() {
  return (
    <BookingErrorBoundary>
      <BookingWizard />
    </BookingErrorBoundary>
  );
}

// Chatbot widget
import { ChatbotErrorBoundary } from '@/features/chatbot/ui/chatbot-error-boundary';

export function ChatbotWidget() {
  return (
    <ChatbotErrorBoundary>
      <ChatPanel />
    </ChatbotErrorBoundary>
  );
}
```

## 13.2 Zod Validation Pattern

```typescript
// features/booking/schemas/booking.schema.ts
import { z } from 'zod';

export const bookingFormSchema = z.object({
  serviceId: z.string().min(1, 'Vui lòng chọn dịch vụ'),
  lawyerId: z.string().min(1, 'Vui lòng chọn luật sư'),
  date: z.string().min(1, 'Vui lòng chọn ngày'),
  timeSlot: z.string().min(1, 'Vui lòng chọn giờ'),
  consultType: z.enum(['office', 'video', 'phone']),
  customerName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  customerPhone: z.string().regex(
    /^(0[1-9]\d{8,9})$/,
    'Số điện thoại không hợp lệ (0xxx xxx xxx)'
  ),
  customerEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  issueDescription: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: 'Bạn phải đồng ý với điều khoản' }),
  }),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

// Landing page section schema (versioned)
export const heroSectionSchema = z.object({
  type: z.literal('hero'),
  version: z.literal(2),
  props: z.object({
    headline: z.string().min(5).max(60),
    subheadline: z.string().max(120).optional(),
    ctaText: z.string(),
    ctaLink: z.string().url(),
    backgroundType: z.enum(['gradient', 'image', 'video']),
    backgroundValue: z.string(),
    showTrustBadges: z.boolean().default(true),
  }),
});
```

---

# 14. TESTING STRATEGY

## 14.1 Testing Pyramid

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TESTING PYRAMID                                    │
│                                                                               │
│                                    ▲                                         │
│                                   /E\                                        │
│                                  /2E \        E2E Tests (Playwright)        │
│                                 /─────\       • Critical user flows           │
│                                /  IT   \       • Booking, Auth, Chatbot       │
│                               /──────────\     • Visual regression (Chromatic) │
│                              /    ST      \    ST: Snapshot Tests (Storybook) │
│                             /──────────────\   • Component isolation          │
│                            /     UT         \  • UI review workflow            │
│                           /────────────────\                                   │
│                          /      UT           \  UT: Unit Tests (Vitest)          │
│                         /────────────────────\ • Hooks, utils, schemas        │
│                        /       API              • MSW mocks                    │
│                       /────────────────────────\                               │
│                                                                               │
│  Coverage Targets:                                                           │
│  UT: Hooks 80%, Utils 90%, Schemas 95%                                       │
│  ST: All shared components + feature components                               │
│  IT: Feature integrations, API contracts (MSW)                               │
│  E2E: All critical flows (100% coverage)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 14.2 MSW — Mock Service Worker

```typescript
// tests/mocks/handlers/booking.ts
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const bookingHandlers = [
  http.post('/api/v1/availability/reserve', async ({ request }) => {
    const body = await request.json() as { slotId: string };

    if (body.slotId === 'conflict-slot') {
      return HttpResponse.json(
        { error: 'SLOT_ALREADY_RESERVED' },
        { status: 409 }
      );
    }

    return HttpResponse.json({
      success: true,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
  }),

  http.post('/api/v1/bookings', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 'booking-123',
      ...body,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),
];

export const server = setupServer(...bookingHandlers);

// tests/mocks/handlers/index.ts
import { bookingHandlers } from './booking';
import { blogHandlers } from './blog';
import { authHandlers } from './auth';

export const handlers = [
  ...bookingHandlers,
  ...blogHandlers,
  ...authHandlers,
];
```

## 14.3 Storybook + Chromatic

```typescript
// storybook/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof Button> = {
  component: Button,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Đặt lịch tư vấn',
    variant: 'default',
  },
};

export const Loading: Story = {
  args: {
    children: 'Đang xử lý...',
    variant: 'default',
    disabled: true,
  },
};

// Chromatic: visual regression testing
// .chromatic/
// → Upload Storybook build
// → Compare against baseline
// → Block PR if visual diff detected
```

## 14.4 E2E Critical Flows (Playwright)

```typescript
// tests/e2e/flows/booking.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('complete booking flow — slot reserved then submitted', async ({ page }) => {
    await page.goto('/booking');

    // Step 1: Service + Lawyer
    await page.click('[data-service="doanh-nghiep"]');
    await page.waitForSelector('.lawyer-section');
    await page.click('[data-lawyer="0"]');
    await page.click('#step1Next');

    // Step 2: Date + Time
    await page.click('.calendar__day.has-slot >> nth=0');
    await page.waitForSelector('.slot-btn:not(.booked)');
    await page.click('.slot-btn:not(.booked)');
    // Verify slot reservation timer appears
    await expect(page.locator('.slot-reservation-timer')).toBeVisible();
    await page.click('#step2Next');

    // Step 3: Form + Submit
    await page.fill('#fieldName', 'Nguyễn Văn Test');
    await page.fill('#fieldPhone', '0912345678');
    await page.fill('#fieldIssue', 'Cần tư vấn về thành lập công ty TNHH');
    await page.click('#agreeCheck');
    await page.click('#submitBtn');

    // Step 4: Confirmation
    await expect(page.locator('.confirmation__title')).toContainText('thành công');
    await expect(page.locator('.booking-receipt__id-val')).toBeVisible();
  });

  test('slot conflict — shows error when slot taken', async ({ page }) => {
    // Mock: server returns 409 for this slot
    await page.goto('/booking');
    await page.click('[data-service="doanh-nghiep"]');
    await page.click('[data-lawyer="0"]');
    await page.click('#step1Next');
    await page.click('.calendar__day.has-slot >> nth=0');

    // Select conflict slot
    await page.click('[data-slot-id="conflict-slot"]');

    // Error toast appears
    await expect(page.locator('.toast-error')).toContainText('Slot này vừa được đặt');
  });
});
```

---

# 15. DEPLOYMENT & DevOps

## 15.1 Environment Variables

```bash
# .env.example

# API
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Revalidation
REVALIDATE_SECRET=

# Observability
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Analytics
NEXT_PUBLIC_GA_ID=

# CDN
NEXT_PUBLIC_CDN_URL=
```

## 15.2 CI/CD Pipeline

```
.github/workflows/deploy.yml

Trigger: push to main
Stages:
1. lint         → ESLint + Prettier check
2. type-check    → tsc --noEmit
3. test         → Vitest unit tests
4. build        → next build
5. e2e          → Playwright E2E tests
6. storybook    → Chromatic visual regression
7. deploy       → Vercel production deploy
```

---

# 16. PHASE DELIVERY PLAN

## Risk Assessment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE RISK MATRIX                                           │
│                                                                               │
│  Phase | Risk Level | Key Concerns                                          │
│  ─────┼────────────┼──────────────────────────────────                     │
│   1   |    LOW     | Well-defined, standard stack                         │
│   2   |   MEDIUM   | Landing builder complexity, A/B testing              │
│   3   |    HIGH    | Race conditions, real-time sync                     │
│   4   |    HIGH    | SSE streaming, AI integration, fallback             │
│   5a  |    HIGH    | TipTap editor, Kanban drag-drop                     │
│   5b  |   MEDIUM   | Chart perf, lazy loading edge cases                │
│   6   |    LOW     | Known tools, well-defined scope                     │
│                                                                               │
│  ⚠️  Phases 3, 4, 5a = HIGH RISK — cần buffer thời gian              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Phase 1: Foundation (Week 1-2)

| Task | Description | Risk |
| :- | :- | :- |
| Project setup | Next.js 15 + TypeScript + Tailwind v4 + shadcn/ui | LOW |
| Feature architecture | Directory structure, stores, query provider | LOW |
| Zustand stores | auth (no token), ui stores | LOW |
| Design system | CSS variables, shadcn/ui components | LOW |
| Auth setup | NextAuth.js + RBAC + HttpOnly cookies + silent refresh | MEDIUM |
| API client | Axios server/client split, token refresh interceptor | MEDIUM |
| Error boundaries | Root + Feature boundaries + Sentry | MEDIUM |
| **Testing setup** | **Vitest + MSW handlers (bắt đầu song song)** | LOW |

## Phase 2: Public Pages + Landing Pages (Week 3-4)

| Task | Description | Risk |
| :- | :- | :- |
| Homepage | All sections (Hero, Services, Lawyers, CTA, FAQ) | LOW |
| Services, Lawyers, Blog, FAQ | SSR + ISR + cache tags | LOW |
| Contact, Reviews | Forms + validation + Zod | LOW |
| Landing page renderer | Section registry với versioning | MEDIUM |
| Landing page builder | Drag-drop editor + autosave + lock (Pessimistic) | HIGH |
| A/B testing | Variant assignment, PostHog tracking, admin UI | MEDIUM |
| **Storybook** | **Shared components stories (bắt đầu sớm)** | LOW |

## Phase 3: Booking Engine (Week 5-6)

| Task | Description | Risk |
| :- | :- | :- |
| Booking wizard | 4-step Zustand state machine + sessionStorage persist | HIGH |
| Slot reservation | Backend optimistic locking + 5-minute timer | HIGH |
| Real-time sync | SWR polling 30s + server slot verification | HIGH |
| Booking API | POST với version check + race condition handling | HIGH |
| Booking error boundary | State preservation on error | MEDIUM |
| **E2E setup** | **Playwright + critical booking flow tests** | LOW |

### Phase 3 Detailed Plan — Execution Checklist

**Mục tiêu ship**: Hoàn thành luồng đặt lịch 4 bước hoạt động ổn định trên mobile/desktop, chống double booking, giữ state khi refresh tab và có test bao phủ các tình huống race condition quan trọng.

**Phạm vi Phase 3**:
- Public booking page tại `app/booking/page.tsx`
- Booking feature module tại `src/features/booking/`
- Persist state bằng `sessionStorage`, không dùng `localStorage`
- Đồng bộ slot với backend qua reservation ID + expiry time
- Xử lý conflict, expiry, refresh, back/next, submit success/failure

**Definition of Done**:
- [ ] User hoàn tất được booking end-to-end trong 1 tab không mất state khi refresh
- [ ] Slot được reserve trước khi nhập form và tự hết hạn sau 5 phút
- [ ] Khi slot bị người khác giữ/đặt trước, UI báo rõ và buộc chọn lại slot hợp lệ
- [ ] Submit không tạo duplicate booking nếu reservation không còn valid
- [ ] Có unit tests cho store/schema/utils và Playwright cho critical booking flows

#### Week 5: Wizard Foundation + Slot Reservation (Day 29-35)

##### Task 3.1: Route + Feature Shell + Progress UI (Day 29)

**Mục tiêu**: Tạo khung trang booking và phân tách feature module rõ ràng.

**Files ưu tiên**:
- `src/app/booking/page.tsx`
- `src/features/booking/components/booking-provider.tsx`
- `src/features/booking/components/booking-progress.tsx`
- `src/features/booking/components/index.ts`
- `src/features/booking/index.ts`

**Implementation notes**:
- Trang booking là client-heavy flow nhưng page shell vẫn nên giữ server-first nếu không cần state ở route level.
- Dùng provider mỏng để gom query client logic, analytics hooks và error boundary.
- Progress bar hiển thị 4 bước: dịch vụ → luật sư → lịch hẹn → thông tin/xác nhận.
- Tất cả step component tách file riêng để giữ scope nhỏ và test dễ.

**Exit Criteria**:
- [ ] `/booking` render được shell + progress bar
- [ ] Step switching có cấu trúc sẵn dù chưa nối API đầy đủ
- [ ] Thư mục feature `booking` khớp cấu trúc trong BRS

---

##### Task 3.2: Booking Store + Session Persistence (Day 29-30)

**Mục tiêu**: Thiết lập nguồn state trung tâm cho wizard và bảo toàn state khi refresh.

**Files ưu tiên**:
- `src/stores/booking.store.ts`
- `src/features/booking/types/index.ts`
- `src/features/booking/hooks/use-booking.ts`

**State tối thiểu**:
- `step`
- `service`
- `lawyer`
- `date`
- `timeSlot`
- `reservedSlot`
- `customerInfo`
- `isHydrated`
- actions: `setStep`, `reserveSlot`, `releaseSlot`, `submitBooking`, `checkSlotStatus`, `reset`

**Quy tắc bắt buộc**:
- Dùng `persist(... createJSONStorage(() => sessionStorage))`
- Không persist transient error/loading flags
- Sau hydrate phải verify lại reservation với server trước khi cho user tiếp tục submit
- `reset()` phải xóa cả wizard state lẫn reservation state local

**Edge cases cần tính trước**:
- Refresh tại step 3/4 nhưng reservation đã hết hạn
- Tab mở lâu, timer local lệch so với server
- Back về bước trước sau khi đã reserve slot

**Exit Criteria**:
- [ ] Refresh trang vẫn giữ step + form data + selected slot nếu reservation còn valid
- [ ] Reservation invalid thì state tự rollback về bước chọn lịch
- [ ] Store API đủ rõ để step components không tự quản lý business state riêng

---

##### Task 3.3: Step 1-2 — Service, Lawyer, DateTime Selection (Day 30-31)

**Mục tiêu**: Hoàn thiện hai lớp chọn đầu vào trước khi reserve slot.

**Files ưu tiên**:
- `src/features/booking/components/step-service.tsx`
- `src/features/booking/components/step-lawyer.tsx`
- `src/features/booking/components/step-datetime.tsx`
- `src/features/booking/components/calendar.tsx`
- `src/features/booking/components/time-slots.tsx`
- `src/features/booking/hooks/use-slots.ts`

**Implementation notes**:
- Bước chọn phải khóa nút “Tiếp tục” nếu dữ liệu chưa đủ.
- Khi đổi service hoặc lawyer sau đó, phải invalidate lựa chọn date/slot phụ thuộc.
- Slot list hiển thị trạng thái `available`, `reserved`, `booked`, `expired` rõ ràng.
- Ưu tiên query key rõ nghĩa kiểu `['booking-slots', lawyerId, date]`.

**Exit Criteria**:
- [ ] User chỉ đi tiếp khi chọn đủ dữ liệu bắt buộc
- [ ] Đổi lựa chọn upstream sẽ reset đúng state downstream
- [ ] Slot data được fetch lại đúng theo lawyer + date

---

##### Task 3.4: Slot Reservation API + Countdown Timer (Day 31-33)

**Mục tiêu**: Chặn race condition bằng cơ chế reserve trước khi submit.

**Files ưu tiên**:
- `src/features/booking/api/booking-api.ts`
- `src/features/booking/components/slot-reservation-timer.tsx`
- `src/features/booking/utils/index.ts`
- `tests/mocks/handlers/booking.ts`

**Luồng chuẩn**:
1. User chọn slot
2. Frontend gọi `POST /availability/reserve`
3. Backend trả về `reservationId` + `expiresAt`
4. Store lưu `reservedSlot`
5. Timer countdown hiển thị liên tục trong step nhập thông tin/xác nhận
6. Hết hạn thì clear reservation + đưa user về bước chọn lịch

**Behavior bắt buộc**:
- Nếu reserve slot mới, phải release reservation cũ trước hoặc overwrite an toàn theo contract backend
- Nếu API trả `409`, hiển thị toast và refetch slot list ngay
- Nếu user rời flow hoặc reset, cố gắng gọi release reservation
- Timer dùng `expiresAt` từ server, không tự giả định 5 phút từ client time

**Exit Criteria**:
- [ ] Timer hiển thị chính xác và tự xử lý khi hết hạn
- [ ] Conflict 409 được xử lý mượt, không kẹt state local
- [ ] Mock handlers mô phỏng được success, conflict, expired

---

##### Task 3.5: Step 3-4 — Customer Info + Confirmation (Day 33-35)

**Mục tiêu**: Thu thập dữ liệu khách hàng, xác nhận lại thông tin và sẵn sàng submit.

**Files ưu tiên**:
- `src/features/booking/components/step-info.tsx`
- `src/features/booking/components/step-confirm.tsx`
- `src/features/booking/components/booking-summary.tsx`
- `src/features/booking/schemas/booking.schema.ts`

**Validation bắt buộc**:
- Họ tên tối thiểu 2 ký tự
- Số điện thoại Việt Nam hợp lệ
- Email optional nhưng nếu nhập phải đúng format
- Mô tả vấn đề đủ chi tiết
- Checkbox đồng ý điều khoản là required

**UX notes**:
- Summary luôn hiện service, lawyer, ngày, giờ, loại tư vấn, thời gian còn lại của reservation
- Nút submit bị disable khi reservation sắp/hết hạn hoặc form invalid
- Copy lỗi cần rõ ràng, hướng hành động cụ thể

**Exit Criteria**:
- [ ] Form validate ngay tại client bằng Zod + React Hook Form
- [ ] User xem được full summary trước submit
- [ ] Không thể submit khi reservation không hợp lệ

#### Week 6: API Robustness + Recovery + Test Coverage (Day 36-42)

##### Task 3.6: Submit Booking + Conflict Recovery (Day 36-37)

**Mục tiêu**: Hoàn thiện request tạo booking cuối cùng và xử lý các lỗi concurrency từ backend.

**Files ưu tiên**:
- `src/features/booking/api/booking-api.ts`
- `src/stores/booking.store.ts`
- `src/features/booking/types/index.ts`

**Contract kỳ vọng**:
- Submit gửi `reservationId` cùng payload booking
- Backend chỉ accept nếu reservation còn valid và đúng version/ownership rule
- Response success trả booking ID + trạng thái xác nhận

**Failure cases cần xử lý**:
- `409 SLOT_ALREADY_RESERVED` → quay lại chọn slot + toast rõ lý do
- `410 RESERVATION_EXPIRED` → clear reservation + yêu cầu chọn lại giờ
- `422 VALIDATION_ERROR` → map lỗi field về form
- `5xx` → giữ nguyên form data, cho retry an toàn

**Exit Criteria**:
- [ ] Submit success dẫn tới confirmation state rõ ràng
- [ ] Submit fail không làm mất form data không cần thiết
- [ ] Mapping lỗi API → UI nhất quán, dễ hiểu

---

##### Task 3.7: Booking Error Boundary + Recovery Paths (Day 37-38)

**Mục tiêu**: Giữ trải nghiệm bền vững khi component/API lỗi giữa luồng booking.

**Files ưu tiên**:
- `src/features/booking/components/booking-error-boundary.tsx`
- `src/app/booking/error.tsx` hoặc integration với `src/app/error.tsx`
- `src/features/booking/components/booking-provider.tsx`

**Recovery strategy**:
- Nếu render/runtime error ở wizard subtree, fallback UI phải cho retry
- Nếu retry được, giữ lại persisted wizard state nếu vẫn valid
- Nếu reservation đã invalid trong lúc recover, redirect mềm về bước chọn lịch

**Exit Criteria**:
- [ ] Booking subtree có boundary riêng, không phụ thuộc hoàn toàn root error boundary
- [ ] Recovery path không làm user mất toàn bộ tiến trình vô cớ
- [ ] Copy fallback phân biệt được lỗi tạm thời và lỗi cần chọn lại slot

---

##### Task 3.8: Polling + Server Revalidation for Slot Integrity (Day 38-39)

**Mục tiêu**: Giảm sai lệch giữa state local và trạng thái slot thực tế trên server.

**Files ưu tiên**:
- `src/features/booking/hooks/use-slots.ts`
- `src/stores/booking.store.ts`
- `src/features/booking/components/slot-reservation-timer.tsx`

**Implementation notes**:
- Poll slot availability mỗi 30 giây ở màn chọn lịch
- Khi đang giữ reservation, verify reservation status định kỳ bằng reservation endpoint
- Focus/refocus tab nên trigger revalidation ngay
- Không spam polling ở bước confirmation nếu reservation đã có cơ chế verify riêng

**Exit Criteria**:
- [ ] Refocus tab sau idle sẽ đồng bộ lại trạng thái slot
- [ ] Reservation hết hạn/invalid được phát hiện trước khi user submit càng sớm càng tốt
- [ ] Không tạo polling thừa gây load không cần thiết

---

##### Task 3.9: Analytics + Event Tracking for Booking Funnel (Day 39-40)

**Mục tiêu**: Chuẩn bị funnel cho đo lường chuyển đổi từ landing/public pages sang booking.

**Files ưu tiên**:
- `src/lib/analytics.ts`
- `src/features/booking/utils/index.ts`
- các step components trong `src/features/booking/components/`

**Events đề xuất**:
- `booking_started`
- `booking_step_completed`
- `booking_slot_reserved`
- `booking_slot_conflict`
- `booking_submit_succeeded`
- `booking_submit_failed`

**Quy tắc**:
- Event payload không chứa PII thô ngoài các metadata an toàn như service slug, lawyer id, consult type, step index
- Chỉ bắn event sau khi action thực sự thành công hoặc fail có ý nghĩa business

**Exit Criteria**:
- [ ] Funnel đủ dữ liệu để đo rơi rụng theo từng bước
- [ ] Không log thông tin nhạy cảm của khách hàng

---

##### Task 3.10: Unit + Integration + E2E Coverage (Day 40-42)

**Mục tiêu**: Khóa chất lượng trước khi ship phase 3.

**Files ưu tiên**:
- `tests/unit/booking.store.test.ts`
- `tests/unit/booking.schema.test.ts`
- `tests/unit/booking-api.test.ts`
- `tests/e2e/flows/booking.spec.ts`
- `tests/mocks/handlers/booking.ts`

**Test matrix tối thiểu**:
- Unit: persist/rehydrate booking store
- Unit: schema validation cho phone/email/required fields
- Unit: timer utility / expiry calculation
- Integration: reserve success, reserve conflict, release reservation, submit fail/success qua MSW
- E2E: happy path, slot conflict, reservation expired after refresh

**Exit Criteria**:
- [ ] Critical booking flows có test tự động
- [ ] Có ít nhất 1 test cho refresh + rehydrate + revalidation
- [ ] Mock handlers phản ánh đúng API contract dự kiến với backend

---

### Phase 3 Dependencies

**Cần sẵn từ Phase 1-2**:
- Query provider + Axios client ổn định
- Toast system hoạt động
- Error boundary pattern đã được chuẩn hóa
- Public layout và design tokens hoàn chỉnh để booking page dùng lại

**Phụ thuộc backend cần chốt sớm**:
- Contract `reserve / verify / release / submit`
- Error codes cho conflict / expired / validation
- TTL thực tế của reservation
- Semantics ownership của reservation khi refresh tab hoặc mở tab mới

### Phase 3 QA Checklist

- [ ] Mobile booking flow usable ở viewport nhỏ
- [ ] Nút back/next không làm mất dữ liệu không cần thiết
- [ ] Refresh ở step cuối không gây submit trùng
- [ ] Hết hạn reservation trong lúc nhập form có thông báo rõ
- [ ] Chuyển đổi service/lawyer/date reset state phụ thuộc đúng logic
- [ ] Confirmation page hiển thị booking ID và next steps rõ ràng

## Phase 4: Chatbot AI (Week 6-7)

| Task | Description | Risk |
| :- | :- | :- |
| Chatbot UI | Widget + panel + streaming display | MEDIUM |
| Zustand chat store | Session, messages, streaming state | LOW |
| SSE streaming | Backend streaming + frontend display | HIGH |
| AI processing | Spring Boot GPT-4o integration (API key safe) | HIGH |
| Intent classification | Backend rule-based + GPT fallback | MEDIUM |
| Message persistence | DB storage + history loading | LOW |
| Chatbot error boundary | Auto-retry + history preserved | MEDIUM |
| **PostHog funnels** | **Chatbot events tracking (bắt đầu song song)** | LOW |

## Phase 5: Admin Panel (Week 8-9)

> **Chi tiết đầy đủ**: `frontend/plans/phase-5-admin-panel.md`
>
> Design Reference: `frontend/demo/admin.html` — 100% UI parity

| Task | Description | Risk |
| :- | :- | :- |
| Admin layout | Sidebar + Topbar + route group (240px sidebar, 64px topbar) | MEDIUM |
| Shared components | DataTable, Badge, SearchBar, FilterTabs, Pagination, ActionButtons, EmptyState, ConfirmDialog, RowUser | LOW |
| Dashboard | Stats cards (4) + Line chart + Donut chart + Booking table + Lead Kanban + Activity timeline | MEDIUM |
| CRM | Lead table + Filters + Search + Lead Kanban (dnd-kit) + Lead detail modal | MEDIUM |
| Bookings admin | Calendar view + Booking table + Detail modal | MEDIUM |
| Blog admin | Post list + TipTap rich editor + Image upload + Draft/Publish | HIGH |
| Services & Lawyers | Service CRUD + Lawyer CRUD + Profile management | LOW |
| Reviews | Moderation approve/reject + Reply | LOW |
| Chatbot logs | Conversation history + Session detail | LOW |
| Newsletter | Subscriber list + Campaign management | MEDIUM |
| Users & Permissions | User CRUD + Role assignment (Admin/Lawyer/Staff) | MEDIUM |
| Settings | General + Booking + Notifications + SEO | LOW |
| RBAC middleware | All admin routes protected, unauthorized redirect | HIGH |
| Error boundary | Admin-specific error fallback | LOW |
| Unit + E2E tests | Shared components + Dashboard + CRM flows | MEDIUM |

## Phase 6: Polish + Observability + Testing (Week 10-11)

> **Chi tiết đầy đủ**: `frontend/plans/phase-6-finalization.md`
>
> Design Reference: 7 demo HTML files (index, services, lawyers, booking, contact, news, admin)

| Stream | Description | Effort |
| :- | :- | :- |
| A. 4 Public Pages | services, lawyers, news, contact (+ detail routes) | 2 days |
| B. Public Pages Polish | home, booking, login — 100% UI parity | 1 day |
| C. Admin Advanced | TipTap, Recharts, dnd-kit, TanStack Table | 1.5 days |
| D. Auth & RBAC | middleware, forgot/reset, 403, error boundary | 0.5 day |
| E. i18n + SEO | next-intl, sitemap, JSON-LD, metadata | 0.5 day |
| F. Observability | Sentry, PostHog, Web Vitals | 0.5 day |
| G. Testing | Storybook (20+ stories), Playwright (7+ flows) | 1 day |
| H. Performance | bundle audit, dynamic import, image opt | 0.5 day |
| I. Deployment | CI/CD, env vars, smoke test, prod deploy | 0.5 day |

## Timeline Summary

```
Week  1-2   │████████████████████│ Foundation + Testing setup
Week  3-4   │████████████████████│ Public Pages + Landing Pages + Storybook
Week  5-6   │████████████████████│ Booking Engine
Week  6-7   │████████████████████│ Chatbot AI + PostHog
Week  7-8   │████████████████████│ Admin Core
Week  8-9   │████████████████████│ Admin Advanced
Week 10-11  │████████████████████│ Polish + Observability + Testing

Total: 11 tuần (thay vì 9 tuần)
Buffer: 2 tuần dự phòng cho HIGH risk phases

Mileage:
├── Week 2:  Foundation ship
├── Week 4:  Public pages ship
├── Week 6:  Booking ship
├── Week 7:  Chatbot ship
├── Week 9:  Admin Panel ship (Dashboard + CRM + Blog + CRUD)
└── Week 11: Full system ship
```

## Delivery Milestones

| Milestone | Target Week | Ship Criteria |
| :- | :- | :- |
| **M1: Foundation** | Week 2 | Auth + API client + stores + error boundaries |
| **M2: Public Website** | Week 4 | All public pages + landing builder |
| **M3: Core Features** | Week 7 | Booking + Chatbot + Admin Core |
| **M4: Full System** | Week 11 | All features + testing + observability |

---

# 17. REFERENCES

| Resource | Link |
| :- | :- |
| Next.js 15 | https://nextjs.org/docs |
| shadcn/ui | https://ui.shadcn.com |
| Tailwind CSS | https://tailwindcss.com |
| TanStack Query | https://tanstack.com/query |
| Zustand | https://zustand-demo.pmnd.rs |
| NextAuth.js | https://authjs.dev |
| React Hook Form | https://react-hook-form.com |
| Zod | https://zod.dev |
| next-intl | https://next-intl-docs.vercel.app |
| TipTap | https://tiptap.dev |
| Recharts | https://recharts.org |
| TanStack Table | https://tanstack.com/table |
| Playwright | https://playwright.dev |
| Vitest | https://vitest.dev |
| MSW | https://mswjs.io |
| Storybook | https://storybook.js.org |
| Sentry | https://sentry.io |
| PostHog | https://posthog.com |

---

*Document created: May 2026*
*Version: 2.0 — Feature-first Architecture + Enterprise Ready*
