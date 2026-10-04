'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus, Globe, GlobeLock, Pencil, Trash2, Layout } from 'lucide-react';
import { AdminPageHeader, SearchBar, ConfirmDialog } from '@/features/admin/shared';
import {
  useLandingPages,
  useCreateLandingPage,
  useDeleteLandingPage,
  usePublishLandingPage,
  useUpdateLandingPage,
} from './hooks/use-landing-pages';
import type { LandingPage } from '@/lib/api/admin-landing-pages';
import { LandingPageEditor } from './components/editor';

type StatusFilter = 'all' | 'published' | 'draft';

const STATUS_TABS = [
  { value: 'all' as StatusFilter, label: 'Tất cả' },
  { value: 'published' as StatusFilter, label: 'Đã xuất bản' },
  { value: 'draft' as StatusFilter, label: 'Bản nháp' },
];

export default function LandingPagesPage() {
  const { data: pages = [], isLoading } = useLandingPages();
  const createPage = useCreateLandingPage();
  const deletePage = useDeleteLandingPage();
  const publishPage = usePublishLandingPage();
  const updatePage = useUpdateLandingPage();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [confirmDelete, setConfirmDelete] = useState<LandingPage | null>(null);
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const filtered = useMemo(() => {
    let r = pages;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (p) =>
          (p.title ?? '').toLowerCase().includes(q) ||
          (p.slug ?? '').toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      r = r.filter((p) =>
        statusFilter === 'published' ? p.status === 'published' : p.status === 'draft',
      );
    }
    return r;
  }, [pages, search, statusFilter]);

  const stats = useMemo(() => ({
    total: pages.length,
    published: pages.filter((p) => p.status === 'published').length,
    draft: pages.filter((p) => p.status === 'draft').length,
  }), [pages]);

  const handleCreate = useCallback(async () => {
    const title = 'Landing Page moi ' + new Date().toLocaleDateString('vi-VN');
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60);
    const id = await createPage({ title, slug, status: 'draft', blocks: [] });
    if (id) {
      setEditingPage({
        id,
        title,
        slug,
        status: 'draft',
        blocks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setEditorOpen(true);
    }
  }, [createPage]);

  const handleEdit = useCallback((page: LandingPage) => {
    setEditingPage(page);
    setEditorOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    await deletePage(confirmDelete.id, confirmDelete.title);
    setConfirmDelete(null);
  }, [confirmDelete, deletePage]);

  const handleTogglePublish = useCallback(
    async (page: LandingPage) => {
      await publishPage(page.id, page.status !== 'published');
    },
    [publishPage],
  );

  const handleSaveEditor = useCallback(
    async (updated: LandingPage) => {
      await updatePage(updated.id, updated);
      setEditorOpen(false);
      setEditingPage(null);
    },
    [updatePage],
  );

  return (
    <div className="admin-view">
      <AdminPageHeader
        title="Landing Pages"
        subtitle={`Quản lý trang landing page — ${stats.total} trang, ${stats.published} đã xuất bản`}
        actions={
          <button
            type="button"
            className="action-btn action-btn--primary"
            onClick={handleCreate}
          >
            <Plus size={12} /> Tạo Landing Page
          </button>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        <StatCard label="Tổng trang" value={stats.total} color="var(--primary)" />
        <StatCard label="Đã xuất bản" value={stats.published} color="var(--success)" />
        <StatCard label="Bản nháp" value={stats.draft} color="var(--warning)" />
      </div>

      {/* Filter */}
      <div
        style={{
          background: 'white',
          border: '1px solid var(--gray-200)',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap' as const,
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo tiêu đề, slug..."
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setStatusFilter(t.value)}
                className={
                  statusFilter === t.value
                    ? 'action-btn action-btn--primary'
                    : 'action-btn'
                }
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>
            {filtered.length} / {pages.length} trang
          </span>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
          Đang tải...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
          <Layout size={48} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Chưa có landing page nào</div>
          <div style={{ fontSize: '0.78rem' }}>Tạo landing page đầu tiên để bắt đầu</div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 12,
          }}
        >
          {filtered.map((page) => (
            <PageCard
              key={page.id}
              page={page}
              onEdit={() => handleEdit(page)}
              onTogglePublish={() => handleTogglePublish(page)}
              onDelete={() => setConfirmDelete(page)}
            />
          ))}
        </div>
      )}

      {/* Editor Drawer */}
      {editorOpen && editingPage && (
        <LandingPageEditor
          page={editingPage}
          onClose={() => {
            setEditorOpen(false);
            setEditingPage(null);
          }}
          onSave={handleSaveEditor}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Xóa Landing Page"
        message={
          confirmDelete
            ? `Xóa "${confirmDelete.title}"? Hành động không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa"
        variant="danger"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--gray-200)',
        borderRadius: 8,
        padding: 12,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{label}</div>
    </div>
  );
}

interface PageCardProps {
  page: LandingPage;
  onEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}

function PageCard({ page, onEdit, onTogglePublish, onDelete }: PageCardProps) {
  const slug = page.slug ?? page.id;
  const isPublished = page.status === 'published';

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--gray-200)',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
      }}
    >
      {/* Preview placeholder */}
      <div
        style={{
          height: 140,
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2C5282 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative' as const,
        }}
      >
        <Layout size={36} style={{ color: 'rgba(255,255,255,0.4)' }} />
        {isPublished && (
          <span
            style={{
              position: 'absolute' as const,
              top: 8,
              right: 8,
              background: 'var(--success, #10B981)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: '0.65rem',
              fontWeight: 700,
            }}
          >
            Published
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: 12, flex: 1 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: '0.9rem',
            marginBottom: 4,
            color: 'var(--gray-800)',
          }}
        >
          {page.title || (
            <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' as const }}>
              Không có tiêu đề
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: '0.72rem',
            color: 'var(--gray-400)',
            fontFamily: 'monospace',
            marginBottom: 8,
          }}
        >
          /{slug}
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--gray-500)',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap' as const,
          }}
        >
          <span>{page.blocks?.length ?? 0} blocks</span>
          {page.visits !== undefined && page.visits !== null && (
            <span>{page.visits} views</span>
          )}
          {page.conversions !== undefined && page.conversions !== null && (
            <span>{page.conversions} leads</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid var(--gray-100)',
          display: 'flex',
          gap: 4,
          justifyContent: 'flex-end',
        }}
      >
        <button
          type="button"
          className="action-btn"
          style={{ padding: '4px 8px' }}
          title="Sửa"
          onClick={onEdit}
        >
          <Pencil size={11} />
        </button>
        <button
          type="button"
          className="action-btn"
          style={{ padding: '4px 8px' }}
          title={isPublished ? 'Hủy xuất bản' : 'Xuất bản'}
          onClick={onTogglePublish}
        >
          {isPublished ? (
            <GlobeLock size={11} color="var(--warning, #D97706)" />
          ) : (
            <Globe size={11} color="var(--success, #10B981)" />
          )}
        </button>
        <button
          type="button"
          className="action-btn"
          style={{ padding: '4px 8px' }}
          title="Xóa"
          onClick={onDelete}
        >
          <Trash2 size={11} color="var(--danger, #DC2626)" />
        </button>
      </div>
    </div>
  );
}
