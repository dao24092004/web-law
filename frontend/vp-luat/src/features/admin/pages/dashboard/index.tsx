'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  UserPlus,
  TrendingUp,
  MessagesSquare,
  ArrowUpRight,
  ArrowDownRight,
  PenLine,
  CalendarCheck,
  MailOpen,
  CalendarX2,
  Star,
  MessageCircle,
  FileText,
  BarChart3,
  CheckCircle2,
  Phone,
  CircleDot,
  Eye,
  RefreshCw,
  Download,
  Filter,
  DollarSign,
  Award,
  AlertCircle,
  X,
  Pencil,
  Loader2,
} from 'lucide-react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  SortableContext,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { Badge, RowUser, LineChart, DonutChart } from '@/features/admin/shared';
import type { ChartDataPoint, DonutSegment } from '@/features/admin/types';
import { notifySuccess, notifyError, toBackendStatus, useUpdateLead } from '@/features/admin/lib';
import { leadApi, reviewApi } from '@/lib/api/admin-crm';
import { bookingApi } from '@/lib/api/admin-booking';
import { useMutation } from '@tanstack/react-query';
import {
  useDashboardStats,
  useRecentActivity,
  useServiceDistribution,
  useLeadFunnel,
  useRevenueSeries,
  useVisitorSeries,
  DASHBOARD_RANGES,
  rangeStart,
  type DashboardRange,
  getInitials,
  timeAgo,
} from '@/features/admin/lib/use-dashboard-stats';
import { useLeadKanban, useBookingKanban, useReviewKanban } from './hooks/use-dashboard-kanban';
import { SkeletonStats, SkeletonTable, SkeletonCard } from '@/features/admin/components';
import type { AuditLog, Lead, LeadStatus, Booking, BookingMethod, Review } from '@/features/admin/types';
import { useQueryClient } from '@tanstack/react-query';

// ─── Date Range Filter ──────────────────────────────────────────────────────
// Range values imported from use-dashboard-stats (single source of truth)

// ─── Stat Card ─────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  iconVariant: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'cyan';
  value: string | number;
  label: string;
  change: number;
  changeLabel?: string;
  showArrow?: boolean;
  onClick?: () => void;
}

function StatCard({ icon, iconVariant, value, label, change, changeLabel, showArrow = true, onClick }: StatCardProps) {
  const isUp = change >= 0;
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="stat-card__header">
        <div className={`stat-card__icon stat-card__icon--${iconVariant}`}>{icon}</div>
        <span className={`stat-card__trend ${isUp ? 'stat-card__trend--up' : 'stat-card__trend--down'}`}>
          {showArrow ? (isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />) : null}
          {isUp ? '+' : ''}
          {change}
        </span>
      </div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__sub">{changeLabel ?? 'So với tháng trước'}</div>
    </div>
  );
}

// ─── Booking Table ─────────────────────────────────────────────────────────

type BookingMethodVN = 'Tại VP' | 'Online' | 'Điện thoại';
const METHOD_LABEL: Record<BookingMethod, BookingMethodVN> = {
  office: 'Tại VP',
  online: 'Online',
  phone: 'Điện thoại',
};

interface BookingTableProps {
  bookings: Booking[];
  onSelect: (b: Booking) => void;
  onNote: (b: Booking) => void;
}

function BookingTable({ bookings, onSelect, onNote }: BookingTableProps) {
  return (
    <div className="admin-card table-card">
      <div className="table-header">
        <div className="table-title">
          Lịch hẹn hôm nay <span>({bookings.length} cuộc)</span>
        </div>
        <Link href="/admin/bookings" className="admin-card__action">
          Xem tất cả →
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>
          <CalendarDays size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Không có lịch hẹn nào hôm nay</div>
          <div style={{ fontSize: '0.72rem' }}>Các lịch hẹn mới sẽ tự động hiển thị ở đây</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Giờ</th>
                <th scope="col">Khách hàng</th>
                <th scope="col">Dịch vụ</th>
                <th scope="col">Luật sư</th>
                <th scope="col">Hình thức</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong style={{ color: 'var(--primary, #1E3A5F)' }}>{b.time}</strong>
                  </td>
                  <td>
                    <RowUser
                      initials={getInitials(b.customerName)}
                      name={b.customerName}
                      sub={b.customerEmail || b.customerPhone}
                    />
                  </td>
                  <td style={{ color: 'var(--gray-600)', fontSize: '0.82rem' }}>{b.service}</td>
                  <td style={{ color: 'var(--gray-700)', fontSize: '0.82rem' }}>{b.lawyer}</td>
                  <td style={{ color: 'var(--gray-600)', fontSize: '0.82rem' }}>{METHOD_LABEL[b.method]}</td>
                  <td>
                    <BookingStatusBadge status={b.status} />
                  </td>
                  <td>
                    <div className="action-btns">
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => onSelect(b)}
                        aria-label={`Xem chi tiết ${b.customerName}`}
                      >
                        <Eye size={11} /> Xem
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => onNote(b)}
                        aria-label={`Ghi chú ${b.customerName}`}
                      >
                        <Pencil size={11} /> Ghi chú
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const BOOKING_STATUS_MAP: Record<string, { label: string; variant: 'green' | 'yellow' | 'red' | 'blue' }> = {
  confirmed: { label: 'Đã xác nhận', variant: 'green' },
  pending: { label: 'Chờ xác nhận', variant: 'yellow' },
  cancelled: { label: 'Đã hủy', variant: 'red' },
  completed: { label: 'Hoàn tất', variant: 'blue' },
};

