'use client';

import { useState } from 'react';
import {
  Save, Eye, Edit3, RefreshCw, Image as ImageIcon, Phone, Mail,
  MapPin, Clock, Globe, ChevronDown
} from 'lucide-react';
import { AdminPageHeader } from '@/features/admin/shared';
import { useApiQuery, useApiMutation } from '@/lib/api/hooks';
import { siteContentApi, type SiteContent } from '@/lib/api/admin-site-content';
import { notifySuccess, notifyError } from '@/features/admin/lib';

type Tab = 'hero' | 'about' | 'contact' | 'social';

const DEFAULT_CONTENT: SiteContent = {
  hero: {
    title: 'Van phong Luat su Uy tin',
    subtitle: 'Dich vu phap ly chuyen nghiep, tan tam vi khach hang',
    ctaText: 'Dat lich tu van mien phi',
    ctaLink: '/booking',
  },
  about: {
    title: 'Ve chung toi',
    description: 'Van phong luat su voi hon 10 nam kinh nghiem trong linh vuc tu van phap ly',
    mission: 'Mang den giai phap phap ly toi uu cho moi khach hang',
    vision: 'Troe thanh van phong luat su hang dau tai Viet Nam',
    yearsExperience: 10,
  },
  contact: {
    address: '123 Nguyen Hue, Q.1, TP.HCM',
    phone: '+84 901 234 567',
    email: 'contact@lawfirm.vn',
    workingHours: 'T2 - T7: 8:00 - 17:30',
  },
  social: {
    facebook: 'https://facebook.com/lawfirm',
    youtube: 'https://youtube.com/lawfirm',
    zalo: 'https://zalo.me/lawfirm',
    linkedin: 'https://linkedin.com/company/lawfirm',
  },
};

