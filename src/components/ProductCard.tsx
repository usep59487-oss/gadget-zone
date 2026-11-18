import React, { useState } from 'react';
import { Check, ShoppingCart, Star, Zap } from 'lucide-react';
import { Language, Product } from '../types';
import { CATEGORY_LABELS_BN, UI_COPY } from '../data/sampleProducts';
import { calcDiscountPercent, formatBDT } from '../utils/formatters';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
  lang: Language;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  lang,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
}) => {
  const [added, setAdded] = useState(false);
  const copy = UI_COPY[lang];
  const discountPct = calcDiscountPercent(product.originalPrice, product.discountedPrice);
  const outOfStock = product.stock <= 0;
  const displayName = lang === 'bn' && product.nameBn ? product.nameBn : product.name;
  const displayCategory =
    lang === 'bn' ? CATEGORY_LABELS_BN[product.category] || product.category : product.category;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    onBuyNow(product);
  };

  return (
    <article
      onClick={() => onSelectProduct(product)}
      className="group flex flex-col bg-white border border-zinc-200 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-zinc-300 cursor-pointer"
    >
      {/* 4:3 Studio Media Container */}
      <div className="relative aspect-[4/3] w-full bg-[#F4F5F7] overflow-hidden">
        <SafeImage
          src={product.imageUrl}
          alt={displayName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {discountPct > 0 && (
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-zinc-950 text-white text-[11px] font-mono font-semibold tabular-nums">
            -{discountPct}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-red-600 text-white text-[11px] font-semibold">
            {copy.outOfStock}
          </span>
        )}
      </div>

      {/* Product Body */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 mb-1.5">
          <span className="uppercase tracking-wider font-medium truncate">
            {displayCategory}
          </span>
          <span className="inline-flex items-center gap-1 shrink-0 tabular-nums text-zinc-700 font-medium">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            {product.rating.toFixed(1)}
            <span className="text-zinc-400">({product.reviewCount})</span>
          </span>
        </div>

        <h3 className="font-display text-base font-semibold text-zinc-950 leading-snug line-clamp-2 mb-3 group-hover:text-[#0066FF] transition-colors">
          {displayName}
        </h3>

        {/* Price Row */}
        <div className="mt-auto pt-3 border-t border-zinc-100">
          <div className="flex items-baseline gap-2.5 mb-3.5">
            <span className="font-mono text-lg font-bold text-zinc-950 tabular-nums">
              {formatBDT(product.discountedPrice)}
            </span>
            {product.originalPrice > product.discountedPrice && (
              <span className="font-mono text-xs text-zinc-400 line-through tabular-nums">
                {formatBDT(product.originalPrice)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={outOfStock}
              onClick={handleAdd}
              className={`h-10 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                added
                  ? 'bg-zinc-950 text-white'
                  : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {lang === 'bn' ? 'যুক্ত হয়েছে' : 'Added'}
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {copy.addToCart}
                </>
              )}
            </button>

            <button
              type="button"
              disabled={outOfStock}
              onClick={handleBuy}
              className="h-10 px-3 rounded-lg bg-[#0066FF] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#0052CC] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-3.5 h-3.5" />
              {copy.buyNow}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
