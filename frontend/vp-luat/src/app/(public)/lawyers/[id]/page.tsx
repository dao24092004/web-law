'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Languages,
  Mail,
  MessageSquare,
  Phone,
  Scale,
  ShieldCheck,
  Star,
  Trophy,
} from 'lucide-react';
import { useLawyerBySlug } from '@/features/lawyers/hooks/use-lawyers';
import type { LawyerApiResponse } from '@/features/lawyers/api/lawyers-api';
import { getDisplayLabel } from '@/lib/display-labels';
import { useTranslations } from 'next-intl';

function getSpecialtyLabels(lawyer: LawyerApiResponse): string[] {
  if (lawyer.serviceNames && lawyer.serviceNames.length > 0) {
    return lawyer.serviceNames
      .filter((s): s is string => !!s)
      .map((serviceName) => getDisplayLabel(serviceName, 'Chuyên môn'));
  }
  return (lawyer.specialties ?? []).map((specialty) => getDisplayLabel(specialty, 'Chuyên môn'));
}

function renderStars(rating: number, size = 16) {
  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.floor(rating);
        const half = !filled && n - 0.5 <= rating;
        return (
          <Star
            key={n}
            size={size}
            fill={filled || half ? '#F59E0B' : 'none'}
            stroke={filled || half ? '#F59E0B' : '#D1D5DB'}
          />
        );
      })}
    </div>
  );
}

function getWorkingDays(workingHours?: LawyerApiResponse['workingHours']): string[] {
  if (!workingHours) return [];
  const dayNames: Record<string, string> = {
    monday: 'T2',
    tuesday: 'T3',
    wednesday: 'T4',
    thursday: 'T5',
    friday: 'T6',
    saturday: 'T7',
    sunday: 'CN',
  };
  return Object.keys(workingHours)
    .filter((d) => workingHours[d] !== null)
    .map((d) => dayNames[d] || d);
}

function getWorkingHoursLabel(workingHours?: LawyerApiResponse['workingHours']): string {
  if (!workingHours) return '';
  const slots = Object.values(workingHours).filter(
    (slot): slot is { start: string; end: string } => slot !== null,
  );
  if (slots.length === 0) return '';
  const first = slots[0];
  return `${first.start} - ${first.end}`;
}

