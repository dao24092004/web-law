'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useRecentReviews } from '@/features/home/hooks/use-reviews';

export function TestimonialsSection() {
  const t = useTranslations('reviews');
  const [current, setCurrent] = useState(0);
  const { data: reviews = [], isLoading, isError } = useRecentReviews(10);

  // Only use real reviews from the API — never fall back to hard-coded names.
  const testimonials = reviews.slice(0, 5).map((review) => ({
    text: review.content,
    name: review.clientName,
    role:
      review.clientRole ||
      (review.serviceName ? t('serviceCustomer', { service: review.serviceName }) : t('customer')),
    initials: review.initials || review.clientName?.slice(0, 2).toUpperCase() || 'CL',
  }));

  const total = testimonials.length;

  const prev = () => {
    setCurrent((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const next = () => {
    setCurrent((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  if (isLoading) {
    return (
      <section className="section">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>{t('loading')}</p>
          </div>
        </div>
      </section>
    );
  }

  if (total === 0) {
    return (
      <section className="section">
        <div className="container">
          <div className="section__header">
            <span className="section__label">{t('label')}</span>
            <h2 className="section__title">{t('title')}</h2>
            <p className="section__subtitle">{t('subtitle')}</p>
          </div>
          <div className="testimonial-card testimonial-card--empty" role="status">
            <Quote className="testimonial-card__quote-icon" aria-hidden="true" />
            <p className="testimonial-card__text">
              {isError ? t('error') : t('empty')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section__header">
          <span className="section__label">{t('label')}</span>
          <h2 className="section__title">{t('title')}</h2>
          <p className="section__subtitle">{t('subtitle')}</p>
        </div>

        <div className="testimonials__slider">
          <div
            className="testimonials__track"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-card__inner">
                  <span className="testimonial-card__quote-icon">&ldquo;</span>
                  <div className="testimonial-card__stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="testimonial-card__star"
                        size={16}
                        fill="currentColor"
                      />
                    ))}
                  </div>
                  <p className="testimonial-card__text">{testimonial.text}</p>
                  <div className="testimonial-card__author">
                    <div className="testimonial-card__avatar">{testimonial.initials}</div>
                    <div>
                      <div className="testimonial-card__name">{testimonial.name}</div>
                      <div className="testimonial-card__role">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="testimonials__controls">
          <button
            className="testimonials__arrow"
            onClick={prev}
            disabled={total <= 1}
            aria-label={t('previous')}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="testimonials__dots">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`testimonials__dot ${index === current ? 'active' : ''}`}
                onClick={() => setCurrent(index)}
                aria-label={t('item', { number: index + 1 })}
                aria-current={index === current ? 'true' : undefined}
              />
            ))}
          </div>
          <button
            className="testimonials__arrow"
            onClick={next}
            disabled={total <= 1}
            aria-label={t('next')}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
