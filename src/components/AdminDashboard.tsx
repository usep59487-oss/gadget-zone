import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Database,
  Edit3,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
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
  deleteProductById,
  seedSampleProducts,
  subscribeToAllOrders,
  updateOrderStatus,
  upsertProduct,
} from '../services/storeService';
import { calcDiscountPercent, formatBDT, sanitizeId } from '../utils/formatters';
import { SafeImage } from './SafeImage';

interface AdminDashboardProps {
  products: Product[];
  isFirestoreEmpty: boolean;
  onBackToStore: () => void;
}

type AdminTab = 'products' | 'orders';

const EMPTY_FORM: Omit<Product, 'createdAt' | 'updatedAt'> = {
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
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  isFirestoreEmpty,
  onBackToStore,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [productSearch, setProductSearch] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Add/Edit Product Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(true);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [savingProduct, setSavingProduct] = useState(false);
  const [formError, setFormError] = useState('');

  // Inline Delete Confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState('');

  useEffect(() => {
    const unsub = subscribeToAllOrders(
      (list) => setOrders(list),
      () => setOrders([])
    );
    return () => unsub();
  }, []);

  const flashNotice = (msg: string) => {
    setStatusFeedback(msg);
    setTimeout(() => setStatusFeedback(''), 2500);
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
    setFormState({
      ...EMPTY_FORM,
      sku: `GZ-${Math.floor(100 + Math.random() * 899)}`,
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setIsNewProduct(false);
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
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (formState.name.trim().length < 2) {
      setFormError('Product name must be at least 2 characters.');
      return;
    }
    if (formState.originalPrice <= 0 || formState.discountedPrice <= 0) {
      setFormError('Prices must be greater than 0 BDT.');
      return;
    }
    if (formState.discountedPrice > formState.originalPrice) {
      setFormError('Discounted price cannot exceed original price.');
      return;
    }

    setSavingProduct(true);
    try {
      const targetId = isNewProduct
        ? sanitizeId(`${formState.name}-${Date.now().toString().slice(-4)}`)
        : formState.id;
      await upsertProduct({ ...formState, id: targetId }, isNewProduct);
      setModalOpen(false);
      flashNotice(isNewProduct ? 'Product added.' : 'Product updated.');
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
    setConfirmDeleteId(null);
    flashNotice('Product deleted.');
  };

  const handleOrderStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    await updateOrderStatus(orderId, nextStatus);
    flashNotice(`Order status updated to ${nextStatus}.`);
  };

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

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'All') return orders;
    return orders.filter((o) => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + o.total, 0),
    [orders]
  );
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending').length;
  const lowStockCount = products.filter((p) => p.stock <= 10).length;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 mb-8">
        <div>
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-950 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Storefront
          </button>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950">
            Gadget Zone Admin Console
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isFirestoreEmpty && (
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedCatalog}
              className="h-10 px-4 rounded-lg border border-zinc-300 bg-white text-zinc-900 text-xs font-semibold inline-flex items-center gap-2 hover:border-[#0066FF] hover:text-[#0066FF] transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4" />
              {seeding ? 'Syncing...' : 'Sync Sample Catalog to Firestore'}
            </button>
          )}
          <button
            type="button"
            onClick={openCreateModal}
            className="h-10 px-4 rounded-lg bg-[#0066FF] text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#0052CC] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {statusFeedback && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-zinc-950 text-white text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-[#0066FF]" />
          {statusFeedback}
        </div>
      )}

      {/* Overview KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Active Revenue
          </p>
          <p className="font-mono text-2xl font-bold text-zinc-950 mt-1 tabular-nums">
            {formatBDT(totalRevenue)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Pending Orders
          </p>
          <p className="font-mono text-2xl font-bold text-[#0066FF] mt-1 tabular-nums">
            {pendingOrdersCount}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Catalog SKUs
          </p>
          <p className="font-mono text-2xl font-bold text-zinc-950 mt-1 tabular-nums">
            {products.length}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Low Stock Alerts
          </p>
          <p className="font-mono text-2xl font-bold text-zinc-950 mt-1 tabular-nums">
            {lowStockCount}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg w-fit mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-md text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'products'
              ? 'bg-white text-zinc-950 shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950'
          }`}
        >
          <Package className="w-4 h-4" />
          Products & Inventory ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-md text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-white text-zinc-950 shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Customer Orders ({orders.length})
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
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
                Showing initial sample products. Click “Sync Sample Catalog to Firestore” above to
                save &amp; edit them in Firestore.
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
                        {confirmDeleteId === product.id ? (
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
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1 rounded border border-zinc-300 text-xs font-semibold text-zinc-700 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(product)}
                              aria-label={`Edit ${product.name}`}
                              className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-[#0066FF] transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {!isFirestoreEmpty && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(product.id)}
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

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['All', ...ORDER_STATUSES] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setOrderStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  orderStatusFilter === status
                    ? 'bg-zinc-950 text-white'
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-950'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center text-sm text-zinc-500">
              No customer orders match the selected filter yet.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-base font-bold text-zinc-950">
                          {order.orderNumber}
                        </span>
                        <span className="text-zinc-400">·</span>
                        <span className="text-sm font-semibold text-zinc-900">
                          {order.customerName}
                        </span>
                        <span className="text-zinc-400">·</span>
                        <span className="font-mono text-xs text-zinc-600">{order.phone}</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {order.address}, {order.district}, {order.division}
                        {order.notes ? ` — Note: ${order.notes}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-lg font-bold text-zinc-950 tabular-nums">
                        {formatBDT(order.total)}
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleOrderStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        aria-label={`Order status for ${order.orderNumber}`}
                        className="h-9 px-3 rounded-lg border border-zinc-300 text-xs font-semibold text-zinc-900 bg-white focus:outline-none focus:border-[#0066FF]"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-zinc-700">
                    {order.items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between bg-zinc-50 px-3 py-2 rounded-lg"
                      >
                        <span className="truncate pr-2">
                          {item.quantity}× {item.name}
                        </span>
                        <span className="font-mono font-semibold tabular-nums shrink-0">
                          {formatBDT(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={isNewProduct ? 'Add New Product' : 'Edit Product'}
        >
          <form
            onSubmit={handleSaveProduct}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-zinc-200 shadow-2xl my-auto space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h2 className="font-display text-xl font-bold text-zinc-950">
                {isNewProduct ? 'Add New Product' : `Edit ${formState.name}`}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}

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
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                Description (English) *
              </label>
              <textarea
                rows={2}
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

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
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
          </form>
        </div>
      )}
    </section>
  );
};
