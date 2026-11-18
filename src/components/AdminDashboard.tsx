import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  Database,
  Download,
  Edit3,
  Eye,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Printer,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  ORDER_STATUSES,
  Order,
  OrderStatus,
  PRODUCT_CATEGORIES,
  Product,
  ProductCategory,
} from '../types';
import { CATEGORY_IMAGES, SAMPLE_PRODUCTS } from '../data/sampleProducts';
import {
  deleteOrderById,
  deleteProductById,
  markAllOrdersAsRead,
  markOrderAsRead,
  seedSampleProducts,
  updateOrderStatus,
  upsertProduct,
} from '../services/storeService';
import { calcDiscountPercent, formatBDT, sanitizeId } from '../utils/formatters';
import {
  downloadOrderCsv,
  downloadOrderPdf,
  formatOrderDateTime,
  getOrderDateKey,
  playOrderNotificationChime,
  resolveOrderDate,
} from '../utils/orderExport';
import {
  analyzeProductSeo,
  createDefaultProductSeo,
  generateProductSlug,
  isSlugDuplicate,
  resolveProductSlug,
} from '../utils/seo';
import { SafeImage } from './SafeImage';
import { AdminOrderDetailModal } from './AdminOrderDetailModal';
import { AdminSeoOverview } from './AdminSeoOverview';
import { ProductFormData, ProductSeoEditor } from './ProductSeoEditor';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  unreadOrderCount: number;
  isFirestoreEmpty: boolean;
  soundEnabled: boolean;
  adminEmail?: string | null;
  onToggleSound: () => void;
  onBackToStore: () => void;
  onSignOut?: () => void;
}

type AdminSection = 'orders' | 'products' | 'seo' | 'overview';
type DatePreset = 'all' | 'today' | '7days' | '30days' | 'custom';

const createEmptyForm = (): ProductFormData => ({
  id: '',
  name: '',
  nameBn: '',
  category: 'Wireless Earbuds',
  description: '',
  descriptionBn: '',
  originalPrice: 2000,
  discountedPrice: 1590,
  stock: 25,
  rating: 4.8,
  reviewCount: 15,
  imageUrl: CATEGORY_IMAGES['Wireless Earbuds'],
  sku: 'GZ-NEW-100',
  isFeatured: true,
  isBestSeller: false,
  slug: '',
  brand: 'Gadget Zone',
  imageAlt: '',
  seo: createDefaultProductSeo(),
});

