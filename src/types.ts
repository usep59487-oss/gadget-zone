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
  'Pending',
  'Confirmed',
  'Shipped',
  'Delivered',
  'Cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

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
  address: string;
  notes: string;
  paymentMethod: 'Cash on Delivery';
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
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
