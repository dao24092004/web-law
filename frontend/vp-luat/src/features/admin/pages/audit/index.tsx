'use client';

import { useState, useMemo, useRef } from 'react';
import {
  Search,
  Download,
  Trash2,
  X,
  ChevronRight,
  Activity,
  ExternalLink,
  LogIn,
  LogOut,
  Edit3,
  Plus,
  UserX,
  Send,
  Archive,
  ArchiveRestore,
  Shield,
  CheckCircle2,
  Power,
} from 'lucide-react';
import {
  StatusBadge,
  Drawer,
  SearchBar,
  ConfirmDialog,
  AdminPageHeader,
} from '@/features/admin/shared';
import { useCan } from '@/features/admin/lib';
import { useAdminAuth } from '@/features/admin/pages/users/hooks/use-admin-auth';
import {
  useAuditLogs,
  useClearAuditLogs,
  useExportAuditLogs,
} from '@/features/admin/pages/settings/hooks/use-settings';
import type { AuditLog } from '@/features/admin/types';

const ACTION_VARIANT: Record<
  string,
  'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'gray'
> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  status_change: 'yellow',
  impersonate: 'red',
  login: 'purple',
  logout: 'purple',
  publish: 'blue',
  unpublish: 'blue',
  send: 'blue',
  export: 'gray',
  assign: 'yellow',
  restore: 'green',
  cancel: 'red',
};

const ACTION_ICON: Record<string, React.ReactNode> = {
  create: <Plus size={11} />,
  update: <Edit3 size={11} />,
  delete: <UserX size={11} />,
  impersonate: <Shield size={11} />,
  login: <LogIn size={11} />,
  logout: <LogOut size={11} />,
  publish: <CheckCircle2 size={11} />,
  send: <Send size={11} />,
  export: <Download size={11} />,
  restore: <ArchiveRestore size={11} />,
  cancel: <Power size={11} />,
  status_change: <Edit3 size={11} />,
  unpublish: <Archive size={11} />,
  assign: <Edit3 size={11} />,
};

