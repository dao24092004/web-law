'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { notifySuccess } from '@/features/admin/lib';
import { ROLE_LABELS, type FrontendUserRole } from '../hooks/use-users';

interface ExportUsersButtonProps {
  users: Array<{
    id: string;
    fullName?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
    createdAt?: string;
    lastLoginAt?: string;
  }>;
}

/**
 * Quick CSV export of the current user list. Avoids hitting the backend
 * (which has no dedicated users export endpoint) by serialising on the
 * client. Includes role + active status + last login for triage.
 */
export function ExportUsersButton({ users }: ExportUsersButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleExport = async (format: 'csv' | 'json') => {
    setBusy(true);
    try {
      const fileName = `users-${new Date().toISOString().slice(0, 10)}.${format}`;
      let blob: Blob;
      if (format === 'csv') {
        const header = 'id,name,email,phone,role,isActive,createdAt,lastLoginAt\n';
        const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
        const rows = users
          .map((u) =>
            [
              escape(u.id),
              escape(u.fullName ?? u.name ?? ''),
              escape(u.email ?? ''),
              escape(u.phone ?? ''),
              escape(ROLE_LABELS[(u.role ?? 'USER') as FrontendUserRole] ?? u.role ?? ''),
              escape(u.isActive ? 'Hoạt động' : 'Bị khóa'),
              escape(u.createdAt ?? ''),
              escape(u.lastLoginAt ?? ''),
            ].join(','),
          )
          .join('\n');
        // UTF-8 BOM to preserve Vietnamese characters in Excel.
        const BOM = '\uFEFF';
        blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8' });
      } else {
        blob = new Blob([JSON.stringify(users, null, 2)], { type: 'application/json' });
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notifySuccess(`Đã export ${users.length} người dùng (${format.toUpperCase()})`, fileName);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        type="button"
        className="action-btn"
        disabled={busy || users.length === 0}
        onClick={() => handleExport('csv')}
        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        title="Xuất CSV (Excel)"
      >
        <FileSpreadsheet size={12} />
        CSV
      </button>
      <button
        type="button"
        className="action-btn"
        disabled={busy || users.length === 0}
        onClick={() => handleExport('json')}
        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        title="Xuất JSON"
      >
        <FileText size={12} />
        JSON
      </button>
    </div>
  );
}
