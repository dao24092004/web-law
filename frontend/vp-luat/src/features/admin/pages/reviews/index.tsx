'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Star,
  Flag,
  Check,
  X as XIcon,
  Reply,
  MessageSquareWarning,
  Download,
} from 'lucide-react';
import {
  AdminPageHeader,
  SearchBar,
  FilterTabs,
  Pagination,
  ConfirmDialog,
} from '@/features/admin/shared';
import {
  useCan,
  notifySuccess,
  notifyError,
  exportToCSV,
} from '@/features/admin/lib';
import { ReviewsTable } from './components/reviews-table';
import { ReviewsRatingStats } from './components/reviews-rating-stats';
import { ReviewFilters, type ReviewFiltersValue } from './components/reviews-filters';
import { ReviewDetailDrawer } from './components/review-detail-drawer';
import { ReportsQueue } from './components/reports-queue';
import {
  useReviews,
  useRatingBreakdown,
  useReviewReports,
  REVIEW_STATUS_LABELS,
  type Review,
  type ReviewStatus,
  type ReviewReport,
} from './hooks/use-reviews';
import {
  useUpdateReviewStatus,
  useBulkUpdateReviews,
  useDeleteReview,
  useReplyReview,
  useResolveReport,
} from './hooks/use-review-mutations';
import type { ReplyFormValues } from '@/features/admin/schema';

type Tab = 'reviews' | 'reports';

const TABS: Array<{ value: Tab; label: string; icon: typeof Star }> = [
  { value: 'reviews', label: 'Đánh giá', icon: Star },
  { value: 'reports', label: 'Báo cáo vi phạm', icon: Flag },
];

const STATUS_TABS: Array<{ value: 'all' | ReviewStatus; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
];

