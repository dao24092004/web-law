# Phase 2: Public Pages + Landing Pages Builder
## Week 3-4 — Công ty Luật TNHH ICRC

---

## Phase Overview

**Mục tiêu**: Xây dựng website công khai **giống 100%** demo tại `frontend/demo/index.html` với landing page builder cho chiến dịch marketing.

**Design Reference**: `frontend/demo/index.html` — **ĐÂY LÀ NGUỒN THAM KHAO CHÍNH XÁC**

**Timeline**: Week 3-4 (14 ngày)
**Ship Criteria**: Tất cả public pages hoạt động giống demo + Landing Page Builder

---

## Demo Structure Analysis

Dựa trên `frontend/demo/index.html`, homepage có cấu trúc sau:

```
1. Navbar (fixed, scroll effect)
2. Hero Section (full viewport, background image, badge, title, stats, CTAs, hotline)
3. Stats Bar (floating at hero bottom, 3 columns)
4. Services Section (4-column grid)
5. Team/Lawyers Section (4-column grid)
6. Why Choose Us Section (2-column grid)
7. Testimonials Section (slider with dots/arrows)
8. News/Blog Section (3-column grid)
9. FAQ Section (accordion)
10. Contact Section (form + info)
11. Footer (4-column)
12. Chatbot Widget (floating)
13. Floating Widgets (Zalo, Phone, Back-to-top)
```

---

## Task Breakdown

### Week 3: Homepage Implementation (Day 15-21)

#### Task 2.1: Design Tokens + Globals (Day 15)

**Mục tiêu**: Copy chính xác CSS variables từ demo

**CSS Variables cần copy** (từ demo lines 22-60):

```css
/* src/app/globals.css */

/* Design tokens - TRÙNG VỚI DEMO */
:root {
  --primary: #1E3A5F;
  --primary-dark: #152A45;
  --primary-light: #2A4F7A;
  --accent: #C9A84C;
  --accent-dark: #B8953D;
  --accent-light: #D4B76A;
  --white: #FFFFFF;
  --off-white: #F8F9FA;
  --gray-50: #F8F9FA;
  --gray-100: #F0F2F5;
  --gray-200: #E4E8EF;
  --gray-300: #CBD2DC;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --text-primary: #1E3A5F;
  --text-secondary: #4B5563;
  --text-muted: #6B7280;
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.07);
  --shadow-md: 0 4px 20px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 40px rgba(0,0,0,0.12);
  --shadow-xl: 0 16px 60px rgba(0,0,0,0.15);
  --shadow-card: 0 4px 20px rgba(0,0,0,0.06);
  --shadow-card-hover: 0 12px 40px rgba(0,0,0,0.12);
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  --transition-fast: 0.2s ease;
  --transition-base: 0.3s ease;
  --transition-slow: 0.5s ease;
  --font-heading: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --font-body: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

**Utility Classes** (từ demo lines 86-154):

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.section {
  padding: 80px 0;
}

.section--gray { background: var(--gray-50); }
.section--dark { background: var(--primary); color: var(--white); }

.section__header { text-align: center; margin-bottom: 56px; }

.section__label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 12px;
  padding: 4px 16px;
  background: rgba(201,168,76,0.1);
  border-radius: var(--radius-full);
  border: 1px solid rgba(201,168,76,0.2);
}

.section__title {
  font-family: var(--font-heading);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  color: var(--primary);
  line-height: 1.2;
  margin-bottom: 16px;
}

.section__subtitle {
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
}
```

**Button Classes** (từ demo lines 159-237):

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 28px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  transition: all var(--transition-base);
  cursor: pointer;
  white-space: nowrap;
  border: 2px solid transparent;
}

.btn--primary {
  background: var(--accent);
  color: var(--primary-dark);
  border-color: var(--accent);
}

.btn--outline {
  background: transparent;
  color: var(--white);
  border-color: rgba(255,255,255,0.6);
}

.btn--outline-dark {
  background: transparent;
  color: var(--primary);
  border-color: var(--primary);
}
```

**Exit Criteria**:
- [ ] CSS variables giống 100% demo
- [ ] Font loading: Cormorant Garamond + Plus Jakarta Sans
- [ ] All utility classes hoạt động

---

#### Task 2.2: Navbar Component (Day 15-16)

**Mục tiêu**: Navbar giống demo (lines 242-490)

**Features**:
- Fixed position, transparent → white on scroll
- Logo: icon box + text
- Menu items với hover effect
- Language switcher (VI/EN)
- CTA button
- Mobile hamburger menu

**Implementation**:

```typescript
// src/components/layout/navbar/navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUIStore } from '@/stores/ui.store';

