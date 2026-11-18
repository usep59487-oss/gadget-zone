import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { ADMIN_EMAIL, db, handleFirestoreError, OperationType } from '../firebase';
import {
  BdDivision,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductCategory,
  PRODUCT_CATEGORIES,
  UserProfile,
} from '../types';
import { sanitizeId } from '../utils/formatters';

function clampString(val: string, max: number): string {
  return val.trim().slice(0, max);
}

export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'products';
  const q = query(collection(db, path), orderBy('name', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Product[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: String(data.name || ''),
          nameBn: String(data.nameBn || data.name || ''),
          category: (PRODUCT_CATEGORIES.includes(data.category)
            ? data.category
            : 'Wireless Earbuds') as ProductCategory,
          description: String(data.description || ''),
          descriptionBn: String(data.descriptionBn || data.description || ''),
          originalPrice: Number(data.originalPrice) || 0,
          discountedPrice: Number(data.discountedPrice) || 0,
          stock: Number(data.stock) || 0,
          rating: Number(data.rating) || 4.8,
          reviewCount: Number(data.reviewCount) || 0,
          imageUrl: String(data.imageUrl || ''),
          sku: String(data.sku || 'GZ-SKU'),
          isFeatured: Boolean(data.isFeatured),
          isBestSeller: Boolean(data.isBestSeller),
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    }
  );
}

export async function seedSampleProducts(sampleProducts: Product[]): Promise<void> {
  const path = 'products';
  try {
    const batch = writeBatch(db);
    for (const product of sampleProducts) {
      const id = sanitizeId(product.id);
      const ref = doc(db, path, id);
      batch.set(ref, {
        id,
        name: clampString(product.name, 140),
        nameBn: clampString(product.nameBn, 180),
        category: product.category,
        description: clampString(product.description, 1000),
        descriptionBn: clampString(product.descriptionBn, 1200),
        originalPrice: Math.max(1, Number(product.originalPrice)),
        discountedPrice: Math.min(
          Math.max(1, Number(product.discountedPrice)),
          Math.max(1, Number(product.originalPrice))
        ),
        stock: Math.max(0, Math.round(Number(product.stock))),
        rating: Math.min(5, Math.max(0, Number(product.rating))),
        reviewCount: Math.max(0, Math.round(Number(product.reviewCount))),
        imageUrl: clampString(product.imageUrl, 500),
        sku: clampString(product.sku, 40),
        isFeatured: Boolean(product.isFeatured),
        isBestSeller: Boolean(product.isBestSeller),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertProduct(
  product: Omit<Product, 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const id = sanitizeId(product.id || `${product.sku}-${Date.now()}`);
  const path = `products/${id}`;
  const orig = Math.min(1000000, Math.max(1, Number(product.originalPrice)));
  const disc = Math.min(orig, Math.max(1, Number(product.discountedPrice)));

  const basePayload = {
    name: clampString(product.name, 140),
    nameBn: clampString(product.nameBn || product.name, 180),
    category: product.category,
    description: clampString(product.description, 1000),
    descriptionBn: clampString(product.descriptionBn || product.description, 1200),
    originalPrice: orig,
    discountedPrice: disc,
    stock: Math.min(100000, Math.max(0, Math.round(Number(product.stock)))),
    rating: Math.min(5, Math.max(0, Number(product.rating) || 4.8)),
    reviewCount: Math.min(1000000, Math.max(0, Math.round(Number(product.reviewCount) || 12))),
    imageUrl: clampString(product.imageUrl, 500),
    sku: clampString(product.sku, 40),
    isFeatured: Boolean(product.isFeatured),
    isBestSeller: Boolean(product.isBestSeller),
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = doc(db, 'products', id);
    if (isNew) {
      await setDoc(docRef, {
        ...basePayload,
        id,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, basePayload);
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isNew ? OperationType.CREATE : OperationType.UPDATE,
      path
    );
  }
}

export async function deleteProductById(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createOrder(params: {
  userId: string;
  customerName: string;
  phone: string;
  email: string;
  division: BdDivision;
  district: string;
  address: string;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
}): Promise<Order> {
  const orderId = `ord-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const orderNumber = `GZ-${String(Math.floor(10000 + Math.random() * 89999))}`;
  const path = `orders/${orderId}`;

  const sanitizedItems: OrderItem[] = params.items.slice(0, 25).map((item) => ({
    productId: sanitizeId(item.productId) || 'item',
    name: clampString(item.name, 140),
    price: Math.max(1, Number(item.price)),
    quantity: Math.min(50, Math.max(1, Math.round(Number(item.quantity)))),
    imageUrl: clampString(item.imageUrl, 500),
  }));

  const subtotal = Math.max(1, Math.round(params.subtotal));
  const deliveryFee = Math.max(0, Math.round(params.deliveryFee));
  const total = subtotal + deliveryFee;

  const payload = {
    id: orderId,
    orderNumber,
    userId: params.userId,
    customerName: clampString(params.customerName, 100),
    phone: clampString(params.phone, 16),
    email: clampString(params.email || '', 120),
    division: params.division,
    district: clampString(params.district, 60),
    address: clampString(params.address, 250),
    notes: clampString(params.notes || '', 300),
    paymentMethod: 'Cash on Delivery' as const,
    status: 'Pending' as const,
    items: sanitizedItems,
    subtotal,
    deliveryFee,
    total,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'orders', orderId), payload);
    return {
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

function mapOrderDoc(docSnap: { id: string; data: () => Record<string, unknown> }): Order {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    orderNumber: String(d.orderNumber || docSnap.id),
    userId: String(d.userId || 'guest'),
    customerName: String(d.customerName || ''),
    phone: String(d.phone || ''),
    email: String(d.email || ''),
    division: (d.division as BdDivision) || 'Dhaka',
    district: String(d.district || ''),
    address: String(d.address || ''),
    notes: String(d.notes || ''),
    paymentMethod: 'Cash on Delivery',
    status: (d.status as OrderStatus) || 'Pending',
    items: Array.isArray(d.items) ? (d.items as OrderItem[]) : [],
    subtotal: Number(d.subtotal) || 0,
    deliveryFee: Number(d.deliveryFee) || 0,
    total: Number(d.total) || 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export function subscribeToUserOrders(
  userId: string,
  onUpdate: (orders: Order[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'orders';
  const q = query(
    collection(db, path),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      onUpdate(snapshot.docs.map(mapOrderDoc));
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToAllOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onUpdate(snapshot.docs.map(mapOrderDoc));
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      uid: userId,
      displayName: String(d.displayName || ''),
      email: String(d.email || ''),
      phone: String(d.phone || ''),
      division: String(d.division || 'Dhaka'),
      district: String(d.district || 'Dhaka'),
      address: String(d.address || ''),
      updatedAt: d.updatedAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(profile: Omit<UserProfile, 'updatedAt'>): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), {
      uid: profile.uid,
      displayName: clampString(profile.displayName, 100),
      email: clampString(profile.email, 120),
      phone: clampString(profile.phone, 20),
      division: clampString(profile.division, 40),
      district: clampString(profile.district, 60),
      address: clampString(profile.address, 250),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function subscribeNewsletter(email: string): Promise<void> {
  const cleanEmail = clampString(email.toLowerCase(), 120);
  const subId = sanitizeId(cleanEmail.replace(/[@.]/g, '-')) || `sub-${Date.now()}`;
  const path = `newsletter/${subId}`;
  try {
    await setDoc(doc(db, 'newsletter', subId), {
      email: cleanEmail,
      subscribedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email === ADMIN_EMAIL) return true;
  const path = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}