export default function LawyerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: lawyer, isLoading } = useLawyerBySlug(id);
  const t = useTranslations('public.lawyerDetail');
  const [imageFailed, setImageFailed] = useState(false);

  if (isLoading) {
    return (
      <main className="lawyer-detail-page">
        <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--gray-500)' }}>{t('loading')}</p>
        </div>
      </main>
    );
  }

  if (!lawyer) {
    return (
      <main className="lawyer-detail-page">
        <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
          <Scale size={56} style={{ color: 'var(--gray-200)', margin: '0 auto 1rem' }} />
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--primary)' }}>
            {t('notFoundTitle')}
          </h1>
          <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
            {t('notFoundDescription')}
          </p>
          <Link href="/lawyers" className="btn btn--primary">
            <ArrowLeft size={18} /> {t('backToList')}
          </Link>
        </div>
      </main>
    );
  }

  const specialtyLabels = getSpecialtyLabels(lawyer);
  const rating = lawyer.rating ?? 0;
  const reviewCount = lawyer.reviewCount ?? 0;
  const successfulCases = lawyer.successfulCases ?? 0;
  const experience = lawyer.experience ?? 0;
  const languages = lawyer.languages ?? ['Tiếng Việt'];
  const showImage = Boolean(lawyer.avatar) && !imageFailed;
  const workingDays = getWorkingDays(lawyer.workingHours);
  const workingHoursLabel = getWorkingHoursLabel(lawyer.workingHours);
  const phoneDisplay = lawyer.phone || '0969 967 389 - 0975 967 364';
  const emailDisplay = lawyer.email || 'contact@icrclaw.com';

  return (
    <main className="lawyer-detail-page">
      <section className="lawyer-detail-hero">
        <div className="lawyer-detail-hero__bg" aria-hidden />
        <div className="container">
          <nav className="lawyer-detail-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Trang chủ</Link>
            <span className="lawyer-detail-breadcrumb__sep" aria-hidden>/</span>
            <Link href="/lawyers">Đội ngũ luật sư</Link>
            <span className="lawyer-detail-breadcrumb__sep" aria-hidden>/</span>
            <span className="lawyer-detail-breadcrumb__current" aria-current="page">
              {lawyer.name}
            </span>
          </nav>

          <div className="lawyer-detail-hero__inner">
            <div className="lawyer-detail-hero__avatar-wrap">
              <div
                className="lawyer-detail-hero__avatar"
                style={showImage ? undefined : { background: lawyer.avatarColor }}
              >
                {showImage ? (
                  <img
                    src={lawyer.avatar}
                    alt={lawyer.name}
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <span>{lawyer.initials}</span>
                )}
              </div>
              <div className="lawyer-detail-hero__avatar-ring" aria-hidden />
              {lawyer.isVerified && (
                <div
                  className="lawyer-detail-hero__verified"
                  aria-label="Đã xác minh"
                  title="Luật sư đã xác minh"
                >
                  <ShieldCheck size={18} aria-hidden />
                </div>
              )}
            </div>

            <div className="lawyer-detail-hero__info">
              <span className="lawyer-detail-hero__eyebrow">
                <Scale size={14} aria-hidden /> Hồ sơ luật sư
              </span>
              <h1 className="lawyer-detail-hero__name">{lawyer.name}</h1>
              <p className="lawyer-detail-hero__position">{lawyer.position}</p>

              {(lawyer.rating !== undefined || lawyer.reviewCount !== undefined) && (
                <div className="lawyer-detail-hero__rating">
                  {renderStars(rating, 18)}
                  <span className="lawyer-detail-hero__rating-score">
                    {rating.toFixed(1)}
                  </span>
                  {reviewCount > 0 && (
                    <span className="lawyer-detail-hero__rating-count">
                      · {reviewCount} đánh giá từ khách hàng
                    </span>
                  )}
                </div>
              )}

              {specialtyLabels.length > 0 && (
                <div className="lawyer-detail-hero__tags">
                  {specialtyLabels.slice(0, 4).map((sp, i) => (
                    <span key={`${sp}-${i}`} className="lawyer-detail-tag">
                      <Briefcase size={12} aria-hidden /> {sp}
                    </span>
                  ))}
                </div>
              )}

              <div className="lawyer-detail-hero__actions">
                <Link
                  href={`/booking?lawyer=${lawyer.id}`}
                  className="lawyer-detail-btn lawyer-detail-btn--primary"
                >
                  <Calendar size={18} aria-hidden /> Đặt lịch tư vấn
                </Link>
                <a href={`tel:${phoneDisplay}`} className="lawyer-detail-btn lawyer-detail-btn--outline">
                  <Phone size={18} aria-hidden /> Gọi điện
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lawyer-detail-section">
        <div className="container">
          <div className="lawyer-detail-grid">
            <div className="lawyer-detail-content">
              <article className="lawyer-detail-card">
                <header className="lawyer-detail-card__header">
                  <div className="lawyer-detail-card__icon">
                    <Scale size={20} aria-hidden />
                  </div>
                  <h2 className="lawyer-detail-card__title">Giới thiệu</h2>
                </header>
                <p className="lawyer-detail-bio">
                  {lawyer.bio || 'Thông tin tiểu sử đang được cập nhật.'}
                </p>
              </article>

              <article className="lawyer-detail-card">
                <header className="lawyer-detail-card__header">
                  <div className="lawyer-detail-card__icon">
                    <Briefcase size={20} aria-hidden />
                  </div>
                  <h2 className="lawyer-detail-card__title">Lĩnh vực chuyên môn</h2>
                </header>
                {specialtyLabels.length > 0 ? (
                  <div className="lawyer-detail-tags-grid">
                    {specialtyLabels.map((sp, i) => (
                      <div key={`${sp}-${i}`} className="lawyer-detail-specialty">
                        <CheckCircle2 size={16} aria-hidden />
                        <span>{sp}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="lawyer-detail-empty">Đang cập nhật lĩnh vực chuyên môn.</p>
                )}
              </article>

              <article className="lawyer-detail-card">
                <header className="lawyer-detail-card__header">
                  <div className="lawyer-detail-card__icon">
                    <Trophy size={20} aria-hidden />
                  </div>
                  <h2 className="lawyer-detail-card__title">Thành tích nổi bật</h2>
                </header>
                <ul className="lawyer-detail-achievements">
                  <li>
                    <Award size={18} aria-hidden />
                    <div>
                      <strong>{experience}+ năm</strong>
                      <span>Kinh nghiệm hành nghề luật</span>
                    </div>
                  </li>
                  {successfulCases > 0 && (
                    <li>
                      <Trophy size={18} aria-hidden />
                      <div>
                        <strong>{successfulCases}+ vụ</strong>
                        <span>Đã tham gia và bảo vệ thành công</span>
                      </div>
                    </li>
                  )}
                  {lawyer.degree && (
                    <li>
                      <GraduationCap size={18} aria-hidden />
                      <div>
                        <strong>{lawyer.degree}</strong>
                        <span>Học vị & chứng chỉ hành nghề</span>
                      </div>
                    </li>
                  )}
                  <li>
                    <Languages size={18} aria-hidden />
                    <div>
                      <strong>{languages.join(', ')}</strong>
                      <span>Ngôn ngữ tư vấn</span>
                    </div>
                  </li>
                </ul>
              </article>

              <article className="lawyer-detail-card lawyer-detail-card--cta">
                <div className="lawyer-detail-cta__icon">
                  <MessageSquare size={28} aria-hidden />
                </div>
                <div>
                  <h3>Bạn cần tư vấn pháp lý chuyên sâu?</h3>
                  <p>
                    Đặt lịch hẹn với {lawyer.name} để được giải đáp các vấn đề pháp lý trong lĩnh vực{' '}
                    {specialtyLabels[0] || 'luật pháp'}.
                  </p>
                </div>
                <Link
                  href={`/booking?lawyer=${lawyer.id}`}
                  className="lawyer-detail-btn lawyer-detail-btn--primary"
                >
                  <Calendar size={18} aria-hidden /> Đặt lịch ngay
                </Link>
              </article>
            </div>

            <aside className="lawyer-detail-sidebar">
              <div className="lawyer-detail-card lawyer-detail-sidebar__card">
                <div
                  className="lawyer-detail-sidebar__avatar"
                  style={showImage ? undefined : { background: lawyer.avatarColor }}
                >
                  {showImage ? (
                    <img
                      src={lawyer.avatar}
                      alt={lawyer.name}
                      onError={() => setImageFailed(true)}
                    />
                  ) : (
                    <span>{lawyer.initials}</span>
                  )}
                </div>
                <h3 className="lawyer-detail-sidebar__name">{lawyer.name}</h3>
                <p className="lawyer-detail-sidebar__position">{lawyer.position}</p>

                <div className="lawyer-detail-stats">
                  <div className="lawyer-detail-stat">
                    <strong>{experience}+</strong>
                    <span>Năm kinh nghiệm</span>
                  </div>
                  {successfulCases > 0 && (
                    <div className="lawyer-detail-stat">
                      <strong>{successfulCases}+</strong>
                      <span>Vụ thành công</span>
                    </div>
                  )}
                  <div className="lawyer-detail-stat">
                    <strong>{rating.toFixed(1)}</strong>
                    <span>Đánh giá</span>
                  </div>
                </div>

                <div className="lawyer-detail-actions">
                  <Link
                    href={`/booking?lawyer=${lawyer.id}`}
                    className="lawyer-detail-btn lawyer-detail-btn--primary"
                  >
                    <Calendar size={16} aria-hidden /> Đặt lịch tư vấn
                  </Link>
                  <a
                    href={`tel:${phoneDisplay}`}
                    className="lawyer-detail-btn lawyer-detail-btn--outline"
                  >
                    <Phone size={16} aria-hidden /> Gọi điện thoại
                  </a>
                </div>
              </div>

              <div className="lawyer-detail-card">
                <h3 className="lawyer-detail-sidebar__heading">
                  <Phone size={16} aria-hidden /> Thông tin liên hệ
                </h3>
                <ul className="lawyer-detail-contact">
                  <li>
                    <div className="lawyer-detail-contact__icon">
                      <Phone size={16} aria-hidden />
                    </div>
                    <div>
                      <span>Điện thoại</span>
                      <a href={`tel:${phoneDisplay}`}>{phoneDisplay}</a>
                    </div>
                  </li>
                  <li>
                    <div className="lawyer-detail-contact__icon">
                      <Mail size={16} aria-hidden />
                    </div>
                    <div>
                      <span>Email</span>
                      <a href={`mailto:${emailDisplay}`}>{emailDisplay}</a>
                    </div>
                  </li>
                  <li>
                    <div className="lawyer-detail-contact__icon">
                      <Building2 size={16} aria-hidden />
                    </div>
                    <div>
                      <span>Văn phòng</span>
                      <span className="lawyer-detail-contact__value">
                        ICRC Law - Tầng 8, Hưng Yên
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              {workingDays.length > 0 && (
                <div className="lawyer-detail-card">
                  <h3 className="lawyer-detail-sidebar__heading">
                    <Clock size={16} aria-hidden /> Giờ làm việc
                  </h3>
                  <div className="lawyer-detail-schedule">
                    <div className="lawyer-detail-schedule__days">
                      {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                        <span
                          key={day}
                          className={
                            workingDays.includes(day) ? 'is-active' : 'is-inactive'
                          }
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                    {workingHoursLabel && (
                      <p className="lawyer-detail-schedule__hours">
                        <Clock size={14} aria-hidden /> {workingHoursLabel}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="lawyer-detail-card lawyer-detail-trust">
                <ShieldCheck size={28} className="lawyer-detail-trust__icon" aria-hidden />
                <h4>Cam kết chất lượng</h4>
                <p>
                  Thông tin luật sư đã được xác minh bởi ICRC Law. Mọi tư vấn đều được bảo mật
                  tuyệt đối.
                </p>
              </div>
            </aside>
          </div>

          <div className="lawyer-detail-back">
            <Link href="/lawyers" className="lawyer-detail-back__link">
              <ArrowLeft size={18} aria-hidden /> Quay lại danh sách luật sư
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
