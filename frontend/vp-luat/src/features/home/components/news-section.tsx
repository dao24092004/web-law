'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useFeaturedPosts } from '@/features/news/hooks/use-news';
import { ArrowRight, Building2, Home, Scale, Calendar } from 'lucide-react';

const NEWS_ICONS = [Building2, Home, Scale];

export function NewsSection() {
  const t = useTranslations('homeSections.news');
  const { data: posts = [], isLoading } = useFeaturedPosts();
  const items = posts.slice(0, 3);

  return (
    <section className="section section--gray" id="news">
      <div className="container">
        <div className="section__header">
          <span className="section__label">{t('label')}</span>
          <h2 className="section__title">{t('title')}</h2>
          <p className="section__subtitle">{t('subtitle')}</p>
        </div>

        <div className="news__grid">
          {isLoading && <p>{t('loading')}</p>}
          {!isLoading && items.length === 0 && <p>{t('empty')}</p>}
          {items.map((content, index) => {
            const Icon = NEWS_ICONS[index % NEWS_ICONS.length];
            const href = `/news/${content.slug}`;

            return (
              <article key={content.id} className="news-card">
                <div className="news-card__thumb">
                  <div className="news-card__thumb-placeholder"><Icon size={44} strokeWidth={1.7} /></div>
                  <span className="news-card__badge">{content.categoryName ?? content.category}</span>
                </div>
                <div className="news-card__body">
                  <div className="news-card__meta">
                    <time className="news-card__date"><Calendar size={13} /><span>{new Date(content.publishedAt).toLocaleDateString()}</span></time>
                  </div>
                  <h3 className="news-card__title">{content.title}</h3>
                  <p className="news-card__excerpt">{content.excerpt}</p>
                  <Link href={href} className="news-card__read">{t('readMore')} <ArrowRight size={14} /></Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
