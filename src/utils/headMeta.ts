import { Product } from '../types';
import { resolveProductHeadMeta } from './seo';

const DEFAULT_TITLE = 'Gadget Zone – Premium Mobile Accessories Store in Bangladesh';
const DEFAULT_DESCRIPTION =
  'Shop genuine wireless earbuds, 65W GaN fast chargers, power banks, smart watches, and mobile covers at Gadget Zone Bangladesh with fast Cash on Delivery.';

function upsertMetaTag(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string,
  managed = false
) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attrName}="${attrValue}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  if (managed) {
    el.setAttribute('data-gz-custom-meta', 'true');
  }
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertProductJsonLd(jsonLd: Record<string, unknown> | null) {
  const existing = document.getElementById('gz-product-jsonld');
  if (!jsonLd) {
    existing?.remove();
    return;
  }
  const script = existing || document.createElement('script');
  script.id = 'gz-product-jsonld';
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify(jsonLd, null, 2);
  if (!existing) {
    document.head.appendChild(script);
  }
}

export function applyProductDocumentHead(product: Product) {
  const origin = window.location.origin;
  const meta = resolveProductHeadMeta(product, origin);

  document.title = meta.title;
  upsertMetaTag('name', 'description', meta.description);
  upsertMetaTag('name', 'robots', meta.robots);
  upsertCanonical(meta.canonicalUrl);

  upsertMetaTag('property', 'og:type', 'product');
  upsertMetaTag('property', 'og:site_name', 'Gadget Zone');
  upsertMetaTag('property', 'og:title', meta.ogTitle);
  upsertMetaTag('property', 'og:description', meta.ogDescription);
  upsertMetaTag('property', 'og:url', meta.ogUrl);
  if (meta.ogImage) {
    upsertMetaTag('property', 'og:image', meta.ogImage);
  }

  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', meta.twitterTitle);
  upsertMetaTag('name', 'twitter:description', meta.twitterDescription);
  if (meta.twitterImage) {
    upsertMetaTag('name', 'twitter:image', meta.twitterImage);
  }

  // Clear previously injected custom product meta tags before applying current product's custom tags
  document.head
    .querySelectorAll('meta[data-gz-custom-meta="true"]')
    .forEach((node) => node.remove());

  for (const entry of meta.customMeta) {
    upsertMetaTag('name', entry.name.trim(), entry.content.trim(), true);
  }

  upsertProductJsonLd(meta.jsonLd);
}

export function resetStorefrontDocumentHead() {
  const origin = window.location.origin;
  document.title = DEFAULT_TITLE;
  upsertMetaTag('name', 'description', DEFAULT_DESCRIPTION);
  upsertMetaTag('name', 'robots', 'index, follow');
  upsertCanonical(`${origin}${window.location.pathname}`);

  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:site_name', 'Gadget Zone');
  upsertMetaTag('property', 'og:title', DEFAULT_TITLE);
  upsertMetaTag('property', 'og:description', DEFAULT_DESCRIPTION);
  upsertMetaTag('property', 'og:url', `${origin}${window.location.pathname}`);

  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', DEFAULT_TITLE);
  upsertMetaTag('name', 'twitter:description', DEFAULT_DESCRIPTION);

  document.head
    .querySelectorAll('meta[data-gz-custom-meta="true"]')
    .forEach((node) => node.remove());

  upsertProductJsonLd(null);
}
