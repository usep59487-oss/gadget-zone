import { CartItem } from '../types';

export const STORE_WHATSAPP_NUMBER = '8801711000000';
export const STORE_PHONE_DISPLAY = '+880 1711-000000';
export const STORE_EMAIL = 'support@gadgetzone.com.bd';
export const STORE_ADDRESS_EN = 'House 24, Road 11, Banani, Dhaka 1213, Bangladesh';
export const STORE_ADDRESS_BN = 'হাউস ২৪, রোড ১১, বনানী, ঢাকা ১২১৩, বাংলাদেশ';
export const FREE_DELIVERY_THRESHOLD = 3000;

export function formatBDT(amount: number): string {
  const safe = Math.round(Number(amount) || 0);
  return `৳${safe.toLocaleString('en-BD')}`;
}

export function calcDiscountPercent(originalPrice: number, discountedPrice: number): number {
  if (!originalPrice || originalPrice <= 0 || discountedPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

export function calculateDeliveryFee(subtotal: number, division: string): number {
  if (subtotal <= 0) return 0;
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  return division === 'Dhaka' ? 70 : 130;
}

export function buildWhatsAppOrderUrl(
  items: CartItem[],
  customer?: {
    customerName?: string;
    phone?: string;
    division?: string;
    district?: string;
    address?: string;
    orderNumber?: string;
    total?: number;
  }
): string {
  const lines: string[] = [
    'Hello Gadget Zone Bangladesh! I would like to place an order:',
    '',
  ];

  if (customer?.orderNumber) {
    lines.push(`Order ID: ${customer.orderNumber}`);
  }

  items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.product.name} (${item.quantity}x) - ${formatBDT(
        item.product.discountedPrice * item.quantity
      )}`
    );
  });

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.discountedPrice * item.quantity,
    0
  );
  const deliveryFee = customer?.division
    ? calculateDeliveryFee(subtotal, customer.division)
    : subtotal >= FREE_DELIVERY_THRESHOLD
      ? 0
      : 70;
  const total = customer?.total ?? subtotal + deliveryFee;

  lines.push('');
  lines.push(`Subtotal: ${formatBDT(subtotal)}`);
  lines.push(`Delivery: ${deliveryFee === 0 ? 'Free' : formatBDT(deliveryFee)}`);
  lines.push(`Total (COD): ${formatBDT(total)}`);

  if (customer?.customerName || customer?.phone || customer?.address) {
    lines.push('');
    if (customer.customerName) lines.push(`Name: ${customer.customerName}`);
    if (customer.phone) lines.push(`Phone: ${customer.phone}`);
    if (customer.address) {
      lines.push(
        `Address: ${customer.address}${customer.district ? `, ${customer.district}` : ''}${
          customer.division ? `, ${customer.division}` : ''
        }`
      );
    }
  }

  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function sanitizeId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}
