/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
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
  subscribeToProducts,
} from './services/storeService';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { StorefrontView } from './components/StorefrontView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { OrderConfirmationPage } from './components/OrderConfirmationPage';
import { AccountPage } from './components/AccountPage';
import { AdminDashboard } from './components/AdminDashboard';
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

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [activePage, setActivePage] = useState<ActivePage>('storefront');

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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
      }
    });
    return () => unsub();
  }, []);

  const isFirestoreEmpty = firestoreLoaded && firestoreProducts.length === 0;
  const products = firestoreProducts.length > 0 ? firestoreProducts : SAMPLE_PRODUCTS;

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
    setActivePage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (activePage !== 'storefront') {
      setActivePage('storefront');
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
    setActivePage('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          onOpenAccount={() => {
            setActivePage('account');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAdmin={() => {
            setActivePage('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          user={user}
          isAdmin={isAdmin}
        />

        <main className="flex-1">
          {activePage === 'storefront' && (
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
          )}

          {activePage === 'checkout' && (
            <CheckoutPage
              items={cartItems}
              lang={lang}
              user={user}
              profile={userProfile}
              onBackToStore={() => setActivePage('storefront')}
              onOrderConfirmed={handleOrderConfirmed}
            />
          )}

          {activePage === 'confirmation' && confirmedOrder && (
            <OrderConfirmationPage
              order={confirmedOrder}
              lang={lang}
              onContinueShopping={() => {
                setActivePage('storefront');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {activePage === 'account' && (
            <AccountPage
              user={user}
              profile={userProfile}
              isAdmin={isAdmin}
              lang={lang}
              onProfileSaved={(prof) => setUserProfile(prof)}
              onBackToStore={() => setActivePage('storefront')}
              onOpenAdmin={() => setActivePage('admin')}
            />
          )}

          {activePage === 'admin' && isAdmin && (
            <AdminDashboard
              products={products}
              isFirestoreEmpty={isFirestoreEmpty}
              onBackToStore={() => setActivePage('storefront')}
            />
          )}

          {activePage === 'admin' && !isAdmin && (
            <AccountPage
              user={user}
              profile={userProfile}
              isAdmin={isAdmin}
              lang={lang}
              onProfileSaved={(prof) => setUserProfile(prof)}
              onBackToStore={() => setActivePage('storefront')}
              onOpenAdmin={() => setActivePage('admin')}
            />
          )}
        </main>

        <Footer
          lang={lang}
          onNavigateSection={handleNavigateSection}
          onOpenPolicy={(policy) => setActivePolicy(policy)}
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
            setActivePage('checkout');
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