export default function SiteContentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('hero');
  const [locale, setLocale] = useState<'vi' | 'en'>('vi');
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [editMode, setEditMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { data: serverContent, isLoading, refetch } = useApiQuery<SiteContent>(
    ['site-content', locale],
    `/public/site-content?locale=${locale}`,
    {},
    { retry: false },
  );

  const saveMutation = useApiMutation<unknown, { url: string; method: 'POST' | 'PATCH' | 'PUT'; body: unknown }>(
    'PUT',
    (vars) => vars.url,
  );

  // Load from server when available
  if (serverContent) {
    setContent(serverContent);
  }

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        url: '/admin/settings/site-content',
        method: 'PUT',
        body: content,
      });
      notifySuccess('Da luu noi dung');
      setEditMode(false);
      refetch();
    } catch {
      notifyError('Loi luu noi dung');
    }
  };

  const updateField = <K extends keyof SiteContent>(
    section: K,
    field: string,
    value: string | number,
  ) => {
    setContent((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, unknown>),
        [field]: value,
      },
    }));
  };

  const tabs: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: 'hero', label: 'Hero Banner', icon: <ImageIcon size={14} /> },
    { value: 'about', label: 'Gioi thieu', icon: <Edit3 size={14} /> },
    { value: 'contact', label: 'Lien he', icon: <Phone size={14} /> },
    { value: 'social', label: 'Mang xa hoi', icon: <Globe size={14} /> },
  ];

  return (
    <div className="admin-view">
      <AdminPageHeader
        title="Quan ly Noi dung Site"
        subtitle="Chinh sua noi dung trang gioi thieu va lien he cua website"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'vi' | 'en')}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--gray-300)',
                borderRadius: 6,
                fontSize: '0.85rem',
                background: 'white',
              }}
            >
              <option value="vi">Tieng Viet</option>
              <option value="en">English</option>
            </select>
            <button onClick={() => setShowPreview(true)} className="action-btn">
              <Eye size={14} /> Xem truoc
            </button>
            {editMode ? (
              <>
                <button onClick={() => setEditMode(false)} className="action-btn">
                  Huy
                </button>
                <button
                  onClick={handleSave}
                  className="action-btn action-btn--primary"
                  disabled={saveMutation.isPending}
                >
                  <Save size={14} /> Luu
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="action-btn action-btn--primary"
              >
                <Edit3 size={14} /> Chinh sua
              </button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 16,
        padding: 4,
        background: 'var(--gray-100)',
        borderRadius: 8,
        width: 'fit-content',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              border: 'none',
              borderRadius: 6,
              background: activeTab === tab.value ? 'white' : 'transparent',
              color: activeTab === tab.value ? 'var(--primary)' : 'var(--gray-600)',
              fontSize: '0.8rem',
              fontWeight: activeTab === tab.value ? 600 : 400,
              cursor: 'pointer',
              boxShadow: activeTab === tab.value ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content panels */}
      {isLoading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-500)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          Dang tai noi dung...
        </div>
      ) : (
        <div style={{
          background: 'white',
          border: '1px solid var(--gray-200)',
          borderRadius: 10,
          padding: 24,
          maxWidth: 800,
        }}>
          {activeTab === 'hero' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Hero Banner</h3>
              <Field label="Tieu de chinh">
                <input
                  type="text"
                  value={content.hero.title}
                  onChange={(e) => updateField('hero', 'title', e.target.value)}
                  disabled={!editMode}
                  className="admin-input"
                />
              </Field>
              <Field label="Phu de">
                <input
                  type="text"
                  value={content.hero.subtitle}
                  onChange={(e) => updateField('hero', 'subtitle', e.target.value)}
                  disabled={!editMode}
                  className="admin-input"
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Text nut CTA">
                  <input
                    type="text"
                    value={content.hero.ctaText}
                    onChange={(e) => updateField('hero', 'ctaText', e.target.value)}
                    disabled={!editMode}
                    className="admin-input"
                  />
                </Field>
                <Field label="Lien ket CTA">
                  <input
                    type="text"
                    value={content.hero.ctaLink}
                    onChange={(e) => updateField('hero', 'ctaLink', e.target.value)}
                    disabled={!editMode}
                    className="admin-input"
                  />
                </Field>
              </div>
              <Field label="Anh nen (URL)">
                <input
                  type="text"
                  value={content.hero.backgroundImage || ''}
                  onChange={(e) => updateField('hero', 'backgroundImage', e.target.value)}
                  disabled={!editMode}
                  className="admin-input"
                  placeholder="https://..."
                />
              </Field>
            </div>
          )}

          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Gioi thieu</h3>
              <Field label="Tieu de">
                <input
                  type="text"
                  value={content.about.title}
                  onChange={(e) => updateField('about', 'title', e.target.value)}
                  disabled={!editMode}
                  className="admin-input"
                />
              </Field>
              <Field label="Mo ta">
                <textarea
                  value={content.about.description}
                  onChange={(e) => updateField('about', 'description', e.target.value)}
                  disabled={!editMode}
                  rows={3}
                  className="admin-input"
                />
              </Field>
              <Field label="Su menh (Mission)">
                <textarea
                  value={content.about.mission}
                  onChange={(e) => updateField('about', 'mission', e.target.value)}
                  disabled={!editMode}
                  rows={2}
                  className="admin-input"
                />
              </Field>
              <Field label="Tam nhin (Vision)">
                <textarea
                  value={content.about.vision}
                  onChange={(e) => updateField('about', 'vision', e.target.value)}
                  disabled={!editMode}
                  rows={2}
                  className="admin-input"
                />
              </Field>
              <Field label="So nam kinh nghiem">
                <input
                  type="number"
                  value={content.about.yearsExperience}
                  onChange={(e) => updateField('about', 'yearsExperience', parseInt(e.target.value))}
                  disabled={!editMode}
                  className="admin-input"
                />
              </Field>
            </div>
          )}

          {activeTab === 'contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Thong tin lien he</h3>
              <Field label="Dia chi" icon={<MapPin size={14} />}>
                <input
                  type="text"
                  value={content.contact.address}
                  onChange={(e) => updateField('contact', 'address', e.target.value)}
                  disabled={!editMode}
                  className="admin-input"
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="So dien thoai" icon={<Phone size={14} />}>
                  <input
                    type="text"
                    value={content.contact.phone}
                    onChange={(e) => updateField('contact', 'phone', e.target.value)}
                    disabled={!editMode}
                    className="admin-input"
                  />
                </Field>
                <Field label="Email" icon={<Mail size={14} />}>
                  <input
                    type="email"
                    value={content.contact.email}
                    onChange={(e) => updateField('contact', 'email', e.target.value)}
                    disabled={!editMode}
                    className="admin-input"
                  />
                </Field>
              </div>
              <Field label="Gio lam viec" icon={<Clock size={14} />}>
                <input
                  type="text"
                  value={content.contact.workingHours}
                  onChange={(e) => updateField('contact', 'workingHours', e.target.value)}
                  disabled={!editMode}
                  className="admin-input"
                />
              </Field>
              <Field label="Google Maps Embed (iframe URL)">
                <textarea
                  value={content.contact.mapEmbed || ''}
                  onChange={(e) => updateField('contact', 'mapEmbed', e.target.value)}
                  disabled={!editMode}
                  rows={2}
                  className="admin-input"
                  placeholder="https://www.google.com/maps/embed?..."
                />
              </Field>
            </div>
          )}

          {activeTab === 'social' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Mang xa hoi</h3>
              <Field label="Facebook">
                <input
                  type="text"
                  value={content.social.facebook || ''}
                  onChange={(e) => updateField('social', 'facebook', e.target.value)}
                  disabled={!editMode}
                  className="admin-input"
                />
              </Field>
              <Field label="YouTube">
                <input
                  type="text"
                  value={content.social.youtube || ''}
                  onChange={(e) => updateField('social', 'youtube', e.target.value)}
                  disabled={!editMode}
                  className="admin-input"
                />
              </Field>
              <Field label="Zalo">
                <input
                  type="text"
                  value={content.social.zalo || ''}
                  onChange={(e) => updateField('social', 'zalo', e.target.value)}
                  disabled={!editMode}
                  className="admin-input"
                />
              </Field>
              <Field label="LinkedIn">
                <input
                  type="text"
                  value={content.social.linkedin || ''}
                  onChange={(e) => updateField('social', 'linkedin', e.target.value)}
                  disabled={!editMode}
                  className="admin-input"
                />
              </Field>
            </div>
          )}
        </div>
      )}

      {/* Preview modal */}
      {showPreview && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            maxWidth: 900,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--gray-200)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 1,
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Preview trang public ({locale})</h3>
              <button onClick={() => setShowPreview(false)} className="action-btn">
                Dong
              </button>
            </div>

            {/* Hero preview */}
            <div style={{
              background: content.hero.backgroundImage 
                ? `url(${content.hero.backgroundImage}) center/cover` 
                : 'linear-gradient(135deg, var(--primary), #1a3a6e)',
              color: 'white',
              padding: '60px 40px',
              textAlign: 'center',
            }}>
              <h1 style={{ fontSize: '2rem', marginBottom: 12 }}>{content.hero.title}</h1>
              <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: 24 }}>{content.hero.subtitle}</p>
              <button style={{
                padding: '12px 24px',
                background: 'white',
                color: 'var(--primary)',
                border: 'none',
                borderRadius: 6,
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}>
                {content.hero.ctaText}
              </button>
            </div>

            {/* About preview */}
            <div style={{ padding: '40px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 16 }}>{content.about.title}</h2>
              <p style={{ color: 'var(--gray-600)', marginBottom: 20 }}>{content.about.description}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8 }}>
                  <strong>Su menh:</strong> {content.about.mission}
                </div>
                <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8 }}>
                  <strong>Tam nhin:</strong> {content.about.vision}
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
                {content.about.yearsExperience}+ nam kinh nghiem
              </div>
            </div>

            {/* Contact preview */}
            <div style={{ padding: '40px', background: 'var(--gray-50)' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Lien he voi chung toi</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <ContactItem icon={<MapPin size={16} />} label="Dia chi" value={content.contact.address} />
                <ContactItem icon={<Phone size={16} />} label="Dien thoai" value={content.contact.phone} />
                <ContactItem icon={<Mail size={16} />} label="Email" value={content.contact.email} />
                <ContactItem icon={<Clock size={16} />} label="Gio lam viec" value={content.contact.workingHours} />
              </div>
            </div>

            {/* Social preview */}
            <div style={{ padding: '24px 40px', display: 'flex', justifyContent: 'center', gap: 16 }}>
              {content.social.facebook && <SocialBtn label="Facebook" />}
              {content.social.youtube && <SocialBtn label="YouTube" />}
              {content.social.zalo && <SocialBtn label="Zalo" />}
              {content.social.linkedin && <SocialBtn label="LinkedIn" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: '0.78rem',
        fontWeight: 600,
        marginBottom: 6,
        color: 'var(--gray-700)',
      }}>
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ padding: 12, background: 'white', borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', marginBottom: 6 }}>
        {icon}
        <strong style={{ fontSize: '0.78rem' }}>{label}</strong>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>{value}</div>
    </div>
  );
}

function SocialBtn({ label }: { label: string }) {
  return (
    <button style={{
      padding: '8px 16px',
      border: '1px solid var(--gray-300)',
      borderRadius: 20,
      background: 'white',
      cursor: 'pointer',
      fontSize: '0.85rem',
    }}>
      {label}
    </button>
  );
}
