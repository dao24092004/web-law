'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Save, Eye, Edit3, RefreshCw, BarChart3, Phone, Mail,
  MapPin, Clock, Globe, HelpCircle, Plus, Trash2
} from 'lucide-react';
import { AdminPageHeader } from '@/features/admin/shared';
import { useApiQuery, useApiMutation } from '@/lib/api/hooks';
import {
  EMPTY_SITE_CONTENT,
  type SiteContent,
  type SiteOffice,
  type SiteSocialLinks,
  type SiteFaq,
} from '@/lib/api/admin-site-content';
import { notifySuccess, notifyError } from '@/features/admin/lib';

type Tab = 'stats' | 'contact' | 'social' | 'legal' | 'offices' | 'faqs';
type Locale = 'vi' | 'en';

/** Whole PUBLIC_SITE namespace: one SiteContent object per locale. */
type SiteContentByLocale = Record<Locale, SiteContent>;

const EMPTY_BY_LOCALE: SiteContentByLocale = {
  vi: EMPTY_SITE_CONTENT,
  en: EMPTY_SITE_CONTENT,
};

function normalizeSiteContent(value?: Partial<SiteContent>): SiteContent {
  return {
    ...EMPTY_SITE_CONTENT,
    ...value,
    contact: { ...EMPTY_SITE_CONTENT.contact, ...value?.contact },
    socialLinks: { ...EMPTY_SITE_CONTENT.socialLinks, ...value?.socialLinks },
    legalLinks: { ...EMPTY_SITE_CONTENT.legalLinks, ...value?.legalLinks },
    heroStats: { ...EMPTY_SITE_CONTENT.heroStats, ...value?.heroStats },
    offices: value?.offices ?? [],
    processSteps: value?.processSteps ?? [],
    faqs: value?.faqs ?? [],
  };
}

function normalizeContentByLocale(value?: Partial<SiteContentByLocale>): SiteContentByLocale {
  return {
    vi: normalizeSiteContent(value?.vi),
    en: normalizeSiteContent(value?.en),
  };
}

