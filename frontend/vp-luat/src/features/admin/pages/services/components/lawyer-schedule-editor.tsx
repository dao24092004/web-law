'use client';

import { useState, useMemo, useEffect } from 'react';
import { Save, RotateCcw, Plus, X } from 'lucide-react';
import { DAYS_OF_WEEK, DAY_LABELS, useLawyerSchedule, type DaySchedule } from '../hooks/use-schedule';
import type { SlotUpdate } from '@/lib/api/admin-booking';
import type { Lawyer } from '../hooks/use-services';

interface LawyerScheduleEditorProps {
  lawyer: Lawyer | null;
  lawyers: Lawyer[];
  onSelectLawyer: (id: string) => void;
}

const TIME_SLOTS = (() => {
  const arr: string[] = [];
  for (let h = 7; h < 22; h++) {
    arr.push(`${String(h).padStart(2, '0')}:00`);
    arr.push(`${String(h).padStart(2, '0')}:30`);
  }
  return arr;
})();

function emptyDay(): DaySchedule {
  return { isOff: false, slots: [{ start: '08:00', end: '17:00' }] };
}

export function LawyerScheduleEditor({
  lawyer,
  lawyers,
  onSelectLawyer,
}: LawyerScheduleEditorProps) {
  const { scheduleByDay, isLoading, saveSchedule } = useLawyerSchedule(lawyer?.id ?? null);
  const [local, setLocal] = useState<Record<number, DaySchedule>>(() =>
    DAYS_OF_WEEK.reduce(
      (acc, _, idx) => ({ ...acc, [idx]: scheduleByDay[idx] ?? emptyDay() }),
      {} as Record<number, DaySchedule>,
    ),
  );
  const [saving, setSaving] = useState(false);

  // Reset local when lawyer changes
  useEffect(() => {
    if (lawyer) {
      setLocal(
        DAYS_OF_WEEK.reduce(
          (acc, _, idx) => ({ ...acc, [idx]: scheduleByDay[idx] ?? emptyDay() }),
          {} as Record<number, DaySchedule>,
        ),
      );
    }
  }, [lawyer?.id, scheduleByDay]);

  const handleToggleOff = (dow: number) => {
    setLocal((prev) => ({ ...prev, [dow]: { ...prev[dow], isOff: !prev[dow].isOff } }));
  };

  const handleAddSlot = (dow: number) => {
    setLocal((prev) => ({
      ...prev,
      [dow]: { ...prev[dow], slots: [...prev[dow].slots, { start: '09:00', end: '12:00' }] },
    }));
  };

  const handleRemoveSlot = (dow: number, idx: number) => {
    setLocal((prev) => ({
      ...prev,
      [dow]: { ...prev[dow], slots: prev[dow].slots.filter((_, i) => i !== idx) },
    }));
  };

  const handleSlotChange = (dow: number, idx: number, key: 'start' | 'end', value: string) => {
    setLocal((prev) => {
      const slots = [...prev[dow].slots];
      slots[idx] = { ...slots[idx], [key]: value };
      return { ...prev, [dow]: { ...prev[dow], slots } };
    });
  };

  const handleReset = () => {
    setLocal(
      DAYS_OF_WEEK.reduce(
        (acc, _, idx) => ({ ...acc, [idx]: scheduleByDay[idx] ?? emptyDay() }),
        {} as Record<number, DaySchedule>,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: SlotUpdate[] = DAYS_OF_WEEK.map((_, dow) => {
        const day = local[dow];
        return { dayOfWeek: dow, isOff: day.isOff, slots: day.slots };
      });
      await saveSchedule(updates);
    } finally {
      setSaving(false);
    }
  };

  const totalActiveHours = useMemo(() => {
    let total = 0;
    for (const dow of Object.keys(local)) {
      const day = local[Number(dow)];
      if (day.isOff) continue;
      for (const slot of day.slots) {
        const [sh, sm] = slot.start.split(':').map(Number);
        const [eh, em] = slot.end.split(':').map(Number);
        const minutes = eh * 60 + em - (sh * 60 + sm);
        if (minutes > 0) total += minutes / 60;
      }
    }
    return total;
  }, [local]);

  if (lawyers.length === 0) {
    return (
      <div className="admin-card" style={{ padding: 32, textAlign: 'center', color: 'var(--gray-500)' }}>
        Chưa có luật sư nào. Tạo luật sư trước khi thiết lập lịch làm việc.
      </div>
    );
  }

  return (
    <div className="admin-card">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid var(--gray-200)',
          flexWrap: 'wrap',
        }}
      >
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>
          Luật sư:
        </label>
        <select
          className="action-btn"
          value={lawyer?.id ?? ''}
          onChange={(e) => onSelectLawyer(e.target.value)}
          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
        >
          <option value="">— Chọn luật sư —</option>
          {lawyers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        {lawyer && (
          <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
            Tổng: <strong>{totalActiveHours}h/tuần</strong>
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="action-btn"
          onClick={handleReset}
          disabled={!lawyer || saving}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <RotateCcw size={12} /> Khôi phục
        </button>
        <button
          type="button"
          className="action-btn action-btn--primary"
          onClick={handleSave}
          disabled={!lawyer || saving}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {saving ? (
            'Đang lưu...'
          ) : (
            <>
              <Save size={12} /> Lưu lịch
            </>
          )}
        </button>
      </div>

      {!lawyer ? (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            color: 'var(--gray-500)',
            fontSize: '0.85rem',
          }}
        >
          Vui lòng chọn luật sư để chỉnh sửa lịch làm việc.
        </div>
      ) : (
        <div className="admin-grid-week">
          {DAYS_OF_WEEK.map((label, dow) => {
            const day = local[dow];
            return (
              <div
                key={dow}
                style={{
                  border: '1px solid var(--gray-200)',
                  borderRadius: 8,
                  background: day?.isOff ? 'var(--gray-50)' : 'white',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '8px 10px',
                    borderBottom: '1px solid var(--gray-200)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: day?.isOff ? 'var(--gray-400)' : 'var(--gray-700)',
                  }}
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleOff(dow)}
                    title={day?.isOff ? 'Bật lịch' : 'Tắt lịch'}
                    style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      border: '1px solid var(--gray-200)',
                      background: day?.isOff ? 'white' : 'var(--primary)',
                      color: day?.isOff ? 'var(--gray-500)' : 'white',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {day?.isOff ? 'OFF' : 'ON'}
                  </button>
                </div>
                <div style={{ padding: 8, flex: 1 }}>
                  {day?.isOff ? (
                    <div
                      style={{
                        textAlign: 'center',
                        fontSize: '0.72rem',
                        color: 'var(--gray-400)',
                        padding: '12px 0',
                      }}
                    >
                      Nghỉ
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {day.slots.map((slot, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            background: 'var(--primary-faint, #EFF3F8)',
                            padding: '4px 6px',
                            borderRadius: 4,
                          }}
                        >
                          <select
                            value={slot.start}
                            onChange={(e) => handleSlotChange(dow, idx, 'start', e.target.value)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              fontSize: '0.7rem',
                              padding: 2,
                              color: 'var(--gray-700)',
                            }}
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <span style={{ color: 'var(--gray-500)', fontSize: '0.7rem' }}>–</span>
                          <select
                            value={slot.end}
                            onChange={(e) => handleSlotChange(dow, idx, 'end', e.target.value)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              fontSize: '0.7rem',
                              padding: 2,
                              color: 'var(--gray-700)',
                            }}
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(dow, idx)}
                            title="Xóa"
                            style={{
                              marginLeft: 'auto',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--gray-400)',
                              cursor: 'pointer',
                              padding: 2,
                            }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddSlot(dow)}
                        style={{
                          padding: '4px 6px',
                          border: '1px dashed var(--gray-300)',
                          background: 'transparent',
                          borderRadius: 4,
                          color: 'var(--gray-500)',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 2,
                        }}
                      >
                        <Plus size={10} /> Thêm slot
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--gray-200)',
          fontSize: '0.72rem',
          color: 'var(--gray-500)',
        }}
      >
        Mẹo: tick OFF cho ngày nghỉ. Click &quot;+ Thêm slot&quot; để tách giờ làm việc. Mỗi slot tối đa 30 phút.
      </div>
    </div>
  );
}