function BookingStatusBadge({ status }: { status: string }) {
  const s = BOOKING_STATUS_MAP[status] ?? BOOKING_STATUS_MAP.pending!;
  const Icon =
    status === 'confirmed'
      ? CheckCircle2
      : status === 'pending'
        ? CircleDot
        : status === 'cancelled'
          ? CalendarX2
          : status === 'completed'
            ? CheckCircle2
            : Phone;
  return (
    <Badge variant={s.variant}>
      <Icon size={9} strokeWidth={3} />
      {s.label}
    </Badge>
  );
}

// ─── Lead Kanban ───────────────────────────────────────────────────────────

interface KanbanCard {
  id: string;
  name: string;
  service: string;
  time: string;
  lead: Lead;
}

const KANBAN_COLUMNS: Array<{
  id: LeadStatus;
  label: string;
  color: string;
}> = [
  { id: 'new', label: 'Mới', color: '#2563EB' },
  { id: 'contacted', label: 'Đã liên hệ', color: '#D97706' },
  { id: 'progress', label: 'Đang tư vấn', color: '#7C3AED' },
  { id: 'converted', label: 'Đã chuyển đổi', color: '#059669' },
];

function SortableKanbanCard({ card, dotColor }: { card: KanbanCard; dotColor: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, strategy: rectSortingStrategy });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.35 : 1,
    background: 'var(--white)',
    borderRadius: 'var(--radius-md, 8px)',
    padding: '10px 12px',
    border: '1px solid var(--gray-200, #E4E8EF)',
    boxShadow: '0 1px 3px rgb(15 23 42 / 0.04)',
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="kanban__card-name">{card.name}</div>
      <div className="kanban__card-service">{card.service}</div>
      <div className="kanban__card-meta">
        <div className="kanban__card-time">{card.time}</div>
        <div className="kanban__card-dot" style={{ background: dotColor }} />
      </div>
    </div>
  );
}

function KanbanBoard({ range }: { range: DashboardRange }) {
  const qc = useQueryClient();
  const { data: allLeads, isLoading } = useLeadKanban();
  const updateLead = useUpdateLead();

  const leads = useMemo(() => {
    const start = rangeStart(range).getTime();
    return (allLeads ?? []).filter((l) => new Date(l.createdAt).getTime() >= start);
  }, [allLeads, range]);

  const [columnItems, setColumnItems] = useState<Record<string, string[]>>({});
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  useEffect(() => {
    if (!leads) return;
    const grouped: Record<string, string[]> = {
      new: [],
      contacted: [],
      progress: [],
      converted: [],
      lost: [],
    };
    leads.forEach((l) => {
      if (grouped[l.status]) grouped[l.status]!.push(l.id);
    });
    setColumnItems(grouped);
  }, [leads]);

  const cards = useMemo<Record<string, KanbanCard>>(() => {
    const map: Record<string, KanbanCard> = {};
    (leads ?? []).forEach((l) => {
      map[l.id] = {
        id: l.id,
        name: l.name,
        service: l.service,
        time: timeAgo(l.createdAt),
        lead: l,
      };
    });
    return map;
  }, [leads]);

  const activeCard = activeCardId ? cards[activeCardId] : null;
  const activeColumnColor =
    KANBAN_COLUMNS.find((c) => columnItems[c.id]?.includes(activeCardId ?? ''))?.color ?? '#2563EB';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveCardId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback(
    (event: DragStartEvent | DragEndEvent) => {
      if (!('over' in event) || !event.over) return;
      const overId = String(event.over.id);
      if (!overId) return;
      const fromColumnId = Object.keys(columnItems).find((k) => columnItems[k]?.includes(String(event.active.id)));
      const overColumn = KANBAN_COLUMNS.find((c) => columnItems[c.id]?.includes(overId));
      if (!overColumn || !fromColumnId || fromColumnId === overColumn.id) return;

      setColumnItems((prev) => {
        const fromColumn = prev[fromColumnId];
        const toColumn = prev[overColumn.id];
        if (!fromColumn || !toColumn) return prev;
        const moved = fromColumn.find((id) => id === String(event.active.id));
        if (!moved) return prev;
        return {
          ...prev,
          [fromColumnId]: fromColumn.filter((id) => id !== moved),
          [overColumn.id]: [...toColumn, moved],
        };
      });
    },
    [columnItems],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const id = String(event.active.id);
      const targetColumn = KANBAN_COLUMNS.find((c) => columnItems[c.id]?.includes(id));
      setActiveCardId(null);
      if (!targetColumn) return;
      const before = cards[id]?.lead;
      if (!before || before.status === targetColumn.id) return;
      const backendStatus = toBackendStatus(targetColumn.id);
      if (!backendStatus) {
        notifyError('Trạng thái không hợp lệ', targetColumn.id);
        return;
      }
      try {
        await updateLead.mutateAsync({
          id,
          patch: { status: backendStatus },
        });
        notifySuccess(
          `Đã chuyển "${before.name}" → ${targetColumn.label}`,
          undefined,
        );
        qc.invalidateQueries({ queryKey: ['admin', 'kanban', 'leads'] });
        qc.invalidateQueries({ queryKey: ['admin', 'crm', 'leads'] });
      } catch (e) {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể cập nhật');
        qc.invalidateQueries({ queryKey: ['admin', 'kanban', 'leads'] });
        qc.invalidateQueries({ queryKey: ['admin', 'crm', 'leads'] });
      }
    },
    [columnItems, cards, updateLead, qc],
  );

  if (isLoading) {
    return (
      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Lead Pipeline</div>
        </div>
        <SkeletonCard rows={3} />
      </div>
    );
  }

  const totalLeads = Object.values(columnItems).reduce((s, arr) => s + (arr?.length ?? 0), 0);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">
            Lead Pipeline ({totalLeads} • {DASHBOARD_RANGES.find((r) => r.value === range)?.label ?? '7 ngày'})
          </div>
          <Link href="/admin/crm" className="admin-card__action">
            Quản lý CRM →
          </Link>
        </div>
        {totalLeads === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>
            <UserPlus size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Chưa có lead nào</div>
            <div style={{ fontSize: '0.72rem' }}>Lead mới từ form/chatbot sẽ xuất hiện ở đây</div>
          </div>
        ) : (
          <div className="kanban">
            {KANBAN_COLUMNS.map((column) => (
              <SortableContext
                key={column.id}
                items={columnItems[column.id] ?? []}
                strategy={horizontalListSortingStrategy}
              >
                <div key={column.id} className={`kanban__col kanban__col--${column.id}`}>
                  <div className="kanban__col-header">
                    <span className="kanban__col-title">{column.label}</span>
                    <span className="kanban__col-count">{columnItems[column.id]?.length ?? 0}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(columnItems[column.id] ?? []).map((cardId) => {
                      const card = cards[cardId];
                      if (!card) return null;
                      return (
                        <SortableKanbanCard key={cardId} card={card} dotColor={column.color} />
                      );
                    })}
                  </div>
                </div>
              </SortableContext>
            ))}
          </div>
        )}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--gray-200)',
              borderRadius: 10,
              padding: '10px 12px',
              width: 220,
              boxShadow: '0 20px 25px -5px rgb(15 23 42 / 0.18)',
            }}
          >
            <div className="kanban__card-name">{activeCard.name}</div>
            <div className="kanban__card-service">{activeCard.service}</div>
            <div className="kanban__card-meta">
              <div className="kanban__card-time">{activeCard.time}</div>
              <div className="kanban__card-dot" style={{ background: activeColumnColor }} />
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ─── Booking Kanban ────────────────────────────────────────────────────────

