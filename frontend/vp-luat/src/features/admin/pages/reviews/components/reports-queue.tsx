'use client';

import { useState, useMemo } from 'react';
import { Flag, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { DataTableV2, type DataTableColumn } from '@/features/admin/components';
import { StatusBadge, type StatusVariant, Modal } from '@/features/admin/shared';
import type { ReviewReport, Review } from '../hooks/use-reviews';
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS } from '../hooks/use-reviews';

interface ReportsQueueProps {
  reports: ReviewReport[];
  reviews: Review[];
  onOpenReview: (review: Review) => void;
  onResolve: (
    reportId: string,
    action: 'delete_review' | 'reject_review' | 'dismiss_report',
    note?: string,
  ) => void;
}

type ReportStatus = 'pending' | 'resolved' | 'dismissed';

const STATUS_VARIANT: Record<ReportStatus, StatusVariant> = {
  pending: 'yellow',
  resolved: 'green',
  dismissed: 'gray',
};

const RESOLVE_OPTIONS: Array<{
  value: 'delete_review' | 'reject_review' | 'dismiss_report';
  label: string;
  variant: 'danger' | 'warning' | 'default';
  description: string;
}> = [
  {
    value: 'delete_review',
    label: 'Xóa đánh giá',
    variant: 'danger',
    description: 'Xóa hoàn toàn đánh giá + đóng báo cáo',
  },
  {
    value: 'reject_review',
    label: 'Từ chối đánh giá',
    variant: 'warning',
    description: 'Đánh dấu đánh giá rejected (không hiển thị public)',
  },
  {
    value: 'dismiss_report',
    label: 'Bỏ qua báo cáo',
    variant: 'default',
    description: 'Báo cáo sai, giữ nguyên đánh giá',
  },
];

