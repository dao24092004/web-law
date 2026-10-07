// Auth options for NextAuth v5
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { Role } from '../utils/permissions';
import { getPermissions } from '../utils/permissions';
import { setAuthToken } from '@/lib/api/client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// "Remember me" session lifetimes (seconds). When the user leaves the
// checkbox unticked we still want them to stay logged in for the rest of a
// normal workday without re-entering credentials, but the session should
// not linger for weeks on a shared/public machine. Ticking the box grants
// the long-lived 30-day session instead.
const DEFAULT_MAX_AGE = 60 * 60 * 24; // 1 day
const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
        remember: { type: 'text' },
      },
      async authorize(credentials: Record<string, unknown> | null) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Explicitly include credentials so the browser sends the new
            // HttpOnly cookie that the backend sets in the response.
            credentials: 'include',
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const result = await response.json();

          if (!result.success || !result.data?.user) {
            return null;
          }

          const data = result.data;
          const user = data.user;

          if (!user.isActive && !user.active) {
            throw new Error('Tai khoan da bi khoa');
          }

          // Store the access token for apiClient (this is fine — the access
          // token is short-lived, 15 minutes, and stored in memory + localStorage
          // as a fallback for hard refreshes).
          setAuthToken(data.accessToken);

          // The refresh token is now stored in an HttpOnly cookie by the backend.
          // DO NOT save it to localStorage — that would defeat the XSS protection.
          // The browser will attach the cookie automatically on subsequent requests.

          const role = (user.role || 'VIEWER') as Role;

          return {
            id: String(user.id ?? user.email ?? ''),
            email: user.email,
            name: user.fullName ?? user.name ?? user.email,
            role,
            permissions: getPermissions(role),
            accessToken: (data.accessToken ?? null) as string | null,
            // refreshToken intentionally omitted — it lives in the HttpOnly cookie.
            // "Remember me": carried through to the jwt() callback so it can
            // set a short- vs. long-lived token expiry (see SHORT/LONG below).
            rememberMe: credentials.remember === 'true' || credentials.remember === 'on',
          };
        } catch (error) {
          console.error('Login failed:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: Record<string, unknown>; user?: Record<string, unknown> }) {
      if (user) {
        token.id = String(user.id ?? '');
        token.role = (user.role as string) ?? 'VIEWER';
        token.permissions = (user.permissions as unknown[]) ?? [];
        token.accessToken = user.accessToken ?? null;
        // refreshToken no longer stored here — it is in the HttpOnly cookie.

        // "Remember me": give the session JWT a short or long expiry based on
        // the checkbox the user ticked at login. NextAuth v5 reads `exp`
        // directly off the token (seconds since epoch) and uses it both to
        // reject expired tokens and to size the session cookie's Max-Age, so
        // setting it here is enough — no extra cookie config needed.
        const remember = Boolean(user.rememberMe);
        token.rememberMe = remember;
        const maxAgeSeconds = remember ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE;
        token.exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
      }
      return token;
    },
    async session({ session, token }: { session: Record<string, unknown>; token: Record<string, unknown> }) {
      return {
        ...session,
        user: {
          ...(session.user as Record<string, unknown> | undefined),
          id: (token.id as string) ?? '',
          name: (token.name as string) ?? '',
          email: (token.email as string) ?? '',
          role: (token.role as string) ?? 'VIEWER',
          permissions: (token.permissions as unknown[]) ?? [],
          accessToken: (token.accessToken as string | null) ?? null,
          // refreshToken intentionally not exposed to the client — it is HttpOnly.
        },
      };
    },
    async authorized({ auth: sessionAuth, request: req }: { auth: unknown; request: { nextUrl: URL } }) {
      const { pathname } = req.nextUrl;
      const isLoggedIn = !!sessionAuth;
      const isOnAdmin = pathname.startsWith('/admin');
      const isOnLogin = pathname === '/login';

      if (isOnAdmin && !isLoggedIn) return false;
      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL('/admin', req.nextUrl));
      }
      return true;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  // Upper bound for the session cookie's Max-Age. The actual expiry used to
  // decide whether a token is valid is the per-login `token.exp` set in the
  // jwt() callback above (short-lived unless "remember me" was checked).
  session: { strategy: 'jwt' as const, maxAge: REMEMBER_ME_MAX_AGE },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: process.env.AUTH_TRUST_HOST === 'true' || process.env.NODE_ENV !== 'production',
} as Record<string, unknown>;

export const { handlers, auth, signIn, signOut } = NextAuth(
  authOptions as unknown as Parameters<typeof NextAuth>[0],
);