interface BookingKanbanCard {
  id: string;
  name: string;
  service: string;
  time: string;
  booking: Booking;
}

const BOOKING_KANBAN_COLUMNS: Array<{
  id: Booking['status'];
  label: string;
  color: string;
}> = [
  { id: 'pending', label: 'Chờ xác nhận', color: '#D97706' },
  { id: 'confirmed', label: 'Đã xác nhận', color: '#2563EB' },
  { id: 'completed', label: 'Hoàn tất', color: '#059669' },
  { id: 'cancelled', label: 'Đã hủy', color: '#DC2626' },
];

function SortableBookingCard({
  card,
  dotColor,
}: {
  card: BookingKanbanCard;
  dotColor: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, strategy: rectSortingStrategy });
  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.35 : 1,
    background: 'var(--white)',
    borderRadius: 8,
    padding: '10px 12px',
    border: '1px solid var(--gray-200, #E4E8EF)',
    boxShadow: '0 1px 3px rgb(15 23 42 / 0.04)',
    cursor: 'grab',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="kanban__card-name">{card.name}</div>
      <div className="kanban__card-service">{card.service}</div>
      <div className="kanban__card-meta">
        <div className="kanban__card-time">{card.time}</div>
        <div className="kanban__card-dot" style={{ background: dotColor }} />
      </div>
    </div>
  );
}

function BookingKanbanBoard({ range }: { range: DashboardRange }) {
  const qc = useQueryClient();
  const { data: allBookings, isLoading } = useBookingKanban();
  const updateBooking = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => bookingApi.updateStatus(id, status),
  });

  const bookings = useMemo(() => {
    const start = rangeStart(range).getTime();
    return (allBookings ?? []).filter(
      (b) => new Date(b.date).getTime() >= start,
    );
  }, [allBookings, range]);

  const [columnItems, setColumnItems] = useState<Record<string, string[]>>({});
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  useEffect(() => {
    if (!bookings) return;
    const grouped: Record<string, string[]> = {
      pending: [],
      confirmed: [],
      completed: [],
      cancelled: [],
    };
    bookings.forEach((b) => {
      if (grouped[b.status]) grouped[b.status]!.push(b.id);
    });
    setColumnItems(grouped);
  }, [bookings]);

  const cards = useMemo<Record<string, BookingKanbanCard>>(() => {
    const map: Record<string, BookingKanbanCard> = {};
    (bookings ?? []).forEach((b) => {
      map[b.id] = {
        id: b.id,
        name: b.customerName,
        service: b.service,
        time: `${b.date} ${b.time}`,
        booking: b,
      };
    });
    return map;
  }, [bookings]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveCardId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback(
    (event: DragStartEvent | DragEndEvent) => {
      if (!('over' in event) || !event.over) return;
      const overId = String(event.over.id);
      const fromColumnId = Object.keys(columnItems).find((k) =>
        columnItems[k]?.includes(String(event.active.id)),
      );
      const overColumn = BOOKING_KANBAN_COLUMNS.find((c) =>
        columnItems[c.id]?.includes(overId),
      );
      if (!overColumn || !fromColumnId || fromColumnId === overColumn.id) return;
      setColumnItems((prev) => {
        const fromColumn = prev[fromColumnId];
        const toColumn = prev[overColumn.id];
        if (!fromColumn || !toColumn) return prev;
        const moved = fromColumn.find((id) => id === String(event.active.id));
        if (!moved) return prev;
        return {
          ...prev,
          [fromColumnId]: fromColumn.filter((id) => id !== moved),
          [overColumn.id]: [...toColumn, moved],
        };
      });
    },
    [columnItems],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const id = String(event.active.id);
      const targetColumn = BOOKING_KANBAN_COLUMNS.find((c) =>
        columnItems[c.id]?.includes(id),
      );
      setActiveCardId(null);
      if (!targetColumn) return;
      const before = cards[id]?.booking;
      if (!before || before.status === targetColumn.id) return;
      try {
        await updateBooking.mutateAsync({
          id,
          status: targetColumn.id.toUpperCase(),
        });
        notifySuccess(
          `Đã chuyển "${before.customerName}" → ${targetColumn.label}`,
        );
        qc.invalidateQueries({ queryKey: ['admin', 'kanban', 'bookings'] });
        qc.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      } catch (e) {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể cập nhật');
        qc.invalidateQueries({ queryKey: ['admin', 'kanban', 'bookings'] });
        qc.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      }
    },
    [columnItems, cards, updateBooking, qc],
  );

  if (isLoading) {
    return (
      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Booking Pipeline</div>
        </div>
        <SkeletonCard rows={3} />
      </div>
    );
  }

  const total = Object.values(columnItems).reduce((s, arr) => s + (arr?.length ?? 0), 0);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">
            Booking Pipeline ({total} • {DASHBOARD_RANGES.find((r) => r.value === range)?.label ?? '7 ngày'})
          </div>
          <Link href="/admin/bookings" className="admin-card__action">
            Quản lý Bookings →
          </Link>
        </div>
        {total === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>
            <CalendarDays size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Chưa có booking nào</div>
            <div style={{ fontSize: '0.72rem' }}>Lịch hẹn mới sẽ xuất hiện ở đây</div>
          </div>
        ) : (
          <div className="kanban">
            {BOOKING_KANBAN_COLUMNS.map((column) => (
              <SortableContext
                key={column.id}
                items={columnItems[column.id] ?? []}
                strategy={horizontalListSortingStrategy}
              >
                <div key={column.id} className={`kanban__col kanban__col--${column.id}`}>
                  <div className="kanban__col-header">
                    <span className="kanban__col-title">{column.label}</span>
                    <span className="kanban__col-count">{columnItems[column.id]?.length ?? 0}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(columnItems[column.id] ?? []).map((cardId) => {
                      const card = cards[cardId];
                      if (!card) return null;
                      return (
                        <SortableBookingCard key={cardId} card={card} dotColor={column.color} />
                      );
                    })}
                  </div>
                </div>
              </SortableContext>
            ))}
          </div>
        )}
      </div>
    </DndContext>
  );
}

