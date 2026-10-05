'use client';

import { use } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowLeft, Phone, Mail, MapPin } from 'lucide-react';
import { useServiceBySlug } from '@/features/services/hooks/use-services';
import { useLawyers } from '@/features/lawyers/hooks/use-lawyers';
import { ServicesCta } from '@/features/services/components/services-cta';

function safeName(value: unknown, fallback = 'L'): string {
  if (typeof value !== 'string' || value.length === 0) return fallback;
  return value;
}

function safeInitials(value: unknown, fallback = 'L'): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (trimmed.length === 0) return fallback;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const chars = parts.map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase();
  return chars || fallback;
}

export default function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: service, isLoading } = useServiceBySlug(slug);
  const { data: lawyers = [] } = useLawyers(0, 3, slug);

  if (isLoading) {
    return (
      <main className="service-detail">
        <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
          <p>Đang tải dịch vụ...</p>
        </div>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="service-detail">
        <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
          <h1>Dịch vụ không tồn tại</h1>
          <Link href="/services" className="btn btn--primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            <ArrowLeft size={18} /> Quay lại
          </Link>
        </div>
      </main>
    );
  }

  const benefits = (service as { benefits?: string[] }).benefits ?? [];
  const description = service.description || service.shortDescription || 'Đang cập nhật.';
  const features = (service as { features?: string[] }).features ?? [];
  const serviceName = safeName(service.name, 'Dịch vụ');

  return (
    <main className="service-detail">
      {/* Hero Section */}
      <section className="page-hero service-detail-hero">
        <div className="container">
          <div className="page-hero__breadcrumbs">
            <Link href="/">Trang chủ</Link>
            <span>/</span>
            <Link href="/services">Dịch vụ</Link>
            <span>/</span>
            <span>{serviceName}</span>
          </div>
          <h1 className="page-hero__title">{serviceName}</h1>
          <p className="page-hero__subtitle">{service.shortDescription}</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="section">
        <div className="container">
          <div className="service-detail__grid">
            {/* Left Column - Content */}
            <div className="service-detail__main">
              {/* Overview */}
              <div className="service-detail__section">
                <h2 className="service-detail__section-title">Tổng quan dịch vụ</h2>
                <p className="service-detail__desc">{description}</p>
              </div>

              {/* Benefits */}
              {benefits.length > 0 && (
                <div className="service-detail__section">
                  <h2 className="service-detail__section-title">Lợi ích khi sử dụng dịch vụ</h2>
                  <div className="service-detail__features">
                    {benefits.map((b) => (
                      <div key={b} className="service-detail__feature">
                        <div className="service-detail__feature-check">
                          <CheckCircle2 size={14} />
                        </div>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              {features.length > 0 && (
                <div className="service-detail__section">
                  <h2 className="service-detail__section-title">Chi tiết dịch vụ</h2>
                  <div className="service-detail__features">
                    {features.map((f) => (
                      <div key={f} className="service-detail__feature">
                        <div className="service-detail__feature-check">
                          <CheckCircle2 size={14} />
                        </div>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <aside className="service-detail__sidebar">
              {/* Info Card */}
              <div className="service-detail__card">
                <div className="service-detail__card-label">Thông tin dịch vụ</div>
                {service.parentName && (
                  <div className="service-detail__meta-row">
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Danh mục:</span>
                    <span>{service.parentName}</span>
                  </div>
                )}
                {service.duration && (
                  <div className="service-detail__meta-row">
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Thời gian:</span>
                    <span>{service.duration}</span>
                  </div>
                )}
                {service.price != null && (
                  <div className="service-detail__meta-row">
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Phí tư vấn:</span>
                    <strong style={{ color: 'var(--accent)' }}>
                      {new Intl.NumberFormat('vi-VN').format(service.price)}đ
                    </strong>
                  </div>
                )}
                <Link href="/contact" className="service-detail__cta">
                  Đăng ký tư vấn
                </Link>
              </div>

              {/* Contact Card */}
              <div className="service-detail__card">
                <div className="service-detail__card-label">Liên hệ tư vấn</div>
                <div className="service-detail__meta-row">
                  <Phone size={16} />
                  <span>Hotline: 0969 967 389 - 0975 967 364</span>
                </div>
                <div className="service-detail__meta-row">
                  <Mail size={16} />
                  <span>tuvan@vuplat.vn</span>
                </div>
                <div className="service-detail__meta-row">
                  <MapPin size={16} />
                  <span>Hà Nội, TP.HCM, Đà Nẵng</span>
                </div>
              </div>

              {/* Related Lawyers */}
              {lawyers.length > 0 && (
                <div className="service-detail__card">
                  <div className="service-detail__card-label">Luật sư phụ trách</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                    {lawyers.slice(0, 3).map((l) => (
                      <Link key={l.id} href={`/lawyers/${l.slug}`} className="service-detail__lawyer">
                        <div className="service-detail__lawyer-avatar" style={{ background: 'var(--primary)' }}>
                          {safeInitials(l.name)}
                        </div>
                        <div>
                          <div className="service-detail__lawyer-name">{safeName(l.name, 'Luật sư')}</div>
                          <div className="service-detail__lawyer-position">{safeName(l.position, 'Luật sư')}</div>
                          {l.experience && (
                            <div className="service-detail__lawyer-exp">{l.experience} năm kinh nghiệm</div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <ServicesCta />

      {/* Back Link */}
      <div className="container" style={{ marginTop: '24px', marginBottom: '40px' }}>
        <Link href="/services" className="btn btn--outline">
          <ArrowLeft size={18} /> Quay lại danh sách dịch vụ
        </Link>
      </div>
    </main>
  );
}
