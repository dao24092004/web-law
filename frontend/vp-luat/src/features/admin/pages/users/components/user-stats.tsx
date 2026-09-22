'use client';

import { UserCog, Users, Lock, ShieldCheck, Mail, UserPlus } from 'lucide-react';

interface UserStatsProps {
  total: number;
  active: number;
  inactive: number;
  byRole: {
    SUPER_ADMIN: number;
    ADMIN: number;
    EDITOR: number;
    CSKH: number;
    LAWYER: number;
    USER: number;
  };
}

interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}

function StatBox({ icon, label, value, color, bg }: StatBoxProps) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--gray-200)',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: bg,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{label}</div>
      </div>
    </div>
  );
}

export function UserStats({ total, active, inactive, byRole }: UserStatsProps) {
  const lawyers = byRole.LAWYER ?? 0;
  const admins = (byRole.SUPER_ADMIN ?? 0) + (byRole.ADMIN ?? 0);
  const editors = byRole.EDITOR ?? 0;
  const cskh = byRole.CSKH ?? 0;
  const customers = byRole.USER ?? 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 8,
        marginBottom: 12,
      }}
    >
      <StatBox
        icon={<Users size={18} strokeWidth={2.2} />}
        label="Tổng người dùng"
        value={total}
        color="var(--primary, #1E3A5F)"
        bg="var(--primary-faint, #EFF3F8)"
      />
      <StatBox
        icon={<ShieldCheck size={18} strokeWidth={2.2} />}
        label="Đang hoạt động"
        value={active}
        color="var(--success, #10B981)"
        bg="var(--success-faint, #D1FAE5)"
      />
      <StatBox
        icon={<Lock size={18} strokeWidth={2.2} />}
        label="Bị khóa"
        value={inactive}
        color="var(--danger, #DC2626)"
        bg="var(--danger-faint, #FEE2E2)"
      />
      <StatBox
        icon={<UserCog size={18} strokeWidth={2.2} />}
        label="Admin / Super"
        value={admins}
        color="var(--blue, #2563EB)"
        bg="#DBEAFE"
      />
      <StatBox
        icon={<UserPlus size={18} strokeWidth={2.2} />}
        label="Luật sư"
        value={lawyers}
        color="var(--purple, #7C3AED)"
        bg="var(--purple-faint, #F3E8FF)"
      />
      <StatBox
        icon={<Mail size={18} strokeWidth={2.2} />}
        label="Khách hàng"
        value={customers}
        color="var(--warning, #D97706)"
        bg="var(--warning-faint, #FEF3C7)"
      />
      <StatBox
        icon={<Users size={18} strokeWidth={2.2} />}
        label="Editor + CSKH"
        value={editors + cskh}
        color="var(--orange, #EA580C)"
        bg="#FED7AA"
      />
    </div>
  );
}
