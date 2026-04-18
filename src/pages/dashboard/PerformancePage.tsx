import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Activity, Shield, AlertTriangle, Clock, TrendingUp, Ban,
  RefreshCw, Trash2, Plus, X,
} from 'lucide-react';
import { securityApi } from '../../api';
import type { SecurityStats, BlockedIP } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { SectionSpinner } from '../../components/ui/Spinner';

const METHOD_COLOR: Record<string, string> = {
  GET:    '#6366f1',
  POST:   '#f59e0b',
  PUT:    '#10b981',
  PATCH:  '#3b82f6',
  DELETE: '#ef4444',
};

function StatCard({ icon: Icon, label, value, sub, color = 'primary' }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'primary' | 'green' | 'red' | 'amber';
}) {
  const iconCls: Record<string, string> = {
    primary: 'bg-primary-100 text-primary-600',
    green:   'bg-green-100 text-green-600',
    red:     'bg-red-100 text-red-600',
    amber:   'bg-amber-100 text-amber-600',
  };
  return (
    <div className="bg-white rounded-xl border border-earth-100 p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconCls[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-earth-500 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-2xl font-bold text-earth-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-earth-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function BlockIPModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { success, error } = useToast();
  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim()) return;
    setSaving(true);
    try {
      await securityApi.blockIP({ ip: ip.trim(), reason, is_permanent: true });
      success(`IP ${ip} blocked.`);
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      error(msg || 'Failed to block IP.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-earth-900">Block IP Address</h3>
          <button onClick={onClose} className="text-earth-400 hover:text-earth-700">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-earth-600 uppercase tracking-wide">IP Address</label>
            <input
              className="input mt-1 w-full font-mono"
              placeholder="e.g. 192.168.1.100"
              value={ip}
              onChange={e => setIp(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-earth-600 uppercase tracking-wide">Reason</label>
            <textarea
              className="input mt-1 w-full resize-none h-20 text-sm"
              placeholder="Reason for blocking (optional)"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm">
              {saving ? 'Blocking…' : 'Block IP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PerformancePage() {
  const { success, error } = useToast();
  const [stats, setStats]     = useState<SecurityStats | null>(null);
  const [blocked, setBlocked] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBlock, setShowBlock] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, blockedRes] = await Promise.all([
        securityApi.stats(),
        securityApi.blockedIPs(),
      ]);
      setStats(statsRes.data);
      setBlocked(blockedRes.data as BlockedIP[]);
    } catch { error('Failed to load performance data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unblock = async (id: number, ip: string) => {
    try {
      await securityApi.unblockIP(id);
      success(`Unblocked ${ip}`);
      setBlocked(prev => prev.filter(b => b.id !== id));
    } catch { error('Failed to unblock IP.'); }
  };

  const clearViolation = async (id: number) => {
    try {
      await securityApi.clearViolation(id);
      success('Violation cleared.');
      load();
    } catch { error('Failed to clear violation.'); }
  };

  if (loading) return <SectionSpinner />;
  if (!stats) return null;

  const s = stats.summary;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-earth-900">Performance & Security</h1>
          <p className="text-sm text-earth-500 mt-0.5">Real-time request monitoring, IP blocking and rate-limit control</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBlock(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={14} />
            Block IP
          </button>
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-earth-200 rounded-lg hover:bg-earth-50 transition-colors text-earth-600"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Activity}     label="Requests Today"    value={s.total_requests_today.toLocaleString()}  color="primary" />
        <StatCard icon={TrendingUp}   label="This Week"         value={s.total_requests_week.toLocaleString()}   color="green" />
        <StatCard icon={Clock}        label="Avg Response"      value={`${s.avg_response_time_ms} ms`}           color="primary" />
        <StatCard icon={AlertTriangle} label="Error Rate"       value={`${s.error_rate_percent}%`}               color={s.error_rate_percent > 5 ? 'red' : 'amber'} />
        <StatCard icon={Ban}          label="Blocked IPs"       value={s.blocked_ips}                            color="red" />
        <StatCard icon={Shield}       label="Violations"        value={s.violations}                             color="amber" />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Requests per hour */}
        <div className="bg-white rounded-xl border border-earth-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-earth-800 mb-4">Requests — Last 24 Hours</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.requests_hourly} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9a8e7f' }} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: '#9a8e7f' }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e8e0d5', fontSize: 12 }}
                labelStyle={{ fontWeight: 600, color: '#3d3530' }}
              />
              <Line type="monotone" dataKey="count" stroke="#b86a14" strokeWidth={2} dot={false} name="Requests" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Requests by method */}
        <div className="bg-white rounded-xl border border-earth-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-earth-800 mb-4">Requests by Method (Today)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.requests_by_method} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
              <XAxis dataKey="method" tick={{ fontSize: 11, fill: '#9a8e7f' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9a8e7f' }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e8e0d5', fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Requests">
                {stats.requests_by_method.map(entry => (
                  <Cell key={entry.method} fill={METHOD_COLOR[entry.method] ?? '#b86a14'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Status distribution + Top paths ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Status codes */}
        <div className="bg-white rounded-xl border border-earth-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-earth-800 mb-4">HTTP Status Distribution (Today)</h2>
          <div className="space-y-2">
            {stats.status_distribution.length === 0 ? (
              <p className="text-sm text-earth-400 py-6 text-center">No requests recorded today.</p>
            ) : stats.status_distribution.map(({ status_code, count }) => {
              const total = stats.status_distribution.reduce((s, x) => s + x.count, 0);
              const pct = total ? Math.round(count / total * 100) : 0;
              const color = status_code! < 300 ? 'bg-green-500' : status_code! < 400 ? 'bg-blue-500' : status_code! < 500 ? 'bg-amber-500' : 'bg-red-500';
              const badge = status_code! < 300 ? 'text-green-700 bg-green-50' : status_code! < 400 ? 'text-blue-700 bg-blue-50' : status_code! < 500 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';
              return (
                <div key={status_code} className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded w-12 text-center ${badge}`}>{status_code}</span>
                  <div className="flex-1 bg-earth-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-earth-500 w-16 text-right">{count.toLocaleString()} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top paths */}
        <div className="bg-white rounded-xl border border-earth-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-earth-100">
            <h2 className="text-sm font-semibold text-earth-800">Top Endpoints (Today)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-earth-100 bg-earth-50/50">
                  <th className="px-4 py-2 text-left text-earth-500 font-semibold uppercase tracking-wide">Method</th>
                  <th className="px-4 py-2 text-left text-earth-500 font-semibold uppercase tracking-wide">Path</th>
                  <th className="px-4 py-2 text-right text-earth-500 font-semibold uppercase tracking-wide">Hits</th>
                  <th className="px-4 py-2 text-right text-earth-500 font-semibold uppercase tracking-wide">Avg ms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-50">
                {stats.top_paths.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-earth-400">No data yet.</td></tr>
                ) : stats.top_paths.map((row, i) => (
                  <tr key={i} className="hover:bg-earth-50/40">
                    <td className="px-4 py-2.5">
                      <span className="font-mono font-bold" style={{ color: METHOD_COLOR[row.method] ?? '#b86a14' }}>
                        {row.method}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-earth-700 max-w-[200px] truncate">{row.path}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-earth-800">{row.count}</td>
                    <td className="px-4 py-2.5 text-right text-earth-500">{row.avg_ms ? Math.round(row.avg_ms) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Blocked IPs + Violations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Blocked IPs */}
        <div className="bg-white rounded-xl border border-earth-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-earth-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-earth-800 flex items-center gap-2">
              <Ban size={15} className="text-red-500" />
              Blocked IPs
              {blocked.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{blocked.length}</span>
              )}
            </h2>
            <button
              onClick={() => setShowBlock(true)}
              className="text-xs flex items-center gap-1 text-red-600 hover:text-red-800 font-medium"
            >
              <Plus size={12} />
              Add
            </button>
          </div>
          <div className="divide-y divide-earth-50 max-h-72 overflow-y-auto">
            {blocked.length === 0 ? (
              <p className="px-5 py-8 text-sm text-earth-400 text-center">No blocked IPs.</p>
            ) : blocked.map(b => (
              <div key={b.id} className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-earth-50/40">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-earth-900">{b.ip}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${b.is_permanent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {b.is_permanent ? 'Permanent' : 'Temporary'}
                    </span>
                  </div>
                  {b.reason && <p className="text-xs text-earth-500 mt-0.5 truncate">{b.reason}</p>}
                  <p className="text-xs text-earth-400 mt-0.5">{new Date(b.created_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => unblock(b.id, b.ip)}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-earth-400 hover:text-red-600 transition-colors"
                  title="Unblock"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rate limit violations */}
        <div className="bg-white rounded-xl border border-earth-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-earth-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-earth-800 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              Rate-Limit Violations
              {stats.recent_violations.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {stats.summary.violations}
                </span>
              )}
            </h2>
          </div>
          <div className="divide-y divide-earth-50 max-h-72 overflow-y-auto">
            {stats.recent_violations.length === 0 ? (
              <p className="px-5 py-8 text-sm text-earth-400 text-center">No violations recorded.</p>
            ) : stats.recent_violations.map((v, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-earth-50/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-earth-900">{v.ip}</span>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {v.violation_count}×
                    </span>
                  </div>
                  <p className="text-xs text-earth-400 mt-0.5">
                    Last: {new Date(v.last_violation).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => clearViolation(i)}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-amber-50 text-earth-400 hover:text-amber-600 transition-colors"
                  title="Clear violation"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showBlock && (
        <BlockIPModal onClose={() => setShowBlock(false)} onSaved={load} />
      )}
    </div>
  );
}
