# Gadget Zone Security Specification

## 1. Data Invariants
1. **Product Integrity**: Every product must have a valid `isValidId(productId)`, a category from the 9 supported mobile accessory categories, `originalPrice > 0`, `discountedPrice > 0 && discountedPrice <= originalPrice`, `stock >= 0`, and server timestamps (`createdAt == request.time`, `updatedAt == request.time`). Only verified admins can create, update, or delete products.
2. **Order Identity & PII Isolation**: Customer orders contain PII (`customerName`, `phone`, `email`, `address`). Only the verified order owner (`userId == request.auth.uid`) or a verified admin may `get` or `list` an order. When an authenticated user creates an order, `userId` must strictly equal `request.auth.uid`. Guests may submit a COD order only with `userId == 'guest'` and `status == 'Pending'`, and cannot read or list any orders.
3. **Order Lifecycle & Terminal Locking**: Customers can only transition their own `Pending` order to `Cancelled` using `affectedKeys().hasOnly(['status', 'updatedAt'])`. Once an order reaches `Delivered` or `Cancelled`, non-admins cannot mutate it. Admins can manage all order status transitions.
4. **User Profile Isolation**: `users/{userId}` can only be read or written by the verified owner (`request.auth.uid == userId`) or an admin. Users cannot inject role/admin fields (`hasOnly(...)` rejects unknown keys).
5. **Newsletter Privacy**: Any visitor can create a subscription document with a valid email and server timestamp, while reading/listing/deleting subscriber PII is strictly limited to verified admins.
6. **Admin Privilege Protection**: Only the bootstrapped verified admin email (`usep59487@gmail.com`) or existing verified admins listed in `/admins/{uid}` can manage `/admins`, `/products`, or view/update all `/orders`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Product Mutation**: Non-admin attempts to create/update/delete `/products/p1` -> `PERMISSION_DENIED`.
2. **Product Shadow Field Injection**: Authenticated non-admin or malformed payload includes `ghostFlag: true` in `/products/p1` -> `PERMISSION_DENIED`.
3. **Negative or Inverted Pricing**: Payload sets `discountedPrice: 5000` when `originalPrice: 3000` -> `PERMISSION_DENIED`.
4. **Oversized Product ID Poisoning**: Document ID > 128 chars or containing invalid characters (`../hack`) -> `PERMISSION_DENIED`.
5. **Order Identity Spoofing**: Authenticated User A attempts to create an order with `userId: "userB_uid"` -> `PERMISSION_DENIED`.
6. **Order PII Snooping (Get)**: Authenticated User B attempts `get(/orders/orderOwnedByUserA)` -> `PERMISSION_DENIED`.
7. **Order Blanket List Scraping**: Authenticated User B attempts `list(/orders)` without matching `userId == request.auth.uid` -> `PERMISSION_DENIED`.
8. **Order Status Privilege Escalation**: Authenticated Customer attempts to update their order's `status` directly to `'Delivered'` or alter `total: 1` -> `PERMISSION_DENIED`.
9. **Terminal Order Tampering**: Authenticated Customer attempts to modify a `'Delivered'` order -> `PERMISSION_DENIED`.
10. **Client-Spoofed Timestamp**: Client passes a backdated `createdAt` instead of `request.time` -> `PERMISSION_DENIED`.
11. **Unverified Email Admin Spoof**: Token has `email: "usep59487@gmail.com"` but `email_verified: false` -> `PERMISSION_DENIED`.
12. **Newsletter Subscriber Enumeration**: Non-admin user attempts `list(/newsletter)` to harvest customer emails -> `PERMISSION_DENIED`.
