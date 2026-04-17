import { useState, useRef } from 'react';
import { FileText, Printer, Gavel, Image, ShoppingBag, TrendingUp, Calendar, Filter } from 'lucide-react';
import { reportsApi } from '../../api';
import { Spinner } from '../../components/ui/Spinner';
import { Logo } from '../../components/ui/Logo';

type ReportType = 'auctions' | 'sold' | 'available' | 'sales';

interface ReportFilters {
  start_date: string;
  end_date: string;
  status: string;
}

const REPORT_TABS: { key: ReportType; label: string; icon: React.ElementType }[] = [
  { key: 'auctions',  label: 'Created Auctions',     icon: Gavel },
  { key: 'sold',      label: 'Sold Artworks',        icon: Image },
  { key: 'available', label: 'Available Artworks',   icon: FileText },
  { key: 'sales',     label: 'Sales Report',         icon: TrendingUp },
];

function SummaryCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-earth-100 rounded-xl p-4 print:border print:shadow-none">
      <p className="text-xs text-earth-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-earth-900">{value}</p>
      {sub && <p className="text-xs text-earth-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    live: 'bg-green-100 text-green-800',
    ended: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    confirmed: 'bg-green-100 text-green-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-teal-100 text-teal-800',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? 'bg-earth-100 text-earth-600'}`}>
      {status}
    </span>
  );
}

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('auctions');
  const [filters, setFilters] = useState<ReportFilters>({ start_date: '', end_date: '', status: '' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.status) params.status = filters.status;

      let res;
      if (activeTab === 'auctions') res = await reportsApi.auctions(params);
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

  const handlePrint = () => window.print();

  const generatedAt = data?.generated_at
    ? new Date(data.generated_at).toLocaleString()
    : null;

  return (
    <>
      {/* ── Print-only global styles injected via a style tag ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-region, #print-region * { visibility: visible; }
          #print-region { position: fixed; inset: 0; padding: 24px; background: white; }
          .no-print { display: none !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between no-print">
          <div>
            <h2 className="text-xl font-bold text-earth-900">Reports</h2>
            <p className="text-sm text-earth-500">Generate and print business reports</p>
          </div>
          {data && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              <Printer size={16} />
              Print Report
            </button>
          )}
        </div>

        {/* Report type tabs */}
        <div className="flex flex-wrap gap-2 no-print">
          {REPORT_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setData(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  activeTab === tab.key
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-earth-600 border-earth-200 hover:border-primary-300 hover:text-primary-700'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white border border-earth-100 rounded-xl p-4 no-print">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-earth-500 mb-1">Start Date</label>
              <div className="flex items-center gap-1 border border-earth-200 rounded-lg px-3 py-2">
                <Calendar size={14} className="text-earth-400" />
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))}
                  className="text-sm text-earth-700 outline-none bg-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-earth-500 mb-1">End Date</label>
              <div className="flex items-center gap-1 border border-earth-200 rounded-lg px-3 py-2">
                <Calendar size={14} className="text-earth-400" />
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))}
                  className="text-sm text-earth-700 outline-none bg-transparent"
                />
              </div>
            </div>
            {(activeTab === 'auctions' || activeTab === 'sales') && (
              <div>
                <label className="block text-xs text-earth-500 mb-1">Status</label>
                <div className="flex items-center gap-1 border border-earth-200 rounded-lg px-3 py-2">
                  <Filter size={14} className="text-earth-400" />
                  <select
                    value={filters.status}
                    onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    className="text-sm text-earth-700 outline-none bg-transparent"
                  >
                    <option value="">All statuses</option>
                    {activeTab === 'auctions' && <>
                      <option value="pending">Pending</option>
                      <option value="live">Live</option>
                      <option value="ended">Ended</option>
                      <option value="cancelled">Cancelled</option>
                    </>}
                    {activeTab === 'sales' && <>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </>}
                  </select>
                </div>
              </div>
            )}
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-earth-800 text-white rounded-lg hover:bg-earth-900 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {loading ? <Spinner size="sm" /> : <FileText size={15} />}
              Generate Report
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm no-print">{error}</div>
        )}

        {/* ── Printable report region ── */}
        {data && (
          <div id="print-region" ref={printRef} className="space-y-6">

            {/* Print header with logo */}
            <div className="hidden print:block mb-6">
              <div className="flex items-center justify-between border-b-2 border-earth-200 pb-4 mb-4">
                <Logo variant="dark" className="h-8 w-auto" />
                <div className="text-right text-xs text-earth-500">
                  <p className="font-semibold text-earth-800 text-sm">
                    {REPORT_TABS.find(t => t.key === activeTab)?.label}
                  </p>
                  <p>Generated: {generatedAt}</p>
                  {data.filters?.start_date && <p>From: {data.filters.start_date}</p>}
                  {data.filters?.end_date && <p>To: {data.filters.end_date}</p>}
                </div>
              </div>
            </div>

            {/* Screen report title */}
            <div className="flex items-center justify-between no-print">
              <h3 className="text-lg font-semibold text-earth-900">
                {REPORT_TABS.find(t => t.key === activeTab)?.label}
              </h3>
              <span className="text-xs text-earth-400">Generated: {generatedAt}</span>
            </div>

            {/* Summary cards */}
            {activeTab === 'auctions' && data.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SummaryCard label="Total Auctions" value={data.summary.total} />
                <SummaryCard label="Live" value={data.summary.live} />
                <SummaryCard label="Ended" value={data.summary.ended} />
                <SummaryCard label="Total Bids" value={data.summary.total_bids} />
                <SummaryCard label="Pending" value={data.summary.pending} />
                <SummaryCard label="Cancelled" value={data.summary.cancelled} />
                <SummaryCard label="Total Revenue" value={data.summary.total_revenue} sub="from ended auctions" />
              </div>
            )}

            {activeTab === 'sold' && data.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SummaryCard label="Total Sold" value={data.summary.total_sold} />
                <SummaryCard label="Via Auction" value={data.summary.via_auction} />
                <SummaryCard label="Direct Sale" value={data.summary.direct_sale} />
                {Object.entries(data.summary.revenue_by_currency || {}).map(([cur, val]) => (
                  <SummaryCard key={cur} label={`Revenue (${cur})`} value={val as string} />
                ))}
              </div>
            )}

            {activeTab === 'available' && data.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SummaryCard label="Total Available" value={data.summary.total_available} />
                <SummaryCard label="With Auction" value={data.summary.with_auction} />
                <SummaryCard label="Without Auction" value={data.summary.without_auction} />
                {Object.entries(data.summary.estimated_value_by_currency || {}).map(([cur, val]) => (
                  <SummaryCard key={cur} label={`Est. Value (${cur})`} value={val as string} />
                ))}
              </div>
            )}

            {activeTab === 'sales' && data.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SummaryCard label="Total Orders" value={data.summary.total_orders} />
                <SummaryCard label="Confirmed" value={data.summary.confirmed} />
                <SummaryCard label="Delivered" value={data.summary.delivered} />
                <SummaryCard label="Cancelled" value={data.summary.cancelled} />
                <SummaryCard label="Pending" value={data.summary.pending} />
                <SummaryCard label="Shipped" value={data.summary.shipped} />
                {Object.entries(data.summary.revenue_by_currency || {}).map(([cur, val]) => (
                  <SummaryCard key={cur} label={`Revenue (${cur})`} value={val as string} />
                ))}
              </div>
            )}

            {/* Data table */}
            <div className="bg-white border border-earth-100 rounded-xl overflow-hidden print:border print:shadow-none">
              <div className="overflow-x-auto">

                {/* Auctions table */}
                {activeTab === 'auctions' && (
                  <table className="w-full text-sm">
                    <thead className="bg-earth-50 text-earth-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Artwork</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Start Price</th>
                        <th className="px-4 py-3 text-left">Current Price</th>
                        <th className="px-4 py-3 text-left">Bids</th>
                        <th className="px-4 py-3 text-left">Winner</th>
                        <th className="px-4 py-3 text-left">Created By</th>
                        <th className="px-4 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-earth-50">
                      {data.data.map((row: Record<string, unknown>) => (
                        <tr key={row.uuid as string} className="hover:bg-earth-50">
                          <td className="px-4 py-3 font-medium text-earth-900">{row.artwork as string}</td>
                          <td className="px-4 py-3"><StatusPill status={row.status as string} /></td>
                          <td className="px-4 py-3 text-earth-600">{row.currency as string} {row.start_price as string}</td>
                          <td className="px-4 py-3 text-earth-600">{row.current_price ? `${row.currency} ${row.current_price}` : '—'}</td>
                          <td className="px-4 py-3">{row.total_bids as number}</td>
                          <td className="px-4 py-3 text-earth-600">{(row.winner as string) || '—'}</td>
                          <td className="px-4 py-3 text-earth-600">{(row.created_by as string) || '—'}</td>
                          <td className="px-4 py-3 text-earth-500">{row.created_at as string}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Sold artworks table */}
                {activeTab === 'sold' && (
                  <table className="w-full text-sm">
                    <thead className="bg-earth-50 text-earth-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Artwork</th>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-left">Sold For</th>
                        <th className="px-4 py-3 text-left">Buyer</th>
                        <th className="px-4 py-3 text-left">Order #</th>
                        <th className="px-4 py-3 text-left">Via</th>
                        <th className="px-4 py-3 text-left">Sold At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-earth-50">
                      {data.data.map((row: Record<string, unknown>) => (
                        <tr key={row.uuid as string} className="hover:bg-earth-50">
                          <td className="px-4 py-3 font-medium text-earth-900">{row.name as string}</td>
                          <td className="px-4 py-3 text-earth-600">{row.category as string}</td>
                          <td className="px-4 py-3 text-earth-600">{row.sold_currency as string} {row.sold_for as string}</td>
                          <td className="px-4 py-3 text-earth-600">{(row.buyer as string) || '—'}</td>
                          <td className="px-4 py-3 text-earth-500">#{(row.order_id as number) || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${row.via_auction ? 'bg-primary-100 text-primary-700' : 'bg-blue-100 text-blue-700'}`}>
                              {row.via_auction ? 'Auction' : 'Direct'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-earth-500">{row.sold_at as string}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Available artworks table */}
                {activeTab === 'available' && (
                  <table className="w-full text-sm">
                    <thead className="bg-earth-50 text-earth-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Artwork</th>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-left">Dimensions</th>
                        <th className="px-4 py-3 text-left">Base Price</th>
                        <th className="px-4 py-3 text-left">Auction</th>
                        <th className="px-4 py-3 text-left">Added</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-earth-50">
                      {data.data.map((row: Record<string, unknown>) => (
                        <tr key={row.uuid as string} className="hover:bg-earth-50">
                          <td className="px-4 py-3 font-medium text-earth-900">{row.name as string}</td>
                          <td className="px-4 py-3 text-earth-600">{row.category as string}</td>
                          <td className="px-4 py-3 text-earth-500">{row.dimensions as string}</td>
                          <td className="px-4 py-3 text-earth-600">{row.base_currency as string} {row.base_price as string}</td>
                          <td className="px-4 py-3">
                            {row.has_auction
                              ? <StatusPill status={row.auction_status as string} />
                              : <span className="text-xs text-earth-400">None</span>}
                          </td>
                          <td className="px-4 py-3 text-earth-500">{row.created_at as string}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Sales table */}
                {activeTab === 'sales' && (
                  <table className="w-full text-sm">
                    <thead className="bg-earth-50 text-earth-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Order #</th>
                        <th className="px-4 py-3 text-left">Buyer</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Total</th>
                        <th className="px-4 py-3 text-left">Delivery City</th>
                        <th className="px-4 py-3 text-left">Via</th>
                        <th className="px-4 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-earth-50">
                      {data.data.map((row: Record<string, unknown>) => (
                        <tr key={row.uuid as string} className="hover:bg-earth-50">
                          <td className="px-4 py-3 font-medium text-earth-900">#{row.id as number}</td>
                          <td className="px-4 py-3 text-earth-600">
                            <div>{row.buyer as string}</div>
                            <div className="text-xs text-earth-400">{row.buyer_email as string}</div>
                          </td>
                          <td className="px-4 py-3"><StatusPill status={row.status as string} /></td>
                          <td className="px-4 py-3 font-medium text-earth-900">{row.currency as string} {row.total as string}</td>
                          <td className="px-4 py-3 text-earth-600">{(row.delivery_city as string) || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${row.via_auction ? 'bg-primary-100 text-primary-700' : 'bg-blue-100 text-blue-700'}`}>
                              {row.via_auction ? 'Auction' : 'Direct'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-earth-500">{row.created_at as string}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {data.data?.length === 0 && (
                  <div className="text-center py-12 text-earth-400 text-sm">No records found for the selected filters.</div>
                )}
              </div>
            </div>

            {/* Print footer */}
            <div className="hidden print:flex items-center justify-between text-xs text-earth-400 border-t border-earth-200 pt-3 mt-4">
              <span>AfriStudio — Confidential</span>
              <span>{generatedAt}</span>
              <span>www.afristudio.site</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
