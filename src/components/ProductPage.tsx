import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Zap,
} from 'lucide-react';
import { Language, Product } from '../types';
import { CATEGORY_LABELS_BN, UI_COPY } from '../data/sampleProducts';
import {
  buildWhatsAppOrderUrl,
  calcDiscountPercent,
  formatBDT,
} from '../utils/formatters';
import {
  createDefaultProductSeo,
  findProductBySlug,
  resolveProductSlug,
} from '../utils/seo';
import {
  applyProductDocumentHead,
  resetStorefrontDocumentHead,
} from '../utils/headMeta';
import { SafeImage } from './SafeImage';

interface ProductPageProps {
  products: Product[];
  lang: Language;
  onAddToCart: (product: Product, qty: number) => void;
  onBuyNow: (product: Product, qty: number) => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  products,
  lang,
  onAddToCart,
  onBuyNow,
}) => {
  const { slug = '' } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);

  const product = useMemo(
    () => findProductBySlug(products, slug),
    [products, slug]
  );

  useEffect(() => {
    setQuantity(1);
    if (product) {
      applyProductDocumentHead(product);
    } else {
      resetStorefrontDocumentHead();
    }
    return () => {
      resetStorefrontDocumentHead();
    };
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const seo = createDefaultProductSeo(product);
    const targeted = seo.internalLinkTargets
      .map((id) => products.find((p) => p.id === id && p.id !== product.id))
      .filter((p): p is Product => Boolean(p));

    if (targeted.length >= 4) return targeted.slice(0, 4);

    const sameCategory = products.filter(
      (p) =>
        p.id !== product.id &&
        p.category === product.category &&
        !targeted.some((t) => t.id === p.id)
    );
    return [...targeted, ...sameCategory].slice(0, 4);
  }, [product, products]);

  if (!product) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="bg-white border border-zinc-200 rounded-2xl p-10">
          <h1 className="font-display text-2xl font-bold text-zinc-950 mb-2">
            Product Not Found
          </h1>
          <p className="text-sm text-zinc-600 mb-6">
            The product URL you requested could not be found in the Gadget Zone catalog.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-[#0066FF] text-white text-sm font-semibold hover:bg-[#0052CC] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Storefront
          </Link>
        </div>
      </section>
    );
  }

  const copy = UI_COPY[lang];
  const seo = createDefaultProductSeo(product);
  const discountPct = calcDiscountPercent(
    product.originalPrice,
    product.discountedPrice
  );
  const savings = product.originalPrice - product.discountedPrice;
  const outOfStock = product.stock <= 0;
  const displayName =
    lang === 'bn' && product.nameBn ? product.nameBn : product.name;
  const displayDesc =
    lang === 'bn' && product.descriptionBn
      ? product.descriptionBn
      : product.description;
  const displayCategory =
    lang === 'bn'
      ? CATEGORY_LABELS_BN[product.category] || product.category
      : product.category;
  const breadcrumbLabel = seo.breadcrumbTitle.trim() || displayName;
  const whatsappUrl = buildWhatsAppOrderUrl([{ product, quantity }]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500"
      >
        <Link to="/" className="hover:text-zinc-950 font-medium">
          Home
        </Link>
        {seo.showCategoryInBreadcrumb && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <Link to="/#shop" className="hover:text-zinc-950 font-medium">
              {displayCategory}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-zinc-950 font-semibold truncate max-w-md">
          {breadcrumbLabel}
        </span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-6 relative bg-[#F4F5F7] rounded-2xl border border-zinc-200 overflow-hidden aspect-[4/3]">
          <SafeImage
            src={product.imageUrl}
            alt={product.imageAlt || displayName}
            className="w-full h-full object-cover"
          />
          {discountPct > 0 && (
            <span className="absolute top-4 left-4 px-3 py-1 rounded bg-zinc-950 text-white text-xs font-mono font-semibold tabular-nums">
              -{discountPct}%
            </span>
          )}
        </div>

        <div className="lg:col-span-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="uppercase tracking-wider font-semibold text-[#0066FF]">
              {displayCategory}
            </span>
            {product.brand && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-zinc-800">{product.brand}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="font-mono">{product.sku}</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 leading-tight">
            {displayName}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 font-semibold text-zinc-900 tabular-nums">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {product.rating.toFixed(1)}
            </span>
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-600 tabular-nums">
              {product.reviewCount} reviews
            </span>
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

          <div className="flex items-baseline gap-3 pb-5 border-b border-zinc-200">
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

          <p className="text-sm sm:text-base text-zinc-700 leading-relaxed">
            {displayDesc}
          </p>

          {/* Quantity Stepper */}
          <div className="flex items-center gap-4 pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {lang === 'bn' ? 'পরিমাণ' : 'Quantity'}
            </span>
            <div className="inline-flex items-center border border-zinc-200 rounded-lg">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-10 h-10 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-mono text-sm font-semibold tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(Math.max(1, product.stock), q + 1)
                  )
                }
                aria-label="Increase quantity"
                className="w-10 h-10 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Primary Purchase Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => onAddToCart(product, quantity)}
              className="h-12 px-5 rounded-lg bg-zinc-950 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              {copy.addToCart}
            </button>
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => onBuyNow(product, quantity)}
              className="h-12 px-5 rounded-lg bg-[#0066FF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#0052CC] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {copy.buyNow}
            </button>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-4 rounded-lg border border-zinc-200 text-zinc-800 text-xs font-semibold inline-flex items-center justify-center gap-2 hover:border-emerald-600 hover:text-emerald-700 transition-colors w-full"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            {lang === 'bn'
              ? 'হোয়াটসঅ্যাপে অর্ডার করুন'
              : 'Order Instantly via WhatsApp'}
          </a>

          <div className="pt-4 border-t border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#0066FF] shrink-0" />
              <span>Dhaka 24h · Nationwide 48–72h Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0066FF] shrink-0" />
              <span>7-Day Official Replacement Warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Accessories / Internal Links */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-zinc-200 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-bold text-zinc-950">
              {lang === 'bn' ? 'সম্পর্কিত গ্যাজেটসমূহ' : 'Recommended Accessories'}
            </h2>
            <Link
              to="/"
              className="text-xs font-semibold text-[#0066FF] hover:underline"
            >
              Browse All Products →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedProducts.map((rel) => {
              const relSlug = resolveProductSlug(rel);
              const relName =
                lang === 'bn' && rel.nameBn ? rel.nameBn : rel.name;
              return (
                <Link
                  key={rel.id}
                  to={`/product/${relSlug}`}
                  className="group bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-300 hover:shadow-md transition-all flex flex-col"
                >
                  <div className="aspect-[4/3] bg-[#F4F5F7] overflow-hidden">
                    <SafeImage
                      src={rel.imageUrl}
                      alt={rel.imageAlt || relName}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                      {rel.category}
                    </span>
                    <h3 className="font-display text-sm font-semibold text-zinc-950 group-hover:text-[#0066FF] line-clamp-2 mt-1 mb-2">
                      {relName}
                    </h3>
                    <p className="mt-auto font-mono text-sm font-bold text-zinc-950 tabular-nums">
                      {formatBDT(rel.discountedPrice)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
