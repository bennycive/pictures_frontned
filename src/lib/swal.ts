import Swal from 'sweetalert2';

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

const LOGO_URL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(EMBLEM_SVG);
const ICON_HTML = `<img src="${LOGO_URL}" style="width:58px;height:58px" />`;

const AfriSwal = Swal.mixin({
  confirmButtonColor: '#ec6b1f',
  cancelButtonColor: '#6b7280',
  customClass: { popup: 'rounded-2xl font-sans' },
});

export const swal = {
  async confirmDelete(message = 'This action cannot be undone.'): Promise<boolean> {
    const r = await AfriSwal.fire({
      title: 'Are you sure?',
      text: message,
      iconHtml: ICON_HTML,
      icon: 'warning',
      iconColor: '#ef4444',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    return r.isConfirmed;
  },

  async confirm(opts: {
    title: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }): Promise<boolean> {
    const r = await AfriSwal.fire({
      title: opts.title,
      text: opts.text,
      iconHtml: ICON_HTML,
      icon: 'question',
      iconColor: opts.danger ? '#ef4444' : '#ec6b1f',
      showCancelButton: true,
      confirmButtonColor: opts.danger ? '#ef4444' : '#ec6b1f',
      confirmButtonText: opts.confirmText ?? 'Confirm',
      cancelButtonText: opts.cancelText ?? 'Cancel',
      reverseButtons: true,
    });
    return r.isConfirmed;
  },

  async success(message: string) {
    return AfriSwal.fire({
      title: 'Done!',
      text: message,
      iconHtml: ICON_HTML,
      icon: 'success',
      iconColor: '#ec6b1f',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true,
    });
  },

  async error(message: string) {
    return AfriSwal.fire({
      title: 'Oops!',
      text: message,
      iconHtml: ICON_HTML,
      icon: 'error',
      iconColor: '#ef4444',
      confirmButtonText: 'OK',
    });
  },

  async warning(opts: { title: string; text: string }) {
    return AfriSwal.fire({
      title: opts.title,
      text: opts.text,
      iconHtml: ICON_HTML,
      icon: 'warning',
      iconColor: '#d97706',
      confirmButtonText: 'Got it',
    });
  },
};
