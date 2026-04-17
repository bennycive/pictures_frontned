import Swal from 'sweetalert2';

// ── Inject compact modal CSS once ────────────────────────────────────────────
const STYLE_ID = 'afri-swal-styles';
if (!document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    .afri-swal {
      width: 447px !important;
      height: 210px !important;
      min-height: 210px !important;
      max-height: 210px !important;
      padding: 16px 20px 14px !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      box-sizing: border-box !important;
    }
    .afri-swal .swal2-icon {
      width: 36px !important;
      height: 36px !important;
      min-height: 36px !important;
      margin: 0 auto 6px !important;
      border-width: 2px !important;
    }
    .afri-swal .swal2-icon .swal2-icon-content img {
      width: 26px !important;
      height: 26px !important;
    }
    .afri-swal .swal2-title {
      font-size: 14px !important;
      font-weight: 700 !important;
      padding: 0 !important;
      margin: 0 0 3px !important;
      line-height: 1.2 !important;
      color: #1c1917 !important;
    }
    .afri-swal .swal2-html-container {
      font-size: 11.5px !important;
      margin: 0 0 6px !important;
      padding: 0 !important;
      line-height: 1.4 !important;
      color: #57534e !important;
    }
    .afri-swal .swal2-actions {
      margin: 0 !important;
      padding: 0 !important;
      gap: 8px !important;
      flex-wrap: nowrap !important;
    }
    .afri-swal .swal2-confirm,
    .afri-swal .swal2-cancel {
      font-size: 12px !important;
      padding: 5px 18px !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
      margin: 0 !important;
      line-height: 1.4 !important;
    }
    .afri-swal .swal2-timer-progress-bar-container {
      border-radius: 0 0 10px 10px !important;
      height: 3px !important;
    }
  `;
  document.head.appendChild(s);
}

// ── Logo ──────────────────────────────────────────────────────────────────────
const EMBLEM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 43 41">
  <polygon fill="#ec6b1f" points="27.44 11.49 41.97 16.66 39.93 31.17 25.66 33.66 20.43 21.06 27.44 11.49"/>
  <polygon fill="#462718" points="21.29 4.38 0 12.2 10.07 31.53 24.98 25.21 21.29 4.38"/>
  <path fill="#f28e1c" d="M16.59,37.9c-.23.06-11.72-23.74-11.72-23.74L38.26,4.48l-.42,23.7-21.26,9.73h.01Z"/>
  <polygon fill="#f28e1c" points="35.07 3.32 40.3 1.83 39.76 9.63 42.22 0 35.07 3.32"/>
  <polygon fill="#f28e1c" points="41.35 6.98 40.32 10.78 42.97 9.69 41.35 6.98"/>
  <polygon fill="#462718" points="14.74 5.34 10.42 7.12 7.45 6.33 14.74 5.34"/>
  <polygon fill="#f28e1c" points="5.62 6.7 9.02 7.5 5.89 9.14 5.62 6.7"/>
  <polygon fill="#ec6b1f" points="25.95 34.94 31.42 34.1 27.04 36.84 25.95 34.94"/>
  <polygon fill="#ec6b1f" points="29.91 36.89 32.77 34.13 32.78 36.02 29.91 36.89"/>
  <polygon fill="#462718" points="7.46 29.21 9.41 33.18 14.17 31.77 8.63 34.11 7.46 29.21"/>
  <polyline fill="#ec6b1f" points="16.71 39.13 24.67 36.33 18.81 40.34"/>
  <polygon fill="#f28e1c" points="25.19 36.43 23.65 38.26 25.02 37.78 25.19 36.43"/>
</svg>`;

const LOGO_URL  = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(EMBLEM_SVG);
const ICON_HTML = `<img src="${LOGO_URL}" style="width:26px;height:26px" />`;

// ── Mixins ────────────────────────────────────────────────────────────────────
const Base = Swal.mixin({
  customClass: { popup: 'afri-swal' },
  cancelButtonColor: '#6b7280',
  width: 447,
  padding: '16px 20px 14px',
});

const BaseWide = Base.mixin({});   // same size — layout handles two-button spacing

// ── API ───────────────────────────────────────────────────────────────────────
export const swal = {

  async success(message: string, title = 'Done!') {
    return Base.fire({
      title,
      text: message,
      iconHtml: ICON_HTML,
      icon: 'success',
      iconColor: '#22c55e',
      background: '#f0fdf4',
      confirmButtonColor: '#22c55e',
      confirmButtonText: 'OK',
      showConfirmButton: true,
      timer: 3000,
      timerProgressBar: true,
    });
  },

  async error(message: string, title = 'Oops!') {
    return Base.fire({
      title,
      text: message,
      iconHtml: ICON_HTML,
      icon: 'error',
      iconColor: '#ef4444',
      background: '#fef2f2',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'OK',
    });
  },

  async warning(opts: { title: string; text: string }) {
    return Base.fire({
      title: opts.title,
      text: opts.text,
      iconHtml: ICON_HTML,
      icon: 'warning',
      iconColor: '#f59e0b',
      background: '#fffbeb',
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Got it',
    });
  },

  async confirm(opts: {
    title: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }): Promise<boolean> {
    const color = opts.danger ? '#ef4444' : '#ec6b1f';
    const bg    = opts.danger ? '#fef2f2' : '#fff7ed';
    const r = await BaseWide.fire({
      title: opts.title,
      text: opts.text,
      iconHtml: ICON_HTML,
      icon: 'question',
      iconColor: color,
      background: bg,
      showCancelButton: true,
      confirmButtonColor: color,
      cancelButtonColor: '#6b7280',
      confirmButtonText: opts.confirmText ?? 'Confirm',
      cancelButtonText: opts.cancelText ?? 'Cancel',
      reverseButtons: true,
    });
    return r.isConfirmed;
  },

  async confirmDelete(message = 'This action cannot be undone.'): Promise<boolean> {
    const r = await BaseWide.fire({
      title: 'Are you sure?',
      text: message,
      iconHtml: ICON_HTML,
      icon: 'warning',
      iconColor: '#ef4444',
      background: '#fef2f2',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    return r.isConfirmed;
  },
};
