import React, { useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import {
  BD_DIVISIONS,
  BdDivision,
  CartItem,
  Language,
  Order,
  UserProfile,
} from '../types';
import { BD_DISTRICTS_BY_DIVISION } from '../data/sampleProducts';
import {
  buildWhatsAppOrderUrl,
  calculateDeliveryFee,
  formatBDT,
} from '../utils/formatters';
import { createOrder } from '../services/storeService';
import { SafeImage } from './SafeImage';

interface CheckoutPageProps {
  items: CartItem[];
  lang: Language;
  user: FirebaseUser | null;
  profile: UserProfile | null;
  onBackToStore: () => void;
  onOrderConfirmed: (order: Order) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  lang,
  user,
  profile,
  onBackToStore,
  onOrderConfirmed,
}) => {
  const [customerName, setCustomerName] = useState(
    profile?.displayName || user?.displayName || ''
  );
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [division, setDivision] = useState<BdDivision>(
    (BD_DIVISIONS.includes(profile?.division as BdDivision)
      ? profile?.division
      : 'Dhaka') as BdDivision
  );
  const [district, setDistrict] = useState(
    profile?.district || BD_DISTRICTS_BY_DIVISION['Dhaka'][0]
  );
  const [address, setAddress] = useState(profile?.address || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (profile) {
      if (!customerName && profile.displayName) setCustomerName(profile.displayName);
      if (!phone && profile.phone) setPhone(profile.phone);
      if (!email && profile.email) setEmail(profile.email);
      if (!address && profile.address) setAddress(profile.address);
    }
  }, [profile]);

  const handleDivisionChange = (newDiv: BdDivision) => {
    setDivision(newDiv);
    const districts = BD_DISTRICTS_BY_DIVISION[newDiv];
    if (districts && districts.length > 0) {
      setDistrict(districts[0]);
    }
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.discountedPrice * item.quantity,
    0
  );
  const deliveryFee = calculateDeliveryFee(subtotal, division);
  const total = subtotal + deliveryFee;

  const whatsappUrl = buildWhatsAppOrderUrl(items, {
    customerName,
    phone,
    division,
    district,
    address,
    total,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (items.length === 0) {
      setErrorMsg('Your cart is empty. Please add a product first.');
      return;
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!/^(\+?88)?01[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMsg(
        lang === 'bn'
          ? 'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01711000000)।'
          : 'Please enter a valid 11-digit Bangladesh mobile number (e.g. 01711000000).'
      );
      return;
    }

    if (customerName.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (address.trim().length < 5) {
      setErrorMsg('Please provide your complete house, road, and area address.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        userId: user?.emailVerified ? user.uid : 'guest',
        customerName: customerName.trim(),
        phone: cleanPhone,
        email: email.trim(),
        division,
        district: district.trim() || division,
        address: address.trim(),
        notes: notes.trim(),
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.discountedPrice,
          quantity: item.quantity,
          imageUrl: item.product.imageUrl,
        })),
        subtotal,
        deliveryFee,
      });
      onOrderConfirmed(order);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message.startsWith('{')
            ? 'Could not place order due to validation or permission rules. Please check your details.'
            : err.message
          : 'Failed to place order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-zinc-950 mb-3">
          {lang === 'bn' ? 'চেকআউটের জন্য কার্টে পণ্য নেই' : 'No items in your cart'}
        </h1>
        <p className="text-sm text-zinc-600 mb-6">
          Add mobile accessories to your cart before proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={onBackToStore}
          className="px-6 py-3 rounded-lg bg-[#0066FF] text-white text-sm font-semibold hover:bg-[#0052CC] transition-colors cursor-pointer"
        >
          {lang === 'bn' ? 'স্টোরে ফিরে যান' : 'Return to Store'}
        </button>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <button
        type="button"
        onClick={onBackToStore}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-950 mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        {lang === 'bn' ? 'শপিং-এ ফিরে যান' : 'Back to Store'}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Customer & Bangladesh Delivery Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 space-y-8"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-zinc-950 mb-1">
              {lang === 'bn' ? 'ডেলিভারি তথ্য ও চেকআউট' : 'Delivery Information & Checkout'}
            </h1>
            <p className="text-sm text-zinc-500">
              {lang === 'bn'
                ? 'সারা বাংলাদেশে দ্রুত ক্যাশ অন ডেলিভারি (COD) সুবিধা।'
                : 'Fast nationwide Cash on Delivery across all 64 districts of Bangladesh.'}
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 font-medium"
            >
              {errorMsg}
            </div>
          )}

          {/* Customer Contact */}
          <div className="space-y-4">
            <h2 className="font-display text-base font-semibold text-zinc-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0066FF]" />
              {lang === 'bn' ? '১. ক্রেতার তথ্য' : '1. Customer Details'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  {lang === 'bn' ? 'পূর্ণ নাম *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Tahmidul Islam"
                  className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm text-zinc-950 focus:outline-none focus:border-[#0066FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  {lang === 'bn' ? 'মোবাইল নম্বর (বাংলাদেশ) *' : 'Bangladesh Mobile Number *'}
                </label>
                <input
                  type="tel"
                  required
                  maxLength={16}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01711000000"
                  className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm font-mono text-zinc-950 focus:outline-none focus:border-[#0066FF]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                {lang === 'bn' ? 'ইমেইল (ঐচ্ছিক)' : 'Email Address (Optional for tracking updates)'}
              </label>
              <input
                type="email"
                maxLength={120}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm text-zinc-950 focus:outline-none focus:border-[#0066FF]"
              />
            </div>
          </div>

          {/* Bangladesh Address */}
          <div className="space-y-4 pt-6 border-t border-zinc-200">
            <h2 className="font-display text-base font-semibold text-zinc-950 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0066FF]" />
              {lang === 'bn' ? '২. ডেলিভারি ঠিকানা (বাংলাদেশ)' : '2. Bangladesh Delivery Address'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  {lang === 'bn' ? 'বিভাগ *' : 'Division *'}
                </label>
                <select
                  value={division}
                  onChange={(e) => handleDivisionChange(e.target.value as BdDivision)}
                  className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm text-zinc-950 bg-white focus:outline-none focus:border-[#0066FF]"
                >
                  {BD_DIVISIONS.map((div) => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  {lang === 'bn' ? 'জেলা / শহর *' : 'District / City *'}
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm text-zinc-950 bg-white focus:outline-none focus:border-[#0066FF]"
                >
                  {BD_DISTRICTS_BY_DIVISION[division].map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                {lang === 'bn'
                  ? 'বিস্তারিত ঠিকানা (বাসা, রোড, এলাকা / থানা) *'
                  : 'Full Street Address (House, Road, Area / Thana) *'}
              </label>
              <textarea
                required
                rows={2}
                maxLength={250}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. House 14, Road 6, Block C, Banani, Dhaka"
                className="w-full p-3.5 rounded-lg border border-zinc-300 text-sm text-zinc-950 focus:outline-none focus:border-[#0066FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                {lang === 'bn' ? 'ডেলিভারি নির্দেশনা (ঐচ্ছিক)' : 'Delivery Note (Optional)'}
              </label>
              <input
                type="text"
                maxLength={300}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Call before arrival, deliver after 3 PM"
                className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm text-zinc-950 focus:outline-none focus:border-[#0066FF]"
              />
            </div>
          </div>

          {/* Payment Method: Cash on Delivery */}
          <div className="space-y-3 pt-6 border-t border-zinc-200">
            <h2 className="font-display text-base font-semibold text-zinc-950 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-[#0066FF]" />
              {lang === 'bn' ? '৩. পেমেন্ট পদ্ধতি' : '3. Payment Method'}
            </h2>
            <div className="p-4 rounded-xl border-2 border-[#0066FF] bg-blue-50/40 flex items-start gap-3">
              <input
                type="radio"
                checked
                readOnly
                id="cod-method"
                className="mt-1 accent-[#0066FF]"
              />
              <label htmlFor="cod-method" className="cursor-pointer">
                <span className="block text-sm font-bold text-zinc-950">
                  {lang === 'bn' ? 'ক্যাশ অন ডেলিভারি (COD)' : 'Cash on Delivery (COD)'}
                </span>
                <span className="block text-xs text-zinc-600 mt-0.5">
                  {lang === 'bn'
                    ? 'পণ্য হাতে পেয়ে যাচাই করে টাকা পরিশোধ করুন। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।'
                    : 'Inspect your sealed package at your doorstep and pay in cash upon delivery.'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-12 px-6 rounded-lg bg-[#0066FF] text-white text-sm font-bold hover:bg-[#0052CC] transition-colors cursor-pointer disabled:opacity-60"
            >
              {submitting
                ? lang === 'bn'
                  ? 'অর্ডার কনফার্ম হচ্ছে...'
                  : 'Confirming Order...'
                : lang === 'bn'
                  ? `অর্ডার কনফার্ম করুন (${formatBDT(total)})`
                  : `Confirm Order (${formatBDT(total)})`}
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-5 rounded-lg border border-zinc-300 text-zinc-900 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:border-emerald-600 hover:text-emerald-700 transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              {lang === 'bn' ? 'হোয়াটসঅ্যাপ অর্ডার' : 'Order via WhatsApp'}
            </a>
          </div>
        </form>

        {/* Order Summary Sticky Sidebar */}
        <aside className="lg:col-span-5 bg-zinc-50 border border-zinc-200 rounded-2xl p-6 sm:p-8 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold text-zinc-950 mb-5">
            {lang === 'bn' ? 'অর্ডার সামারি' : 'Order Summary'}
          </h2>

          <div className="divide-y divide-zinc-200 mb-6">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="py-3.5 flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-lg bg-white border border-zinc-200 overflow-hidden shrink-0">
                  <SafeImage
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-950 truncate">
                    {lang === 'bn' && product.nameBn ? product.nameBn : product.name}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
                    {quantity} × {formatBDT(product.discountedPrice)}
                  </p>
                </div>
                <span className="font-mono text-sm font-bold text-zinc-950 tabular-nums shrink-0">
                  {formatBDT(product.discountedPrice * quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-200 text-sm">
            <div className="flex items-center justify-between text-zinc-600">
              <span>{lang === 'bn' ? 'সাবটোটাল' : 'Subtotal'}</span>
              <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                {formatBDT(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span>
                {lang === 'bn' ? 'ডেলিভারি চার্জ' : 'Delivery Fee'} ({division})
              </span>
              <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                {deliveryFee === 0 ? 'Free' : formatBDT(deliveryFee)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-zinc-200 text-base font-bold text-zinc-950">
              <span>{lang === 'bn' ? 'সর্বমোট (COD)' : 'Total Payable (COD)'}</span>
              <span className="font-mono text-xl text-[#0066FF] tabular-nums">
                {formatBDT(total)}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-zinc-200 space-y-2.5 text-xs text-zinc-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#0066FF] shrink-0" />
              <span>
                {division === 'Dhaka'
                  ? 'Estimated delivery: 24–48 hours inside Dhaka'
                  : `Estimated delivery: 2–4 business days to ${district}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0066FF] shrink-0" />
              <span>100% genuine accessories with 7-day replacement guarantee</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
