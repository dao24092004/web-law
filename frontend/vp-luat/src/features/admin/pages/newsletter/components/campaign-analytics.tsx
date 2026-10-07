'use client';

import { useMemo } from 'react';
import { Star, Send, FileText, Users } from 'lucide-react';
import { DonutChart } from '@/features/admin/shared';
import type { Campaign } from '@/features/admin/types';

interface CampaignAnalyticsProps {
  campaign: Campaign;
}

export function CampaignAnalytics({ campaign }: CampaignAnalyticsProps) {
  const stats = useMemo(() => {
    const total = campaign.recipientCount;
    const opens = Math.round(total * campaign.openRate);
    const clicks = Math.round(total * campaign.clickRate);
    const bounces = Math.round(total * campaign.bounceRate);
    const unsubs = Math.round(total * campaign.unsubRate);
    return { total, opens, clicks, bounces, unsubs };
  }, [campaign]);

  const openedChart = useMemo(
    () => [
      { label: 'Opened', value: campaign.openRate, percentage: campaign.openRate, color: '#10B981' },
      { label: 'Unopened', value: 1 - campaign.openRate, percentage: 1 - campaign.openRate, color: '#E5E7EB' },
    ] as Array<{ label: string; value: number; percentage: number; color: string }>,
    [campaign.openRate],
  );

  if (campaign.status !== 'sent') {
    return (
      <div
        style={{
          padding: 16,
          background: 'var(--gray-50)',
          borderRadius: 8,
          fontSize: '0.78rem',
          color: 'var(--gray-500)',
          textAlign: 'center',
        }}
      >
        Analytics chỉ khả dụng sau khi campaign được gửi. Trạng thái hiện tại:{' '}
        <strong>{campaign.status}</strong>.
      </div>
    );
  }

  return (
    <div className="admin-grid-4" style={{ marginBottom: 12 }}>
      <StatCard
        icon={<Send size={12} />}
        label="Open rate"
        value={`${(campaign.openRate * 100).toFixed(1)}%`}
        sub={`${stats.opens.toLocaleString('vi-VN')} lượt`}
        color="var(--success, #10B981)"
      />
      <StatCard
        icon={<Star size={12} />}
        label="Click rate"
        value={`${(campaign.clickRate * 100).toFixed(1)}%`}
        sub={`${stats.clicks.toLocaleString('vi-VN')} clicks`}
        color="var(--primary)"
      />
      <StatCard
        icon={<FileText size={12} />}
        label="Bounce"
        value={`${(campaign.bounceRate * 100).toFixed(2)}%`}
        sub={`${stats.bounces} bounces`}
        color="var(--warning, #D97706)"
      />
      <StatCard
        icon={<Users size={12} />}
        label="Unsub"
        value={`${(campaign.unsubRate * 100).toFixed(2)}%`}
        sub={`${stats.unsubs} hủy`}
        color="var(--danger, #DC2626)"
      />
      <div style={{ gridColumn: '1 / -1' }}>
        <DonutChart segments={openedChart} size={180} />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: 10,
        background: 'white',
        border: '1px solid var(--gray-200)',
        borderRadius: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: 'var(--gray-500)',
          fontSize: '0.7rem',
          marginBottom: 4,
        }}
      >
        {icon}
        {label}
      </div>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>
        {value}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--gray-500)' }}>{sub}</div>
    </div>
  );
}