export default function SiteContentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [locale, setLocale] = useState<Locale>('vi');
  const [content, setContent] = useState<SiteContentByLocale>(EMPTY_BY_LOCALE);
  const [editMode, setEditMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();

  const { data: serverContent, isLoading, refetch } = useApiQuery<SiteContentByLocale>(
    ['admin', 'settings', 'PUBLIC_SITE'],
    '/admin/settings/PUBLIC_SITE',
    {},
    { retry: false },
  );

  // Sync local edit buffer whenever fresh server data arrives (not during edit
  // to avoid clobbering unsaved input while the admin is typing).
  useEffect(() => {
    if (serverContent && !editMode) {
      setContent(normalizeContentByLocale(serverContent));
    }
  }, [serverContent, editMode]);

  const saveMutation = useApiMutation<SiteContentByLocale, SiteContentByLocale>(
    'PUT',
    '/admin/settings/PUBLIC_SITE',
  );

  const current = normalizeSiteContent(content[locale]);

  const handleSave = async () => {
    try {
      // Backend PUT merges top-level keys (`vi`/`en`), so send the complete
      // namespace to avoid losing the other locale's data.
      const saved = await saveMutation.mutateAsync(content);
      setContent(saved);
      await queryClient.invalidateQueries({ queryKey: ['public', 'site-content'] });
      notifySuccess('Đã lưu nội dung');
      setEditMode(false);
      refetch();
    } catch (error) {
      notifyError('Lỗi lưu nội dung', error instanceof Error ? error.message : 'Không thể lưu nội dung');
    }
  };

  const updateLocaleContent = (updater: (prev: SiteContent) => SiteContent) => {
    setContent((prev) => ({
      ...prev,
      [locale]: updater(prev[locale] ?? EMPTY_SITE_CONTENT),
    }));
  };

  const updateStat = (field: keyof SiteContent['heroStats'], value: number) => {
    updateLocaleContent((prev) => ({
      ...prev,
      heroStats: { ...prev.heroStats, [field]: value },
    }));
  };

  const updateContact = (field: keyof SiteContent['contact'], value: string) => {
    updateLocaleContent((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  };

  const updateSocial = (field: keyof SiteSocialLinks, value: string) => {
    updateLocaleContent((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [field]: value },
    }));
  };

  const updateOffice = (index: number, field: keyof SiteOffice, value: string | boolean) => {
    updateLocaleContent((prev) => ({
      ...prev,
      offices: prev.offices.map((office, i) =>
        i === index ? { ...office, [field]: value } : office,
      ),
    }));
  };

  const addOffice = () => {
    updateLocaleContent((prev) => ({
      ...prev,
      offices: [
        ...prev.offices,
        { city: '', address: '', phone: '', email: '', workingHours: '', isMain: false },
      ],
    }));
  };

  const removeOffice = (index: number) => {
    updateLocaleContent((prev) => ({
      ...prev,
      offices: prev.offices.filter((_, i) => i !== index),
    }));
  };

  const updateFaq = (index: number, field: keyof SiteFaq, value: string) => {
    updateLocaleContent((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)),
    }));
  };

  const addFaq = () => {
    updateLocaleContent((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { id: crypto.randomUUID(), question: '', answer: '' }],
    }));
  };

  const removeFaq = (index: number) => {
    updateLocaleContent((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const tabs: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: 'stats', label: 'Thống kê trang chủ', icon: <BarChart3 size={14} /> },
    { value: 'contact', label: 'Liên hệ', icon: <Phone size={14} /> },
    { value: 'social', label: 'Mạng xã hội', icon: <Globe size={14} /> },
    { value: 'legal', label: 'Chính sách & Điều khoản', icon: <HelpCircle size={14} /> },
    { value: 'offices', label: 'Văn phòng', icon: <MapPin size={14} /> },
    { value: 'faqs', label: 'Câu hỏi thường gặp', icon: <HelpCircle size={14} /> },
  ];

  return (
    <div className="admin-view">
      <AdminPageHeader
        title="Quản lý Nội dung Site"
        subtitle="Chỉnh sửa thống kê trang chủ, liên hệ, văn phòng và FAQ của website"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--gray-300)',
                borderRadius: 6,
                fontSize: '0.85rem',
                background: 'white',
              }}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
            <button onClick={() => setShowPreview(true)} className="action-btn">
              <Eye size={14} /> Xem trước
            </button>
            {editMode ? (
              <>
                <button
                  onClick={() => {
                    setEditMode(false);
                    if (serverContent) setContent(normalizeContentByLocale(serverContent));
                  }}
                  className="action-btn"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="action-btn action-btn--primary"
                  disabled={saveMutation.isPending}
                >
                  <Save size={14} /> {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="action-btn action-btn--primary"
              >
                <Edit3 size={14} /> Chỉnh sửa
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
          Đang tải nội dung...
        </div>
      ) : (
        <div className="admin-content-panel" style={{
          background: 'white',
          border: '1px solid var(--gray-200)',
          borderRadius: 10,
          maxWidth: 800,
        }}>
          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Thống kê hiển thị ở trang chủ</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                Các số liệu này hiển thị ở banner trang chủ (vụ việc thành công, tỷ lệ thành công,
                số năm kinh nghiệm, số khách hàng).
              </p>
              <div className="admin-grid-2">
                <Field label="Số vụ việc thành công">
                  <input
                    type="number"
                    min={0}
                    value={current.heroStats.successfulCases}
                    onChange={(e) => updateStat('successfulCases', parseInt(e.target.value, 10) || 0)}
                    disabled={!editMode}
                    className="admin-input"
                  />
                </Field>
                <Field label="Tỷ lệ thành công (%)">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={current.heroStats.successRate}
                    onChange={(e) => updateStat('successRate', parseInt(e.target.value, 10) || 0)}
                    disabled={!editMode}
                    className="admin-input"
                  />
                </Field>
                <Field label="Số năm kinh nghiệm">
                  <input
                    type="number"
                    min={0}
                    value={current.heroStats.yearsExperience}
                    onChange={(e) => updateStat('yearsExperience', parseInt(e.target.value, 10) || 0)}
                    disabled={!editMode}
                    className="admin-input"
                  />
                </Field>
                <Field label="Số khách hàng đã phục vụ">
                  <input
                    type="number"
                    min={0}
                    value={current.heroStats.clients}
                    onChange={(e) => updateStat('clients', parseInt(e.target.value, 10) || 0)}
                    disabled={!editMode}
                    className="admin-input"
                  />
                </Field>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Thông tin liên hệ</h3>
              <Field label="Hotline" icon={<Phone size={14} />}>
                <input
                  type="text"
                  value={current.contact.hotline}
                  onChange={(e) => updateContact('hotline', e.target.value)}
                  disabled={!editMode}
                  className="admin-input"
                />
              </Field>
              <div className="admin-grid-2">
                <Field label="Email" icon={<Mail size={14} />}>
                  <input
                    type="email"
                    value={current.contact.email}
                    onChange={(e) => updateContact('email', e.target.value)}
                    disabled={!editMode}
                    className="admin-input"
                  />
                </Field>
                <Field label="Giờ làm việc" icon={<Clock size={14} />}>
                  <input
                    type="text"
                    value={current.contact.workingHours}
                    onChange={(e) => updateContact('workingHours', e.target.value)}
                    disabled={!editMode}
                    className="admin-input"
                  />
                </Field>
              </div>
              <Field label="Địa chỉ" icon={<MapPin size={14} />}>
                <input
                  type="text"
                  value={current.contact.address}
                  onChange={(e) => updateContact('address', e.target.value)}
                  disabled={!editMode}
                  className="admin-input"
                />
              </Field>
              <Field label="Zalo URL">
                <input
                  type="text"
                  value={current.contact.zaloUrl}
                  onChange={(e) => updateContact('zaloUrl', e.target.value)}
                  disabled={!editMode}
                  className="admin-input"
                  placeholder="https://zalo.me/..."
                />
              </Field>
            </div>
          )}

          {activeTab === 'social' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Liên kết mạng xã hội trên footer</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                Chỉ nhập URL chính thức. Để trống nếu không muốn hiển thị một mạng xã hội.
              </p>
              {([
                ['facebook', 'Facebook', 'https://facebook.com/...'],
                ['linkedin', 'LinkedIn', 'https://linkedin.com/company/...'],
                ['youtube', 'YouTube', 'https://youtube.com/@...'],
                ['instagram', 'Instagram', 'https://instagram.com/...'],
              ] as const).map(([field, label, placeholder]) => (
                <Field key={field} label={label} icon={<Globe size={14} />}>
                  <input
                    type="url"
                    value={current.socialLinks[field]}
                    onChange={(e) => updateSocial(field, e.target.value)}
                    disabled={!editMode}
                    className="admin-input"
                    placeholder={placeholder}
                  />
                </Field>
              ))}
            </div>
          )}

          {activeTab === 'legal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Chính sách và điều khoản trên footer</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                Nhập URL trang nội dung tương ứng. Để trống nếu chưa muốn hiển thị liên kết.
              </p>
              <Field label="Chính sách bảo mật">
                <input
                  type="url"
                  value={current.legalLinks.privacyPolicy}
                  onChange={(e) => updateLocaleContent((prev) => ({
                    ...prev,
                    legalLinks: { ...prev.legalLinks, privacyPolicy: e.target.value },
                  }))}
                  disabled={!editMode}
                  className="admin-input"
                  placeholder="https://... hoặc /privacy-policy"
                />
              </Field>
              <Field label="Điều khoản sử dụng">
                <input
                  type="url"
                  value={current.legalLinks.termsOfUse}
                  onChange={(e) => updateLocaleContent((prev) => ({
                    ...prev,
                    legalLinks: { ...prev.legalLinks, termsOfUse: e.target.value },
                  }))}
                  disabled={!editMode}
                  className="admin-input"
                  placeholder="https://... hoặc /terms-of-use"
                />
              </Field>
            </div>
          )}

          {activeTab === 'offices' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Văn phòng</h3>
                {editMode && (
                  <button onClick={addOffice} className="action-btn">
                    <Plus size={14} /> Thêm văn phòng
                  </button>
                )}
              </div>
              {current.offices.length === 0 && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                  Chưa có văn phòng nào.
                </p>
              )}
              {current.offices.map((office, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid var(--gray-200)',
                    borderRadius: 8,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem' }}>
                      Văn phòng {index + 1}{office.isMain ? ' (chính)' : ''}
                    </strong>
                    {editMode && (
                      <button onClick={() => removeOffice(index)} className="action-btn action-btn--danger">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="admin-grid-2">
                    <Field label="Thành phố">
                      <input
                        type="text"
                        value={office.city}
                        onChange={(e) => updateOffice(index, 'city', e.target.value)}
                        disabled={!editMode}
                        className="admin-input"
                      />
                    </Field>
                    <Field label="Điện thoại">
                      <input
                        type="text"
                        value={office.phone}
                        onChange={(e) => updateOffice(index, 'phone', e.target.value)}
                        disabled={!editMode}
                        className="admin-input"
                      />
                    </Field>
                  </div>
                  <Field label="Địa chỉ">
                    <input
                      type="text"
                      value={office.address}
                      onChange={(e) => updateOffice(index, 'address', e.target.value)}
                      disabled={!editMode}
                      className="admin-input"
                    />
                  </Field>
                  <div className="admin-grid-2">
                    <Field label="Email">
                      <input
                        type="email"
                        value={office.email}
                        onChange={(e) => updateOffice(index, 'email', e.target.value)}
                        disabled={!editMode}
                        className="admin-input"
                      />
                    </Field>
                    <Field label="Giờ làm việc">
                      <input
                        type="text"
                        value={office.workingHours}
                        onChange={(e) => updateOffice(index, 'workingHours', e.target.value)}
                        disabled={!editMode}
                        className="admin-input"
                      />
                    </Field>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                    <input
                      type="checkbox"
                      checked={!!office.isMain}
                      onChange={(e) => updateOffice(index, 'isMain', e.target.checked)}
                      disabled={!editMode}
                    />
                    Văn phòng chính
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'faqs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Câu hỏi thường gặp</h3>
                {editMode && (
                  <button onClick={addFaq} className="action-btn">
                    <Plus size={14} /> Thêm câu hỏi
                  </button>
                )}
              </div>
              {current.faqs.length === 0 && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                  Chưa có câu hỏi nào.
                </p>
              )}
              {current.faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  style={{
                    border: '1px solid var(--gray-200)',
                    borderRadius: 8,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem' }}>Câu hỏi {index + 1}</strong>
                    {editMode && (
                      <button onClick={() => removeFaq(index)} className="action-btn action-btn--danger">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <Field label="Câu hỏi">
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => updateFaq(index, 'question', e.target.value)}
                      disabled={!editMode}
                      className="admin-input"
                    />
                  </Field>
                  <Field label="Trả lời">
                    <textarea
                      value={faq.answer}
                      onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                      disabled={!editMode}
                      rows={3}
                      className="admin-input"
                    />
                  </Field>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showPreview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setShowPreview(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 10,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Xem trước nội dung ({locale})</h3>
            <pre
              style={{
                fontSize: '0.75rem',
                background: 'var(--gray-100)',
                padding: 12,
                borderRadius: 6,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(current, null, 2)}
            </pre>
            <button
              onClick={() => setShowPreview(false)}
              className="action-btn"
              style={{ marginTop: 12 }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.78rem',
          fontWeight: 600,
          marginBottom: 6,
          color: 'var(--gray-700)',
        }}
      >
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
