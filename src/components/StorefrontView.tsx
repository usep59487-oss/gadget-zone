import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  Check,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Tag,
  Truck,
} from 'lucide-react';
import {
  Language,
  PRODUCT_CATEGORIES,
  Product,
  ProductCategory,
  SortOption,
} from '../types';
import {
  CATEGORY_IMAGES,
  CATEGORY_LABELS_BN,
  CUSTOMER_TESTIMONIALS,
  HERO_IMAGE,
  OFFER_BANNER_IMAGE,
  UI_COPY,
} from '../data/sampleProducts';
import {
  STORE_ADDRESS_BN,
  STORE_ADDRESS_EN,
  STORE_EMAIL,
  STORE_PHONE_DISPLAY,
  STORE_WHATSAPP_NUMBER,
  calcDiscountPercent,
} from '../utils/formatters';
import { subscribeNewsletter } from '../services/storeService';
import { ProductCard } from './ProductCard';
import { SafeImage } from './SafeImage';

interface StorefrontViewProps {
  lang: Language;
  products: Product[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: ProductCategory | 'All';
  onSelectCategory: (cat: ProductCategory | 'All') => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateSection: (sectionId: string) => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  lang,
  products,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  sortBy,
  onSortChange,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  onNavigateSection,
}) => {
  const copy = UI_COPY[lang];
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterMsg, setNewsletterMsg] = useState('');

  const featuredProducts = useMemo(
    () => products.filter((p) => p.isFeatured).slice(0, 6),
    [products]
  );

  const bestSellingProducts = useMemo(
    () => products.filter((p) => p.isBestSeller).slice(0, 6),
    [products]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [products]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      const catMatch = selectedCategory === 'All' || p.category === selectedCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.nameBn.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.discountedPrice - b.discountedPrice;
        case 'price-desc':
          return b.discountedPrice - a.discountedPrice;
        case 'discount':
          return (
            calcDiscountPercent(b.originalPrice, b.discountedPrice) -
            calcDiscountPercent(a.originalPrice, a.discountedPrice)
          );
        case 'rating':
          return b.rating - a.rating;
        case 'featured':
        default:
          return Number(b.isFeatured) - Number(a.isFeatured);
      }
    });
  }, [products, searchQuery, selectedCategory, sortBy]);

  const handleCategoryPick = (cat: ProductCategory) => {
    onSelectCategory(cat);
    onNavigateSection('shop');
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setNewsletterStatus('error');
      setNewsletterMsg('Please enter a valid email address.');
      return;
    }
    setNewsletterStatus('loading');
    try {
      await subscribeNewsletter(email);
      setNewsletterStatus('success');
      setNewsletterMsg(
        lang === 'bn'
          ? 'সাবস্ক্রিপশন সম্পন্ন হয়েছে! ধন্যবাদ।'
          : 'Subscribed! Watch your inbox for restock alerts and exclusive BDT offers.'
      );
      setNewsletterEmail('');
    } catch {
      setNewsletterStatus('error');
      setNewsletterMsg('Unable to subscribe right now. Please try again.');
    }
  };

  return (
    <div id="top">
      {/* 1. Hero Section */}
      <section className="relative bg-zinc-950 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#3B82F6]">
                {lang === 'bn'
                  ? 'বাংলাদেশ অফিসিয়াল মোবাইল এক্সেসরিজ স্টোর'
                  : 'Official Mobile Accessories Store · Bangladesh'}
              </p>
              <h1
                className="font-display font-extrabold tracking-tight text-white leading-[1.08]"
                style={{
                  fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)',
                  textWrap: 'balance',
                }}
              >
                {copy.heroHeadline}
              </h1>
              <p className="text-base sm:text-lg text-zinc-300 max-w-xl leading-relaxed">
                {copy.heroSubtitle}{' '}
                <span className="text-zinc-400">
                  {lang === 'bn'
                    ? 'ঢাকায় ২৪ ঘণ্টায় এবং সারাদেশে ক্যাশ অন ডেলিভারি।'
                    : 'Genuine GaN chargers, ANC audio, power banks, and smart wearables with nationwide Cash on Delivery.'}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateSection('shop')}
                  className="h-12 px-7 rounded-lg bg-[#0066FF] text-white text-sm font-bold inline-flex items-center gap-2 hover:bg-[#0052CC] transition-colors cursor-pointer"
                >
                  {copy.shopNow}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateSection('categories')}
                  className="h-12 px-6 rounded-lg border border-zinc-700 text-zinc-200 text-sm font-semibold hover:border-white hover:text-white transition-colors cursor-pointer"
                >
                  {copy.exploreCategories}
                </button>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-400">
                <span>Cash on Delivery</span>
                <span aria-hidden="true">·</span>
                <span>7-Day Replacement</span>
                <span aria-hidden="true">·</span>
                <span>Free Delivery ৳3,000+</span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl">
                <SafeImage
                  src={HERO_IMAGE}
                  alt="Gadget Zone flagship mobile accessories collection"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Product Categories (All 9 Categories) */}
      <section
        id="categories"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 border-b border-zinc-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              {copy.categoriesTitle}
            </h2>
            <p className="text-sm text-zinc-600 mt-1.5">{copy.categoriesSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelectCategory('All');
              onNavigateSection('shop');
            }}
            className="text-sm font-semibold text-[#0066FF] hover:underline inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            {copy.allCategories}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {PRODUCT_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryPick(category)}
                className={`group text-left rounded-xl border p-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0066FF] bg-blue-50/40'
                    : 'border-zinc-200 bg-white hover:border-zinc-400 hover:-translate-y-0.5'
                }`}
              >
                <div className="aspect-[4/3] rounded-lg bg-[#F4F5F7] overflow-hidden mb-3">
                  <SafeImage
                    src={CATEGORY_IMAGES[category]}
                    alt={category}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="font-display text-sm font-semibold text-zinc-950 truncate">
                  {lang === 'bn' ? CATEGORY_LABELS_BN[category] : category}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5 font-mono tabular-nums">
                  {categoryCounts[category] || 0}{' '}
                  {categoryCounts[category] === 1 ? 'item' : 'items'}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 border-b border-zinc-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              {copy.featuredTitle}
            </h2>
            <p className="text-sm text-zinc-600 mt-1.5">{copy.featuredSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection('shop')}
            className="text-sm font-semibold text-[#0066FF] hover:underline inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            View Full Catalog
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              lang={lang}
              onAddToCart={onAddToCart}
              onBuyNow={onBuyNow}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* 4. Special Offers Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
          <SafeImage
            src={OFFER_BANNER_IMAGE}
            alt="Gadget Zone Special Bundle Offer"
            className="w-full h-[360px] sm:h-[400px] object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/25 flex items-center">
            <div className="p-6 sm:p-12 max-w-xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#3B82F6]">
                {lang === 'bn' ? 'সীমিত সময়ের স্পেশাল অফার' : 'Limited Time Bangladesh Offer'}
              </p>
              <h2
                className="font-display text-2xl sm:text-4xl font-extrabold text-white leading-tight"
                style={{ textWrap: 'balance' }}
              >
                {copy.offerTitle}
              </h2>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                {copy.offerSubtitle}
              </p>
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('All');
                  onSortChange('discount');
                  onNavigateSection('shop');
                }}
                className="h-11 px-6 rounded-lg bg-[#0066FF] text-white text-sm font-bold inline-flex items-center gap-2 hover:bg-[#0052CC] transition-colors cursor-pointer"
              >
                {copy.offerCta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Interactive Shop Catalog (Search, Category Filter, Price Sort) */}
      <section
        id="shop"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 border-b border-zinc-200"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              {copy.shopCatalogTitle}
            </h2>
            <p className="text-sm text-zinc-600 mt-1.5">{copy.shopCatalogSubtitle}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search name, SKU..."
                aria-label="Filter catalog by search"
                className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-[#0066FF]"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-zinc-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                aria-label="Sort products"
                className="h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-800 focus:outline-none focus:border-[#0066FF]"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High (৳)</option>
                <option value="price-desc">Price: High to Low (৳)</option>
                <option value="discount">Highest Discount (%)</option>
                <option value="rating">Top Customer Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
          <button
            type="button"
            onClick={() => onSelectCategory('All')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-zinc-950 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            {copy.allCategories} ({products.length})
          </button>
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0066FF] text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {lang === 'bn' ? CATEGORY_LABELS_BN[cat] : cat}
            </button>
          ))}
        </div>

        {filteredCatalog.length === 0 ? (
          <div className="border border-zinc-200 rounded-2xl p-12 text-center bg-zinc-50">
            <h3 className="font-display text-lg font-bold text-zinc-950 mb-1">
              No matching accessories found
            </h3>
            <p className="text-sm text-zinc-600 mb-5">
              Try clearing your search term or switching back to all categories.
            </p>
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onSelectCategory('All');
              }}
              className="px-5 py-2.5 rounded-lg bg-[#0066FF] text-white text-sm font-semibold hover:bg-[#0052CC] transition-colors cursor-pointer"
            >
              Reset Catalog Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredCatalog.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                lang={lang}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6. Best Selling Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 border-b border-zinc-200">
        <div className="mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
            {copy.bestSellingTitle}
          </h2>
          <p className="text-sm text-zinc-600 mt-1.5">{copy.bestSellingSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {bestSellingProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              lang={lang}
              onAddToCart={onAddToCart}
              onBuyNow={onBuyNow}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* 7. Why Choose Us & About Us */}
      <section
        id="about"
        className="bg-zinc-50 border-b border-zinc-200 py-14 sm:py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              {copy.whyTitle}
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 mt-2 leading-relaxed">
              {lang === 'bn'
                ? 'গ্যাজেট জোন বাংলাদেশের প্রতিটি জেলায় আসল ও ওয়ারেন্টিযুক্ত মোবাইল এক্সেসরিজ পৌঁছে দিচ্ছে নির্ভরতার সাথে।'
                : 'Built for smartphone users in Bangladesh who demand authentic hardware, transparent BDT pricing, and reliable after-sales warranty.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                icon: Award,
                title: '100% Quality Products',
                desc: 'Sealed, authentic accessories tested before dispatch.',
              },
              {
                icon: Tag,
                title: 'Best Prices',
                desc: 'Direct-import BDT pricing with seasonal bundle savings.',
              },
              {
                icon: Truck,
                title: 'Fast Delivery',
                desc: '24–48h inside Dhaka and 2–4 days nationwide across BD.',
              },
              {
                icon: ShieldCheck,
                title: 'Secure Payment',
                desc: 'Pay Cash on Delivery after inspecting your package.',
              },
              {
                icon: Headphones,
                title: 'Customer Support',
                desc: 'Dedicated Dhaka support & instant WhatsApp assistance.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white border border-zinc-200 rounded-xl p-5"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-zinc-950 mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 border-b border-zinc-200">
        <div className="mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
            {copy.reviewsTitle}
          </h2>
          <p className="text-sm text-zinc-600 mt-1.5">{copy.reviewsSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CUSTOMER_TESTIMONIALS.map((review) => (
            <blockquote
              key={review.id}
              className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: review.rating }).map((_, idx) => (
                    <Star
                      key={idx}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-sm text-zinc-700 leading-relaxed mb-5">
                  “{lang === 'bn' ? review.quoteBn : review.quote}”
                </p>
              </div>
              <footer className="pt-4 border-t border-zinc-100">
                <p className="text-sm font-bold text-zinc-950">{review.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {review.role} · {review.city}
                </p>
                <p className="text-[11px] font-medium text-[#0066FF] mt-1">
                  Verified Purchase: {review.productName}
                </p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* 9. Newsletter Subscription & Contact Section */}
      <section
        id="contact"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Newsletter */}
          <div className="lg:col-span-7 bg-zinc-950 text-white rounded-2xl p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                {copy.newsletterTitle}
              </h2>
              <p className="text-sm text-zinc-400 max-w-lg mb-6 leading-relaxed">
                {copy.newsletterSubtitle}
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={copy.newsletterPlaceholder}
                  aria-label="Email address for newsletter"
                  className="flex-1 h-12 px-4 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#0066FF]"
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === 'loading'}
                  className="h-12 px-6 rounded-lg bg-[#0066FF] text-white text-sm font-bold hover:bg-[#0052CC] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
                >
                  {newsletterStatus === 'loading' ? 'Subscribing...' : copy.newsletterBtn}
                </button>
              </div>
              {newsletterMsg && (
                <p
                  className={`text-xs font-medium flex items-center gap-1.5 ${
                    newsletterStatus === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {newsletterStatus === 'success' && <Check className="w-4 h-4" />}
                  {newsletterMsg}
                </p>
              )}
            </form>
          </div>

          {/* Direct Bangladesh Contact Card */}
          <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-zinc-950 mb-2">
                {lang === 'bn' ? 'ঢাকা সাপোর্ট ও অর্ডার ডেস্ক' : 'Dhaka Dispatch & Support'}
              </h2>
              <p className="text-sm text-zinc-600 mb-6">
                Need compatibility advice for iPhone, Samsung, Xiaomi, or OnePlus devices? Reach our
                team directly.
              </p>
              <ul className="space-y-3 text-sm text-zinc-700">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
                  <span>{lang === 'bn' ? STORE_ADDRESS_BN : STORE_ADDRESS_EN}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#0066FF] shrink-0" />
                  <span className="font-mono">{STORE_PHONE_DISPLAY}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#0066FF] shrink-0" />
                  <span>{STORE_EMAIL}</span>
                </li>
              </ul>
            </div>

            <a
              href={`https://wa.me/${STORE_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 h-11 px-5 rounded-lg bg-zinc-950 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#0066FF] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {lang === 'bn' ? 'হোয়াটসঅ্যাপে চ্যাট করুন' : 'Chat on WhatsApp'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
