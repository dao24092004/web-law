'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { replySchema, type ReplyFormValues } from '@/features/admin/schema';

interface ReviewReplyFormProps {
  initial?: string;
  onSubmit: (values: ReplyFormValues) => Promise<void> | void;
  isLoading?: boolean;
  onCancel: () => void;
}

export function ReviewReplyForm({
  initial = '',
  onSubmit,
  isLoading,
  onCancel,
}: ReviewReplyFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: { reply: initial },
  });

  useEffect(() => {
    reset({ reply: initial });
  }, [initial, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--gray-700)',
          }}
        >
          Phản hồi của Văn phòng
        </label>
        <textarea
          rows={4}
          placeholder="Cảm ơn anh/chị đã tin tưởng ICRC Law..."
          {...register('reply')}
          style={{
            padding: '10px 12px',
            border: errors.reply
              ? '1.5px solid #DC2626'
              : '1.5px solid var(--gray-200)',
            borderRadius: 8,
            fontSize: '0.85rem',
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
        {errors.reply && (
          <div style={{ color: '#DC2626', fontSize: '0.72rem' }}>
            {errors.reply.message}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="action-btn" onClick={onCancel} disabled={isLoading}>
            Hủy
          </button>
          <button
            type="submit"
            className="action-btn action-btn--primary"
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {isLoading ? (
              'Đang gửi...'
            ) : (
              <>
                <Save size={12} /> Gửi phản hồi
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}