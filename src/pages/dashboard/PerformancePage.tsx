import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Activity, Shield, AlertTriangle, Clock, TrendingUp, Ban,
  RefreshCw, Trash2, Plus, X, Settings, Save, ChevronDown, ChevronUp, Laptop,
} from 'lucide-react';
import { securityApi } from '../../api';
import type { SecurityStats, BlockedIP, BlockedDevice, RateLimitViolation, SecurityConfig, ErrorRequestLog } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { SectionSpinner } from '../../components/ui/Spinner';

// ── helpers ───────────────────────────────────────────────────────────────────

const METHOD_COLOR: Record<string, string> = {
  GET: '#6366f1', POST: '#f59e0b', PUT: '#10b981',
  PATCH: '#3b82f6', DELETE: '#ef4444',
};

function validateIP(value: string): boolean {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  if (ipv4.test(value)) {
    return value.split('.').every(n => parseInt(n) <= 255);
  }
  return ipv6.test(value);
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'primary' }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color?: 'primary' | 'green' | 'red' | 'amber';
}) {
  const iconCls: Record<string, string> = {
    primary: 'bg-primary-100 text-primary-600',
    green:   'bg-green-100  text-green-600',
    red:     'bg-red-100    text-red-600',
    amber:   'bg-amber-100  text-amber-600',
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

// ── Block IP Modal ────────────────────────────────────────────────────────────

function BlockIPModal({ prefillIP = '', onClose, onSaved }: {
  prefillIP?: string; onClose: () => void; onSaved: () => void;
}) {
  const { success, error } = useToast();
  const [ip, setIp]         = useState(prefillIP);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [ipError, setIpError] = useState('');

  const handleIpChange = (v: string) => {
    setIp(v);
    if (v && !validateIP(v)) setIpError('Enter a valid IPv4 (e.g. 192.168.1.1) or IPv6 address');
    else setIpError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim() || ipError) return;
    setSaving(true);
    try {
      await securityApi.blockIP({ ip: ip.trim(), reason, is_permanent: true });
      success(`IP ${ip} blocked.`);
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      error(msg || 'Failed to block IP.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-earth-900 flex items-center gap-2">
            <Ban size={16} className="text-red-500" /> Block IP Address
          </h3>
          <button onClick={onClose} className="text-earth-400 hover:text-earth-700"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-earth-600 uppercase tracking-wide">
              IP Address <span className="text-red-500">*</span>
            </label>
            <input
              className={`input mt-1 w-full font-mono ${ipError ? 'border-red-400 focus:ring-red-300' : ''}`}
              placeholder="e.g. 192.168.1.100 or 2001:db8::1"
              value={ip}
              onChange={e => handleIpChange(e.target.value)}
              required
              autoFocus
            />
            {ipError && <p className="text-xs text-red-500 mt-1">{ipError}</p>}
            {ip && !ipError && validateIP(ip) && (
              <p className="text-xs text-green-600 mt-1">✓ Valid IP address</p>
            )}
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
            <button
              type="submit"
              disabled={saving || !!ipError || !ip.trim()}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving ? 'Blocking…' : 'Block IP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Rate Limit Config Panel ───────────────────────────────────────────────────

function ConfigPanel({ onUpdated }: { onUpdated: () => void }) {
  const { success, error } = useToast();
  const [config, setConfig]   = useState<SecurityConfig | null>(null);
  const [form, setForm]       = useState({ rate_limit_requests: 120, rate_limit_window: 60, auto_block_threshold: 10 });
  const [saving, setSaving]   = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    securityApi.getConfig()
      .then(r => { setConfig(r.data); setForm({ rate_limit_requests: r.data.rate_limit_requests, rate_limit_window: r.data.rate_limit_window, auto_block_threshold: r.data.auto_block_threshold }); })
      .catch(() => {});
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await securityApi.updateConfig(form);
      setConfig(r.data);
      success('Rate limit settings saved.');
      onUpdated();
    } catch { error('Failed to save settings.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-earth-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-earth-50/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-primary-600" />
          <span className="text-sm font-semibold text-earth-800">Rate Limit Configuration</span>
          {config && (
            <span className="text-xs text-earth-400">
              — {config.rate_limit_requests} req / {config.rate_limit_window}s · auto-block at {config.auto_block_threshold} violations
            </span>
          )}
        </div>
        {open ? <ChevronUp size={15} className="text-earth-400" /> : <ChevronDown size={15} className="text-earth-400" />}
      </button>

      {open && (
        <form onSubmit={save} className="px-5 pb-5 border-t border-earth-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-xs font-semibold text-earth-600 uppercase tracking-wide block mb-1">
                Max Requests
              </label>
              <input
                type="number" min={1} max={10000}
                className="input w-full"
                value={form.rate_limit_requests}
                onChange={e => setForm(f => ({ ...f, rate_limit_requests: +e.target.value }))}
              />
              <p className="text-xs text-earth-400 mt-1">Requests allowed per window</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-earth-600 uppercase tracking-wide block mb-1">
                Window (seconds)
              </label>
              <input
                type="number" min={1} max={3600}
                className="input w-full"
                value={form.rate_limit_window}
                onChange={e => setForm(f => ({ ...f, rate_limit_window: +e.target.value }))}
              />
              <p className="text-xs text-earth-400 mt-1">Duration of each rate window</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-earth-600 uppercase tracking-wide block mb-1">
                Auto-Block Threshold
              </label>
              <input
                type="number" min={1} max={1000}
                className="input w-full"
                value={form.auto_block_threshold}
                onChange={e => setForm(f => ({ ...f, auto_block_threshold: +e.target.value }))}
              />
              <p className="text-xs text-earth-400 mt-1">Violations before permanent block</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-earth-400">
              Current: <strong>{form.rate_limit_requests}</strong> req per <strong>{form.rate_limit_window}s</strong>,
              auto-block after <strong>{form.auto_block_threshold}</strong> violations
            </p>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Save size={13} />
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Violations Table ──────────────────────────────────────────────────────────

function ViolationsTable({ onBlock, refreshTrigger, onMutate }: {
  onBlock: (ip: string) => void; refreshTrigger: number; onMutate: () => void;
}) {
  const { success, error } = useToast();
  const [violations, setViolations] = useState<RateLimitViolation[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<Set<number>>(new Set());
  const [deleting, setDeleting]     = useState(false);
  const [blockingId, setBlockingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await securityApi.violations(search || undefined);
      setViolations(r.data);
      setSelected(new Set());
    } catch { error('Failed to load violations.'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const allSelected = violations.length > 0 && selected.size === violations.length;
  const toggleAll   = () => setSelected(allSelected ? new Set() : new Set(violations.map(v => v.id)));
  const toggle      = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const clear = async (id: number) => {
    try {
      await securityApi.clearViolation(id);
      setViolations(v => v.filter(x => x.id !== id));
      setSelected(s => { const n = new Set(s); n.delete(id); return n; });
      success('Violation cleared.');
      onMutate();
    } catch { error('Failed to clear.'); }
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    setDeleting(true);
    try {
      await securityApi.bulkDeleteViolations([...selected]);
      success(`${selected.size} violation${selected.size > 1 ? 's' : ''} deleted.`);
      load();
      onMutate();
    } catch { error('Bulk delete failed.'); }
    finally { setDeleting(false); }
  };

  const blockFromViolation = async (v: RateLimitViolation) => {
    setBlockingId(v.id);
    try {
      await securityApi.blockFromViolation(v.id);
      success(`Device ${v.signature_short} blocked.`);
      onBlock(v.ip || '');
      onMutate();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      error(msg || 'Failed to block device.');
    } finally { setBlockingId(null); }
  };

  return (
    <div className="bg-white rounded-xl border border-earth-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-earth-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <AlertTriangle size={15} className="text-amber-500" />
          <h2 className="text-sm font-semibold text-earth-800">Rate-Limit Violations</h2>
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{violations.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={bulkDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <Trash2 size={12} />
              {deleting ? 'Deleting…' : `Delete ${selected.size}`}
            </button>
          )}
          <input className="input w-44 text-sm" placeholder="Filter by IP…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center"><div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-earth-50/80 border-b border-earth-100">
                <th className="pl-4 pr-2 py-2.5 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="rounded border-earth-300 text-primary-600 focus:ring-primary-500 cursor-pointer" />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide">IP / Device</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-earth-500 uppercase tracking-wide">Count</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide hidden md:table-cell">User Agent</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide">Last Seen</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-earth-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-50">
              {violations.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-earth-400">No violations recorded.</td></tr>
              ) : violations.map(v => (
                <tr key={v.id} className={`hover:bg-earth-50/40 ${selected.has(v.id) ? 'bg-amber-50/40' : ''}`}>
                  <td className="pl-4 pr-2 py-3">
                    <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggle(v.id)}
                      className="rounded border-earth-300 text-primary-600 focus:ring-primary-500 cursor-pointer" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-mono text-xs font-bold text-earth-900">{v.ip || '—'}</div>
                    <div className="text-[10px] text-earth-400 mt-0.5">sig: {v.signature_short}</div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                      v.violation_count >= 10 ? 'bg-red-100 text-red-700' :
                      v.violation_count >= 5  ? 'bg-amber-100 text-amber-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>{v.violation_count}×</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-earth-400 max-w-[160px] truncate hidden md:table-cell">{v.user_agent || '—'}</td>
                  <td className="px-3 py-3 text-xs text-earth-500">{new Date(v.last_violation).toLocaleString()}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => blockFromViolation(v)} disabled={blockingId === v.id}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        title="Block this device only">
                        <Ban size={11} />{blockingId === v.id ? '…' : 'Block'}
                      </button>
                      <button onClick={() => clear(v.id)}
                        className="p-1.5 rounded-md hover:bg-earth-100 text-earth-400 hover:text-earth-700 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Blocked IPs Table ─────────────────────────────────────────────────────────

function BlockedIPsTable({ refreshTrigger, onAddClick, onMutate }: {
  refreshTrigger: number; onAddClick: () => void; onMutate: () => void;
}) {
  const { success, error } = useToast();
  const [blocked, setBlocked]   = useState<BlockedIP[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await securityApi.blockedIPs(search || undefined);
      setBlocked(r.data as BlockedIP[]);
      setSelected(new Set());
    } catch { error('Failed to load blocked IPs.'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const allSelected = blocked.length > 0 && selected.size === blocked.length;
  const toggleAll   = () => setSelected(allSelected ? new Set() : new Set(blocked.map(b => b.id)));
  const toggle      = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const unblock = async (id: number, ip: string) => {
    try {
      await securityApi.unblockIP(id);
      success(`Unblocked ${ip}`);
      setBlocked(prev => prev.filter(b => b.id !== id));
      setSelected(s => { const n = new Set(s); n.delete(id); return n; });
      onMutate();
    } catch { error('Failed to unblock IP.'); }
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    setDeleting(true);
    try {
      await securityApi.bulkDeleteBlockedIPs([...selected]);
      success(`${selected.size} IP${selected.size > 1 ? 's' : ''} unblocked.`);
      load();
      onMutate();
    } catch { error('Bulk delete failed.'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-earth-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-earth-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Ban size={15} className="text-red-500" />
          <h2 className="text-sm font-semibold text-earth-800">Blocked IPs</h2>
          {blocked.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{blocked.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={bulkDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <Trash2 size={12} />
              {deleting ? 'Deleting…' : `Unblock ${selected.size}`}
            </button>
          )}
          <input className="input w-44 text-sm" placeholder="Filter by IP…" value={search}
            onChange={e => setSearch(e.target.value)} />
          <button
            onClick={onAddClick}
            className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors shrink-0"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center"><div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-earth-50/80 border-b border-earth-100">
                <th className="pl-4 pr-2 py-2.5 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="rounded border-earth-300 text-primary-600 focus:ring-primary-500 cursor-pointer" />
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide">IP Address</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide hidden sm:table-cell">Reason</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-earth-500 uppercase tracking-wide">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide hidden md:table-cell">Blocked At</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-earth-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-50">
              {blocked.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-earth-400">No blocked IPs.</td></tr>
              ) : blocked.map(b => (
                <tr key={b.id} className={`hover:bg-earth-50/40 ${selected.has(b.id) ? 'bg-red-50/40' : ''}`}>
                  <td className="pl-4 pr-2 py-3">
                    <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggle(b.id)}
                      className="rounded border-earth-300 text-primary-600 focus:ring-primary-500 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 font-mono text-sm font-bold text-earth-900">{b.ip}</td>
                  <td className="px-4 py-3 text-xs text-earth-500 max-w-[180px] truncate hidden sm:table-cell">
                    {b.reason || <span className="italic text-earth-300">No reason</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      b.is_permanent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {b.is_permanent ? 'Permanent' : 'Temporary'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-earth-400 hidden md:table-cell">
                    {new Date(b.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => unblock(b.id, b.ip)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-earth-50 text-earth-600 hover:bg-earth-100 transition-colors ml-auto"
                      title="Unblock"
                    >
                      <Trash2 size={11} /> Unblock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Blocked Devices Table ─────────────────────────────────────────────────────

function BlockedDevicesTable({ refreshTrigger, onMutate }: {
  refreshTrigger: number; onMutate: () => void;
}) {
  const { success, error } = useToast();
  const [devices, setDevices]   = useState<BlockedDevice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await securityApi.blockedDevices(search || undefined);
      setDevices(r.data);
      setSelected(new Set());
    } catch { error('Failed to load blocked devices.'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const allSelected = devices.length > 0 && selected.size === devices.length;
  const toggleAll   = () => setSelected(allSelected ? new Set() : new Set(devices.map(d => d.id)));
  const toggle      = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const unblock = async (id: number) => {
    try {
      await securityApi.unblockDevice(id);
      success('Device unblocked.');
      setDevices(d => d.filter(x => x.id !== id));
      setSelected(s => { const n = new Set(s); n.delete(id); return n; });
      onMutate();
    } catch { error('Failed to unblock device.'); }
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    setDeleting(true);
    try {
      await securityApi.bulkDeleteBlockedDevices([...selected]);
      success(`${selected.size} device${selected.size > 1 ? 's' : ''} unblocked.`);
      load();
      onMutate();
    } catch { error('Bulk delete failed.'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-earth-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-earth-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Laptop size={15} className="text-violet-500" />
          <h2 className="text-sm font-semibold text-earth-800">Blocked Devices</h2>
          {devices.length > 0 && (
            <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">{devices.length}</span>
          )}
          <span className="text-xs text-earth-400 ml-1 hidden sm:inline">— device-level blocks, other devices on the same IP are unaffected</span>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={bulkDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <Trash2 size={12} />
              {deleting ? 'Deleting…' : `Unblock ${selected.size}`}
            </button>
          )}
          <input
            className="input w-48 text-sm"
            placeholder="Filter by IP or signature…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center"><div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-earth-50/80 border-b border-earth-100">
                <th className="pl-4 pr-2 py-2.5 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="rounded border-earth-300 text-primary-600 focus:ring-primary-500 cursor-pointer" />
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide">Signature</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide">IP (at block time)</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide hidden lg:table-cell">User Agent</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide hidden md:table-cell">Reason</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-earth-500 uppercase tracking-wide">Type</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-earth-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-50">
              {devices.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-earth-400">No blocked devices.</td></tr>
              ) : devices.map(d => (
                <tr key={d.id} className={`hover:bg-earth-50/40 ${selected.has(d.id) ? 'bg-violet-50/40' : ''}`}>
                  <td className="pl-4 pr-2 py-3">
                    <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)}
                      className="rounded border-earth-300 text-primary-600 focus:ring-primary-500 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded font-bold">
                      {d.signature_short}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-earth-700">{d.ip || '—'}</td>
                  <td className="px-4 py-3 text-xs text-earth-500 max-w-[200px] truncate hidden lg:table-cell">
                    {d.user_agent || <span className="italic text-earth-300">Unknown</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-earth-500 max-w-[160px] truncate hidden md:table-cell">
                    {d.reason || <span className="italic text-earth-300">No reason</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${d.is_permanent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {d.is_permanent ? 'Permanent' : 'Temporary'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => unblock(d.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-earth-50 text-earth-600 hover:bg-earth-100 transition-colors ml-auto"
                    >
                      <Trash2 size={11} /> Unblock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Error Requests Table ──────────────────────────────────────────────────────

const STATUS_COLOR: Record<number, string> = {
  400: 'bg-amber-100 text-amber-700',
  401: 'bg-orange-100 text-orange-700',
  403: 'bg-orange-100 text-orange-700',
  404: 'bg-yellow-100 text-yellow-700',
  429: 'bg-purple-100 text-purple-700',
  500: 'bg-red-100 text-red-700',
  502: 'bg-red-100 text-red-700',
  503: 'bg-red-100 text-red-700',
};

function statusColor(code: number | null) {
  if (!code) return 'bg-earth-100 text-earth-500';
  if (STATUS_COLOR[code]) return STATUS_COLOR[code];
  if (code >= 500) return 'bg-red-100 text-red-700';
  if (code >= 400) return 'bg-amber-100 text-amber-700';
  return 'bg-earth-100 text-earth-500';
}

function ErrorRequestsTable({ refreshTrigger }: { refreshTrigger: number }) {
  const { error } = useToast();
  const [rows, setRows]       = useState<ErrorRequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [days, setDays]           = useState(1);
  const [minStatus, setMinStatus] = useState(400);
  const [limit, setLimit]         = useState(200);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await securityApi.errorRequests({ days, min_status: minStatus, search: search || undefined, limit });
      setRows(r.data);
    } catch { error('Failed to load error requests.'); }
    finally { setLoading(false); }
  }, [search, days, minStatus, limit]);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const counts = rows.reduce<Record<number, number>>((acc, r) => {
    if (r.status_code) acc[r.status_code] = (acc[r.status_code] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-earth-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-earth-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <AlertTriangle size={15} className="text-red-500" />
          <h2 className="text-sm font-semibold text-earth-800">Error Requests</h2>
          {rows.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{rows.length}</span>
          )}
          {/* mini breakdown badges */}
          {Object.entries(counts).sort(([a],[b]) => +a - +b).map(([code, cnt]) => (
            <span key={code} className={`text-xs font-bold px-2 py-0.5 rounded-full hidden sm:inline ${statusColor(+code)}`}>
              {code} ×{cnt}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="input text-sm w-32"
            value={days}
            onChange={e => setDays(+e.target.value)}
          >
            <option value={1}>Today</option>
            <option value={2}>Yesterday + today</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 3 months</option>
            <option value={180}>Last 6 months</option>
          </select>
          <select
            className="input text-sm w-28"
            value={minStatus}
            onChange={e => setMinStatus(+e.target.value)}
          >
            <option value={400}>4xx + 5xx</option>
            <option value={500}>5xx only</option>
          </select>
          <select
            className="input text-sm w-24"
            value={limit}
            onChange={e => setLimit(+e.target.value)}
          >
            <option value={100}>100 rows</option>
            <option value={200}>200 rows</option>
            <option value={500}>500 rows</option>
          </select>
          <input
            className="input w-44 text-sm"
            placeholder="Filter by IP or path…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button onClick={load} className="p-2 rounded-lg border border-earth-200 hover:bg-earth-50 text-earth-500 transition-colors">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center"><div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-earth-50/80 border-b border-earth-100">
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-earth-500 uppercase tracking-wide w-16">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide w-16">Method</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide">Path</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide hidden md:table-cell">IP</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-earth-500 uppercase tracking-wide hidden sm:table-cell">ms</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide hidden lg:table-cell">User Agent</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-50">
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-earth-400">No error requests found.</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="hover:bg-earth-50/40">
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor(r.status_code)}`}>
                      {r.status_code ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono font-bold text-xs" style={{ color: METHOD_COLOR[r.method] ?? '#b86a14' }}>
                    {r.method}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-earth-700 max-w-[220px] truncate">{r.path}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-earth-500 hidden md:table-cell">{r.ip || '—'}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-earth-400 hidden sm:table-cell tabular-nums">
                    {r.response_time_ms != null ? r.response_time_ms : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-earth-400 max-w-[180px] truncate hidden lg:table-cell">{r.user_agent || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-earth-400 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function PerformancePage() {
  const { error } = useToast();
  const [stats, setStats]           = useState<SecurityStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [blockModal, setBlockModal] = useState<{ open: boolean; prefillIP: string }>({ open: false, prefillIP: '' });
  const [tick, setTick] = useState(0);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const r = await securityApi.stats();
      setStats(r.data);
    } catch { error('Failed to load performance data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // increment tick after any mutating action → all sub-tables re-fetch
  const onMutate = useCallback(() => {
    setTick(t => t + 1);
    loadStats();
  }, [loadStats]);

  const openBlockModal = (ip = '') => setBlockModal({ open: true, prefillIP: ip });

  if (loading) return <SectionSpinner />;
  if (!stats) return null;

  const s = stats.summary;
  const maxIPCount = Math.max(...(stats.top_ips.map(r => r.count)), 1);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-earth-900">Performance & Security</h1>
          <p className="text-sm text-earth-500 mt-0.5">Request monitoring, IP control and rate-limit management</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openBlockModal()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={14} /> Block IP
          </button>
          <button
            onClick={onMutate}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-earth-200 rounded-lg hover:bg-earth-50 transition-colors text-earth-600"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Config Panel ── */}
      <ConfigPanel onUpdated={onMutate} />

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Activity}      label="Requests Today"  value={s.total_requests_today.toLocaleString()} color="primary" />
        <StatCard icon={TrendingUp}    label="This Week"       value={s.total_requests_week.toLocaleString()}  color="green" />
        <StatCard icon={Clock}         label="Avg Response"    value={`${s.avg_response_time_ms} ms`}          color="primary" />
        <StatCard icon={AlertTriangle} label="Error Rate"      value={`${s.error_rate_percent}%`}              color={s.error_rate_percent > 5 ? 'red' : 'amber'} />
        <StatCard icon={Ban}           label="Blocked IPs"     value={s.blocked_ips}                           color="red" />
        <StatCard icon={Laptop}        label="Blocked Devices" value={s.blocked_devices ?? 0}                  color="red" />
        <StatCard icon={Shield}        label="Violations"      value={s.violations}                            color="amber" />
      </div>

      {/* ── Charts: hourly + by method ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-earth-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-earth-800 mb-4">Requests — Last 24 Hours</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.requests_hourly} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9a8e7f' }} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: '#9a8e7f' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8e0d5', fontSize: 12 }} labelStyle={{ fontWeight: 600 }} />
              <Line type="monotone" dataKey="count" stroke="#b86a14" strokeWidth={2} dot={false} name="Requests" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-earth-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-earth-800 mb-4">Requests by Method (Today)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.requests_by_method} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
              <XAxis dataKey="method" tick={{ fontSize: 11, fill: '#9a8e7f' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9a8e7f' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8e0d5', fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Requests">
                {stats.requests_by_method.map(e => (
                  <Cell key={e.method} fill={METHOD_COLOR[e.method] ?? '#b86a14'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top IPs chart ── */}
      <div className="bg-white rounded-xl border border-earth-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-earth-800">Top IPs by Request Count (Today)</h2>
          <span className="text-xs text-earth-400">{stats.top_ips.length} unique IPs</span>
        </div>
        {stats.top_ips.length === 0 ? (
          <p className="text-sm text-earth-400 text-center py-8">No requests logged today.</p>
        ) : (
          <div className="space-y-2">
            {stats.top_ips.map(row => {
              const pct = Math.round((row.count / maxIPCount) * 100);
              return (
                <div key={row.ip} className="flex items-center gap-3 group">
                  {/* IP + block indicator */}
                  <div className="w-36 flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-xs font-bold text-earth-800 truncate">{row.ip}</span>
                    {row.is_blocked && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">BLK</span>
                    )}
                  </div>
                  {/* Bar */}
                  <div className="flex-1 bg-earth-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${row.is_blocked ? 'bg-red-400' : 'bg-primary-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {/* Count + avg ms */}
                  <div className="flex items-center gap-3 shrink-0 w-36 justify-end">
                    <span className="text-xs font-bold text-earth-800 tabular-nums">{row.count.toLocaleString()}</span>
                    <span className="text-xs text-earth-400">{row.avg_ms ? `${Math.round(row.avg_ms)}ms` : '—'}</span>
                    {!row.is_blocked && (
                      <button
                        onClick={() => openBlockModal(row.ip)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100 font-medium"
                        title={`Block ${row.ip}`}
                      >
                        Block
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Status dist + Top paths ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-earth-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-earth-800 mb-4">HTTP Status Distribution (Today)</h2>
          <div className="space-y-2">
            {stats.status_distribution.length === 0 ? (
              <p className="text-sm text-earth-400 py-6 text-center">No requests recorded today.</p>
            ) : stats.status_distribution.map(({ status_code, count }) => {
              const total = stats.status_distribution.reduce((s, x) => s + x.count, 0);
              const pct = total ? Math.round(count / total * 100) : 0;
              const bar   = status_code! < 300 ? 'bg-green-500' : status_code! < 400 ? 'bg-blue-500' : status_code! < 500 ? 'bg-amber-500' : 'bg-red-500';
              const badge = status_code! < 300 ? 'text-green-700 bg-green-50' : status_code! < 400 ? 'text-blue-700 bg-blue-50' : status_code! < 500 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';
              return (
                <div key={status_code} className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded w-12 text-center ${badge}`}>{status_code}</span>
                  <div className="flex-1 bg-earth-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-earth-500 w-20 text-right">{count.toLocaleString()} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

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
                    <td className="px-4 py-2.5 font-mono font-bold" style={{ color: METHOD_COLOR[row.method] ?? '#b86a14' }}>{row.method}</td>
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

      {/* ── Error Requests table ── */}
      <ErrorRequestsTable refreshTrigger={tick} />

      {/* ── Violations full table ── */}
      <ViolationsTable
        refreshTrigger={tick}
        onMutate={onMutate}
        onBlock={ip => { onMutate(); openBlockModal(ip); }}
      />

      {/* ── Blocked Devices table ── */}
      <BlockedDevicesTable refreshTrigger={tick} onMutate={onMutate} />

      {/* ── Blocked IPs full table ── */}
      <BlockedIPsTable
        refreshTrigger={tick}
        onAddClick={() => openBlockModal()}
        onMutate={onMutate}
      />

      {/* ── Block IP Modal ── */}
      {blockModal.open && (
        <BlockIPModal
          prefillIP={blockModal.prefillIP}
          onClose={() => setBlockModal({ open: false, prefillIP: '' })}
          onSaved={() => { onMutate(); }}
        />
      )}
    </div>
  );
}
