/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { Bell, X } from 'lucide-react';
import { auth } from './firebase';
import {
  ActivePage,
  CartItem,
  Language,
  Order,
  Product,
  ProductCategory,
  SortOption,
  UserProfile,
} from './types';
import { SAMPLE_PRODUCTS } from './data/sampleProducts';
import {
  checkIsAdmin,
  getUserProfile,
  subscribeToAllOrders,
  subscribeToProducts,
} from './services/storeService';
import { formatBDT } from './utils/formatters';
import { playOrderNotificationChime } from './utils/orderExport';
import { resetStorefrontDocumentHead } from './utils/headMeta';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { StorefrontView } from './components/StorefrontView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductPage } from './components/ProductPage';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { OrderConfirmationPage } from './components/OrderConfirmationPage';
import { AccountPage } from './components/AccountPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginPage } from './components/AdminLoginPage';
import { PolicyModal, PolicyType } from './components/PolicyModal';
import { Footer } from './components/Footer';

const CART_STORAGE_KEY = 'gadget_zone_cart_v1';

function loadInitialCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getActivePageFromPathname(pathname: string): ActivePage {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/checkout')) return 'checkout';
  if (pathname.startsWith('/order-confirmation')) return 'confirmation';
  if (pathname.startsWith('/account')) return 'account';
  return 'storefront';
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = getActivePageFromPathname(location.pathname);

  const [lang, setLang] = useState<Language>('en');

  // Products from Firestore (with seamless initial sample fallback until Firestore is seeded)
  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [firestoreLoaded, setFirestoreLoaded] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  // Cart & Modals
  const [cartItems, setCartItems] = useState<CartItem[]>(loadInitialCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  // Auth & Profile
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Real-time Admin Orders & Notifications
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);
  const [liveOrderAlert, setLiveOrderAlert] = useState<Order | null>(null);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (!location.pathname.startsWith('/product/')) {
      resetStorefrontDocumentHead();
    }
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota issues
    }
  }, [cartItems]);

  useEffect(() => {
    const unsub = subscribeToProducts(
      (list) => {
        setFirestoreProducts(list);
        setFirestoreLoaded(true);
      },
      () => {
        setFirestoreLoaded(true);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const [adminFlag, profile] = await Promise.all([
          checkIsAdmin(nextUser),
          getUserProfile(nextUser.uid).catch(() => null),
        ]);
        setIsAdmin(adminFlag);
        setUserProfile(profile);
      } else {
        setIsAdmin(false);
        setUserProfile(null);
        setAdminOrders([]);
        setLiveOrderAlert(null);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Global real-time order listener for authorized admin
  useEffect(() => {
    if (!isAdmin) {
      setAdminOrders([]);
      return;
    }

    const unsub = subscribeToAllOrders(
      (ordersList, newlyAddedIds) => {
        setAdminOrders(ordersList);
        if (newlyAddedIds.length > 0) {
          const newest = ordersList.find((o) => newlyAddedIds.includes(o.id));
          if (newest) {
            setLiveOrderAlert(newest);
            if (soundEnabledRef.current) {
              playOrderNotificationChime();
            }
          }
        }
      },
      () => {
        setAdminOrders([]);
      }
    );

    return () => unsub();
  }, [isAdmin]);

  const isFirestoreEmpty = firestoreLoaded && firestoreProducts.length === 0;
  const products = firestoreProducts.length > 0 ? firestoreProducts : SAMPLE_PRODUCTS;
  const unreadOrderCount = adminOrders.filter(
    (o) => !o.isReadByAdmin || o.status === 'New Order'
  ).length;

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const goToRoute = (path: string, replace = false) => {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    navigate(normalized, { replace });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdminRoute = () => {
    if (isAdmin) {
      goToRoute('/admin/dashboard');
    } else {
      goToRoute('/admin');
    }
  };

  const handleAdminSignOut = async () => {
    await signOut(auth);
    goToRoute('/admin', true);
  };

  const handleAddToCart = (product: Product, qty = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                product,
                quantity: Math.min(Math.max(1, product.stock), item.quantity + qty),
              }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(Math.max(1, product.stock), qty) }];
    });
  };

  const handleBuyNow = (product: Product, qty = 1) => {
    handleAddToCart(product, qty);
    setCartOpen(false);
    goToRoute('/checkout');
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleNavigateSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        if (sectionId === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
    } else if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOrderConfirmed = (order: Order) => {
    setConfirmedOrder(order);
    setCartItems([]);
    goToRoute('/order-confirmation');
  };

  const isDedicatedLoginView =
    location.pathname === '/admin' ||
    location.pathname === '/admin/' ||
    (location.pathname.startsWith('/admin/dashboard') && (!authReady || !isAdmin));

  if (isDedicatedLoginView) {
    if (authReady && isAdmin && (location.pathname === '/admin' || location.pathname === '/admin/')) {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (authReady && !isAdmin && location.pathname.startsWith('/admin/dashboard')) {
      return <Navigate to="/admin" replace />;
    }

    return (
      <ErrorBoundary>
        <AdminLoginPage
          user={user}
          isAdmin={isAdmin}
          authReady={authReady}
          onBackToStore={() => goToRoute('/')}
          onLoginSuccess={() => goToRoute('/admin/dashboard', true)}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-white text-zinc-950">
        <Header
          lang={lang}
          onToggleLang={() => setLang((prev) => (prev === 'en' ? 'bn' : 'en'))}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          onSearchSubmit={() => handleNavigateSection('shop')}
          cartCount={totalCartCount}
          onOpenCart={() => setCartOpen(true)}
          activePage={activePage}
          onNavigateSection={handleNavigateSection}
          onOpenAccount={() => goToRoute('/account')}
          onOpenAdmin={handleOpenAdminRoute}
          user={user}
          isAdmin={isAdmin}
          unreadOrderCount={unreadOrderCount}
        />

        {/* Real-Time New Order Admin Notification Toast */}
        {isAdmin && liveOrderAlert && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] bg-zinc-950 text-white border border-zinc-800 rounded-2xl p-4 shadow-2xl print:hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0066FF] text-white flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6]">
                    New Order Received
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {liveOrderAlert.orderNumber} · {liveOrderAlert.customerName}
                  </p>
                  <p className="text-xs text-zinc-300 font-mono mt-0.5 tabular-nums">
                    {formatBDT(liveOrderAlert.total)} ·{' '}
                    {liveOrderAlert.city || liveOrderAlert.district}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLiveOrderAlert(null)}
                aria-label="Dismiss notification"
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setLiveOrderAlert(null);
                  handleOpenAdminRoute();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#0066FF] text-white text-xs font-semibold hover:bg-[#0052CC] transition-colors cursor-pointer"
              >
                View Order in Admin
              </button>
            </div>
          </div>
        )}

        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <StorefrontView
                  lang={lang}
                  products={products}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onBuyNow={(p) => handleBuyNow(p, 1)}
                  onSelectProduct={(p) => setSelectedProduct(p)}
                  onNavigateSection={handleNavigateSection}
                />
              }
            />
            <Route
              path="/product/:slug"
              element={
                <ProductPage
                  products={products}
                  lang={lang}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                />
              }
            />
            <Route
              path="/checkout"
              element={
                <CheckoutPage
                  items={cartItems}
                  lang={lang}
                  user={user}
                  profile={userProfile}
                  onBackToStore={() => goToRoute('/')}
                  onOrderConfirmed={handleOrderConfirmed}
                />
              }
            />
            <Route
              path="/order-confirmation"
              element={
                confirmedOrder ? (
                  <OrderConfirmationPage
                    order={confirmedOrder}
                    lang={lang}
                    onContinueShopping={() => goToRoute('/')}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/account"
              element={
                <AccountPage
                  user={user}
                  profile={userProfile}
                  isAdmin={isAdmin}
                  lang={lang}
                  onProfileSaved={(prof) => setUserProfile(prof)}
                  onBackToStore={() => goToRoute('/')}
                  onOpenAdmin={handleOpenAdminRoute}
                />
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                isAdmin ? (
                  <AdminDashboard
                    products={products}
                    orders={adminOrders}
                    unreadOrderCount={unreadOrderCount}
                    isFirestoreEmpty={isFirestoreEmpty}
                    soundEnabled={soundEnabled}
                    adminEmail={user?.email}
                    onToggleSound={() => setSoundEnabled((prev) => !prev)}
                    onBackToStore={() => goToRoute('/')}
                    onSignOut={handleAdminSignOut}
                  />
                ) : (
                  <Navigate to="/admin" replace />
                )
              }
            />
            <Route
              path="/admin"
              element={
                isAdmin ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <AdminLoginPage
                    user={user}
                    isAdmin={isAdmin}
                    authReady={authReady}
                    onBackToStore={() => goToRoute('/')}
                    onLoginSuccess={() => goToRoute('/admin/dashboard', true)}
                  />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer
          lang={lang}
          onNavigateSection={handleNavigateSection}
          onOpenPolicy={(policy) => setActivePolicy(policy)}
          onOpenAdminLogin={handleOpenAdminRoute}
        />

        <CartDrawer
          open={cartOpen}
          items={cartItems}
          lang={lang}
          onClose={() => setCartOpen(false)}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onProceedToCheckout={() => {
            setCartOpen(false);
            goToRoute('/checkout');
          }}
        />

        <ProductDetailModal
          product={selectedProduct}
          lang={lang}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />

        <PolicyModal
          type={activePolicy}
          onClose={() => setActivePolicy(null)}
        />
      </div>
    </ErrorBoundary>
  );
}
