import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  Facebook,
  Globe,
  Link2,
  Monitor,
  Plus,
  Search,
  Settings2,
  Share2,
  Smartphone,
  Sparkles,
  Trash2,
  Twitter,
  X,
  XCircle,
} from 'lucide-react';
import {
  CustomMetaEntry,
  Product,
  ProductCategory,
  ProductSeo,
  SeoCheckResult,
} from '../types';
import {
  META_DESC_MAX,
  META_DESC_MIN,
  SEO_TITLE_MAX,
  SEO_TITLE_MIN,
  analyzeProductSeo,
  buildProductJsonLd,
  generateProductSlug,
  isSlugDuplicate,
  suggestMetaDescription,
  suggestSeoTitle,
  toAbsoluteUrl,
} from '../utils/seo';
import { SafeImage } from './SafeImage';

export interface ProductFormData {
  id: string;
  name: string;
  nameBn: string;
  category: ProductCategory;
  description: string;
  descriptionBn: string;
  originalPrice: number;
  discountedPrice: number;
  stock: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  sku: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  slug: string;
  brand: string;
  imageAlt: string;
  seo: ProductSeo;
}

interface ProductSeoEditorProps {
  formState: ProductFormData;
  allProducts: Product[];
  onChange: (updater: (prev: ProductFormData) => ProductFormData) => void;
}

type SeoTab = 'general' | 'analysis' | 'social' | 'schema' | 'advanced';