export default function AuditPage() {
  const canRead = useCan('audit.read');
  const { currentUser, effectiveUser, isImpersonating } = useAdminAuth();
  const canDelete = currentUser?.role === 'SUPER_ADMIN';
  const { data: logs } = useAuditLogs();
  const clearLogs = useClearAuditLogs();
  const exportLogs = useExportAuditLogs();

  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [drawerLog, setDrawerLog] = useState<AuditLog | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const LIMIT = 50;

  const actors = useMemo(() => {
    const set = new Set<string>();
    for (const l of logs) set.add(l.actorName);
    return Array.from(set);
  }, [logs]);

  const actions = useMemo(() => {
    const set = new Set<string>();
    for (const l of logs) set.add(l.action);
    return Array.from(set).sort();
  }, [logs]);

  const entities = useMemo(() => {
    const set = new Set<string>();
    for (const l of logs) set.add(l.entity ?? l.entityType ?? '');
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    let r = logs;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (l) =>
          l.actorName.toLowerCase().includes(q) ||
          (l.entityLabel?.toLowerCase().includes(q) ?? false) ||
          (l.entityId?.toLowerCase().includes(q) ?? false) ||
          (l.entity?.toLowerCase().includes(q) ?? false),
      );
    }
    if (actorFilter !== 'all') r = r.filter((l) => l.actorName === actorFilter);
    if (actionFilter !== 'all') r = r.filter((l) => l.action === actionFilter);
    if (entityFilter !== 'all') r = r.filter((l) => l.entity === entityFilter);
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      r = r.filter((l) => new Date(l.createdAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000;
      r = r.filter((l) => new Date(l.createdAt).getTime() < to);
    }
    return r;
  }, [logs, search, actorFilter, actionFilter, entityFilter, dateFrom, dateTo]);

  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  if (!canRead) {
    return (
      <div
        className="admin-view"
        style={{ padding: 32, textAlign: 'center', color: 'var(--gray-500)' }}
      >
        Bạn không có quyền xem audit log.
      </div>
    );
  }

  return (
    <div className="admin-view">
      <AdminPageHeader
        title="Audit Log"
        subtitle={
          isImpersonating
            ? `Theo dõi mọi thao tác — actor ghi: ${currentUser?.name} (đang impersonate ${effectiveUser?.name})`
            : 'Theo dõi mọi thao tác trong hệ thống'
        }
        actions={
          <div style={{ display: 'flex', gap: 6, position: 'relative' }} ref={exportMenuRef}>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="action-btn action-btn--primary"
                onClick={() => setShowExportMenu((p) => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Download size={12} /> Export
              </button>
              {showExportMenu && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      right: 0,
                      background: 'white',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      zIndex: 10,
                      minWidth: 160,
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        exportLogs('csv', filtered);
                        setShowExportMenu(false);
                      }}
                      style={menuBtnStyle()}
                    >
                      <Download size={12} /> CSV (Excel)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportLogs('json', filtered);
                        setShowExportMenu(false);
                      }}
                      style={menuBtnStyle()}
                    >
                      <Download size={12} /> JSON
                    </button>
                  </div>
                </>
              )}
            </div>
            {canDelete && (
              <button
                type="button"
                className="action-btn"
                onClick={() => setConfirmClear(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--danger, #DC2626)',
                }}
              >
                <Trash2 size={12} /> Clear all
              </button>
            )}
          </div>
        }
      />

      <div className="admin-grid-4" style={{ marginBottom: 12 }}>
        <StatBox
          icon={<Activity size={14} />}
          label="Tổng log"
          value={logs.length}
          color="var(--primary)"
        />
        <StatBox
          icon={<LogIn size={14} />}
          label="Login/Logout"
          value={logs.filter((l) => l.action === 'login' || l.action === 'logout').length}
          color="var(--purple, #8B5CF6)"
        />
        <StatBox
          icon={<Edit3 size={14} />}
          label="Mutations"
          value={logs.filter((l) => ['create', 'update', 'delete'].includes(l.action)).length}
          color="var(--blue, #2563EB)"
        />
        <StatBox
          icon={<Shield size={14} />}
          label="Impersonate"
          value={logs.filter((l) => l.action === 'impersonate').length}
          color="var(--warning, #D97706)"
        />
      </div>

      <div
        style={{
          background: 'white',
          border: '1px solid var(--gray-200)',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <div className="admin-filter-grid">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Tìm actor, label, entity..."
          />
          <FilterSelect
            label="Actor"
            value={actorFilter}
            onChange={(v) => {
              setActorFilter(v);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Tất cả' },
              ...actors.map((a) => ({ value: a, label: a })),
            ]}
          />
          <FilterSelect
            label="Action"
            value={actionFilter}
            onChange={(v) => {
              setActionFilter(v);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Tất cả' },
              ...actions.map((a) => ({ value: a, label: a })),
            ]}
          />
          <FilterSelect
            label="Entity"
            value={entityFilter}
            onChange={(v) => {
              setEntityFilter(v);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Tất cả' },
              ...entities.map((e) => ({ value: e, label: e })),
            ]}
          />
          <div>
            <label style={lbl()}>Từ ngày</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              style={dateIn()}
            />
          </div>
          <div>
            <label style={lbl()}>Đến ngày</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              style={dateIn()}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setActorFilter('all');
              setActionFilter('all');
              setEntityFilter('all');
              setDateFrom('');
              setDateTo('');
              setPage(1);
            }}
            className="action-btn"
            title="Xóa filter"
            style={{ height: 34 }}
          >
            <X size={12} />
          </button>
        </div>
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid var(--gray-100)',
            fontSize: '0.78rem',
            color: 'var(--gray-500)',
          }}
        >
          Hiển thị <strong>{filtered.length}</strong> / {logs.length} log — trang {page} /{' '}
          {Math.max(1, Math.ceil(filtered.length / LIMIT))}
        </div>
      </div>

      <div
        style={{
          background: 'white',
          border: '1px solid var(--gray-200)',
          borderRadius: 8,
          overflow: 'auto',
        }}
      >
        <table className="data-table" style={{ fontSize: '0.78rem' }}>
          <thead>
            <tr>
              <th style={th(140)}>Thời gian</th>
              <th style={th(120)}>Actor</th>
              <th style={th(110)}>Action</th>
              <th style={th(140)}>Entity</th>
              <th>Label</th>
              <th style={th(90)}>Diff</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--gray-500)' }}>
                  {logs.length === 0
                    ? 'Chưa có log nào. Hệ thống sẽ ghi log khi có bất kỳ thao tác nào.'
                    : 'Không có log nào khớp filter.'}
                </td>
              </tr>
            ) : (
              paginated.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={td()}>
                    <span style={{ color: 'var(--gray-600)' }}>
                      {new Intl.DateTimeFormat('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      }).format(new Date(l.createdAt))}
                    </span>
                  </td>
                  <td style={td()}>
                    <div style={{ fontWeight: 600 }}>{l.actorName}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--gray-400)' }}>{l.actorId}</div>
                  </td>
                  <td style={td()}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        background: 'var(--primary-faint, #EFF3F8)',
                        color: 'var(--primary)',
                        borderRadius: 999,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {ACTION_ICON[l.action] ?? <Activity size={11} />}
                      {l.action}
                    </span>
                  </td>
                  <td style={td()}>
                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{l.entity}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--gray-400)' }}>{l.entityId}</div>
                  </td>
                  <td style={td()}>
                    <span style={{ color: 'var(--gray-700)' }}>{l.entityLabel ?? '—'}</span>
                  </td>
                  <td style={td()}>
                    {l.diff && Object.keys(l.diff).length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setDrawerLog(l as unknown as AuditLog)}
                        className="action-btn action-btn--primary"
                        style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                      >
                        <ChevronRight size={11} /> View
                      </button>
                    ) : (
                      <span style={{ color: 'var(--gray-300)', fontSize: '0.7rem' }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > LIMIT && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginTop: 12,
            fontSize: '0.78rem',
          }}
        >
          <button
            type="button"
            className="action-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ‹ Trước
          </button>
          <span style={{ padding: '0 12px', color: 'var(--gray-600)' }}>
            Trang {page} / {Math.ceil(filtered.length / LIMIT)}
          </span>
          <button
            type="button"
            className="action-btn"
            onClick={() =>
              setPage((p) => Math.min(Math.ceil(filtered.length / LIMIT), p + 1))
            }
            disabled={page >= Math.ceil(filtered.length / LIMIT)}
          >
            Sau ›
          </button>
        </div>
      )}

      <Drawer
        isOpen={Boolean(drawerLog)}
        onClose={() => setDrawerLog(null)}
        title={drawerLog ? `${drawerLog.action} — ${drawerLog.entity}` : ''}
        width={560}
      >
        {drawerLog && <LogDetail log={drawerLog} />}
      </Drawer>

      <ConfirmDialog
        isOpen={confirmClear}
        title="Xóa toàn bộ audit log"
        message="Hành động không thể hoàn tác. Toàn bộ log sẽ bị xóa vĩnh viễn."
        confirmLabel="Xóa tất cả"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={async () => {
          const cleared = await clearLogs();
          if (cleared) setConfirmClear(false);
        }}
        onClose={() => setConfirmClear(false)}
      />
    </div>
  );
}

