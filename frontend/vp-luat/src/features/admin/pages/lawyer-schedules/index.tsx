'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar, Clock, User,
  Plus, X, AlertCircle, Loader2, Coffee, Briefcase
} from 'lucide-react';
import { AdminPageHeader } from '@/features/admin/shared';
import { useApiQuery, useApiMutation } from '@/lib/api/hooks';
import type { LawyerScheduleResponse } from '@/lib/api/admin-lawyers';
import { notifySuccess, notifyError } from '@/features/admin/lib';

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

function getWeekDays(baseDate: Date): Date[] {
  const days: Date[] = [];
  const monday = new Date(baseDate);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function isToday(date: Date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export default function LawyerScheduleCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLawyer, setSelectedLawyer] = useState<string | null>(null);
  const [overrideModal, setOverrideModal] = useState<{
    lawyerId: string;
    lawyerName: string;
    date: string;
  } | null>(null);
  const [overrideType, setOverrideType] = useState<'off' | 'custom'>('off');
  const [overrideReason, setOverrideReason] = useState('');

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const { data: allSchedules, isLoading } = useApiQuery<Record<string, LawyerScheduleResponse>>(
    ['lawyer-schedules', formatDate(weekDays[0]), formatDate(weekDays[6])],
    `/admin/lawyers/schedules?from=${formatDate(weekDays[0])}&to=${formatDate(weekDays[6])}`,
    {},
    { retry: false },
  );

  const createOverrideMutation = useApiMutation<unknown, {
    lawyerId: string;
    overrideDate: string;
    type: 'off' | 'custom';
    reason?: string;
  }>(
    'POST',
    (vars) => `/admin/lawyers/${vars.lawyerId}/schedule/override`,
  );
  const deleteOverrideMutation = useApiMutation<unknown, { lawyerId: string; date: string }>(
    'DELETE',
    (vars) => `/admin/lawyers/${vars.lawyerId}/schedule/override?date=${vars.date}`,
  );

  const lawyers = useMemo(() => {
    if (!allSchedules) return [];
    return Object.entries(allSchedules).map(([id, data]) => ({
      id,
      name: data.regular?.[0]?.lawyerName || 'Unknown',
      schedule: data,
    }));
  }, [allSchedules]);

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToday = () => setCurrentDate(new Date());

  const handleCreateOverride = async () => {
    if (!overrideModal) return;
    try {
      await createOverrideMutation.mutateAsync({
        lawyerId: overrideModal.lawyerId,
        overrideDate: overrideModal.date,
        type: overrideType,
        reason: overrideReason,
      });
      notifySuccess('Da tao override');
      setOverrideModal(null);
      setOverrideReason('');
    } catch {
      notifyError('Loi tao override');
    }
  };

  const handleDeleteOverride = async (lawyerId: string, date: string) => {
    try {
      await deleteOverrideMutation.mutateAsync({ lawyerId, date });
      notifySuccess('Da xoa override');
    } catch {
      notifyError('Loi xoa override');
    }
  };

  const getSlotsForDay = (lawyerId: string, dayIndex: number) => {
    const schedule = allSchedules?.[lawyerId];
    if (!schedule) return [];
    // dayIndex: 0=Mon, 6=Sun
    return schedule.regular?.[0]?.slots?.filter(s => s.dayOfWeek === dayIndex + 1) || [];
  };

  const getOverrideForDay = (lawyerId: string, date: string) => {
    const schedule = allSchedules?.[lawyerId];
    if (!schedule) return null;
    return schedule.overrides?.[date]?.find(o => o.lawyerId === lawyerId) || null;
  };

  return (
    <div className="admin-view">
      <AdminPageHeader
        title="Lich lam viec Luat su"
        subtitle="Xem va quan ly lich lam viec theo tuan cua cac luat su"
      />

      {/* Week navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        padding: '12px 16px',
        background: 'white',
        borderRadius: 10,
        border: '1px solid var(--gray-200)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={prevWeek} className="action-btn">
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontWeight: 700, minWidth: 200, textAlign: 'center' }}>
            {formatDisplayDate(weekDays[0])} - {formatDisplayDate(weekDays[6])}
          </span>
          <button onClick={nextWeek} className="action-btn">
            <ChevronRight size={18} />
          </button>
          <button onClick={goToday} className="action-btn" style={{ marginLeft: 8 }}>
            Hom nay
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={16} style={{ color: 'var(--gray-500)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
            Tuan {getWeekNumber(currentDate)}
          </span>
        </div>
      </div>

      {/* Lawyer selector */}
      {lawyers.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 12,
          overflowX: 'auto',
          paddingBottom: 8,
        }}>
          <button
            onClick={() => setSelectedLawyer(null)}
            style={{
              padding: '6px 14px',
              border: '1px solid',
              borderColor: !selectedLawyer ? 'var(--primary)' : 'var(--gray-200)',
              borderRadius: 20,
              background: !selectedLawyer ? 'var(--primary)' : 'white',
              color: !selectedLawyer ? 'white' : 'var(--gray-600)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
            }}
          >
            Tat ca ({lawyers.length})
          </button>
          {lawyers.map((lawyer) => (
            <button
              key={lawyer.id}
              onClick={() => setSelectedLawyer(lawyer.id)}
              style={{
                padding: '6px 14px',
                border: '1px solid',
                borderColor: selectedLawyer === lawyer.id ? 'var(--primary)' : 'var(--gray-200)',
                borderRadius: 20,
                background: selectedLawyer === lawyer.id ? 'var(--primary)' : 'white',
                color: selectedLawyer === lawyer.id ? 'white' : 'var(--gray-600)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
              }}
            >
              <User size={12} style={{ marginRight: 4 }} />
              {lawyer.name}
            </button>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      {isLoading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-500)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          Dang tai lich...
        </div>
      ) : lawyers.length === 0 ? (
        <div style={{
          padding: 60,
          textAlign: 'center',
          color: 'var(--gray-400)',
          background: 'white',
          borderRadius: 10,
          border: '1px solid var(--gray-200)',
        }}>
          <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <div>Chua co thong tin lich lam viec</div>
          <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
            Vui long cau hinh lich lam viec cho luat su trong trang Dich vu
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            background: 'white',
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid var(--gray-200)',
          }}>
            <thead>
              <tr>
                <th style={{
                  padding: '10px 12px',
                  background: 'var(--gray-50)',
                  borderBottom: '2px solid var(--gray-200)',
                  textAlign: 'center',
                  minWidth: 100,
                  fontSize: '0.75rem',
                }}>
                  Luat su
                </th>
                {weekDays.map((day, i) => (
                  <th key={i} style={{
                    padding: '10px 8px',
                    background: isToday(day) ? 'rgba(30, 58, 95, 0.08)' : 'var(--gray-50)',
                    borderBottom: '2px solid var(--gray-200)',
                    borderLeft: '1px solid var(--gray-100)',
                    textAlign: 'center',
                    minWidth: 100,
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.75rem' }}>{DAYS[i]}</div>
                    <div style={{
                      fontSize: '0.65rem',
                      color: isToday(day) ? 'var(--primary)' : 'var(--gray-500)',
                    }}>
                      {formatDisplayDate(day)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lawyers
                .filter(l => !selectedLawyer || l.id === selectedLawyer)
                .map((lawyer) => (
                  <tr key={lawyer.id}>
                    <td style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--gray-100)',
                      background: 'var(--gray-50)',
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{lawyer.name}</div>
                    </td>
                    {weekDays.map((day, dayIndex) => {
                      const dateStr = formatDate(day);
                      const slots = getSlotsForDay(lawyer.id, dayIndex);
                      const override = getOverrideForDay(lawyer.id, dateStr);
                      const isTodayCell = isToday(day);

                      return (
                        <td
                          key={dayIndex}
                          style={{
                            padding: '8px',
                            borderBottom: '1px solid var(--gray-100)',
                            borderLeft: '1px solid var(--gray-100)',
                            background: isTodayCell ? 'rgba(30, 58, 95, 0.04)' : 'white',
                            textAlign: 'center',
                            verticalAlign: 'top',
                          }}
                        >
                          {override ? (
                            <div style={{ marginBottom: 4 }}>
                              {override.type === 'off' ? (
                                <div style={{
                                  padding: '4px 8px',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: 'var(--danger)',
                                  borderRadius: 4,
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 4,
                                }}>
                                  <Coffee size={10} />
                                  Nghi
                                  {override.reason && <span>- {override.reason}</span>}
                                </div>
                              ) : (
                                <div style={{
                                  padding: '4px 8px',
                                  background: 'rgba(30, 58, 95, 0.1)',
                                  color: 'var(--primary)',
                                  borderRadius: 4,
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                }}>
                                  Gio dac biet
                                </div>
                              )}
                              <button
                                onClick={() => handleDeleteOverride(lawyer.id, dateStr)}
                                style={{
                                  marginTop: 4,
                                  padding: '2px 6px',
                                  fontSize: '0.6rem',
                                  background: 'none',
                                  border: '1px solid var(--gray-300)',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                }}
                              >
                                Xoa
                              </button>
                            </div>
                          ) : slots.length > 0 ? (
                            <div>
                              {slots.map((slot, si) => (
                                <div
                                  key={si}
                                  style={{
                                    padding: '3px 6px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: 'var(--success)',
                                    borderRadius: 4,
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    marginBottom: 2,
                                  }}
                                >
                                  {slot.startTime} - {slot.endTime}
                                </div>
                              ))}
                              <button
                                onClick={() => setOverrideModal({
                                  lawyerId: lawyer.id,
                                  lawyerName: lawyer.name,
                                  date: dateStr,
                                })}
                                style={{
                                  marginTop: 4,
                                  padding: '2px 6px',
                                  fontSize: '0.6rem',
                                  background: 'none',
                                  border: '1px solid var(--gray-300)',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  color: 'var(--gray-500)',
                                }}
                              >
                                + Override
                              </button>
                            </div>
                          ) : (
                            <div style={{
                              padding: '4px',
                              color: 'var(--gray-400)',
                              fontSize: '0.65rem',
                            }}>
                              <button
                                onClick={() => setOverrideModal({
                                  lawyerId: lawyer.id,
                                  lawyerName: lawyer.name,
                                  date: dateStr,
                                })}
                                style={{
                                  padding: '2px 8px',
                                  fontSize: '0.65rem',
                                  background: 'none',
                                  border: '1px dashed var(--gray-300)',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  color: 'var(--gray-400)',
                                }}
                              >
                                + Nghi
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Override modal */}
      {overrideModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            width: 400,
            maxWidth: '90vw',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>
                Override lich - {overrideModal.lawyerName}
              </h3>
              <button onClick={() => setOverrideModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ marginBottom: 12, fontSize: '0.85rem', color: 'var(--gray-600)' }}>
              Ngay: {new Date(overrideModal.date).toLocaleDateString('vi-VN')}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
                Loai override
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setOverrideType('off')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '2px solid',
                    borderColor: overrideType === 'off' ? 'var(--primary)' : 'var(--gray-200)',
                    borderRadius: 8,
                    background: overrideType === 'off' ? 'var(--primary)' : 'white',
                    color: overrideType === 'off' ? 'white' : 'var(--gray-600)',
                    cursor: 'pointer',
                    fontWeight: overrideType === 'off' ? 600 : 400,
                  }}
                >
                  <Coffee size={16} style={{ marginRight: 6 }} />
                  Nghi
                </button>
                <button
                  onClick={() => setOverrideType('custom')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '2px solid',
                    borderColor: overrideType === 'custom' ? 'var(--primary)' : 'var(--gray-200)',
                    borderRadius: 8,
                    background: overrideType === 'custom' ? 'var(--primary)' : 'white',
                    color: overrideType === 'custom' ? 'white' : 'var(--gray-600)',
                    cursor: 'pointer',
                    fontWeight: overrideType === 'custom' ? 600 : 400,
                  }}
                >
                  <Briefcase size={16} style={{ marginRight: 6 }} />
                  Gio dac biet
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
                Ly do (tuy chon)
              </label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="VD: Nghi phep, Cong tac..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 6,
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setOverrideModal(null)}
                className="action-btn"
                style={{ flex: 1 }}
              >
                Huy
              </button>
              <button
                onClick={handleCreateOverride}
                className="action-btn action-btn--primary"
                style={{ flex: 1 }}
                disabled={createOverrideMutation.isPending}
              >
                {createOverrideMutation.isPending ? 'Dang xu ly...' : 'Xac nhan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
