'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Save, Trash2, Tag, ToggleLeft, ToggleRight, HelpCircle, RefreshCw, X } from 'lucide-react';
import { Modal } from '@/features/admin/shared';
import { FormFieldInput, FormFieldTextarea } from '@/features/admin/components';
import { useCan, notifySuccess, notifyError } from '@/features/admin/lib';
import {
  useAdminFaqs,
  useAdminFaq,
  useCreateFaq,
  useUpdateFaq,
  useDeleteFaq,
  useToggleFaqSuggestion,
} from '../hooks/use-chatbot';
import { useApiQuery } from '@/lib/api/hooks';
import { serviceApi, type Service } from '@/lib/api/admin-crm';
import type { AdminFaq } from '@/lib/api/admin-crm';

const INTENTS = [
  'GREETING',
  'BOOKING',
  'SERVICE_INQUIRY',
  'LAWYER_INQUIRY',
  'FAQ',
  'CONTACT',
  'COMPLAINT',
  'FEEDBACK',
  'GOODBYE',
  'THANKS',
];

interface FaqFormValues {
  serviceId?: string;
  displayOrder: number;
  isPublished: boolean;
  suggestionEnabled: boolean;
  suggestedFor: string;
  vi: { question: string; answer: string };
  en: { question: string; answer: string };
}

const DEFAULT_VALUES: FaqFormValues = {
  serviceId: '',
  displayOrder: 0,
  isPublished: true,
  suggestionEnabled: true,
  suggestedFor: 'FAQ',
  vi: { question: '', answer: '' },
  en: { question: '', answer: '' },
};

const INTENT_LABEL: Record<string, string> = {
  GREETING: 'Chào hỏi',
  BOOKING: 'Đặt lịch',
  SERVICE_INQUIRY: 'Hỏi dịch vụ',
  LAWYER_INQUIRY: 'Hỏi luật sư',
  FAQ: 'Câu hỏi thường gặp',
  CONTACT: 'Liên hệ',
  COMPLAINT: 'Khiếu nại',
  FEEDBACK: 'Góp ý',
  GOODBYE: 'Tạm biệt',
  THANKS: 'Cảm ơn',
};

