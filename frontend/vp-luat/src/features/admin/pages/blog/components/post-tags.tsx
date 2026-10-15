'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, Trash2, Tag as TagIcon, Hash } from 'lucide-react';
import { DataTableV2, type DataTableColumn, FormFieldInput } from '@/features/admin/components';
import { Modal } from '@/features/admin/shared';
import { tagSchema, type TagFormValues } from '@/features/admin/schema';
import type { Tag } from '@/features/admin/types';

interface PostTagsProps {
  tags: Tag[];
  onCreate: (values: TagFormValues) => Promise<void> | void;
  onUpdate: (id: string, values: TagFormValues) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  isCreating?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

const DEFAULT_TAG_COLOR = '#1E3A5F';

const PRESET_COLORS = [
  '#1E3A5F',
  '#C9A84C',
  '#2563EB',
  '#059669',
  '#7C3AED',
  '#DC2626',
  '#EA580C',
  '#0891B2',
  '#DB2777',
  '#65A30D',
];

export function PostTags({
  tags,
  onCreate,
  onUpdate,
  onDelete,
  isCreating,
  isUpdating,
  isDeleting,
}: PostTagsProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tag | null>(null);

  const columns: DataTableColumn<Tag>[] = [
    {
      key: 'name',
      header: 'Tag',
      sortable: true,
      cell: (t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: 3,
              background: t.color || DEFAULT_TAG_COLOR,
            }}
            aria-hidden
          />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{t.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>
              <Hash size={10} style={{ display: 'inline' }} /> {t.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'color',
      header: 'Mã màu',
      cell: (t) => (
        <code
          style={{
            fontSize: '0.78rem',
            color: 'var(--gray-600)',
            background: 'var(--gray-100)',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {(t.color || DEFAULT_TAG_COLOR).toUpperCase()}
        </code>
      ),
    },
    {
      key: 'postCount',
      header: 'Số bài viết',
      sortable: true,
      align: 'right',
      cell: (t) => (
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            background: 'var(--gray-100)',
            borderRadius: 999,
            fontSize: '0.78rem',
            fontWeight: 600,
          }}
        >
          {t.postCount}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      cell: (t) => (
        <div
          style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="action-btn"
            style={{ padding: '4px 8px' }}
            onClick={() => {
              setEditing(t);
              setFormOpen(true);
            }}
            title="Sửa"
            aria-label="Sửa tag"
          >
            <Edit2 size={12} />
          </button>
          <button
            type="button"
            className="action-btn action-btn--danger"
            style={{ padding: '4px 8px' }}
            onClick={() => setConfirmDelete(t)}
            title="Xóa"
            aria-label="Xóa tag"
            disabled={t.postCount > 0}
            aria-disabled={t.postCount > 0}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-card">
      <div
        className="admin-card__header"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div className="admin-card__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TagIcon size={16} /> Tags
        </div>
        <button
          type="button"
          className="action-btn action-btn--primary"
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={14} /> Thêm tag
        </button>
      </div>

      <DataTableV2<Tag>
        data={tags}
        columns={columns}
        defaultSort={{ by: 'name', dir: 'asc' }}
        emptyTitle="Chưa có tag nào"
        emptyDescription="Tạo tag để gắn nhãn bài viết (vd: FDI 2025, HĐĐT, M&A)."
      />

      <TagForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        initial={editing}
        onSubmit={async (values) => {
          if (editing) {
            await onUpdate(editing.id, values);
          } else {
            await onCreate(values);
          }
          setFormOpen(false);
          setEditing(null);
        }}
        isLoading={isCreating || isUpdating}
      />

      <Modal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Xóa tag"
        size="sm"
        footer={
          <>
            <button type="button" className="action-btn" onClick={() => setConfirmDelete(null)}>
              Hủy
            </button>
            <button
              type="button"
              className="action-btn action-btn--danger"
              onClick={() => {
                if (confirmDelete) {
                  void onDelete(confirmDelete.id);
                  setConfirmDelete(null);
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          </>
        }
      >
        {confirmDelete && (
          <p style={{ margin: 0, color: 'var(--gray-700)' }}>
            Bạn có chắc muốn xóa tag <strong>{confirmDelete.name}</strong>?
          </p>
        )}
      </Modal>
    </div>
  );
}

interface TagFormProps {
  isOpen: boolean;
  onClose: () => void;
  initial: Tag | null;
  onSubmit: (values: TagFormValues) => Promise<void> | void;
  isLoading?: boolean;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function TagForm({ isOpen, onClose, initial, onSubmit, isLoading }: TagFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: initial?.name ?? '',
      slug: initial?.slug ?? '',
      color: initial?.color || DEFAULT_TAG_COLOR,
    },
  });

  const name = watch('name');
  const slug = watch('slug');
  const color = watch('color') || DEFAULT_TAG_COLOR;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Sửa tag' : 'Thêm tag mới'}
      size="sm"
      footer={
        <>
          <button type="button" className="action-btn" onClick={onClose} disabled={isLoading}>
            Hủy
          </button>
          <button
            type="button"
            className="action-btn action-btn--primary"
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? 'Đang lưu...' : initial ? 'Cập nhật' : 'Tạo tag'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormFieldInput
          label="Tên tag"
          required
          placeholder="vd: FDI 2025"
          {...register('name')}
          error={errors.name?.message}
        />
        <FormFieldInput
          label="Slug (URL)"
          required
          placeholder="fdi-2025"
          value={slug}
          onChange={(e) => setValue('slug', slugify(e.target.value), { shouldValidate: true })}
          error={errors.slug?.message}
          hint={!slug || slug === slugify(name) ? 'Tự động tạo từ tên' : undefined}
        />

        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--gray-600)',
              marginBottom: 6,
            }}
          >
            Màu sắc <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <input
              type="color"
              value={color}
              onChange={(e) =>
                setValue('color', e.target.value.toUpperCase(), { shouldValidate: true })
              }
              style={{
                width: 48,
                height: 36,
                padding: 0,
                border: '1px solid var(--gray-200)',
                borderRadius: 6,
                cursor: 'pointer',
              }}
              aria-label="Chọn màu"
            />
            <input
              type="text"
              value={color.toUpperCase()}
              onChange={(e) => setValue('color', e.target.value, { shouldValidate: true })}
              placeholder="#1E3A5F"
              className="form-input"
              style={{ flex: 1, fontFamily: 'monospace' }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
            }}
          >
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setValue('color', c, { shouldValidate: true })}
                title={c}
                aria-label={`Chọn màu ${c}`}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  border: color.toUpperCase() === c ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                  background: c,
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
          {errors.color?.message && (
            <div style={{ color: '#DC2626', fontSize: '0.72rem', marginTop: 4 }}>
              {errors.color.message}
            </div>
          )}
        </div>

        <div
          style={{
            padding: 10,
            background: 'var(--gray-100)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--gray-500)' }}>Preview:</span>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.78rem',
              fontWeight: 600,
              background: `${color}1A`,
              color: color,
              border: `1px solid ${color}33`,
            }}
          >
            <Hash size={10} style={{ display: 'inline' }} /> {name || 'tag-name'}
          </span>
        </div>
      </form>
    </Modal>
  );
}
