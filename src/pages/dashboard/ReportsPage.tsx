import { useState, useRef } from 'react';
import {
  FileText, Printer, Gavel, Image, TrendingUp,
  Calendar, Filter, X, Eye, ShoppingBag,
} from 'lucide-react';
import { reportsApi } from '../../api';
import { Spinner } from '../../components/ui/Spinner';
import { Logo } from '../../components/ui/Logo';

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportType = 'auctions' | 'sold' | 'available' | 'sales';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportData = any;

interface Filters {
  start_date: string;
  end_date: string;
  status: string;
}

const TABS: { key: ReportType; label: string; icon: React.ElementType }[] = [
  { key: 'auctions',  label: 'Created Auctions',   icon: Gavel },
  { key: 'sold',      label: 'Sold Artworks',      icon: Image },
  { key: 'available', label: 'Available Artworks', icon: ShoppingBag },
  { key: 'sales',     label: 'Sales Report',       icon: TrendingUp },
];

// ─── Screen-only status badge (colored) ───────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800',
  live:      'bg-emerald-100 text-emerald-700',
  ended:     'bg-sky-100 text-sky-700',
  cancelled: 'bg-red-100 text-red-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  shipped:   'bg-violet-100 text-violet-700',
  delivered: 'bg-teal-100 text-teal-700',
};
function Badge({ label }: { label: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[label] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}

// ─── Print document HTML builder ──────────────────────────────────────────────
// Returns a complete HTML string ready for window.open().
// Uses only black/grey/white — no color ink waste.
function buildPrintHtml(
  activeTab: ReportType,
  data: ReportData,
  generatedAt: string,
  filters: Filters,
  logoSvgHtml: string,
): string {
  const title = TABS.find(t => t.key === activeTab)?.label ?? '';
  const rows: Record<string, unknown>[] = data.data ?? [];

  // ── Summary items ──
  const summaryItems = (() => {
    if (activeTab === 'auctions') return [
      ['Total', data.summary.total],
      ['Pending', data.summary.pending],
      ['Live', data.summary.live],
      ['Ended', data.summary.ended],
      ['Cancelled', data.summary.cancelled],
      ['Total Bids', data.summary.total_bids],
      ...(data.summary.total_revenue !== '0' ? [['Revenue', data.summary.total_revenue]] : []),
    ];
    if (activeTab === 'sold') return [
      ['Total Sold', data.summary.total_sold],
      ['Via Auction', data.summary.via_auction],
      ['Direct Sale', data.summary.direct_sale],
      ...Object.entries(data.summary.revenue_by_currency ?? {}).map(([c, v]) => [`Revenue (${c})`, v]),
    ];
    if (activeTab === 'available') return [
      ['Total Available', data.summary.total_available],
      ['With Auction', data.summary.with_auction],
      ['Without Auction', data.summary.without_auction],
      ...Object.entries(data.summary.estimated_value_by_currency ?? {}).map(([c, v]) => [`Est. Value (${c})`, v]),
    ];
    return [
      ['Total Orders', data.summary.total_orders],
      ['Pending', data.summary.pending],
      ['Confirmed', data.summary.confirmed],
      ['Shipped', data.summary.shipped],
      ['Delivered', data.summary.delivered],
      ['Cancelled', data.summary.cancelled],
      ...Object.entries(data.summary.revenue_by_currency ?? {}).map(([c, v]) => [`Revenue (${c})`, v]),
    ];
  })() as [string, string | number][];

  const summaryHead = summaryItems.map(([l]) => `<th>${l}</th>`).join('');
  const summaryData = summaryItems.map(([, v]) => `<td>${v}</td>`).join('');

  // ── Table columns per report type ──
  const colHeaders: string[] = (() => {
    if (activeTab === 'auctions')  return ['#', 'Artwork', 'Status', 'Start Price', 'Final Price', 'Bids', 'Winner', 'Created By', 'Date'];
    if (activeTab === 'sold')      return ['#', 'Artwork', 'Category', 'Sold For', 'Buyer', 'Order #', 'Via', 'Sold At'];
    if (activeTab === 'available') return ['#', 'Artwork', 'Category', 'Dimensions', 'Base Price', 'Auction', 'Added'];
    return ['#', 'Order #', 'Buyer', 'Email', 'Status', 'Total', 'City', 'Via', 'Date'];
  })();

  const dataRows = rows.map((row, i) => {
    const odd = i % 2 !== 0;
    const cells: string[] = (() => {
      if (activeTab === 'auctions') return [
        String(i + 1),
        String(row.artwork),
        String(row.status),
        `${row.currency} ${row.start_price}`,
        row.current_price ? `${row.currency} ${row.current_price}` : '—',
        String(row.total_bids),
        String(row.winner || '—'),
        String(row.created_by || '—'),
        String(row.created_at),
      ];
      if (activeTab === 'sold') return [
        String(i + 1),
        String(row.name),
        String(row.category),
        `${row.sold_currency} ${row.sold_for}`,
        String(row.buyer || '—'),
        `#${row.order_id || '—'}`,
        row.via_auction ? 'Auction' : 'Direct',
        String(row.sold_at),
      ];
      if (activeTab === 'available') return [
        String(i + 1),
        String(row.name),
        String(row.category),
        String(row.dimensions),
        `${row.base_currency} ${row.base_price}`,
        row.has_auction ? String(row.auction_status) : 'None',
        String(row.created_at),
      ];
      return [
        String(i + 1),
        `#${row.id}`,
        String(row.buyer),
        String(row.buyer_email || ''),
        String(row.status),
        `${row.currency} ${row.total}`,
        String(row.delivery_city || '—'),
        row.via_auction ? 'Auction' : 'Direct',
        String(row.created_at),
      ];
    })();
    const rowStyle = odd ? 'background:#f5f5f5;' : 'background:#fff;';
    return `<tr style="${rowStyle}">${cells.map((c, ci) => `<td style="padding:6px 9px;border:1px solid #d1d5db;${ci === 0 ? 'color:#9ca3af;text-align:center;' : ''}">${c}</td>`).join('')}</tr>`;
  }).join('');

  // Sales grand total footer
  const grandTotal = activeTab === 'sales' && rows.length > 0
    ? `<tr style="background:#1f2937;color:#fff;font-weight:700;">
        <td colspan="5" style="padding:7px 9px;border:1px solid #374151;text-align:right;text-transform:uppercase;letter-spacing:.05em;font-size:11px;">Grand Total</td>
        <td style="padding:7px 9px;border:1px solid #374151;">
          ${Object.entries(data.summary.revenue_by_currency ?? {}).map(([c, v]) => `${c} ${v}`).join('<br/>')}
        </td>
        <td colspan="3" style="border:1px solid #374151;"></td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${title} — AfriStudio</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; font-size: 12px; }
    @page { margin: 15mm 12mm; size: A4; }
    .page { padding: 0; }

    /* Header */
    .report-header { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 16px; }
    .report-meta { text-align: right; font-size: 10px; color: #6b7280; line-height: 1.6; }
    .report-meta strong { display: block; font-size: 13px; color: #1a1a1a; margin-bottom: 2px; }

    /* Section label */
    .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #6b7280; margin-bottom: 6px; margin-top: 14px; }

    /* Summary table */
    .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .summary-table th { background: #1f2937; color: #fff; padding: 7px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; border: 1px solid #374151; font-weight: 700; }
    .summary-table td { padding: 7px 10px; border: 1px solid #d1d5db; font-weight: 700; font-size: 13px; }

    /* Data table */
    .data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .data-table thead tr { background: #1f2937; color: #fff; }
    .data-table thead th { padding: 7px 9px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; border: 1px solid #374151; font-weight: 700; white-space: nowrap; }
    .data-table tbody td { padding: 6px 9px; border: 1px solid #d1d5db; vertical-align: middle; }
    .data-table tfoot tr { background: #1f2937; color: #fff; font-weight: 700; }
    .data-table tfoot td { padding: 7px 9px; border: 1px solid #374151; }

    /* Footer */
    .report-footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; }
  </style>
</head>
<body>
<div class="page">
  <div class="report-header">
    ${logoSvgHtml}
    <div class="report-meta">
      <strong>${title}</strong>
      Generated: ${generatedAt}
      ${filters.start_date ? `<br/>From: ${filters.start_date}` : ''}
      ${filters.end_date ? `<br/>To: ${filters.end_date}` : ''}
      ${filters.status ? `<br/>Status: ${filters.status}` : ''}
    </div>
  </div>

  <div class="section-label">Summary</div>
  <table class="summary-table">
    <thead><tr>${summaryHead}</tr></thead>
    <tbody><tr>${summaryData}</tr></tbody>
  </table>

  <div class="section-label">Records (${rows.length})</div>
  <table class="data-table">
    <thead>
      <tr>${colHeaders.map(h => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>${dataRows}</tbody>
    ${grandTotal ? `<tfoot>${grandTotal}</tfoot>` : ''}
  </table>

  <div class="report-footer">
    <span>AfriStudio — Confidential</span>
    <span>${generatedAt}</span>
    <span>www.afristudio.site</span>
  </div>
</div>
</body>
</html>`;
}

// ─── Shared logo SVG string (dark variant, for print) ─────────────────────────
const LOGO_SVG_DARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 277.84 40.34" width="180" height="26" aria-label="AfriStudio">
  <polygon fill="#ec6b1f" points="27.44 11.49 41.97 16.66 39.93 31.17 25.66 33.66 20.43 21.06 27.44 11.49"/>
  <polygon fill="#462718" points="21.29 4.38 0 12.2 10.07 31.53 24.98 25.21 21.29 4.38"/>
  <path fill="#f28e1c" d="M16.59,37.9c-.23.06-11.72-23.74-11.72-23.74L38.26,4.48l-.42,23.7-21.26,9.73h.01Z"/>
  <polygon fill="#f28e1c" points="35.07 3.32 40.3 1.83 39.76 9.63 42.22 0 35.07 3.32"/>
  <polygon fill="#462718" points="14.74 5.34 10.42 7.12 7.45 6.33 14.74 5.34"/>
  <polygon fill="#ec6b1f" points="25.95 34.94 31.42 34.1 27.04 36.84 25.95 34.94"/>
  <path fill="#462718" d="M64.94,28.41h-6.91l-1.02,3.53h-6.82l7.59-23.39h7.5l7.56,23.39h-6.85l-1.02-3.53h-.03ZM63.36,22.9l-1.87-6.51-1.87,6.51h3.75-.01Z"/>
  <path fill="#462718" d="M96.54,8.56v5.81h-8.14v3.24h5.86v5.52h-5.86v8.82h-6.5V8.56h14.64Z"/>
  <path fill="#462718" d="M116.78,31.95l-3.9-8.39h-.03v8.39h-6.5V8.56h9.67c1.68,0,3.11.34,4.31,1.01,1.19.67,2.08,1.59,2.68,2.74.6,1.16.89,2.46.89,3.91,0,1.56-.39,2.95-1.16,4.16s-1.88,2.08-3.32,2.61l4.51,8.95h-7.15,0ZM112.86,18.67h2.58c.62,0,1.09-.16,1.41-.48.31-.32.47-.82.47-1.5,0-.62-.16-1.1-.48-1.45-.32-.35-.79-.53-1.39-.53h-2.58v3.96h-.01Z"/>
  <path fill="#1a1a1a" d="M150.78,21.31c-.63-.9-1.37-1.6-2.21-2.12-.85-.5-1.93-1.03-3.24-1.58-1.14-.49-1.96-.9-2.48-1.24-.52-.34-.78-.78-.78-1.31,0-.37.09-.66.27-.87.17-.21.4-.31.68-.31.39,0,.72.14,1,.43.27.28.42.76.44,1.42h6.99c-.08-2.4-.86-4.26-2.36-5.58-1.49-1.32-3.51-1.98-6.05-1.98-1.06,0-2.05.13-2.96.42-.38.11-.75.24-1.1.41-1.2.55-2.15,1.36-2.84,2.43-.7,1.07-1.04,2.36-1.04,3.89-.02,1.52.28,2.76.91,3.73s1.37,1.71,2.24,2.22c.53.31,1.14.61,1.83.93.45.2.94.42,1.46.62,1.11.44,1.93.83,2.46,1.17.52.34.79.79.79,1.34,0,.4-.13.69-.37.87-.24.19-.54.28-.89.28-.96,0-1.49-.67-1.58-2.01h-6.92c.14,2.53,1.01,4.45,2.62,5.77.72.58,1.53,1.04,2.42,1.35,1.11.41,2.34.61,3.72.61,1.64,0,3.05-.32,4.25-.96,1.19-.64,2.1-1.53,2.73-2.66.62-1.13.93-2.41.93-3.85s-.31-2.5-.93-3.41h0Z"/>
  <path fill="#1a1a1a" d="M177.9,8.56v5.81h-5.51v17.57h-6.5V14.37h-5.45v-5.81h17.46Z"/>
  <path fill="#1a1a1a" d="M193.63,8.56v13.18c0,1.08.21,1.93.63,2.56s1.1.94,2.04.94,1.63-.31,2.08-.94c.45-.63.67-1.48.67-2.56v-13.18h6.47v13.18c0,2.22-.41,4.12-1.23,5.7-.82,1.58-1.94,2.76-3.37,3.55s-3.02,1.19-4.77,1.19-3.31-.4-4.67-1.19-2.42-1.97-3.18-3.53c-.76-1.56-1.14-3.47-1.14-5.71v-13.18h6.47Z"/>
  <path fill="#1a1a1a" d="M230.29,10.05c1.63.99,2.88,2.37,3.76,4.13.88,1.76,1.32,3.77,1.32,6.01s-.44,4.23-1.32,6.01-2.13,3.19-3.76,4.21-3.53,1.54-5.7,1.54h-8.64V8.56h8.64c2.17,0,4.07.5,5.7,1.49ZM227.49,24.05c.86-.9,1.29-2.19,1.29-3.87s-.43-2.96-1.29-3.87c-.86-.9-2.02-1.35-3.49-1.35h-1.55v10.44h1.55c1.46,0,2.63-.45,3.49-1.35Z"/>
  <path fill="#1a1a1a" d="M251.83,8.56v23.39h-6.5V8.56h6.5Z"/>
  <path fill="#1a1a1a" d="M276.97,15.29c-.56-1.49-1.36-2.83-2.38-3.98-1.02-1.15-2.21-2.05-3.53-2.69-1.37-.65-2.83-.99-4.33-.99s-2.96.33-4.33.99c-1.32.63-2.51,1.54-3.53,2.69-1.02,1.15-1.82,2.49-2.38,3.98-.58,1.55-.87,3.19-.87,4.88s.29,3.33.87,4.88c.56,1.49,1.36,2.83,2.38,3.98s2.21,2.05,3.53,2.69c1.37.65,2.83.99,4.33.99s2.96-.33,4.33-.99c1.32-.63,2.51-1.54,3.53-2.69s1.82-2.49,2.38-3.98c.58-1.55.87-3.19.87-4.88s-.29-3.33-.87-4.88h0ZM266.73,31.57c-5.58,0-10.1-5.1-10.1-11.4s4.52-11.4,10.1-11.4,10.1,5.1,10.1,11.4-4.52,11.4-10.1,11.4Z"/>
</svg>`;

// ─── Main page ─────────────────────────────────────────────────────────────────
export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('auctions');
  const [filters, setFilters] = useState<Filters>({ start_date: '', end_date: '', status: '' });
  const [data, setData] = useState<ReportData>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewBodyRef = useRef<HTMLDivElement>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date)   params.end_date   = filters.end_date;
      if (filters.status)     params.status     = filters.status;

      let res;
      if (activeTab === 'auctions')  res = await reportsApi.auctions(params);
      else if (activeTab === 'sold') res = await reportsApi.soldArtworks(params);
      else if (activeTab === 'available') res = await reportsApi.availableArtworks(params);
      else res = await reportsApi.sales(params);

      setData(res.data);
    } catch {
      setError('Failed to load report. Make sure you have admin access.');
    } finally {
      setLoading(false);
    }
  };

  const generatedAt = data?.generated_at
    ? new Date(data.generated_at).toLocaleString()
    : '';

  // Open a fresh browser window and print from there — avoids all React DOM issues.
  const handlePrint = () => {
    if (!data) return;
    const html = buildPrintHtml(activeTab, data, generatedAt, filters, LOGO_SVG_DARK);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const rows: Record<string, unknown>[] = data?.data ?? [];

  return (
    <div className="space-y-5">

      {/* ── Print Preview Modal ── */}
      {showPreview && data && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-6 px-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-earth-100 bg-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Eye size={17} className="text-earth-500" />
                <span className="font-semibold text-earth-900 text-sm">Print Preview</span>
                <span className="text-xs text-earth-400">— {TABS.find(t => t.key === activeTab)?.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowPreview(false); setTimeout(handlePrint, 150); }}
                  className="flex items-center gap-2 px-4 py-2 bg-earth-900 text-white rounded-lg hover:bg-black text-sm font-medium transition-colors"
                >
                  <Printer size={14} />
                  Print
                </button>
                <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-earth-100 rounded-lg transition-colors">
                  <X size={17} className="text-earth-500" />
                </button>
              </div>
            </div>

            {/* A4 paper area */}
            <div className="p-6 bg-earth-100 overflow-y-auto max-h-[80vh]">
              <div
                ref={previewBodyRef}
                className="mx-auto bg-white shadow-xl"
                style={{ width: '210mm', minHeight: '297mm', padding: '16mm 14mm', boxSizing: 'border-box', fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", fontSize: '12px', color: '#1a1a1a' }}
              >
                {/* ── Preview: Header ── */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '2px solid #1a1a1a', paddingBottom: '12px', marginBottom: '16px' }}>
                  <Logo variant="dark" className="h-7 w-auto" />
                  <div style={{ textAlign: 'right', fontSize: '10px', color: '#6b7280', lineHeight: 1.6 }}>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#1a1a1a', marginBottom: '2px' }}>{TABS.find(t => t.key === activeTab)?.label}</strong>
                    Generated: {generatedAt}
                    {filters.start_date && <><br />From: {filters.start_date}</>}
                    {filters.end_date && <><br />To: {filters.end_date}</>}
                    {filters.status && <><br />Status: {filters.status}</>}
                  </div>
                </div>

                {/* ── Preview: Summary ── */}
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#6b7280', marginBottom: '6px' }}>Summary</div>
                <PreviewSummaryTable activeTab={activeTab} data={data} />

                {/* ── Preview: Data table ── */}
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#6b7280', margin: '14px 0 6px' }}>
                  Records ({rows.length})
                </div>
                <PreviewDataTable activeTab={activeTab} rows={rows} data={data} />

                {/* ── Preview: Footer ── */}
                <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
                  <span>AfriStudio — Confidential</span>
                  <span>{generatedAt}</span>
                  <span>www.afristudio.site</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-earth-900">Reports</h2>
          <p className="text-sm text-earth-500 mt-0.5">Generate, preview and print business reports</p>
        </div>
        {data && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-earth-200 text-earth-700 rounded-lg hover:border-primary-400 hover:text-primary-700 transition-colors text-sm font-medium"
            >
              <Eye size={15} />
              Preview
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-earth-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium"
            >
              <Printer size={15} />
              Print
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setData(null); setError(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                active
                  ? 'bg-earth-900 text-white border-earth-900'
                  : 'bg-white text-earth-600 border-earth-200 hover:border-earth-400 hover:text-earth-900'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-earth-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-earth-400 uppercase tracking-wide mb-3">Filters</p>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-earth-500 mb-1.5">Start Date</label>
            <div className="flex items-center gap-2 border border-earth-200 rounded-lg px-3 py-2 bg-earth-50">
              <Calendar size={13} className="text-earth-400 shrink-0" />
              <input type="date" value={filters.start_date} onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))} className="text-sm text-earth-700 outline-none bg-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-earth-500 mb-1.5">End Date</label>
            <div className="flex items-center gap-2 border border-earth-200 rounded-lg px-3 py-2 bg-earth-50">
              <Calendar size={13} className="text-earth-400 shrink-0" />
              <input type="date" value={filters.end_date} onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))} className="text-sm text-earth-700 outline-none bg-transparent" />
            </div>
          </div>
          {(activeTab === 'auctions' || activeTab === 'sales') && (
            <div>
              <label className="block text-xs text-earth-500 mb-1.5">Status</label>
              <div className="flex items-center gap-2 border border-earth-200 rounded-lg px-3 py-2 bg-earth-50">
                <Filter size={13} className="text-earth-400 shrink-0" />
                <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="text-sm text-earth-700 outline-none bg-transparent pr-1">
                  <option value="">All statuses</option>
                  {activeTab === 'auctions' && (<><option value="pending">Pending</option><option value="live">Live</option><option value="ended">Ended</option><option value="cancelled">Cancelled</option></>)}
                  {activeTab === 'sales' && (<><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></>)}
                </select>
              </div>
            </div>
          )}
          <button onClick={fetchReport} disabled={loading} className="flex items-center gap-2 px-5 py-2 bg-earth-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium disabled:opacity-50">
            {loading ? <Spinner size="sm" /> : <FileText size={14} />}
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <X size={14} className="shrink-0" />{error}
        </div>
      )}

      {/* ── Report output ── */}
      {data && (
        <div className="space-y-4">

          {/* Summary stat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {buildSummaryCards(activeTab, data).map(({ label, value }) => (
              <div key={label} className="bg-white border border-earth-200 rounded-xl px-4 py-3">
                <p className="text-[22px] font-bold text-earth-900 tabular-nums leading-tight">{value}</p>
                <p className="text-[10px] mt-0.5 text-earth-400 font-semibold uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>

          {/* Screen data table */}
          <div className="bg-white border border-earth-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-earth-100 bg-earth-50">
              <span className="text-sm font-semibold text-earth-700">
                {TABS.find(t => t.key === activeTab)?.label}
                <span className="ml-2 text-xs font-normal text-earth-400">({rows.length} records)</span>
              </span>
              <span className="text-xs text-earth-400">Generated {generatedAt}</span>
            </div>
            <div className="overflow-x-auto">
              <ScreenTable activeTab={activeTab} rows={rows} data={data} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Summary cards data builder ───────────────────────────────────────────────
function buildSummaryCards(activeTab: ReportType, data: ReportData) {
  if (activeTab === 'auctions') return [
    { label: 'Total',      value: data.summary.total },
    { label: 'Pending',    value: data.summary.pending },
    { label: 'Live',       value: data.summary.live },
    { label: 'Ended',      value: data.summary.ended },
    { label: 'Cancelled',  value: data.summary.cancelled },
    { label: 'Total Bids', value: data.summary.total_bids },
    ...(data.summary.total_revenue !== '0' ? [{ label: 'Revenue', value: data.summary.total_revenue }] : []),
  ];
  if (activeTab === 'sold') return [
    { label: 'Total Sold',  value: data.summary.total_sold },
    { label: 'Via Auction', value: data.summary.via_auction },
    { label: 'Direct Sale', value: data.summary.direct_sale },
    ...Object.entries(data.summary.revenue_by_currency ?? {}).map(([c, v]) => ({ label: `Revenue (${c})`, value: v as string })),
  ];
  if (activeTab === 'available') return [
    { label: 'Available',        value: data.summary.total_available },
    { label: 'With Auction',     value: data.summary.with_auction },
    { label: 'Without Auction',  value: data.summary.without_auction },
    ...Object.entries(data.summary.estimated_value_by_currency ?? {}).map(([c, v]) => ({ label: `Value (${c})`, value: v as string })),
  ];
  return [
    { label: 'Total Orders', value: data.summary.total_orders },
    { label: 'Pending',      value: data.summary.pending },
    { label: 'Confirmed',    value: data.summary.confirmed },
    { label: 'Shipped',      value: data.summary.shipped },
    { label: 'Delivered',    value: data.summary.delivered },
    { label: 'Cancelled',    value: data.summary.cancelled },
    ...Object.entries(data.summary.revenue_by_currency ?? {}).map(([c, v]) => ({ label: `Revenue (${c})`, value: v as string })),
  ];
}

// ─── Screen table (colored badges, hover rows) ────────────────────────────────
function ScreenTable({ activeTab, rows, data }: { activeTab: ReportType; rows: Record<string, unknown>[]; data: ReportData }) {
  const thCls = 'px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide whitespace-nowrap';
  const tdCls = 'px-4 py-3 border-b border-earth-50 align-middle';
  const trCls = (i: number) => `${i % 2 === 0 ? 'bg-white' : 'bg-earth-50/40'} hover:bg-earth-50 transition-colors`;

  if (rows.length === 0) return <EmptyState />;

  return (
    <table className="w-full text-sm">
      <thead className="bg-earth-900 text-white">
        <tr>
          {activeTab === 'auctions' && (<>
            <th className={thCls + ' w-10 text-center'}>#</th>
            <th className={thCls}>Artwork</th>
            <th className={thCls}>Status</th>
            <th className={thCls + ' text-right'}>Start Price</th>
            <th className={thCls + ' text-right'}>Final Price</th>
            <th className={thCls + ' text-right'}>Bids</th>
            <th className={thCls}>Winner</th>
            <th className={thCls}>Created By</th>
            <th className={thCls}>Date</th>
          </>)}
          {activeTab === 'sold' && (<>
            <th className={thCls + ' w-10 text-center'}>#</th>
            <th className={thCls}>Artwork</th>
            <th className={thCls}>Category</th>
            <th className={thCls + ' text-right'}>Sold For</th>
            <th className={thCls}>Buyer</th>
            <th className={thCls + ' text-center'}>Order #</th>
            <th className={thCls + ' text-center'}>Via</th>
            <th className={thCls}>Sold At</th>
          </>)}
          {activeTab === 'available' && (<>
            <th className={thCls + ' w-10 text-center'}>#</th>
            <th className={thCls}>Artwork</th>
            <th className={thCls}>Category</th>
            <th className={thCls}>Dimensions</th>
            <th className={thCls + ' text-right'}>Base Price</th>
            <th className={thCls + ' text-center'}>Auction</th>
            <th className={thCls}>Added</th>
          </>)}
          {activeTab === 'sales' && (<>
            <th className={thCls + ' w-10 text-center'}>#</th>
            <th className={thCls + ' text-center'}>Order #</th>
            <th className={thCls}>Buyer</th>
            <th className={thCls + ' text-center'}>Status</th>
            <th className={thCls + ' text-right'}>Total</th>
            <th className={thCls}>City</th>
            <th className={thCls + ' text-center'}>Via</th>
            <th className={thCls}>Date</th>
          </>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.uuid as string} className={trCls(i)}>
            {activeTab === 'auctions' && (<>
              <td className={tdCls + ' text-center text-xs text-earth-400'}>{i + 1}</td>
              <td className={tdCls + ' font-semibold text-earth-900'}>{row.artwork as string}</td>
              <td className={tdCls}><Badge label={row.status as string} /></td>
              <td className={tdCls + ' text-right tabular-nums text-earth-600'}>{row.currency as string} {row.start_price as string}</td>
              <td className={tdCls + ' text-right tabular-nums font-semibold text-earth-900'}>{row.current_price ? `${row.currency} ${row.current_price}` : <span className="text-earth-300 font-normal">—</span>}</td>
              <td className={tdCls + ' text-right tabular-nums'}>{row.total_bids as number}</td>
              <td className={tdCls + ' text-earth-600'}>{(row.winner as string) || <span className="text-earth-300">—</span>}</td>
              <td className={tdCls + ' text-earth-600'}>{(row.created_by as string) || <span className="text-earth-300">—</span>}</td>
              <td className={tdCls + ' text-earth-400 text-xs tabular-nums'}>{row.created_at as string}</td>
            </>)}
            {activeTab === 'sold' && (<>
              <td className={tdCls + ' text-center text-xs text-earth-400'}>{i + 1}</td>
              <td className={tdCls + ' font-semibold text-earth-900'}>{row.name as string}</td>
              <td className={tdCls + ' text-earth-600'}>{row.category as string}</td>
              <td className={tdCls + ' text-right tabular-nums font-semibold text-earth-900'}>{row.sold_currency as string} {row.sold_for as string}</td>
              <td className={tdCls + ' text-earth-600'}>{(row.buyer as string) || <span className="text-earth-300">—</span>}</td>
              <td className={tdCls + ' text-center text-earth-500'}>#{(row.order_id as number) || '—'}</td>
              <td className={tdCls + ' text-center'}><Badge label={row.via_auction ? 'Auction' : 'Direct'} /></td>
              <td className={tdCls + ' text-earth-400 text-xs tabular-nums'}>{row.sold_at as string}</td>
            </>)}
            {activeTab === 'available' && (<>
              <td className={tdCls + ' text-center text-xs text-earth-400'}>{i + 1}</td>
              <td className={tdCls + ' font-semibold text-earth-900'}>{row.name as string}</td>
              <td className={tdCls + ' text-earth-600'}>{row.category as string}</td>
              <td className={tdCls + ' text-earth-400 text-xs'}>{row.dimensions as string}</td>
              <td className={tdCls + ' text-right tabular-nums font-semibold text-earth-900'}>{row.base_currency as string} {row.base_price as string}</td>
              <td className={tdCls + ' text-center'}>{row.has_auction ? <Badge label={row.auction_status as string} /> : <span className="text-earth-300 text-xs">None</span>}</td>
              <td className={tdCls + ' text-earth-400 text-xs tabular-nums'}>{row.created_at as string}</td>
            </>)}
            {activeTab === 'sales' && (<>
              <td className={tdCls + ' text-center text-xs text-earth-400'}>{i + 1}</td>
              <td className={tdCls + ' text-center font-semibold text-earth-900'}>#{row.id as number}</td>
              <td className={tdCls}><div className="font-medium text-earth-900">{row.buyer as string}</div><div className="text-xs text-earth-400">{row.buyer_email as string}</div></td>
              <td className={tdCls + ' text-center'}><Badge label={row.status as string} /></td>
              <td className={tdCls + ' text-right tabular-nums font-bold text-earth-900'}>{row.currency as string} {row.total as string}</td>
              <td className={tdCls + ' text-earth-600'}>{(row.delivery_city as string) || <span className="text-earth-300">—</span>}</td>
              <td className={tdCls + ' text-center'}><Badge label={row.via_auction ? 'Auction' : 'Direct'} /></td>
              <td className={tdCls + ' text-earth-400 text-xs tabular-nums'}>{row.created_at as string}</td>
            </>)}
          </tr>
        ))}
      </tbody>
      {activeTab === 'sales' && rows.length > 0 && (
        <tfoot>
          <tr className="bg-earth-900 text-white text-sm font-bold">
            <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wide text-xs">Grand Total</td>
            <td className="px-4 py-3 text-right tabular-nums">
              {Object.entries(data.summary.revenue_by_currency ?? {}).map(([c, v]) => <div key={c}>{c} {v as string}</div>)}
            </td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      )}
    </table>
  );
}

function EmptyState() {
  return <div className="text-center py-14 text-earth-400 text-sm">No records found for the selected filters.</div>;
}

// ─── Preview summary table (black/grey, ink-friendly) ─────────────────────────
function PreviewSummaryTable({ activeTab, data }: { activeTab: ReportType; data: ReportData }) {
  const items = buildSummaryCards(activeTab, data);
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
      <thead>
        <tr style={{ background: '#1f2937', color: '#fff' }}>
          {items.map(i => <th key={i.label} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.05em', border: '1px solid #374151', fontWeight: 700 }}>{i.label}</th>)}
        </tr>
      </thead>
      <tbody>
        <tr>
          {items.map(i => <td key={i.label} style={{ padding: '7px 10px', border: '1px solid #d1d5db', fontWeight: 700, fontSize: '13px' }}>{i.value}</td>)}
        </tr>
      </tbody>
    </table>
  );
}

// ─── Preview data table (ink-friendly, no colored badges) ─────────────────────
function PreviewDataTable({ activeTab, rows, data }: { activeTab: ReportType; rows: Record<string, unknown>[]; data: ReportData }) {
  const thStyle: React.CSSProperties = { padding: '7px 9px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.05em', border: '1px solid #374151', fontWeight: 700, whiteSpace: 'nowrap' };
  const tdStyle = (i: number, right?: boolean): React.CSSProperties => ({ padding: '6px 9px', border: '1px solid #d1d5db', verticalAlign: 'middle', textAlign: right ? 'right' : 'left', background: i % 2 !== 0 ? '#f5f5f5' : '#fff' });
  const numStyle = (i: number): React.CSSProperties => ({ ...tdStyle(i), textAlign: 'center', color: '#9ca3af', fontSize: '10px' });

  if (rows.length === 0) return <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '12px' }}>No records.</div>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
      <thead>
        <tr style={{ background: '#1f2937', color: '#fff' }}>
          {activeTab === 'auctions' && (<><th style={thStyle}>#</th><th style={thStyle}>Artwork</th><th style={thStyle}>Status</th><th style={{ ...thStyle, textAlign: 'right' }}>Start Price</th><th style={{ ...thStyle, textAlign: 'right' }}>Final Price</th><th style={{ ...thStyle, textAlign: 'right' }}>Bids</th><th style={thStyle}>Winner</th><th style={thStyle}>Created By</th><th style={thStyle}>Date</th></>)}
          {activeTab === 'sold' && (<><th style={thStyle}>#</th><th style={thStyle}>Artwork</th><th style={thStyle}>Category</th><th style={{ ...thStyle, textAlign: 'right' }}>Sold For</th><th style={thStyle}>Buyer</th><th style={thStyle}>Order #</th><th style={thStyle}>Via</th><th style={thStyle}>Sold At</th></>)}
          {activeTab === 'available' && (<><th style={thStyle}>#</th><th style={thStyle}>Artwork</th><th style={thStyle}>Category</th><th style={thStyle}>Dimensions</th><th style={{ ...thStyle, textAlign: 'right' }}>Base Price</th><th style={thStyle}>Auction</th><th style={thStyle}>Added</th></>)}
          {activeTab === 'sales' && (<><th style={thStyle}>#</th><th style={thStyle}>Order #</th><th style={thStyle}>Buyer</th><th style={thStyle}>Status</th><th style={{ ...thStyle, textAlign: 'right' }}>Total</th><th style={thStyle}>City</th><th style={thStyle}>Via</th><th style={thStyle}>Date</th></>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.uuid as string}>
            {activeTab === 'auctions' && (<><td style={numStyle(i)}>{i+1}</td><td style={{ ...tdStyle(i), fontWeight: 600 }}>{row.artwork as string}</td><td style={tdStyle(i)}>{row.status as string}</td><td style={tdStyle(i, true)}>{row.currency as string} {row.start_price as string}</td><td style={{ ...tdStyle(i, true), fontWeight: 600 }}>{row.current_price ? `${row.currency} ${row.current_price}` : '—'}</td><td style={tdStyle(i, true)}>{row.total_bids as number}</td><td style={tdStyle(i)}>{(row.winner as string) || '—'}</td><td style={tdStyle(i)}>{(row.created_by as string) || '—'}</td><td style={tdStyle(i)}>{row.created_at as string}</td></>)}
            {activeTab === 'sold' && (<><td style={numStyle(i)}>{i+1}</td><td style={{ ...tdStyle(i), fontWeight: 600 }}>{row.name as string}</td><td style={tdStyle(i)}>{row.category as string}</td><td style={{ ...tdStyle(i, true), fontWeight: 600 }}>{row.sold_currency as string} {row.sold_for as string}</td><td style={tdStyle(i)}>{(row.buyer as string) || '—'}</td><td style={tdStyle(i)}>#{(row.order_id as number) || '—'}</td><td style={tdStyle(i)}>{row.via_auction ? 'Auction' : 'Direct'}</td><td style={tdStyle(i)}>{row.sold_at as string}</td></>)}
            {activeTab === 'available' && (<><td style={numStyle(i)}>{i+1}</td><td style={{ ...tdStyle(i), fontWeight: 600 }}>{row.name as string}</td><td style={tdStyle(i)}>{row.category as string}</td><td style={tdStyle(i)}>{row.dimensions as string}</td><td style={{ ...tdStyle(i, true), fontWeight: 600 }}>{row.base_currency as string} {row.base_price as string}</td><td style={tdStyle(i)}>{row.has_auction ? String(row.auction_status) : 'None'}</td><td style={tdStyle(i)}>{row.created_at as string}</td></>)}
            {activeTab === 'sales' && (<><td style={numStyle(i)}>{i+1}</td><td style={{ ...tdStyle(i), fontWeight: 700 }}>#{row.id as number}</td><td style={tdStyle(i)}><div style={{ fontWeight: 600 }}>{row.buyer as string}</div><div style={{ fontSize: '10px', color: '#6b7280' }}>{row.buyer_email as string}</div></td><td style={tdStyle(i)}>{row.status as string}</td><td style={{ ...tdStyle(i, true), fontWeight: 700 }}>{row.currency as string} {row.total as string}</td><td style={tdStyle(i)}>{(row.delivery_city as string) || '—'}</td><td style={tdStyle(i)}>{row.via_auction ? 'Auction' : 'Direct'}</td><td style={tdStyle(i)}>{row.created_at as string}</td></>)}
          </tr>
        ))}
      </tbody>
      {activeTab === 'sales' && rows.length > 0 && (
        <tfoot>
          <tr style={{ background: '#1f2937', color: '#fff', fontWeight: 700 }}>
            <td colSpan={4} style={{ padding: '7px 9px', border: '1px solid #374151', textAlign: 'right', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '.05em' }}>Grand Total</td>
            <td style={{ padding: '7px 9px', border: '1px solid #374151', textAlign: 'right' }}>
              {Object.entries(data.summary.revenue_by_currency ?? {}).map(([c, v]) => <div key={c}>{c} {v as string}</div>)}
            </td>
            <td colSpan={3} style={{ border: '1px solid #374151' }} />
          </tr>
        </tfoot>
      )}
    </table>
  );
}
