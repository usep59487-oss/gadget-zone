import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import { PRODUCT_CATEGORIES, type Product, type ProductCategory, type ProductSeo } from './src/types.ts';
import { SAMPLE_PRODUCTS } from './src/data/sampleProducts.ts';
import {
  createDefaultProductSeo,
  findProductBySlug,
  resolveProductHeadMeta,
  resolveProductSlug,
} from './src/utils/seo.ts';

interface FirebaseAppletConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId?: string;
}

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
}

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const CACHE_TTL_MS = 5000;

let firebaseConfig: FirebaseAppletConfig | null = null;
try {
  const rawConfig = fs.readFileSync(
    path.resolve(__dirname, 'firebase-applet-config.json'),
    'utf8'
  );
  firebaseConfig = JSON.parse(rawConfig) as FirebaseAppletConfig;
} catch {
  firebaseConfig = null;
}

let cachedProducts: Product[] = SAMPLE_PRODUCTS;
let cacheTimestamp = 0;

function decodeFirestoreValue(val: FirestoreValue | undefined): unknown {
  if (!val) return undefined;
  if (typeof val.stringValue === 'string') return val.stringValue;
  if (typeof val.integerValue === 'string') return Number(val.integerValue);
  if (typeof val.doubleValue === 'number') return val.doubleValue;
  if (typeof val.booleanValue === 'boolean') return val.booleanValue;
  if (val.arrayValue) {
    return (val.arrayValue.values || []).map((v) => decodeFirestoreValue(v));
  }
  if (val.mapValue) {
    const out: Record<string, unknown> = {};
    const fields = val.mapValue.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = decodeFirestoreValue(v);
    }
    return out;
  }
  return undefined;
}

function decodeProductDoc(doc: FirestoreDocument): Product | null {
  const fields = doc.fields || {};
  const raw: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    raw[key] = decodeFirestoreValue(val);
  }
  const idFromName = doc.name.split('/').pop() || '';
  const id = typeof raw.id === 'string' && raw.id ? raw.id : idFromName;
  const name = typeof raw.name === 'string' ? raw.name : '';
  if (!id || !name) return null;

  const rawCategory = String(raw.category || '');
  const category: ProductCategory = (PRODUCT_CATEGORIES as readonly string[]).includes(
    rawCategory
  )
    ? (rawCategory as ProductCategory)
    : 'Wireless Earbuds';

  const rawSeo =
    raw.seo && typeof raw.seo === 'object'
      ? (raw.seo as ProductSeo)
      : undefined;

  const product: Product = {
    id,
    name,
    nameBn: typeof raw.nameBn === 'string' ? raw.nameBn : '',
    category,
    description: typeof raw.description === 'string' ? raw.description : '',
    descriptionBn: typeof raw.descriptionBn === 'string' ? raw.descriptionBn : '',
    originalPrice: Number(raw.originalPrice) || 0,
    discountedPrice: Number(raw.discountedPrice) || 0,
    stock: Number(raw.stock) || 0,
    rating: Number(raw.rating) || 4.8,
    reviewCount: Number(raw.reviewCount) || 0,
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : '',
    sku: typeof raw.sku === 'string' ? raw.sku : '',
    isFeatured: Boolean(raw.isFeatured),
    isBestSeller: Boolean(raw.isBestSeller),
    slug: typeof raw.slug === 'string' ? raw.slug : undefined,
    brand: typeof raw.brand === 'string' ? raw.brand : undefined,
    imageAlt: typeof raw.imageAlt === 'string' ? raw.imageAlt : undefined,
    seo: rawSeo ? createDefaultProductSeo({ seo: rawSeo }) : undefined,
  };

  return product;
}

