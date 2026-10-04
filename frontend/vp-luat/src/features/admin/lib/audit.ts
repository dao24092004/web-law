/**
 * Audit log helper.
 *
 * Backend already writes authoritative audit entries for every state-changing
 * admin endpoint. This hook is a best-effort client-side breadcrumb so the
 * admin UI's "Recent Activity" panel can still show a quick feedback line
 * even if the network request to /admin/audit-logs is slow. We never block
 * the calling code on the request.
 */

'use client';

import { getCurrentUser } from './rbac';

export type AuditAction =
  | 'create' | 'update' | 'delete' | 'status_change' | 'login' | 'logout'
  | 'impersonate' | 'assign' | 'publish' | 'unpublish' | 'send' | 'export' | 'restore' | 'cancel' | 'close';

export interface AuditInput {
  action: AuditAction;
  entity: string;
  entityId: string;
  entityLabel?: string;
  diff?: { before: Record<string, unknown>; after: Record<string, unknown> };
}

const PENDING: Array<AuditInput & { actorId: string; actorName: string; createdAt: string }> = [];

function persist(input: AuditInput): void {
  if (typeof window === 'undefined') return;
  const user = getCurrentUser();
  const entry = {
    ...input,
    actorId: user?.id ?? 'system',
    actorName: user?.name ?? user?.email ?? 'System',
    createdAt: new Date().toISOString(),
  };
  try {
    const key = 'vp-luat-audit-pending';
    const raw = window.localStorage.getItem(key);
    const arr = raw ? (JSON.parse(raw) as typeof PENDING) : [];
    arr.push(entry);
    // cap at 200 to keep localStorage small
    if (arr.length > 200) arr.splice(0, arr.length - 200);
    window.localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    // localStorage may be unavailable; swallow.
  }
}

export function ghiAudit(input: AuditInput): void {
  persist(input);
}

/** Drain the locally-buffered entries — currently unused but exposed so an
 *  admin tool can flush them via the backend audit endpoint when one ships. */
export function drainPendingAudit(): Array<AuditInput & { actorId: string; actorName: string; createdAt: string }> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('vp-luat-audit-pending');
    if (!raw) return [];
    window.localStorage.removeItem('vp-luat-audit-pending');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}