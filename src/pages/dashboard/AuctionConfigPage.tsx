import { useEffect, useState } from 'react';
import {
  Settings, CreditCard, Clock, AlertTriangle, RefreshCw,
  CheckCircle, XCircle, ChevronDown, User, Search, Ban,
  Wallet, ShieldCheck, Zap,
} from 'lucide-react';
import { auctionConfigApi, auctionWinnersApi, auctionViolationsApi } from '../../api';
import type { AuctionConfig, AuctionWinner, AuctionViolation } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

// ── helpers ────────────────────────────────────────────────────────────────────

const MODE_INFO: Record<AuctionConfig['payment_mode'], {
  label: string; desc: string; icon: React.ElementType;
  iconCls: string; badgeCls: string;
}> = {
  free_bid: {
    label: 'Free Bid',
    desc: 'No balance required. Winner is notified to complete payment within the deadline.',
    icon: Wallet,
    iconCls: 'bg-blue-100 text-blue-600',
    badgeCls: 'bg-blue-600',
  },
  balance_required: {
    label: 'Balance Required',
    desc: 'Bidder must have sufficient wallet balance, but funds are not held. Winner pays after winning.',
    icon: ShieldCheck,
    iconCls: 'bg-amber-100 text-amber-600',
    badgeCls: 'bg-amber-500',
  },
  auto_deduct: {
    label: 'Auto Deduct',
    desc: 'Funds are held during bidding and deducted on win. Order is confirmed immediately.',
    icon: Zap,
    iconCls: 'bg-primary-100 text-primary-600',
    badgeCls: 'bg-primary-600',
  },
};

const PAYMENT_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  paid:    'bg-green-50 text-green-700 border border-green-200',
  expired: 'bg-red-50 text-red-600 border border-red-200',
};

function fmt(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString();
}

function hoursLabel(h: number | null | undefined) {
  if (h === null || h === undefined) return '—';
  if (h <= 0) return 'Overdue';
  return `${h.toFixed(1)}h left`;
}

// ── Config Panel ───────────────────────────────────────────────────────────────

