/**
 * AfriStudio Notyf wrapper — animated toast notifications.
 *
 * Usage:
 *   import { notify } from '../lib/notify';
 *   notify.success('Artwork saved!');
 *   notify.error('Failed to load.');
 *   notify.info('Loading...');
 */

import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';

const notyf = new Notyf({
  duration: 3500,
  position: { x: 'right', y: 'top' },
  ripple: true,
  dismissible: true,
  types: [
    {
      type: 'success',
      background: '#16a34a',
      icon: {
        className: 'notyf-icon-success',
        tagName: 'span',
        text: '✓',
      },
    },
    {
      type: 'error',
      background: '#dc2626',
      icon: {
        className: 'notyf-icon-error',
        tagName: 'span',
        text: '✕',
      },
    },
    {
      type: 'info',
      background: '#2563eb',
      icon: {
        className: 'notyf-icon-info',
        tagName: 'span',
        text: 'i',
      },
    },
    {
      type: 'warning',
      background: '#d97706',
      icon: {
        className: 'notyf-icon-warning',
        tagName: 'span',
        text: '!',
      },
    },
  ],
});

// Inject custom overrides for border-radius, font, and slide effect
if (typeof document !== 'undefined') {
  const id = 'afri-notyf-styles';
  if (!document.getElementById(id)) {
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      .notyf__toast {
        border-radius: 10px !important;
        padding: 10px 16px !important;
        font-family: inherit !important;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
        min-width: 240px !important;
        max-width: 340px !important;
        box-shadow: 0 8px 24px rgba(0,0,0,.18) !important;
      }
      .notyf__message { font-weight: 500 !important; }
      .notyf__icon {
        width: 20px !important;
        height: 20px !important;
        border-radius: 50% !important;
        background: rgba(255,255,255,.22) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        color: #fff !important;
        flex-shrink: 0 !important;
      }
      .notyf-icon-success, .notyf-icon-error,
      .notyf-icon-info, .notyf-icon-warning {
        font-style: normal;
      }
      /* Slide-in from right with slight scale */
      @keyframes notyf-fadein {
        from { opacity: 0; transform: translateX(48px) scale(.95); }
        to   { opacity: 1; transform: translateX(0)    scale(1); }
      }
      @keyframes notyf-fadeout {
        from { opacity: 1; transform: translateX(0) scale(1); }
        to   { opacity: 0; transform: translateX(48px) scale(.95); }
      }
      .notyf__toast--upper.notyf__toast--disappear { animation: notyf-fadeout .28s ease-in forwards; }
      .notyf__toast--upper                          { animation: notyf-fadein  .28s cubic-bezier(.34,1.3,.64,1) both; }
      .notyf__container { margin-top: 12px !important; margin-right: 12px !important; }
    `;
    document.head.appendChild(s);
  }
}

export const notify = {
  success: (msg: string) => notyf.success(msg),
  error:   (msg: string) => notyf.error(msg),
  info:    (msg: string) => notyf.open({ type: 'info',    message: msg }),
  warning: (msg: string) => notyf.open({ type: 'warning', message: msg }),
};
