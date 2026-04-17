import { useEffect, useState } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, RefreshCw, Search, Wallet as WalletIcon } from 'lucide-react';
import { walletApi, adminWalletsApi } from '../../api';
import type { Wallet, AdminWallet } from '../../api/types';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { SectionSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

// ─── My Wallet tab ────────────────────────────────────────────────────────────
function MyWalletTab() {
  const { error } = useToast();
  const [wallet, setWallet]         = useState<Wallet | null>(null);
  const [loading, setLoading]       = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [amount, setAmount]         = useState('');
  const [description, setDescription] = useState('Manual deposit');
  const [depositing, setDepositing] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await walletApi.get(); setWallet(data); }
    catch { error('Failed to load wallet'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositing(true);
    try {
      await walletApi.deposit(amount, description);
      swal.success('Funds deposited!');
      setDepositOpen(false);
      setAmount('');
      load();
    } catch { error('Deposit failed'); }
    finally { setDepositing(false); }
  };

  if (loading) return <SectionSpinner />;

  const txIcons = { deposit: ArrowUpCircle, deduction: ArrowDownCircle, refund: RefreshCw };
  const txColors = { deposit: 'text-green-500', deduction: 'text-red-500', refund: 'text-blue-500' };

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <div className="bg-gradient-to-r from-primary-700 to-earth-700 text-white rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
          <div className="min-w-0">
            <p className="text-primary-200 text-sm mb-2">Available Balance</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-primary-200 text-lg font-medium shrink-0">{wallet?.currency || 'USD'}</span>
              <span className="text-3xl sm:text-4xl font-bold break-all leading-tight">
                {Number(wallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-primary-200 text-xs mt-2">
              Updated {wallet ? new Date(wallet.updated_at).toLocaleString() : '—'}
            </p>
          </div>
          <button
            onClick={() => setDepositOpen(true)}
            className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors shrink-0 self-start"
          >
            <Plus size={16} /> Deposit
          </button>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl border border-earth-100 p-6">
        <h3 className="font-semibold text-earth-900 mb-4">Transaction History</h3>
        {!wallet?.transactions?.length ? (
          <p className="text-earth-400 text-sm text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {wallet.transactions.map(tx => {
              const Icon  = txIcons[tx.type as keyof typeof txIcons] || ArrowUpCircle;
              const color = txColors[tx.type as keyof typeof txColors] || 'text-gray-500';
              return (
                <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-earth-50 rounded-xl transition-colors">
                  <div className="w-10 h-10 rounded-full bg-earth-100 flex items-center justify-center shrink-0">
                    <Icon size={20} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-earth-900 truncate">{tx.description}</p>
                    <p className="text-xs text-earth-400">{new Date(tx.created_at).toLocaleString()}</p>
                    {tx.reference && <p className="text-xs text-earth-300 font-mono truncate">{tx.reference}</p>}
                  </div>
                  <div className="text-right shrink-0 max-w-[140px]">
                    <p className={`font-bold text-sm break-all ${tx.type === 'deduction' ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type === 'deduction' ? '−' : '+'}{wallet.currency}{' '}
                      {Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-earth-400 break-all">
                      Bal: {Number(tx.balance_after).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={depositOpen} onClose={() => setDepositOpen(false)} title="Deposit Funds" size="sm">
        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Amount (USD)</label>
            <input
              type="number" step="0.01" min="1" className="input text-2xl font-bold"
              placeholder="100.00" value={amount} onChange={e => setAmount(e.target.value)} required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Description</label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setDepositOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={depositing} className="btn-primary flex-1">
              {depositing ? 'Processing...' : 'Deposit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── All Wallets tab (admin only) ─────────────────────────────────────────────
function AllWalletsTab() {
  const { error } = useToast();
  const [wallets, setWallets]       = useState<AdminWallet[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [creditTarget, setCreditTarget] = useState<AdminWallet | null>(null);
  const [amount, setAmount]         = useState('');
  const [description, setDescription] = useState('Admin credit');
  const [crediting, setCrediting]   = useState(false);

  const load = async (q = '') => {
    setLoading(true);
    try { const { data } = await adminWalletsApi.list(q); setWallets(data); }
    catch { error('Failed to load wallets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search.trim());
  };

  const handleCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditTarget) return;
    setCrediting(true);
    try {
      const res = await adminWalletsApi.credit(creditTarget.id, amount, description);
      setWallets(prev => prev.map(w => w.id === creditTarget.id ? res.data : w));
      swal.success(`Credited ${amount} ${creditTarget.currency} to ${creditTarget.user_name}`);
      setCreditTarget(null);
      setAmount('');
      setDescription('Admin credit');
    } catch { error('Failed to credit wallet'); }
    finally { setCrediting(false); }
  };

  return (
    <div className="space-y-5">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-secondary text-sm">Search</button>
        {search && <button type="button" onClick={() => { setSearch(''); load(''); }} className="btn-secondary text-sm">Clear</button>}
      </form>

      {loading ? <SectionSpinner /> : wallets.length === 0 ? (
        <p className="text-earth-400 text-sm text-center py-10">No wallets found.</p>
      ) : (
        <div className="bg-white border border-earth-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-earth-50 border-b border-earth-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Balance</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Last Updated</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-50">
                {wallets.map(w => (
                  <tr key={w.id} className="hover:bg-earth-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-earth-900">{w.user_name}</p>
                      <p className="text-xs text-earth-500">{w.user_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-earth-900">{w.currency} </span>
                      <span className="font-bold text-primary-700">
                        {Number(w.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-earth-500">
                      {new Date(w.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setCreditTarget(w); setAmount(''); setDescription('Admin credit'); }}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        <Plus size={13} /> Credit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-earth-100 text-xs text-earth-400">
            {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Credit modal */}
      <Modal open={!!creditTarget} onClose={() => setCreditTarget(null)} title="Credit Wallet" size="sm">
        {creditTarget && (
          <form onSubmit={handleCredit} className="space-y-4">
            <div className="bg-earth-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                <WalletIcon size={16} className="text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-earth-900 text-sm">{creditTarget.user_name}</p>
                <p className="text-xs text-earth-500">
                  Current balance: {creditTarget.currency} {Number(creditTarget.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Amount ({creditTarget.currency})</label>
              <input
                type="number" step="0.01" min="1" className="input text-xl font-bold"
                placeholder="100.00" value={amount} onChange={e => setAmount(e.target.value)} required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Description</label>
              <input className="input" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setCreditTarget(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={crediting} className="btn-primary flex-1">
                {crediting ? 'Processing...' : 'Credit Wallet'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function WalletPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<'mine' | 'all'>('mine');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-earth-900">Wallet</h1>
      </div>

      {isAdmin() && (
        <div className="flex gap-1 bg-earth-100 rounded-xl p-1 w-fit">
          {[
            { key: 'mine', label: 'My Wallet' },
            { key: 'all',  label: 'All Wallets' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as 'mine' | 'all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-white text-earth-900 shadow-sm'
                  : 'text-earth-500 hover:text-earth-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === 'mine' ? <MyWalletTab /> : <AllWalletsTab />}
    </div>
  );
}
