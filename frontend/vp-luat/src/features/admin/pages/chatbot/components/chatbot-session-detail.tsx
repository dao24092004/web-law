'use client';

import { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Hand,
  XCircle,
  Bot,
  Briefcase,
  CalendarPlus,
  HandMetal,
  Send,
} from 'lucide-react';
import { Drawer, ConfirmDialog } from '@/features/admin/components';
import { StatusBadge, type StatusVariant } from '@/features/admin/shared';
import { useCan } from '@/features/admin/lib';
import type {
  ChatbotSession,
  ChatbotSessionStatus,
  ChatbotSender,
} from '@/features/admin/types';
import {
  useHandoffSession,
  useEndSession,
  useAdminReply,
  useCreateLeadFromSession,
  useCreateBookingFromSession,
  useSessionDetail,
  SESSION_STATUS_LABELS,
} from '../hooks/use-chatbot';

interface ChatbotSessionDetailProps {
  sessionId: string | null;   // UUID of the session to load
  onClose: () => void;
  onNavigate?: (entity: 'lead' | 'booking', id: string) => void;
}

const STATUS_VARIANT: Record<ChatbotSessionStatus, StatusVariant> = {
  active: 'green',
  ended: 'gray',
  abandoned: 'red',
  handoff: 'blue',
};

const SENDER_ICON: Record<ChatbotSender, React.ReactNode> = {
  user: <User size={11} />,
  bot: <Bot size={11} />,
  system: <MessageSquare size={11} />,
  agent: <Briefcase size={11} />,
};