const NAV_ITEMS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Dịch vụ', href: '/dich-vu' },
  { label: 'Luật sư', href: '/luat-su' },
  { label: 'Blog', href: '/blog' },
  { label: 'Tin tức', href: '/tin-tuc' },
  { label: 'Liên hệ', href: '/lien-he' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { mobileMenuOpen, toggleMobileMenu } = useUIStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar__inner">
        {/* Logo */}
        <Link href="/" className="navbar__logo">
          <div className="navbar__logo-icon">VP</div>
          <div className="navbar__logo-text">
            <span className="navbar__logo-name">ICRC Law</span>
            <span className="navbar__logo-sub">Law Firm</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <ul className="navbar__menu">
          {NAV_ITEMS.map(item => (
            <li key={item.href} className="navbar__menu-item">
              <Link href={item.href} className="navbar__menu-link">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="navbar__actions">
          <div className="navbar__lang">
            <button className="navbar__lang-btn active">VI</button>
            <button className="navbar__lang-btn">EN</button>
          </div>
          <Link href="/lien-he" className="navbar__cta">
            Đặt lịch tư vấn
          </Link>
          <button
            className={`navbar__hamburger ${mobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href} className="mobile-menu__link">
            {item.label}
          </Link>
        ))}
        <div className="mobile-menu__divider" />
        <Link href="/lien-he" className="mobile-menu__cta">
          Đặt lịch tư vấn
        </Link>
      </div>
    </nav>
  );
}
```

**Navbar CSS** (từ demo lines 242-490):

```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition: all var(--transition-base);
  background: transparent;
}

.navbar.scrolled {
  background: var(--white);
  box-shadow: var(--shadow-md);
}

.navbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  gap: 24px;
}

.navbar__logo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.navbar__logo-icon {
  width: 40px;
  height: 40px;
  background: var(--accent);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--primary-dark);
  font-family: var(--font-heading);
}

.navbar__logo-name {
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--white);
  transition: color var(--transition-base);
}

.navbar.scrolled .navbar__logo-name { color: var(--primary); }
```

**Exit Criteria**:
- [ ] Transparent on top, white on scroll
- [ ] Mobile menu toggle hoạt động
- [ ] Language switcher UI

---

#### Task 2.3: Hero Section (Day 16)

**Mục tiêu**: Hero giống demo (lines 492-660)

**Features**:
- Full viewport height
- Background image với gradient overlay
- Badge: "15+ năm kinh nghiệm"
- Title với highlight text
- Stats pills
- CTAs
- Hotline banner

**Implementation**:

```typescript
// src/components/home/hero-section.tsx
'use client';

import Link from 'next/link';
import { Calendar, Briefcase, Users, Phone } from 'lucide-react';

const HERO_STATS = [
  { icon: Calendar, text: '15+ năm kinh nghiệm' },
  { divider: true },
  { icon: Briefcase, text: '2.000+ vụ việc thành công' },
  { divider: true },
  { icon: Users, text: '50+ luật sư chuyên nghiệp' },
];

export function HeroSection() {
  return (
    <section className="hero">
      <div className="hero__bg">
        <img
          src="/images/hero-bg.jpg"
          alt="ICRC Law"
          priority
        />
      </div>
      <div className="hero__overlay" />

      <div className="container hero__content">
        <div className="hero__badge">
          <span className="hero__badge-dot" />
          15+ năm kinh nghiệm tư vấn pháp lý
        </div>

        <h1 className="hero__title">
          Giải Pháp Pháp Lý <em>Toàn Diện</em><br />
          Cho Doanh Nghiệp & Cá Nhân
        </h1>

        <div className="hero__stats">
          {HERO_STATS.map((stat, i) =>
            'divider' in stat ? (
              <span key={i} className="hero__stat-divider" />
            ) : (
              <div key={i} className="hero__stat">
                <stat.icon className="hero__stat-icon" size={16} />
                <span>{stat.text}</span>
              </div>
            )
          )}
        </div>

        <div className="hero__ctas">
          <Link href="/lien-he" className="btn btn--primary btn--lg">
            Đặt lịch tư vấn ngay
          </Link>
          <Link href="/dich-vu" className="btn btn--outline btn--lg">
            Khám phá dịch vụ
          </Link>
        </div>

        <div className="hero__hotline">
          <div className="hero__hotline-icon">
            <Phone size={20} />
          </div>
          <div className="hero__hotline-info">
            <span className="hero__hotline-label">Tư vấn miễn phí</span>
            <span className="hero__hotline-number">1900 1234</span>
          </div>
        </div>
      </div>

      <div className="stats-bar">
        <div className="container">
          <div className="stats-bar__inner">
            <div className="stats-bar__item">
              <div className="stats-bar__number">15<span className="counter-suffix">+</span></div>
              <div className="stats-bar__label">Năm kinh nghiệm</div>
              <div className="stats-bar__sublabel">Hoạt động từ 2009</div>
            </div>
            <div className="stats-bar__item">
              <div className="stats-bar__number">2.000<span className="counter-suffix">+</span></div>
              <div className="stats-bar__label">Vụ việc thành công</div>
              <div className="stats-bar__sublabel">Tỷ lệ thắng 95%</div>
            </div>
            <div className="stats-bar__item">
              <div className="stats-bar__number">50<span className="counter-suffix">+</span></div>
              <div className="stats-bar__label">Luật sư chuyên nghiệp</div>
              <div className="stats-bar__sublabel">Thạc sĩ, Tiến sĩ luật</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Hero CSS** (từ demo lines 492-720):

```css
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.hero__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero__bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(30,58,95,0.92) 0%,
    rgba(30,58,95,0.75) 50%,
    rgba(21,42,69,0.85) 100%
  );
  z-index: 1;
}

.hero__content {
  position: relative;
  z-index: 2;
  padding-top: 100px;
  padding-bottom: 80px;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(201,168,76,0.15);
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: var(--radius-full);
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 28px;
  backdrop-filter: blur(8px);
}

.hero__title {
  font-family: var(--font-heading);
  font-size: clamp(2.2rem, 6vw, 3.75rem);
  font-weight: 700;
  color: var(--white);
  line-height: 1.15;
  margin-bottom: 20px;
  max-width: 720px;
}

.hero__title em {
  color: var(--accent);
  font-style: normal;
}

.hero__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 36px;
}

.hero__stat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  color: rgba(255,255,255,0.9);
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.stats-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3;
}

.stats-bar__inner {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: var(--white);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: 0 -8px 40px rgba(0,0,0,0.15);
  overflow: hidden;
}

.stats-bar__item {
  padding: 28px 20px;
  text-align: center;
  position: relative;
}

.stats-bar__item + .stats-bar__item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  height: 60%;
  width: 1px;
  background: var(--gray-200);
}

