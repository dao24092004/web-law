# Phase 1: Foundation — Week 1-2

**Mục tiêu**: Setup project hoàn chỉnh với stack: Next.js 15 + TypeScript + Tailwind v4 + shadcn/ui + Auth + API Client + Error Boundaries + Testing

---

## Task Breakdown

### Week 1: Core Setup

#### Task 1.1: Project Setup (Day 1-2)

**Mục tiêu**: Tạo Next.js project với TypeScript, Tailwind v4, ESLint, Prettier

**Bước thực hiện**:

```bash
# 1. Create Next.js project
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm

cd frontend

# 2. Install core dependencies
npm install \
  zustand \
  @tanstack/react-query \
  axios \
  zod \
  react-hook-form \
  @hookform/resolvers \
  next-intl \
  lucide-react \
  class-variance-authority \
  clsx \
  tailwind-merge \
  sonner \
  @radix-ui/react-* \
  tailwindcss-animate

# 3. Install dev dependencies
npm install -D \
  @types/node \
  @types/react \
  @types/react-dom \
  eslint \
  eslint-config-next \
  prettier \
  eslint-plugin-tailwindcss \
  simple-git-hooks \
  lint-staged

# 4. Install shadcn/ui
npx shadcn@latest init

# 5. Add shadcn/ui components
npx shadcn@latest add button input textarea select checkbox radio-group badge card dialog drawer dropdown-menu sheet tabs accordion avatar skeleton spinner toast tooltip popover progress separator switch label form
```

**Verification**:

```bash
# Build test
npm run build

# Type check
npx tsc --noEmit

# Lint check
npm run lint
```

**Exit Criteria**:
- [ ] Next.js 15 app chạy được `npm run dev`
- [ ] TypeScript compile không lỗi
- [ ] Tailwind CSS hoạt động
- [ ] shadcn/ui components import được

---

#### Task 1.2: Feature Architecture & Directory Structure (Day 2-3)

**Mục tiêu**: Tạo directory structure theo spec

**Bước thực hiện**:

```bash
# Tạo directory structure
mkdir -p src/{app,components,lib,features,stores,providers}
mkdir -p src/app/{api,\(public\),\(auth\),\(admin\)}
mkdir -p src/components/{ui,layout,common,admin}
mkdir -p src/lib/{api,hooks,utils}
mkdir -p src/features/{booking,chatbot,crm,landing-pages,blog,auth}
mkdir -p src/features/{booking,chatbot,crm,landing-pages,blog,auth}/{components,hooks,types,lib}
mkdir -p src/stores
mkdir -p src/providers
mkdir -p src/i18n/messages
mkdir -p tests/{unit,e2e,mocks/handlers}
```

**Tạo base config files**:

```typescript
// tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/providers/*": ["./src/providers/*"]
    }
  }
}
```

**Verification**:

```bash
# Kiểm tra imports hoạt động
npx tsc --noEmit
```

**Exit Criteria**:
- [ ] Directory structure đúng như spec
- [ ] TypeScript path aliases hoạt động
- [ ] Feature folders có index.ts export

---

#### Task 1.3: Design System - CSS Variables (Day 3)

**Mục tiêu**: Setup CSS variables cho ICRC Law branding

**Bước thực hiện**:

```css
/* src/styles/globals.css */

/* Design tokens */
:root {
  /* Primary - Navy */
  --primary: #1E3A5F;
  --primary-dark: #152A45;
  --primary-light: #2A4F7A;
  --primary-faint: #EFF3F8;

  /* Accent - Gold */
  --accent: #C9A84C;
  --accent-dark: #B8953D;
  --accent-light: #D4B76A;

  /* Semantic */
  --success: #059669;
  --success-bg: #ECFDF5;
  --error: #DC2626;
  --error-bg: #FEF2F2;
  --warning: #D97706;
  --warning-bg: #FFFBEB;
  --info: #2563EB;
  --info-bg: #EFF6FF;

  /* Typography */
  --font-heading: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;

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

  /* Transitions */
  --transition-fast: 0.2s ease;
  --transition-base: 0.3s ease;
}
```