// ─── Review Kanban ─────────────────────────────────────────────────────────

interface ReviewKanbanCard {
  id: string;
  name: string;
  service: string;
  time: string;
  rating: number;
}

const REVIEW_KANBAN_COLUMNS = [
  { id: 'pending', label: 'Chờ duyệt', color: '#D97706' },
  { id: 'approved', label: 'Đã duyệt', color: '#059669' },
  { id: 'rejected', label: 'Từ chối', color: '#DC2626' },
] as const;

type ReviewStatusKey = (typeof REVIEW_KANBAN_COLUMNS)[number]['id'];

function SortableReviewCard({
  card,
  dotColor,
}: {
  card: ReviewKanbanCard;
  dotColor: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, strategy: rectSortingStrategy });
  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.35 : 1,
    background: 'var(--white)',
    borderRadius: 8,
    padding: '10px 12px',
    border: '1px solid var(--gray-200, #E4E8EF)',
    boxShadow: '0 1px 3px rgb(15 23 42 / 0.04)',
    cursor: 'grab',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="kanban__card-name">{card.name}</div>
      <div className="kanban__card-service">{card.service}</div>
      <div className="kanban__card-meta">
        <div className="kanban__card-time" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Star size={11} fill="#F59E0B" stroke="#F59E0B" />
          {card.rating}
        </div>
        <div className="kanban__card-dot" style={{ background: dotColor }} />
      </div>
    </div>
  );
}