function LogDetail({ log }: { log: AuditLog }) {
  const fields = log.diff ? Object.entries(log.diff) : [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          padding: 10,
          background: 'var(--gray-50)',
          borderRadius: 6,
          fontSize: '0.78rem',
        }}
      >
        <Row label="Thời gian" value={new Date(log.createdAt).toLocaleString('vi-VN')} />
        <Row label="Actor" value={`${log.actorName} (${log.actorId})`} />
        <Row label="Action" value={log.action} />
        <Row label="Entity" value={`${log.entity} (${log.entityId})`} />
        {log.entityLabel && <Row label="Label" value={log.entityLabel} />}
      </div>

      <div>
        <h4
          style={{
            margin: '0 0 8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--primary)',
          }}
        >
          Diff ({fields.length} field{fields.length !== 1 ? 's' : ''})
        </h4>
        {fields.length === 0 ? (
          <div style={{ padding: 12, color: 'var(--gray-500)', fontSize: '0.78rem' }}>
            Không có diff (chỉ ghi log, không kèm thay đổi)
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fields.map(([key, d]) => (
              <div
                key={key}
                style={{
                  border: '1px solid var(--gray-200)',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '6px 10px',
                    background: 'var(--gray-50)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    borderBottom: '1px solid var(--gray-200)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{key}</span>
                  <span style={{ color: 'var(--gray-400)', fontSize: '0.65rem', fontWeight: 400 }}>
                    {d.before !== undefined ? 'changed' : 'new'}
                  </span>
                </div>
                <div
                  className="admin-grid-2"
                  style={{
                    gap: 1,
                    background: 'var(--gray-200)',
                  }}
                >
                  <DiffPane label="Trước" value={d.before} variant="before" />
                  <DiffPane label="Sau" value={d.after} variant="after" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DiffPane({
  label,
  value,
  variant,
}: {
  label: string;
  value: unknown;
  variant: 'before' | 'after';
}) {
  const bg = variant === 'before' ? '#FEE2E2' : '#D1FAE5';
  return (
    <div style={{ background: 'white' }}>
      <div
        style={{
          padding: '4px 10px',
          fontSize: '0.65rem',
          fontWeight: 700,
          color: variant === 'before' ? '#991B1B' : '#065F46',
          background: bg,
        }}
      >
        {label}
      </div>
      <pre
        style={{
          margin: 0,
          padding: 8,
          fontSize: '0.7rem',
          fontFamily: 'monospace',
          color: 'var(--gray-800)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: 200,
          overflow: 'auto',
        }}
      >
        {value === undefined
          ? '—'
          : value === null
            ? 'null'
            : typeof value === 'object'
              ? JSON.stringify(value, null, 2)
              : String(value)}
      </pre>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', padding: '4px 0', borderBottom: '1px solid var(--gray-100)' }}>
      <div style={{ width: 90, color: 'var(--gray-500)', fontWeight: 500 }}>{label}:</div>
      <div style={{ flex: 1, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label style={lbl()}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={dateIn()}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--gray-200)',
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: '0.72rem',
          color: 'var(--gray-500)',
        }}
      >
        {icon} {label}
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function lbl(): React.CSSProperties {
  return {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--gray-600)',
    marginBottom: 4,
  };
}
function dateIn(): React.CSSProperties {
  return {
    width: '100%',
    padding: '6px 8px',
    border: '1.5px solid var(--gray-200)',
    borderRadius: 6,
    fontSize: '0.78rem',
    background: 'white',
  };
}
function menuBtnStyle(): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    padding: '8px 12px',
    fontSize: '0.78rem',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  };
}
function th(width?: number): React.CSSProperties {
  return {
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: '2px solid var(--gray-200)',
    fontWeight: 600,
    background: 'var(--gray-50)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    width,
  };
}
function td(): React.CSSProperties {
  return { padding: '6px 10px' };
}

void ExternalLink;
void Search;
void StatusBadge;