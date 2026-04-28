import { useEffect, useState } from 'react';
import {
  Building2, CreditCard, Smartphone, CheckCircle, XCircle, Save, Eye, EyeOff, ChevronDown, ChevronUp,
  Receipt, Clock, User, Search, Filter,
} from 'lucide-react';
import { paymentsApi } from '../../api';
import type { PaymentMethod, PaymentTransaction } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';

const CHANNEL_META: Record<string, { label: string; icon: React.ElementType; desc: string; fields: { key: string; label: string; secret?: boolean; placeholder?: string }[] }> = {
  bank_transfer: {
    label: 'Bank Transfer',
    icon: Building2,
    desc: 'Manual payment — users transfer funds and submit a reference number for admin verification.',
    fields: [
      { key: 'bank_name',      label: 'Bank Name',       placeholder: 'e.g. CRDB Bank' },
      { key: 'account_number', label: 'Account Number',  placeholder: 'e.g. 0150123456789' },
      { key: 'account_name',   label: 'Account Name',    placeholder: 'e.g. Afristudio Ltd' },
      { key: 'branch',         label: 'Branch',          placeholder: 'e.g. Dar es Salaam' },
      { key: 'swift_code',     label: 'SWIFT / BIC',     placeholder: 'e.g. CRDBTZTX' },
      { key: 'instructions',   label: 'Instructions',    placeholder: 'Any special instructions for the payer' },
    ],
  },
  stripe: {
    label: 'Stripe',
    icon: CreditCard,
    desc: 'International card payments via Stripe. Users pay online with Visa, Mastercard, etc.',
    fields: [
      { key: 'publishable_key', label: 'Publishable Key', placeholder: 'pk_live_...' },
      { key: 'secret_key',      label: 'Secret Key',      secret: true, placeholder: 'sk_live_...' },
      { key: 'webhook_secret',  label: 'Webhook Secret',  secret: true, placeholder: 'whsec_...' },
    ],
  },
  selcom: {
    label: 'Selcom',
    icon: Smartphone,
    desc: 'Mobile money payments via Selcom (Tanzania). Customers pay via M-Pesa, Airtel, etc.',
    fields: [
      { key: 'vendor_id',    label: 'Vendor ID',       placeholder: 'Your Selcom vendor ID' },
      { key: 'vendor_pass',  label: 'Vendor Password', secret: true, placeholder: 'Your Selcom vendor password' },
      { key: 'api_url',      label: 'API Base URL',    placeholder: 'https://apigw.selcommobile.com/v1' },
      { key: 'redirect_url', label: 'Redirect URL',    placeholder: 'https://yoursite.com/payment/success' },
      { key: 'cancel_url',   label: 'Cancel URL',      placeholder: 'https://yoursite.com/payment/cancel' },
      { key: 'callback_url', label: 'Callback / Webhook URL', placeholder: 'https://yoursite.com/api/payments/selcom/callback/' },
    ],
  },
};

const STATUS_BADGE: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  completed:  'bg-green-100 text-green-700',
  failed:     'bg-red-100 text-red-700',
  cancelled:  'bg-earth-100 text-earth-500',
  refunded:   'bg-purple-100 text-purple-700',
};

