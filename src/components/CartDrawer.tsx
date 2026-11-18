import React from 'react';
import { ArrowRight, MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { CartItem, Language } from '../types';
import {
  buildWhatsAppOrderUrl,
  formatBDT,
  FREE_DELIVERY_THRESHOLD,
} from '../utils/formatters';
import { SafeImage } from './SafeImage';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  lang: Language;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  items,
  lang,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  if (!open) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.discountedPrice * item.quantity,
    0
  );
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progressPct = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));
  const whatsappUrl = buildWhatsAppOrderUrl(items);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
    >
      <div
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-zinc-950" />
            <h2 className="font-display text-lg font-bold text-zinc-950">
              {lang === 'bn' ? 'শপিং কার্ট' : 'Your Cart'}
            </h2>
            <span className="text-xs font-mono text-zinc-500 tabular-nums">
              ({items.reduce((s, i) => s + i.quantity, 0)})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Progress */}
        {items.length > 0 && (
          <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-200">
            <p className="text-xs font-medium text-zinc-700 mb-2">
              {remainingForFreeDelivery === 0
                ? lang === 'bn'
                  ? 'অভিনন্দন! আপনি ফ্রি ডেলিভারি পেয়েছেন।'
                  : 'Unlocked: Free nationwide delivery across Bangladesh.'
                : lang === 'bn'
                  ? `ফ্রি ডেলিভারির জন্য আরও ${formatBDT(remainingForFreeDelivery)} এর পণ্য যোগ করুন।`
                  : `Add ${formatBDT(remainingForFreeDelivery)} more for free nationwide delivery.`}
            </p>
            <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0066FF] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-zinc-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="font-display text-base font-semibold text-zinc-950 mb-1">
                {lang === 'bn' ? 'আপনার কার্ট খালি' : 'Your cart is empty'}
              </h3>
              <p className="text-sm text-zinc-500 max-w-xs mb-6">
                {lang === 'bn'
                  ? 'প্রিমিয়াম ইয়ারবাডস, চার্জার বা স্মার্ট ওয়াচ কার্টে যোগ করুন।'
                  : 'Explore wireless earbuds, 65W GaN chargers, and accessories to get started.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg bg-[#0066FF] text-white text-sm font-semibold hover:bg-[#0052CC] transition-colors cursor-pointer"
              >
                {lang === 'bn' ? 'শপিং চালিয়ে যান' : 'Browse Accessories'}
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div key={product.id} className="py-4 flex gap-4">
                <div className="w-20 h-20 rounded-lg bg-[#F4F5F7] overflow-hidden shrink-0 border border-zinc-200">
                  <SafeImage
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-zinc-950 line-clamp-2">
                      {lang === 'bn' && product.nameBn ? product.nameBn : product.name}
                    </h4>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(product.id)}
                      aria-label={`Remove ${product.name}`}
                      className="text-zinc-400 hover:text-red-600 p-1 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-mono text-xs text-zinc-500 mt-0.5 tabular-nums">
                    {formatBDT(product.discountedPrice)} each
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center border border-zinc-200 rounded-md">
                      <button
                        type="button"
                        onClick={() =>
                          quantity <= 1
                            ? onRemoveItem(product.id)
                            : onUpdateQuantity(product.id, quantity - 1)
                        }
                        aria-label="Decrease quantity"
                        className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-mono text-xs font-semibold tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuantity(
                            product.id,
                            Math.min(Math.max(1, product.stock), quantity + 1)
                          )
                        }
                        aria-label="Increase quantity"
                        className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="font-mono text-sm font-bold text-zinc-950 tabular-nums">
                      {formatBDT(product.discountedPrice * quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-zinc-200 bg-white space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 font-medium">
                {lang === 'bn' ? 'সাবটোটাল' : 'Subtotal'}
              </span>
              <span className="font-mono text-lg font-bold text-zinc-950 tabular-nums">
                {formatBDT(subtotal)}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              {lang === 'bn'
                ? 'ঢাকার ভেতরে ৭০৳ ও ঢাকার বাইরে ১৩০৳ ডেলিভারি চার্জ (৩,০০০৳+ অর্ডারে ফ্রি)।'
                : 'Cash on Delivery available nationwide · Free delivery over ৳3,000.'}
            </p>
            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full h-11 rounded-lg bg-[#0066FF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#0052CC] transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'চেকআউট করুন' : 'Proceed to Checkout'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-10 rounded-lg border border-zinc-200 text-zinc-800 text-xs font-semibold inline-flex items-center justify-center gap-2 hover:border-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              {lang === 'bn' ? 'হোয়াটসঅ্যাপে অর্ডার করুন' : 'Order via WhatsApp'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
