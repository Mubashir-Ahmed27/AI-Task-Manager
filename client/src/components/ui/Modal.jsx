import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { X } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { cn } from '../../utils/cn.js';

gsap.registerPlugin(useGSAP);

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

/**
 * Accessible modal dialog with scoped GSAP entry/exit animation.
 *
 * Accessibility: role="dialog" + aria-modal, Escape closes, body scroll locks,
 * focus moves into the dialog and returns to the trigger on close.
 * Motion: skipped entirely when `prefers-reduced-motion` is set.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const [shouldRender, setShouldRender] = useState(open);
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Keep the dialog mounted while its exit animation plays.
  useEffect(() => {
    if (open) setShouldRender(true);
  }, [open]);

  useGSAP(
    () => {
      if (!shouldRender) return;

      if (prefersReducedMotion) {
        if (!open) setShouldRender(false);
        return;
      }

      if (open) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18 });
        gsap.fromTo(
          panelRef.current,
          { opacity: 0, y: 16, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.26, ease: 'power2.out' }
        );
        return;
      }

      const timeline = gsap.timeline({ onComplete: () => setShouldRender(false) });
      timeline.to(panelRef.current, { opacity: 0, y: 10, scale: 0.98, duration: 0.16 }, 0);
      timeline.to(overlayRef.current, { opacity: 0, duration: 0.16 }, 0);
    },
    { dependencies: [open, shouldRender, prefersReducedMotion], scope: containerRef, revertOnUpdate: false }
  );

  useEffect(() => {
    if (!open) return undefined;

    lastFocusedRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const focusTimer = setTimeout(() => {
      const node = panelRef.current;
      const target =
        node?.querySelector('[data-autofocus]') ||
        node?.querySelector('input, textarea, select, button');
      (target || node)?.focus?.();
    }, 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      clearTimeout(focusTimer);
      if (lastFocusedRef.current instanceof HTMLElement) {
        lastFocusedRef.current.focus?.();
      }
    };
  }, [open, onClose]);

  if (!shouldRender || typeof document === 'undefined') return null;

  return createPortal(
    <div ref={containerRef} className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onClose?.()}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full rounded-t-2xl border border-border-base bg-surface shadow-2xl shadow-black/40 sm:rounded-2xl',
          SIZES[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-base px-5 py-4">
          <div>
            <h2 id="modal-title" className="text-base font-semibold text-fg">
              {title}
            </h2>
            {description ? <p className="mt-1 text-xs text-fg-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Close dialog"
            className="rounded-md p-1.5 text-fg-muted transition hover:bg-surface-2 hover:text-fg"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>

        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-border-base px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
