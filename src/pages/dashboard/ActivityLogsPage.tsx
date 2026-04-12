import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { activityLogsApi } from '../../api';
import type { ActivityLog } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';

const EVENT_COLORS: Record<string, 'green' | 'red' | 'blue' | 'yellow' | 'gray'> = {
  created: 'green', updated: 'blue', deleted: 'red', login: 'green', verified: 'green',
};

export function ActivityLogsPage() {
  const { error } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [logName, setLogName] = useState('');
  const [event, setEvent] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await activityLogsApi.list({ page, search, log_name: logName || undefined, event: event || undefined });
      setLogs(data.results);
      setTotal(data.count);
    } catch { error('Failed to load activity logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, search, logName, event]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-earth-900">Activity Logs</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
          <input className="input pl-9" placeholder="Search logs..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex gap-2">
          <select className="input w-36" value={logName} onChange={e => { setLogName(e.target.value); setPage(1); }}>
            <option value="">All Channels</option>
            {['auth', 'artworks', 'categories', 'currencies', 'auctions', 'orders'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select className="input w-32" value={event} onChange={e => { setEvent(e.target.value); setPage(1); }}>
            <option value="">All Events</option>
            {['login', 'created', 'updated', 'deleted', 'verified'].map(ev => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-xl border border-earth-100 overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-earth-400">No activity logs found.</div>
          ) : (
            <div className="divide-y divide-earth-50">
              {logs.map(log => (
                <div key={log.id} className="px-6 py-4 hover:bg-earth-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.event && <Badge label={log.event} color={EVENT_COLORS[log.event] ?? 'gray'} />}
                        {log.log_name && <span className="text-xs bg-earth-100 text-earth-600 px-2 py-0.5 rounded-full font-mono">{log.log_name}</span>}
                      </div>
                      <p className="text-sm text-earth-800">{log.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-earth-400">
                        <span>By: <span className="font-medium text-earth-600">{log.causer_name || 'System'}</span></span>
                        {log.subject && <span>· {log.subject}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-earth-400 shrink-0">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-earth-500">{total} total logs</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm">Previous</button>
            <span className="px-3 py-1.5 text-sm text-earth-600 bg-white border border-earth-100 rounded-lg">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1.5 text-sm">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
