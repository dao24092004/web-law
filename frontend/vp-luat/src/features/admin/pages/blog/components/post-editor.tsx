'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { ArrowLeft, Save, Eye, History, X, Globe, Clock } from 'lucide-react';
import { postSchema, type PostFormValues } from '@/features/admin/schema';
import { notifyError } from '@/features/admin/lib';
import { uploadImage } from '@/lib/api/upload-image';
import type {
  BlogPost,
  Category,
  Tag,
  PostStatus,
  PostSeo,
  PostRevision,
} from '@/features/admin/types';
import { PostEditorToolbar } from './post-editor-toolbar';
import { PostEditorSidebar } from './post-editor-sidebar';
import { PostEditorProperties } from './post-editor-properties';

interface PostEditorProps {
  isOpen: boolean;
  onClose: () => void;
  post: BlogPost | null;
  categories: Category[];
  tags: Tag[];
  /** Save handler — trả về Post đã lưu (với id cuối cùng) để editor biết đã save xong. */
  onSave: (
    values: PostFormValues,
    options: { status: PostStatus; scheduledAt?: string },
  ) => Promise<BlogPost>;
  /** Trả về danh sách revisions của post hiện tại (parent sở hữu data này). */
  getRevisions: (postId: string) => PostRevision[];
  /** Lưu 1 revision (parent tự push vào collection). */
  onSaveRevision: (revision: PostRevision) => void;
  isSaving?: boolean;
  authorName: string;
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

const EMPTY_SEO: PostSeo = {
  metaTitle: '',
  metaDescription: '',
  ogImage: '',
  canonical: '',
  noindex: false,
};

function buildInitialState(post: BlogPost | null) {
  // The backend serialises status as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'
  // (see PostDTO.status). The legacy BlogPost type uses lowercase so the
  // editor's status dropdown needs a lower-case value to render correctly.
  const rawStatus = (post?.status as unknown as string) ?? 'draft';
  const status: PostStatus =
    rawStatus === 'PUBLISHED' || rawStatus === 'published'
      ? 'published'
      : rawStatus === 'SCHEDULED' || rawStatus === 'scheduled'
      ? 'scheduled'
      : 'draft';
  return {
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    excerpt: post?.excerpt ?? '',
    content: post?.content ?? '',
    category: post?.category ?? '',
    selectedTagIds: post?.tags ?? [],
    status,
    thumbnail: post?.thumbnail ?? '',
    scheduledAt: post?.scheduledAt ? toDatetimeLocal(post.scheduledAt) : '',
    seo: { ...EMPTY_SEO, ...(post?.seo ?? {}) },
  };
}

function toDatetimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

function fromDatetimeLocal(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function PostEditor({
  isOpen,
  onClose,
  post,
  categories,
  tags,
  onSave,
  getRevisions,
  onSaveRevision,
  isSaving,
  authorName,
}: PostEditorProps) {
  const [state, setState] = useState(() => buildInitialState(post));
  const [seoExpanded, setSeoExpanded] = useState(true);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(post?.id ?? null);
  const lastSavedSnapshotRef = useRef<string>('');

  // Reset state khi post thay đổi — parent dùng key prop để force re-mount khi đổi bài.
  // Effect này chỉ chạy khi isOpen đổi (mở/đóng modal) để clear dirty state.
  useEffect(() => {
    if (!isOpen) return;
    setState(buildInitialState(post));
    setDirty(false);
    setCurrentPostId(post?.id ?? null);
    lastSavedSnapshotRef.current = '';
  }, [isOpen, post?.id]);

  // Khóa scroll body khi mở editor
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handler);
    };
  }, [isOpen, onClose]);

  // Auto-slugify: handle trực tiếp trong updateField thay vì effect để tránh re-render cascade.
  // Logic: nếu chưa edit slug (slug === slugify(title trước khi gõ) hoặc rỗng) → tự sinh lại.

  const updateField = useCallback(<K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
    setState((s) => {
      if (key === 'title' && typeof value === 'string') {
        // Auto-slugify khi tạo mới (không có post?.id) và slug chưa bị edit
        if (!post?.id && (!s.slug || s.slug === slugify(s.title))) {
          return { ...s, title: value, slug: slugify(value) };
        }
      }
      return { ...s, [key]: value };
    });
    setDirty(true);
  }, [post?.id]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: 'noopener noreferrer',
            target: '_blank',
            class: 'pe-editor__link',
          },
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: 'pe-editor__image' },
      }),
      Placeholder.configure({
        placeholder: 'Bắt đầu viết nội dung bài viết...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: state.content,
    editable: true,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      setState((s) => ({ ...s, content: html }));
      setDirty(true);
    },
  });

  // Sync content khi post thay đổi
  useEffect(() => {
    if (!editor || !isOpen) return;
    if (state.content !== editor.getHTML()) {
      editor.commands.setContent(state.content || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, isOpen, post?.id]);

  // Mark dirty đã được gộp vào updateField và onUpdate của editor.
  // Snapshot để phát hiện đã save (reset dirty)
  const snapshot = useMemo(
    () =>
      JSON.stringify({
        title: state.title,
        slug: state.slug,
        excerpt: state.excerpt,
        content: state.content,
        category: state.category,
        tags: [...state.selectedTagIds].sort(),
        status: state.status,
        thumbnail: state.thumbnail,
        scheduledAt: state.scheduledAt,
        seo: state.seo,
      }),
    [state],
  );

  // Sau khi save, snapshot thay đổi, ta reset dirty thông qua effect so sánh snapshot
  useEffect(() => {
    if (lastSavedSnapshotRef.current && lastSavedSnapshotRef.current === snapshot) {
      setDirty(false);
    }
  }, [snapshot]);

  const wordCount = useMemo(() => {
    const text = state.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  }, [state.content]);

  const charCount = useMemo(() => state.content.replace(/<[^>]+>/g, '').length, [state.content]);
  const readingMinutes = Math.max(1, Math.round(wordCount / 200));

  const toggleTag = useCallback((tagId: string) => {
    setState((s) => {
      const has = s.selectedTagIds.includes(tagId);
      return {
        ...s,
        selectedTagIds: has
          ? s.selectedTagIds.filter((t) => t !== tagId)
          : [...s.selectedTagIds, tagId],
      };
    });
  }, []);

  const handleSave = useCallback(
    async (overrideStatus?: PostStatus) => {
      if (!editor) return;
      const status = overrideStatus ?? state.status;
      const scheduledAt = fromDatetimeLocal(state.scheduledAt);
      const values: PostFormValues = {
        title: state.title.trim(),
        slug: state.slug.trim(),
        excerpt: state.excerpt,
        content: editor.getHTML(),
        category: state.category,
        tags: state.selectedTagIds,
        status,
        thumbnail: state.thumbnail,
        scheduledAt,
        seo: {
          ...state.seo,
          noindex: Boolean(state.seo.noindex),
        },
      };
      const parsed = postSchema.safeParse(values);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        notifyError('Lỗi form', first?.message ?? 'Vui lòng kiểm tra các trường');
        return;
      }
      try {
        const saved = await onSave(parsed.data, { status, scheduledAt });
        // Lưu revision
        const now = new Date().toISOString();
        onSaveRevision({
          id: `rev-${Date.now()}`,
          postId: saved.id,
          title: saved.title,
          content: saved.content,
          excerpt: saved.excerpt,
          author: authorName,
          reason: 'manual_save',
          createdAt: now,
        });
        lastSavedSnapshotRef.current = snapshot;
        setDirty(false);
        setCurrentPostId(saved.id);
        if (status === 'scheduled' && scheduledAt && new Date(scheduledAt).getTime() <= Date.now()) {
          // Scheduled quá khứ → publish ngay (parent sẽ chạy lại qua interval)
          updateField('status', 'published');
        }
      } catch (e) {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể lưu bài viết');
      }
    },
    [editor, state, onSave, onSaveRevision, authorName, snapshot, updateField],
  );

  const handleRestoreRevision = useCallback(
    (rev: PostRevision) => {
      if (!editor) return;
      editor.commands.setContent(rev.content, { emitUpdate: false });
      setState((s) => ({ ...s, content: rev.content, title: rev.title }));
      setRevisionsOpen(false);
      notifyError('Đã khôi phục', 'Snapshot đã nạp vào editor, bấm Lưu để ghi đè.');
    },
    [editor],
  );

  if (!isOpen) return null;

  const handleAddImageByUrl = () => {
    const url = window.prompt('URL hình ảnh', 'https://');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url, alt: '' }).run();
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!editor) return;
    try {
      const result = await uploadImage(file, 'content');
      if (!result.url) {
        notifyError('Upload ảnh thất bại', 'Phản hồi từ server không có URL ảnh');
        return;
      }
      editor.chain().focus().setImage({ src: result.url, alt: file.name }).run();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Upload ảnh thất bại';
      notifyError('Upload ảnh thất bại', msg);
    }
  };

  const handleThumbnailChange = (dataUrl: string) => {
    updateField('thumbnail', dataUrl);
  };
  const handleThumbnailClear = () => {
    updateField('thumbnail', '');
  };

  const postId = post?.id ?? currentPostId;
  const revisions = postId ? getRevisions(postId) : [];

  return (
    <div className="pe-shell" role="dialog" aria-modal="true" aria-label="Trình soạn thảo bài viết">
      {/* Top bar */}
      <div className="pe-shell__topbar">
        <div className="pe-shell__topbar-left">
          <button
            type="button"
            className="action-btn"
            onClick={onClose}
            aria-label="Đóng trình soạn thảo"
          >
            <ArrowLeft size={14} />
          </button>
          <input
            type="text"
            className="pe-shell__title-input"
            placeholder="Tiêu đề bài viết..."
            value={state.title}
            onChange={(e) => updateField('title', e.target.value)}
            aria-label="Tiêu đề bài viết"
          />
          {dirty && (
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--gray-500)',
                background: 'var(--gray-100)',
                padding: '2px 8px',
                borderRadius: 4,
                flexShrink: 0,
              }}
            >
              chưa lưu
            </span>
          )}
        </div>
        <div className="pe-shell__topbar-actions">
          <button
            type="button"
            className="action-btn"
            onClick={() => setRevisionsOpen(true)}
            disabled={!postId}
            aria-label="Mở lịch sử chỉnh sửa"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <History size={14} /> Lịch sử ({revisions.length})
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Save size={14} /> Lưu nháp
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={() => handleSave('scheduled')}
            disabled={isSaving || !state.scheduledAt}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            title={!state.scheduledAt ? 'Chọn thời điểm đăng ở panel phải' : undefined}
          >
            <Clock size={14} /> Hẹn giờ
          </button>
          <button
            type="button"
            className="action-btn action-btn--primary"
            onClick={() => handleSave('published')}
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Globe size={14} /> {isSaving ? 'Đang lưu...' : 'Xuất bản'}
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={onClose}
            aria-label="Đóng"
            title="Đóng (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 3-pane body */}
      <div className="pe-shell__body">
        <PostEditorSidebar
          slug={state.slug}
          onSlugChange={(v) => updateField('slug', v)}
          excerpt={state.excerpt}
          onExcerptChange={(v) => updateField('excerpt', v)}
          category={state.category}
          onCategoryChange={(v) => updateField('category', v)}
          categories={categories}
          selectedTagIds={state.selectedTagIds}
          onToggleTag={toggleTag}
          tags={tags}
          thumbnail={state.thumbnail}
          onThumbnailChange={handleThumbnailChange}
          onThumbnailClear={handleThumbnailClear}
          charCount={charCount}
          wordCount={wordCount}
          readingMinutes={readingMinutes}
        />

        <div className="pe-shell__center">
          {editor && (
            <PostEditorToolbar
              editor={editor}
              onUploadImage={handleImageUpload}
              onAddImageByUrl={handleAddImageByUrl}
            />
          )}
          <div className="pe-shell__editor-scroll">
            <div className="pe-shell__editor-canvas">
              <EditorContent editor={editor} className="pe-preview__content" />
              {!editor && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>
                  Đang tải trình soạn thảo...
                </div>
              )}
            </div>
          </div>
        </div>

        <PostEditorProperties
          status={state.status}
          onStatusChange={(s) => updateField('status', s)}
          scheduledAt={state.scheduledAt}
          onScheduledAtChange={(v) => updateField('scheduledAt', v)}
          seo={state.seo}
          onSeoChange={(next) => updateField('seo', next)}
          seoExpanded={seoExpanded}
          onSeoExpandedChange={setSeoExpanded}
        />
      </div>

      {/* Revision history modal — sử dụng component ở file riêng */}
      {revisionsOpen && (
        <RevisionModal
          revisions={revisions}
          onClose={() => setRevisionsOpen(false)}
          onRestore={handleRestoreRevision}
        />
      )}
    </div>
  );
}

// Inline simple revision modal — tránh import vòng
function RevisionModal({
  revisions,
  onClose,
  onRestore,
}: {
  revisions: PostRevision[];
  onClose: () => void;
  onRestore: (r: PostRevision) => void;
}) {
  const sorted = [...revisions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          width: 480,
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--gray-200)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={16} /> Lịch sử chỉnh sửa
          </div>
          <button type="button" className="action-btn" onClick={onClose} aria-label="Đóng">
            <X size={14} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sorted.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'var(--gray-500)',
                fontSize: '0.85rem',
              }}
            >
              Chưa có bản sửa đổi nào
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {sorted.map((r) => (
                <li
                  key={r.id}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--gray-100)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                      {r.author} ·{' '}
                      {new Intl.DateTimeFormat('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(r.createdAt))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => onRestore(r)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Eye size={12} /> Khôi phục
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