function ReviewKanbanBoard({ range }: { range: DashboardRange }) {
  const qc = useQueryClient();
  const { data: allReviews, isLoading } = useReviewKanban();
  const updateReview = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVE' | 'REJECT' }) =>
      status === 'APPROVE' ? reviewApi.approve(id) : reviewApi.reject(id, 'Moved from dashboard'),
  });

  const reviews = useMemo(() => {
    const start = rangeStart(range).getTime();
    return (allReviews ?? []).filter(
      (r) => new Date(r.createdAt).getTime() >= start,
    );
  }, [allReviews, range]);

  const [columnItems, setColumnItems] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!reviews) return;
    const grouped: Record<string, string[]> = {
      pending: [],
      approved: [],
      rejected: [],
    };
    reviews.forEach((r) => {
      if (grouped[r.status]) grouped[r.status]!.push(r.id);
    });
    setColumnItems(grouped);
  }, [reviews]);

  const cards = useMemo<Record<string, ReviewKanbanCard>>(() => {
    const map: Record<string, ReviewKanbanCard> = {};
    (reviews ?? []).forEach((r) => {
      map[r.id] = {
        id: r.id,
        name: r.authorName,
        service: r.service,
        time: timeAgo(r.createdAt),
        rating: r.rating,
      };
    });
    return map;
  }, [reviews]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragOver = useCallback(
    (event: DragStartEvent | DragEndEvent) => {
      if (!('over' in event) || !event.over) return;
      const overId = String(event.over.id);
      const fromColumnId = Object.keys(columnItems).find((k) =>
        columnItems[k]?.includes(String(event.active.id)),
      );
      const overColumn = REVIEW_KANBAN_COLUMNS.find((c) =>
        columnItems[c.id]?.includes(overId),
      );
      if (!overColumn || !fromColumnId || fromColumnId === overColumn.id) return;
      setColumnItems((prev) => {
        const fromColumn = prev[fromColumnId];
        const toColumn = prev[overColumn.id];
        if (!fromColumn || !toColumn) return prev;
        const moved = fromColumn.find((id) => id === String(event.active.id));
        if (!moved) return prev;
        return {
          ...prev,
          [fromColumnId]: fromColumn.filter((id) => id !== moved),
          [overColumn.id]: [...toColumn, moved],
        };
      });
    },
    [columnItems],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const id = String(event.active.id);
      const targetColumn = REVIEW_KANBAN_COLUMNS.find((c) =>
        columnItems[c.id]?.includes(id),
      );
      if (!targetColumn) return;
      const before = cards[id];
      if (!before) return;
      try {
        if (targetColumn.id === 'pending') {
          throw new Error('Không thể chuyển đánh giá về trạng thái chờ duyệt');
        }
        await updateReview.mutateAsync({
          id,
          status: targetColumn.id === 'approved' ? 'APPROVE' : 'REJECT',
        });
        notifySuccess(`Đã chuyển đánh giá → ${targetColumn.label}`);
        qc.invalidateQueries({ queryKey: ['admin', 'kanban', 'reviews'] });
        qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      } catch (e) {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể cập nhật');
        qc.invalidateQueries({ queryKey: ['admin', 'kanban', 'reviews'] });
        qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      }
    },
    [columnItems, cards, updateReview, qc],
  );

  if (isLoading) {
    return (
      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Review Pipeline</div>
        </div>
        <SkeletonCard rows={3} />
      </div>
    );
  }

  const total = Object.values(columnItems).reduce((s, arr) => s + (arr?.length ?? 0), 0);

  return (
    <DndContext
      sensors={sensors}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">
            Review Pipeline ({total} • {DASHBOARD_RANGES.find((r) => r.value === range)?.label ?? '7 ngày'})
          </div>
          <Link href="/admin/reviews" className="admin-card__action">
            Quản lý Reviews →
          </Link>
        </div>
        {total === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>
            <MessageCircle size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Chưa có đánh giá nào</div>
            <div style={{ fontSize: '0.72rem' }}>Đánh giá từ khách sẽ xuất hiện ở đây</div>
          </div>
        ) : (
          <div className="kanban">
            {REVIEW_KANBAN_COLUMNS.map((column) => (
              <SortableContext
                key={column.id}
                items={columnItems[column.id] ?? []}
                strategy={horizontalListSortingStrategy}
              >
                <div key={column.id} className={`kanban__col kanban__col--${column.id}`}>
                  <div className="kanban__col-header">
                    <span className="kanban__col-title">{column.label}</span>
                    <span className="kanban__col-count">{columnItems[column.id]?.length ?? 0}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(columnItems[column.id] ?? []).map((cardId) => {
                      const card = cards[cardId];
                      if (!card) return null;
                      return (
                        <SortableReviewCard key={cardId} card={card} dotColor={column.color} />
                      );
                    })}
                  </div>
                </div>
              </SortableContext>
            ))}
          </div>
        )}
      </div>
    </DndContext>
  );
}

// ─── Kanban Tabs (multi-module) ────────────────────────────────────────────

type KanbanTabId = 'leads' | 'bookings' | 'reviews';

const KANBAN_TABS: Array<{ id: KanbanTabId; label: string }> = [
  { id: 'leads', label: 'Lead' },
  { id: 'bookings', label: 'Booking' },
  { id: 'reviews', label: 'Review' },
];

