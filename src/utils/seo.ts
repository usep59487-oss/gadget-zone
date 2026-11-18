import {
  PRODUCT_CATEGORIES,
  type Product,
  type ProductSeo,
  type SeoAnalysisReport,
  type SeoCheckResult,
} from '../types.ts';

export const SEO_TITLE_MIN = 50;
export const SEO_TITLE_MAX = 60;
export const META_DESC_MIN = 150;
export const META_DESC_MAX = 160;

export function generateProductSlug(input: string): string {
  const cleaned = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 120)
    .replace(/-+$/g, '');
  return cleaned || 'gadget-zone-product';
}

export function resolveProductSlug(
  product: Pick<Product, 'id' | 'name' | 'slug'>
): string {
  if (product.slug && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(product.slug)) {
    return product.slug;
  }
  return generateProductSlug(product.name || product.id || 'product');
}

export function findProductBySlug(
  products: Product[],
  slugOrId: string
): Product | undefined {
  const normalized = slugOrId.trim().toLowerCase();
  return products.find(
    (p) =>
      resolveProductSlug(p).toLowerCase() === normalized ||
      p.id.toLowerCase() === normalized
  );
}

export function isSlugDuplicate(
  candidateSlug: string,
  currentProductId: string,
  allProducts: Product[]
): boolean {
  const clean = generateProductSlug(candidateSlug);
  if (!clean) return false;
  return allProducts.some(
    (p) =>
      p.id !== currentProductId &&
      resolveProductSlug(p).toLowerCase() === clean
  );
}

export function suggestSeoTitle(name: string): string {
  const cleanName = name.trim() || 'Mobile Accessory';
  const suffixLong = ' – Price in Bangladesh | Gadget Zone';
  const suffixMed = ' – Price in BD | Gadget Zone';
  const suffixShort = ' | Gadget Zone';

  const candidates = [
    `${cleanName}${suffixLong}`,
    `${cleanName}${suffixMed}`,
    `${cleanName}${suffixShort}`,
    cleanName,
  ];

  for (const candidate of candidates) {
    if (candidate.length >= SEO_TITLE_MIN && candidate.length <= SEO_TITLE_MAX) {
      return candidate;
    }
  }

  const best = `${cleanName}${suffixMed}`;
  if (best.length <= SEO_TITLE_MAX) return best;
  return best.slice(0, SEO_TITLE_MAX).replace(/\s+\S*$/, '').trim() || cleanName.slice(0, SEO_TITLE_MAX);
}

export function suggestMetaDescription(
  product: Pick<Product, 'name' | 'description' | 'discountedPrice' | 'category'>
): string {
  const name = product.name.trim() || 'Gadget Zone accessory';
  const priceText = product.discountedPrice > 0 ? ` at ৳${product.discountedPrice}` : '';
  const descClean = product.description.replace(/\s+/g, ' ').trim();
  const base = `Buy ${name}${priceText} at Gadget Zone Bangladesh. ${
    descClean || `Genuine ${product.category} with 7-day warranty & fast nationwide Cash on Delivery.`
  }`;

  if (base.length <= META_DESC_MAX && base.length >= META_DESC_MIN) {
    return base;
  }

  if (base.length < META_DESC_MIN) {
    const padded = `${base} Fast Cash on Delivery across 64 districts in Bangladesh with official warranty.`;
    if (padded.length <= META_DESC_MAX) return padded;
    return padded.slice(0, META_DESC_MAX - 1).replace(/\s+\S*$/, '').trim() + '.';
  }

  const trimmed = base.slice(0, META_DESC_MAX - 1).replace(/\s+\S*$/, '').trim();
  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
}

export function createDefaultProductSeo(partial?: Partial<Product>): ProductSeo {
  const existing = partial?.seo;
  return {
    seoTitle: existing?.seoTitle ?? '',
    metaDescription: existing?.metaDescription ?? '',
    focusKeyword: existing?.focusKeyword ?? '',
    additionalKeywords: Array.isArray(existing?.additionalKeywords)
      ? existing.additionalKeywords
      : [],
    canonicalUrl: existing?.canonicalUrl ?? '',
    robotsIndex: existing?.robotsIndex === 'noindex' ? 'noindex' : 'index',
    robotsFollow: existing?.robotsFollow === 'nofollow' ? 'nofollow' : 'follow',
    breadcrumbTitle: existing?.breadcrumbTitle ?? '',
    showCategoryInBreadcrumb:
      typeof existing?.showCategoryInBreadcrumb === 'boolean'
        ? existing.showCategoryInBreadcrumb
        : true,
    internalLinkTargets: Array.isArray(existing?.internalLinkTargets)
      ? existing.internalLinkTargets
      : [],
    ogTitle: existing?.ogTitle ?? '',
    ogDescription: existing?.ogDescription ?? '',
    ogImage: existing?.ogImage ?? '',
    twitterTitle: existing?.twitterTitle ?? '',
    twitterDescription: existing?.twitterDescription ?? '',
    twitterImage: existing?.twitterImage ?? '',
    customMeta: Array.isArray(existing?.customMeta) ? existing.customMeta : [],
  };
}

