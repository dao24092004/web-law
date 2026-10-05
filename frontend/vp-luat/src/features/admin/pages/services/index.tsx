'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus,
  Download,
  Briefcase,
  Users,
  Grid3x3,
  CalendarDays,
  FileText,
} from 'lucide-react';
import {
  AdminPageHeader,
  FilterTabs,
  SearchBar,
  Pagination,
  ConfirmDialog,
} from '@/features/admin/shared';
import {
  useCan,
  notifySuccess,
  notifyError,
  exportToCSV,
} from '@/features/admin/lib';
import { ServiceForm } from './components/service-form';
import { LawyerForm } from './components/lawyer-form';
import { ServicesTable } from './components/services-table';
import { LawyersTable } from './components/lawyers-table';
import { ServiceFilters, type ServiceFiltersValue } from './components/services-filters';
import { AssignmentMatrix } from './components/assignment-matrix';
import { LawyerScheduleEditor } from './components/lawyer-schedule-editor';
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from './hooks/use-services';
import { useLawyers, useCreateLawyer, useUpdateLawyer, useDeleteLawyer } from './hooks/use-lawyers';
import type { Service, Lawyer } from './hooks/use-services';
import { useAssignment } from './hooks/use-assignment';
import type { ServiceFormValues, LawyerFormValues } from '@/features/admin/schema';

type Tab = 'services' | 'lawyers' | 'assignment' | 'schedule';

const TAB_LIST: Array<{ value: Tab; label: string; icon: typeof Briefcase }> = [
  { value: 'services', label: 'Dịch vụ', icon: Briefcase },
  { value: 'lawyers', label: 'Luật sư', icon: Users },
  { value: 'assignment', label: 'Phân công', icon: Grid3x3 },
  { value: 'schedule', label: 'Lịch làm việc', icon: CalendarDays },
];

const SERVICE_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Tạm dừng' },
] as const;

const LAWYER_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Tạm dừng' },
] as const;

