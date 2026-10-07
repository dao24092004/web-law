'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Plus, Trash2, MessageCircle, Hand, Tag } from 'lucide-react';
import { Modal } from '@/features/admin/shared';
import { FormFieldInput, FormFieldTextarea } from '@/features/admin/components';
import { intentSchema, type IntentFormValues } from '@/features/admin/schema';
import type { ChatbotIntent } from '@/features/admin/types';

interface ChatbotIntentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: IntentFormValues) => Promise<void> | void;
  initial: ChatbotIntent | null;
  isLoading?: boolean;
}

const DEFAULT_VALUES: IntentFormValues = {
  name: '',
  description: '',
  sampleUtterances: [''],
  responseTemplate: 'Chào anh/chị! Về {{topic}}, ICRC Law có thể hỗ trợ...',
  handoffEnabled: false,
  handoffTo: '',
  handoffKeywords: [],
  isActive: true,
};

export function ChatbotIntentForm({
  isOpen,
  onClose,
  onSubmit,
  initial,
  isLoading,
}: ChatbotIntentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IntentFormValues>({
    resolver: zodResolver(intentSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const [kwInput, setKwInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      reset({
        name: initial.name,
        description: initial.description ?? '',
        sampleUtterances:
          initial.sampleUtterances.length > 0 ? initial.sampleUtterances : [''],
        responseTemplate: initial.responseTemplate,
        handoffEnabled: initial.handoffEnabled,
        handoffTo: initial.handoffTo ?? '',
        handoffKeywords: initial.handoffKeywords ?? [],
        isActive: initial.isActive,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [isOpen, initial, reset]);

  const handoffEnabled = watch('handoffEnabled');
  const utterances = watch('sampleUtterances');
  const keywords = watch('handoffKeywords');

  const addUtterance = () => {
    setValue('sampleUtterances', [...utterances, ''], { shouldValidate: true });
  };
  const removeUtterance = (idx: number) => {
    if (utterances.length <= 1) return;
    setValue(
      'sampleUtterances',
      utterances.filter((_, i) => i !== idx),
      { shouldValidate: true },
    );
  };
  const addKeyword = () => {
    const trimmed = kwInput.trim();
    if (!trimmed) return;
    setValue('handoffKeywords', [...keywords, trimmed], { shouldValidate: true });
    setKwInput('');
  };
  const removeKeyword = (idx: number) => {
    setValue(
      'handoffKeywords',
      keywords.filter((_, i) => i !== idx),
      { shouldValidate: true },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? `Sửa intent — ${initial.name}` : 'Thêm intent mới'}
      size="lg"
      footer={
        <>
          <button type="button" className="action-btn" onClick={onClose} disabled={isLoading}>
            <X size={12} /> Hủy
          </button>
          <button
            type="button"
            className="action-btn action-btn--primary"
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Save size={12} /> {initial ? 'Cập nhật' : 'Tạo intent'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="admin-grid-2" style={{ gap: 12 }}>
            <FormFieldInput
              label="Tên intent"
              required
              placeholder="VD: Tư vấn FDI"
              {...register('name')}
              error={errors.name?.message}
            />
            <FormFieldInput
              label="Mô tả"
              placeholder="Intent cho câu hỏi về..."
              {...register('description')}
              error={errors.description?.message}
            />
          </div>

          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--gray-700)',
                marginBottom: 6,
              }}
            >
              <MessageCircle size={11} /> Sample utterances * (câu mẫu chatbot nhận diện)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {utterances.map((_, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder={`Utterance #${idx + 1} (VD: "Tôi muốn tư vấn FDI")`}
                    className="action-btn"
                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                    {...register(`sampleUtterances.${idx}` as const)}
                  />
                  {utterances.length > 1 && (
                    <button
                      type="button"
                      className="action-btn"
                      style={{ padding: '4px 6px' }}
                      onClick={() => removeUtterance(idx)}
                      title="Xóa"
                    >
                      <Trash2 size={11} color="var(--danger, #DC2626)" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="action-btn"
                onClick={addUtterance}
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={11} /> Thêm utterance
              </button>
            </div>
            {errors.sampleUtterances && (
              <div style={{ color: 'var(--danger, #DC2626)', fontSize: '0.72rem', marginTop: 4 }}>
                {errors.sampleUtterances.message ??
                  (Array.isArray(errors.sampleUtterances) &&
                    errors.sampleUtterances.find((e) => e?.message)?.message)}
              </div>
            )}
          </div>

          <Controller
            control={control}
            name="responseTemplate"
            render={({ field, fieldState }) => (
              <FormFieldTextarea
                label="Response template"
                required
                rows={5}
                placeholder="Chào anh/chị! Về {{topic}}..."
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                hint='Dùng biến: {{name}}, {{topic}}, {{lawyer_name}}'
              />
            )}
          />

          {/* Handoff rule */}
          <div
            style={{
              padding: 12,
              background: handoffEnabled ? 'var(--blue-faint, #DBEAFE)' : 'var(--gray-50)',
              borderRadius: 8,
              border: handoffEnabled
                ? '1.5px solid var(--blue, #2563EB)'
                : '1.5px solid var(--gray-200)',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--gray-800)',
                cursor: 'pointer',
              }}
            >
              <input type="checkbox" {...register('handoffEnabled')} />
              <Hand size={12} /> Bật handoff rule cho intent này
            </label>
            {handoffEnabled && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <FormFieldInput
                  label="Chuyển tới"
                  placeholder="VD: LS. Hùng"
                  {...register('handoffTo')}
                  error={errors.handoffTo?.message}
                />
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--gray-700)',
                      marginBottom: 6,
                    }}
                  >
                    Trigger keywords (tự động chuyển khi khách nhắc)
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      value={kwInput}
                      onChange={(e) => setKwInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addKeyword();
                        }
                      }}
                      placeholder="VD: gặp luật sư, tư vấn trực tiếp"
                      className="action-btn"
                      style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                    />
                    <button type="button" className="action-btn" onClick={addKeyword}>
                      Thêm
                    </button>
                  </div>
                  {keywords.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {keywords.map((kw, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '3px 8px',
                            background: 'white',
                            color: 'var(--blue, #2563EB)',
                            borderRadius: 999,
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            border: '1px solid var(--blue, #2563EB)',
                          }}
                        >
                          {kw}
                          <button
                            type="button"
                            onClick={() => removeKeyword(idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--blue, #2563EB)',
                              padding: 0,
                              fontSize: '0.85rem',
                              lineHeight: 1,
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.85rem',
              color: 'var(--gray-700)',
            }}
          >
            <input type="checkbox" {...register('isActive')} />
            Intent đang hoạt động
          </label>
        </div>
      </form>
    </Modal>
  );
}