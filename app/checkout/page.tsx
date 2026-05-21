'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { clearAuthSession, getAuthEmail, getAuthExpiry, isAuthSessionValid } from '@/lib/auth';
import { load } from "@cashfreepayments/cashfree-js";

interface Address {
  id: string;
  name: string;
  mobile: string;
  pincode: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  addressType: 'home' | 'work';
}

type NewAddress = Omit<Address, 'id'>;

type Coupon = {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  minOrder?: number;
  discountAmount?: number;
};
// Define available coupons here





export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [step, setStep] = useState<'login' | 'address' | 'summary'>('address');
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [selectedPayment] = useState<string>('cashfree');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressError, setAddressError] = useState('');
  const [orderError, setOrderError] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const [newAddress, setNewAddress] = useState<NewAddress>({
    name: '',
    mobile: '',
    pincode: '',
    address: '',
    locality: '',
    city: '',
    state: '',
    addressType: 'home',
  });

  const deliveryCharge = totalPrice > 500 ? 0 : 40;
 const discount = appliedCoupon?.discountAmount || 0;
  const finalTotal = totalPrice + deliveryCharge - discount;

  const selectedAddressData = useMemo(
    () => savedAddresses.find((address) => String(address.id) === String(selectedAddress)) || null,
    [savedAddresses, selectedAddress],
  );

  const selectedAddressValue = selectedAddress != null ? String(selectedAddress).trim() : '';

  useEffect(() => {
    const validSession = isAuthSessionValid();
    if (!validSession) {
      clearAuthSession();
      router.replace('/auth/login?redirect=/checkout');
      return;
    }
    setIsAuthChecked(true);
    const expiry = getAuthExpiry();
    if (!expiry) return;
    const timeout = expiry - Date.now();
    if (timeout <= 0) {
      clearAuthSession();
      router.replace('/auth/login?redirect=/checkout');
      return;
    }
    const timer = window.setTimeout(() => {
      clearAuthSession();
      router.replace('/auth/login?redirect=/checkout');
    }, timeout);
    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (!isAuthChecked) return;
    const email = getAuthEmail();
    setUserEmail(email);
    const fetchAddresses = async () => {
      try {
        setAddressesLoading(true);
        setAddressError('');
        const response = await fetch('/api/addresses');
        if (!response.ok) throw new Error('Failed to load addresses.');
        const body = (await response.json()) as { addresses: Address[] };
        setSavedAddresses(body.addresses);
        if (body.addresses.length > 0) setSelectedAddress(body.addresses[0].id);
      } catch (error) {
        setAddressError(error instanceof Error ? error.message : 'Failed to load addresses.');
      } finally {
        setAddressesLoading(false);
      }
    };
    fetchAddresses();
  }, [isAuthChecked]);