export default function ServicesPage() {
  const [tab, setTab] = useState<Tab>('services');

  return (
    <div className="admin-view">
      <AdminPageHeader
        title="Dịch vụ & Luật sư"
        subtitle="Quản lý dịch vụ pháp lý, đội ngũ luật sư, phân công và lịch làm việc"
      />

      <div className="filter-bar" role="tablist" style={{ marginBottom: 16 }}>
        {TAB_LIST.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              className={`filter-tab ${tab === t.value ? 'filter-tab--active' : ''}`}
              onClick={() => setTab(t.value)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon size={12} />
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'services' && <ServicesTab />}
      {tab === 'lawyers' && <LawyersTab />}
      {tab === 'assignment' && <AssignmentTab />}
      {tab === 'schedule' && <ScheduleTab />}
    </div>
  );
}

// ─── Tab 1: Services ─────────────────────────────────────────────────────
function ServicesTab() {
  // Local state for the input fields (so we can debounce before hitting BE)
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // statusFilter from the tabs (active/inactive quick toggle) is independent
  // of the `filters.status` select box — they both map to the same isActive.
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [filters, setFilters] = useState<ServiceFiltersValue>({
    category: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [page, setPage] = useState(1);

  // Derive the boolean isActive to send BE.  statusFilter (tabs) wins over
  // filters.status (sidebar) when both are set, since tabs are a primary
  // navigation control.
  const derivedIsActive: boolean | undefined =
    statusFilter !== 'all'
      ? statusFilter === 'active'
      : filters.status !== 'all'
        ? filters.status === 'active'
        : undefined;

  // Debounce search input so we don't fire on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 whenever the server-side filter changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, derivedIsActive, filters.category, filters.dateFrom, filters.dateTo]);

  const { data: services, counts } = useServices({
    search: debouncedSearch,
    isActive: derivedIsActive,
    category: filters.category,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  });

  const { data: lawyers = [] } = useLawyers();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const LIMIT = 20;

  const canWrite = useCan('services.write');
  const canDelete = useCan('services.write');

  const createSvc = useCreateService();
  const updateSvc = useUpdateService();
  const removeSvc = useDeleteService();

  const tabsWithCounts = SERVICE_TABS.map((t) => ({
    value: t.value,
    label: t.label,
    count:
      t.value === 'all'
        ? counts.total
        : t.value === 'active'
          ? counts.active
          : counts.inactive,
  }));

  // All filters (search, status, category, dates) are now sent to the BE.
  // The local array IS the filtered list.
  const filtered = services;

  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const handleSubmit = async (values: ServiceFormValues) => {
    // Tự sinh slug từ name khi không có sẵn (BE yêu cầu @NotBlank).
    // Trùng slug với service hiện tại khi edit thì giữ nguyên slug cũ.
    const trimmedName = values.name.trim();
    const slugify = (input: string) =>
      input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 80) || `service-${Date.now()}`;
    const nextSlug = editing && editing.name === trimmedName
      ? (editing as unknown as { slug?: string }).slug ?? slugify(trimmedName)
      : slugify(trimmedName);

    const payload: Record<string, unknown> = {
      slug: nextSlug,
      name: trimmedName,
      description: values.description ?? '',
      category: values.category,
      price: values.price ?? null,
      duration: values.duration ?? null,
      isActive: values.isActive,
      lawyerIds: values.lawyerIds,
    };
    try {
      if (editing) {
        await updateSvc.mutateAsync({ id: editing.id, body: payload });
        notifySuccess('Đã cập nhật dịch vụ');
      } else {
        await createSvc.mutateAsync(payload as Omit<Service, 'id'>);
        notifySuccess('Đã tạo dịch vụ');
      }
      setFormOpen(false);
      setEditing(null);
    } catch (e) {
      notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể lưu');
    }
  };

  const handleToggleActive = useCallback(
    async (s: Service) => {
      try {
        await updateSvc.mutateAsync({ id: s.id, body: { isActive: !s.isActive } });
        notifySuccess(s.isActive ? `Đã tạm dừng "${s.name}"` : `Đã kích hoạt "${s.name}"`);
      } catch (e) {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể cập nhật');
      }
    },
    [updateSvc],
  );

  const handleExport = () => {
    exportToCSV(
      filtered as unknown as Record<string, unknown>[],
      `services-${new Date().toISOString().slice(0, 10)}`,
      [
        { key: 'name', header: 'Tên dịch vụ' },
        { key: 'category', header: 'Danh mục' },
        { key: 'price', header: 'Giá' },
        { key: 'duration', header: 'Thời gian' },
        { key: 'isActive', header: 'Trạng thái' },
      ],
    );
    notifySuccess(`Đã export ${filtered.length} dịch vụ`);
  };

  return (
    <>
      <AdminPageHeader
        title="Danh sách dịch vụ"
        subtitle={`${counts.total} dịch vụ · ${counts.active} hoạt động · ${counts.inactive} tạm dừng`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="action-btn"
              onClick={handleExport}
              disabled={filtered.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Download size={14} /> Export CSV
            </button>
            {canWrite && (
              <button
                type="button"
                className="action-btn action-btn--primary"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={14} /> Tạo dịch vụ
              </button>
            )}
          </div>
        }
      />

      {selectedIds.length > 0 && canDelete && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'var(--gray-900)',
            color: 'white',
            borderRadius: 'var(--radius-md, 6px)',
            marginBottom: 12,
            fontSize: '0.8rem',
          }}
        >
          <span>Đã chọn {selectedIds.length} dịch vụ</span>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="action-btn"
            style={{ background: '#DC2626', color: 'white', borderColor: '#DC2626' }}
            onClick={() => setConfirmBulkDelete(true)}
          >
            Xóa
          </button>
          <button
            type="button"
            className="action-btn"
            style={{ background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            onClick={() => setSelectedIds([])}
          >
            Hủy
          </button>
        </div>
      )}

      <FilterTabs
        tabs={tabsWithCounts}
        activeValue={statusFilter}
        onChange={(v) => {
          setStatusFilter(v as typeof statusFilter);
          setPage(1);
        }}
      />

      <div className="admin-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <SearchBar
            value={searchInput}
            onChange={(v) => {
              setSearchInput(v);
              // page reset is handled by useEffect on debouncedSearch
            }}
            placeholder="Tìm theo tên dịch vụ, mô tả, danh mục..."
          />
          <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>
            Tổng: {filtered.length} / {services.length}
          </span>
        </div>

        <ServiceFilters
          value={filters}
          onChange={(f) => {
            setFilters(f);
            setPage(1);
          }}
        />

        <ServicesTable
          data={paginated}
          lawyers={lawyers}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          onEdit={(s) => {
            setEditing(s);
            setFormOpen(true);
          }}
          onDelete={(s) => setConfirmDelete(s)}
          onToggleActive={handleToggleActive}
          canWrite={canWrite}
          canDelete={canDelete}
        />

        <Pagination
          page={page}
          limit={LIMIT}
          total={filtered.length}
          onPageChange={setPage}
        />
      </div>

      <ServiceForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        initial={editing}
        lawyers={lawyers}
        isLoading={createSvc.isPending || updateSvc.isPending}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Xóa dịch vụ"
        message={
          confirmDelete
            ? `Bạn có chắc muốn xóa "${confirmDelete.name}"? Hành động này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={async () => {
          if (!confirmDelete) return;
          try {
            await removeSvc.mutateAsync(confirmDelete.id);
            notifySuccess('Đã xóa dịch vụ');
          } catch (e) {
            notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể xóa');
          } finally {
            setConfirmDelete(null);
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        isOpen={confirmBulkDelete}
        title="Xóa nhiều dịch vụ"
        message={`Bạn có chắc muốn xóa ${selectedIds.length} dịch vụ đã chọn?`}
        confirmLabel="Xóa tất cả"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={async () => {
          try {
            const results = await Promise.allSettled(
              selectedIds.map((id) => removeSvc.mutateAsync(id)),
            );
            const failed = results.filter((result) => result.status === 'rejected').length;
            if (failed > 0) {
              notifyError('Lỗi', `Không thể xóa ${failed} dịch vụ`);
            } else {
              notifySuccess(`Đã xóa ${selectedIds.length} dịch vụ`);
            }
            setSelectedIds([]);
          } catch (e) {
            notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể xóa');
          } finally {
            setConfirmBulkDelete(false);
          }
        }}
        onClose={() => setConfirmBulkDelete(false)}
      />
    </>
  );
}

// ─── Tab 2: Lawyers ──────────────────────────────────────────────────────
function LawyersTab() {
  const { data: services = [] } = useServices();
  const [searchInput, setSearchInput] = useState('');
  // Debounce search so we don't fire a request on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // Server-side filter: search is debounced and sent to the BE; statusFilter
  // is a client-side boolean quick-toggle.
  const { data: lawyers, counts } = useLawyers({ search: debouncedSearch });
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 250);
    return () => clearTimeout(t);
  }, [searchInput]);
  // Send the debounced search to the BE so the page itself is filtered
  // server-side.  statusFilter remains a client-side filter on the current
  // page because it's a quick `isActive` boolean we can apply locally.
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lawyer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Lawyer | null>(null);
  const LIMIT = 20;

  const canWrite = useCan('lawyers.write');
  const canDelete = useCan('lawyers.write');

  const createLwy = useCreateLawyer();
  const updateLwy = useUpdateLawyer();
  const removeLwy = useDeleteLawyer();

  const tabsWithCounts = LAWYER_TABS.map((t) => ({
    value: t.value,
    label: t.label,
    count:
      t.value === 'all'
        ? counts.total
        : t.value === 'active'
          ? counts.active
          : counts.inactive,
  }));

  // The backend search is already applied; statusFilter is the only remaining
  // client-side filter (boolean quick-toggle).  Reset to page 1 whenever the
  // server-side search changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filtered = useMemo(() => {
    // If FE typed a search, the backend already filtered; status is applied
    // locally here.  Without a search, the unfiltered list is what's shown.
    if (statusFilter === 'all') return lawyers;
    const wantActive = statusFilter === 'active';
    return lawyers.filter((l) => l.isActive === wantActive);
  }, [lawyers, statusFilter]);

  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const handleSubmit = async (values: LawyerFormValues) => {
    // Validate tối thiểu ở FE để phát hiện sớm thay vì đợi BE trả 400
    const trimmedName = (values.name || '').trim();
    if (trimmedName.length < 2) {
      notifyError('Lỗi', 'Họ tên luật sư tối thiểu 2 ký tự');
      return;
    }
    const trimmedEmail = (values.email || '').trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      notifyError('Lỗi', 'Email không hợp lệ');
      return;
    }

    // Payload theo đúng shape LawyerRequest/BE LawyerPatchRequest
    // Khi EDIT: vẫn dùng PATCH nên có thể bỏ qua field không thay đổi
    // Khi CREATE: cần đầy đủ field
    const isEdit = !!editing;
    const newSlug = trimmedName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 50) || `lawyer-${Date.now()}`;

    const payload: Record<string, unknown> = {
      // Khi EDIT: giữ slug cũ trừ khi user đổi tên
      slug: isEdit ? editing.slug || newSlug : newSlug,
      // nameEn: nếu đang edit mà có nameEn riêng → giữ, ngược lại mirror nameVi
      nameVi: trimmedName,
      nameEn: isEdit && editing.nameEn && editing.nameEn !== editing.name ? editing.nameEn : trimmedName,
      bioVi: values.bio || '',
      bioEn: values.bio || '',
      positionVi: values.title || 'Luật sư',
      positionEn: values.title || 'Lawyer',
      experienceYears: Number(values.experience) || 0,
      avatarUrl: values.avatar || null,
      languages: values.specialties || [],
      serviceIds: values.serviceIds || [],
      isFeatured: values.isActive ?? true,
      email: trimmedEmail,
      phone: values.phone || null,
    };

    // Khi EDIT mà email đã từng link user: gửi kèm userId để BE biết giữ user hiện tại
    if (isEdit && editing.userId) {
      // không cần kèm - BE có logic giữ user nếu email không đổi
    }

    // Khi EDIT: nếu email KHÔNG đổi so với user hiện tại → không cần password
    // ngược lại: cần password để tạo user mới (nếu email chưa tồn tại)
    const emailChanged = isEdit && editing.email && editing.email !== trimmedEmail;
    const emailIsNew = !isEdit || emailChanged;
    if (emailIsNew && !values.email?.includes('@')) {
      // email format đã check ở trên rồi; chỉ guard thêm
    }

    try {
      if (editing) {
        await updateLwy(editing.id, payload);
        setFormOpen(false);
        setEditing(null);
      } else {
        const result = await createLwy(payload as Record<string, unknown>);
        // Nếu BE tự tạo user mới với mật khẩu mặc định → nhắc admin copy
        const defaultPwd = (result as { defaultPassword?: string })?.defaultPassword;
        if (defaultPwd) {
          notifySuccess(
            `Tạo tài khoản thành công. Mật khẩu mặc định: "${defaultPwd}" - vui lòng gửi cho luật sư để họ đăng nhập lần đầu.`,
          );
        }
        setFormOpen(false);
        setEditing(null);
      }
    } catch (e) {
      notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể lưu');
    }
  };

  const handleToggleActive = useCallback(
    async (l: Lawyer) => {
      try {
        // Map isActive → isFeatured (BE dùng isFeatured để đồng nghĩa Hoạt động/Tạm dừng)
        await updateLwy(l.id, { isFeatured: !l.isActive });
        notifySuccess(l.isActive ? `Đã tạm dừng ${l.name}` : `Đã kích hoạt ${l.name}`);
      } catch (e) {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể cập nhật');
      }
    },
    [updateLwy],
  );

  return (
    <>
      <AdminPageHeader
        title="Đội ngũ luật sư"
        subtitle={`${counts.total} luật sư · ${counts.active} hoạt động · ${counts.inactive} tạm dừng`}
        actions={
          canWrite && (
            <button
              type="button"
              className="action-btn action-btn--primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={14} /> Thêm luật sư
            </button>
          )
        }
      />

      <FilterTabs
        tabs={tabsWithCounts}
        activeValue={statusFilter}
        onChange={(v) => {
          setStatusFilter(v as typeof statusFilter);
          setPage(1);
        }}
      />

      <div className="admin-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <SearchBar
            value={searchInput}
            onChange={(v) => {
              setSearchInput(v);
            }}
            placeholder="Tìm theo tên, email, chuyên môn..."
          />
          <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>
            Tổng: {filtered.length} / {lawyers.length}
          </span>
        </div>

        <LawyersTable
          data={paginated}
          services={services}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          onEdit={(l) => {
            setEditing(l);
            setFormOpen(true);
          }}
          onDelete={(l) => setConfirmDelete(l)}
          onToggleActive={handleToggleActive}
          canWrite={canWrite}
          canDelete={canDelete}
        />

        <Pagination
          page={page}
          limit={LIMIT}
          total={filtered.length}
          onPageChange={setPage}
        />
      </div>

      <LawyerForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        initial={editing}
        services={services}
        isLoading={createLwy.isPending || updateLwy.isPending}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Xóa luật sư"
        message={
          confirmDelete
            ? `Bạn có chắc muốn xóa "${confirmDelete.name}"? Hành động này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={async () => {
          if (!confirmDelete) return;
          try {
            await removeLwy(confirmDelete.id);
            // Notification 'Đã xóa' được handle trong hook useDeleteLawyer
          } catch (e) {
            notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể xóa');
          } finally {
            setConfirmDelete(null);
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </>
  );
}

// ─── Tab 3: Assignment Matrix ───────────────────────────────────────────
function AssignmentTab() {
  const { services, lawyers, isAssigned, toggle, saveBatch, servicesError, lawyersError } = useAssignment();

  return (
    <>
      <AdminPageHeader
        title="Phân công dịch vụ × Luật sư"
        subtitle="Ma trận phân công 2D. Tick ô tương ứng để gán / bỏ gán."
      />
      <AssignmentMatrix
        services={services}
        lawyers={lawyers}
        isAssigned={isAssigned}
        onToggle={toggle}
        onSaveBatch={saveBatch}
        apiError={servicesError ?? lawyersError}
      />
    </>
  );
}

// ─── Tab 4: Schedule ────────────────────────────────────────────────────
function ScheduleTab() {
  const { data: lawyers = [] } = useLawyers();
  const [selectedLawyerId, setSelectedLawyerId] = useState<string>('');

  const selectedLawyer = useMemo(
    () => lawyers.find((l) => l.id === selectedLawyerId) ?? null,
    [lawyers, selectedLawyerId],
  );

  return (
    <>
      <AdminPageHeader
        title="Lịch làm việc luật sư"
        subtitle="Thiết lập khung giờ làm việc cho từng luật sư theo ngày trong tuần"
      />
      <LawyerScheduleEditor
        lawyer={selectedLawyer}
        lawyers={lawyers}
        onSelectLawyer={setSelectedLawyerId}
      />
    </>
  );
}

// re-export for convenience (avoid unused import warning if needed)
void FileText;