export function ChatbotFaqTab() {
  const canWrite = useCan('chatbot.train');
  const canDelete = useCan('chatbot.read');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: faqs, isLoading } = useAdminFaqs({ size: 200, search: search || undefined });

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return faqs;
    return faqs.filter((f) => (statusFilter === 'published' ? f.isPublished : !f.isPublished));
  }, [faqs, statusFilter]);

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            fontSize: '0.85rem',
            color: 'var(--gray-600)',
            flexWrap: 'wrap',
          }}
        >
          <Tag size={12} />
          {faqs.length} FAQ
          <span style={{ color: 'var(--gray-500)' }}>
            · {faqs.filter((f) => f.isPublished).length} đã xuất bản ·{' '}
            {faqs.filter((f) => f.suggestionEnabled).length} bật gợi ý
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            className="action-btn"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            style={{ padding: '6px 10px', fontSize: '0.82rem' }}
          >
            <option value="all">Tất cả</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Nháp</option>
          </select>
          <input
            type="text"
            placeholder="Tìm theo câu hỏi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="action-btn"
            style={{ padding: '6px 10px', fontSize: '0.82rem', minWidth: 220 }}
          />
          {canWrite && (
            <button
              type="button"
              className="action-btn action-btn--primary"
              onClick={() => setCreating(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={12} /> Thêm FAQ
            </button>
          )}
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-500)' }}>
            Đang tải...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: 'var(--gray-500)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <HelpCircle size={32} color="var(--gray-400)" />
            <div>Chưa có FAQ nào. Hãy tạo FAQ đầu tiên để chatbot gợi ý.</div>
            {canWrite && (
              <button
                type="button"
                className="action-btn action-btn--primary"
                onClick={() => setCreating(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={12} /> Tạo FAQ
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  <th style={{ padding: 10, textAlign: 'left', fontSize: '0.78rem' }}>Câu hỏi</th>
                  <th style={{ padding: 10, textAlign: 'left', fontSize: '0.78rem', width: 180 }}>
                    Intent gợi ý
                  </th>
                  <th style={{ padding: 10, textAlign: 'center', fontSize: '0.78rem', width: 80 }}>
                    Gợi ý
                  </th>
                  <th style={{ padding: 10, textAlign: 'center', fontSize: '0.78rem', width: 80 }}>
                    Public
                  </th>
                  <th style={{ padding: 10, textAlign: 'right', fontSize: '0.78rem', width: 140 }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <FaqRow
                    key={f.id}
                    faq={f}
                    canWrite={canWrite}
                    canDelete={canDelete}
                    onEdit={() => setEditingId(f.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(creating || editingId) && (
        <FaqEditor
          mode={creating ? 'create' : 'edit'}
          faqId={editingId}
          onClose={() => {
            setCreating(false);
            setEditingId(null);
          }}
        />
      )}
    </>
  );
}

function FaqRow({
  faq,
  canWrite,
  canDelete,
  onEdit,
}: {
  faq: AdminFaq;
  canWrite: boolean;
  canDelete: boolean;
  onEdit: () => void;
}) {
  const toggle = useToggleFaqSuggestion();
  const remove = useDeleteFaq();
  const update = useUpdateFaq();

  const vi = faq.translations.find((t) => t.locale === 'vi');
  const en = faq.translations.find((t) => t.locale === 'en');
  const intents = (faq.suggestedFor ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const handleTogglePublish = async () => {
    try {
      await update.mutateAsync({ id: faq.id, body: { isPublished: !faq.isPublished } });
      notifySuccess(faq.isPublished ? 'Đã chuyển sang nháp' : 'Đã xuất bản');
    } catch (e) {
      notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể cập nhật');
    }
  };

  const handleToggleSuggestion = async () => {
    try {
      await toggle.mutateAsync(faq.id);
      notifySuccess('Đã đổi trạng thái gợi ý');
    } catch (e) {
      notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể cập nhật');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Xóa FAQ "${vi?.question ?? faq.id}"?`)) return;
    try {
      await remove.mutateAsync(faq.id);
      notifySuccess('Đã xóa FAQ');
    } catch (e) {
      notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể xóa');
    }
  };

  return (
    <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
      <td style={{ padding: 10 }}>
        <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '0.85rem' }}>
          {vi?.question || '(chưa có bản tiếng Việt)'}
        </div>
        {en?.question && (
          <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: 2 }}>
            EN: {en.question}
          </div>
        )}
        {faq.serviceName && (
          <div
            style={{
              fontSize: '0.68rem',
              color: 'var(--gray-400)',
              marginTop: 2,
              fontStyle: 'italic',
            }}
          >
            {faq.serviceName}
          </div>
        )}
      </td>
      <td style={{ padding: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {intents.length === 0 ? (
            <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>— semantic only</span>
          ) : (
            intents.map((i) => (
              <span
                key={i}
                style={{
                  padding: '1px 6px',
                  background: 'var(--primary-faint, #EFF3F8)',
                  color: 'var(--primary)',
                  borderRadius: 999,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                }}
                title={INTENT_LABEL[i] ?? i}
              >
                {INTENT_LABEL[i] ?? i}
              </span>
            ))
          )}
        </div>
      </td>
      <td style={{ padding: 10, textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => canWrite && handleToggleSuggestion()}
          disabled={!canWrite || toggle.isPending}
          title={faq.suggestionEnabled ? 'Đang bật gợi ý' : 'Đã tắt gợi ý'}
          style={{ background: 'transparent', border: 'none', cursor: canWrite ? 'pointer' : 'default' }}
        >
          {faq.suggestionEnabled ? (
            <ToggleRight size={20} color="var(--primary, #2563EB)" />
          ) : (
            <ToggleLeft size={20} color="var(--gray-400)" />
          )}
        </button>
      </td>
      <td style={{ padding: 10, textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => canWrite && handleTogglePublish()}
          disabled={!canWrite || update.isPending}
          title={faq.isPublished ? 'Đã xuất bản' : 'Đang nháp'}
          style={{ background: 'transparent', border: 'none', cursor: canWrite ? 'pointer' : 'default' }}
        >
          {faq.isPublished ? (
            <ToggleRight size={20} color="var(--success, #16A34A)" />
          ) : (
            <ToggleLeft size={20} color="var(--gray-400)" />
          )}
        </button>
      </td>
      <td style={{ padding: 10, textAlign: 'right' }}>
        <div style={{ display: 'inline-flex', gap: 4 }}>
          {canWrite && (
            <button
              type="button"
              className="action-btn"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              onClick={onEdit}
            >
              Sửa
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className="action-btn"
              style={{ padding: '4px 6px' }}
              onClick={handleDelete}
              disabled={remove.isPending}
              title="Xóa"
            >
              <Trash2 size={11} color="var(--danger, #DC2626)" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function FaqEditor({
  mode,
  faqId,
  onClose,
}: {
  mode: 'create' | 'edit';
  faqId: string | null;
  onClose: () => void;
}) {
  const detail = useAdminFaq(mode === 'edit' ? faqId : null);
  const create = useCreateFaq();
  const update = useUpdateFaq();
  const isLoading = create.isPending || update.isPending;
  const [activeLocale, setActiveLocale] = useState<'vi' | 'en'>('vi');

  const form = useForm<FaqFormValues>({
    defaultValues: DEFAULT_VALUES,
  });
  const { register, handleSubmit, reset, watch, formState: { errors } } = form;

  useEffect(() => {
    if (mode === 'edit' && detail.data) {
      const vi = detail.data.translations.find((t) => t.locale === 'vi');
      const en = detail.data.translations.find((t) => t.locale === 'en');
      reset({
        serviceId: detail.data.serviceId ?? '',
        displayOrder: detail.data.displayOrder ?? 0,
        isPublished: detail.data.isPublished,
        suggestionEnabled: detail.data.suggestionEnabled,
        suggestedFor: detail.data.suggestedFor ?? '',
        vi: { question: vi?.question ?? '', answer: vi?.answer ?? '' },
        en: { question: en?.question ?? '', answer: en?.answer ?? '' },
      });
    } else if (mode === 'create') {
      reset(DEFAULT_VALUES);
    }
  }, [mode, detail.data, reset]);

  const onSubmit = async (values: FaqFormValues) => {
    const translations: Array<{ locale: string; question: string; answer: string }> = [];
    if (values.vi.question.trim()) {
      translations.push({ locale: 'vi', question: values.vi.question, answer: values.vi.answer });
    }
    if (values.en.question.trim()) {
      translations.push({
        locale: 'en',
        question: values.en.question,
        answer: values.en.answer || values.vi.answer,
      });
    }
    if (translations.length === 0) {
      notifyError('Cần ít nhất bản tiếng Việt');
      return;
    }
    const payload = {
      serviceId: values.serviceId || undefined,
      displayOrder: values.displayOrder,
      isPublished: values.isPublished,
      suggestionEnabled: values.suggestionEnabled,
      suggestedFor: values.suggestedFor || undefined,
      translations,
    };
    try {
      if (mode === 'create') {
        await create.mutateAsync(payload);
        notifySuccess('Đã tạo FAQ');
      } else if (faqId) {
        await update.mutateAsync({ id: faqId, body: payload });
        notifySuccess('Đã cập nhật FAQ');
      }
      onClose();
    } catch (e) {
      notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể lưu FAQ');
    }
  };

  const selectedIntents = watch('suggestedFor')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const toggleIntent = (intent: string) => {
    const next = new Set(selectedIntents);
    if (next.has(intent)) next.delete(intent);
    else next.add(intent);
    form.setValue('suggestedFor', Array.from(next).join(','));
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={mode === 'create' ? 'Thêm FAQ mới' : 'Sửa FAQ'}
      size="lg"
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
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {isLoading ? <RefreshCw size={12} /> : <Save size={12} />} Lưu
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--gray-200)' }}>
            {(['vi', 'en'] as const).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setActiveLocale(loc)}
                className={`filter-tab ${activeLocale === loc ? 'filter-tab--active' : ''}`}
                style={{ borderRadius: 0, borderBottomWidth: activeLocale === loc ? 2 : 0 }}
              >
                {loc === 'vi' ? 'Tiếng Việt' : 'English'}
              </button>
            ))}
          </div>

          {activeLocale === 'vi' && (
            <>
              <FormFieldInput
                label="Câu hỏi (VI)"
                required
                placeholder="VD: Tôi cần chuẩn bị gì khi tư vấn lần đầu?"
                {...register('vi.question', { required: 'Nhập câu hỏi tiếng Việt' })}
                error={errors.vi?.question?.message}
              />
              <Controller
                control={form.control}
                name="vi.answer"
                render={({ field, fieldState }) => (
                  <FormFieldTextarea
                    label="Câu trả lời (VI)"
                    rows={5}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Nhập câu trả lời chi tiết..."
                    error={fieldState.error?.message}
                  />
                )}
              />
            </>
          )}
          {activeLocale === 'en' && (
            <>
              <FormFieldInput
                label="Question (EN)"
                placeholder="What should I prepare for the first consultation?"
                {...register('en.question')}
                error={errors.en?.question?.message}
              />
              <Controller
                control={form.control}
                name="en.answer"
                render={({ field, fieldState }) => (
                  <FormFieldTextarea
                    label="Answer (EN)"
                    rows={5}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Optional — falls back to VI answer when empty"
                    error={fieldState.error?.message}
                  />
                )}
              />
            </>
          )}

          <div
            style={{
              padding: 12,
              background: 'var(--gray-50)',
              borderRadius: 8,
              border: '1px solid var(--gray-200)',
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--gray-700)',
                marginBottom: 8,
              }}
            >
              Gợi ý cho intent nào? (chọn nhiều)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {INTENTS.map((i) => {
                const active = selectedIntents.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleIntent(i)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: active
                        ? '1px solid var(--primary, #2563EB)'
                        : '1px solid var(--gray-200)',
                      background: active ? 'var(--primary-faint, #EFF3F8)' : 'white',
                      color: active ? 'var(--primary)' : 'var(--gray-600)',
                      cursor: 'pointer',
                    }}
                  >
                    {INTENT_LABEL[i]}
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register('suggestedFor')} />
          </div>

          <div className="admin-grid-2" style={{ gap: 12 }}>
            <FormFieldInput
              label="Thứ tự hiển thị"
              type="number"
              {...register('displayOrder', { valueAsNumber: true })}
            />
            <Controller
              control={form.control}
              name="serviceId"
              render={({ field, fieldState }) => (
                <ServiceSelect
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.85rem',
                color: 'var(--gray-700)',
              }}
            >
              <input type="checkbox" {...register('isPublished')} />
              Đã xuất bản (hiển thị trên trang public)
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.85rem',
                color: 'var(--gray-700)',
              }}
            >
              <input type="checkbox" {...register('suggestionEnabled')} />
              Bật gợi ý trong chatbot
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Dropdown chọn dịch vụ để liên kết FAQ.
 * <p>Hiển thị {@code name — slug} cho admin dễ nhận biết; payload lên BE vẫn
 * là {@code serviceId} (UUID). Cho phép bỏ liên kết với nút ✕.
 */
function ServiceSelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const { data: services = [], isLoading } = useApiQuery<Service[]>(
    ['admin', 'services_for_faq'],
    '/admin/services',
  );

  const selected = services.find((s) => s.id === value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--gray-700)',
          marginBottom: 2,
        }}
      >
        Dịch vụ liên kết (tuỳ chọn)
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        <select
          className="action-btn"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '0.85rem',
            borderColor: error ? 'var(--danger, #DC2626)' : undefined,
          }}
        >
          <option value="">— Không liên kết dịch vụ —</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.slug ? ` — ${s.slug}` : ''}
              {s.isActive === false ? ' (tạm tắt)' : ''}
            </option>
          ))}
        </select>
        {value && (
          <button
            type="button"
            className="action-btn"
            onClick={() => onChange('')}
            title="Bỏ liên kết dịch vụ"
            style={{ padding: '4px 8px' }}
          >
            <X size={12} />
          </button>
        )}
      </div>
      {selected ? (
        <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
          ID: <code style={{ background: 'var(--gray-50)', padding: '0 4px', borderRadius: 3 }}>{selected.id}</code>
        </span>
      ) : (
        <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
          FAQ này không gắn với dịch vụ cụ thể nào.
        </span>
      )}
      {error && (
        <span style={{ color: 'var(--danger, #DC2626)', fontSize: '0.72rem' }}>{error}</span>
      )}
    </div>
  );
}