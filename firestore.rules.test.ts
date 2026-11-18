/**
 * Security Rules Verification Specification for Gadget Zone
 * Verifies the "Dirty Dozen" adversarial payloads defined in security_spec.md.
 */

export const DIRTY_DOZEN_CASES = [
  {
    id: 1,
    name: 'Unauthenticated Product Mutation',
    collection: 'products/prod_01',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Product Shadow Field Injection',
    collection: 'products/prod_01',
    operation: 'update',
    payload: { ghostFlag: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Negative or Inverted Pricing',
    collection: 'products/prod_01',
    operation: 'create',
    payload: { originalPrice: 3000, discountedPrice: 5000 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Oversized / Invalid Product ID Poisoning',
    collection: 'products/' + 'a'.repeat(129),
    operation: 'create',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Order Identity Spoofing',
    collection: 'orders/ord_01',
    operation: 'create',
    payload: { userId: 'another_user_uid' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Order PII Snooping (Get)',
    collection: 'orders/ord_user_a',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Order Blanket List Scraping',
    collection: 'orders',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Order Status Privilege Escalation',
    collection: 'orders/ord_user_a',
    operation: 'update',
    payload: { status: 'Delivered', total: 1 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Terminal Order Tampering',
    collection: 'orders/ord_delivered',
    operation: 'update',
    payload: { status: 'Cancelled' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Client-Spoofed Timestamp',
    collection: 'orders/ord_02',
    operation: 'create',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Unverified Email Admin Spoof',
    collection: 'products/prod_02',
    operation: 'create',
    auth: { email: 'usep59487@gmail.com', email_verified: false },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Newsletter Subscriber Enumeration',
    collection: 'newsletter',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
  },
];
