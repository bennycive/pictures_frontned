import { useEffect, useState } from 'react';
import { Trash2, ShoppingCart, ArrowRight, MapPin, ChevronDown } from 'lucide-react';
import { cartApi, ordersApi, addressesApi } from '../../api';
import type { Cart, Address } from '../../api/types';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';
import { useNavigate } from 'react-router-dom';

interface CheckoutForm {
  delivery_name: string; delivery_phone: string; delivery_address: string;
  delivery_city: string; delivery_country: string; notes: string;
}

const BLANK: CheckoutForm = {
  delivery_name: '', delivery_phone: '', delivery_address: '',
  delivery_city: '', delivery_country: 'Tanzania', notes: '',
};

export function CartPage() {
  const { error } = useToast();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>(BLANK);
  const [placing, setPlacing] = useState(false);

  // saved addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<number | 'manual'>('manual');

  const load = async () => {
    setLoading(true);
    try { const { data } = await cartApi.get(); setCart(data); }
    catch { error('Failed to load cart'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openCheckout = async () => {
    try {
      const { data } = await addressesApi.list();
      setAddresses(data);
      const def = data.find(a => a.is_default) ?? data[0] ?? null;
      if (def) {
        setSelectedAddrId(def.id);
        setCheckoutForm(f => ({
          ...f,
          delivery_name: def.full_name,
          delivery_phone: def.phone,
          delivery_address: def.address,
          delivery_city: def.city,
          delivery_country: def.country,
        }));
      } else {
        setSelectedAddrId('manual');
        setCheckoutForm(BLANK);
      }
    } catch {
      setAddresses([]);
      setSelectedAddrId('manual');
      setCheckoutForm(BLANK);
    }
    setCheckoutOpen(true);
  };

  const handleSelectAddress = (id: number | 'manual') => {
    setSelectedAddrId(id);
    if (id === 'manual') {
      setCheckoutForm(BLANK);
      return;
    }
    const addr = addresses.find(a => a.id === id);
    if (addr) {
      setCheckoutForm(f => ({
        ...f,
        delivery_name: addr.full_name,
        delivery_phone: addr.phone,
        delivery_address: addr.address,
        delivery_city: addr.city,
        delivery_country: addr.country,
      }));
    }
  };

  const handleRemove = async (uuid: string, name: string) => {
    const ok = await swal.confirmDelete(`"${name}" will be removed from your cart.`);
    if (!ok) return;
    try { await cartApi.removeItem(uuid); swal.success('Item removed'); load(); }
    catch { error('Failed to remove item'); }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    try {
      await ordersApi.checkout(checkoutForm as unknown as Record<string, unknown>);
      swal.success('Order placed successfully!');
      setCheckoutOpen(false);
      navigate('/dashboard/orders');
    } catch { error('Checkout failed. Please try again.'); }
    finally { setPlacing(false); }
  };

  if (loading) return <SectionSpinner />;

  const items = cart?.items || [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-earth-900">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-earth-100 p-12 text-center">
          <ShoppingCart size={48} className="text-earth-200 mx-auto mb-4" />
          <h3 className="font-semibold text-earth-700 mb-2">Your cart is empty</h3>
          <p className="text-earth-400 text-sm mb-6">Browse artworks and add them to your cart</p>
          <a href="/artworks" className="btn-primary inline-flex">Browse Artworks</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => (
              <div key={item.uuid} className="bg-white rounded-xl border border-earth-100 p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-earth-100 rounded-lg overflow-hidden shrink-0">
                  {item.artwork_image && <img src={item.artwork_image} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-earth-900 truncate">{item.artwork_name}</p>
                  <p className="text-xs text-earth-500 mt-0.5 capitalize">{item.source.replace('_', ' ')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-primary-700">{item.currency} {item.price}</p>
                  <button onClick={() => handleRemove(item.uuid, item.artwork_name)} className="mt-1 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-earth-100 p-6 h-fit space-y-4">
            <h3 className="font-semibold text-earth-900">Order Summary</h3>
            <div className="space-y-2 text-sm">
              {items.map(item => (
                <div key={item.uuid} className="flex justify-between text-earth-600">
                  <span className="truncate max-w-[150px]">{item.artwork_name}</span>
                  <span>{item.currency} {item.price}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-earth-100 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary-700">{cart?.total}</span>
            </div>
            <button onClick={openCheckout} className="btn-primary w-full flex items-center justify-center gap-2">
              Checkout <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Checkout modal */}
      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Checkout" size="lg">
        <form onSubmit={handleCheckout} className="space-y-4">

          {/* Saved address picker */}
          {addresses.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2 flex items-center gap-1.5">
                <MapPin size={14} className="text-primary-500" /> Delivery Address
              </label>
              <div className="space-y-2">
                {addresses.map(addr => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedAddrId === addr.id
                        ? 'border-primary-400 bg-primary-50/40'
                        : 'border-earth-100 hover:border-earth-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="addr"
                      className="mt-1 accent-primary-600"
                      checked={selectedAddrId === addr.id}
                      onChange={() => handleSelectAddress(addr.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {addr.label && <span className="text-xs font-bold text-earth-500 uppercase">{addr.label}</span>}
                        {addr.is_default && <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">Default</span>}
                      </div>
                      <p className="text-sm font-semibold text-earth-800">{addr.full_name}</p>
                      <p className="text-xs text-earth-500">{addr.address}, {addr.city}, {addr.country}</p>
                      {addr.phone && <p className="text-xs text-earth-400">{addr.phone}</p>}
                    </div>
                  </label>
                ))}
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedAddrId === 'manual'
                      ? 'border-primary-400 bg-primary-50/40'
                      : 'border-earth-100 hover:border-earth-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="addr"
                    className="accent-primary-600"
                    checked={selectedAddrId === 'manual'}
                    onChange={() => handleSelectAddress('manual')}
                  />
                  <span className="text-sm text-earth-600 flex items-center gap-1.5">
                    <ChevronDown size={14} /> Enter a different address
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Manual form — shown when no saved addresses or "different address" selected */}
          {(addresses.length === 0 || selectedAddrId === 'manual') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Full Name</label>
                  <input className="input" value={checkoutForm.delivery_name} onChange={e => setCheckoutForm(f => ({ ...f, delivery_name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Phone</label>
                  <input className="input" value={checkoutForm.delivery_phone} onChange={e => setCheckoutForm(f => ({ ...f, delivery_phone: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Address</label>
                <textarea className="input h-20 resize-none" value={checkoutForm.delivery_address} onChange={e => setCheckoutForm(f => ({ ...f, delivery_address: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">City</label>
                  <input className="input" value={checkoutForm.delivery_city} onChange={e => setCheckoutForm(f => ({ ...f, delivery_city: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Country</label>
                  <input className="input" value={checkoutForm.delivery_country} onChange={e => setCheckoutForm(f => ({ ...f, delivery_country: e.target.value }))} />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Notes (optional)</label>
            <textarea className="input h-16 resize-none" value={checkoutForm.notes} onChange={e => setCheckoutForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCheckoutOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={placing} className="btn-primary flex-1">
              {placing ? <Spinner size="sm" /> : null}
              {placing ? 'Placing order…' : 'Place Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