**Verification**:

```bash
# Check CSS build
npm run build
```

**Exit Criteria**:
- [ ] CSS variables được apply
- [ ] Font loading hoạt động
- [ ] Color palette đúng ICRC Law

---

#### Task 1.4: Zustand UI Store (Day 3-4)

**Mục tiêu**: Tạo UI store cho sidebar, modal, toast, theme

**Bước thực hiện**:

```typescript
// src/stores/ui.store.ts

import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

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
  sidebarOpen: true,
  sidebarCollapsed: false,
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  activeModal: null,
  modalProps: {},
  openModal: (modalId, props = {}) => set({ activeModal: modalId, modalProps: props }),
  closeModal: () => set({ activeModal: null, modalProps: {} }),

  toasts: [],
  addToast: (toast) => set(state => ({
    toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }]
  })),
  removeToast: (id) => set(state => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  theme: 'system',
  setTheme: (theme) => {
    document.documentElement.classList.remove('light', 'dark');
    if (theme !== 'system') {
      document.documentElement.classList.add(theme);
    }
    set({ theme });
  },

  mobileMenuOpen: false,
  toggleMobileMenu: () => set(state => ({ mobileMenuOpen: !state.mobileMenuOpen })),
}));
```

**Verification**:

```bash
# Type check
npx tsc --noEmit
```

**Exit Criteria**:
- [ ] UI store hoạt động
- [ ] Sidebar toggle hoạt động
- [ ] Toast queue hoạt động
- [ ] Theme switch hoạt động

---

### Week 2: Auth & API

#### Task 1.5: NextAuth.js Setup (Day 5-6)

**Mục tiêu**: Setup NextAuth.js với credentials provider + RBAC

**Bước thực hiện**:

```typescript
// src/features/auth/providers/auth-provider.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        // TODO: Call backend API
        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
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
  },
  session: { strategy: 'jwt' },
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

**Tạo permissions utility**:

```typescript
// src/features/auth/utils/permissions.ts

type Permission =
  | 'dashboard:read'
  | 'bookings:read' | 'bookings:write' | 'bookings:delete'
  | 'leads:read' | 'leads:write' | 'leads:delete' | 'leads:assign'
  | 'posts:read' | 'posts:write' | 'posts:publish' | 'posts:delete'
  | 'landing_pages:read' | 'landing_pages:write' | 'landing_pages:publish' | 'landing_pages:delete'
  | 'users:read' | 'users:write' | 'users:delete'
  | 'settings:read' | 'settings:write';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: [/* full permissions */],
  EDITOR: ['posts:read', 'posts:write', 'posts:publish', 'landing_pages:read', 'landing_pages:write'],
  LAWYER: ['dashboard:read', 'bookings:read', 'bookings:write', 'leads:read'],
  CRM_STAFF: ['dashboard:read', 'bookings:read', 'bookings:write', 'leads:read', 'leads:write'],
  MARKETING: ['posts:read', 'posts:write', 'landing_pages:read', 'landing_pages:write'],
  VIEWER: ['dashboard:read'],
};

export function can(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes('*') || permissions.includes(permission);
}

export function usePermission(permission: Permission): boolean {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  return role ? can(role, permission) : false;
}
```

**Tạo middleware**:

```typescript
// src/middleware.ts
import { auth } from '@/features/auth/providers/auth-provider';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (!req.auth) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
```

**Verification**:

```bash
# Type check
npx tsc --noEmit
```

**Exit Criteria**:
- [ ] NextAuth.js handlers export được
- [ ] Login page hoạt động (mock)
- [ ] Middleware protect admin routes
- [ ] RBAC utility hoạt động

---

#### Task 1.6: Session Manager (Day 6)

**Mục tiêu**: Tạo unified session manager cho auth flow

**Bước thực hiện**:

```typescript
// src/lib/auth/session-manager.ts

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
};