.stats-bar__number {
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
}

.stats-bar__number .counter-suffix { color: var(--accent); font-size: 0.8em; }
```

**Exit Criteria**:
- [ ] Full viewport height
- [ ] Background image + gradient overlay
- [ ] Stats bar floating at bottom

---

#### Task 2.4: Services Section (Day 16-17)

**Mục tiêu**: Services grid giống demo (lines 724-798)

**Features**:
- 4-column grid
- Service cards với icon, name, description, link
- Hover effect với top border animation

**Implementation**:

```typescript
// src/components/home/services-section.tsx
'use client';

import Link from 'next/link';
import {
  Building2,
  Home,
  Scale,
  Shield,
  Briefcase,
  Landmark,
  FileText,
  Users,
  ArrowRight,
} from 'lucide-react';

const SERVICES = [
  {
    icon: Building2,
    name: 'Luật Doanh nghiệp',
    desc: 'Tư vấn thành lập, M&A, giải thể doanh nghiệp',
    href: '/dich-vu/luat-doanh-nghiep',
  },
  {
    icon: Home,
    name: 'Luật Đất đai',
    desc: 'Chuyển nhượng, thuê, thế chấp, tranh chấp đất đai',
    href: '/dich-vu/luat-dat-dai',
  },
  {
    icon: Scale,
    name: 'Luật Dân sự',
    desc: 'Hợp đồng, bồi thường, thừa kế, ly hôn',
    href: '/dich-vu/luat-dan-su',
  },
  {
    icon: Shield,
    name: 'Luật Hình sự',
    desc: 'Bào chữa, bảo vệ quyền lợi bị can, bị cáo',
    href: '/dich-vu/luat-hinh-su',
  },
  {
    icon: Briefcase,
    name: 'Luật Lao động',
    desc: 'Hợp đồng, tranh chấp, bảo hiểm xã hội',
    href: '/dich-vu/luat-lao-dong',
  },
  {
    icon: Landmark,
    name: 'Luật Hành chính',
    desc: 'Khiếu nại, tố cáo, thủ tục hành chính',
    href: '/dich-vu/luat-hanh-chinh',
  },
  {
    icon: FileText,
    name: 'Soạn thảo hợp đồng',
    desc: 'Hợp đồng thương mại, lao động, bất động sản',
    href: '/dich-vu/soan-thao-hop-dong',
  },
  {
    icon: Users,
    name: 'Đại diện theo ủy quyền',
    desc: 'Đại diện giải quyết tranh chấp tại tòa',
    href: '/dich-vu/dai-dien-uy-quyen',
  },
];

