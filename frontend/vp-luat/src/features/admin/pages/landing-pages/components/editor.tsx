// LANDING PAGE EDITOR COMPONENT
// This component is imported by landing-pages/index.tsx
// Keep it separate to avoid syntax issues in large files

'use client';

import { useState } from 'react';
import { X, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import type { LandingPage, LandingPageBlock } from '@/lib/api/admin-landing-pages';
import { BLOCK_TYPES, createBlock } from '../hooks/use-landing-pages';

interface Props {
  page: LandingPage;
  onClose: () => void;
  onSave: (p: LandingPage) => Promise<void>;
}

export function LandingPageEditor({ page, onClose, onSave }: Props) {
  const [title, setTitle] = useState(page.title || '');
  const [slug, setSlug] = useState(page.slug || '');
  const [blocks, setBlocks] = useState<LandingPageBlock[]>(page.blocks || []);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  function addBlock(type: LandingPageBlock['type']) {
    const nb = createBlock(type, blocks.length);
    setBlocks([...blocks, nb]);
    setActiveBlockId(nb.id);
    setShowPicker(false);
  }

  function removeBlock(id: string) {
    setBlocks(blocks.filter(b => b.id !== id));
    if (activeBlockId === id) setActiveBlockId(null);
  }

  function moveBlock(id: string, dir: 'up' | 'down') {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const ni = dir === 'up' ? idx - 1 : idx + 1;
    if (ni < 0 || ni >= blocks.length) return;
    const nb = [...blocks];
    [nb[idx], nb[ni]] = [nb[ni], nb[idx]];
    nb.forEach((b, i) => { b.order = i; });
    setBlocks(nb);
  }

  function updateBlockProps(id: string, newProps: Record<string, unknown>) {
    setBlocks(blocks.map(b => b.id === id ? { ...b, props: { ...b.props, ...newProps } } : b));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ ...page, title, slug, blocks });
    } finally {
      setSaving(false);
    }
  }

  const active = blocks.find(b => b.id === activeBlockId);

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
      }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 800, maxWidth: '95vw',
        background: 'white', zIndex: 200,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
        animation: 'drawerIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700 }}>Sửa Landing Page</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{page.slug || page.id}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Meta */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--gray-100)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>Tiêu đề</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--gray-200)', borderRadius: 6, fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>Slug</label>
            <input value={slug} onChange={e => setSlug(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--gray-200)', borderRadius: 6, fontSize: '0.85rem', fontFamily: 'monospace' }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', gap: 0 }}>
          {/* Blocks list */}
          <div style={{ flex: 1, overflow: 'auto', padding: 16, borderRight: '1px solid var(--gray-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                Blocks ({blocks.length})
              </span>
              <button type="button" className="action-btn" onClick={() => setShowPicker(p => !p)}>
                <Plus size={12} /> Thêm Block
              </button>
            </div>

            {showPicker && (
              <div style={{ border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                {BLOCK_TYPES.map(bt => (
                  <button key={bt.type} type="button" onClick={() => addBlock(bt.type)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ fontSize: '1.1rem' }}>{bt.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{bt.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>{bt.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {blocks.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', border: '2px dashed var(--gray-200)', borderRadius: 8, color: 'var(--gray-400)', fontSize: '0.82rem' }}>
                Chưa có block nào. Nhấn &quot;Thêm Block&quot; để bắt đầu.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {blocks.map((block, idx) => {
                  const bt = BLOCK_TYPES.find(b => b.type === block.type);
                  const isActive = activeBlockId === block.id;
                  return (
                    <div key={block.id}
                      onClick={() => setActiveBlockId(isActive ? null : block.id)}
                      style={{
                        border: '1px solid ' + (isActive ? 'var(--primary)' : 'var(--gray-200)'),
                        borderRadius: 8, padding: '8px 10px',
                        background: isActive ? 'var(--primary-faint, #EFF3F8)' : 'white',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                      <span style={{ fontSize: '1rem' }}>{bt?.icon || '📦'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{bt?.label || block.type}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {String(block.props?.title || block.props?.content || '').slice(0, 40) || '—'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button type="button" className="action-btn" style={{ padding: 3 }}
                          onClick={e => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
                          disabled={idx === 0} title="Lên">
                          <ArrowUp size={10} />
                        </button>
                        <button type="button" className="action-btn" style={{ padding: 3 }}
                          onClick={e => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
                          disabled={idx === blocks.length - 1} title="Xuống">
                          <ArrowDown size={10} />
                        </button>
                        <button type="button" className="action-btn" style={{ padding: 3 }}
                          onClick={e => { e.stopPropagation(); removeBlock(block.id); }} title="Xóa">
                          <X size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Block config */}
          <div style={{ width: 280, overflow: 'auto', padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--gray-600)', marginBottom: 12 }}>
              Cấu hình Block
            </div>
            {active ? (
              <BlockConfig block={active} onUpdate={p => updateBlockProps(active.id, p)} />
            ) : (
              <div style={{ color: 'var(--gray-400)', fontSize: '0.78rem', textAlign: 'center', padding: 24 }}>
                Chọn một block để chỉnh sửa
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: 12, borderTop: '1px solid var(--gray-200)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="action-btn" onClick={onClose}>Hủy</button>
          <button type="button" className="action-btn action-btn--primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
      <style>{`@keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  );
}

function BlockConfig({ block, onUpdate }: { block: LandingPageBlock; onUpdate: (p: Record<string, unknown>) => void }) {
  const p = block.props || {};

  if (block.type === 'hero') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field label="Tiêu đề">
          <input value={String(p.title || '')} onChange={e => onUpdate({ title: e.target.value })}
            style={inputStyle()} />
        </Field>
        <Field label="Phụ đề">
          <textarea value={String(p.subtitle || '')} onChange={e => onUpdate({ subtitle: e.target.value })}
            style={{ ...inputStyle(), minHeight: 60, resize: 'vertical' }} />
        </Field>
        <Field label="Text CTA">
          <input value={String(p.ctaText || '')} onChange={e => onUpdate({ ctaText: e.target.value })}
            style={inputStyle()} />
        </Field>
        <Field label="Link CTA">
          <input value={String(p.ctaLink || '')} onChange={e => onUpdate({ ctaLink: e.target.value })}
            style={inputStyle()} />
        </Field>
        <Field label="Ảnh nền URL">
          <input value={String(p.backgroundImage || '')} onChange={e => onUpdate({ backgroundImage: e.target.value })}
            style={inputStyle()} placeholder="https://..." />
        </Field>
      </div>
    );
  }

  if (block.type === 'cta') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field label="Tiêu đề">
          <input value={String(p.title || '')} onChange={e => onUpdate({ title: e.target.value })}
            style={inputStyle()} />
        </Field>
        <Field label="Mô tả">
          <textarea value={String(p.subtitle || '')} onChange={e => onUpdate({ subtitle: e.target.value })}
            style={{ ...inputStyle(), minHeight: 60, resize: 'vertical' }} />
        </Field>
        <Field label="Text nút">
          <input value={String(p.buttonText || '')} onChange={e => onUpdate({ buttonText: e.target.value })}
            style={inputStyle()} />
        </Field>
        <Field label="Link nút">
          <input value={String(p.buttonLink || '')} onChange={e => onUpdate({ buttonLink: e.target.value })}
            style={inputStyle()} />
        </Field>
      </div>
    );
  }

  if (block.type === 'text') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field label="Nội dung">
          <textarea value={String(p.content || '')} onChange={e => onUpdate({ content: e.target.value })}
            style={{ ...inputStyle(), minHeight: 120, resize: 'vertical' }} />
        </Field>
      </div>
    );
  }

  if (block.type === 'image') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field label="URL ảnh">
          <input value={String(p.src || '')} onChange={e => onUpdate({ src: e.target.value })}
            style={inputStyle()} placeholder="https://..." />
        </Field>
        <Field label="Alt text">
          <input value={String(p.alt || '')} onChange={e => onUpdate({ alt: e.target.value })}
            style={inputStyle()} />
        </Field>
        <Field label="Chú thích">
          <input value={String(p.caption || '')} onChange={e => onUpdate({ caption: e.target.value })}
            style={inputStyle()} />
        </Field>
      </div>
    );
  }

  if (block.type === 'video') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field label="Video URL (YouTube/Vimeo)">
          <input value={String(p.url || '')} onChange={e => onUpdate({ url: e.target.value })}
            style={inputStyle()} placeholder="https://youtube.com/..." />
        </Field>
        <Field label="Poster URL">
          <input value={String(p.poster || '')} onChange={e => onUpdate({ poster: e.target.value })}
            style={inputStyle()} />
        </Field>
      </div>
    );
  }

  return (
    <div style={{ color: 'var(--gray-500)', fontSize: '0.78rem', textAlign: 'center', padding: 16 }}>
      Block &quot;{block.type}&quot; chưa có form cấu hình riêng.
      <div style={{ marginTop: 8, fontSize: '0.7rem', background: 'var(--gray-50)', padding: 6, borderRadius: 4, fontFamily: 'monospace', textAlign: 'left' }}>
        {JSON.stringify(p).slice(0, 150)}...
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '6px 8px',
    border: '1.5px solid var(--gray-200)',
    borderRadius: 6,
    fontSize: '0.8rem',
    boxSizing: 'border-box',
  };
}
