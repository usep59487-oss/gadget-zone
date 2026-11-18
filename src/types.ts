export type Language = 'en' | 'bn';

export const PRODUCT_CATEGORIES = [
  'Wireless Earbuds',
  'Bluetooth Headphones',
  'Fast Chargers',
  'USB Cables',
  'Power Banks',
  'Mobile Covers',
  'Screen Protectors',
  'Smart Watches',
  'Mobile Stands',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const BD_DIVISIONS = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
] as const;

export type BdDivision = (typeof BD_DIVISIONS)[number];

export const ORDER_STATUSES = [
  'New Order',
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface CustomMetaEntry {
  name: string;
  content: string;
}

export interface ProductSeo {
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  additionalKeywords: string[];
  canonicalUrl: string;
  robotsIndex: 'index' | 'noindex';
  robotsFollow: 'follow' | 'nofollow';
  breadcrumbTitle: string;
  showCategoryInBreadcrumb: boolean;
  internalLinkTargets: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  customMeta: CustomMetaEntry[];
}

export type SeoCheckStatus = 'pass' | 'warning' | 'fail';

export interface SeoCheckResult {
  id: string;
  group: 'basic' | 'additional';
  label: string;
  status: SeoCheckStatus;
  detail: string;
  suggestion: string;
  weight: number;
}

export interface SeoAnalysisReport {
  score: number;
  statusLabel: 'Optimized' | 'Needs Improvement' | 'Needs Attention';
  passedCount: number;
  warningCount: number;
  failedCount: number;
  checks: SeoCheckResult[];
  keywordMatches: {
    keyword: string;
    inTitle: boolean;
    inMeta: boolean;
    inSlug: boolean;
    inDescription: boolean;
  }[];
}

export interface Product {
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
  slug?: string;
  brand?: string;
  imageAlt?: string;
  seo?: ProductSeo;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  phone: string;
  email: string;
  division: BdDivision;
  district: string;
  city: string;
  address: string;
  notes: string;
  paymentMethod: 'Cash on Delivery';
  status: OrderStatus;
  isReadByAdmin: boolean;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  division: string;
  district: string;
  address: string;
  updatedAt?: unknown;
}

export type SortOption =
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'discount'
  | 'rating';

export type ActivePage =
  | 'storefront'
  | 'checkout'
  | 'confirmation'
  | 'account'
  | 'admin';
