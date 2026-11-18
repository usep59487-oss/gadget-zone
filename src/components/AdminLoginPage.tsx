import React, { useState } from 'react';
import { signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  AlertTriangle,
  ArrowLeft,
  Lock,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { auth, googleProvider } from '../firebase';

interface AdminLoginPageProps {
  user: FirebaseUser | null;
  isAdmin: boolean;
  authReady: boolean;
  onBackToStore: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  user,
  isAdmin,
  authReady,
  onBackToStore,
  onLoginSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to complete Google sign-in.';
      if (!msg.includes('popup-closed-by-user')) {
        setErrorMsg(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitchAccount = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await signOut(auth);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to switch Google account.';
      if (!msg.includes('popup-closed-by-user')) {
        setErrorMsg(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await signOut(auth);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Minimal Top Bar */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToStore}
            className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-zinc-950 cursor-pointer"
          >
            GADGET ZONE
          </button>
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Storefront
          </button>
        </div>
      </header>

      {/* Centered Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#0066FF]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0066FF]">
                Authorized Access Only
              </p>
              <h1 className="font-display text-2xl font-bold text-zinc-950 leading-tight">
                Admin Portal Login
              </h1>
            </div>
          </div>

          {!authReady ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-[#0066FF] animate-spin mx-auto" />
              <p className="text-sm font-medium text-zinc-600">
                Checking Firebase authentication session...
              </p>
            </div>
          ) : user && isAdmin ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-zinc-900">
                <p className="font-semibold">Administrator Verified</p>
                <p className="text-xs text-zinc-600 mt-1">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={onLoginSuccess}
                className="w-full h-11 px-6 rounded-lg bg-[#0066FF] text-white text-sm font-semibold hover:bg-[#0052CC] transition-colors cursor-pointer"
              >
                Continue to Admin Dashboard
              </button>
            </div>
          ) : user && !isAdmin ? (
            <div className="space-y-5">
              <div
                role="alert"
                className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-800 space-y-1">
                  <p className="font-bold text-sm text-red-900">
                    Unauthorized Account
                  </p>
                  <p>
                    Signed in as{' '}
                    <span className="font-mono font-semibold">{user.email}</span>.
                    This Google account is not authorized to access the Gadget Zone
                    Admin Dashboard.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSwitchAccount}
                  className="w-full h-11 px-5 rounded-lg bg-[#0066FF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#0052CC] transition-colors cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className="w-4 h-4" />
                  {submitting ? 'Opening Google...' : 'Switch to Admin Google Account'}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSignOut}
                  className="w-full h-10 px-5 rounded-lg border border-zinc-300 text-zinc-800 text-xs font-semibold inline-flex items-center justify-center gap-2 hover:border-zinc-950 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-zinc-600 leading-relaxed">
                Sign in with your authorized Gadget Zone administrator Google
                account to manage real-time customer orders, update order statuses,
                and control store inventory.
              </p>

              {errorMsg && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium"
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={handleGoogleSignIn}
                className="w-full h-12 px-6 rounded-lg bg-[#0066FF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2.5 hover:bg-[#0052CC] transition-colors cursor-pointer disabled:opacity-60"
              >
                <LogIn className="w-4 h-4" />
                {submitting ? 'Signing in...' : 'Sign in with Google'}
              </button>

              <div className="pt-5 border-t border-zinc-200 flex items-start gap-2.5 text-xs text-zinc-500">
                <Lock className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span>
                  Protected by Firebase Authentication and Cloud Firestore role-based
                  security rules. Only authorized administrators can view customer
                  orders at <span className="font-mono text-zinc-700">/admin/dashboard</span>.
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