class SessionManager {
  private static instance: SessionManager;
  private _listeners: Set<(state: AuthState) => void> = new Set();
  private _state: AuthState = {
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  };
  private _isRefreshing = false;
  private _refreshSubscribers: Array<(token: string) => void> = [];

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this._listeners.add(listener);
    listener(this._state);
    return () => this._listeners.delete(listener);
  }

  private _emit(state: Partial<AuthState>) {
    this._state = { ...this._state, ...state };
    this._listeners.forEach(listener => listener(this._state));
  }

  syncFromNextAuth(session: any, status: string) {
    if (status === 'loading') {
      this._emit({ isLoading: true });
      return;
    }
    if (status === 'authenticated' && session?.user) {
      this._emit({
        isAuthenticated: true,
        isLoading: false,
        user: session.user,
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

  async handleUnauthorized(): Promise<boolean> {
    if (this._isRefreshing) {
      return new Promise(resolve => {
        this._refreshSubscribers.push(resolve as any);
      });
    }

    this._isRefreshing = true;
    try {
      const response = await fetch('/api/auth/session', { method: 'POST' });
      const data = await response.json();
      if (data.accessToken) {
        this._refreshSubscribers.forEach(cb => cb(data.accessToken));
        this._refreshSubscribers = [];
        return true;
      }
      await this.logout();
      return false;
    } catch {
      await this.logout();
      return false;
    } finally {
      this._isRefreshing = false;
    }
  }

  async logout() {
    await fetch('/api/auth/signout', { method: 'POST' });
    this._emit({ isAuthenticated: false, isLoading: false, user: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}

export const sessionManager = SessionManager.getInstance();
```

**Exit Criteria**:
- [ ] SessionManager singleton hoạt động
- [ ] Sync với NextAuth session
- [ ] Token refresh logic

---

#### Task 1.7: API Client Setup (Day 7)

**Mục tiêu**: Tạo server/client axios clients

**Bước thực hiện**:

```typescript
// src/lib/api/client.ts
import axios from 'axios';
import { sessionManager } from '@/lib/auth/session-manager';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    if (error.response?.status === 401 && !config._retry) {
      config._retry = true;
      const refreshed = await sessionManager.handleUnauthorized();
      if (refreshed) {
        return apiClient(config);
      }
    }
    return Promise.reject(error);
  }
);
```

```typescript
// src/lib/api/server-client.ts
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
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
```

**Verification**:

```bash
npx tsc --noEmit
```

**Exit Criteria**:
- [ ] Client API interceptor hoạt động
- [ ] Server fetch có Bearer token
- [ ] 401 handling qua session manager

---

#### Task 1.8: Error Boundaries (Day 8-9)

**Mục tiêu**: Tạo error boundary hierarchy

**Bước thực hiện**:

```typescript
// src/app/error.tsx
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
    Sentry.captureException(error, { extra: { digest: error.digest } });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Đã xảy ra lỗi</h1>
        <p className="text-gray-600 mb-6">
          Chúng tôi đã ghi nhận lỗi này và sẽ khắc phục sớm nhất có thể.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />Thử lại
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            <Home className="w-4 h-4 mr-2" />Về trang chủ
          </Button>
        </div>
        {error.digest && <p className="mt-4 text-xs text-gray-400">Error ID: {error.digest}</p>}
      </div>
    </div>
  );
}
```

**Tạo feature error boundaries**:

```typescript
// src/features/booking/components/booking-error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class BookingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
          <h3 className="font-medium text-red-800">Đặt lịch tạm thời gián đoạn</h3>
          <p className="text-sm text-red-600 mt-1">Vui lòng thử lại trong giây lát.</p>
          <Button onClick={() => this.setState({ hasError: false })} variant="outline" size="sm" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />Thử lại
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Exit Criteria**:
- [ ] Root error boundary hoạt động
- [ ] Sentry integration hoạt động
- [ ] Feature error boundaries hoạt động
- [ ] Fallback UI hiển thị đúng

---

#### Task 1.9: Testing Setup (Day 9-10)

**Mục tiêu**: Setup Vitest + MSW + Playwright

**Bước thực hiện**:

```bash
# Install testing dependencies
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
npm install -D msw @tanstack/react-query-devtools
npm install -D @playwright/test
npx playwright install chromium
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';

// MSW setup
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```typescript
// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { bookingHandlers } from './handlers/booking';

export const server = setupServer(...authHandlers, ...bookingHandlers);
```

**Tạo base test utilities**:

```typescript
// tests/utils.ts
import { render, screen, waitFor } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(ui: ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}
```

**Exit Criteria**:
- [ ] Vitest chạy được
- [ ] MSW mocks hoạt động
- [ ] Playwright browser install được
- [ ] Base test utilities hoạt động

---

## Parallel Workstreams

```
Week 1:
├── Task 1.1 (Day 1-2) ─────────────────────────────────────────────────┐
├── Task 1.2 (Day 2-3) ─────────────────────────────────────────────┤
├── Task 1.3 (Day 3) ────────────────────────────────────────────────┤
├── Task 1.4 (Day 3-4) ─────────────────────────────────────────────┤
└────────────────────────────────────────────────────────────────────┘

Week 2:
├── Task 1.5 (Day 5-6) ─────────────────────────────────────────────┐
├── Task 1.6 (Day 6) ──────────────────────────────────────────────┤
├── Task 1.7 (Day 7) ──────────────────────────────────────────────┤
├── Task 1.8 (Day 8-9) ───────────────────────────────────────────┤
└── Task 1.9 (Day 9-10) ──────────────────────────────────────────┘
```

---

## Exit Criteria Summary

### Must Have (Ship Criteria)

- [ ] Next.js 15 app chạy với TypeScript
- [ ] Tailwind CSS + shadcn/ui hoạt động
- [ ] Design tokens (ICRC Law branding) apply được
- [ ] Zustand UI store hoạt động (sidebar, modal, toast)
- [ ] NextAuth.js với credentials provider (mock backend)
- [ ] RBAC permission system hoạt động
- [ ] Session Manager singleton
- [ ] API client với token refresh
- [ ] Error boundaries với Sentry
- [ ] Vitest + MSW setup

### Nice to Have

- [ ] Storybook stories cho shared components
- [ ] Playwright smoke tests
- [ ] Dark mode support

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| :- | :- | :- | :- |
| NextAuth v5 breaking changes | MEDIUM | HIGH | Pin version, check changelog |
| shadcn/ui với Tailwind v4 compatibility | LOW | MEDIUM | Check shadcn docs |
| MSW v2 API changes | LOW | LOW | Use stable APIs |
| Sentry Next.js integration complexity | MEDIUM | MEDIUM | Follow official docs |

---

## Dependencies

```
Task 1.1 (Project Setup)
└── Task 1.2 (Directory Structure) [parallel]
    └── Task 1.3 (Design System) [parallel]
        └── Task 1.4 (UI Store) [sequential]
            └── Task 1.5 (NextAuth) [sequential]
                ├── Task 1.6 (Session Manager) [sequential]
                │   └── Task 1.7 (API Client) [sequential]
                └── Task 1.8 (Error Boundaries) [parallel]
                    └── Task 1.9 (Testing) [parallel]
```

---

## Verification Commands

```bash
# Tất cả verification commands cho Phase 1

# 1. Build test
npm run build

# 2. Type check
npx tsc --noEmit

# 3. Lint check
npm run lint

# 4. Vitest tests
npm run test

# 5. Playwright tests
npx playwright test

# 6. Storybook (nếu có)
npm run storybook
```

---

*Phase 1 Plan v1.0 — Created: May 2026*