function containsKeyword(haystack: string, keyword: string): boolean {
  const k = keyword.trim().toLowerCase();
  if (!k) return false;
  return haystack.toLowerCase().includes(k);
}

function containsKeywordInSlug(slug: string, keyword: string): boolean {
  const kSlug = generateProductSlug(keyword);
  if (!kSlug) return false;
  if (slug.toLowerCase().includes(kSlug)) return true;
  const words = kSlug.split('-').filter((w) => w.length >= 2);
  return words.length > 0 && words.every((w) => slug.toLowerCase().includes(w));
}

export function toAbsoluteUrl(urlOrPath: string, origin: string): string {
  const trimmed = urlOrPath.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${cleanOrigin}${cleanPath}`;
}

export function analyzeProductSeo(
  product: Partial<Product> &
    Pick<
      Product,
      'id' | 'name' | 'category' | 'description' | 'discountedPrice' | 'imageUrl'
    >,
  allProducts: Product[]
): SeoAnalysisReport {
  const seo = createDefaultProductSeo(product);
  const slug = resolveProductSlug({
    id: product.id || '',
    name: product.name || '',
    slug: product.slug,
  });
  const seoTitle = seo.seoTitle.trim();
  const metaDesc = seo.metaDescription.trim();
  const focus = seo.focusKeyword.trim();
  const description = (product.description || '').trim();
  const imageAlt = (product.imageAlt || '').trim();
  const imageUrl = (product.imageUrl || '').trim();

  const otherProducts = allProducts.filter((p) => p.id !== product.id);
  const checks: SeoCheckResult[] = [];

  // 1. Focus keyword in SEO Title (weight 12)
  checks.push({
    id: 'focus-in-title',
    group: 'basic',
    label: 'Focus keyword in SEO title',
    status: !focus
      ? 'fail'
      : containsKeyword(seoTitle, focus)
        ? 'pass'
        : 'fail',
    detail: !focus
      ? 'No primary focus keyword set.'
      : containsKeyword(seoTitle, focus)
        ? `Primary keyword "${focus}" found in SEO title.`
        : `Primary keyword "${focus}" is missing from SEO title.`,
    suggestion: !focus
      ? 'Enter a primary focus keyword customers search for (e.g., "anc wireless earbuds").'
      : `Include "${focus}" naturally near the beginning of your SEO title.`,
    weight: 12,
  });

  // 2. Focus keyword in Meta Description (weight 10)
  checks.push({
    id: 'focus-in-meta',
    group: 'basic',
    label: 'Focus keyword in meta description',
    status: !focus
      ? 'fail'
      : containsKeyword(metaDesc, focus)
        ? 'pass'
        : 'fail',
    detail: !focus
      ? 'No primary focus keyword set.'
      : containsKeyword(metaDesc, focus)
        ? `Primary keyword "${focus}" appears in meta description.`
        : `Primary keyword "${focus}" is missing from meta description.`,
    suggestion: !focus
      ? 'Set a primary focus keyword first.'
      : `Add "${focus}" into your meta description along with pricing or delivery info.`,
    weight: 10,
  });

  // 3. Focus keyword in URL Slug (weight 8)
  checks.push({
    id: 'focus-in-slug',
    group: 'basic',
    label: 'Focus keyword in URL slug',
    status: !focus
      ? 'fail'
      : containsKeywordInSlug(slug, focus)
        ? 'pass'
        : 'warning',
    detail: !focus
      ? 'Cannot check URL slug without a focus keyword.'
      : containsKeywordInSlug(slug, focus)
        ? `Slug "/product/${slug}" includes the focus keyword terms.`
        : `Slug "/product/${slug}" does not contain all focus keyword terms.`,
    suggestion: focus
      ? `Update URL slug to include "${generateProductSlug(focus)}".`
      : 'Set a primary focus keyword to verify slug relevance.',
    weight: 8,
  });

  // 4. Focus keyword in Product Description (weight 10)
  checks.push({
    id: 'focus-in-desc',
    group: 'basic',
    label: 'Focus keyword in product description',
    status: !focus
      ? 'fail'
      : containsKeyword(description, focus)
        ? 'pass'
        : 'fail',
    detail: !focus
      ? 'No focus keyword specified.'
      : containsKeyword(description, focus)
        ? `Focus keyword "${focus}" found in product content.`
        : `Focus keyword "${focus}" not found in product description.`,
    suggestion: focus
      ? `Mention "${focus}" naturally in the product description.`
      : 'Add a primary focus keyword and include it in the product description.',
    weight: 10,
  });

  // 5. SEO Title length (50–60 recommended) (weight 10)
  const titleLen = seoTitle.length;
  checks.push({
    id: 'title-length',
    group: 'basic',
    label: `SEO title length (${titleLen} chars)`,
    status:
      titleLen >= SEO_TITLE_MIN && titleLen <= SEO_TITLE_MAX
        ? 'pass'
        : titleLen >= 30 && titleLen <= 70
          ? 'warning'
          : 'fail',
    detail:
      titleLen === 0
        ? 'SEO title is empty.'
        : titleLen >= SEO_TITLE_MIN && titleLen <= SEO_TITLE_MAX
          ? `Optimal length (${titleLen} characters, target ${SEO_TITLE_MIN}–${SEO_TITLE_MAX}).`
          : `Current length is ${titleLen} characters (recommended ${SEO_TITLE_MIN}–${SEO_TITLE_MAX}).`,
    suggestion:
      titleLen === 0
        ? 'Use Auto-Suggest Title or write a 50–60 character SEO title.'
        : titleLen < SEO_TITLE_MIN
          ? `Add ${SEO_TITLE_MIN - titleLen} more characters (e.g., brand or "Gadget Zone").`
          : `Trim ${titleLen - SEO_TITLE_MAX} characters to avoid search snippet truncation.`,
    weight: 10,
  });

  // 6. Meta Description length (150–160 recommended) (weight 10)
  const metaLen = metaDesc.length;
  checks.push({
    id: 'meta-length',
    group: 'basic',
    label: `Meta description length (${metaLen} chars)`,
    status:
      metaLen >= META_DESC_MIN && metaLen <= META_DESC_MAX
        ? 'pass'
        : metaLen >= 110 && metaLen <= 175
          ? 'warning'
          : 'fail',
    detail:
      metaLen === 0
        ? 'Meta description is missing.'
        : metaLen >= META_DESC_MIN && metaLen <= META_DESC_MAX
          ? `Optimal length (${metaLen} characters, target ${META_DESC_MIN}–${META_DESC_MAX}).`
          : `Current length is ${metaLen} characters (recommended ${META_DESC_MIN}–${META_DESC_MAX}).`,
    suggestion:
      metaLen === 0
        ? 'Add a 150–160 character meta description or click Auto-Suggest.'
        : metaLen < META_DESC_MIN
          ? `Expand description by ${META_DESC_MIN - metaLen} characters with key specs or Cash on Delivery info.`
          : `Shorten by ${metaLen - META_DESC_MAX} characters so it fits cleanly in search snippets.`,
    weight: 10,
  });

  // 7. Product Description length (weight 8)
  const descLen = description.length;
  checks.push({
    id: 'desc-length',
    group: 'basic',
    label: `Product description length (${descLen} chars)`,
    status: descLen >= 150 ? 'pass' : descLen >= 70 ? 'warning' : 'fail',
    detail:
      descLen >= 150
        ? `Detailed product copy (${descLen} characters).`
        : `Product description is ${descLen} characters (recommended 150+ characters).`,
    suggestion:
      'Write at least 150 characters covering specs, compatibility, battery/power, and warranty.',
    weight: 8,
  });

  // 8. Product image alt text (weight 6)
  const altHasFocus = focus ? containsKeyword(imageAlt, focus) : false;
  checks.push({
    id: 'image-alt',
    group: 'additional',
    label: 'Product image alt text',
    status:
      imageAlt.length >= 10 && (!focus || altHasFocus)
        ? 'pass'
        : imageAlt.length > 0
          ? 'warning'
          : 'fail',
    detail:
      imageAlt.length === 0
        ? 'No image alt text set.'
        : focus && !altHasFocus
          ? `Alt text is set (${imageAlt.length} chars) without the focus keyword.`
          : `Descriptive image alt text configured (${imageAlt.length} chars).`,
    suggestion: !imageAlt
      ? 'Add descriptive image alt text naming the product and key features.'
      : `Include "${focus}" naturally inside the image alt text.`,
    weight: 6,
  });

  // 9. Internal linking (weight 5)
  const hasDescLink = /\/(product|shop|category)\/[a-z0-9-]+/i.test(description);
  const linkCount = seo.internalLinkTargets.length + (hasDescLink ? 1 : 0);
  checks.push({
    id: 'internal-links',
    group: 'additional',
    label: 'Internal linking',
    status: linkCount >= 2 ? 'pass' : linkCount === 1 ? 'warning' : 'fail',
    detail:
      linkCount === 0
        ? 'No related internal product links selected.'
        : `${linkCount} internal store link(s) configured for product page cross-linking.`,
    suggestion:
      'Select 2 or more related accessories in Advanced SEO -> Internal Linking to improve site crawl depth.',
    weight: 5,
  });

  // 10. Product category selection (weight 4)
  const validCategory = PRODUCT_CATEGORIES.includes(product.category);
  checks.push({
    id: 'category-selected',
    group: 'additional',
    label: 'Product category selection',
    status: validCategory ? 'pass' : 'fail',
    detail: validCategory
      ? `Categorized under "${product.category}".`
      : 'No valid product category selected.',
    suggestion: 'Assign the product to one of the 9 Gadget Zone categories.',
    weight: 4,
  });

  // 11. Image optimization (weight 5)
  const isCleanImageFormat = /\.(jpg|jpeg|png|webp|avif)(\?.*)?$/i.test(imageUrl);
  const hasImageUrl = imageUrl.length > 0;
  checks.push({
    id: 'image-optimization',
    group: 'additional',
    label: 'Image optimization',
    status:
      hasImageUrl && isCleanImageFormat && imageAlt.length >= 5
        ? 'pass'
        : hasImageUrl
          ? 'warning'
          : 'fail',
    detail: !hasImageUrl
      ? 'Product image URL is missing.'
      : isCleanImageFormat && imageAlt.length >= 5
        ? 'Product image uses web-friendly format with alt attribute.'
        : 'Image present, but missing alt text or standard web image extension (.jpg/.webp/.png).',
    suggestion:
      'Ensure a fast-loading .jpg/.webp/.png image URL and descriptive alt text are provided.',
    weight: 5,
  });

  // 12. Product schema availability (weight 6)
  const hasCoreSchema = Boolean(
    product.name?.trim() &&
      imageUrl &&
      description &&
      product.discountedPrice > 0
  );
  const hasRichSchema = Boolean(
    hasCoreSchema && product.sku?.trim() && product.brand?.trim()
  );
  checks.push({
    id: 'schema-readiness',
    group: 'additional',
    label: 'Product JSON-LD schema availability',
    status: hasRichSchema ? 'pass' : hasCoreSchema ? 'warning' : 'fail',
    detail: hasRichSchema
      ? 'Complete Product JSON-LD (Name, Image, Price BDT, Availability, SKU & Brand) ready.'
      : hasCoreSchema
        ? 'Core Product schema ready; add Brand and SKU for richer structured data.'
        : 'Missing core fields required for valid Product structured data.',
    suggestion:
      'Fill in Product Name, Image, Description, Sale Price, SKU, and Brand name.',
    weight: 6,
  });

  // 13. Unique SEO title (weight 3)
  const duplicateTitle =
    seoTitle.length > 0 &&
    otherProducts.some(
      (p) => (p.seo?.seoTitle || '').trim().toLowerCase() === seoTitle.toLowerCase()
    );
  checks.push({
    id: 'unique-title',
    group: 'additional',
    label: 'Unique SEO title',
    status: seoTitle.length === 0 ? 'fail' : duplicateTitle ? 'fail' : 'pass',
    detail:
      seoTitle.length === 0
        ? 'Cannot verify uniqueness while SEO title is empty.'
        : duplicateTitle
          ? 'Another product in your catalog uses this exact SEO title.'
          : 'SEO title is unique across all catalog products.',
    suggestion: 'Give every product a distinct SEO title to avoid duplicate SERP titles.',
    weight: 3,
  });

  // 14. Unique meta description (weight 3)
  const duplicateMeta =
    metaDesc.length > 0 &&
    otherProducts.some(
      (p) =>
        (p.seo?.metaDescription || '').trim().toLowerCase() ===
        metaDesc.toLowerCase()
    );
  checks.push({
    id: 'unique-meta',
    group: 'additional',
    label: 'Unique meta description',
    status: metaDesc.length === 0 ? 'fail' : duplicateMeta ? 'fail' : 'pass',
    detail:
      metaDesc.length === 0
        ? 'Cannot verify uniqueness while meta description is empty.'
        : duplicateMeta
          ? 'Another product already uses this exact meta description.'
          : 'Meta description is unique across your product catalog.',
    suggestion: 'Write a unique meta description tailored to this specific product.',
    weight: 3,
  });

  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earnedWeight = checks.reduce((sum, c) => {
    if (c.status === 'pass') return sum + c.weight;
    if (c.status === 'warning') return sum + c.weight * 0.5;
    return sum;
  }, 0);

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const passedCount = checks.filter((c) => c.status === 'pass').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const failedCount = checks.filter((c) => c.status === 'fail').length;
  const statusLabel =
    score >= 80
      ? 'Optimized'
      : score >= 50
        ? 'Needs Improvement'
        : 'Needs Attention';

  const allKeywords = [
    focus,
    ...seo.additionalKeywords.map((k) => k.trim()),
  ].filter(Boolean);

  const keywordMatches = allKeywords.map((kw) => ({
    keyword: kw,
    inTitle: containsKeyword(seoTitle, kw),
    inMeta: containsKeyword(metaDesc, kw),
    inSlug: containsKeywordInSlug(slug, kw),
    inDescription: containsKeyword(description, kw),
  }));

  return {
    score,
    statusLabel,
    passedCount,
    warningCount,
    failedCount,
    checks,
    keywordMatches,
  };
}

export function buildProductJsonLd(
  product: Product,
  origin: string
): Record<string, unknown> {
  const slug = resolveProductSlug(product);
  const seo = createDefaultProductSeo(product);
  const productUrl =
    seo.canonicalUrl.trim() || `${origin.replace(/\/+$/, '')}/product/${slug}`;
  const absoluteImage = toAbsoluteUrl(product.imageUrl, origin);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: absoluteImage ? [absoluteImage] : [],
    description: seo.metaDescription.trim() || product.description,
    url: productUrl,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'BDT',
      price: String(product.discountedPrice),
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  if (product.sku?.trim()) {
    schema.sku = product.sku.trim();
  }

  if (product.brand?.trim()) {
    schema.brand = {
      '@type': 'Brand',
      name: product.brand.trim(),
    };
  }

  if (product.reviewCount > 0 && product.rating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(product.rating.toFixed(1)),
      reviewCount: Math.round(product.reviewCount),
    };
  }

  return schema;
}

export interface ResolvedProductHeadMeta {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  customMeta: { name: string; content: string }[];
  jsonLd: Record<string, unknown>;
}

export function resolveProductHeadMeta(
  product: Product,
  origin: string
): ResolvedProductHeadMeta {
  const seo = createDefaultProductSeo(product);
  const slug = resolveProductSlug(product);
  const cleanOrigin = origin.replace(/\/+$/, '');
  const defaultCanonical = `${cleanOrigin}/product/${slug}`;

  const title = seo.seoTitle.trim() || `${product.name} | Gadget Zone Bangladesh`;
  const description =
    seo.metaDescription.trim() ||
    product.description.slice(0, 160) ||
    `Buy ${product.name} at ৳${product.discountedPrice} from Gadget Zone Bangladesh.`;
  const canonicalUrl = seo.canonicalUrl.trim() || defaultCanonical;
  const robots = `${seo.robotsIndex}, ${seo.robotsFollow}`;

  const ogTitle = seo.ogTitle.trim() || title;
  const ogDescription = seo.ogDescription.trim() || description;
  const ogImage = toAbsoluteUrl(seo.ogImage.trim() || product.imageUrl, cleanOrigin);

  const twitterTitle = seo.twitterTitle.trim() || ogTitle;
  const twitterDescription = seo.twitterDescription.trim() || ogDescription;
  const twitterImage = toAbsoluteUrl(
    seo.twitterImage.trim() || ogImage || product.imageUrl,
    cleanOrigin
  );

  return {
    title,
    description,
    canonicalUrl,
    robots,
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl: canonicalUrl,
    twitterTitle,
    twitterDescription,
    twitterImage,
    customMeta: seo.customMeta.filter((m) => m.name.trim() && m.content.trim()),
    jsonLd: buildProductJsonLd(product, cleanOrigin),
  };
}
