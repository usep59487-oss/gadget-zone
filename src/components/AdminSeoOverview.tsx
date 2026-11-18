import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Search,
  Sparkles,
} from 'lucide-react';
import { Product } from '../types';
import {
  analyzeProductSeo,
  createDefaultProductSeo,
  resolveProductSlug,
} from '../utils/seo';
import { SafeImage } from './SafeImage';

interface AdminSeoOverviewProps {
  products: Product[];
  onEditProductSeo: (product: Product) => void;
}

type ScoreBandFilter = 'all' | '80-100' | '50-79' | '0-49';
type StatusFilter =
  | 'all'
  | 'optimized'
  | 'needs-work'
  | 'missing-meta'
  | 'missing-title'
  | 'missing-keyword'
  | 'noindex';

export const AdminSeoOverview: React.FC<AdminSeoOverviewProps> = ({
  products,
  onEditProductSeo,
}) => {
  const [search, setSearch] = useState('');
  const [scoreBand, setScoreBand] = useState<ScoreBandFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const analyzedRows = useMemo(() => {
    return products.map((product) => {
      const seo = createDefaultProductSeo(product);
      const slug = resolveProductSlug(product);
      const report = analyzeProductSeo(product, products);
      const hasTitle = seo.seoTitle.trim().length > 0;
      const hasMeta = seo.metaDescription.trim().length > 0;
      const hasKeyword = seo.focusKeyword.trim().length > 0;
      const isNoindex = seo.robotsIndex === 'noindex';
      return {
        product,
        seo,
        slug,
        report,
        hasTitle,
        hasMeta,
        hasKeyword,
        isNoindex,
      };
    });
  }, [products]);

  const metrics = useMemo(() => {
    const total = analyzedRows.length;
    const optimized = analyzedRows.filter((r) => r.report.score >= 80).length;
    const missingMeta = analyzedRows.filter((r) => !r.hasMeta).length;
    const missingTitle = analyzedRows.filter((r) => !r.hasTitle).length;
    const missingKeyword = analyzedRows.filter((r) => !r.hasKeyword).length;
    const avgScore =
      total > 0
        ? Math.round(
            analyzedRows.reduce((sum, r) => sum + r.report.score, 0) / total
          )
        : 0;
    return {
      total,
      optimized,
      missingMeta,
      missingTitle,
      missingKeyword,
      avgScore,
    };
  }, [analyzedRows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return analyzedRows.filter((row) => {
      if (scoreBand === '80-100' && row.report.score < 80) return false;
      if (scoreBand === '50-79' && (row.report.score < 50 || row.report.score >= 80))
        return false;
      if (scoreBand === '0-49' && row.report.score >= 50) return false;

      if (statusFilter === 'optimized' && row.report.score < 80) return false;
      if (statusFilter === 'needs-work' && row.report.score >= 80) return false;
      if (statusFilter === 'missing-meta' && row.hasMeta) return false;
      if (statusFilter === 'missing-title' && row.hasTitle) return false;
      if (statusFilter === 'missing-keyword' && row.hasKeyword) return false;
      if (statusFilter === 'noindex' && !row.isNoindex) return false;

      if (!q) return true;
      return (
        row.product.name.toLowerCase().includes(q) ||
        row.product.sku.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q) ||
        row.seo.focusKeyword.toLowerCase().includes(q)
      );
    });
  }, [analyzedRows, search, scoreBand, statusFilter]);

  return (
    <div className="space-y-6 print:hidden">
      {/* 6 SEO Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Total Products
          </p>
          <p className="font-mono text-2xl font-bold text-zinc-950 mt-1 tabular-nums">
            {metrics.total}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            SEO Optimized
          </p>
          <p className="font-mono text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
            {metrics.optimized}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Missing Meta Desc
          </p>
          <p className="font-mono text-2xl font-bold text-red-600 mt-1 tabular-nums">
            {metrics.missingMeta}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Missing SEO Title
          </p>
          <p className="font-mono text-2xl font-bold text-amber-600 mt-1 tabular-nums">
            {metrics.missingTitle}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Missing Focus KW
          </p>
          <p className="font-mono text-2xl font-bold text-amber-600 mt-1 tabular-nums">
            {metrics.missingKeyword}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Avg SEO Score
          </p>
          <p className="font-mono text-2xl font-bold text-[#0066FF] mt-1 tabular-nums">
            {metrics.avgScore}
            <span className="text-xs font-normal text-zinc-400">/100</span>
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by product, slug, SKU, or focus keyword..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0066FF]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={scoreBand}
            onChange={(e) => setScoreBand(e.target.value as ScoreBandFilter)}
            aria-label="Filter by SEO score"
            className="h-10 px-3 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[#0066FF]"
          >
            <option value="all">All SEO Scores</option>
            <option value="80-100">80–100 (Optimized)</option>
            <option value="50-79">50–79 (Needs Improvement)</option>
            <option value="0-49">0–49 (Needs Attention)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filter by optimization status"
            className="h-10 px-3 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[#0066FF]"
          >
            <option value="all">All Statuses</option>
            <option value="optimized">SEO Optimized</option>
            <option value="needs-work">Needs Optimization</option>
            <option value="missing-meta">Missing Meta Description</option>
            <option value="missing-title">Missing SEO Title</option>
            <option value="missing-keyword">Missing Focus Keyword</option>
            <option value="noindex">Noindex Products</option>
          </select>
        </div>
      </div>

      {/* Product SEO Audit Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-4">Product &amp; Slug</th>
                <th className="py-3 px-4">Focus Keyword</th>
                <th className="py-3 px-4">SEO Title</th>
                <th className="py-3 px-4">Meta Description</th>
                <th className="py-3 px-4">Robots</th>
                <th className="py-3 px-4">SEO Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-zinc-500">
                    No products match the selected SEO filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map(
                  ({
                    product,
                    seo,
                    slug,
                    report,
                    hasTitle,
                    hasMeta,
                    hasKeyword,
                    isNoindex,
                  }) => {
                    const scoreColor =
                      report.score >= 80
                        ? 'text-emerald-700 bg-emerald-100'
                        : report.score >= 50
                          ? 'text-amber-800 bg-amber-100'
                          : 'text-red-700 bg-red-100';

                    return (
                      <tr key={product.id} className="hover:bg-zinc-50/70">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-lg bg-[#F4F5F7] border border-zinc-200 overflow-hidden shrink-0">
                              <SafeImage
                                src={product.imageUrl}
                                alt={product.imageAlt || product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-950 truncate max-w-[210px]">
                                {product.name}
                              </p>
                              <p className="font-mono text-[11px] text-zinc-500 truncate max-w-[210px]">
                                /product/{slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {hasKeyword ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0066FF] text-xs font-semibold">
                              {seo.focusKeyword}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Missing
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 max-w-[200px]">
                          {hasTitle ? (
                            <div>
                              <p className="text-xs text-zinc-800 truncate">
                                {seo.seoTitle}
                              </p>
                              <p className="font-mono text-[10px] text-zinc-400">
                                {seo.seoTitle.trim().length} chars
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-red-600 font-medium">
                              Missing SEO Title
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 max-w-[220px]">
                          {hasMeta ? (
                            <div>
                              <p className="text-xs text-zinc-700 truncate">
                                {seo.metaDescription}
                              </p>
                              <p className="font-mono text-[10px] text-zinc-400">
                                {seo.metaDescription.trim().length} chars
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-red-600 font-medium">
                              Missing Meta Desc
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                              isNoindex
                                ? 'bg-red-100 text-red-700'
                                : 'bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            {seo.robotsIndex}, {seo.robotsFollow}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-xs font-bold tabular-nums ${scoreColor}`}
                            >
                              {report.score}
                            </span>
                            {report.score >= 80 && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <a
                              href={`/product/${slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open Customer Product Page"
                              className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => onEditProductSeo(product)}
                              className="h-8 px-3 rounded-lg bg-zinc-950 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#0066FF] transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Optimize SEO
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