export function PaymentMethodsPage() {
  const { success, error } = useToast();
  const [tab, setTab] = useState<'methods' | 'transactions'>('methods');

  // Methods state
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  // Transactions state
  const [txns, setTxns] = useState<PaymentTransaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [txnFilter, setTxnFilter] = useState({ channel: '', status: '', search: '' });
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const loadMethods = async () => {
    setLoadingMethods(true);
    try {
      const { data } = await paymentsApi.adminGetMethods();
      setMethods(data);
      const cfgMap: Record<string, Record<string, string>> = {};
      data.forEach(m => { cfgMap[m.channel] = { ...(m.config as Record<string, string>) }; });
      setConfigs(cfgMap);
    } catch { error('Failed to load payment methods'); }
    finally { setLoadingMethods(false); }
  };

  const loadTxns = async () => {
    setLoadingTxns(true);
    try {
      const params: { channel?: string; status?: string } = {};
      if (txnFilter.channel) params.channel = txnFilter.channel;
      if (txnFilter.status)  params.status  = txnFilter.status;
      const { data } = await paymentsApi.listTransactions(params);
      setTxns(data);
    } catch { error('Failed to load transactions'); }
    finally { setLoadingTxns(false); }
  };

  useEffect(() => { loadMethods(); }, []); // eslint-disable-line
  useEffect(() => { if (tab === 'transactions') loadTxns(); }, [tab, txnFilter.channel, txnFilter.status]); // eslint-disable-line

  const handleToggleActive = async (method: PaymentMethod) => {
    const next = !method.is_active;
    const label = next ? 'activate' : 'deactivate';
    const ok = await swal.confirm({
      title: `${label.charAt(0).toUpperCase() + label.slice(1)} "${method.display_name}"?`,
      text: `This method will be ${next ? 'visible to users' : 'hidden from checkout'}.`,
    });
    if (!ok) return;
    try {
      await paymentsApi.adminUpdateMethod(method.channel, { is_active: next });
      success(`${method.display_name} ${next ? 'activated' : 'deactivated'}`);
      loadMethods();
    } catch { error('Failed to update method'); }
  };

  const handleSaveConfig = async (channel: string) => {
    setSaving(channel);
    try {
      await paymentsApi.adminUpdateMethod(channel, { config: configs[channel] });
      success('Configuration saved');
    } catch { error('Failed to save configuration'); }
    finally { setSaving(null); }
  };

  const handleConfirm = async (txn: PaymentTransaction) => {
    setConfirmingId(txn.id);
    setAdminNotes('');
  };

  const handleConfirmSubmit = async () => {
    if (!confirmingId) return;
    try {
      await paymentsApi.confirmTransaction(confirmingId, adminNotes);
      success('Payment confirmed and order updated');
      setConfirmingId(null);
      loadTxns();
    } catch { error('Failed to confirm payment'); }
  };

  const handleCancel = async (txn: PaymentTransaction) => {
    const ok = await swal.confirm({
      title: 'Cancel this transaction?',
      text: 'This will mark the transaction as cancelled.',
    });
    if (!ok) return;
    try {
      await paymentsApi.cancelTransaction(txn.id);
      success('Transaction cancelled');
      loadTxns();
    } catch { error('Failed to cancel transaction'); }
  };

  const filteredTxns = txns.filter(t => {
    if (!txnFilter.search) return true;
    const q = txnFilter.search.toLowerCase();
    return (
      t.user_name.toLowerCase().includes(q) ||
      t.user_email.toLowerCase().includes(q) ||
      t.reference.toLowerCase().includes(q) ||
      String(t.id).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-earth-900">Payments</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-earth-100">
        {(['methods', 'transactions'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-primary-600 text-primary-700' : 'border-transparent text-earth-500 hover:text-earth-700'
            }`}
          >
            {t === 'methods' ? 'Payment Methods' : 'Transactions'}
          </button>
        ))}
      </div>

      {/* ── Methods Tab ─────────────────────────────────────────── */}
      {tab === 'methods' && (
        loadingMethods ? <SectionSpinner /> : (
          <div className="space-y-4">
            {Object.entries(CHANNEL_META).map(([channel, meta]) => {
              const method = methods.find(m => m.channel === channel);
              const isOpen = expanded === channel;
              const Icon = meta.icon;
              const cfg = configs[channel] || {};

              return (
                <div key={channel} className="bg-white rounded-xl border border-earth-100 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-4 p-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${method?.is_active ? 'bg-primary-100' : 'bg-earth-100'}`}>
                      <Icon size={20} className={method?.is_active ? 'text-primary-600' : 'text-earth-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-earth-900">{meta.label}</span>
                        {method?.is_active ? (
                          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">Active</span>
                        ) : (
                          <span className="text-[10px] font-bold bg-earth-100 text-earth-500 px-2 py-0.5 rounded-full uppercase">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-earth-500 mt-0.5">{meta.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {method && (
                        <button
                          onClick={() => handleToggleActive(method)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                            method.is_active
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-green-200 text-green-700 hover:bg-green-50'
                          }`}
                        >
                          {method.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      <button
                        onClick={() => setExpanded(isOpen ? null : channel)}
                        className="p-2 hover:bg-earth-50 rounded-lg transition-colors"
                      >
                        {isOpen ? <ChevronUp size={16} className="text-earth-400" /> : <ChevronDown size={16} className="text-earth-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Config form */}
                  {isOpen && (
                    <div className="border-t border-earth-50 p-5 bg-earth-50/30 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {meta.fields.map(f => (
                          <div key={f.key} className={f.key === 'instructions' ? 'md:col-span-2' : ''}>
                            <label className="block text-xs font-medium text-earth-700 mb-1">{f.label}</label>
                            <div className="relative">
                              {f.key === 'instructions' ? (
                                <textarea
                                  className="input text-sm h-20 resize-none"
                                  placeholder={f.placeholder}
                                  value={cfg[f.key] || ''}
                                  onChange={e => setConfigs(prev => ({ ...prev, [channel]: { ...prev[channel], [f.key]: e.target.value } }))}
                                />
                              ) : (
                                <input
                                  className="input text-sm pr-10"
                                  type={f.secret && !showSecret[`${channel}.${f.key}`] ? 'password' : 'text'}
                                  placeholder={f.placeholder}
                                  value={cfg[f.key] || ''}
                                  onChange={e => setConfigs(prev => ({ ...prev, [channel]: { ...prev[channel], [f.key]: e.target.value } }))}
                                />
                              )}
                              {f.secret && (
                                <button
                                  type="button"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-earth-400 hover:text-earth-600"
                                  onClick={() => setShowSecret(prev => ({ ...prev, [`${channel}.${f.key}`]: !prev[`${channel}.${f.key}`] }))}
                                >
                                  {showSecret[`${channel}.${f.key}`] ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleSaveConfig(channel)}
                          disabled={saving === channel}
                          className="btn-primary flex items-center gap-2 text-sm"
                        >
                          {saving === channel ? <Spinner size="sm" /> : <Save size={14} />}
                          {saving === channel ? 'Saving…' : 'Save Configuration'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Transactions Tab ───────────────────────────────────── */}
      {tab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-earth-100 p-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
              <input
                className="input pl-8 text-sm"
                placeholder="Search user, reference, ID…"
                value={txnFilter.search}
                onChange={e => setTxnFilter(f => ({ ...f, search: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-earth-400" />
              <select className="input text-sm w-36" value={txnFilter.channel} onChange={e => setTxnFilter(f => ({ ...f, channel: e.target.value }))}>
                <option value="">All Channels</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="stripe">Stripe</option>
                <option value="selcom">Selcom</option>
              </select>
              <select className="input text-sm w-36" value={txnFilter.status} onChange={e => setTxnFilter(f => ({ ...f, status: e.target.value }))}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {loadingTxns ? <SectionSpinner /> : filteredTxns.length === 0 ? (
            <div className="bg-white rounded-xl border border-earth-100 p-12 text-center">
              <Receipt size={40} className="text-earth-200 mx-auto mb-3" />
              <p className="text-earth-500 text-sm">No transactions found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-earth-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-earth-50 text-earth-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">ID</th>
                      <th className="px-4 py-3 text-left font-medium">User</th>
                      <th className="px-4 py-3 text-left font-medium">Channel</th>
                      <th className="px-4 py-3 text-left font-medium">Amount</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Reference</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-earth-50">
                    {filteredTxns.map(txn => (
                      <tr key={txn.id} className="hover:bg-earth-50/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-earth-500">#{txn.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                              <User size={12} className="text-primary-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-earth-800 truncate max-w-[140px]">{txn.user_name}</p>
                              <p className="text-[10px] text-earth-400 truncate max-w-[140px]">{txn.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize text-earth-600">{txn.channel.replace('_', ' ')}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary-700">
                          {txn.currency} {txn.amount}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${STATUS_BADGE[txn.status] || 'bg-earth-100 text-earth-500'}`}>
                            {txn.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-earth-600 font-mono text-xs max-w-[120px] truncate">
                          {txn.reference || <span className="text-earth-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-earth-400 text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(txn.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {txn.proof_image && (
                              <a href={txn.proof_image} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">Proof</a>
                            )}
                            {txn.status === 'processing' && (
                              <button
                                onClick={() => handleConfirm(txn)}
                                className="text-xs font-medium text-green-700 border border-green-200 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <CheckCircle size={11} /> Confirm
                              </button>
                            )}
                            {(txn.status === 'pending' || txn.status === 'processing') && (
                              <button
                                onClick={() => handleCancel(txn)}
                                className="text-xs font-medium text-red-600 border border-red-100 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <XCircle size={11} /> Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm dialog inline */}
      {confirmingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-bold text-earth-900">Confirm Payment</h3>
            <p className="text-sm text-earth-600">This will mark the transaction as completed and confirm the order.</p>
            <div>
              <label className="block text-xs font-medium text-earth-700 mb-1">Admin Notes (optional)</label>
              <textarea
                className="input text-sm h-20 resize-none"
                placeholder="e.g. Verified bank receipt, reference TXN12345"
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmingId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleConfirmSubmit} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <CheckCircle size={14} /> Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