const SENDER_LABEL: Record<ChatbotSender, string> = {
  user: 'Khách',
  bot: 'Chatbot',
  system: 'Hệ thống',
  agent: 'Tư vấn viên',
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatDuration(s: ChatbotSession) {
  if (s.status === 'active') return 'Đang diễn ra';
  if (!s.endedAt) return '—';
  const ms = new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime();
  const mins = Math.max(1, Math.round(ms / 60000));
  return `${mins} phút`;
}

export function ChatbotSessionDetail({ sessionId, onClose, onNavigate }: ChatbotSessionDetailProps) {
  const { data: session, isLoading } = useSessionDetail(sessionId);
  const canHandoff = useCan('chatbot.handoff');
  const canCreate = useCan('crm.write');
  const canBooking = useCan('booking.write');
  const handoff = useHandoffSession();
  const end = useEndSession();
  const createLead = useCreateLeadFromSession();
  const createBooking = useCreateBookingFromSession();

  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffTo, setHandoffTo] = useState('LS. Hùng');
  const [handoffReason, setHandoffReason] = useState('');
  const [endOpen, setEndOpen] = useState(false);

  if (!sessionId) return null;

  if (isLoading) {
    return (
      <Drawer isOpen={true} onClose={onClose} width={560} title="Đang tải...">
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)' }}>
          Đang tải cuộc trò chuyện...
        </div>
      </Drawer>
    );
  }

  if (!session) return null;

  const handleHandoff = async () => {
    await handoff(session.id, handoffTo, handoffReason || undefined);
    setHandoffOpen(false);
    setHandoffReason('');
  };

  const handleEnd = async () => {
    await end(session.id);
    setEndOpen(false);
  };

  const handleCreateLead = async () => {
    const id = await createLead(session.id);
    if (id && onNavigate) onNavigate('lead', id);
  };

  const handleCreateBooking = async () => {
    const id = await createBooking(session.id);
    if (id && onNavigate) onNavigate('booking', id);
  };

  return (
    <>
      <Drawer
        isOpen={Boolean(session)}
        onClose={onClose}
        width={560}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Session #{session.sessionId}</span>
            <StatusBadge
              variant={STATUS_VARIANT[session.status]}
              label={SESSION_STATUS_LABELS[session.status]}
            />
            {session.intent && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'var(--primary-faint, #EFF3F8)',
                  color: 'var(--primary)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                {session.intent}
              </span>
            )}
          </div>
        }
        footer={
          <>
            <button type="button" className="action-btn" onClick={onClose}>
              Đóng
            </button>
            {session.status === 'active' && (
              <button
                type="button"
                className="action-btn action-btn--danger"
                onClick={() => setEndOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <XCircle size={12} /> Đóng session
              </button>
            )}
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Metadata */}
          <div
            style={{
              padding: 12,
              background: 'var(--gray-50)',
              borderRadius: 8,
              fontSize: '0.78rem',
            }}
          >
            <div
              className="admin-grid-2"
              style={{
                gap: 10,
                color: 'var(--gray-600)',
              }}
            >
              <MetaRow
                icon={<User size={11} />}
                label="Khách"
                value={session.userName ?? 'Khách vãng lai'}
              />
              {session.userPhone && (
                <MetaRow icon={<Phone size={11} />} label="SĐT" value={session.userPhone} />
              )}
              {session.userEmail && (
                <MetaRow icon={<Mail size={11} />} label="Email" value={session.userEmail} />
              )}
              <MetaRow
                icon={<Calendar size={11} />}
                label="Bắt đầu"
                value={formatTime(session.startedAt)}
              />
              <MetaRow icon={<MessageSquare size={11} />} label="Tin nhắn" value={String(session.messageCount)} />
              <MetaRow icon={<Calendar size={11} />} label="Thời lượng" value={formatDuration(session)} />
            </div>
            {session.handoff && (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px solid var(--gray-200)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--blue, #2563EB)',
                  fontSize: '0.78rem',
                }}
              >
                <Hand size={11} />
                <strong>Handoff → {session.handoff.to}</strong>
                <span style={{ color: 'var(--gray-500)' }}>· {formatTime(session.handoff.at)}</span>
              </div>
            )}
            {(session.convertedToLeadId || session.convertedToBookingId) && (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px solid var(--gray-200)',
                  fontSize: '0.72rem',
                  color: 'var(--success, #10B981)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {session.convertedToLeadId && (
                  <span>✓ Đã chuyển thành lead: {session.convertedToLeadId}</span>
                )}
                {session.convertedToBookingId && (
                  <span>✓ Đã tạo booking: {session.convertedToBookingId}</span>
                )}
              </div>
            )}
          </div>

          {/* Conversation */}
          <div>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--gray-700)',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MessageSquare size={12} /> Hội thoại ({session.messages.length})
            </div>
            <div
              style={{
                maxHeight: 360,
                overflowY: 'auto',
                padding: 8,
                background: 'var(--gray-50)',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {session.messages.map((msg) => {
                const isUser = msg.from === 'user';
                const isSystem = msg.from === 'system' || msg.from === 'agent';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : isSystem ? 'center' : 'flex-start',
                    }}
                  >
                    {isSystem ? (
                      <div
                        style={{
                          padding: '4px 10px',
                          background: 'var(--gray-200, #E5E7EB)',
                          color: 'var(--gray-700)',
                          borderRadius: 999,
                          fontSize: '0.7rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {SENDER_ICON[msg.from]} {msg.content}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: 12,
                          maxWidth: '85%',
                          fontSize: '0.85rem',
                          lineHeight: 1.5,
                          background: isUser ? 'var(--primary, #1E3A5F)' : 'white',
                          color: isUser ? 'white' : 'var(--gray-800)',
                          border: !isUser ? '1px solid var(--gray-200)' : 'none',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--gray-500)',
                            marginBottom: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {SENDER_ICON[msg.from]} {SENDER_LABEL[msg.from]}
                          {msg.confidence !== undefined && msg.confidence < 0.7 && (
                            <span style={{ color: 'var(--warning, #D97706)' }}>
                              (low conf: {(msg.confidence * 100).toFixed(0)}%)
                            </span>
                          )}
                        </div>
                        {msg.content}
                      </div>
                    )}
                    <span style={{ fontSize: '0.65rem', color: 'var(--gray-400)', marginTop: 2 }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reply box — only enabled for sessions currently handed off */}
          {session.status === 'handoff' && (
            <ReplyComposer sessionId={session.id} onSent={() => undefined} />
          )}

          {/* Actions */}
          <div>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--gray-700)',
                marginBottom: 8,
              }}
            >
              Actions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {canCreate && !session.convertedToLeadId && (
                <button
                  type="button"
                  className="action-btn action-btn--primary"
                  onClick={handleCreateLead}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <UserPlusIcon /> Tạo Lead
                </button>
              )}
              {canBooking && !session.convertedToBookingId && (
                <button
                  type="button"
                  className="action-btn"
                  onClick={handleCreateBooking}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <CalendarPlus size={12} /> Tạo Booking
                </button>
              )}
              {canHandoff && session.status !== 'handoff' && session.status !== 'ended' && (
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setHandoffOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <HandMetal size={12} /> Handoff
                </button>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Handoff dialog */}
      {handoffOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHandoffOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="admin-card"
            style={{ width: 420, padding: 20, background: 'white' }}
          >
            <h3 style={{ margin: 0, marginBottom: 12, fontSize: '1rem' }}>Handoff session</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    marginBottom: 4,
                    color: 'var(--gray-700)',
                  }}
                >
                  Chuyển tới
                </label>
                <select
                  value={handoffTo}
                  onChange={(e) => setHandoffTo(e.target.value)}
                  className="action-btn"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.85rem' }}
                >
                  <option value="LS. Hùng">LS. Hùng (FDI / Đầu tư)</option>
                  <option value="LS. Lan">LS. Lan (Bất động sản)</option>
                  <option value="LS. Minh">LS. Minh (Hợp đồng)</option>
                  <option value="LS. Hương">LS. Hương (Ly hôn)</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    marginBottom: 4,
                    color: 'var(--gray-700)',
                  }}
                >
                  Lý do (tuỳ chọn)
                </label>
                <textarea
                  rows={3}
                  value={handoffReason}
                  onChange={(e) => setHandoffReason(e.target.value)}
                  placeholder="VD: Khách cần tư vấn chuyên sâu về FDI"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1.5px solid var(--gray-200)',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button type="button" className="action-btn" onClick={() => setHandoffOpen(false)}>
                Hủy
              </button>
              <button
                type="button"
                className="action-btn action-btn--primary"
                onClick={handleHandoff}
              >
                Xác nhận handoff
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={endOpen}
        title="Đóng session"
        message={`Bạn có chắc muốn đóng session #${session.sessionId}?`}
        confirmLabel="Đóng"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={handleEnd}
        onClose={() => setEndOpen(false)}
      />
    </>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: 'var(--gray-400)' }}>{icon}</span>
      <span style={{ color: 'var(--gray-500)' }}>{label}:</span>
      <span style={{ color: 'var(--gray-800)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function UserPlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function ReplyComposer({ sessionId, onSent }: { sessionId: string; onSent: () => void }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const reply = useAdminReply();
  const trimmed = draft.trim();
  const canSend = trimmed.length > 0 && !sending;

  const submit = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await reply(sessionId, trimmed);
      setDraft('');
      onSent();
    } catch {
      // notifyError already fired inside the hook
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        padding: 10,
        background: 'var(--blue-50, #EFF6FF)',
        border: '1px solid #BFDBFE',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'var(--blue, #1D4ED8)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Briefcase size={11} /> Trả lời khách hàng (vai trò nhân viên)
      </div>
      <textarea
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            void submit();
          }
        }}
        placeholder="Nhập nội dung trả lời... (Cmd/Ctrl+Enter để gửi)"
        style={{
          width: '100%',
          padding: '8px 10px',
          border: '1.5px solid var(--gray-200)',
          borderRadius: 6,
          fontSize: '0.85rem',
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
          background: 'white',
        }}
        disabled={sending}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <button
          type="button"
          className="action-btn action-btn--primary"
          onClick={submit}
          disabled={!canSend}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            opacity: canSend ? 1 : 0.5,
            cursor: canSend ? 'pointer' : 'not-allowed',
          }}
        >
          <Send size={12} /> {sending ? 'Đang gửi...' : 'Gửi trả lời'}
        </button>
      </div>
    </div>
  );
}