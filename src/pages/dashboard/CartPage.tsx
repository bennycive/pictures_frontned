import { useEffect, useState } from 'react';
import { Trash2, ShoppingCart, ArrowRight, MapPin, ChevronDown, Building2, CreditCard, Smartphone, CheckCircle, Upload, ExternalLink } from 'lucide-react';
import { cartApi, ordersApi, addressesApi, paymentsApi } from '../../api';
import type { Cart, Address, PaymentMethod, InitiatePaymentResponse } from '../../api/types';
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

const CHANNEL_ICON: Record<string, React.ElementType> = {
  bank_transfer: Building2,
  stripe: CreditCard,
  selcom: Smartphone,
};

export function CartPage() {
  const { error, success } = useToast();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>(BLANK);
  const [placing, setPlacing] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<number | 'manual'>('manual');

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');

  // Post-checkout payment state
  const [paymentData, setPaymentData] = useState<InitiatePaymentResponse | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [bankRef, setBankRef] = useState('');
  const [bankProof, setBankProof] = useState<File | null>(null);
  const [submittingRef, setSubmittingRef] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await cartApi.get(); setCart(data); }
    catch { error('Failed to load cart'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openCheckout = async () => {
    try {
      const [addrRes, methodsRes] = await Promise.all([
        addressesApi.list(),
        paymentsApi.getMethods(),
      ]);
      setAddresses(addrRes.data);
      setPaymentMethods(methodsRes.data);
      if (methodsRes.data.length > 0) setSelectedChannel(methodsRes.data[0].channel);

      const def = addrRes.data.find(a => a.is_default) ?? addrRes.data[0] ?? null;
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
      setPaymentMethods([]);
      setSelectedAddrId('manual');
      setCheckoutForm(BLANK);
    }
    setCheckoutOpen(true);
  };

  const handleSelectAddress = (id: number | 'manual') => {
    setSelectedAddrId(id);
    if (id === 'manual') { setCheckoutForm(BLANK); return; }
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
    if (!selectedChannel) { error('Please select a payment method.'); return; }
    setPlacing(true);
    try {
      const { data: order } = await ordersApi.checkout(checkoutForm as unknown as Record<string, unknown>);
      setCheckoutOpen(false);

      // Initiate payment
      const { data: payment } = await paymentsApi.initiate({
        order_uuid: order.uuid,
        channel: selectedChannel,
      });
      setPaymentData(payment);
      setBankRef('');
      setBankProof(null);
      setPaymentOpen(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      error(msg || 'Checkout failed. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData || !bankRef.trim()) return;
    setSubmittingRef(true);
    try {
      const fd = new FormData();
      fd.append('transaction_id', String(paymentData.transaction_id));
      fd.append('reference', bankRef.trim());
      if (bankProof) fd.append('proof_image', bankProof);
      await paymentsApi.submitBankTransfer(fd);
      success('Reference submitted! Admin will verify and confirm your payment.');
      setPaymentOpen(false);
      navigate('/dashboard/orders');
    } catch {
      error('Failed to submit reference. Please try again.');
    } finally {
      setSubmittingRef(false);
    }
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
        <form onSubmit={handleCheckout} className="space-y-5">

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
                      selectedAddrId === addr.id ? 'border-primary-400 bg-primary-50/40' : 'border-earth-100 hover:border-earth-300'
                    }`}
                  >
                    <input type="radio" name="addr" className="mt-1 accent-primary-600" checked={selectedAddrId === addr.id} onChange={() => handleSelectAddress(addr.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {addr.label && <span className="text-xs font-bold text-earth-500 uppercase">{addr.label}</span>}
                        {addr.is_default && <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">Default</span>}
                      </div>
                      <p className="text-sm font-semibold text-earth-800">{addr.full_name}</p>
                      <p className="text-xs text-earth-500">{addr.address}, {addr.city}, {addr.country}</p>
                    </div>
                  </label>
                ))}
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedAddrId === 'manual' ? 'border-primary-400 bg-primary-50/40' : 'border-earth-100 hover:border-earth-300'}`}>
                  <input type="radio" name="addr" className="accent-primary-600" checked={selectedAddrId === 'manual'} onChange={() => handleSelectAddress('manual')} />
                  <span className="text-sm text-earth-600 flex items-center gap-1.5"><ChevronDown size={14} /> Enter a different address</span>
                </label>
              </div>
            </div>
          )}

          {/* Manual delivery form */}
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

          {/* Payment method picker */}
          {paymentMethods.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-1 gap-2">
                {paymentMethods.map(m => {
                  const Icon = CHANNEL_ICON[m.channel] ?? CreditCard;
                  const active = selectedChannel === m.channel;
                  return (
                    <label
                      key={m.channel}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        active ? 'border-primary-400 bg-primary-50/40' : 'border-earth-100 hover:border-earth-200'
                      }`}
                    >
                      <input type="radio" name="channel" className="accent-primary-600" checked={active} onChange={() => setSelectedChannel(m.channel)} />
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-primary-100' : 'bg-earth-100'}`}>
                        <Icon size={16} className={active ? 'text-primary-600' : 'text-earth-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-earth-800">{m.display_name}</p>
                        {m.description && <p className="text-xs text-earth-400 truncate">{m.description}</p>}
                      </div>
                      {active && <CheckCircle size={16} className="text-primary-500 shrink-0" />}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setCheckoutOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={placing} className="btn-primary flex-1">
              {placing ? <Spinner size="sm" /> : null}
              {placing ? 'Placing order…' : 'Place Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment instructions modal */}
      {paymentData && (
        <Modal open={paymentOpen} onClose={() => { setPaymentOpen(false); navigate('/dashboard/orders'); }} title="Complete Your Payment" size="md">
          <div className="space-y-4">
            <div className="bg-earth-50 rounded-xl p-4 text-sm text-earth-700">
              <p className="font-semibold text-earth-900 mb-1">Order Amount</p>
              <p className="text-2xl font-bold text-primary-700">{paymentData.currency} {paymentData.amount}</p>
            </div>

            {/* Bank Transfer */}
            {paymentData.channel === 'bank_transfer' && paymentData.bank_details && (
              <>
                <div className="bg-white border border-earth-100 rounded-xl p-4 space-y-2 text-sm">
                  <p className="font-semibold text-earth-800 mb-2 flex items-center gap-2">
                    <Building2 size={16} className="text-primary-500" /> Bank Transfer Details
                  </p>
                  {Object.entries(paymentData.bank_details).map(([k, v]) => v ? (
                    <div key={k} className="flex justify-between gap-2">
                      <span className="text-earth-500 capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-earth-800 text-right">{v}</span>
                    </div>
                  ) : null)}
                </div>

                <form onSubmit={handleBankSubmit} className="space-y-3">
                  <p className="text-sm font-medium text-earth-700">After making the transfer, submit your reference number below:</p>
                  <div>
                    <label className="block text-xs font-medium text-earth-600 mb-1">Transfer Reference / Transaction ID</label>
                    <input
                      className="input"
                      placeholder="e.g. TXN123456789"
                      value={bankRef}
                      onChange={e => setBankRef(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-earth-600 mb-1">Proof of Payment (optional)</label>
                    <label className="flex items-center gap-2 p-3 border border-dashed border-earth-200 rounded-xl cursor-pointer hover:border-primary-300 transition-colors">
                      <Upload size={16} className="text-earth-400" />
                      <span className="text-sm text-earth-500">{bankProof ? bankProof.name : 'Upload receipt / screenshot'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => setBankProof(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setPaymentOpen(false); navigate('/dashboard/orders'); }} className="btn-secondary flex-1">
                      I'll submit later
                    </button>
                    <button type="submit" disabled={submittingRef} className="btn-primary flex-1">
                      {submittingRef ? <Spinner size="sm" /> : null}
                      {submittingRef ? 'Submitting…' : 'Submit Reference'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Stripe */}
            {paymentData.channel === 'stripe' && (
              <div className="text-center py-4 space-y-3">
                <CreditCard size={40} className="text-primary-400 mx-auto" />
                <p className="text-sm text-earth-600">You will be redirected to Stripe's secure payment page to complete your payment.</p>
                <p className="text-xs text-earth-400">Transaction ID: {paymentData.transaction_id}</p>
                <button
                  onClick={() => { setPaymentOpen(false); navigate('/dashboard/orders'); }}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} /> Continue to Stripe
                </button>
              </div>
            )}

            {/* Selcom */}
            {paymentData.channel === 'selcom' && (
              <div className="text-center py-4 space-y-3">
                <Smartphone size={40} className="text-primary-400 mx-auto" />
                <p className="text-sm text-earth-600">You will be redirected to Selcom's mobile money payment page.</p>
                {paymentData.payment_url && (
                  <a
                    href={paymentData.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={16} /> Pay with Selcom
                  </a>
                )}
                <button onClick={() => { setPaymentOpen(false); navigate('/dashboard/orders'); }} className="btn-secondary w-full">
                  I'll pay later
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
