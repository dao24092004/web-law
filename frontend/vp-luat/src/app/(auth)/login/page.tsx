'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Lock, Mail, Scale, ShieldCheck, Phone, MapPin } from 'lucide-react';
import { getDashboardPath } from '@/features/auth/utils/permissions';
import type { Role } from '@/features/auth/utils/permissions';

// Map of every NextAuth error code we want to surface in Vietnamese.
// Anything else falls back to the generic message.
const NEXTAUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'invalid_credentials',
  SessionRequired: 'sessionRequired',
  AccessDenied: 'accessDenied',
  Verification: 'verification',
  Configuration: 'configuration',
  OAuthSignin: 'oauthSignin',
  OAuthCallback: 'oauthCallback',
  OAuthCreateAccount: 'oauthCreateAccount',
  EmailCreateAccount: 'emailCreateAccount',
  Callback: 'callback',
  OAuthAccountNotLinked: 'oauthAccountNotLinked',
  EmailSignin: 'emailSignin',
  SessionError: 'sessionError',
  default: 'login_failed',
};

function LoginForm() {
  const router = useRouter();
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const messageKey = NEXTAUTH_ERROR_MESSAGES[errorParam];
      setError(messageKey ? t(messageKey) : t('errorWithCode', { code: errorParam }));
    }
  }, [searchParams]);

  // Restore the "remember me" preference so the checkbox survives a reload.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setRemember(window.localStorage.getItem('vp-luat-login-remember') === '1');
    } catch {
      // ignore
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string) ?? '';
    const password = (formData.get('password') as string) ?? '';
    const remember = formData.get('remember') === 'on';

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        const message =
          result?.error && NEXTAUTH_ERROR_MESSAGES[result.error]
            ? NEXTAUTH_ERROR_MESSAGES[result.error]
            : NEXTAUTH_ERROR_MESSAGES.default;
        setError(t(message));
        setIsLoading(false);
        return;
      }

      if (result.ok) {
        // Persist "remember-me" preference across tabs/sessions. The actual
        // session lifetime is controlled by the backend cookie; we just store
        // a UI hint so the checkbox stays checked on reload.
        if (typeof window !== 'undefined') {
          try {
            if (remember) {
              window.localStorage.setItem('vp-luat-login-remember', '1');
            } else {
              window.localStorage.removeItem('vp-luat-login-remember');
            }
          } catch {
            // ignore (storage may be unavailable in private mode)
          }
        }

        // Fetch session to get user role
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        const userRole = (sessionData?.user?.role as Role) ?? 'VIEWER';

        // Clear stale sessionStorage data from previous sessions (admin/staff confusion).
        // The main user cache now lives in sessionStorage (per-tab) via rbac.tsx.
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.removeItem('admin-impersonated-user');
            window.sessionStorage.removeItem('vp-luat-admin-current-user');
          } catch {
            // ignore
          }
        }

        // Determine redirect path based on role
        let redirectPath = callbackUrl;
        if (callbackUrl === '/' || callbackUrl === '/login') {
          redirectPath = getDashboardPath(userRole);
        }

        router.push(redirectPath);
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('unexpectedError'));
      setIsLoading(false);
    }
  }

  async function handleSocialSignIn(provider: 'google' | 'facebook') {
    setIsLoading(true);
    try {
      // Determine callback URL based on stored role hint (best effort)
      await signIn(provider, { callbackUrl: '/' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[var(--primary-faint)]">
      {/* Left: Image + Branding */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-25 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=80&auto=format&fit=crop')",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/85 to-[var(--primary-dark)]/95" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
            <Scale size={24} />
          </div>
          <div>
            <div className="font-heading text-xl font-bold">ICRC Law</div>
            <div className="text-xs text-white/70">{t('system')}</div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="font-heading text-4xl font-bold leading-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-md">
            {t('heroDescription')}
          </p>

          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-[var(--accent)]" />
              {t('security')}
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-[var(--accent)]" />
              {t('support')}: <a href="tel:0969967389" className="underline">0969 967 389 - 0975 967 364</a>
            </li>
            <li className="flex items-center gap-3">
              <MapPin size={18} className="text-[var(--accent)]" />
              {t('office')}
            </li>
          </ul>
        </div>

        <div className="relative z-10 text-xs text-white/60">
          © 2024 ICRC Law · Bảo lưu mọi quyền
        </div>
      </aside>

      {/* Right: Form */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-heading font-bold text-[var(--primary)]">
              ICRC Law
            </h1>
            <p className="text-gray-600 mt-1 text-sm">{t('system')}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100">
            <header className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Đăng nhập</h2>
              <p className="text-sm text-gray-500 mt-1">{t('welcome')}</p>
            </header>

            {error && (
              <div
                role="alert"
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@luathung.vn"
                    required
                    autoComplete="email"
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[var(--primary)] hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={t('passwordPlaceholder')}
                    required
                    autoComplete="current-password"
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                {t('remember')}
              </label>

              <Button
                type="submit"
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] h-11 text-base"
                disabled={isLoading}
              >
                {isLoading ? t('loggingIn') : t('login')}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-white px-3 text-gray-400">{t('or')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => handleSocialSignIn('google')}
                className="h-11"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => handleSocialSignIn('facebook')}
                className="h-11"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99C18.34 21.13 22 16.99 22 12z" />
                </svg>
                Facebook
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            {t('noAccount')}{' '}
            <Link href="/contact" className="text-[var(--primary)] hover:underline font-medium">
              {t('contactAdmin')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