export const ProductSeoEditor: React.FC<ProductSeoEditorProps> = ({
  formState,
  allProducts,
  onChange,
}) => {
  const [seoTab, setSeoTab] = useState<SeoTab>('general');
  const [snippetDevice, setSnippetDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [socialPlatform, setSocialPlatform] = useState<'facebook' | 'twitter'>('facebook');
  const [additionalKwInput, setAdditionalKwInput] = useState('');
  const [customMetaName, setCustomMetaName] = useState('');
  const [customMetaContent, setCustomMetaContent] = useState('');
  const [copiedSchema, setCopiedSchema] = useState(false);

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://gadgetzone.com.bd';

  const cleanSlug = useMemo(
    () => generateProductSlug(formState.slug || formState.name || 'product'),
    [formState.slug, formState.name]
  );

  const duplicateSlug = useMemo(
    () => isSlugDuplicate(cleanSlug, formState.id, allProducts),
    [cleanSlug, formState.id, allProducts]
  );

  const analysis = useMemo(
    () =>
      analyzeProductSeo(
        {
          id: formState.id,
          name: formState.name,
          category: formState.category,
          description: formState.description,
          discountedPrice: formState.discountedPrice,
          imageUrl: formState.imageUrl,
          sku: formState.sku,
          slug: cleanSlug,
          brand: formState.brand,
          imageAlt: formState.imageAlt,
          seo: formState.seo,
        },
        allProducts
      ),
    [formState, cleanSlug, allProducts]
  );

  const jsonLdPreview = useMemo(
    () =>
      buildProductJsonLd(
        {
          ...formState,
          slug: cleanSlug,
        },
        origin
      ),
    [formState, cleanSlug, origin]
  );

  const updateSeoField = <K extends keyof ProductSeo>(
    key: K,
    value: ProductSeo[K]
  ) => {
    onChange((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        [key]: value,
      },
    }));
  };

  const titleLen = formState.seo.seoTitle.trim().length;
  const metaLen = formState.seo.metaDescription.trim().length;

  const titleStatus =
    titleLen >= SEO_TITLE_MIN && titleLen <= SEO_TITLE_MAX
      ? { label: 'Optimal (50–60)', cls: 'bg-emerald-100 text-emerald-800' }
      : titleLen >= 30 && titleLen <= 70
        ? { label: 'Acceptable', cls: 'bg-amber-100 text-amber-800' }
        : { label: titleLen === 0 ? 'Missing' : 'Out of Range', cls: 'bg-red-100 text-red-700' };

  const metaStatus =
    metaLen >= META_DESC_MIN && metaLen <= META_DESC_MAX
      ? { label: 'Optimal (150–160)', cls: 'bg-emerald-100 text-emerald-800' }
      : metaLen >= 110 && metaLen <= 175
        ? { label: 'Acceptable', cls: 'bg-amber-100 text-amber-800' }
        : { label: metaLen === 0 ? 'Missing' : 'Needs Optimization', cls: 'bg-red-100 text-red-700' };

  const effectiveCanonical =
    formState.seo.canonicalUrl.trim() || `${origin}/product/${cleanSlug}`;
  const previewTitle =
    formState.seo.seoTitle.trim() ||
    suggestSeoTitle(formState.name || 'Gadget Zone Product');
  const previewDesc =
    formState.seo.metaDescription.trim() ||
    formState.description.slice(0, 160) ||
    'Shop authentic mobile accessories at Gadget Zone Bangladesh with fast Cash on Delivery.';

  const ogPreviewTitle = formState.seo.ogTitle.trim() || previewTitle;
  const ogPreviewDesc = formState.seo.ogDescription.trim() || previewDesc;
  const ogPreviewImage = toAbsoluteUrl(
    formState.seo.ogImage.trim() || formState.imageUrl,
    origin
  );

  const twPreviewTitle = formState.seo.twitterTitle.trim() || ogPreviewTitle;
  const twPreviewDesc = formState.seo.twitterDescription.trim() || ogPreviewDesc;
  const twPreviewImage = toAbsoluteUrl(
    formState.seo.twitterImage.trim() || ogPreviewImage || formState.imageUrl,
    origin
  );

  const handleAddKeyword = () => {
    const clean = additionalKwInput.trim();
    if (!clean) return;
    if (
      formState.seo.additionalKeywords.some(
        (k) => k.toLowerCase() === clean.toLowerCase()
      )
    ) {
      setAdditionalKwInput('');
      return;
    }
    updateSeoField(
      'additionalKeywords',
      [...formState.seo.additionalKeywords, clean].slice(0, 15)
    );
    setAdditionalKwInput('');
  };

  const handleRemoveKeyword = (kw: string) => {
    updateSeoField(
      'additionalKeywords',
      formState.seo.additionalKeywords.filter((k) => k !== kw)
    );
  };

  const handleToggleInternalLink = (targetId: string) => {
    const exists = formState.seo.internalLinkTargets.includes(targetId);
    const next = exists
      ? formState.seo.internalLinkTargets.filter((id) => id !== targetId)
      : [...formState.seo.internalLinkTargets, targetId].slice(0, 8);
    updateSeoField('internalLinkTargets', next);
  };

  const handleAddCustomMeta = () => {
    const name = customMetaName.trim();
    const content = customMetaContent.trim();
    if (!name || !content) return;
    const next: CustomMetaEntry[] = [
      ...formState.seo.customMeta.filter((m) => m.name !== name),
      { name, content },
    ].slice(0, 10);
    updateSeoField('customMeta', next);
    setCustomMetaName('');
    setCustomMetaContent('');
  };

  const scoreTone =
    analysis.score >= 80
      ? {
          ring: 'border-emerald-500 text-emerald-700 bg-emerald-50',
          bar: 'bg-emerald-600',
          badge: 'bg-emerald-100 text-emerald-800',
        }
      : analysis.score >= 50
        ? {
            ring: 'border-amber-500 text-amber-700 bg-amber-50',
            bar: 'bg-amber-500',
            badge: 'bg-amber-100 text-amber-800',
          }
        : {
            ring: 'border-red-500 text-red-700 bg-red-50',
            bar: 'bg-red-600',
            badge: 'bg-red-100 text-red-700',
          };

  const renderCheckRow = (check: SeoCheckResult) => (
    <div
      key={check.id}
      className="p-3 rounded-xl border border-zinc-200 bg-white flex items-start gap-3"
    >
      {check.status === 'pass' ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
      ) : check.status === 'warning' ? (
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold text-zinc-950">{check.label}</p>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
              check.status === 'pass'
                ? 'bg-emerald-50 text-emerald-700'
                : check.status === 'warning'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-red-50 text-red-700'
            }`}
          >
            {check.status === 'pass'
              ? 'Passed'
              : check.status === 'warning'
                ? 'Improve'
                : 'Failed'}
          </span>
        </div>
        <p className="text-xs text-zinc-600 mt-0.5">{check.detail}</p>
        {check.status !== 'pass' && (
          <p className="text-[11px] text-[#0066FF] font-medium mt-1">
            Fix: {check.suggestion}
          </p>
        )}
      </div>
    </div>
  );

  const basicChecks = analysis.checks.filter((c) => c.group === 'basic');
  const additionalChecks = analysis.checks.filter((c) => c.group === 'additional');

  return (
    <div className="space-y-5">
      {/* Top Score Summary Banner */}
      <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center shrink-0 ${scoreTone.ring}`}
          >
            <span className="font-mono text-lg font-extrabold leading-none tabular-nums">
              {analysis.score}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider mt-0.5">
              / 100
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-sm font-bold text-zinc-950">
                Product SEO Score
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${scoreTone.badge}`}
              >
                {analysis.statusLabel}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {analysis.passedCount} passed · {analysis.warningCount} improvements ·{' '}
              {analysis.failedCount} failed (on-page checks only; does not guarantee rankings)
            </p>
          </div>
        </div>

        <div className="w-full sm:w-44 space-y-1">
          <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
            <div
              className={`h-full transition-all ${scoreTone.bar}`}
              style={{ width: `${analysis.score}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-500 text-right font-mono tabular-nums">
            {analysis.passedCount}/{analysis.checks.length} checks passed
          </p>
        </div>
      </div>

      {/* SEO Manager Sub-Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-zinc-200">
        {[
          { id: 'general' as const, label: 'General & Snippet', icon: Search },
          {
            id: 'analysis' as const,
            label: `SEO Analysis (${analysis.score})`,
            icon: CheckCircle2,
          },
          { id: 'social' as const, label: 'Social SEO', icon: Share2 },
          { id: 'schema' as const, label: 'Product Schema', icon: Code2 },
          { id: 'advanced' as const, label: 'Advanced SEO', icon: Settings2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = seoTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSeoTab(tab.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-zinc-950 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: GENERAL & LIVE GOOGLE SNIPPET PREVIEW */}
      {seoTab === 'general' && (
        <div className="space-y-5">
          {/* Live Google Search Snippet Preview */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-zinc-700 inline-flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#0066FF]" />
                Live Google Search Snippet Preview
              </span>
              <div className="inline-flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setSnippetDevice('desktop')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                    snippetDevice === 'desktop'
                      ? 'bg-zinc-950 text-white'
                      : 'text-zinc-600'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setSnippetDevice('mobile')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                    snippetDevice === 'mobile'
                      ? 'bg-zinc-950 text-white'
                      : 'text-zinc-600'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  Mobile
                </button>
              </div>
            </div>

            <div
              className={`p-4 sm:p-5 ${
                snippetDevice === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-zinc-950 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                      GZ
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-900 leading-tight">
                        Gadget Zone
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {origin}/product/{cleanSlug}
                      </p>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg font-medium text-[#1a0dab] leading-snug line-clamp-2">
                    {previewTitle}
                  </p>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed line-clamp-2">
                    <span className="font-semibold text-zinc-700">
                      ৳{formState.discountedPrice || 0} ·{' '}
                      {formState.stock > 0 ? 'In stock' : 'Out of stock'} —{' '}
                    </span>
                    {previewDesc}
                  </p>
                </div>
                {formState.imageUrl && (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                    <SafeImage
                      src={formState.imageUrl}
                      alt={formState.imageAlt || formState.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SEO Title */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                SEO Title (Recommended: 50–60 chars)
              </label>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${titleStatus.cls}`}>
                  {titleStatus.label}
                </span>
                <span className="font-mono text-xs text-zinc-500 tabular-nums">
                  {titleLen} / {SEO_TITLE_MAX}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateSeoField('seoTitle', suggestSeoTitle(formState.name))
                  }
                  className="px-2.5 py-1 rounded-md bg-blue-50 text-[#0066FF] text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-blue-100 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-Suggest
                </button>
              </div>
            </div>
            <input
              type="text"
              maxLength={160}
              value={formState.seo.seoTitle}
              onChange={(e) => updateSeoField('seoTitle', e.target.value)}
              placeholder={suggestSeoTitle(formState.name)}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
            />
          </div>

          {/* Meta Description */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                Meta Description (Recommended: 150–160 chars)
              </label>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${metaStatus.cls}`}>
                  {metaStatus.label}
                </span>
                <span className="font-mono text-xs text-zinc-500 tabular-nums">
                  {metaLen} / {META_DESC_MAX}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateSeoField(
                      'metaDescription',
                      suggestMetaDescription({
                        name: formState.name,
                        description: formState.description,
                        discountedPrice: formState.discountedPrice,
                        category: formState.category,
                      })
                    )
                  }
                  className="px-2.5 py-1 rounded-md bg-blue-50 text-[#0066FF] text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-blue-100 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-Suggest
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              maxLength={320}
              value={formState.seo.metaDescription}
              onChange={(e) => updateSeoField('metaDescription', e.target.value)}
              placeholder="Write a compelling summary including price in BDT, key specs, and Cash on Delivery..."
              className="w-full p-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
            />
          </div>

          {/* URL Slug & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  URL Slug (lowercase &amp; hyphens)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      slug: generateProductSlug(prev.name),
                    }))
                  }
                  className="text-[11px] font-semibold text-[#0066FF] hover:underline cursor-pointer"
                >
                  Generate from Name
                </button>
              </div>
              <div className="flex items-center rounded-lg border border-zinc-300 focus-within:border-[#0066FF] overflow-hidden">
                <span className="px-2.5 h-10 bg-zinc-50 border-r border-zinc-200 text-xs font-mono text-zinc-500 inline-flex items-center shrink-0">
                  /product/
                </span>
                <input
                  type="text"
                  maxLength={160}
                  value={formState.slug}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]+/g, '-')
                        .replace(/^-+/, ''),
                    }))
                  }
                  onBlur={() =>
                    onChange((prev) => ({
                      ...prev,
                      slug: generateProductSlug(prev.slug || prev.name),
                    }))
                  }
                  placeholder={generateProductSlug(formState.name)}
                  className="w-full h-10 px-3 text-xs font-mono text-zinc-900 focus:outline-none"
                />
              </div>
              {duplicateSlug && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  Duplicate slug detected: another product already uses “{cleanSlug}”.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Brand Name (for Product Schema)
              </label>
              <input
                type="text"
                maxLength={80}
                value={formState.brand}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, brand: e.target.value }))
                }
                placeholder="e.g. SoundCore, VoltEdge, Anker"
                className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
              />
            </div>
          </div>

          {/* Image Alt Text */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Product Image Alt Text (Accessibility &amp; Image SEO)
            </label>
            <input
              type="text"
              maxLength={200}
              value={formState.imageAlt}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, imageAlt: e.target.value }))
              }
              placeholder={`e.g. ${formState.name || 'Product'} in ${formState.category}`}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
            />
          </div>

          {/* Primary Focus Keyword & Additional Keywords */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Primary Focus Keyword
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={formState.seo.focusKeyword}
                  onChange={(e) => updateSeoField('focusKeyword', e.target.value)}
                  placeholder="e.g. ANC Wireless Earbuds"
                  className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm focus:outline-none focus:border-[#0066FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Additional Keywords (up to 15)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={80}
                    value={additionalKwInput}
                    onChange={(e) => setAdditionalKwInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    placeholder="Add keyword & press Enter"
                    className="flex-1 h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm focus:outline-none focus:border-[#0066FF]"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="h-10 px-3 rounded-lg bg-zinc-950 text-white text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#0066FF] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {formState.seo.additionalKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formState.seo.additionalKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-zinc-200 text-xs font-medium text-zinc-800"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      aria-label={`Remove ${kw}`}
                      className="text-zinc-400 hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Keyword Usage Matrix */}
            {analysis.keywordMatches.length > 0 && (
              <div className="overflow-x-auto pt-2 border-t border-zinc-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-zinc-500">
                      <th className="py-1.5 pr-3">Keyword</th>
                      <th className="py-1.5 px-2 text-center">SEO Title</th>
                      <th className="py-1.5 px-2 text-center">Meta Desc</th>
                      <th className="py-1.5 px-2 text-center">URL Slug</th>
                      <th className="py-1.5 px-2 text-center">Content</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/70">
                    {analysis.keywordMatches.map((km, idx) => (
                      <tr key={km.keyword}>
                        <td className="py-1.5 pr-3 font-medium text-zinc-900">
                          {km.keyword}
                          {idx === 0 && formState.seo.focusKeyword.trim() && (
                            <span className="ml-1.5 text-[10px] font-semibold text-[#0066FF]">
                              Primary
                            </span>
                          )}
                        </td>
                        {[km.inTitle, km.inMeta, km.inSlug, km.inDescription].map(
                          (ok, colIdx) => (
                            <td key={colIdx} className="py-1.5 px-2 text-center">
                              {ok ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-zinc-300 inline" />
                              )}
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RANK MATH-STYLE SEO ANALYSIS */}
      {seoTab === 'analysis' && (
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
              Basic SEO ({basicChecks.filter((c) => c.status === 'pass').length}/
              {basicChecks.length} Passed)
            </h4>
            <div className="space-y-2.5">{basicChecks.map(renderCheckRow)}</div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
              Additional SEO ({additionalChecks.filter((c) => c.status === 'pass').length}/
              {additionalChecks.length} Passed)
            </h4>
            <div className="space-y-2.5">{additionalChecks.map(renderCheckRow)}</div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SOCIAL SEO (FACEBOOK OG & TWITTER / X) */}
      {seoTab === 'social' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 bg-zinc-50">
              <button
                type="button"
                onClick={() => setSocialPlatform('facebook')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                  socialPlatform === 'facebook'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600'
                }`}
              >
                <Facebook className="w-3.5 h-3.5 text-[#0066FF]" />
                Facebook / Open Graph
              </button>
              <button
                type="button"
                onClick={() => setSocialPlatform('twitter')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                  socialPlatform === 'twitter'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600'
                }`}
              >
                <Twitter className="w-3.5 h-3.5 text-sky-500" />
                Twitter / X
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                onChange((prev) => ({
                  ...prev,
                  seo: {
                    ...prev.seo,
                    ogTitle: prev.seo.seoTitle || suggestSeoTitle(prev.name),
                    ogDescription:
                      prev.seo.metaDescription || prev.description.slice(0, 160),
                    ogImage: prev.seo.ogImage || prev.imageUrl,
                    twitterTitle: prev.seo.seoTitle || suggestSeoTitle(prev.name),
                    twitterDescription:
                      prev.seo.metaDescription || prev.description.slice(0, 160),
                    twitterImage: prev.seo.twitterImage || prev.imageUrl,
                  },
                }))
              }
              className="h-8 px-3 rounded-lg bg-blue-50 text-[#0066FF] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-blue-100 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Fill from General SEO
            </button>
          </div>

          {/* Live Social Share Card Preview */}
          <div className="max-w-lg rounded-xl border border-zinc-200 overflow-hidden bg-white shadow-xs">
            <div className="aspect-[1.91/1] bg-zinc-100 overflow-hidden border-b border-zinc-200">
              <SafeImage
                src={socialPlatform === 'facebook' ? ogPreviewImage : twPreviewImage}
                alt={formState.imageAlt || formState.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 bg-zinc-50">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                {origin.replace(/^https?:\/\//, '')}
              </p>
              <p className="text-sm font-bold text-zinc-950 mt-0.5 line-clamp-1">
                {socialPlatform === 'facebook' ? ogPreviewTitle : twPreviewTitle}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">
                {socialPlatform === 'facebook' ? ogPreviewDesc : twPreviewDesc}
              </p>
            </div>
          </div>

          {socialPlatform === 'facebook' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Open Graph Title
                </label>
                <input
                  type="text"
                  maxLength={160}
                  value={formState.seo.ogTitle}
                  onChange={(e) => updateSeoField('ogTitle', e.target.value)}
                  placeholder={previewTitle}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Open Graph Description
                </label>
                <textarea
                  rows={2}
                  maxLength={320}
                  value={formState.seo.ogDescription}
                  onChange={(e) => updateSeoField('ogDescription', e.target.value)}
                  placeholder={previewDesc}
                  className="w-full p-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Social Sharing Image URL (leave empty to use product image)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  value={formState.seo.ogImage}
                  onChange={(e) => updateSeoField('ogImage', e.target.value)}
                  placeholder={formState.imageUrl}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-xs font-mono focus:outline-none focus:border-[#0066FF]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Twitter / X Title
                </label>
                <input
                  type="text"
                  maxLength={160}
                  value={formState.seo.twitterTitle}
                  onChange={(e) => updateSeoField('twitterTitle', e.target.value)}
                  placeholder={ogPreviewTitle}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Twitter / X Description
                </label>
                <textarea
                  rows={2}
                  maxLength={320}
                  value={formState.seo.twitterDescription}
                  onChange={(e) => updateSeoField('twitterDescription', e.target.value)}
                  placeholder={ogPreviewDesc}
                  className="w-full p-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Twitter / X Image URL (leave empty to use OG / product image)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  value={formState.seo.twitterImage}
                  onChange={(e) => updateSeoField('twitterImage', e.target.value)}
                  placeholder={formState.imageUrl}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-xs font-mono focus:outline-none focus:border-[#0066FF]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: PRODUCT SCHEMA (JSON-LD) */}
      {seoTab === 'schema' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-zinc-950">
                  Automatic Schema.org Product JSON-LD
                </h4>
                <p className="text-xs text-zinc-500">
                  Embedded dynamically in both server-rendered HTML and client product pages.
                  Ratings &amp; reviews are included only when genuine reviews exist ({formState.reviewCount} reviews).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    JSON.stringify(jsonLdPreview, null, 2)
                  );
                  setCopiedSchema(true);
                  setTimeout(() => setCopiedSchema(false), 2000);
                }}
                className="h-8 px-3 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-800 inline-flex items-center gap-1.5 hover:border-[#0066FF] cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedSchema ? 'Copied JSON-LD' : 'Copy JSON-LD'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
              <div className="p-2 rounded-lg bg-white border border-zinc-200">
                <span className="text-zinc-500 block text-[10px] uppercase">Currency</span>
                <span className="font-mono font-bold text-zinc-950">BDT (৳)</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-zinc-200">
                <span className="text-zinc-500 block text-[10px] uppercase">Price</span>
                <span className="font-mono font-bold text-zinc-950">
                  {formState.discountedPrice}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-zinc-200">
                <span className="text-zinc-500 block text-[10px] uppercase">Availability</span>
                <span className="font-semibold text-zinc-950">
                  {formState.stock > 0 ? 'InStock' : 'OutOfStock'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-zinc-200">
                <span className="text-zinc-500 block text-[10px] uppercase">Brand / SKU</span>
                <span className="font-mono text-zinc-950 truncate block">
                  {formState.brand || '—'} · {formState.sku || '—'}
                </span>
              </div>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-zinc-950 text-zinc-100 text-xs font-mono overflow-x-auto leading-relaxed">
            {JSON.stringify(jsonLdPreview, null, 2)}
          </pre>
        </div>
      )}

      {/* SUB-TAB 5: ADVANCED SEO */}
      {seoTab === 'advanced' && (
        <div className="space-y-5">
          {/* Canonical URL */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="text-xs font-semibold text-zinc-700">
                Canonical URL (Leave blank for automatic URL)
              </label>
              <a
                href={`/product/${cleanSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-[#0066FF] inline-flex items-center gap-1 hover:underline"
              >
                Preview Page
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              maxLength={500}
              value={formState.seo.canonicalUrl}
              onChange={(e) => updateSeoField('canonicalUrl', e.target.value)}
              placeholder={`Auto: ${origin}/product/${cleanSlug}`}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-xs font-mono focus:outline-none focus:border-[#0066FF]"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Effective canonical: <span className="font-mono">{effectiveCanonical}</span>
            </p>
          </div>

          {/* Robots Meta Directives */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
              <p className="text-xs font-bold text-zinc-950">Robots Index Directive</p>
              <div className="flex gap-2">
                {(['index', 'noindex'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateSeoField('robotsIndex', opt)}
                    className={`flex-1 h-9 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      formState.seo.robotsIndex === opt
                        ? opt === 'index'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-red-600 border-red-600 text-white'
                        : 'bg-white border-zinc-300 text-zinc-700'
                    }`}
                  >
                    {opt === 'index' ? 'Index (Default)' : 'Noindex'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
              <p className="text-xs font-bold text-zinc-950">Robots Follow Directive</p>
              <div className="flex gap-2">
                {(['follow', 'nofollow'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateSeoField('robotsFollow', opt)}
                    className={`flex-1 h-9 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      formState.seo.robotsFollow === opt
                        ? opt === 'follow'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-amber-600 border-amber-600 text-white'
                        : 'bg-white border-zinc-300 text-zinc-700'
                    }`}
                  >
                    {opt === 'follow' ? 'Follow (Default)' : 'Nofollow'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Breadcrumb Settings */}
          <div className="p-4 rounded-xl border border-zinc-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Breadcrumb Settings
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Breadcrumb Title (defaults to product name)
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={formState.seo.breadcrumbTitle}
                  onChange={(e) => updateSeoField('breadcrumbTitle', e.target.value)}
                  placeholder={formState.name || 'Product Breadcrumb'}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#0066FF]"
                />
              </div>
              <label className="inline-flex items-center gap-2.5 text-sm text-zinc-800 cursor-pointer pt-4">
                <input
                  type="checkbox"
                  checked={formState.seo.showCategoryInBreadcrumb}
                  onChange={(e) =>
                    updateSeoField('showCategoryInBreadcrumb', e.target.checked)
                  }
                  className="accent-[#0066FF]"
                />
                Show Category ({formState.category}) in Breadcrumb Trail
              </label>
            </div>
          </div>

          {/* Internal Linking Picker */}
          <div className="p-4 rounded-xl border border-zinc-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 inline-flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#0066FF]" />
                Internal Linking (Related Products Shown on Product Page)
              </h4>
              <span className="font-mono text-xs text-zinc-500">
                {formState.seo.internalLinkTargets.length} / 8 selected
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {allProducts
                .filter((p) => p.id !== formState.id)
                .map((p) => {
                  const selected = formState.seo.internalLinkTargets.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                        selected
                          ? 'border-[#0066FF] bg-blue-50/50 text-zinc-950 font-semibold'
                          : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => handleToggleInternalLink(p.id)}
                        className="accent-[#0066FF]"
                      />
                      <span className="truncate">{p.name}</span>
                    </label>
                  );
                })}
            </div>
          </div>

          {/* Custom SEO Metadata */}
          <div className="p-4 rounded-xl border border-zinc-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Custom SEO Meta Tags (up to 10)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                maxLength={60}
                value={customMetaName}
                onChange={(e) => setCustomMetaName(e.target.value)}
                placeholder="meta name (e.g. author)"
                className="sm:col-span-2 h-9 px-3 rounded-lg border border-zinc-300 text-xs font-mono focus:outline-none focus:border-[#0066FF]"
              />
              <input
                type="text"
                maxLength={300}
                value={customMetaContent}
                onChange={(e) => setCustomMetaContent(e.target.value)}
                placeholder="content value"
                className="sm:col-span-2 h-9 px-3 rounded-lg border border-zinc-300 text-xs focus:outline-none focus:border-[#0066FF]"
              />
              <button
                type="button"
                onClick={handleAddCustomMeta}
                className="h-9 px-3 rounded-lg bg-zinc-950 text-white text-xs font-semibold hover:bg-[#0066FF] cursor-pointer"
              >
                Add Tag
              </button>
            </div>
            {formState.seo.customMeta.length > 0 && (
              <div className="space-y-1.5">
                {formState.seo.customMeta.map((entry) => (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs"
                  >
                    <div className="min-w-0 truncate">
                      <span className="font-mono font-semibold text-zinc-900">
                        {entry.name}
                      </span>{' '}
                      = <span className="text-zinc-600">{entry.content}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateSeoField(
                          'customMeta',
                          formState.seo.customMeta.filter((m) => m.name !== entry.name)
                        )
                      }
                      aria-label={`Remove ${entry.name}`}
                      className="text-zinc-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