export function ServicesSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="section__header">
          <span className="section__label">Dịch vụ</span>
          <h2 className="section__title">Giải Pháp Pháp Lý Toàn Diện</h2>
          <p className="section__subtitle">
            Chúng tôi cung cấp đa dạng các dịch vụ pháp lý cho cá nhân và doanh nghiệp
          </p>
        </div>

        <div className="services__grid">
          {SERVICES.map((service) => (
            <Link key={service.href} href={service.href} className="service-card">
              <service.icon className="service-card__icon" size={48} strokeWidth={1.5} />
              <h3 className="service-card__name">{service.name}</h3>
              <p className="service-card__desc">{service.desc}</p>
              <span className="service-card__link">
                Tìm hiểu thêm <ArrowRight className="service-card__arrow" size={14} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Services CSS** (từ demo lines 724-798):

```css
.services__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.service-card {
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  text-align: center;
  transition: all var(--transition-base);
  border: 1px solid var(--gray-200);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.service-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), var(--accent-dark));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--transition-base);
}

.service-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-card-hover);
  border-color: transparent;
}

.service-card:hover::before { transform: scaleX(1); }

.service-card__icon {
  margin-bottom: 16px;
  color: var(--primary);
  transition: transform var(--transition-base);
}

.service-card:hover .service-card__icon { transform: scale(1.15); }

.service-card__name {
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 10px;
}

.service-card__desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.service-card__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent-dark);
  transition: gap var(--transition-fast);
}

.service-card:hover .service-card__link { gap: 10px; }
```

**Exit Criteria**:
- [ ] 4-column responsive grid
- [ ] Card hover animation
- [ ] Top border reveal on hover

---

#### Task 2.5: Lawyers/Team Section (Day 17)

**Mục tiêu**: Team grid giống demo (lines 801-970)

**Implementation**:

```typescript
// src/components/home/lawyers-section.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Linkedin, Calendar } from 'lucide-react';

const LAWYERS = [
  {
    name: 'Nguyễn Văn Hùng',
    position: 'Luật sư - Giám đốc',
    tags: ['Doanh nghiệp', 'M&A'],
    experience: '18 năm kinh nghiệm',
    image: '/images/lawyers/lawyer-1.jpg',
  },
  {
    name: 'Trần Thị Mai Lan',
    position: 'Luật sư cao cấp',
    tags: ['Đất đai', 'Dân sự'],
    experience: '15 năm kinh nghiệm',
    image: '/images/lawyers/lawyer-2.jpg',
  },
  {
    name: 'Lê Minh Đức',
    position: 'Luật sư',
    tags: ['Hình sự', 'Lao động'],
    experience: '12 năm kinh nghiệm',
    image: '/images/lawyers/lawyer-3.jpg',
  },
  {
    name: 'Phạm Thu Hà',
    position: 'Luật sư',
    tags: ['Hành chính', 'Đất đai'],
    experience: '10 năm kinh nghiệm',
    image: '/images/lawyers/lawyer-4.jpg',
  },
];

export function LawyersSection() {
  return (
    <section className="section section--gray">
      <div className="container">
        <div className="section__header">
          <span className="section__label">Đội ngũ</span>
          <h2 className="section__title">Luật Sư Chuyên Nghiệp</h2>
          <p className="section__subtitle">
            Đội ngũ luật sư giàu kinh nghiệm, tận tâm với khách hàng
          </p>
        </div>

        <div className="team__grid">
          {LAWYERS.map((lawyer) => (
            <div key={lawyer.name} className="lawyer-card">
              <div className="lawyer-card__image">
                <Image
                  src={lawyer.image}
                  alt={lawyer.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  style={{ objectFit: 'cover' }}
                />
                <div className="lawyer-card__avatar">
                  {lawyer.name.split(' ').slice(-1)[0]}
                </div>
                <div className="lawyer-card__overlay">
                  <div className="lawyer-card__socials">
                    <a href="#" className="lawyer-card__social">
                      <Facebook size={16} />
                    </a>
                    <a href="#" className="lawyer-card__social">
                      <Linkedin size={16} />
                    </a>
                  </div>
                </div>
              </div>
              <div className="lawyer-card__body">
                <h3 className="lawyer-card__name">{lawyer.name}</h3>
                <p className="lawyer-card__position">{lawyer.position}</p>
                <div className="lawyer-card__tags">
                  {lawyer.tags.map((tag) => (
                    <span key={tag} className="lawyer-card__tag">{tag}</span>
                  ))}
                </div>
                <div className="lawyer-card__experience">
                  <span className="lawyer-card__exp-icon">
                    <Calendar size={14} />
                  </span>
                  <span className="lawyer-card__exp-text">
                    <strong>{lawyer.experience}</strong>
                  </span>
                </div>
                <Link href={`/luat-su/${lawyer.name.toLowerCase().replace(/\s+/g, '-')}`} className="lawyer-card__btn">
                  Xem hồ sơ
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Lawyers CSS** (từ demo lines 801-970):

```css
.team__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 28px;
}

.lawyer-card {
  background: var(--white);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: all var(--transition-base);
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-card);
}

.lawyer-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-card-hover);
}