const handleApplyCoupon = async () => {
  try {
    setCouponError('');
    setCouponSuccess('');

    const code = couponInput.trim().toUpperCase();

    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const response = await fetch('/api/coupons/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        cartTotal: totalPrice,
      }),
    });

    // IMPORTANT
    const text = await response.text();

    console.log("RAW RESPONSE:", text);

    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      setCouponError('Server returned HTML instead of JSON.');
      return;
    }

    if (!response.ok) {
      setCouponError(data.error || 'Failed to apply coupon.');
      return;
    }

    setAppliedCoupon({
      ...data.coupon,
      discountAmount: data.discountAmount,
    });

    setCouponSuccess(
      `Coupon applied successfully! You saved ₹${data.discountAmount}`
    );

  } catch (error) {
    console.error(error);
    setCouponError('Something went wrong while applying coupon.');
  }
};

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
    setCouponSuccess('');
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddressError('');
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message || 'Unable to save address.');
      }
      const body = (await response.json()) as { address: Address };
      setSavedAddresses((prev) => [...prev, body.address]);
      setSelectedAddress(body.address.id);
      setShowAddressForm(false);
      setStep('summary');
      setNewAddress({ name: '', mobile: '', pincode: '', address: '', locality: '', city: '', state: '', addressType: 'home' });
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : 'Unable to save address.');
    }
  };

  const handlePlaceOrder = async () => {
  if (!selectedAddressValue) return;
  if (selectedPayment === 'cashfree' && !userEmail) {
    setOrderError('Please sign in again so we can use your email for payment.');
    return;
  }
  try {
    setOrderError('');
    if (selectedPayment === 'cashfree') {
      setIsRedirectingToPayment(true);
      const response = await fetch('/api/cashfree/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          addressId: selectedAddressValue,
          paymentMethod: selectedPayment,
          total: finalTotal,
          customerEmail: userEmail,
          customerPhone: selectedAddressData?.mobile,
          couponCode: appliedCoupon?.code,
          discount,
        }),
      });

      // ✅ Read body ONCE
      const body = (await response.json()) as {
        message?: string;
        paymentLink?: string;
        paymentSessionId?: string;
        cashfreeRaw?: any;
      };

      if (!response.ok) {
        throw new Error(body.message || 'Unable to create Cashfree payment.');
      }

      if (body.paymentLink) {
        window.location.href = body.paymentLink;
        return;
      }

      if (body.paymentSessionId) {
        const cashfree = await load({
          mode:
            process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION'
              ? 'production'
              : 'sandbox',
        });
        await cashfree.checkout({
          paymentSessionId: body.paymentSessionId,
          redirectTarget: '_self',
        });
        return;
      }

      throw new Error('Cashfree did not return a payment link or session id.');
    }

    // Non-cashfree payment path
    setIsSubmittingOrder(true);
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: userEmail || undefined,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        addressId: selectedAddressValue,
        paymentMethod: selectedPayment,
        total: finalTotal,
        couponCode: appliedCoupon?.code,
        discount,
      }),
    });

    const body = (await response.json()) as { message?: string };

    if (!response.ok) {
      throw new Error(body.message || 'Unable to place order.');
    }

    clearCart();
    alert('Order placed successfully!');
    router.push('/');
  } catch (error) {
    setOrderError(error instanceof Error ? error.message : 'Unable to place order.');
  } finally {
    setIsSubmittingOrder(false);
    setIsRedirectingToPayment(false);
  }
};

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Checking account...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <svg className="w-24 h-24 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">Add items to your cart before checkout</p>
          <button onClick={() => router.push('/')} className="px-6 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <Image src="/next.svg" alt="logo" width={32} height={10} className="dark:invert" />
              <h1 className="text-xl font-semibold">Checkout</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-zinc-600 dark:text-zinc-400">100% Secure</span>
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center justify-center gap-4">
            {[
              { id: 'address', label: 'DELIVERY ADDRESS', num: 1 },
              { id: 'summary', label: 'ORDER SUMMARY', num: 2 },
            ].map((s, idx) => (
              <div key={`step-${s.id}`} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step === s.id ? 'bg-blue-600 text-white' : step === 'summary' && idx < 1 ? 'bg-green-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}>
                    {step === 'summary' && idx < 1 ? 'OK' : s.num}
                  </div>
                  <span className={`text-sm font-medium hidden sm:inline ${step === s.id ? 'text-blue-600' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < 1 && <div className="w-16 h-0.5 bg-zinc-200 dark:bg-zinc-700 mx-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">

            {/* Address section */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === 'address' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                    {step === 'address' ? '1' : 'OK'}
                  </div>
                  <div>
                    <h2 className="font-semibold">Delivery Address</h2>
                    {selectedAddressData && step !== 'address' && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {selectedAddressData.name}, {selectedAddressData.city}
                      </p>
                    )}
                  </div>
                </div>
                {step !== 'address' && (
                  <button onClick={() => setStep('address')} className="text-sm text-blue-600 font-medium hover:underline">
                    CHANGE
                  </button>
                )}
              </div>

              {step === 'address' && (
                <div className="p-4 space-y-4">
                  {addressError && (
                    <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{addressError}</p>
                  )}
                  {addressesLoading && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading addresses...</p>
                  )}
                  {savedAddresses.map((addr) => (
                    <label key={`addr-${addr.id}`} className="flex items-start gap-3 p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-blue-500">
                      <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{addr.name}</span>
                          <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-xs rounded uppercase">{addr.addressType}</span>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{addr.address}, {addr.locality}, {addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Mobile: {addr.mobile}</p>
                      </div>
                    </label>
                  ))}
                  {!showAddressForm && (
                    <button onClick={() => setShowAddressForm(true)} className="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-blue-600 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                      + Add New Address
                    </button>
                  )}
                  {showAddressForm && (
                    <form onSubmit={handleAddressSubmit} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-4">
                      <h3 className="font-semibold mb-4">Add New Address</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="text" placeholder="Name" required className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent" value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })} />
                        <input type="tel" placeholder="10-digit mobile number" required pattern="[0-9]{10}" className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent" value={newAddress.mobile} onChange={(e) => setNewAddress({ ...newAddress, mobile: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="text" placeholder="Pincode" required pattern="[0-9]{6}" className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                        <input type="text" placeholder="Locality" required className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent" value={newAddress.locality} onChange={(e) => setNewAddress({ ...newAddress, locality: e.target.value })} />
                      </div>
                      <textarea placeholder="Address (House No, Building, Street, Area)" required rows={3} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent" value={newAddress.address} onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="text" placeholder="City/District" required className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                        <input type="text" placeholder="State" required className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Address Type</p>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input type="radio" name="addressType" value="home" checked={newAddress.addressType === 'home'} onChange={() => setNewAddress({ ...newAddress, addressType: 'home' })} />
                            <span className="text-sm">Home</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="radio" name="addressType" value="work" checked={newAddress.addressType === 'work'} onChange={() => setNewAddress({ ...newAddress, addressType: 'work' })} />
                            <span className="text-sm">Work</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Save Address</button>
                        <button type="button" onClick={() => setShowAddressForm(false)} className="px-6 py-2 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
                      </div>
                    </form>
                  )}
                  {selectedAddress !== null && !showAddressForm && (
                    <button onClick={() => setStep('summary')} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                      DELIVER HERE
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Order summary section */}
            {step === 'summary' && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-blue-600 text-white">2</div>
                  <h2 className="font-semibold">Order Summary</h2>
                </div>
                <div className="p-4 space-y-4">
                  {/* Items */}
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={`item-${item.id}`} className="flex gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                        <div className="w-20 h-20 rounded bg-zinc-100 dark:bg-zinc-800 shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Qty: {item.quantity}</p>
                          <p className="font-semibold mt-2">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon section */}
                  <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <p className="text-sm font-semibold">Apply Coupon</p>
                    </div>

                    {appliedCoupon ? (
                      <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                              {appliedCoupon.code}
                            </p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">{couponSuccess}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            setCouponError('');
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal dark:border-zinc-700"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    {couponError && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {couponError}
                      </p>
                    )}

                    {/* Available coupons hint */}
                   
                  </div>

                  {/* Place order button */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={!selectedAddressValue || isSubmittingOrder || isRedirectingToPayment}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRedirectingToPayment ? 'REDIRECTING TO PAYMENT...' : isSubmittingOrder ? 'PLACING ORDER...' : 'PLACE ORDER'}
                  </button>

                  {orderError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{orderError}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Price details sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-4 sticky top-24">
              <h3 className="font-semibold mb-3">Price Details</h3>
              <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Items ({totalItems})</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>{deliveryCharge === 0 ? <span className="text-emerald-600 font-medium">FREE</span> : `₹${deliveryCharge.toFixed(2)}`}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>− ₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 mt-2 flex justify-between font-semibold text-base text-zinc-900 dark:text-white">
                  <span>Total</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    You save ₹{discount.toFixed(2)} on this order!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}