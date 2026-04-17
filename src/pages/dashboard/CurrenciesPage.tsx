import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { currenciesApi } from '../../api';
import type { Currency } from '../../api/types';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { swal } from '../../lib/swal';

interface CurrencyForm { code: string; symbol: string; exchange_rate: string; }

export function CurrenciesPage() {
  const { hasPermission } = useAuth();
  const { error } = useToast();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [form, setForm] = useState<CurrencyForm>({ code: '', symbol: '', exchange_rate: '' });
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission('currencies.add_currency');
  const canEdit = hasPermission('currencies.change_currency');
  const canDelete = hasPermission('currencies.delete_currency');

  const load = async () => {
    setLoading(true);
    try { const { data } = await currenciesApi.list(); setCurrencies(data.results); }
    catch { error('Failed to load currencies'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ code: '', symbol: '', exchange_rate: '' }); setModalOpen(true); };
  const openEdit = (c: Currency) => { setEditing(c); setForm({ code: c.code, symbol: c.symbol, exchange_rate: c.rate }); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await currenciesApi.update(editing.uuid, form); swal.success('Currency updated!'); }
      else { await currenciesApi.create(form); swal.success('Currency created!'); }
      setModalOpen(false); load();
    } catch { error('Failed to save currency'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c: Currency) => {
    const ok = await swal.confirmDelete(`Delete currency "${c.code} (${c.symbol})"?`);
    if (!ok) return;
    try { await currenciesApi.delete(c.uuid); swal.success('Currency deleted'); load(); }
    catch { error('Failed to delete currency'); }
  };

  const columns = [
    { key: 'code', header: 'Code', render: (c: Currency) => <span className="font-mono font-bold text-earth-900">{c.code}</span> },
    { key: 'symbol', header: 'Symbol', render: (c: Currency) => <span className="font-medium">{c.symbol}</span> },
    { key: 'rate', header: 'Rate (per USD)', render: (c: Currency) => <span>{c.rate}</span> },
    { key: 'actions', header: 'Actions', render: (c: Currency) => (
      <div className="flex gap-2">
        {canEdit && <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-earth-100 rounded-lg"><Pencil size={15} className="text-earth-600" /></button>}
        {canDelete && <button onClick={() => handleDelete(c)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={15} className="text-red-500" /></button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-earth-900">Currencies</h1>
        {canCreate && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Currency
          </button>
        )}
      </div>
      {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
        <Table columns={columns} data={currencies} keyField="uuid" />
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Currency' : 'Add Currency'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Code (e.g. TZS)</label>
              <input className="input uppercase" maxLength={3} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Symbol</label>
              <input className="input" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Exchange Rate (per USD)</label>
            <input type="number" step="0.00000001" className="input" placeholder="2600.00" value={form.exchange_rate} onChange={e => setForm(f => ({ ...f, exchange_rate: e.target.value }))} required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
