import { useEffect, useState } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';
import { walletApi } from '../../api';
import type { Wallet } from '../../api/types';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';

export function WalletPage() {
  const { error } = useToast();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [amount, setAmount] = useState('');
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
            <p className="text-primary-200 text-xs mt-2">Updated {wallet ? new Date(wallet.updated_at).toLocaleString() : '—'}</p>
          </div>
          <button onClick={() => setDepositOpen(true)} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors shrink-0 self-start">
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
              const Icon = txIcons[tx.type] || ArrowUpCircle;
              const color = txColors[tx.type] || 'text-gray-500';
              return (
                <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-earth-50 rounded-xl transition-colors">
                  <div className={`w-10 h-10 rounded-full bg-earth-100 flex items-center justify-center shrink-0`}>
                    <Icon size={20} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-earth-900 truncate">{tx.description}</p>
                    <p className="text-xs text-earth-400">{new Date(tx.created_at).toLocaleString()}</p>
                    {tx.reference && <p className="text-xs text-earth-300 font-mono truncate">{tx.reference}</p>}
                  </div>
                  <div className="text-right shrink-0 max-w-[140px]">
                    <p className={`font-bold text-sm break-all ${tx.type === 'deposit' || tx.type === 'refund' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'deduction' ? '−' : '+'}{wallet.currency} {Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-earth-400 break-all">Bal: {Number(tx.balance_after).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
            <input type="number" step="0.01" min="1" className="input text-2xl font-bold" placeholder="100.00" value={amount}
              onChange={e => setAmount(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Description</label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setDepositOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={depositing} className="btn-primary flex-1">{depositing ? 'Processing...' : 'Deposit'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
