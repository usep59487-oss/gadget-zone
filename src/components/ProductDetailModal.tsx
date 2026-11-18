import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck, X, Zap } from 'lucide-react';
import { Language, Product } from '../types';
import { CATEGORY_LABELS_BN, UI_COPY } from '../data/sampleProducts';
import { buildWhatsAppOrderUrl, calcDiscountPercent, formatBDT } from '../utils/formatters';
import { resolveProductSlug } from '../utils/seo';
import { SafeImage } from './SafeImage';

interface ProductDetailModalProps {
  product: Product | null;
  lang: Language;
  onClose: () => void;
  onAddToCart: (product: Product, qty: number) => void;
  onBuyNow: (product: Product, qty: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  lang,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const copy = UI_COPY[lang];
  const discountPct = calcDiscountPercent(product.originalPrice, product.discountedPrice);
  const savings = product.originalPrice - product.discountedPrice;
  const outOfStock = product.stock <= 0;
  const displayName = lang === 'bn' && product.nameBn ? product.nameBn : product.name;
  const displayDesc =
    lang === 'bn' && product.descriptionBn ? product.descriptionBn : product.description;
  const displayCategory =
    lang === 'bn' ? CATEGORY_LABELS_BN[product.category] || product.category : product.category;

  const whatsappUrl = buildWhatsAppOrderUrl([{ product, quantity }]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={displayName}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-zinc-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Studio Gallery Left */}
          <div className="relative bg-[#F4F5F7] aspect-[4/3] md:aspect-auto md:min-h-[420px]">
            <SafeImage
              src={product.imageUrl}
              alt={product.imageAlt || displayName}
              className="w-full h-full object-cover"
            />
            {discountPct > 0 && (
              <span className="absolute top-4 left-4 px-2.5 py-1 rounded bg-zinc-950 text-white text-xs font-mono font-semibold tabular-nums">
                -{discountPct}%
              </span>
            )}
          </div>

          {/* Contiguous Purchase Module Right */}
          <div className="p-6 sm:p-8 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="uppercase tracking-wider font-semibold text-[#0066FF]">
                  {displayCategory}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{product.sku}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close product details"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="font-display text-2xl font-bold text-zinc-950 leading-tight mb-2">
              {displayName}
            </h2>

            <div className="flex items-center gap-3 text-sm mb-4">
              <span className="inline-flex items-center gap-1 font-semibold text-zinc-900 tabular-nums">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {product.rating.toFixed(1)}
              </span>
              <span className="text-zinc-400">·</span>
              <span className="text-zinc-600 tabular-nums">{product.reviewCount} reviews</span>
              <span className="text-zinc-400">·</span>
              <span
                className={`font-semibold ${
                  outOfStock ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {outOfStock
                  ? copy.outOfStock
                  : `${copy.inStock} (${product.stock})`}
              </span>
            </div>

            <div className="flex items-baseline gap-3 pb-4 mb-4 border-b border-zinc-200">
              <span className="font-mono text-3xl font-bold text-zinc-950 tabular-nums">
                {formatBDT(product.discountedPrice)}
              </span>
              {savings > 0 && (
                <>
                  <span className="font-mono text-base text-zinc-400 line-through tabular-nums">
                    {formatBDT(product.originalPrice)}
                  </span>
                  <span className="text-xs font-semibold text-[#0066FF] tabular-nums">
                    Save {formatBDT(savings)}
                  </span>
                </>
              )}
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed mb-6">{displayDesc}</p>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-4 mb-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {lang === 'bn' ? 'পরিমাণ' : 'Quantity'}
              </span>
              <div className="inline-flex items-center border border-zinc-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-mono text-sm font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                  aria-label="Increase quantity"
                  className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Primary CTAs */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                disabled={outOfStock}
                onClick={() => {
                  onAddToCart(product, quantity);
                  onClose();
                }}
                className="h-11 px-4 rounded-lg bg-zinc-950 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                {copy.addToCart}
              </button>
              <button
                type="button"
                disabled={outOfStock}
                onClick={() => {
                  onBuyNow(product, quantity);
                  onClose();
                }}
                className="h-11 px-4 rounded-lg bg-[#0066FF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#0052CC] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                {copy.buyNow}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-lg border border-zinc-200 text-zinc-800 text-xs font-semibold inline-flex items-center justify-center gap-2 hover:border-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                {lang === 'bn' ? 'হোয়াটসঅ্যাপে অর্ডার করুন' : 'Order via WhatsApp'}
              </a>
              <Link
                to={`/product/${resolveProductSlug(product)}`}
                onClick={onClose}
                className="h-10 px-4 rounded-lg border border-zinc-200 text-zinc-800 text-xs font-semibold inline-flex items-center justify-center gap-2 hover:border-[#0066FF] hover:text-[#0066FF] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {lang === 'bn' ? 'পূর্ণ বিবরণ দেখুন' : 'View Full Product Page'}
              </Link>
            </div>

            <div className="mt-auto pt-4 border-t border-zinc-100 grid grid-cols-2 gap-3 text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#0066FF] shrink-0" />
                <span>Dhaka 24h · Nationwide 48-72h</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0066FF] shrink-0" />
                <span>7-Day Replacement Warranty</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
