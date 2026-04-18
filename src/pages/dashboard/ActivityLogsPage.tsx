import { useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw } from 'lucide-react';
import { activityLogsApi } from '../../api';
import type { ActivityLog } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { SectionSpinner } from '../../components/ui/Spinner';

const PAGE_SIZE = 20;

const EVENT_STYLE: Record<string, string> = {
  created:  'bg-green-100 text-green-700 border border-green-200',
  updated:  'bg-blue-100  text-blue-700  border border-blue-200',
  deleted:  'bg-red-100   text-red-700   border border-red-200',
  login:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  verified: 'bg-purple-100 text-purple-700 border border-purple-200',
};

const CHANNEL_STYLE: Record<string, string> = {
  auth:       'bg-violet-50 text-violet-600',
  artworks:   'bg-amber-50  text-amber-700',
  categories: 'bg-sky-50    text-sky-700',
  currencies: 'bg-lime-50   text-lime-700',
  auctions:   'bg-rose-50   text-rose-700',
  orders:     'bg-orange-50 text-orange-700',
};

const CHANNELS = ['auth', 'artworks', 'categories', 'currencies', 'auctions', 'orders'];
const EVENTS   = ['login', 'created', 'updated', 'deleted', 'verified'];

function EventBadge({ event }: { event: string }) {
  const cls = EVENT_STYLE[event] ?? 'bg-earth-100 text-earth-600 border border-earth-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
      {event}
    </span>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const cls = CHANNEL_STYLE[channel] ?? 'bg-earth-50 text-earth-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium ${cls}`}>
      {channel}
    </span>
  );
}

export function ActivityLogsPage() {
  const { error: showError } = useToast();
  const [logs, setLogs]     = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [logName, setLogName] = useState('');
  const [event, setEvent]   = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await activityLogsApi.list({
        page,
        search: debouncedSearch || undefined,
        log_name: logName || undefined,
        event: event || undefined,
      });
      setLogs(data.results);
      setTotal(data.count);
    } catch { showError('Failed to load activity logs'); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, logName, event]);

  useEffect(() => { load(); }, [load]);

  const totalPages   = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startRow     = (page - 1) * PAGE_SIZE + 1;
  const endRow       = Math.min(page * PAGE_SIZE, total);

  const goTo = (p: number) => setPage(Math.max(1, Math.min(totalPages, p)));

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-earth-900">Activity Logs</h1>
          <p className="text-sm text-earth-500 mt-0.5">Track all system events and user actions</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-earth-200 rounded-lg hover:bg-earth-50 transition-colors text-earth-600"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
          <input
            className="input pl-9 w-full"
            placeholder="Search descriptions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-40 shrink-0"
          value={logName}
          onChange={e => { setLogName(e.target.value); setPage(1); }}
        >
          <option value="">All Channels</option>
          {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="input w-36 shrink-0"
          value={event}
          onChange={e => { setEvent(e.target.value); setPage(1); }}
        >
          <option value="">All Events</option>
          {EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
        </select>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <SectionSpinner />
      ) : (
        <div className="bg-white rounded-xl border border-earth-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* Table head */}
              <thead>
                <tr className="border-b border-earth-100 bg-earth-50/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wider w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wider w-28">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wider w-28">Channel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wider w-36">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wider w-32 hidden md:table-cell">Subject</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-earth-500 uppercase tracking-wider w-40">Time</th>
                </tr>
              </thead>

              {/* Table body */}
              <tbody className="divide-y divide-earth-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-earth-400 text-sm">
                      No activity logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-earth-50/40 transition-colors">
                      {/* Row number */}
                      <td className="px-4 py-3 text-xs text-earth-400 tabular-nums font-mono">
                        {startRow + idx}
                      </td>
                      {/* Event badge */}
                      <td className="px-4 py-3">
                        {log.event ? <EventBadge event={log.event} /> : <span className="text-earth-300">—</span>}
                      </td>
                      {/* Channel badge */}
                      <td className="px-4 py-3">
                        {log.log_name ? <ChannelBadge channel={log.log_name} /> : <span className="text-earth-300">—</span>}
                      </td>
                      {/* Description */}
                      <td className="px-4 py-3 text-earth-800 max-w-xs">
                        <span className="line-clamp-2 leading-snug">{log.description}</span>
                      </td>
                      {/* User */}
                      <td className="px-4 py-3">
                        <span className="text-earth-700 font-medium truncate block max-w-[140px]">
                          {log.causer_name || <span className="text-earth-400 italic">System</span>}
                        </span>
                      </td>
                      {/* Subject */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        {log.subject
                          ? <span className="text-earth-500 text-xs truncate block max-w-[120px]">{log.subject}</span>
                          : <span className="text-earth-300">—</span>}
                      </td>
                      {/* Timestamp */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-earth-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <br />
                        <span className="text-xs text-earth-500 font-medium tabular-nums">
                          {new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer ── */}
          {total > 0 && (
            <div className="px-4 py-3 border-t border-earth-100 bg-earth-50/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Info */}
              <p className="text-xs text-earth-500 order-2 sm:order-1">
                Showing <span className="font-semibold text-earth-700">{startRow}–{endRow}</span> of{' '}
                <span className="font-semibold text-earth-700">{total.toLocaleString()}</span> logs
              </p>

              {/* Pagination controls */}
              <div className="flex items-center gap-1 order-1 sm:order-2">
                <button
                  onClick={() => goTo(1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-earth-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="First page"
                >
                  <ChevronsLeft size={14} className="text-earth-600" />
                </button>
                <button
                  onClick={() => goTo(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-earth-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft size={14} className="text-earth-600" />
                </button>

                {/* Page pills */}
                <div className="flex gap-1 mx-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) {
                      p = i + 1;
                    } else if (page <= 3) {
                      p = i + 1;
                    } else if (page >= totalPages - 2) {
                      p = totalPages - 4 + i;
                    } else {
                      p = page - 2 + i;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => goTo(p)}
                        className={`min-w-[30px] h-7 px-2 rounded-lg text-xs font-medium transition-colors ${
                          p === page
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'hover:bg-earth-100 text-earth-600'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goTo(page + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-earth-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight size={14} className="text-earth-600" />
                </button>
                <button
                  onClick={() => goTo(totalPages)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-earth-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Last page"
                >
                  <ChevronsRight size={14} className="text-earth-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
