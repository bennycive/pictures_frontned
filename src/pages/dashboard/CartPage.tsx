import { useEffect, useState } from 'react';
import { Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { cartApi, ordersApi } from '../../api';
import type { Cart } from '../../api/types';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { Spinner } from '../../components/ui/Spinner';
import { useNavigate } from 'react-router-dom';

interface CheckoutForm {
  delivery_name: string; delivery_phone: string; delivery_address: string;
  delivery_city: string; delivery_country: string; notes: string;
}

export function CartPage() {
  const { error } = useToast();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    delivery_name: '', delivery_phone: '', delivery_address: '', delivery_city: '', delivery_country: 'Tanzania', notes: ''
  });
  const [placing, setPlacing] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await cartApi.get(); setCart(data); }
    catch { error('Failed to load cart'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

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

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

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
            <button onClick={() => setCheckoutOpen(true)} className="btn-primary w-full flex items-center justify-center gap-2">
              Checkout <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Checkout modal */}
      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Checkout" size="lg">
        <form onSubmit={handleCheckout} className="space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Notes (optional)</label>
            <textarea className="input h-16 resize-none" value={checkoutForm.notes} onChange={e => setCheckoutForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCheckoutOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={placing} className="btn-primary flex-1">{placing ? 'Placing order...' : 'Place Order'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
