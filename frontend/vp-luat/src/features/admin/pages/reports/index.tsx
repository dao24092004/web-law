'use client';

import { useState, useMemo } from 'react';
import { Download, Users, DollarSign, BarChart3 } from 'lucide-react';
import { AdminPageHeader } from '@/features/admin/shared';
import type { DonutSegment } from '@/features/admin/types';
import { useApiQuery } from '@/lib/api/hooks';
import { backendDateToISO } from '@/lib/api/admin-dashboard';
import type { TimeSeriesPoint, DistributionSlice } from '@/lib/api/admin-dashboard';

const RANGE_OPTIONS = [
  { value: 'week', label: '7 ngay' },
  { value: 'month', label: '30 ngay' },
  { value: 'quarter', label: '90 ngay' },
  { value: 'year', label: '1 nam' },
];

const COLORS = [
  '#1E3A5F', '#2563EB', '#7C3AED', '#10B981', '#F59E0B',
  '#DC2626', '#06B6D4', '#8B5CF6', '#84CC16', '#F97316',
];

type ReportTab = 'revenue' | 'lawyer' | 'services';

export default function ReportsPage() {
  const [range, setRange] = useState('month');
  const [tab, setTab] = useState<ReportTab>('revenue');

  const { data: revenueData, isLoading: revLoading } = useApiQuery<TimeSeriesPoint[]>(
    ['admin', 'reports', 'revenue', range],
    '/admin/reports/revenue',
    { range, groupBy: 'day' },
    { retry: false },
  );

  const { data: serviceData, isLoading: svcLoading } = useApiQuery<DistributionSlice[]>(
    ['admin', 'reports', 'service-trends', range],
    '/admin/reports/service-trends',
    { range },
    { retry: false },
  );

  const { data: conversionData } = useApiQuery<{
    total?: number;
    contacted?: number;
    qualified?: number;
    converted?: number;
  }>(
    ['admin', 'reports', 'conversion', range],
    '/admin/reports/conversion',
    { range },
    { retry: false },
  );

  const { data: lawyerData, isLoading: lawLoading } = useApiQuery<Array<Record<string, unknown>>>(
    ['admin', 'reports', 'lawyer-performance'],
    '/admin/reports/lawyer-performance',
    {},
    { retry: false },
  );

  // Build chart labels from revenue data
  const chartLabels = useMemo(() => {
    if (!revenueData) return [];
    return revenueData.map((p) => backendDateToISO(p.date));
  }, [revenueData]);

  const chartValues = useMemo(() => {
    if (!revenueData) return [];
    return revenueData.map((p) => p.value);
  }, [revenueData]);

  // Build donut segments from service data
  const donutSegments = useMemo((): DonutSegment[] => {
    if (!serviceData) return [];
    return serviceData.map((svc, i) => ({
      label: svc.label,
      value: svc.count,
      percentage: svc.percentage,
      color: COLORS[i % COLORS.length],
    }));
  }, [serviceData]);

  return (
    <div className="admin-view">
      <AdminPageHeader
        title="Bao cao"
        subtitle="Phan tich hieu suat kinh doanh va bao cao chi tiet"
        actions={
          <button
            type="button"
            className="action-btn"
            onClick={() => {
              window.open(
                'http://localhost:8080/api/admin/reports/export/revenue?range=' + range,
                '_blank',
              );
            }}
          >
            <Download size={12} /> Export CSV
          </button>
        }
      />

      {/* Range selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={range === opt.value ? 'action-btn action-btn--primary' : 'action-btn'}
            style={{ fontSize: '0.8rem' }}
            onClick={() => setRange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[
          { key: 'revenue' as ReportTab, label: 'Doanh thu', icon: DollarSign },
          { key: 'lawyer' as ReportTab, label: 'Luat su', icon: Users },
          { key: 'services' as ReportTab, label: 'Dich vu', icon: BarChart3 },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? 'action-btn action-btn--primary' : 'action-btn'}
            onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Revenue Tab */}
      {tab === 'revenue' && (
        <div>
          {/* Funnel summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
            <FunnelCard label="Tong lead" value={conversionData?.total || 0} color="var(--primary)" />
            <FunnelCard label="Da lien he" value={conversionData?.contacted || 0} color="#2563EB" />
            <FunnelCard label="Duyet ho" value={conversionData?.qualified || 0} color="#7C3AED" />
            <FunnelCard label="Chuyen doi" value={conversionData?.converted || 0} color="var(--success)" />
          </div>

          {/* Revenue chart placeholder */}
          <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Doanh thu theo thoi gian</div>
            {revLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Dang tai...</div>
            ) : chartValues.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chartValues.slice(0, 10).map((val, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 100, fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {chartLabels[idx] || ''}
                    </span>
                    <div style={{ flex: 1, height: 20, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: (val / Math.max(...chartValues) * 100) + '%',
                        height: '100%',
                        background: 'var(--primary)',
                        borderRadius: 4,
                      }} />
                    </div>
                    <span style={{ width: 80, fontSize: '0.8rem', fontWeight: 600, textAlign: 'right' }}>
                      {val.toLocaleString('vi-VN')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                Chua co du lieu doanh thu
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lawyer Tab */}
      {tab === 'lawyer' && (
        <div>
          {lawLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Dang tai...</div>
          ) : lawyerData && lawyerData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lawyerData.map((lawyer, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'white',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 8,
                    padding: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--primary-faint, #EFF3F8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: 'var(--primary)',
                  }}>
                    {String(lawyer.name || 'LS').charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{String(lawyer.name || 'Unknown')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{String(lawyer.email || '')}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{String(lawyer.totalAppointments ?? 0)}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--gray-500)' }}>Cuoc hen</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)' }}>{String(lawyer.completedAppointments ?? 0)}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--gray-500)' }}>Hoan thanh</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--warning)' }}>{String(lawyer.cancelledAppointments ?? 0)}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--gray-500)' }}>Huy bo</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
              Chua co du lieu luat su
            </div>
          )}
        </div>
      )}

      {/* Services Tab */}
      {tab === 'services' && (
        <div>
          {svcLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Dang tai...</div>
          ) : donutSegments.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Service donut */}
              <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Xu huong dich vu</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ width: 160, height: 160 }}>
                    <DonutChart segments={donutSegments} size={160} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {donutSegments.map((seg, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)', flex: 1 }}>{seg.label}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>{seg.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Service table */}
              <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Chi tiet dich vu</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(serviceData || []).map((svc, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{svc.label}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--gray-500)' }}>
                          {svc.count} yeu cau ({svc.percentage.toFixed(1)}%)
                        </div>
                      </div>
                      <div style={{ width: 100, height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          width: svc.percentage + '%',
                          height: '100%',
                          background: COLORS[idx % COLORS.length],
                          borderRadius: 4,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
              Chua co du lieu dich vu
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DonutChart({ segments, size = 160 }: { segments: DonutSegment[]; size?: number }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  // Guard against degenerate input (empty segments or all-zero values) — the
  // SVG arc math below divides by `total`, so a zero total would emit NaN
  // coordinates and React would log a warning about non-finite attributes.
  if (total <= 0 || segments.length === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 10} fill="var(--gray-100)" />
        <circle cx={size / 2} cy={size / 2} r={size * 0.25} fill="white" />
      </svg>
    );
  }

  // Pre-compute the cumulative angles up-front so the JSX render is a pure
  // projection. Mutating a `let` inside `.map` worked, but it made the
  // component harder to reason about and tripped up Strict-Mode double
  // rendering on data with zero-value segments.
  const radius = size / 2 - 10;
  const slices = segments.reduce<
    Array<{ segment: DonutSegment; startAngle: number; endAngle: number; angle: number }>
  >((acc, segment, i) => {
    const angle = (segment.value / total) * 360;
    const startAngle = i === 0 ? -90 : acc[i - 1].endAngle;
    acc.push({ segment, startAngle, endAngle: startAngle + angle, angle });
    return acc;
  }, []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map(({ segment, startAngle, endAngle, angle }, i) => {
        // Skip degenerate slices (zero-value segments) — they collapse to a
        // single point and just add visual noise.
        if (angle === 0) return null;

        const x1 = size / 2 + radius * Math.cos((startAngle * Math.PI) / 180);
        const y1 = size / 2 + radius * Math.sin((startAngle * Math.PI) / 180);
        const x2 = size / 2 + radius * Math.cos((endAngle * Math.PI) / 180);
        const y2 = size / 2 + radius * Math.sin((endAngle * Math.PI) / 180);

        const largeArc = angle > 180 ? 1 : 0;
        const pathD = `M ${size / 2} ${size / 2} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

        return <path key={i} d={pathD} fill={segment.color} />;
      })}
      <circle cx={size / 2} cy={size / 2} r={size * 0.25} fill="white" />
    </svg>
  );
}

function FunnelCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8,
      padding: 16, textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
