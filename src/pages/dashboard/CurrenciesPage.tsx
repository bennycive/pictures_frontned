import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, DollarSign, Check } from 'lucide-react';
import { currenciesApi } from '../../api';
import type { Currency } from '../../api/types';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { swal } from '../../lib/swal';

interface CurrencyForm { code: string; symbol: string; exchange_rate: string; }
const EMPTY: CurrencyForm = { code: '', symbol: '', exchange_rate: '' };

const CODE_COLORS: Record<string, string> = {
  USD: 'bg-emerald-100 text-emerald-700',
  EUR: 'bg-blue-100 text-blue-700',
  TZS: 'bg-amber-100 text-amber-700',
  KES: 'bg-red-100 text-red-700',
  GBP: 'bg-violet-100 text-violet-700',
};
const codeColor = (code: string) => CODE_COLORS[code] ?? 'bg-earth-100 text-earth-600';

export function CurrenciesPage() {
  const { hasPermission } = useAuth();
  const { error } = useToast();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Currency | null>(null);
  const [form, setForm]             = useState<CurrencyForm>(EMPTY);
  const [saving, setSaving]         = useState(false);

  const canCreate = hasPermission('currencies.add_currency');
  const canEdit   = hasPermission('currencies.change_currency');
  const canDelete = hasPermission('currencies.delete_currency');

  const load = async () => {
    setLoading(true);
    try { const { data } = await currenciesApi.list(); setCurrencies(data.results); }
    catch { error('Failed to load currencies'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit   = (c: Currency) => { setEditing(c); setForm({ code: c.code, symbol: c.symbol, exchange_rate: c.rate }); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await currenciesApi.update(editing.uuid, form); swal.success('Currency updated!'); }
      else         { await currenciesApi.create(form); swal.success('Currency created!'); }
      setModalOpen(false);
      load();
    } catch { error('Failed to save currency'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c: Currency) => {
    const ok = await swal.confirmDelete(`Delete currency "${c.code} (${c.symbol})"?`);
    if (!ok) return;
    try { await currenciesApi.delete(c.uuid); swal.success('Currency deleted'); load(); }
    catch { error('Failed to delete currency'); }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-earth-900">Currencies</h1>
          <p className="text-sm text-earth-500 mt-0.5">{currencies.length} configured {currencies.length === 1 ? 'currency' : 'currencies'}</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Add Currency
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? <SectionSpinner /> : currencies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-earth-100 p-16 text-center">
          <div className="w-16 h-16 bg-earth-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <DollarSign size={28} className="text-earth-300" />
          </div>
          <p className="font-medium text-earth-600 mb-1">No currencies configured</p>
          <p className="text-sm text-earth-400">Add a currency to start pricing artworks</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-3 bg-earth-50 border-b border-earth-100 text-xs font-semibold text-earth-500 uppercase tracking-wide">
            <span className="w-10" />
            <span>Currency</span>
            <span className="w-20 text-center">Symbol</span>
            <span className="w-32 text-right">Rate (per USD)</span>
            {(canEdit || canDelete) && <span className="w-16 text-right">Actions</span>}
          </div>

          <div className="divide-y divide-earth-50">
            {currencies.map(c => (
              <div key={c.uuid} className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-4 hover:bg-earth-50 transition-colors group">
                {/* Code chip */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${codeColor(c.code)}`}>
                  {c.code}
                </div>

                {/* Name */}
                <div>
                  <p className="font-semibold text-earth-900">{c.code}</p>
                  <p className="text-xs text-earth-400 font-mono">{c.uuid.slice(0, 8)}…</p>
                </div>

                {/* Symbol */}
                <div className="w-20 flex justify-center">
                  <span className="text-lg font-bold text-earth-700">{c.symbol}</span>
                </div>

                {/* Rate */}
                <div className="w-32 text-right">
                  <span className="font-mono font-semibold text-earth-800 text-sm">{Number(c.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                </div>

                {/* Actions */}
                {(canEdit || canDelete) && (
                  <div className="w-16 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEdit && (
                      <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors" title="Edit">
                        <Pencil size={13} className="text-earth-500" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(c)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-earth-100 text-xs text-earth-400">
            {currencies.length} {currencies.length === 1 ? 'currency' : 'currencies'} · USD is the base currency
          </div>
        </div>
      )}

      {/* Modal with logo */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${editing.code}` : 'Add Currency'} size="sm" branded>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">Code <span className="text-red-400">*</span></label>
              <input
                className="input uppercase font-mono text-center text-lg font-bold tracking-widest"
                maxLength={3}
                placeholder="TZS"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                required
                disabled={!!editing}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">Symbol <span className="text-red-400">*</span></label>
              <input
                className="input text-center text-lg font-bold"
                placeholder="TSh"
                value={form.symbol}
                onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">Exchange Rate (per 1 USD) <span className="text-red-400">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400 text-sm font-medium">1 USD =</span>
              <input
                type="number" step="0.00000001" min="0.000001"
                className="input pl-20 font-mono"
                placeholder="2600.00"
                value={form.exchange_rate}
                onChange={e => setForm(f => ({ ...f, exchange_rate: e.target.value }))}
                required
              />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? <Spinner size="sm" /> : <Check size={15} />}
            {saving ? 'Saving…' : editing ? 'Update Currency' : 'Add Currency'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