.lawyer-card__image {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
}

.lawyer-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.lawyer-card:hover .lawyer-card__image img { transform: scale(1.05); }

.lawyer-card__avatar {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: 3.5rem;
  font-weight: 700;
  color: rgba(255,255,255,0.3);
}

.lawyer-card__overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(transparent, rgba(30,58,95,0.9));
  opacity: 0;
  transition: opacity var(--transition-base);
}

.lawyer-card:hover .lawyer-card__overlay { opacity: 1; }

.lawyer-card__socials {
  display: flex;
  gap: 8px;
}

.lawyer-card__social {
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white);
}

.lawyer-card__social:hover {
  background: var(--accent);
  color: var(--primary-dark);
}

.lawyer-card__body {
  padding: 24px 20px;
}

.lawyer-card__name {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 4px;
}

.lawyer-card__position {
  font-size: 0.82rem;
  color: var(--accent-dark);
  font-weight: 600;
  margin-bottom: 12px;
}

.lawyer-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.lawyer-card__tag {
  padding: 3px 10px;
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.lawyer-card__experience {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  border-top: 1px solid var(--gray-200);
  margin-bottom: 12px;
}

.lawyer-card__exp-icon {
  width: 28px;
  height: 28px;
  background: rgba(201,168,76,0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-dark);
}

.lawyer-card__btn {
  display: block;
  width: 100%;
  padding: 10px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary);
  border: 1.5px solid var(--primary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-base);
}

.lawyer-card__btn:hover {
  background: var(--primary);
  color: var(--white);
}
```

---

#### Task 2.6: Why Choose Us Section (Day 17)

**Mục tiêu**: Why Choose Us giống demo (lines 972-1040)

```typescript
// src/components/home/why-choose-section.tsx
'use client';

import { Zap, Target, DollarSign, Shield } from 'lucide-react';

const WHY_CHOOSE = [
  {
    icon: Zap,
    title: 'Phản hồi nhanh chóng',
    desc: 'Luôn sẵn sàng tư vấn 24/7. Phản hồi trong vòng 2 giờ trong giờ làm việc.',
  },
  {
    icon: Target,
    title: 'Giải pháp tối ưu',
    desc: 'Phân tích chi tiết, đề xuất giải pháp phù hợp nhất với tình huống cụ thể.',
  },
  {
    icon: DollarSign,
    title: 'Chi phí hợp lý',
    desc: 'Minh bạch về giá. Nhiều gói dịch vụ phù hợp với mọi ngân sách.',
  },
  {
    icon: Shield,
    title: 'Bảo mật tuyệt đối',
    desc: 'Thông tin khách hàng được bảo mật theo đạo đức luật sư.',
  },
];

