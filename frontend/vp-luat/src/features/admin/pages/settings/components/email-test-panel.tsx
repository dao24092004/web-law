'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw, Clock } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/lib/api/hooks';
import { emailApi, type EmailStatus, type TestEmailResponse } from '@/lib/api/admin-email';

interface EmailTestPanelProps {
  className?: string;
}

export function EmailTestPanel({ className }: EmailTestPanelProps) {
  const [testEmail, setTestEmail] = useState('');
  const [result, setResult] = useState<TestEmailResponse | null>(null);
  const [resultType, setResultType] = useState<'success' | 'error' | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'confirmation' | 'reminder'>('basic');

  const { data: status, isLoading, refetch } = useApiQuery<EmailStatus>(
    ['admin', 'email', 'status'],
    '/admin/email/status',
    {},
    { retry: false },
  );

  const sendMutation = useApiMutation<TestEmailResponse, { type: 'basic' | 'confirmation' | 'reminder'; to: string }>(
    'POST',
    (vars) => {
      if (vars.type === 'confirmation') return '/admin/email/test/appointment-confirmation';
      if (vars.type === 'reminder') return '/admin/email/test/appointment-reminder';
      return '/admin/email/test';
    },
  );

  const handleSend = async () => {
    if (!testEmail) return;
    setResult(null);
    setResultType(null);

    const response = await sendMutation.mutateAsync({
      type: activeTab,
      to: testEmail,
    });

    setResult(response);
    setResultType(response.error ? 'error' : 'success');
  };

  return (
    <div className={className} style={{
      background: 'white',
      border: '1px solid var(--gray-200)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--gray-100)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'rgba(30, 58, 95, 0.1)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Mail size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Email Test Panel</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Kiem tra cau hinh SMTP</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          style={{
            background: 'none',
            border: 'none',
            padding: 8,
            borderRadius: 6,
            cursor: 'pointer',
            color: 'var(--gray-500)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Status */}
      {status && (
        <div style={{
          padding: '12px 16px',
          background: status.enabled ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
          borderBottom: '1px solid var(--gray-100)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {status.enabled ? (
            <CheckCircle2 size={16} color="var(--success)" />
          ) : (
            <XCircle size={16} color="var(--danger)" />
          )}
          <div style={{ fontSize: '0.78rem' }}>
            <strong>SMTP:</strong> {status.enabled ? 'Enabled' : 'Disabled'} |{' '}
            <strong>Host:</strong> {status.host}:{status.port} |{' '}
            <strong>From:</strong> {status.fromName} &lt;{status.fromAddress}&gt;
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--gray-100)',
      }}>
        {[
          { key: 'basic', label: 'Test co ban' },
          { key: 'confirmation', label: 'Xac nhan lich hen' },
          { key: 'reminder', label: 'Nhac lich hen' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === tab.key ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--gray-600)',
              fontSize: '0.78rem',
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {/* Email input */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>
            Dia chi nhan
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="email@example.com"
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

        {/* Info text based on tab */}
        <div style={{
          padding: 10,
          background: 'var(--gray-50)',
          borderRadius: 6,
          fontSize: '0.72rem',
          color: 'var(--gray-600)',
          marginBottom: 12,
        }}>
          {activeTab === 'basic' && (
            <span>Gui mot email test co ban de kiem tra ket noi SMTP.</span>
          )}
          {activeTab === 'confirmation' && (
            <span>Gui email xac nhan lich hen voi thong tin mau: khach hang, thoi gian, luat su.</span>
          )}
          {activeTab === 'reminder' && (
            <span>Gui email nhac nho lich hen truoc 24h voi thong tin cuoc hen.</span>
          )}
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!testEmail || sendMutation.isPending}
          style={{
            width: '100%',
            padding: '10px 16px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: testEmail && !sendMutation.isPending ? 'pointer' : 'not-allowed',
            opacity: testEmail && !sendMutation.isPending ? 1 : 0.6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {sendMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Dang gui...
            </>
          ) : (
            <>
              <Send size={16} />
              Gui Email Test
            </>
          )}
        </button>

        {/* Result */}
        {result && (
          <div style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 6,
            background: resultType === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${resultType === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}>
            {resultType === 'success' ? (
              <CheckCircle2 size={18} color="var(--success)" style={{ marginTop: 1 }} />
            ) : (
              <XCircle size={18} color="var(--danger)" style={{ marginTop: 1 }} />
            )}
            <div style={{ fontSize: '0.78rem', color: resultType === 'success' ? 'var(--success)' : 'var(--danger)' }}>
              {result.message || result.error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