function ConfigPanel({ config, onSaved }: { config: AuctionConfig; onSaved: (c: AuctionConfig) => void }) {
  const { success, error } = useToast();
  const [form, setForm] = useState<AuctionConfig>({ ...config });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof AuctionConfig>(key: K, val: AuctionConfig[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await auctionConfigApi.update(form);
      onSaved(res.data);
      success('Configuration saved.');
    } catch {
      error('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Mode */}
      <div>
        <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-3">
          Payment Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(MODE_INFO) as AuctionConfig['payment_mode'][]).map(mode => {
            const info = MODE_INFO[mode];
            const ModeIcon = info.icon;
            const active = form.payment_mode === mode;
            return (
              <button
                key={mode}
                onClick={() => set('payment_mode', mode)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                  active
                    ? 'border-primary-400 bg-primary-50 shadow-sm'
                    : 'border-earth-200 bg-white hover:border-earth-300 hover:bg-earth-50'
                }`}
              >
                {/* Checkmark badge */}
                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  active
                    ? 'bg-primary-600 scale-100 opacity-100'
                    : 'border-2 border-earth-300 scale-90 opacity-60'
                }`}>
                  {active && <CheckCircle size={13} className="text-white" strokeWidth={3} />}
                </div>

                {/* Mode icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  active ? info.iconCls : 'bg-earth-100 text-earth-400'
                }`}>
                  <ModeIcon size={18} />
                </div>

                <div className={`font-semibold text-sm mb-1 ${active ? 'text-primary-700' : 'text-earth-800'}`}>
                  {info.label}
                </div>
                <div className="text-xs text-earth-500 leading-relaxed pr-4">{info.desc}</div>

                {/* Active bottom bar */}
                {active && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Numeric Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Payment Deadline (hours)"
          hint="How long winner has to pay before auction is relisted"
          value={form.payment_deadline_hours}
          onChange={v => set('payment_deadline_hours', v)}
        />
        <Field
          label="Max Violations Before Suspension"
          hint="Number of unpaid wins before bidding is suspended"
          value={form.max_violations}
          onChange={v => set('max_violations', v)}
        />
        <Field
          label="Ban Duration (days)"
          hint="Days account is suspended after hitting max violations"
          value={form.ban_duration_days}
          onChange={v => set('ban_duration_days', v)}
        />
        <Field
          label="Relist Duration (hours)"
          hint="Duration of the relisted auction after non-payment"
          value={form.relist_duration_hours}
          onChange={v => set('relist_duration_hours', v)}
        />
      </div>

      {/* Relist Toggle */}
      <div className="flex items-center gap-4 p-4 bg-earth-50 rounded-xl border border-earth-100">
        <button
          onClick={() => set('relist_on_expired', !form.relist_on_expired)}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
            form.relist_on_expired ? 'bg-primary-600' : 'bg-earth-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              form.relist_on_expired ? 'translate-x-5' : ''
            }`}
          />
        </button>
        <div>
          <div className="text-sm font-semibold text-earth-800">Auto-Relist on Expired Payment</div>
          <div className="text-xs text-earth-500 mt-0.5">
            When enabled, the auction reopens for fresh bids if the winner doesn't pay in time.
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? <Spinner size="sm" /> : <Settings size={15} />}
          Save Configuration
        </button>
      </div>
    </div>
  );
}

function Field({
  label, hint, value, onChange,
}: {
  label: string; hint: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type="number"
        min={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="input"
      />
      <p className="mt-1 text-xs text-earth-400">{hint}</p>
    </div>
  );
}

// ── Winners Table ──────────────────────────────────────────────────────────────

function WinnersPanel({ canMarkPaid }: { canMarkPaid: boolean }) {
  const { success, error } = useToast();
  const [winners, setWinners] = useState<AuctionWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'expired'>('all');
  const [search, setSearch] = useState('');
  const [marking, setMarking] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await auctionWinnersApi.list(filter !== 'all' ? { payment_status: filter } : undefined);
      setWinners(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]); // eslint-disable-line

  async function markPaid(id: number) {
    const ok = await swal.confirm({
      title: 'Mark as Paid?',
      text: 'This will manually mark the winner as having completed payment.',
    });
    if (!ok) return;
    setMarking(id);
    try {
      const res = await auctionWinnersApi.markPaid(id);
      setWinners(w => w.map(x => x.id === id ? res.data : x));
      success('Marked as paid.');
    } catch {
      error('Failed to mark as paid.');
    } finally {
      setMarking(null);
    }
  }

  const filtered = winners.filter(w =>
    !search ||
    w.user_name.toLowerCase().includes(search.toLowerCase()) ||
    w.artwork_name.toLowerCase().includes(search.toLowerCase()) ||
    w.user_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user or artwork..."
            className="input pl-9"
          />
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as typeof filter)}
            className="input pr-8 appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="expired">Expired</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <SectionSpinner />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-earth-100 p-12 text-center">
          <div className="w-12 h-12 bg-earth-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CreditCard size={22} className="text-earth-300" />
          </div>
          <p className="font-medium text-earth-600">No winner records found</p>
          <p className="text-sm text-earth-400 mt-1">Winner records appear here when auctions close</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-earth-50 border-b border-earth-100">
                  {['Winner', 'Artwork', 'Bid Amount', 'Mode', 'Status', 'Deadline', 'Time Left', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-50">
                {filtered.map(w => (
                  <tr key={w.id} className="hover:bg-earth-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-earth-900">{w.user_name}</div>
                      <div className="text-xs text-earth-400">{w.user_email}</div>
                    </td>
                    <td className="px-4 py-3 text-earth-700">{w.artwork_name}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-earth-900">
                      {parseFloat(w.bid_amount).toLocaleString()} {w.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-earth-500 capitalize">{w.payment_mode.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PAYMENT_BADGE[w.payment_status] ?? ''}`}>
                        {w.payment_status}
                      </span>
                      {w.is_overdue && w.payment_status === 'pending' && (
                        <span className="ml-1.5 text-xs text-red-500 font-medium">Overdue</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-earth-500">{fmt(w.payment_deadline)}</td>
                    <td className="px-4 py-3 text-xs text-earth-500">{hoursLabel(w.hours_remaining)}</td>
                    <td className="px-4 py-3">
                      {canMarkPaid && w.payment_status === 'pending' && (
                        <button
                          onClick={() => markPaid(w.id)}
                          disabled={marking === w.id}
                          className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {marking === w.id ? <Spinner size="sm" /> : <CheckCircle size={12} />}
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-earth-100 text-xs text-earth-400">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Violations Table ───────────────────────────────────────────────────────────

function isBanned(bannedUntil: string | null): boolean {
  if (!bannedUntil) return false;
  return new Date(bannedUntil) > new Date();
}

function ViolationsPanel({ canReview }: { canReview: boolean }) {
  const { success, error } = useToast();
  const [violations, setViolations] = useState<AuctionViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actioning, setActioning] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await auctionViolationsApi.list();
      setViolations(r.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function handleBan(v: AuctionViolation) {
    const ok = await swal.confirm({
      title: `Ban ${v.user_name}?`,
      text: 'This will suspend their bidding privileges for the configured ban duration.',
      confirmText: 'Ban User',
    });
    if (!ok) return;
    setActioning(v.id);
    try {
      await auctionViolationsApi.banUser(v.id);
      success(`${v.user_name} has been banned from bidding.`);
      load();
    } catch {
      error('Failed to apply ban.');
    } finally {
      setActioning(null);
    }
  }

  async function handleUnban(v: AuctionViolation) {
    const ok = await swal.confirm({
      title: `Lift ban for ${v.user_name}?`,
      text: 'The user will be allowed to bid again immediately.',
      confirmText: 'Lift Ban',
    });
    if (!ok) return;
    setActioning(v.id);
    try {
      await auctionViolationsApi.unbanUser(v.id);
      success(`Ban lifted for ${v.user_name}.`);
      load();
    } catch {
      error('Failed to lift ban.');
    } finally {
      setActioning(null);
    }
  }

  const filtered = violations.filter(v =>
    !search ||
    v.user_name.toLowerCase().includes(search.toLowerCase()) ||
    v.artwork_name.toLowerCase().includes(search.toLowerCase()) ||
    v.user_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search violations..."
          className="input pl-9"
        />
      </div>

      {loading ? (
        <SectionSpinner />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-earth-100 p-12 text-center">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={22} className="text-green-400" />
          </div>
          <p className="font-medium text-earth-600">No payment violations</p>
          <p className="text-sm text-earth-400 mt-1">Violations appear when winners miss payment deadlines</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-earth-50 border-b border-earth-100">
                  {['User', 'Artwork', 'Bid', 'Violations', 'Ban Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-50">
                {filtered.map(v => {
                  const banned = isBanned(v.user_banned_until);
                  return (
                    <tr key={v.id} className="hover:bg-earth-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${banned ? 'bg-red-100' : 'bg-earth-100'}`}>
                            <User size={14} className={banned ? 'text-red-500' : 'text-earth-500'} />
                          </div>
                          <div>
                            <div className="font-semibold text-earth-900">{v.user_name}</div>
                            <div className="text-xs text-earth-400">{v.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-earth-700 max-w-[140px] truncate">{v.artwork_name}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-earth-900 text-xs">
                        {parseFloat(v.bid_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          v.user_total_violations >= 3 ? 'bg-red-50 text-red-600' :
                          v.user_total_violations >= 2 ? 'bg-amber-50 text-amber-600' :
                          'bg-earth-100 text-earth-600'
                        }`}>
                          {v.user_total_violations} violation{v.user_total_violations !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {banned ? (
                          <div>
                            <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                              <Ban size={11} /> Banned
                            </span>
                            <span className="text-[10px] text-earth-400 mt-0.5 block">
                              until {new Date(v.user_banned_until!).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                            <CheckCircle size={11} /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-earth-500 whitespace-nowrap">{fmt(v.created_at)}</td>
                      <td className="px-4 py-3">
                        {canReview && (
                          banned ? (
                            <button
                              onClick={() => handleUnban(v)}
                              disabled={actioning === v.id}
                              className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {actioning === v.id ? <Spinner size="sm" /> : <CheckCircle size={12} />}
                              Lift Ban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBan(v)}
                              disabled={actioning === v.id}
                              className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {actioning === v.id ? <Spinner size="sm" /> : <Ban size={12} />}
                              Ban User
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-earth-100 text-xs text-earth-400">
            {filtered.length} violation{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

type Tab = 'config' | 'winners' | 'violations';

export default function AuctionConfigPage() {
  const { hasPermission } = useAuth();
  const [config, setConfig] = useState<AuctionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('config');

  const canConfigure    = hasPermission('auctions.change_auctionconfig');
  const canViewWinners  = hasPermission('auctions.view_auctionwinner');
  const canMarkPaid     = hasPermission('auctions.change_auctionwinner');
  const canViewViolations = hasPermission('auctions.view_auctionpaymentviolation');
  const canReviewBan    = hasPermission('auctions.change_auctionpaymentviolation');

  useEffect(() => {
    auctionConfigApi.get().then(r => {
      setConfig(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'config',     label: 'Payment Rules', icon: Settings },
    { id: 'winners',    label: 'Winners',        icon: CreditCard },
    { id: 'violations', label: 'Violations',     icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-earth-900">Auction Configuration</h1>
          <p className="text-sm text-earth-500 mt-0.5">Manage payment rules, winner records, and bidding violations</p>
        </div>
      </div>

      {/* Summary Cards */}
      {config && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Payment Mode"    value={MODE_INFO[config.payment_mode].label}              icon={CreditCard}  color="primary" />
          <SummaryCard label="Deadline"        value={`${config.payment_deadline_hours}h`}               icon={Clock}       color="amber" />
          <SummaryCard label="Max Violations"  value={String(config.max_violations)}                     icon={AlertTriangle} color="red" />
          <SummaryCard label="Auto Relist"     value={config.relist_on_expired ? 'Enabled' : 'Disabled'} icon={RefreshCw}   color={config.relist_on_expired ? 'green' : 'earth'} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-earth-100 rounded-xl p-1 w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-white text-earth-900 shadow-sm'
                  : 'text-earth-500 hover:text-earth-700'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-earth-100 shadow-sm p-6">
        {loading ? (
          <SectionSpinner />
        ) : tab === 'config' ? (
          canConfigure && config ? (
            <ConfigPanel config={config} onSaved={setConfig} />
          ) : (
            <NoAccess />
          )
        ) : tab === 'winners' ? (
          canViewWinners ? (
            <WinnersPanel canMarkPaid={canMarkPaid} />
          ) : (
            <NoAccess />
          )
        ) : (
          canViewViolations ? (
            <ViolationsPanel canReview={canReviewBan} />
          ) : (
            <NoAccess />
          )
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const SUMMARY_ICON_CLS: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-600',
  amber:   'bg-amber-100   text-amber-600',
  red:     'bg-red-100     text-red-600',
  green:   'bg-green-100   text-green-600',
  earth:   'bg-earth-100   text-earth-500',
};

function SummaryCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: string; icon: React.ElementType; color: string;
}) {
  const cls = SUMMARY_ICON_CLS[color] ?? SUMMARY_ICON_CLS.earth;
  return (
    <div className="bg-white rounded-xl border border-earth-100 p-4 flex items-start gap-3 shadow-sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-earth-500 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm font-bold text-earth-900 mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

function NoAccess() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 bg-earth-50 rounded-2xl flex items-center justify-center">
        <XCircle size={28} className="text-earth-300" />
      </div>
      <p className="font-medium text-earth-600">Access Restricted</p>
      <p className="text-sm text-earth-400">You don't have permission to view this section.</p>
    </div>
  );
}
