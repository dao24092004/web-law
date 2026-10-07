'use client';

import { useCallback, useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import type { CaseStudy } from '@/lib/api/admin-case-study';

interface CaseStudyFormProps {
  isOpen: boolean;
  onClose: () => void;
  caseStudy: CaseStudy | null;
  onSave: (values: CaseStudyFormValues) => Promise<void>;
  isSaving?: boolean;
}

export interface CaseStudyFormValues {
  slug: string;
  titleVi: string;
  titleEn?: string;
  excerptVi?: string;
  excerptEn?: string;
  contentVi?: string;
  contentEn?: string;
  outcome?: string;
  thumbnailUrl?: string;
  ogImageUrl?: string;
  serviceIds?: string[];
  isPublished: boolean;
  isFeatured: boolean;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function CaseStudyForm({
  isOpen,
  onClose,
  caseStudy,
  onSave,
  isSaving,
}: CaseStudyFormProps) {
  const [slug, setSlug] = useState(caseStudy?.slug ?? '');
  const [titleVi, setTitleVi] = useState(caseStudy?.titleVi ?? '');
  const [titleEn, setTitleEn] = useState(caseStudy?.titleEn ?? '');
  const [excerptVi, setExcerptVi] = useState(caseStudy?.excerptVi ?? '');
  const [excerptEn, setExcerptEn] = useState(caseStudy?.excerptEn ?? '');
  const [contentVi, setContentVi] = useState(caseStudy?.contentVi ?? '');
  const [contentEn, setContentEn] = useState(caseStudy?.contentEn ?? '');
  const [outcome, setOutcome] = useState(caseStudy?.outcome ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(caseStudy?.thumbnailUrl ?? '');
  const [ogImageUrl, setOgImageUrl] = useState(caseStudy?.ogImageUrl ?? '');
  const [isPublished, setIsPublished] = useState(caseStudy?.published ?? false);
  const [isFeatured, setIsFeatured] = useState(caseStudy?.featured ?? false);
  const [error, setError] = useState<string | null>(null);

  const handleTitleViChange = (value: string) => {
    setTitleVi(value);
    if (!caseStudy && !slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = useCallback(async () => {
    setError(null);
    if (!titleVi.trim()) {
      setError('Vui lòng nhập tiêu đề tiếng Việt');
      return;
    }
    if (!slug.trim()) {
      setError('Vui lòng nhập slug');
      return;
    }

    try {
      await onSave({
        slug: slug.trim(),
        titleVi: titleVi.trim(),
        titleEn: titleEn.trim() || undefined,
        excerptVi: excerptVi.trim() || undefined,
        excerptEn: excerptEn.trim() || undefined,
        contentVi: contentVi.trim() || undefined,
        contentEn: contentEn.trim() || undefined,
        outcome: outcome.trim() || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        ogImageUrl: ogImageUrl.trim() || undefined,
        isPublished,
        isFeatured,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  }, [titleVi, titleEn, excerptVi, excerptEn, contentVi, contentEn, outcome, thumbnailUrl, ogImageUrl, slug, isPublished, isFeatured, onSave]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        padding: 20,
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 8,
          width: '100%',
          maxWidth: 800,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--gray-200)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
            {caseStudy ? 'Sửa Case Study' : 'Tạo Case Study mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: 'var(--gray-500)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#FEE2E2',
                color: '#991B1B',
                borderRadius: 6,
                marginBottom: 16,
                fontSize: '0.85rem',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: 16 }}>
            {/* Vietnamese */}
            <fieldset style={{ border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16 }}>
              <legend style={{ fontWeight: 600, padding: '0 8px', color: 'var(--gray-700)' }}>
                🇻🇳 Tiếng Việt
              </legend>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>
                  Tiêu đề <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={titleVi}
                  onChange={(e) => handleTitleViChange(e.target.value)}
                  placeholder="VD: Thành công trong vụ kiện thương mại"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>
                  Mô tả ngắn
                </label>
                <textarea
                  value={excerptVi}
                  onChange={(e) => setExcerptVi(e.target.value)}
                  placeholder="Mô tả ngắn gọn về case study..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>
                  Nội dung
                </label>
                <textarea
                  value={contentVi}
                  onChange={(e) => setContentVi(e.target.value)}
                  placeholder="Nội dung chi tiết case study..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    resize: 'vertical',
                  }}
                />
              </div>
            </fieldset>

            {/* English */}
            <fieldset style={{ border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16 }}>
              <legend style={{ fontWeight: 600, padding: '0 8px', color: 'var(--gray-700)' }}>
                🇬🇧 English
              </legend>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>
                  Title
                </label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Case study title in English"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>
                  Excerpt
                </label>
                <textarea
                  value={excerptEn}
                  onChange={(e) => setExcerptEn(e.target.value)}
                  placeholder="Brief description in English..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>
                  Content
                </label>
                <textarea
                  value={contentEn}
                  onChange={(e) => setContentEn(e.target.value)}
                  placeholder="Detailed content in English..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    resize: 'vertical',
                  }}
                />
              </div>
            </fieldset>

            {/* Common fields */}
            <div className="admin-grid-2" style={{ gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>
                  Slug <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="VD: thanh-cong-vu-kien-thuong-mai"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>
                  Kết quả (Outcome)
                </label>
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="VD: Bồi thường 500 triệu đồng"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            {/* Images */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>
                <ImageIcon size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Ảnh thumbnail
              </label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 6,
                  fontSize: '0.9rem',
                }}
              />
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail preview"
                  style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6, marginTop: 8 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>

            {/* Options */}
            <div style={{ display: 'flex', gap: 24 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                <span style={{ fontWeight: 500 }}>Xuất bản ngay</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <span style={{ fontWeight: 500 }}>Nổi bật (Featured)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            padding: '16px 20px',
            borderTop: '1px solid var(--gray-200)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="action-btn"
            disabled={isSaving}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="action-btn action-btn--primary"
            disabled={isSaving}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