function KanbanTabs({ range }: { range: DashboardRange }) {
  const [tab, setTab] = useState<KanbanTabId>('leads');
  return (
    <div className="admin-card">
      <div
        className="admin-card__header"
        style={{ borderBottom: '1px solid var(--gray-200)' }}
      >
        <div className="admin-card__title">Pipeline</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {KANBAN_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={tab === t.id ? 'action-btn action-btn--primary' : 'action-btn'}
              style={{ fontSize: '0.72rem', padding: '4px 10px' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'leads' && <KanbanBoard range={range} />}
      {tab === 'bookings' && <BookingKanbanBoard range={range} />}
      {tab === 'reviews' && <ReviewKanbanBoard range={range} />}
    </div>
  );
}

// ─── Recent Activity (từ audit_logs real) ──────────────────────────────────

const ACTION_ICON: Record<string, { Icon: typeof CalendarCheck; bg: string; color: string }> = {
  create: { Icon: UserPlus, bg: '#EFF6FF', color: '#2563EB' },
  update: { Icon: PenLine, bg: '#FEF9EF', color: '#C9A84C' },
  delete: { Icon: CalendarX2, bg: '#FEF2F2', color: '#DC2626' },
  status_change: { Icon: CalendarCheck, bg: '#ECFDF5', color: '#059669' },
  assign: { Icon: UserPlus, bg: '#EFF6FF', color: '#2563EB' },
  publish: { Icon: FileText, bg: '#ECFDF5', color: '#059669' },
  login: { Icon: UserPlus, bg: '#EFF6FF', color: '#2563EB' },
  impersonate: { Icon: UserPlus, bg: '#FEF9EF', color: '#C9A84C' },
};

const ENTITY_LABEL: Record<string, string> = {
  booking: 'lịch hẹn',
  lead: 'lead',
  review: 'đánh giá',
  post: 'bài viết',
  campaign: 'campaign',
  user: 'người dùng',
  subscriber: 'subscriber',
  service: 'dịch vụ',
  lawyer: 'luật sư',
};

function RecentActivity({ range }: { range: DashboardRange }) {
  const { data, isLoading } = useRecentActivity(range, 8);
  return (
    <div className="admin-card">
      <div className="admin-card__header">
        <div className="admin-card__title">
          Hoạt động gần đây ({DASHBOARD_RANGES.find((r) => r.value === range)?.label ?? '7 ngày'})
        </div>
        <Link href="/admin/audit" className="admin-card__action">
          Xem tất cả →
        </Link>
      </div>
      {isLoading ? (
        <div style={{ padding: 12 }}>
          <SkeletonCard rows={3} />
        </div>
      ) : (data ?? []).length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>
          <MessageCircle size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Chưa có hoạt động nào</div>
          <div style={{ fontSize: '0.72rem' }}>Các thao tác CRUD sẽ hiển thị ở đây</div>
        </div>
      ) : (
        <div className="activity-list">
          {data.map((a) => {
            const cfg =
              ACTION_ICON[a.action] ?? { Icon: PenLine, bg: '#F3F4F6', color: '#6B7280' };
            const entityText = ENTITY_LABEL[a.entity] ?? a.entity;
            const verbMap: Record<string, string> = {
              create: 'tạo',
              update: 'cập nhật',
              delete: 'xóa',
              status_change: 'đổi trạng thái',
              assign: 'gán',
              publish: 'xuất bản',
              unpublish: 'gỡ',
              login: 'đăng nhập',
              logout: 'đăng xuất',
              impersonate: 'impersonate',
            };
            const verb = verbMap[a.action] ?? a.action;
            const label = a.entityLabel ?? a.entityId;
            return (
              <div key={a.id} className="activity-item">
                <div
                  className="activity-item__icon"
                  style={{ background: cfg.bg, color: cfg.color }}
                  aria-hidden="true"
                >
                  <cfg.Icon size={12} strokeWidth={2.5} />
                </div>
                <div className="activity-item__content">
                  <div className="activity-item__text">
                    <strong>{a.actorName}</strong> đã {verb} {entityText}{' '}
                    <strong>{label}</strong>.
                  </div>
                  <div className="activity-item__time">{timeAgo(a.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Quick Actions ─────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { Icon: PenLine, label: 'Tạo bài viết mới', href: '/admin/blog?action=new', bg: '#EFF3F8', color: '#1E3A5F' },
  { Icon: UserPlus, label: 'Thêm Lead', href: '/admin/crm?action=new', bg: '#FEF9EF', color: '#C9A84C' },
  { Icon: CalendarDays, label: 'Xem lịch hẹn', href: '/admin/bookings', bg: '#ECFDF5', color: '#059669' },
];

function QuickActions() {
  const router = useRouter();
  return (
    <div className="admin-card">
      <div className="admin-card__header">
        <div className="admin-card__title">Thao tác nhanh</div>
      </div>
      <div className="quick-actions">
        {QUICK_ACTIONS.map((qa) => (
          <button
            key={qa.label}
            type="button"
            className="quick-action"
            onClick={() => router.push(qa.href)}
            style={{ textAlign: 'left' }}
          >
            <div
              className="quick-action__icon"
              style={{ background: qa.bg, color: qa.color }}
              aria-hidden="true"
            >
              <qa.Icon size={16} strokeWidth={2} />
            </div>
            <span className="quick-action__label">{qa.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Booking Detail Drawer ─────────────────────────────────────────────────

function BookingDetailDrawer({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  if (!booking) return null;
  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 199 }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="Chi tiết booking"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 440,
          maxWidth: '95vw',
          background: 'white',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
          animation: 'drawerIn 0.2s ease',
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: '1px solid var(--gray-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>Chi tiết lịch hẹn</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>#{booking.id}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <RowUser
            initials={getInitials(booking.customerName)}
            name={booking.customerName}
            sub={booking.customerEmail}
          />
          <DetailRow label="Giờ hẹn" value={`${booking.date} • ${booking.time}`} />
          <DetailRow label="Dịch vụ" value={booking.service} />
          <DetailRow label="Luật sư" value={booking.lawyer} />
          <DetailRow label="Hình thức" value={METHOD_LABEL[booking.method]} />
          <DetailRow label="Trạng thái" value={<BookingStatusBadge status={booking.status} />} />
          <DetailRow label="SĐT" value={booking.customerPhone} />
          {booking.notes && <DetailRow label="Ghi chú" value={booking.notes} />}
        </div>
        <div
          style={{
            padding: 12,
            borderTop: '1px solid var(--gray-200)',
            display: 'flex',
            gap: 8,
          }}
        >
          <Link
            href="/admin/bookings"
            className="action-btn action-btn--primary"
            style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
            onClick={onClose}
          >
            Mở trang Bookings
          </Link>
        </div>
      </div>
      <style jsx global>{`
        @keyframes drawerIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        padding: '10px 0',
        borderBottom: '1px solid var(--gray-100)',
        fontSize: '0.82rem',
      }}
    >
      <div
        style={{
          width: 110,
          color: 'var(--gray-500)',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, color: 'var(--gray-800)' }}>{value}</div>
    </div>
  );
}

// ─── Note Modal ────────────────────────────────────────────────────────────

function NoteModal({
  booking,
  onClose,
  onSave,
}: {
  booking: Booking | null;
  onClose: () => void;
  onSave: (note: string) => void;
}) {
  const [note, setNote] = useState('');
  useEffect(() => {
    setNote(booking?.notes ?? '');
  }, [booking?.id, booking?.notes]);
  if (!booking) return null;
  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 199 }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="Ghi chú booking"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 460,
          maxWidth: '95vw',
          background: 'white',
          zIndex: 200,
          borderRadius: 12,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: 14,
            borderBottom: '1px solid var(--gray-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontWeight: 700 }}>Ghi chú — {booking.customerName}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 14 }}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            placeholder="Nhập ghi chú cho booking này..."
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid var(--gray-200)',
              borderRadius: 6,
              fontSize: '0.85rem',
              resize: 'vertical',
            }}
          />
        </div>
        <div
          style={{
            padding: 12,
            borderTop: '1px solid var(--gray-200)',
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
          }}
        >
          <button type="button" className="action-btn" onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className="action-btn action-btn--primary"
            onClick={() => {
              onSave(note);
            }}
          >
            Lưu ghi chú
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Refresh Hook ──────────────────────────────────────────────────────────

function useRefreshDashboard() {
  const qc = useQueryClient();
  return useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    qc.invalidateQueries({ queryKey: ['admin', 'kanban'] });
    notifySuccess('Đã làm mới dashboard');
  }, [qc]);
}

// ─── Dashboard Page ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DashboardRange>('week');
  const stats = useDashboardStats(dateRange);
  const { data: allBookings = [], isLoading: bookingsLoading } = useBookingKanban();
  const serviceDist = useServiceDistribution(dateRange);
  const funnel = useLeadFunnel(dateRange);
  const visitors = useVisitorSeries(dateRange);
  const chartData = visitors.data.map((point) => ({
    date: point.date,
    visits: point.value,
    leads: 0,
  }));
  const todayBookings = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return allBookings.filter((booking) => booking.date === today);
  }, [allBookings]);
  const refresh = useRefreshDashboard();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [noteBooking, setNoteBooking] = useState<Booking | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const update = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes: string }) =>
      bookingApi.updateStatus(id, status, notes),
  });
  const handleSaveNote = async (text: string) => {
    if (!noteBooking) return;
    try {
      await update.mutateAsync({
        id: noteBooking.id,
        status: noteBooking.status.toUpperCase(),
        notes: text,
      });
      notifySuccess('Đã lưu ghi chú', `${noteBooking.customerName} • ${text.slice(0, 30)}`);
      setNoteBooking(null);
    } catch (e) {
      notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể lưu');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 400));
    refresh();
    setRefreshing(false);
  };

  const handleExport = async () => {
    const rangeLabel =
      DASHBOARD_RANGES.find((r) => r.value === dateRange)?.label ?? dateRange;
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `dashboard-${dateRange}-${stamp}.csv`;

    // Thu goi backend export truoc (co du lieu that + funnel/services/visitors).
    // Neu fail thi fallback ve client-side render tu mock.
    try {
      const tokenMod = await import('@/lib/api/client');
      const token = tokenMod.getAuthToken?.() ?? '';
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      const resp = await fetch(`${base}/admin/dashboard/export/csv?range=${dateRange}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${errorText || resp.statusText}`);
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notifySuccess('Đã xuất báo cáo (từ backend)', filename);
      return;
    } catch (err) {
      // Fallback xuong CSV client-side tu data dang hien thi
      console.warn('Backend CSV export failed, using client-side fallback:', err);
      notifyError('Export backend lỗi, dùng dữ liệu hiện tại', err instanceof Error ? err.message : 'Unknown error');
    }
    const lines: string[] = [];
    lines.push(`Báo cáo Dashboard — ICRC Law`);
    lines.push(`Khoảng thời gian: ${rangeLabel}`);
    lines.push(`Xuất lúc: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('== Tổng quan ==');
    lines.push('Chỉ số,Giá trị,Thay đổi so với kỳ trước');
    lines.push(`Lịch hẹn hôm nay,${stats.appointments_today},${stats.appointments_change}`);
    lines.push(`Lead mới,${stats.leads_week},${stats.leads_change}`);
    lines.push(`Tỷ lệ chuyển đổi (%),${stats.conversion_rate},${stats.conversion_change}`);
    lines.push(`Chatbot hôm nay,${stats.chatbot_conversations},${stats.chatbot_change}`);
    lines.push(`Chờ xác nhận,${stats.pending_count},—`);
    lines.push(`Đã hủy hôm nay,${stats.cancelled_count},—`);
    lines.push(`Hoàn thành hôm nay,${stats.completed_today},—`);
    lines.push(`Doanh thu (VNĐ),${stats.revenue},${stats.revenue_change}`);
    lines.push(`Đánh giá trung bình,${stats.reviews_avg_rating},—`);
    lines.push(`Đánh giá chờ duyệt,${stats.reviews_pending},—`);
    lines.push('');
    lines.push('== Phân bổ dịch vụ ==');
    lines.push('Dịch vụ,Lead,Phần trăm (%)');
    serviceDist.data.forEach((d) => {
      lines.push(`${d.label},${d.value},${d.percentage}`);
    });
    lines.push('');
    lines.push('== Xu hướng leads ==');
    lines.push('Ngày,Leads,Visits');
    chartData.forEach((c) => {
      lines.push(`${c.date},${c.leads},${c.visits}`);
    });
    lines.push('');
    lines.push('== Lead funnel ==');
    lines.push('Stage,Count');
    lines.push(`Total,${funnel.data.total}`);
    lines.push(`Contacted,${funnel.data.contacted}`);
    lines.push(`Qualified,${funnel.data.qualified}`);
    lines.push(`Converted,${funnel.data.converted}`);
    lines.push(`Conversion rate (%),${funnel.data.conversionRate}`);

    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notifySuccess('Đã xuất báo cáo', filename);
  };

  return (
    <div className="admin-view">
      {/* Page header */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1 className="admin-page-header__title">Bảng điều khiển</h1>
          <p className="admin-page-header__sub">
            Tổng quan hoạt động của ICRC Law — cập nhật real-time
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={12} style={{ color: 'var(--gray-500)' }} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DashboardRange)}
              aria-label="Chọn khoảng thời gian"
              style={{
                padding: '5px 8px',
                border: '1px solid var(--gray-200)',
                borderRadius: 6,
                fontSize: '0.78rem',
                background: 'white',
                fontWeight: 500,
              }}
            >
              {DASHBOARD_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="action-btn"
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            aria-label="Làm mới dữ liệu"
          >
            {refreshing ? (
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <RefreshCw size={12} />
            )}
            Làm mới
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="action-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            aria-label="Xuất báo cáo CSV"
          >
            <Download size={12} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon={<CalendarDays size={18} strokeWidth={2.2} />}
          iconVariant="blue"
          value={stats.appointments_today}
          label="Lịch hẹn hôm nay"
          change={stats.appointments_change}
          changeLabel="so với hôm qua"
          onClick={() => router.push('/admin/bookings')}
        />
        <StatCard
          icon={<UserPlus size={18} strokeWidth={2.2} />}
          iconVariant="green"
          value={stats.leads_week}
          label={`Lead mới (${DASHBOARD_RANGES.find((r) => r.value === dateRange)?.label ?? '7 ngày'})`}
          change={stats.leads_change}
          changeLabel="so với kỳ trước"
          onClick={() => router.push('/admin/crm')}
        />
        <StatCard
          icon={<TrendingUp size={18} strokeWidth={2.2} />}
          iconVariant="yellow"
          value={`${stats.conversion_rate}%`}
          label="Tỷ lệ chuyển đổi"
          change={stats.conversion_change}
          changeLabel={`so với kỳ trước`}
          onClick={() => router.push('/admin/crm/pipeline')}
        />
        <StatCard
          icon={<MessagesSquare size={18} strokeWidth={2.2} />}
          iconVariant="purple"
          value={stats.chatbot_conversations}
          label="Chatbot hôm nay"
          change={stats.chatbot_change}
          changeLabel="so với hôm qua"
          onClick={() => router.push('/admin/chatbot')}
        />
      </div>

      {/* Extended Stats Row */}
      <div
        className="admin-grid-4"
        style={{ marginBottom: 12 }}
      >
        <MiniStat
          icon={<AlertCircle size={14} />}
          label="Chờ xác nhận"
          value={stats.pending_count}
          color="var(--warning, #B45309)"
          bg="var(--warning-faint, #FEF3C7)"
        />
        <MiniStat
          icon={<CalendarX2 size={14} />}
          label="Đã hủy hôm nay"
          value={stats.cancelled_count}
          color="var(--danger, #DC2626)"
          bg="var(--danger-faint, #FEE2E2)"
        />
        <MiniStat
          icon={<CheckCircle2 size={14} />}
          label="Hoàn tất hôm nay"
          value={stats.completed_today}
          color="var(--success, #10B981)"
          bg="var(--success-faint, #D1FAE5)"
        />
        <MiniStat
          icon={<Award size={14} />}
          label={`Rating TB (${stats.reviews_pending} chờ duyệt)`}
          value={stats.reviews_avg_rating > 0 ? `${stats.reviews_avg_rating}★` : '—'}
          color="var(--primary, #1E3A5F)"
          bg="var(--primary-faint, #EFF3F8)"
        />
      </div>

      {/* Revenue Highlight */}
      <div
        className="revenue-highlight"
        style={{
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2C5282 100%)',
          color: 'white',
          borderRadius: 10,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <DollarSign size={20} />
        </div>
        <div style={{ flex: '1 1 160px', minWidth: 0 }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 600, textTransform: 'uppercase' }}>
            Doanh thu ({DASHBOARD_RANGES.find((r) => r.value === dateRange)?.label ?? '7 ngày'})
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {new Intl.NumberFormat('vi-VN').format(stats.revenue)} ₫
          </div>
        </div>
        <Link
          href="/admin/audit"
          style={{
            color: 'white',
            fontSize: '0.78rem',
            fontWeight: 600,
            textDecoration: 'none',
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 6,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Xem báo cáo chi tiết →
        </Link>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="admin-card">
          <div className="admin-card__header">
            <div className="admin-card__title">
              Lượt truy cập & Lead — {DASHBOARD_RANGES.find((r) => r.value === dateRange)?.label ?? '7 ngày'}
            </div>
          </div>
          <LineChart data={chartData as unknown as ChartDataPoint[]} />
        </div>
        <div className="admin-card">
          <div className="admin-card__header">
            <div className="admin-card__title">Phân bổ Lead theo dịch vụ</div>
            <Link href="/admin/crm" className="admin-card__action">
              Xem CRM →
            </Link>
          </div>
          {serviceDist.data.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>
              <BarChart3 size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
              <div style={{ fontSize: '0.85rem' }}>Chưa có dữ liệu</div>
            </div>
          ) : (
            <DonutChart segments={serviceDist.data as DonutSegment[]} />
          )}
        </div>
      </div>

      {/* Booking Table */}
      {bookingsLoading ? (
        <div style={{ marginBottom: 12 }}>
          <SkeletonTable rows={5} columns={7} />
        </div>
      ) : (
        <BookingTable
          bookings={todayBookings}
          onSelect={(b) => setSelectedBooking(b)}
          onNote={(b) => setNoteBooking(b)}
        />
      )}

      {/* Kanban + Activity */}
      <div
        className="admin-grid-main-side"
        style={{ marginBottom: 24 }}
      >
        <KanbanTabs range={dateRange} />
        <RecentActivity range={dateRange} />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      <BookingDetailDrawer
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
      <NoteModal
        booking={noteBooking}
        onClose={() => setNoteBooking(null)}
        onSave={handleSaveNote}
      />

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Mini stat card ────────────────────────────────────────────────────────

function MiniStat({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bg: string;
}) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--gray-200)',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: bg,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gray-800)' }}>{value}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{label}</div>
      </div>
    </div>
  );
}

void MailOpen;
void Star;
void SkeletonStats;