const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  'New Order': 'bg-[#0066FF] text-white',
  Pending: 'bg-amber-100 text-amber-800',
  Confirmed: 'bg-sky-100 text-sky-800',
  Processing: 'bg-indigo-100 text-indigo-800',
  Shipped: 'bg-violet-100 text-violet-800',
  Delivered: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-red-100 text-red-700',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  unreadOrderCount,
  isFirestoreEmpty,
  soundEnabled,
  adminEmail,
  onToggleSound,
  onBackToStore,
  onSignOut,
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('orders');

  // Order Filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customDate, setCustomDate] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);

  // Product Management State
  const [productSearch, setProductSearch] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'details' | 'seo'>('details');
  const [isNewProduct, setIsNewProduct] = useState(true);
  const [slugTouched, setSlugTouched] = useState(false);
  const [formState, setFormState] = useState<ProductFormData>(createEmptyForm);
  const [savingProduct, setSavingProduct] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);

  const [statusFeedback, setStatusFeedback] = useState('');

  const flashNotice = (msg: string) => {
    setStatusFeedback(msg);
    setTimeout(() => setStatusFeedback(''), 2800);
  };

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  // Real-time computed metrics
  const totalOrdersCount = orders.length;
  const newOrPendingCount = orders.filter(
    (o) => o.status === 'New Order' || o.status === 'Pending'
  ).length;
  const totalRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + o.total, 0),
    [orders]
  );
  const lowStockCount = products.filter((p) => p.stock <= 10).length;
  const productsNeedingSeoCount = useMemo(
    () =>
      products.filter((p) => {
        const rep = analyzeProductSeo(p, products);
        return (
          rep.score < 80 ||
          !p.seo?.metaDescription?.trim() ||
          !p.seo?.seoTitle?.trim() ||
          !p.seo?.focusKeyword?.trim()
        );
      }).length,
    [products]
  );

  const modalSeoReport = useMemo(
    () =>
      analyzeProductSeo(
        {
          ...formState,
          slug: generateProductSlug(formState.slug || formState.name || 'product'),
        },
        products
      ),
    [formState, products]
  );

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    const now = new Date();
    const todayKey = getOrderDateKey(now);

    return orders.filter((order) => {
      if (orderStatusFilter !== 'All' && order.status !== orderStatusFilter) {
        return false;
      }

      if (datePreset !== 'all') {
        const orderDate = resolveOrderDate(order.createdAt);
        const orderKey = getOrderDateKey(orderDate);
        if (datePreset === 'today' && orderKey !== todayKey) return false;
        if (datePreset === 'custom' && customDate && orderKey !== customDate) return false;
        if (datePreset === '7days') {
          const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 7) return false;
        }
        if (datePreset === '30days') {
          const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 30) return false;
        }
      }

      if (!q) return true;
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.phone.toLowerCase().includes(q) ||
        (order.city || '').toLowerCase().includes(q) ||
        order.district.toLowerCase().includes(q)
      );
    });
  }, [orders, orderSearch, orderStatusFilter, datePreset, customDate]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  // Handlers
  const handleOpenOrderDetails = async (order: Order) => {
    setSelectedOrderId(order.id);
    if (!order.isReadByAdmin) {
      await markOrderAsRead(order.id, true);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = orders.filter((o) => !o.isReadByAdmin).map((o) => o.id);
    if (unreadIds.length === 0) return;
    await markAllOrdersAsRead(unreadIds);
    flashNotice(`Marked ${unreadIds.length} orders as read.`);
  };

  const handleOrderStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    await updateOrderStatus(orderId, nextStatus);
    const target = orders.find((o) => o.id === orderId);
    if (target && !target.isReadByAdmin) {
      await markOrderAsRead(orderId, true);
    }
    flashNotice(`Order status updated to ${nextStatus}.`);
  };

  const handleDeleteOrder = async (orderId: string) => {
    await deleteOrderById(orderId);
    setConfirmDeleteOrderId(null);
    if (selectedOrderId === orderId) setSelectedOrderId(null);
    flashNotice('Order deleted permanently.');
  };

  const handleSeedCatalog = async () => {
    setSeeding(true);
    try {
      await seedSampleProducts(SAMPLE_PRODUCTS);
      flashNotice('Sample catalog synced to Firestore.');
    } finally {
      setSeeding(false);
    }
  };

  const openCreateModal = () => {
    setIsNewProduct(true);
    setModalTab('details');
    setSlugTouched(false);
    setFormState({
      ...createEmptyForm(),
      sku: `GZ-${Math.floor(100 + Math.random() * 899)}`,
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (
    product: Product,
    initialTab: 'details' | 'seo' = 'details'
  ) => {
    setIsNewProduct(false);
    setModalTab(initialTab);
    setSlugTouched(true);
    setFormState({
      id: product.id,
      name: product.name,
      nameBn: product.nameBn,
      category: product.category,
      description: product.description,
      descriptionBn: product.descriptionBn,
      originalPrice: product.originalPrice,
      discountedPrice: product.discountedPrice,
      stock: product.stock,
      rating: product.rating,
      reviewCount: product.reviewCount,
      imageUrl: product.imageUrl,
      sku: product.sku,
      isFeatured: product.isFeatured,
      isBestSeller: product.isBestSeller,
      slug: resolveProductSlug(product),
      brand: product.brand || '',
      imageAlt: product.imageAlt || '',
      seo: createDefaultProductSeo(product),
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (formState.name.trim().length < 2) {
      setModalTab('details');
      setFormError('Product name must be at least 2 characters.');
      return;
    }
    if (formState.originalPrice <= 0 || formState.discountedPrice <= 0) {
      setModalTab('details');
      setFormError('Prices must be greater than 0 BDT.');
      return;
    }
    if (formState.discountedPrice > formState.originalPrice) {
      setModalTab('details');
      setFormError('Discounted price cannot exceed original price.');
      return;
    }

    const cleanSlug = generateProductSlug(formState.slug || formState.name);
    const targetId = isNewProduct
      ? sanitizeId(`${formState.name}-${Date.now().toString().slice(-4)}`)
      : formState.id;

    if (isSlugDuplicate(cleanSlug, isNewProduct ? '' : targetId, products)) {
      setModalTab('seo');
      setFormError(
        `URL slug "${cleanSlug}" is already used by another product. Choose a unique slug.`
      );
      return;
    }

    setSavingProduct(true);
    try {
      await upsertProduct(
        {
          ...formState,
          id: targetId,
          slug: cleanSlug,
        },
        isNewProduct
      );
      setModalOpen(false);
      flashNotice(isNewProduct ? 'Product added with SEO metadata.' : 'Product & SEO updated.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleQuickStockDelta = async (product: Product, delta: number) => {
    if (isFirestoreEmpty) {
      await handleSeedCatalog();
      return;
    }
    const nextStock = Math.max(0, product.stock + delta);
    await upsertProduct({ ...product, stock: nextStock }, false);
    flashNotice(`Updated ${product.sku} stock to ${nextStock}.`);
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteProductById(productId);
    setConfirmDeleteProductId(null);
    flashNotice('Product deleted.');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50">
      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row">
        {/* Admin Sidebar (Hidden when printing) */}
        <aside className="lg:w-64 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 p-4 sm:p-6 flex flex-col justify-between gap-6 print:hidden">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <button
                  type="button"
                  onClick={onBackToStore}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-950 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Storefront
                </button>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="lg:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-red-600 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                )}
              </div>
              <h1 className="font-display text-lg font-bold text-zinc-950">
                Admin Workspace
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Real-time Firestore sync
              </p>
            </div>

            <nav aria-label="Admin sections" className="flex lg:flex-col gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveSection('orders')}
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeSection === 'orders'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4" />
                  Orders
                </span>
                {unreadOrderCount > 0 ? (
                  <span className="tabular-nums px-1.5 py-0.5 rounded bg-[#0066FF] text-white text-[11px] font-bold">
                    {unreadOrderCount}
                  </span>
                ) : (
                  <span className="tabular-nums text-[11px] opacity-70">
                    {orders.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('products')}
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeSection === 'products'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  <Package className="w-4 h-4" />
                  Products &amp; Stock
                </span>
                <span className="tabular-nums text-[11px] opacity-70">
                  {products.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('seo')}
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeSection === 'seo'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4" />
                  Product SEO
                </span>
                {productsNeedingSeoCount > 0 && (
                  <span className="tabular-nums px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-bold">
                    {productsNeedingSeoCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('overview')}
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeSection === 'overview'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  Overview
                </span>
              </button>
            </nav>
          </div>

          {/* Notification Sound Controls & Admin Session */}
          <div className="hidden lg:block pt-5 border-t border-zinc-200 space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Order Alerts
            </p>
            <button
              type="button"
              onClick={onToggleSound}
              className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-800 flex items-center justify-between hover:border-zinc-400 transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#0066FF]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-zinc-400" />
                )}
                Alert Chime
              </span>
              <span className={soundEnabled ? 'text-[#0066FF]' : 'text-zinc-400'}>
                {soundEnabled ? 'On' : 'Muted'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => playOrderNotificationChime()}
              className="w-full h-8 px-3 rounded-lg bg-zinc-100 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              Test Alert Sound
            </button>

            {onSignOut && (
              <div className="pt-4 mt-4 border-t border-zinc-200 space-y-2">
                {adminEmail && (
                  <p className="text-[11px] text-zinc-500 truncate" title={adminEmail}>
                    Signed in: <span className="font-medium text-zinc-800">{adminEmail}</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:border-red-300 hover:text-red-600 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Workspace Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0">
          {/* Top Breadcrumb + Global Actions (hidden on print) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                Admin /{' '}
                <span className="text-zinc-950 font-semibold">
                  {activeSection === 'orders'
                    ? 'Orders Management'
                    : activeSection === 'products'
                      ? 'Products & Inventory'
                      : activeSection === 'seo'
                        ? 'Product SEO Manager'
                        : 'Store Overview'}
                </span>
              </p>
              <h2 className="font-display text-2xl font-bold text-zinc-950 mt-0.5">
                {activeSection === 'orders'
                  ? 'Real-Time Customer Orders'
                  : activeSection === 'products'
                    ? 'Catalog & Inventory'
                    : activeSection === 'seo'
                      ? 'Product SEO Overview & Audit'
                      : 'Performance Overview'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {isFirestoreEmpty && (
                <button
                  type="button"
                  disabled={seeding}
                  onClick={handleSeedCatalog}
                  className="h-9 px-3.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 text-xs font-semibold inline-flex items-center gap-2 hover:border-[#0066FF] hover:text-[#0066FF] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Database className="w-4 h-4" />
                  {seeding ? 'Syncing...' : 'Sync Sample Catalog'}
                </button>
              )}
              <button
                type="button"
                onClick={openCreateModal}
                className="h-9 px-4 rounded-lg bg-[#0066FF] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#0052CC] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>

          {statusFeedback && (
            <div className="px-4 py-3 rounded-lg bg-zinc-950 text-white text-xs font-medium flex items-center gap-2 print:hidden">
              <Check className="w-4 h-4 text-[#0066FF]" />
              {statusFeedback}
            </div>
          )}

          {/* KPI Strip (hidden on print) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Revenue
              </p>
              <p className="font-mono text-2xl font-bold text-zinc-950 mt-1 tabular-nums">
                {formatBDT(totalRevenue)}
              </p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Orders
              </p>
              <p className="font-mono text-2xl font-bold text-zinc-950 mt-1 tabular-nums">
                {totalOrdersCount}
              </p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                New / Pending Orders
              </p>
              <p className="font-mono text-2xl font-bold text-[#0066FF] mt-1 tabular-nums">
                {newOrPendingCount}
              </p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Low Stock SKUs
              </p>
              <p className="font-mono text-2xl font-bold text-zinc-950 mt-1 tabular-nums">
                {lowStockCount}
              </p>
            </div>
          </div>

          {/* ORDERS SECTION */}
          {activeSection === 'orders' && (
            <div className="space-y-4 print:hidden">
              {/* Filter & Search Toolbar */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-4">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row flex-1 gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="search"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search Order ID, customer name, or phone..."
                        className="w-full h-10 pl-9 pr-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0066FF]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-zinc-200 bg-zinc-50">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        <select
                          value={datePreset}
                          onChange={(e) => setDatePreset(e.target.value as DatePreset)}
                          aria-label="Filter orders by date"
                          className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none"
                        >
                          <option value="all">All Dates</option>
                          <option value="today">Today</option>
                          <option value="7days">Last 7 Days</option>
                          <option value="30days">Last 30 Days</option>
                          <option value="custom">Specific Date</option>
                        </select>
                      </div>

                      {datePreset === 'custom' && (
                        <input
                          type="date"
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                          className="h-10 px-3 rounded-lg border border-zinc-300 text-xs font-mono text-zinc-900 bg-white focus:outline-none focus:border-[#0066FF]"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {unreadOrderCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="h-10 px-3.5 rounded-lg border border-zinc-300 text-xs font-semibold text-zinc-800 inline-flex items-center gap-1.5 hover:border-[#0066FF] hover:text-[#0066FF] transition-colors cursor-pointer"
                      >
                        <CheckCheck className="w-4 h-4" />
                        Mark All Read ({unreadOrderCount})
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={filteredOrders.length === 0}
                      onClick={() => downloadOrderCsv(filteredOrders)}
                      className="h-10 px-3.5 rounded-lg border border-zinc-300 text-xs font-semibold text-zinc-800 inline-flex items-center gap-1.5 hover:border-zinc-950 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Status Filter Pills/Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                  {(['All', ...ORDER_STATUSES] as const).map((status) => {
                    const count =
                      status === 'All'
                        ? orders.length
                        : orders.filter((o) => o.status === status).length;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setOrderStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          orderStatusFilter === status
                            ? 'bg-zinc-950 text-white'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                        }`}
                      >
                        {status} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Orders Table */}
              {filteredOrders.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
                  <ShoppingBag className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                  <h3 className="font-display text-base font-bold text-zinc-950 mb-1">
                    No customer orders found
                  </h3>
                  <p className="text-sm text-zinc-500 max-w-md mx-auto">
                    {orders.length === 0
                      ? 'New orders placed by customers at Checkout will appear here instantly in real time.'
                      : 'Try clearing your Order ID, date, or status filters.'}
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          <th className="py-3 px-4">Order &amp; Date</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Delivery Location</th>
                          <th className="py-3 px-4">Items</th>
                          <th className="py-3 px-4">Breakdown</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-sm">
                        {filteredOrders.map((order) => {
                          const isHighlighted =
                            !order.isReadByAdmin || order.status === 'New Order';
                          const firstItem = order.items[0];
                          return (
                            <tr
                              key={order.id}
                              className={`transition-colors ${
                                isHighlighted
                                  ? 'bg-blue-50/50 hover:bg-blue-50/80'
                                  : 'hover:bg-zinc-50/70'
                              }`}
                            >
                              <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenOrderDetails(order)}
                                    className="font-mono font-bold text-zinc-950 hover:text-[#0066FF] cursor-pointer"
                                  >
                                    {order.orderNumber}
                                  </button>
                                  {!order.isReadByAdmin && (
                                    <span className="px-1.5 py-0.5 rounded bg-[#0066FF] text-white text-[10px] font-bold">
                                      NEW
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                                  {formatOrderDateTime(order.createdAt)}
                                </p>
                                <p className="text-[11px] text-zinc-500 mt-0.5">
                                  {order.paymentMethod}
                                </p>
                              </td>

                              <td className="py-3.5 px-4 align-top">
                                <p className="font-semibold text-zinc-950">
                                  {order.customerName}
                                </p>
                                <p className="font-mono text-xs text-zinc-700 mt-0.5">
                                  {order.phone}
                                </p>
                                {order.email && (
                                  <p className="text-xs text-zinc-500 truncate max-w-[180px]">
                                    {order.email}
                                  </p>
                                )}
                              </td>

                              <td className="py-3.5 px-4 align-top max-w-[220px]">
                                <p className="text-xs font-semibold text-zinc-900">
                                  {order.city || order.district}, {order.district}
                                </p>
                                <p className="text-xs text-zinc-600 line-clamp-2 mt-0.5">
                                  {order.address}
                                </p>
                              </td>

                              <td className="py-3.5 px-4 align-top">
                                <div className="flex items-center gap-2.5">
                                  {firstItem && (
                                    <div className="w-10 h-10 rounded-lg bg-[#F4F5F7] border border-zinc-200 overflow-hidden shrink-0">
                                      <SafeImage
                                        src={firstItem.imageUrl}
                                        alt={firstItem.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-zinc-950 truncate max-w-[175px]">
                                      {firstItem?.name || 'Order Item'}
                                    </p>
                                    <p className="text-[11px] text-zinc-500 font-mono tabular-nums">
                                      {order.items.reduce((s, i) => s + i.quantity, 0)} qty ·{' '}
                                      {order.items.length}{' '}
                                      {order.items.length === 1 ? 'item' : 'items'}
                                      {order.items.length > 1 ? ` (+${order.items.length - 1} more)` : ''}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                <p className="font-mono font-bold text-zinc-950 tabular-nums">
                                  {formatBDT(order.total)}
                                </p>
                                <p className="font-mono text-[11px] text-zinc-500 tabular-nums">
                                  Sub {formatBDT(order.subtotal)} · Del{' '}
                                  {order.deliveryFee === 0
                                    ? 'Free'
                                    : formatBDT(order.deliveryFee)}
                                </p>
                                {(order.discount || 0) > 0 && (
                                  <p className="font-mono text-[11px] text-emerald-700 tabular-nums">
                                    Saved {formatBDT(order.discount)}
                                  </p>
                                )}
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                <select
                                  value={order.status}
                                  onChange={(e) =>
                                    handleOrderStatusChange(
                                      order.id,
                                      e.target.value as OrderStatus
                                    )
                                  }
                                  aria-label={`Status for ${order.orderNumber}`}
                                  className={`h-8 px-2.5 rounded-lg text-xs font-semibold border border-zinc-200 focus:outline-none focus:border-[#0066FF] cursor-pointer ${
                                    ORDER_STATUS_STYLE[order.status]
                                  }`}
                                >
                                  {ORDER_STATUSES.map((st) => (
                                    <option
                                      key={st}
                                      value={st}
                                      className="bg-white text-zinc-950"
                                    >
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="py-3.5 px-4 text-right whitespace-nowrap align-top">
                                {confirmDeleteOrderId === order.id ? (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteOrder(order.id)}
                                      className="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteOrderId(null)}
                                      className="px-2 py-1 rounded border border-zinc-300 text-xs font-semibold text-zinc-700 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenOrderDetails(order)}
                                      title="View complete order & print invoice"
                                      aria-label={`View ${order.orderNumber}`}
                                      className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-[#0066FF] transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => downloadOrderPdf(order)}
                                      title="Download PDF Invoice"
                                      aria-label={`Download PDF for ${order.orderNumber}`}
                                      className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-[#0066FF] transition-colors cursor-pointer"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await handleOpenOrderDetails(order);
                                        setTimeout(() => window.print(), 120);
                                      }}
                                      title="Print Invoice"
                                      aria-label={`Print invoice for ${order.orderNumber}`}
                                      className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition-colors cursor-pointer"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteOrderId(order.id)}
                                      title="Delete Order"
                                      aria-label={`Delete ${order.orderNumber}`}
                                      className="p-1.5 rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRODUCTS & INVENTORY SECTION */}
          {activeSection === 'products' && (
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden print:hidden">
              <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Filter products by name or SKU..."
                    className="w-full h-9 pl-9 pr-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
                {isFirestoreEmpty && (
                  <p className="text-xs text-amber-700 font-medium">
                    Showing initial sample products. Click “Sync Sample Catalog” above to edit
                    in Firestore.
                  </p>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price / Discount</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-sm">
                    {filteredProducts.map((product) => {
                      const discPct = calcDiscountPercent(
                        product.originalPrice,
                        product.discountedPrice
                      );
                      return (
                        <tr key={product.id} className="hover:bg-zinc-50/60">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-[#F4F5F7] overflow-hidden shrink-0 border border-zinc-200">
                                <SafeImage
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-zinc-950 truncate max-w-[240px]">
                                  {product.name}
                                </p>
                                <p className="font-mono text-xs text-zinc-500">{product.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-600 whitespace-nowrap">
                            {product.category}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-mono font-bold text-zinc-950 tabular-nums">
                              {formatBDT(product.discountedPrice)}
                              {discPct > 0 && (
                                <span className="ml-2 text-xs font-semibold text-[#0066FF]">
                                  -{discPct}%
                                </span>
                              )}
                            </div>
                            {product.originalPrice > product.discountedPrice && (
                              <div className="font-mono text-xs text-zinc-400 line-through tabular-nums">
                                {formatBDT(product.originalPrice)}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-2 border border-zinc-200 rounded-md px-1.5 py-0.5">
                              <button
                                type="button"
                                onClick={() => handleQuickStockDelta(product, -1)}
                                className="w-5 h-5 text-xs font-bold text-zinc-600 hover:text-zinc-950 cursor-pointer"
                                aria-label="Decrease stock"
                              >
                                -
                              </button>
                              <span
                                className={`font-mono text-xs font-bold tabular-nums min-w-[28px] text-center ${
                                  product.stock <= 10 ? 'text-amber-600' : 'text-zinc-950'
                                }`}
                              >
                                {product.stock}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickStockDelta(product, 1)}
                                className="w-5 h-5 text-xs font-bold text-zinc-600 hover:text-zinc-950 cursor-pointer"
                                aria-label="Increase stock"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {confirmDeleteProductId === product.id ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteProductId(null)}
                                  className="px-2.5 py-1 rounded border border-zinc-300 text-xs font-semibold text-zinc-700 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(product, 'seo')}
                                  title="Optimize Product SEO"
                                  aria-label={`SEO for ${product.name}`}
                                  className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-[#0066FF] hover:bg-blue-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  SEO
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(product, 'details')}
                                  aria-label={`Edit ${product.name}`}
                                  className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-[#0066FF] transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                {!isFirestoreEmpty && (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteProductId(product.id)}
                                    aria-label={`Delete ${product.name}`}
                                    className="p-2 rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRODUCT SEO OVERVIEW SECTION */}
          {activeSection === 'seo' && (
            <AdminSeoOverview
              products={products}
              onEditProductSeo={(p) => openEditModal(p, 'seo')}
            />
          )}

          {/* OVERVIEW SECTION */}
          {activeSection === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
              <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                <h3 className="font-display text-base font-bold text-zinc-950 mb-4">
                  Order Status Breakdown
                </h3>
                <div className="space-y-3">
                  {ORDER_STATUSES.map((status) => {
                    const count = orders.filter((o) => o.status === status).length;
                    const pct =
                      orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-zinc-800">{status}</span>
                          <span className="font-mono text-zinc-600 tabular-nums">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                          <div
                            className="h-full bg-[#0066FF] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                <h3 className="font-display text-base font-bold text-zinc-950 mb-4">
                  Recent Incoming Orders
                </h3>
                {orders.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-8 text-center">
                    No customer orders recorded yet.
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="py-3 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSection('orders');
                              handleOpenOrderDetails(order);
                            }}
                            className="font-mono text-sm font-bold text-zinc-950 hover:text-[#0066FF] cursor-pointer"
                          >
                            {order.orderNumber}
                          </button>
                          <p className="text-xs text-zinc-500 truncate">
                            {order.customerName} · {order.city || order.district}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-sm font-bold text-zinc-950 tabular-nums">
                            {formatBDT(order.total)}
                          </p>
                          <p className="text-[11px] font-semibold text-[#0066FF]">
                            {order.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail & Invoice Print Modal */}
      <AdminOrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onUpdateStatus={handleOrderStatusChange}
        onDeleteOrder={handleDeleteOrder}
      />

      {/* Add / Edit Product & SEO Manager Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:hidden"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={isNewProduct ? 'Add New Product' : 'Edit Product'}
        >
          <form
            onSubmit={handleSaveProduct}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 border border-zinc-200 shadow-2xl my-auto space-y-5 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-3 min-w-0">
                <h2 className="font-display text-xl font-bold text-zinc-950 truncate">
                  {isNewProduct ? 'Add New Product' : `Edit ${formState.name}`}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold tabular-nums shrink-0 ${
                    modalSeoReport.score >= 80
                      ? 'bg-emerald-100 text-emerald-800'
                      : modalSeoReport.score >= 50
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  SEO {modalSeoReport.score}/100
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Primary Tabs: Product Details vs Rank Math SEO Manager */}
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  modalTab === 'details'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Product Info &amp; Pricing
              </button>
              <button
                type="button"
                onClick={() => setModalTab('seo')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  modalTab === 'seo'
                    ? 'bg-[#0066FF] text-white'
                    : 'bg-blue-50 text-[#0066FF] hover:bg-blue-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                SEO Manager ({modalSeoReport.score}/100)
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}

            {modalTab === 'details' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Product Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={140}
                      value={formState.name}
                      onChange={(e) => {
                        const nextName = e.target.value;
                        setFormState((prev) => ({
                          ...prev,
                          name: nextName,
                          slug:
                            isNewProduct && !slugTouched
                              ? generateProductSlug(nextName)
                              : prev.slug,
                        }));
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Product Name (Bangla)
                    </label>
                    <input
                      type="text"
                      maxLength={180}
                      value={formState.nameBn}
                      onChange={(e) => setFormState({ ...formState, nameBn: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formState.category}
                      onChange={(e) => {
                        const nextCat = e.target.value as ProductCategory;
                        setFormState({
                          ...formState,
                          category: nextCat,
                          imageUrl: isNewProduct
                            ? CATEGORY_IMAGES[nextCat]
                            : formState.imageUrl,
                        });
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm bg-white focus:outline-none focus:border-[#0066FF]"
                    >
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      maxLength={80}
                      value={formState.brand}
                      onChange={(e) => setFormState({ ...formState, brand: e.target.value })}
                      placeholder="e.g. SoundCore, VoltEdge"
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      SKU *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={40}
                      value={formState.sku}
                      onChange={(e) => setFormState({ ...formState, sku: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm font-mono focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Original Price (৳) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={1000000}
                      value={formState.originalPrice}
                      onChange={(e) =>
                        setFormState({ ...formState, originalPrice: Number(e.target.value) })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm font-mono focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Sale Price (৳) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={1000000}
                      value={formState.discountedPrice}
                      onChange={(e) =>
                        setFormState({ ...formState, discountedPrice: Number(e.target.value) })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm font-mono focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Stock *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100000}
                      value={formState.stock}
                      onChange={(e) =>
                        setFormState({ ...formState, stock: Number(e.target.value) })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm font-mono focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Product Image URL *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={500}
                      value={formState.imageUrl}
                      onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-xs font-mono focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Image Alt Text (SEO)
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      value={formState.imageAlt}
                      onChange={(e) => setFormState({ ...formState, imageAlt: e.target.value })}
                      placeholder="Descriptive alt text with product keyword"
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Description (English) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={1000}
                    value={formState.description}
                    onChange={(e) =>
                      setFormState({ ...formState, description: e.target.value })
                    }
                    className="w-full p-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Description (Bangla)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={1200}
                    value={formState.descriptionBn}
                    onChange={(e) =>
                      setFormState({ ...formState, descriptionBn: e.target.value })
                    }
                    className="w-full p-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="inline-flex items-center gap-2 text-sm text-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.isFeatured}
                      onChange={(e) =>
                        setFormState({ ...formState, isFeatured: e.target.checked })
                      }
                      className="accent-[#0066FF]"
                    />
                    Featured Product
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.isBestSeller}
                      onChange={(e) =>
                        setFormState({ ...formState, isBestSeller: e.target.checked })
                      }
                      className="accent-[#0066FF]"
                    />
                    Best Seller
                  </label>
                </div>
              </div>
            ) : (
              <ProductSeoEditor
                formState={formState}
                allProducts={products}
                onChange={(updater) => {
                  setSlugTouched(true);
                  setFormState(updater);
                }}
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200">
              <div className="text-xs text-zinc-500">
                {modalTab === 'details' ? (
                  <button
                    type="button"
                    onClick={() => setModalTab('seo')}
                    className="font-semibold text-[#0066FF] hover:underline cursor-pointer"
                  >
                    Configure SEO Title, Meta Description &amp; Schema →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalTab('details')}
                    className="font-semibold text-zinc-700 hover:underline cursor-pointer"
                  >
                    ← Back to Product Info
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-10 px-4 rounded-lg border border-zinc-300 text-sm font-semibold text-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="h-10 px-6 rounded-lg bg-[#0066FF] text-white text-sm font-semibold hover:bg-[#0052CC] transition-colors cursor-pointer disabled:opacity-60"
                >
                  {savingProduct ? 'Saving...' : isNewProduct ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