export function WhyChooseSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="section__header">
          <span className="section__label">Tại sao chọn chúng tôi</span>
          <h2 className="section__title">Vì Sao Chọn ICRC Law?</h2>
        </div>

        <div className="why__grid">
          {WHY_CHOOSE.map((item) => (
            <div key={item.title} className="why-card">
              <div className="why-card__icon">
                <item.icon size={24} />
              </div>
              <div className="why-card__content">
                <h3 className="why-card__title">{item.title}</h3>
                <p className="why-card__desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

#### Task 2.7: Testimonials Section (Day 18)

**Mục tiêu**: Testimonials slider giống demo (lines 1041-1187)

```typescript
// src/components/home/testimonials-section.tsx
'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    text: 'Đội ngũ luật sư rất chuyên nghiệp và tận tâm. Họ đã giúp tôi giải quyết vụ tranh chấp đất đai một cách nhanh chóng và hiệu quả. Tôi rất hài lòng với dịch vụ!',
    author: 'Nguyễn Thị A',
    role: 'Khách hàng cá nhân',
    avatar: 'A',
  },
  {
    text: 'Chúng tôi đã sử dụng dịch vụ tư vấn pháp lý cho doanh nghiệp trong suốt 3 năm qua. Đội ngũ luật sư luôn hỗ trợ chúng tôi kịp thời và chính xác.',
    author: 'Trần Văn B',
    role: 'Giám đốc Công ty ABC',
    avatar: 'B',
  },
  {
    text: 'Quy trình tư vấn rất chuyên nghiệp, nhân viên thân thiện. Chi phí hợp lý và chất lượng dịch vụ vượt trội. Tôi sẽ giới thiệu cho bạn bè.',
    author: 'Lê Thị C',
    role: 'Khách hàng cá nhân',
    avatar: 'C',
  },
];

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => (c + 1) % TESTIMONIALS.length);
  const prev = () => setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

  return (
    <section className="section section--dark">
      <div className="container">
        <div className="section__header">
          <span className="section__label">Đánh giá</span>
          <h2 className="section__title section__title--white">Khách Hàng Nói Gì?</h2>
        </div>

        <div className="testimonials__slider">
          <div
            className="testimonials__track"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-card__inner">
                  <span className="testimonial-card__quote-icon">"</span>
                  <div className="testimonial-card__stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={16} className="testimonial-card__star" fill="currentColor" />
                    ))}
                  </div>
                  <p className="testimonial-card__text">{t.text}</p>
                  <div className="testimonial-card__author">
                    <div className="testimonial-card__avatar">{t.avatar}</div>
                    <div>
                      <div className="testimonial-card__name">{t.author}</div>
                      <div className="testimonial-card__role">{t.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="testimonials__controls">
          <button onClick={prev} className="testimonials__arrow">
            <ChevronLeft size={18} />
          </button>
          <div className="testimonials__dots">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                className={`testimonials__dot ${i === current ? 'active' : ''}`}
                onClick={() => setCurrent(i)}
              />
            ))}
          </div>
          <button onClick={next} className="testimonials__arrow">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
```

---

#### Task 2.8: FAQ Section (Day 18)

**Mục tiêu**: FAQ accordion giống demo (lines 1315-1395)

```typescript
// src/components/home/faq-section.tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

const FAQS = [
  {
    q: 'Tôi có thể đặt lịch tư vấn như thế nào?',
    a: 'Bạn có thể đặt lịch tư vấn qua hotline 1900 1234, Zalo, hoặc điền form trên website. Chúng tôi sẽ phản hồi trong vòng 2 giờ.',
  },
  {
    q: 'Chi phí tư vấn pháp lý là bao nhiêu?',
    a: 'Chi phí phụ thuộc vào loại dịch vụ và độ phức tạp của vụ việc. Chúng tôi cung cấp báo giá minh bạch trước khi bắt đầu tư vấn.',
  },
  {
    q: 'Thời gian giải quyết vụ việc thường kéo dài bao lâu?',
    a: 'Thời gian phụ thuộc vào tính chất vụ việc. Tư vấn nhanh trong ngày, tranh chấp phức tạp có thể từ vài tháng đến vài năm.',
  },
  {
    q: 'Luật sư có hỗ trợ ngoài giờ không?',
    a: 'Chúng tôi có đội ngũ trực hotline 24/7. Với khách hàng VIP, luật sư có thể sắp xếp gặp ngoài giờ hành chính.',
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="section">
      <div className="container">
        <div className="section__header">
          <span className="section__label">FAQ</span>
          <h2 className="section__title">Câu Hỏi Thường Gặp</h2>
        </div>

        <div className="faq__container">
          {FAQS.map((faq, i) => (
            <div key={i} className={`faq-item ${open === i ? 'active' : ''}`}>
              <button
                className="faq-item__question"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {faq.q}
                <span className="faq-item__icon">
                  <Plus size={14} />
                </span>
              </button>
              <div className="faq-item__answer">
                <div className="faq-item__answer-inner">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**FAQ CSS** (từ demo lines 1315-1395):

```css
.faq__container {
  max-width: 760px;
  margin: 0 auto;
}

.faq-item {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  margin-bottom: 12px;
  overflow: hidden;
}

.faq-item.active {
  border-color: var(--accent);
  box-shadow: 0 4px 16px rgba(201,168,76,0.12);
}

.faq-item__question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--primary);
  gap: 16px;
}

.faq-item__icon {
  width: 28px;
  height: 28px;
  background: var(--gray-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  transition: all var(--transition-base);
}

.faq-item.active .faq-item__icon {
  background: var(--accent);
  color: var(--primary-dark);
  transform: rotate(45deg);
}

.faq-item__answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.faq-item.active .faq-item__answer { max-height: 500px; }

.faq-item__answer-inner {
  padding: 0 24px 20px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.8;
}
```

---

#### Task 2.9: Contact Section (Day 19)

**Mục tiêu**: Contact form + info giống demo (lines 1396-1548)

```typescript
// src/components/home/contact-section.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

const contactSchema = z.object({
  name: z.string().min(2, 'Vui lòng nhập họ tên'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  service: z.string().optional(),
  message: z.string().min(10, 'Vui lòng nhập nội dung'),
});

export function ContactSection() {
  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      service: '',
      message: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof contactSchema>) => {
    try {
      await apiClient.post('/api/contacts', data);
      toast.success('Gửi yêu cầu thành công! Chúng tôi sẽ liên hệ sớm.');
      form.reset();
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  return (
    <section className="section section--gray" id="contact">
      <div className="container">
        <div className="contact__grid">
          {/* Form */}
          <div className="contact-form">
            <h3 className="contact-form__title">Gửi yêu cầu tư vấn</h3>
            <p className="contact-form__subtitle">Chúng tôi sẽ phản hồi trong vòng 2 giờ</p>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="form-group">
                <label>Họ và tên *</label>
                <input {...form.register('name')} placeholder="Nhập họ và tên" />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input {...form.register('email')} type="email" placeholder="email@example.com" />
              </div>

              <div className="form-group">
                <label>Số điện thoại *</label>
                <input {...form.register('phone')} placeholder="09xx xxx xxx" />
              </div>

              <div className="form-group">
                <label>Dịch vụ quan tâm</label>
                <select {...form.register('service')}>
                  <option value="">Chọn dịch vụ</option>
                  <option value="doanh-nghiep">Luật Doanh nghiệp</option>
                  <option value="dat-dai">Luật Đất đai</option>
                  <option value="dan-su">Luật Dân sự</option>
                  <option value="hinh-su">Luật Hình sự</option>
                  <option value="lao-dong">Luật Lao động</option>
                  <option value="khac">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nội dung *</label>
                <textarea {...form.register('message')} placeholder="Mô tả vấn đề của bạn..." rows={5} />
              </div>

              <button type="submit" className="btn btn--primary btn--full btn--lg">
                <Send size={18} />
                Gửi yêu cầu
              </button>
            </form>
          </div>

          {/* Info */}
          <div className="contact-info">
            <h3 className="contact-info__title">Liên hệ với chúng tôi</h3>

            <div className="contact-info__items">
              <div className="contact-info__item">
                <div className="contact-info__icon">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="contact-info__label">Địa chỉ</div>
                  <div className="contact-info__value">
                    Tầng 15, Tòa nhà ABC, 123 Nguyễn Huệ, Quận 1, TP.HCM
                  </div>
                </div>
              </div>

              <div className="contact-info__item">
                <div className="contact-info__icon">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="contact-info__label">Hotline</div>
                  <div className="contact-info__value">1900 1234</div>
                </div>
              </div>

              <div className="contact-info__item">
                <div className="contact-info__icon">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="contact-info__label">Email</div>
                  <div className="contact-info__value">contact@vupluat.vn</div>
                </div>
              </div>

              <div className="contact-info__item">
                <div className="contact-info__icon">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="contact-info__label">Giờ làm việc</div>
                  <div className="contact-info__value">
                    Thứ 2 - Thứ 6: 8:00 - 18:00<br />
                    Thứ 7: 8:00 - 12:00
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-info__cta">
              <a href="https://zalo.me/123456789" className="contact-info__cta-btn contact-info__cta-btn--zalo">
                <Phone size={18} />
                Chat Zalo ngay
              </a>
              <a href="tel:19001234" className="contact-info__cta-btn contact-info__cta-btn--phone">
                <Phone size={18} />
                Gọi hotline 1900 1234
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

#### Task 2.10: Footer + Floating Widgets (Day 19)

**Mục tiêu**: Footer + chatbot + floating widgets giống demo (lines 1550-2066)

```typescript
// src/components/layout/footer.tsx
'use client';

import Link from 'next/link';
import { Facebook, Linkedin, Youtube, MapPin, Phone, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          {/* Brand */}
          <div>
            <div className="footer__brand-logo">
              <div className="footer__brand-icon">VP</div>
              <span className="footer__brand-name">ICRC Law</span>
            </div>
            <p className="footer__brand-desc">
              ICRC Law - dịch vụ pháp lý chuyên nghiệp với 15+ năm kinh nghiệm.
              Cam kết mang đến giải pháp pháp lý tối ưu cho khách hàng.
            </p>
            <div className="footer__socials">
              <a href="#" className="footer__social">
                <Facebook size={18} />
              </a>
              <a href="#" className="footer__social">
                <Linkedin size={18} />
              </a>
              <a href="#" className="footer__social">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="footer__col-title">Dịch vụ</h4>
            <div className="footer__links">
              <Link href="/dich-vu/luat-doanh-nghiep" className="footer__link">Luật Doanh nghiệp</Link>
              <Link href="/dich-vu/luat-dat-dai" className="footer__link">Luật Đất đai</Link>
              <Link href="/dich-vu/luat-dan-su" className="footer__link">Luật Dân sự</Link>
              <Link href="/dich-vu/luat-hinh-su" className="footer__link">Luật Hình sự</Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer__col-title">Liên kết</h4>
            <div className="footer__links">
              <Link href="/ve-chung-toi" className="footer__link">Về chúng tôi</Link>
              <Link href="/luat-su" className="footer__link">Đội ngũ luật sư</Link>
              <Link href="/blog" className="footer__link">Blog pháp luật</Link>
              <Link href="/lien-he" className="footer__link">Liên hệ</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="footer__col-title">Liên hệ</h4>
            <div className="footer__contact-item">
              <MapPin size={16} className="footer__contact-icon" />
              <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
            </div>
            <div className="footer__contact-item">
              <Phone size={16} className="footer__contact-icon" />
              <span>1900 1234</span>
            </div>
            <div className="footer__contact-item">
              <Mail size={16} className="footer__contact-icon" />
              <span>contact@vupluat.vn</span>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            © 2026 ICRC Law. Mọi quyền được bảo lưu.
          </p>
          <div className="footer__legal">
            <a href="/chinh-sach-bao-mat">Chính sách bảo mật</a>
            <a href="/dieu-khoan-su-dung">Điều khoản sử dụng</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

**Floating Widgets**:

```typescript
// src/components/layout/floating-widgets.tsx
'use client';

import { ArrowUp, MessageCircle } from 'lucide-react';

export function FloatingWidgets() {
  return (
    <>
      {/* Zalo */}
      <a href="https://zalo.me/123456789" className="floating-widget__item floating-widget__item--zalo">
        <MessageCircle size={24} />
        <span className="floating-widget__tooltip">Chat Zalo</span>
      </a>

      {/* Back to top */}
      <button
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp size={18} />
      </button>
    </>
  );
}
```

---

### Week 4: Landing Page Builder + Polish (Day 20-28)

#### Task 2.11: Homepage Assembly + Pages (Day 20-22)

**Assemble Homepage**:

```typescript
// src/app/page.tsx
import { Navbar } from '@/components/layout/navbar';
import { HeroSection } from '@/components/home/hero-section';
import { ServicesSection } from '@/components/home/services-section';
import { LawyersSection } from '@/components/home/lawyers-section';
import { WhyChooseSection } from '@/components/home/why-choose-section';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { FAQSection } from '@/components/home/faq-section';
import { ContactSection } from '@/components/home/contact-section';
import { Footer } from '@/components/layout/footer';
import { FloatingWidgets } from '@/components/layout/floating-widgets';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ServicesSection />
        <LawyersSection />
        <WhyChooseSection />
        <TestimonialsSection />
        <FAQSection />
        <ContactSection />
      </main>
      <Footer />
      <FloatingWidgets />
    </>
  );
}
```

**Create Public Pages**:

```
src/app/[locale]/(public)/
├── dich-vu/page.tsx
├── luat-su/page.tsx
├── blog/page.tsx
├── blog/[slug]/page.tsx
├── tin-tuc/page.tsx
├── cau-hoi-thuong-gap/page.tsx
├── danh-gia/page.tsx
└── lien-he/page.tsx
```

---

#### Task 2.12: Landing Page Builder (Day 22-25)

**Xem chi tiết**: Phần Landing Page Builder từ plan gốc

---

#### Task 2.13: A/B Testing + Storybook (Day 25-26)

**Xem chi tiết**: Phần A/B Testing và Storybook từ plan gốc

---

#### Task 2.14: Final Polish + SEO (Day 27-28)

**Checklist**:
- [ ] Responsive: Mobile/Tablet/Desktop
- [ ] SEO metadata: title, description, og:image
- [ ] Sitemap generation
- [ ] robots.txt
- [ ] Structured data (JSON-LD)
- [ ] Performance: Lighthouse 90+

---

## Dependencies

```
Task 2.1 (Design Tokens) ──→ Task 2.2 (Navbar)
Task 2.2 (Navbar) ──────────→ Task 2.3 (Hero)
Task 2.3 (Hero) ────────────→ Task 2.4-2.10 (Sections)
Task 2.4-2.10 (Sections) ──→ Task 2.11 (Homepage Assembly)
Task 2.11 (Homepage) ───────→ Task 2.12 (Landing Builder)
Task 2.12-2.13 (Parallel) ──→ Task 2.14 (Polish)
```

---

## Verification

```bash
# Visual comparison với demo
# 1. Screenshot homepage → so sánh với demo/index.html
# 2. Test responsive: Chrome DevTools
# 3. Performance: Lighthouse CLI

npm run build    # ✅ Pass
npm run lint     # ✅ Pass
npm run test:run # ✅ Pass
```

---

## Design Reference Checklist

Để đảm bảo giống 100% demo:

- [ ] Color palette: Primary #1E3A5F, Accent #C9A84C
- [ ] Font: Cormorant Garamond (headings), Plus Jakarta Sans (body)
- [ ] Border radius: 4px (sm), 8px (md), 12px (lg), 16px (xl)
- [ ] Shadows: Card hover lift effect
- [ ] Animations: Fade in, translate up on scroll
- [ ] Navbar: Transparent → white on scroll
- [ ] Hero: Full viewport, gradient overlay, stats bar floating
- [ ] Service cards: 4-column, top border reveal on hover
- [ ] Lawyer cards: Avatar fallback, overlay socials on hover
- [ ] FAQ: Accordion với icon rotate
- [ ] Contact: 2-column form + info

---

*Phase 2 Plan v2.0 — Week 3-4 — Based on frontend/demo/index.html*
