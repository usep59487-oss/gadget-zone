import React, { useEffect, useState } from 'react';
import { signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  ArrowLeft,
  Check,
  LogIn,
  LogOut,
  Package,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import {
  BD_DIVISIONS,
  BdDivision,
  Language,
  Order,
  UserProfile,
} from '../types';
import { BD_DISTRICTS_BY_DIVISION } from '../data/sampleProducts';
import {
  saveUserProfile,
  subscribeToUserOrders,
  updateOrderStatus,
} from '../services/storeService';
import { formatBDT } from '../utils/formatters';

interface AccountPageProps {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  lang: Language;
  onProfileSaved: (profile: UserProfile) => void;
  onBackToStore: () => void;
  onOpenAdmin: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  user,
  profile,
  isAdmin,
  lang,
  onProfileSaved,
  onBackToStore,
  onOpenAdmin,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [authError, setAuthError] = useState('');
  const [displayName, setDisplayName] = useState(
    profile?.displayName || user?.displayName || ''
  );
  const [phone, setPhone] = useState(profile?.phone || '');
  const [division, setDivision] = useState<BdDivision>(
    (BD_DIVISIONS.includes(profile?.division as BdDivision)
      ? profile?.division
      : 'Dhaka') as BdDivision
  );
  const [district, setDistrict] = useState(
    profile?.district || BD_DISTRICTS_BY_DIVISION['Dhaka'][0]
  );
  const [address, setAddress] = useState(profile?.address || '');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user?.displayName || '');
      setPhone(profile.phone || '');
      if (BD_DIVISIONS.includes(profile.division as BdDivision)) {
        setDivision(profile.division as BdDivision);
      }
      setDistrict(profile.district || 'Dhaka');
      setAddress(profile.address || '');
    } else if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [profile, user]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    const unsub = subscribeToUserOrders(
      user.uid,
      (list) => setOrders(list),
      () => setOrders([])
    );
    return () => unsub();
  }, [user]);

  const handleSignIn = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Unable to sign in with Google.'
      );
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSavedNotice(false);
    try {
      const nextProfile: UserProfile = {
        uid: user.uid,
        displayName: displayName.trim() || user.displayName || 'Customer',
        email: user.email || '',
        phone: phone.trim(),
        division,
        district,
        address: address.trim(),
      };
      await saveUserProfile(nextProfile);
      onProfileSaved(nextProfile);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <button
        type="button"
        onClick={onBackToStore}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-950 mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        {lang === 'bn' ? 'স্টোরে ফিরে যান' : 'Back to Store'}
      </button>

      {!user ? (
        <div className="max-w-lg mx-auto bg-white border border-zinc-200 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center mx-auto mb-5">
            <UserIcon className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-zinc-950 mb-2">
            {lang === 'bn' ? 'আপনার অ্যাকাউন্ট' : 'Sign in to Gadget Zone'}
          </h1>
          <p className="text-sm text-zinc-600 leading-relaxed mb-6">
            Sign in with Google to track your Cash on Delivery orders, save your Bangladesh
            delivery address, or manage the store as an administrator.
          </p>
          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {authError}
            </div>
          )}
          <button
            type="button"
            onClick={handleSignIn}
            className="w-full h-11 px-6 rounded-lg bg-[#0066FF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#0052CC] transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Continue with Google
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Account Banner */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover border border-zinc-200"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-lg">
                  {(user.displayName || 'U')[0]}
                </div>
              )}
              <div>
                <h1 className="font-display text-xl font-bold text-zinc-950">
                  {user.displayName || 'Gadget Zone Customer'}
                </h1>
                <p className="text-sm text-zinc-500">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="h-10 px-4 rounded-lg bg-zinc-950 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#0066FF] transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Open Admin Dashboard
                </button>
              )}
              <button
                type="button"
                onClick={() => signOut(auth)}
                className="h-10 px-4 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 inline-flex items-center gap-2 hover:border-zinc-950 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Saved Address Form */}
            <form
              onSubmit={handleSaveProfile}
              className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 h-fit"
            >
              <h2 className="font-display text-lg font-bold text-zinc-950">
                Saved Bangladesh Delivery Profile
              </h2>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01711000000"
                  className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm font-mono focus:outline-none focus:border-[#0066FF]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Division
                  </label>
                  <select
                    value={division}
                    onChange={(e) => {
                      const next = e.target.value as BdDivision;
                      setDivision(next);
                      setDistrict(BD_DISTRICTS_BY_DIVISION[next][0]);
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm bg-white focus:outline-none focus:border-[#0066FF]"
                  >
                    {BD_DIVISIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm bg-white focus:outline-none focus:border-[#0066FF]"
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
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Full Address
                </label>
                <textarea
                  rows={2}
                  maxLength={250}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House, Road, Area"
                  className="w-full p-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full h-10 rounded-lg bg-[#0066FF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#0052CC] transition-colors cursor-pointer disabled:opacity-60"
              >
                {savedNotice ? (
                  <>
                    <Check className="w-4 h-4" />
                    Profile Saved
                  </>
                ) : saving ? (
                  'Saving...'
                ) : (
                  'Save Delivery Details'
                )}
              </button>
            </form>

            {/* User Orders */}
            <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6">
              <h2 className="font-display text-lg font-bold text-zinc-950 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#0066FF]" />
                Your Orders ({orders.length})
              </h2>

              {orders.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-500">
                  You have not placed any orders yet while signed in.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="border border-zinc-200 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-100">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-mono font-bold text-zinc-950">
                            {ord.orderNumber}
                          </span>
                          <span className="text-zinc-400">·</span>
                          <span className="text-xs font-semibold text-[#0066FF]">
                            {ord.status}
                          </span>
                        </div>
                        <span className="font-mono text-sm font-bold text-zinc-950 tabular-nums">
                          {formatBDT(ord.total)}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-zinc-600">
                        {ord.items.map((item) => (
                          <div key={item.productId} className="flex justify-between">
                            <span>
                              {item.quantity}× {item.name}
                            </span>
                            <span className="font-mono tabular-nums">
                              {formatBDT(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 text-xs text-zinc-500">
                        <span>
                          {ord.address}, {ord.district}, {ord.division}
                        </span>
                        {(ord.status === 'New Order' || ord.status === 'Pending') && (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(ord.id, 'Cancelled')}
                            className="text-red-600 font-semibold hover:underline cursor-pointer"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
