import { useEffect, useState, useCallback } from 'react';
import { Mail, MessageSquare, CheckCircle2, XCircle, RefreshCw, Search, X, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { notificationsApi } from '../../api';
import type { NotificationLog } from '../../api/types';
import { swal } from '../../lib/swal';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { SectionSpinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';

const PAGE_SIZE = 20;

type StatusFilter  = 'all' | 'sent' | 'failed';
type ChannelFilter = 'all' | 'email' | 'sms';

export function NotificationsPage() {
  const { error } = useToast();
  const { hasPermission } = useAuth();
  const canResend = hasPermission('notifications.change_notificationlog');
  const [logs, setLogs]           = useState<NotificationLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [status, setStatus]       = useState<StatusFilter>('all');
  const [channel, setChannel]     = useState<ChannelFilter>('all');
  const [search, setSearch]       = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]           = useState(1);
  const [resending, setResending] = useState<number | null>(null);
  const [detail, setDetail]       = useState<NotificationLog | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.list({
        ...(status  !== 'all' ? { status }  : {}),
        ...(channel !== 'all' ? { channel } : {}),
        ...(search  ? { search } : {}),
      });
      setLogs(data);
      setPage(1);
    } catch {
      error('Failed to load notification logs');
    } finally {
      setLoading(false);
    }
  }, [status, channel, search, error]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearSearch = () => { setSearchInput(''); setSearch(''); };

  const handleResend = async (log: NotificationLog) => {
    const ok = await swal.confirm({
      title: 'Resend notification?',
      text: `Resend to ${log.recipient}`,
      confirmText: 'Resend',
    });
    if (!ok) return;
    setResending(log.id);
    try {
      await notificationsApi.resend(log.id);
      swal.success('Notification resent successfully.');
      load();
    } catch {
      error('Resend failed. Check the new log entry for details.');
    } finally {
      setResending(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const pageLogs   = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sentCount   = logs.filter(l => l.status === 'sent').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-earth-900 dark:text-earth-100">Notification Logs</h1>
          <p className="text-sm text-earth-500 mt-0.5">Monitor sent and failed notifications</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-earth-500 hover:text-earth-700 border border-earth-200 hover:border-earth-300 px-3 py-2 rounded-xl transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-earth-800 rounded-xl border border-earth-100 dark:border-earth-700 p-4 text-center">
          <p className="text-2xl font-bold text-earth-900 dark:text-earth-100">{logs.length}</p>
          <p className="text-xs text-earth-400 font-medium uppercase tracking-wide mt-0.5">Total</p>
        </div>
        <div className="bg-white dark:bg-earth-800 rounded-xl border border-earth-100 dark:border-earth-700 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{sentCount}</p>
          <p className="text-xs text-earth-400 font-medium uppercase tracking-wide mt-0.5">Sent</p>
        </div>
        <div className="bg-white dark:bg-earth-800 rounded-xl border border-earth-100 dark:border-earth-700 p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{failedCount}</p>
          <p className="text-xs text-earth-400 font-medium uppercase tracking-wide mt-0.5">Failed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status pills */}
        <div className="flex gap-1 bg-earth-100 dark:bg-earth-800 rounded-xl p-1">
          {(['all', 'sent', 'failed'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === s
                  ? 'bg-white dark:bg-earth-700 text-earth-900 dark:text-earth-100 shadow-sm'
                  : 'text-earth-500 hover:text-earth-700'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Channel pills */}
        <div className="flex gap-1 bg-earth-100 dark:bg-earth-800 rounded-xl p-1">
          {(['all', 'email', 'sms'] as ChannelFilter[]).map(c => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                channel === c
                  ? 'bg-white dark:bg-earth-700 text-earth-900 dark:text-earth-100 shadow-sm'
                  : 'text-earth-500 hover:text-earth-700'
              }`}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-xs ml-auto">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
            <input
              className="input pl-8 pr-7 text-sm w-full"
              placeholder="Recipient or subject…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button type="button" onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600">
                <X size={13} />
              </button>
            )}
          </div>
          <button type="submit" className="btn-secondary text-sm px-3">Search</button>
        </form>
      </div>

      {/* Table */}
      {loading ? <SectionSpinner /> : logs.length === 0 ? (
        <div className="bg-white dark:bg-earth-800 rounded-xl border border-earth-100 dark:border-earth-700 p-12 text-center">
          <Mail size={36} className="mx-auto text-earth-300 mb-3" />
          <p className="text-earth-500 text-sm">No notification logs found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-earth-800 rounded-xl border border-earth-100 dark:border-earth-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-earth-50 dark:bg-earth-900/50 border-b border-earth-100 dark:border-earth-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Channel</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Recipient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Triggered By</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Sent At</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-50 dark:divide-earth-700">
                {pageLogs.map(log => (
                  <tr key={log.id} className="hover:bg-earth-50 dark:hover:bg-earth-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full w-fit ${
                        log.channel === 'email'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                      }`}>
                        {log.channel === 'email' ? <Mail size={11} /> : <MessageSquare size={11} />}
                        {log.channel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-earth-700 dark:text-earth-300 font-mono text-xs">{log.recipient}</td>
                    <td className="px-4 py-3 text-earth-700 dark:text-earth-300 max-w-[200px] truncate">{log.subject || <span className="text-earth-300 italic">—</span>}</td>
                    <td className="px-4 py-3">
                      {log.status === 'sent' ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                          <CheckCircle2 size={13} /> Sent
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-500 dark:text-red-400">
                          <XCircle size={13} /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-earth-500 dark:text-earth-400 text-xs">{log.causer_name || <span className="text-earth-300">System</span>}</td>
                    <td className="px-4 py-3 text-earth-400 text-xs whitespace-nowrap">{new Date(log.sent_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDetail(log)}
                          className="text-xs text-earth-500 hover:text-earth-700 hover:bg-earth-100 px-2 py-1 rounded-lg transition-colors"
                        >
                          View
                        </button>
                        {log.status === 'failed' && canResend && (
                          <button
                            onClick={() => handleResend(log)}
                            disabled={resending === log.id}
                            className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <RotateCcw size={11} className={resending === log.id ? 'animate-spin' : ''} />
                            Resend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-earth-100 dark:border-earth-700 flex items-center justify-between text-xs text-earth-500">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, logs.length)} of {logs.length}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-earth-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                      p === page ? 'bg-primary-600 text-white' : 'hover:bg-earth-100 text-earth-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-earth-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Notification Detail" size="lg">
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-earth-400 uppercase font-semibold mb-1">Channel</p>
                <p className="font-medium text-earth-800 dark:text-earth-200 capitalize">{detail.channel}</p>
              </div>
              <div>
                <p className="text-xs text-earth-400 uppercase font-semibold mb-1">Status</p>
                <p className={`font-semibold ${detail.status === 'sent' ? 'text-green-600' : 'text-red-500'}`}>
                  {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-earth-400 uppercase font-semibold mb-1">Recipient</p>
                <p className="font-mono text-earth-800 dark:text-earth-200">{detail.recipient}</p>
              </div>
              <div>
                <p className="text-xs text-earth-400 uppercase font-semibold mb-1">Sent At</p>
                <p className="text-earth-700 dark:text-earth-300">{new Date(detail.sent_at).toLocaleString()}</p>
              </div>
              {detail.causer_name && (
                <div>
                  <p className="text-xs text-earth-400 uppercase font-semibold mb-1">Triggered By</p>
                  <p className="text-earth-700 dark:text-earth-300">{detail.causer_name}</p>
                </div>
              )}
              {detail.subject && (
                <div className="col-span-2">
                  <p className="text-xs text-earth-400 uppercase font-semibold mb-1">Subject</p>
                  <p className="text-earth-800 dark:text-earth-200">{detail.subject}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-earth-400 uppercase font-semibold mb-1">Message</p>
              <pre className="bg-earth-50 dark:bg-earth-900 text-earth-700 dark:text-earth-300 text-xs p-3 rounded-xl whitespace-pre-wrap font-sans leading-relaxed border border-earth-100 dark:border-earth-700">
                {detail.message}
              </pre>
            </div>

            {detail.error && (
              <div>
                <p className="text-xs text-red-400 uppercase font-semibold mb-1">Error</p>
                <pre className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs p-3 rounded-xl whitespace-pre-wrap font-mono border border-red-100 dark:border-red-800">
                  {detail.error}
                </pre>
              </div>
            )}

            {detail.status === 'failed' && canResend && (
              <button
                onClick={() => { setDetail(null); handleResend(detail); }}
                disabled={resending === detail.id}
                className="w-full flex items-center justify-center gap-2 btn-primary text-sm"
              >
                <RotateCcw size={14} className={resending === detail.id ? 'animate-spin' : ''} />
                Resend Notification
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