export default function ReviewsPage() {
  const [tab, setTab] = useState<Tab>('reviews');
  const canRead = useCan('reviews.read');
  const canModerate = useCan('reviews.moderate');
  const canReply = useCan('reviews.reply');
  const canDelete = useCan('reviews.moderate');

  return (
    <div className="admin-view">
      <AdminPageHeader
        title="Đánh giá & Báo cáo"
        subtitle="Quản lý đánh giá khách hàng, phản hồi và báo cáo vi phạm"
      />

      <div className="filter-bar" role="tablist" style={{ marginBottom: 16 }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              className={`filter-tab ${tab === t.value ? 'filter-tab--active' : ''}`}
              onClick={() => setTab(t.value)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon size={12} />
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {!canRead ? (
        <div
          className="admin-card"
          style={{ padding: 32, textAlign: 'center', color: 'var(--gray-500)' }}
        >
          Bạn không có quyền xem module này.
        </div>
      ) : tab === 'reviews' ? (
        <ReviewsTab
          canModerate={canModerate}
          canReply={canReply}
          canDelete={canDelete}
        />
      ) : (
        <ReportsTab canModerate={canModerate} />
      )}
    </div>
  );
}

// ─── Tab 1: Reviews ─────────────────────────────────────────────────────
function ReviewsTab({
  canModerate,
  canReply,
  canDelete,
}: {
  canModerate: boolean;
  canReply: boolean;
  canDelete: boolean;
}) {
  const { data: reviews, counts, isLoading } = useReviews();
  const { breakdown, average, total } = useRatingBreakdown();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('all');
  const [filters, setFilters] = useState<ReviewFiltersValue>({
    rating: 'all',
    hasReply: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailReview, setDetailReview] = useState<Review | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Review | null>(null);
  const LIMIT = 15;

  const updateStatus = useUpdateReviewStatus();
  const bulkUpdate = useBulkUpdateReviews();
  const removeReview = useDeleteReview();
  const replyReview = useReplyReview();

  const tabsWithCounts = STATUS_TABS.map((t) => ({
    value: t.value,
    label: t.label,
    count: t.value === 'all' ? counts.total : counts[t.value as keyof typeof counts],
  }));

  const serviceList = useMemo(
    () => Array.from(new Set(reviews.map((r) => r.service).filter(Boolean) as string[])).sort(),
    [reviews],
  );

  const filtered = useMemo(() => {
    let r = reviews;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (rev) =>
          rev.authorName.toLowerCase().includes(q) ||
          (rev.authorEmail ?? '').toLowerCase().includes(q) ||
          (rev.service ?? '').toLowerCase().includes(q) ||
          rev.content.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') r = r.filter((rev) => rev.status === statusFilter);
    if (filters.rating !== 'all') r = r.filter((rev) => rev.rating === Number(filters.rating));
    if (filters.hasReply === 'yes') r = r.filter((rev) => Boolean(rev.reply));
    if (filters.hasReply === 'no') r = r.filter((rev) => !rev.reply);
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      r = r.filter((rev) => new Date(rev.createdAt).getTime() >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime() + 24 * 60 * 60 * 1000;
      r = r.filter((rev) => new Date(rev.createdAt).getTime() <= to);
    }
    return r;
  }, [reviews, search, statusFilter, filters]);

  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const handleApprove = useCallback(
    async (r: Review) => {
      try {
        await updateStatus(r.id, 'approved');
        notifySuccess(`Đã duyệt đánh giá của ${r.authorName}`);
      } catch (e) {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể duyệt');
      }
    },
    [updateStatus],
  );

  const handleReject = useCallback(
    async (r: Review) => {
      try {
        await updateStatus(r.id, 'rejected');
        notifySuccess(`Đã từ chối đánh giá của ${r.authorName}`);
      } catch (e) {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể từ chối');
      }
    },
    [updateStatus],
  );

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    await bulkUpdate(selectedIds, 'approved');
    setSelectedIds([]);
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    await bulkUpdate(selectedIds, 'rejected');
    setSelectedIds([]);
  };

  const handleSubmitReply = async (r: Review, values: ReplyFormValues) => {
    try {
      await replyReview(r.id, values.reply);
    } catch (e) {
      notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể gửi phản hồi');
    }
  };

  const handleDelete = useCallback(
    async (r: Review) => {
      try {
        await removeReview(r.id);
        notifySuccess(`Đã xóa đánh giá của ${r.authorName}`);
        if (detailReview?.id === r.id) setDetailReview(null);
      } catch (e) {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể xóa');
      }
    },
    [removeReview, detailReview],
  );

  const handleExport = () => {
    exportToCSV(
      filtered as unknown as Record<string, unknown>[],
      `reviews-${new Date().toISOString().slice(0, 10)}`,
      [
        { key: 'authorName', header: 'Tên' },
        { key: 'authorEmail', header: 'Email' },
        { key: 'service', header: 'Dịch vụ' },
        { key: 'rating', header: 'Sao' },
        { key: 'status', header: 'Trạng thái' },
        { key: 'content', header: 'Nội dung' },
        { key: 'reply', header: 'Phản hồi' },
        { key: 'createdAt', header: 'Ngày tạo' },
      ],
    );
    notifySuccess(`Đã export ${filtered.length} đánh giá`);
  };

  return (
    <>
      <div
        className="admin-grid-sidebar"
        style={{ marginBottom: 16 }}
      >
        <div
          className="admin-card"
          style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={14} fill="#F59E0B" stroke="#F59E0B" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)' }}>
              {counts.total} tổng đánh giá
            </span>
            <div style={{ flex: 1 }} />
            {canModerate && (
              <>
                <button
                  type="button"
                  className="action-btn"
                  onClick={handleExport}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Download size={12} /> Export CSV
                </button>
                {selectedIds.length > 0 && (
                  <>
                    <button
                      type="button"
                      className="action-btn action-btn--primary"
                      onClick={handleBulkApprove}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Check size={12} /> Duyệt ({selectedIds.length})
                    </button>
                    <button
                      type="button"
                      className="action-btn"
                      onClick={handleBulkReject}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'var(--danger, #DC2626)',
                      }}
                    >
                      <XIcon size={12} /> Từ chối ({selectedIds.length})
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          <FilterTabs
            tabs={tabsWithCounts}
            activeValue={statusFilter}
            onChange={(v) => {
              setStatusFilter(v as typeof statusFilter);
              setPage(1);
            }}
          />
        </div>
        <ReviewsRatingStats breakdown={breakdown} average={average} total={total} />
      </div>

      <div className="admin-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Tìm theo tên, email, dịch vụ, nội dung..."
          />
          <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>
            Tổng: {filtered.length} / {reviews.length}
          </span>
        </div>

        <ReviewFilters
          value={filters}
          onChange={(f) => {
            setFilters(f);
            setPage(1);
          }}
          services={serviceList}
        />

        <ReviewsTable
          data={paginated}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          onOpenDetail={setDetailReview}
          onApprove={handleApprove}
          onReject={handleReject}
          onReply={setDetailReview}
          onDelete={(r) => setConfirmDelete(r)}
          canModerate={canModerate}
          canReply={canReply}
          canDelete={canDelete}
        />

        <Pagination
          page={page}
          limit={LIMIT}
          total={filtered.length}
          onPageChange={setPage}
        />
      </div>

      <ReviewDetailDrawer
        review={detailReview}
        onClose={() => setDetailReview(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onDelete={(r) => setConfirmDelete(r)}
        onSubmitReply={handleSubmitReply}
        canModerate={canModerate}
        canDelete={canDelete}
        canReply={canReply}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Xóa đánh giá"
        message={
          confirmDelete
            ? `Bạn có chắc muốn xóa đánh giá của "${confirmDelete.authorName}"? Hành động này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={async () => {
          if (confirmDelete) {
            await handleDelete(confirmDelete);
            setConfirmDelete(null);
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </>
  );
}

// ─── Tab 2: Reports ─────────────────────────────────────────────────────
function ReportsTab({ canModerate }: { canModerate: boolean }) {
  const { data: reports, counts } = useReviewReports();
  const { data: reviews = [] } = useReviews();
  const resolveReport = useResolveReport();
  const [detailReview, setDetailReview] = useState<Review | null>(null);

  return (
    <>
      <AdminPageHeader
        title="Báo cáo vi phạm"
        subtitle={`${counts.pending} chờ xử lý · ${counts.resolved} đã xử lý · ${counts.dismissed} bỏ qua`}
        actions={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.78rem',
              color: 'var(--gray-600)',
            }}
          >
            <MessageSquareWarning size={12} />
            {counts.total} tổng báo cáo
          </span>
        }
      />

      <div className="admin-card">
        {!canModerate && (
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--warning, #FEF3C7)',
              color: '#92400E',
              borderRadius: 6,
              fontSize: '0.78rem',
              marginBottom: 12,
            }}
          >
            Bạn đang ở chế độ chỉ xem. Cần quyền <strong>reviews.moderate</strong> để xử lý báo cáo.
          </div>
        )}
        <ReportsQueue
          reports={reports}
          reviews={reviews}
          onOpenReview={setDetailReview}
          onResolve={
            canModerate
              ? (id, action, note) => {
                  void resolveReport(id, action, note);
                }
              : () => {}
          }
        />
      </div>

      <ReviewDetailDrawer
        review={detailReview}
        onClose={() => setDetailReview(null)}
        onApprove={() => {}}
        onReject={() => {}}
        onDelete={() => {}}
        onSubmitReply={() => {}}
        canModerate={false}
        canDelete={false}
        canReply={false}
      />
    </>
  );
}

// silence unused
void MessageSquareWarning;
void REVIEW_STATUS_LABELS;