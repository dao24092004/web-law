'use client';

import { ChevronDown, ChevronUp, Search, Calendar, Shield } from 'lucide-react';
import type { PostSeo, PostStatus } from '@/features/admin/types';

interface PostEditorPropertiesProps {
  status: PostStatus;
  onStatusChange: (s: PostStatus) => void;
  scheduledAt: string;
  onScheduledAtChange: (v: string) => void;
  seo: PostSeo;
  onSeoChange: (next: PostSeo) => void;
  seoExpanded: boolean;
  onSeoExpandedChange: (v: boolean) => void;
}

export function PostEditorProperties({
  status,
  onStatusChange,
  scheduledAt,
  onScheduledAtChange,
  seo,
  onSeoChange,
  seoExpanded,
  onSeoExpandedChange,
}: PostEditorPropertiesProps) {
  const metaTitleLen = (seo.metaTitle ?? '').length;
  const metaDescLen = (seo.metaDescription ?? '').length;

  return (
    <aside className="pe-properties">
      <Section title="Trạng thái" icon={<Shield size={12} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(['draft', 'published', 'scheduled'] as PostStatus[]).map((s) => (
            <label
              key={s}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                background: status === s ? 'var(--primary-bg, #EFF6FF)' : 'transparent',
                border: status === s ? '1px solid var(--primary)' : '1px solid transparent',
                fontSize: '0.82rem',
              }}
            >
              <input
                type="radio"
                name="post-status"
                value={s}
                checked={status === s}
                onChange={() => onStatusChange(s)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span>
                {s === 'draft' && 'Bản nháp'}
                {s === 'published' && 'Xuất bản ngay'}
                {s === 'scheduled' && 'Hẹn giờ đăng'}
              </span>
            </label>
          ))}
        </div>

        {status === 'scheduled' && (
          <div style={{ marginTop: 8 }}>
            <label className="pe-sidebar__label">
              <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />
              Thời điểm đăng
            </label>
            <input
              type="datetime-local"
              className="form-input"
              value={scheduledAt}
              onChange={(e) => onScheduledAtChange(e.target.value)}
              style={{ background: 'white' }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: 4 }}>
              Hệ thống tự động kiểm tra mỗi 60s và chuyển sang &ldquo;Đã xuất bản&rdquo; khi tới giờ.
            </div>
          </div>
        )}
      </Section>

      <Section
        title="SEO & Chia sẻ"
        icon={<Search size={12} />}
        collapsible
        expanded={seoExpanded}
        onToggle={() => onSeoExpandedChange(!seoExpanded)}
      >
        {seoExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="pe-sidebar__label">Meta title</label>
              <input
                type="text"
                className="form-input"
                value={seo.metaTitle ?? ''}
                onChange={(e) => onSeoChange({ ...seo, metaTitle: e.target.value })}
                placeholder="Tiêu đề hiển thị trên Google"
                maxLength={70}
              />
              <CharCount current={metaTitleLen} max={70} />
            </div>

            <div>
              <label className="pe-sidebar__label">Meta description</label>
              <textarea
                className="form-input"
                rows={3}
                value={seo.metaDescription ?? ''}
                onChange={(e) => onSeoChange({ ...seo, metaDescription: e.target.value })}
                placeholder="Mô tả hiển thị dưới tiêu đề trên Google"
                style={{ resize: 'vertical' }}
                maxLength={160}
              />
              <CharCount current={metaDescLen} max={160} />
            </div>

            <div>
              <label className="pe-sidebar__label">OG image (URL)</label>
              <input
                type="text"
                className="form-input"
                value={seo.ogImage ?? ''}
                onChange={(e) => onSeoChange({ ...seo, ogImage: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="pe-sidebar__label">Canonical URL</label>
              <input
                type="text"
                className="form-input"
                value={seo.canonical ?? ''}
                onChange={(e) => onSeoChange({ ...seo, canonical: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.78rem',
                color: 'var(--gray-700)',
                padding: '6px 0',
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(seo.noindex)}
                onChange={(e) => onSeoChange({ ...seo, noindex: e.target.checked })}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span>Không cho Google index (noindex)</span>
            </label>

            <SeoPreview
              metaTitle={seo.metaTitle ?? ''}
              metaDescription={seo.metaDescription ?? ''}
              slug={slugPreview}
            />
          </div>
        )}
      </Section>
    </aside>
  );
}

const slugPreview = '';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

function Section({ title, icon, children, collapsible, expanded = true, onToggle }: SectionProps) {
  const isOpen = collapsible ? expanded : expanded;
  return (
    <div className="pe-properties__section">
      <div
        className="pe-properties__section-title"
        role={collapsible ? 'button' : undefined}
        onClick={collapsible ? onToggle : undefined}
        style={{ cursor: collapsible ? 'pointer' : 'default' }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {icon}
          {title}
        </span>
        {collapsible &&
          (isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </div>
      {isOpen && <div className="pe-properties__section-body">{children}</div>}
    </div>
  );
}

function CharCount({ current, max }: { current: number; max: number }) {
  const over = current > max;
  return (
    <div
      style={{
        fontSize: '0.7rem',
        color: over ? '#DC2626' : 'var(--gray-400)',
        marginTop: 4,
        textAlign: 'right',
      }}
    >
      {current}/{max}
    </div>
  );
}

function SeoPreview({
  metaTitle,
  metaDescription,
  slug,
}: {
  metaTitle: string;
  metaDescription: string;
  slug: string;
}) {
  const title = metaTitle || '(Chưa có meta title)';
  const desc = metaDescription || '(Chưa có meta description)';
  return (
    <div
      style={{
        marginTop: 8,
        padding: 10,
        border: '1px solid var(--gray-200)',
        borderRadius: 6,
        background: 'white',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          color: 'var(--gray-400)',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Google Preview
      </div>
      <div style={{ color: '#1A0DAB', fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.2 }}>
        {title.length > 60 ? `${title.slice(0, 60)}…` : title}
      </div>
      <div style={{ color: '#006621', fontSize: '0.74rem', marginTop: 2 }}>
        https://icrclaw.com/news/{slug || 'bai-viet'}
      </div>
      <div
        style={{
          color: 'var(--gray-700)',
          fontSize: '0.78rem',
          marginTop: 2,
          lineHeight: 1.4,
        }}
      >
        {desc.length > 160 ? `${desc.slice(0, 160)}…` : desc}
      </div>
    </div>
  );
}