async function getCatalogProducts(): Promise<Product[]> {
  const now = Date.now();
  if (now - cacheTimestamp < CACHE_TTL_MS && cachedProducts.length > 0) {
    return cachedProducts;
  }

  if (!firebaseConfig?.projectId || !firebaseConfig?.apiKey) {
    return SAMPLE_PRODUCTS;
  }

  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    firebaseConfig.projectId
  )}/databases/${encodeURIComponent(
    dbId
  )}/documents/products?key=${encodeURIComponent(
    firebaseConfig.apiKey
  )}&pageSize=200`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      return cachedProducts.length > 0 ? cachedProducts : SAMPLE_PRODUCTS;
    }

    const payload = (await res.json()) as { documents?: FirestoreDocument[] };
    const decoded = (payload.documents || [])
      .map(decodeProductDoc)
      .filter((p): p is Product => Boolean(p));

    if (decoded.length > 0) {
      cachedProducts = decoded;
      cacheTimestamp = now;
      return decoded;
    }
  } catch {
    // Fallback cleanly to last cache or initial sample catalog
  }

  cacheTimestamp = now;
  return cachedProducts.length > 0 ? cachedProducts : SAMPLE_PRODUCTS;
}

function getRequestOrigin(req: Request): string {
  const rawProto = (req.headers['x-forwarded-proto'] as string | undefined) || req.protocol || 'http';
  const proto = rawProto.split(',')[0].trim();
  const rawHost =
    (req.headers['x-forwarded-host'] as string | undefined) ||
    req.get('host') ||
    `localhost:${PORT}`;
  const host = rawHost.split(',')[0].trim();
  return `${proto}://${host}`;
}

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function injectProductSeoIntoHtml(
  html: string,
  product: Product,
  origin: string
): string {
  const meta = resolveProductHeadMeta(product, origin);

  let output = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtmlText(meta.title)}</title>`)
    .replace(
      /<meta\s+name=["']description["'][\s\S]*?>/i,
      `<meta name="description" content="${escapeHtmlAttr(meta.description)}" />`
    )
    .replace(
      /<meta\s+property=["']og:type["'][\s\S]*?>/i,
      `<meta property="og:type" content="product" />`
    )
    .replace(
      /<meta\s+property=["']og:title["'][\s\S]*?>/i,
      `<meta property="og:title" content="${escapeHtmlAttr(meta.ogTitle)}" />`
    )
    .replace(
      /<meta\s+property=["']og:description["'][\s\S]*?>/i,
      `<meta property="og:description" content="${escapeHtmlAttr(meta.ogDescription)}" />`
    )
    .replace(
      /<meta\s+name=["']twitter:title["'][\s\S]*?>/i,
      `<meta name="twitter:title" content="${escapeHtmlAttr(meta.twitterTitle)}" />`
    )
    .replace(
      /<meta\s+name=["']twitter:description["'][\s\S]*?>/i,
      `<meta name="twitter:description" content="${escapeHtmlAttr(meta.twitterDescription)}" />`
    )
    .replace(/<link\s+rel=["']canonical["'][\s\S]*?>/gi, '')
    .replace(/<meta\s+name=["']robots["'][\s\S]*?>/gi, '')
    .replace(/<meta\s+property=["']og:url["'][\s\S]*?>/gi, '')
    .replace(/<meta\s+property=["']og:image["'][\s\S]*?>/gi, '')
    .replace(/<meta\s+name=["']twitter:image["'][\s\S]*?>/gi, '')
    .replace(/<script\s+id=["']gz-product-jsonld["'][\s\S]*?<\/script>/gi, '');

  const extraHeadTags: string[] = [
    `<meta name="robots" content="${escapeHtmlAttr(meta.robots)}" />`,
    `<link rel="canonical" href="${escapeHtmlAttr(meta.canonicalUrl)}" />`,
    `<meta property="og:url" content="${escapeHtmlAttr(meta.ogUrl)}" />`,
  ];

  if (meta.ogImage) {
    extraHeadTags.push(
      `<meta property="og:image" content="${escapeHtmlAttr(meta.ogImage)}" />`
    );
  }
  if (meta.twitterImage) {
    extraHeadTags.push(
      `<meta name="twitter:image" content="${escapeHtmlAttr(meta.twitterImage)}" />`
    );
  }

  for (const entry of meta.customMeta) {
    extraHeadTags.push(
      `<meta name="${escapeHtmlAttr(entry.name.trim())}" content="${escapeHtmlAttr(
        entry.content.trim()
      )}" data-gz-custom-meta="true" />`
    );
  }

  const safeJsonLd = JSON.stringify(meta.jsonLd, null, 2).replace(/</g, '\\u003c');
  extraHeadTags.push(
    `<script id="gz-product-jsonld" type="application/ld+json">${safeJsonLd}</script>`
  );

  return output.replace('</head>', `    ${extraHeadTags.join('\n    ')}\n  </head>`);
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);

  // Crawler robots.txt
  app.get('/robots.txt', (req: Request, res: Response) => {
    const origin = getRequestOrigin(req);
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /checkout',
        'Disallow: /account',
        `Sitemap: ${origin}/sitemap.xml`,
      ].join('\n')
    );
  });

  // Dynamic XML Sitemap from Firestore / catalog products
  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    const origin = getRequestOrigin(req);
    const products = await getCatalogProducts();
    const indexableProducts = products.filter(
      (p) => p.seo?.robotsIndex !== 'noindex'
    );

    const urls = [
      `<url><loc>${escapeXml(`${origin}/`)}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      ...indexableProducts.map((p) => {
        const slug = resolveProductSlug(p);
        return `<url><loc>${escapeXml(
          `${origin}/product/${slug}`
        )}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
      }),
    ];

    res
      .type('application/xml')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
          '\n'
        )}\n</urlset>`
      );
  });

  let viteDevServer: {
    middlewares: express.RequestHandler;
    transformIndexHtml: (url: string, html: string) => Promise<string>;
  } | null = null;

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    viteDevServer = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(viteDevServer.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir, { index: false }));
  }

  app.get('*', async (req: Request, res: Response, next: NextFunction) => {
    // Skip static asset extensions so Vite / static handlers return proper 404s if missing
    if (/\.[a-z0-9]{2,6}$/i.test(req.path) && !req.path.endsWith('.html')) {
      return next();
    }

    try {
      const htmlPath = IS_PROD
        ? path.resolve(__dirname, 'dist', 'index.html')
        : path.resolve(__dirname, 'index.html');
      let template = fs.readFileSync(htmlPath, 'utf8');

      if (!IS_PROD && viteDevServer) {
        template = await viteDevServer.transformIndexHtml(req.originalUrl, template);
      }

      const productMatch = req.path.match(/^\/product\/([^/]+)\/?$/i);
      if (productMatch) {
        const slugOrId = decodeURIComponent(productMatch[1]);
        const products = await getCatalogProducts();
        const product = findProductBySlug(products, slugOrId);
        if (product) {
          template = injectProductSeoIntoHtml(
            template,
            product,
            getRequestOrigin(req)
          );
        }
      }

      res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(template);
    } catch (err) {
      next(err);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gadget Zone server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
