'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/lib/api/hooks';
import { landingPageApi, type LandingPage, type LandingPageBlock } from '@/lib/api/admin-landing-pages';
import { ghiAudit, notifySuccess, notifyError } from '@/features/admin/lib';

export function useLandingPages() {
  const { data, error, isLoading, refetch } = useApiQuery<LandingPage[]>(
    ['admin', 'landing-pages'],
    '/admin/landing-pages',
    {},
    { retry: false },
  );
  return { data: data ?? [], error, isLoading, refetch };
}

export function useLandingPage(id: string | null) {
  const { data, error, isLoading } = useApiQuery<LandingPage>(
    ['admin', 'landing-page', id ?? ''],
    id ? '/admin/landing-pages/' + id : '/admin/landing-pages',
    {},
    { enabled: Boolean(id) },
  );
  return { data, error, isLoading };
}

export function useCreateLandingPage() {
  const qc = useQueryClient();
  return useCallback(
    async (page: Partial<LandingPage>): Promise<string | null> => {
      try {
        const created = await landingPageApi.create(page);
        qc.invalidateQueries({ queryKey: ['admin', 'landing-pages'] });
        ghiAudit({
          action: 'create',
          entity: 'landing_page',
          entityId: created.id,
          entityLabel: created.title ?? created.slug,
        });
        notifySuccess('Đã tạo landing page');
        return created.id;
      } catch (err) {
        notifyError('Lỗi', (err as Error).message);
        return null;
      }
    },
    [qc],
  );
}

export function useUpdateLandingPage() {
  const qc = useQueryClient();
  return useCallback(
    async (id: string, patch: Partial<LandingPage>) => {
      try {
        const updated = await landingPageApi.update(id, patch);
        qc.invalidateQueries({ queryKey: ['admin', 'landing-pages'] });
        qc.invalidateQueries({ queryKey: ['admin', 'landing-page', id] });
        ghiAudit({
          action: 'update',
          entity: 'landing_page',
          entityId: id,
          entityLabel: updated.title ?? updated.slug,
          diff: { before: { id }, after: patch },
        });
        notifySuccess('Đã cập nhật landing page');
        return true;
      } catch (err) {
        notifyError('Lỗi', (err as Error).message);
        return false;
      }
    },
    [qc],
  );
}

export function useDeleteLandingPage() {
  const qc = useQueryClient();
  return useCallback(
    async (id: string, title?: string) => {
      try {
        await landingPageApi.delete(id);
        qc.invalidateQueries({ queryKey: ['admin', 'landing-pages'] });
        ghiAudit({
          action: 'delete',
          entity: 'landing_page',
          entityId: id,
          entityLabel: title ?? id,
        });
        notifySuccess('Đã xóa landing page');
        return true;
      } catch (err) {
        notifyError('Lỗi', (err as Error).message);
        return false;
      }
    },
    [qc],
  );
}

export function usePublishLandingPage() {
  const qc = useQueryClient();
  return useCallback(
    async (id: string, publish: boolean) => {
      try {
        const updated = publish
          ? await landingPageApi.publish(id)
          : await landingPageApi.unpublish(id);
        qc.invalidateQueries({ queryKey: ['admin', 'landing-pages'] });
        qc.invalidateQueries({ queryKey: ['admin', 'landing-page', id] });
        ghiAudit({
          action: publish ? 'publish' : 'unpublish',
          entity: 'landing_page',
          entityId: id,
          entityLabel: updated.title ?? id,
        });
        notifySuccess(publish ? 'Đã xuất bản landing page' : 'Đã hủy xuất bản');
        return true;
      } catch (err) {
        notifyError('Lỗi', (err as Error).message);
        return false;
      }
    },
    [qc],
  );
}

// ─── Block helpers ──────────────────────────────────────────────────────────

export type BlockType = LandingPageBlock['type'];

export const BLOCK_TYPES: Array<{
  type: BlockType;
  label: string;
  icon: string;
  description: string;
}> = [
  { type: 'hero', label: 'Hero Banner', icon: '🎯', description: 'Tiêu đề lớn + hình ảnh + CTA' },
  { type: 'features', label: 'Features Grid', icon: '✨', description: 'Danh sách tính năng/dịch vụ' },
  { type: 'testimonials', label: 'Testimonials', icon: '💬', description: 'Đánh giá khách hàng' },
  { type: 'stats', label: 'Stats Counter', icon: '📊', description: 'Số liệu ấn tượng' },
  { type: 'cta', label: 'Call to Action', icon: '📞', description: 'Nút kêu gọi hành động' },
  { type: 'faq', label: 'FAQ Accordion', icon: '❓', description: 'Câu hỏi thường gặp' },
  { type: 'text', label: 'Text Block', icon: '📝', description: 'Văn bản tự do' },
  { type: 'image', label: 'Image', icon: '🖼️', description: 'Hình ảnh đơn lẻ' },
  { type: 'video', label: 'Video', icon: '🎬', description: 'Video embed' },
  { type: 'form', label: 'Lead Form', icon: '📋', description: 'Form thu thập lead' },
];

type BlockPropsMap = {
  hero: { title: string; subtitle: string; ctaText: string; ctaLink: string; backgroundImage: string };
  features: { title: string; items: unknown[] };
  testimonials: { title: string; items: unknown[] };
  stats: { title: string; items: unknown[] };
  cta: { title: string; subtitle: string; buttonText: string; buttonLink: string };
  faq: { title: string; items: unknown[] };
  text: { content: string };
  image: { src: string; alt: string; caption: string };
  video: { url: string; poster: string; title: string };
  form: { title: string; fields: string[]; submitText: string };
};

export function createBlock<T extends BlockType>(type: T, order: number): LandingPageBlock {
  const defaultProps: BlockPropsMap = {
    hero: { title: '', subtitle: '', ctaText: 'Liên hệ ngay', ctaLink: '/contact', backgroundImage: '' },
    features: { title: '', items: [] },
    testimonials: { title: '', items: [] },
    stats: { title: '', items: [] },
    cta: { title: '', subtitle: '', buttonText: 'Đăng ký tư vấn', buttonLink: '/booking' },
    faq: { title: '', items: [] },
    text: { content: '' },
    image: { src: '', alt: '', caption: '' },
    video: { url: '', poster: '', title: '' },
    form: { title: '', fields: ['name', 'phone', 'email', 'message'], submitText: 'Gửi' },
  };
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    props: defaultProps[type] as Record<string, unknown>,
    order,
  };
}
