'use client';

import { useState } from 'react';
import {
  CheckSquare, Square, Trash2, Eye, EyeOff, Copy, Send, X, ChevronDown
} from 'lucide-react';

interface PostsBulkActionsBarProps {
  selectedIds: string[];
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkPublish: () => Promise<void>;
  onBulkUnpublish: () => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onBulkDuplicate?: () => Promise<void>;
}

export function PostsBulkActionsBar({
  selectedIds,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkPublish,
  onBulkUnpublish,
  onBulkDelete,
  onBulkDuplicate,
}: PostsBulkActionsBarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const allSelected = selectedIds.length === totalCount && totalCount > 0;

  if (selectedIds.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        background: 'white',
        borderRadius: 8,
        border: '1px solid var(--gray-200)',
        marginBottom: 12,
      }}>
        <button
          onClick={onSelectAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem',
            color: 'var(--gray-600)',
            padding: 0,
          }}
        >
          <Square size={16} />
          Chon tat ca ({totalCount})
        </button>
      </div>
    );
  }

  const handleAction = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
      setShowMenu(false);
    }
  };

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        background: 'var(--primary)',
        color: 'white',
        borderRadius: 8,
        marginBottom: 12,
        position: 'relative',
      }}>
        <CheckSquare size={16} />
        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
          {selectedIds.length} da chon
        </span>
        <button
          onClick={onClearSelection}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={14} />
        </button>

        <div style={{ flex: 1 }} />

        {/* Quick actions */}
        <button
          onClick={() => handleAction(onBulkPublish)}
          disabled={busy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: 6,
            color: 'white',
            cursor: busy ? 'not-allowed' : 'pointer',
            fontSize: '0.78rem',
            opacity: busy ? 0.5 : 1,
          }}
        >
          <Eye size={13} />
          Xuat ban
        </button>

        <button
          onClick={() => handleAction(onBulkUnpublish)}
          disabled={busy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: 6,
            color: 'white',
            cursor: busy ? 'not-allowed' : 'pointer',
            fontSize: '0.78rem',
            opacity: busy ? 0.5 : 1,
          }}
        >
          <EyeOff size={13} />
          An
        </button>

        {onBulkDuplicate && (
          <button
            onClick={() => handleAction(onBulkDuplicate)}
            disabled={busy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 6,
              color: 'white',
              cursor: busy ? 'not-allowed' : 'pointer',
              fontSize: '0.78rem',
              opacity: busy ? 0.5 : 1,
            }}
          >
            <Copy size={13} />
            Nhan ban
          </button>
        )}

        <button
          onClick={() => setConfirmDelete(true)}
          disabled={busy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            background: 'rgba(239, 68, 68, 0.8)',
            border: 'none',
            borderRadius: 6,
            color: 'white',
            cursor: busy ? 'not-allowed' : 'pointer',
            fontSize: '0.78rem',
            opacity: busy ? 0.5 : 1,
          }}
        >
          <Trash2 size={13} />
          Xoa
        </button>

        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 8px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: 6,
            color: 'white',
            cursor: 'pointer',
          }}
        >
          <ChevronDown size={13} />
        </button>

        {showMenu && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: 4,
            minWidth: 180,
            zIndex: 100,
          }}>
            <button
              onClick={onSelectAll}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '6px 10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--gray-700)',
              }}
            >
              {allSelected ? 'Bo chon tat ca' : 'Chon tat ca'}
            </button>
            <button
              onClick={onClearSelection}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '6px 10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--gray-700)',
              }}
            >
              Bo chon
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
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
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Xac nhan xoa</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: 20 }}>
              Ban co chac chan muon xoa <strong>{selectedIds.length}</strong> bai viet da chon?
              Hanh dong nay khong the hoan tac.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setConfirmDelete(false)}
                className="action-btn"
                style={{ flex: 1 }}
              >
                Huy
              </button>
              <button
                onClick={async () => {
                  setConfirmDelete(false);
                  await handleAction(onBulkDelete);
                }}
                className="action-btn"
                style={{
                  flex: 1,
                  background: 'var(--danger)',
                  color: 'white',
                }}
              >
                Xoa vinh vien
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
