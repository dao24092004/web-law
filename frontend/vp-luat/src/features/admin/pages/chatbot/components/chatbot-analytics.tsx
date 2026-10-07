'use client';

import { useMemo } from 'react';
import { MessageCircle, Hand, Clock, TrendingUp } from 'lucide-react';
import type { ChatbotSession, ChatbotIntent } from '@/features/admin/types';

interface ChatbotAnalyticsProps {
  sessions: ChatbotSession[];
  intents: ChatbotIntent[];
}

export function ChatbotAnalytics({ sessions, intents }: ChatbotAnalyticsProps) {
  const stats = useMemo(() => {
    const total = sessions.length;
    const handoffs = sessions.filter((s) => s.status === 'handoff' || Boolean(s.handoff)).length;
    const handoffRate = total > 0 ? handoffs / total : 0;
    const ended = sessions.filter(
      (s) => s.status === 'ended' || s.status === 'handoff' || s.status === 'abandoned',
    );
    const totalMs = ended.reduce((sum, s) => {
      if (!s.endedAt) return sum;
      return sum + (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime());
    }, 0);
    const avgMinutes = ended.length > 0 ? Math.round(totalMs / ended.length / 60000) : 0;
    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
    const avgMessages = total > 0 ? Math.round(totalMessages / total) : 0;
    return { total, handoffs, handoffRate, avgMinutes, avgMessages, totalMessages };
  }, [sessions]);

  const topIntents = useMemo(() => {
    const count: Record<string, number> = {};
    for (const s of sessions) {
      if (s.intent) count[s.intent] = (count[s.intent] ?? 0) + 1;
    }
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [sessions]);

  const intentMatch = useMemo(() => {
    return intents
      .map((i) => ({ name: i.name, count: i.matchCount }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [intents]);

  if (sessions.length === 0) {
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
        Chưa có dữ liệu để thống kê.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="admin-grid-4">
        <StatCard
          icon={<MessageCircle size={12} />}
          label="Tổng sessions"
          value={stats.total.toLocaleString('vi-VN')}
          sub={`${stats.totalMessages} tin nhắn`}
          color="var(--primary)"
        />
        <StatCard
          icon={<Hand size={12} />}
          label="Handoff rate"
          value={`${(stats.handoffRate * 100).toFixed(0)}%`}
          sub={`${stats.handoffs} sessions`}
          color="var(--blue, #2563EB)"
        />
        <StatCard
          icon={<Clock size={12} />}
          label="Thời lượng TB"
          value={`${stats.avgMinutes} phút`}
          sub={`${stats.avgMessages} tin/trò chuyện`}
          color="var(--warning, #D97706)"
        />
        <StatCard
          icon={<TrendingUp size={12} />}
          label="Intents active"
          value={`${intents.filter((i) => i.isActive).length}`}
          sub={`trên ${intents.length} tổng`}
          color="var(--success, #10B981)"
        />
      </div>

      {topIntents.length > 0 && <HorizontalBarChart title="Top intents theo sessions" data={topIntents} color="#1E3A5F" />}
      {intentMatch.length > 0 && <HorizontalBarChart title="Lượt match intent training" data={intentMatch} color="#2563EB" />}
    </div>
  );
}

function HorizontalBarChart({
  title,
  data,
  color,
}: {
  title: string;
  data: Array<{ name: string; count: number }>;
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div
      style={{
        padding: 14,
        background: 'white',
        border: '1px solid var(--gray-200)',
        borderRadius: 8,
      }}
    >
      <div
        style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--gray-800)',
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((d) => (
          <div
            key={d.name}
            style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', gap: 8, alignItems: 'center' }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--gray-700)',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={d.name}
            >
              {d.name}
            </div>
            <div
              style={{
                background: 'var(--gray-100)',
                borderRadius: 4,
                height: 18,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(d.count / max) * 100}%`,
                  height: '100%',
                  background: color,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--gray-600)',
                textAlign: 'right',
                fontWeight: 600,
              }}
            >
              {d.count.toLocaleString('vi-VN')}
            </div>
          </div>
        ))}
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
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.68rem', color: 'var(--gray-500)' }}>{sub}</div>
    </div>
  );
}