export function ReportsQueue({
  reports,
  reviews,
  onOpenReview,
  onResolve,
}: ReportsQueueProps) {
  const reviewMap = useMemo(() => {
    const m = new Map<string, Review>();
    reviews.forEach((r) => m.set(r.id, r));
    return m;
  }, [reviews]);

  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('pending');
  const [resolveModal, setResolveModal] = useState<{
    report: ReviewReport;
    action: 'delete_review' | 'reject_review' | 'dismiss_report';
  } | null>(null);
  const [note, setNote] = useState('');

  const filtered = useMemo(
    () => (statusFilter === 'all' ? reports : reports.filter((r) => r.status === statusFilter)),
    [reports, statusFilter],
  );

  const counts = useMemo(() => {
    const c = { all: reports.length, pending: 0, resolved: 0, dismissed: 0 };
    for (const r of reports) {
      c[r.status] += 1;
    }
    return c;
  }, [reports]);

  const columns: DataTableColumn<ReviewReport>[] = [
    {
      key: 'reason',
      header: 'Lý do',
      width: 160,
      cell: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Flag size={12} color="var(--warning, #D97706)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>
            {REPORT_REASON_LABELS[r.reason] ?? r.reason}
          </span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Mô tả',
      cell: (r) => (
        <div style={{ maxWidth: 260 }}>
          {r.description ? (
            <p
              style={{
                margin: 0,
                fontSize: '0.78rem',
                color: 'var(--gray-700)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
              title={r.description}
            >
              {r.description}
            </p>
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>—</span>
          )}
        </div>
      ),
    },
    {
      key: 'review',
      header: 'Đánh giá bị report',
      cell: (r) => {
        const rev = reviewMap.get(r.reviewId);
        if (!rev) {
          return (
            <span style={{ fontSize: '0.72rem', color: 'var(--danger, #DC2626)' }}>
              Đã xóa ({r.reviewId})
            </span>
          );
        }
        return (
          <div style={{ maxWidth: 260 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-700)' }}>
              {rev.authorName}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '0.7rem',
                color: 'var(--gray-500)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
              title={rev.content}
            >
              &ldquo;{rev.content}&rdquo;
            </p>
          </div>
        );
      },
    },
    {
      key: 'reporter',
      header: 'Người báo cáo',
      cell: (r) => (
        <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>
          {r.reportedByName ?? 'Ẩn danh'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'TT',
      width: 110,
      cell: (r) => (
        <StatusBadge variant={STATUS_VARIANT[r.status]} label={REPORT_STATUS_LABELS[r.status]} />
      ),
    },
    {
      key: 'date',
      header: 'Ngày',
      width: 90,
      cell: (r) => (
        <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
          {new Date(r.createdAt).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 90,
      cell: (r) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {reviewMap.get(r.reviewId) && (
            <button
              type="button"
              className="action-btn"
              style={{ padding: '4px 6px' }}
              title="Xem đánh giá"
              onClick={() => {
                const rev = reviewMap.get(r.reviewId);
                if (rev) onOpenReview(rev);
              }}
            >
              <Eye size={11} />
            </button>
          )}
          {r.status === 'pending' && (
            <button
              type="button"
              className="action-btn action-btn--primary"
              style={{ padding: '4px 6px', fontSize: '0.68rem' }}
              onClick={() => setResolveModal({ report: r, action: 'dismiss_report' })}
            >
              Xử lý
            </button>
          )}
        </div>
      ),
    },
  ];

  const openResolve = (
    report: ReviewReport,
    action: 'delete_review' | 'reject_review' | 'dismiss_report',
  ) => {
    setResolveModal({ report, action });
    setNote('');
  };

  const handleConfirm = () => {
    if (!resolveModal) return;
    onResolve(resolveModal.report.id, resolveModal.action, note);
    setResolveModal(null);
    setNote('');
  };

  const selectedOption = resolveModal
    ? RESOLVE_OPTIONS.find((o) => o.value === resolveModal.action) ?? null
    : null;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        {(['all', 'pending', 'resolved', 'dismissed'] as const).map((s) => {
          const labelMap: Record<typeof s, string> = {
            all: 'Tất cả',
            pending: 'Chờ xử lý',
            resolved: 'Đã xử lý',
            dismissed: 'Bỏ qua',
          };
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`filter-tab ${isActive ? 'filter-tab--active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {s === 'pending' && <Clock size={11} />}
              {s === 'resolved' && <CheckCircle size={11} />}
              {s === 'dismissed' && <XCircle size={11} />}
              {labelMap[s]}{' '}
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--gray-100)',
                  borderRadius: 999,
                }}
              >
                {counts[s]}
              </span>
            </button>
          );
        })}
      </div>

      <DataTableV2<ReviewReport>
        columns={columns}
        data={filtered}
        rowKey={(r) => r.id}
        emptyTitle="Không có báo cáo nào"
        emptyDescription="Khi có người báo cáo đánh giá, báo cáo sẽ xuất hiện tại đây."
      />

      <Modal
        isOpen={Boolean(resolveModal)}
        onClose={() => setResolveModal(null)}
        title="Xử lý báo cáo"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="action-btn"
              onClick={() => setResolveModal(null)}
            >
              Hủy
            </button>
            <button
              type="button"
              className={`action-btn ${
                selectedOption?.variant === 'danger'
                  ? 'action-btn--danger'
                  : selectedOption?.variant === 'warning'
                    ? 'action-btn--primary'
                    : 'action-btn--primary'
              }`}
              onClick={handleConfirm}
            >
              Xác nhận
            </button>
          </>
        }
      >
        {resolveModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                padding: 12,
                background: 'var(--gray-50)',
                borderRadius: 8,
                fontSize: '0.8rem',
              }}
            >
              <div style={{ marginBottom: 6 }}>
                <strong>Lý do:</strong> {REPORT_REASON_LABELS[resolveModal.report.reason]}
              </div>
              {resolveModal.report.description && (
                <div style={{ color: 'var(--gray-600)' }}>
                  {resolveModal.report.description}
                </div>
              )}
            </div>

            <div>
              <label
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--gray-700)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Hành động
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {RESOLVE_OPTIONS.map((opt) => {
                  const isActive = resolveModal.action === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setResolveModal({ ...resolveModal, action: opt.value })
                      }
                      style={{
                        textAlign: 'left',
                        padding: 10,
                        border: isActive
                          ? '2px solid var(--primary)'
                          : '1px solid var(--gray-200)',
                        background: isActive ? 'var(--primary-faint, #EFF3F8)' : 'white',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--gray-800)',
                        }}
                      >
                        {opt.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                        {opt.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--gray-700)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Ghi chú (tuỳ chọn)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Lý do xử lý..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1.5px solid var(--gray-200)',
                  borderRadius: 6,
                  fontSize: '0.8rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}