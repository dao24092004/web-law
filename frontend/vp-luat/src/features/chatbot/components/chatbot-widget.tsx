'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useChatbotWidget } from '../hooks';
import { ChatbotFab } from './chatbot-fab';
import { ChatWindow } from './chat-window';
import { ChatBubblePopup } from './chat-bubble-popup';

const CLOSE_ANIMATION_MS = 240;

type RenderPhase = 'closed' | 'opening' | 'open' | 'closing';

export function ChatbotWidget() {
  const { isOpen, popupDismissed, dismissPopup, setOpen, setMinimized } = useChatbotWidget();
  const hasInitialized = useRef(false);
  const pathname = usePathname();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // We render the chat window for a brief moment after `isOpen` flips to false
  // so CSS can play the close animation. `renderOpen` is the *visual* state.
  const [renderOpen, setRenderOpen] = useState(isOpen);
  const [phase, setPhase] = useState<RenderPhase>(isOpen ? 'open' : 'closed');

  useEffect(() => {
    if (isOpen) {
      // Cancelling close if user reopens mid-animation
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      setRenderOpen(true);
      setPhase('opening');
      // Promote to 'open' after the open animation completes so subsequent
      // re-renders don't keep replaying the entrance animation.
      const t = setTimeout(() => setPhase('open'), CLOSE_ANIMATION_MS);
      return () => clearTimeout(t);
    }

    // isOpen transitioned from true -> false
    if (renderOpen) {
      setPhase('closing');
      closeTimer.current = setTimeout(() => {
        setRenderOpen(false);
        setPhase('closed');
        closeTimer.current = null;
      }, CLOSE_ANIMATION_MS);
    }
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  // Restore persisted UI state (popup dismissed, etc.) on first mount.
  // The store hydrates automatically from sessionStorage; this effect is
  // intentionally a no-op placeholder for future client-side bootstrapping
  // (e.g. tracking) and guarded so it runs only once per mount.
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
  }, []);

  // When user clicks the close (X) button in the header, isOpen becomes false
  // and ChatWindow returns null. We need to *also* call setMinimized(false) so
  // a subsequent reopen shows the full window (not the minimized placeholder).
  useEffect(() => {
    if (!isOpen) {
      // ensure minimize state is cleared when closing
      setMinimized(false);
    }
  }, [isOpen, setMinimized]);

  // When the chat window is visible, slide the floating widgets up so they
  // sit above the window instead of being hidden behind it. The window's
  // bottom edge is at `bottom: 96px` with `max-height: 580px`, so we push
  // the floating widgets above the FAB (which sits at `bottom: 24px`).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const className = 'has-open-chatbot';
    if (isOpen) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }
    return () => {
      document.body.classList.remove(className);
    };
  }, [isOpen]);

  // All hooks above must run on every render — including on /admin and /login.
  // The early return below is the *last* statement so React's hook order stays
  // stable across navigations. Without this, mounting on /public and then
  // navigating to /admin would unmount the chatbot mid-hook sequence and React
  // would throw "Rendered fewer hooks than expected".
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login')) {
    return null;
  }

  return (
    <>
      {!isOpen && !popupDismissed && (
        <ChatBubblePopup onClose={dismissPopup} onOpen={() => setOpen(true)} />
      )}

      <div
        className={`chatbot-widget ${phase === 'open' ? 'chatbot-widget--open' : ''} ${phase === 'closing' ? 'chatbot-widget--closing' : ''}`}
        data-state={phase}
        aria-live="off"
        // Use visibility to keep the element in the layout for close animation
        // but make it non-interactive while closing.
        style={
          phase === 'closing'
            ? { pointerEvents: 'none' }
            : phase === 'closed'
              ? { display: 'none' }
              : undefined
        }
      >
        {renderOpen && <ChatWindow />}
      </div>

      <ChatbotFab />
    </>
  );
}
