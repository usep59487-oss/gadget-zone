import React from 'react';
import {
  CheckCircle2,
  MapPin,
  MessageCircle,
  Printer,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { Language, Order } from '../types';
import { buildWhatsAppOrderUrl, formatBDT } from '../utils/formatters';
import { formatOrderDateTime } from '../utils/orderExport';
import { SafeImage } from './SafeImage';

interface OrderConfirmationPageProps {
  order: Order;
  lang: Language;
  onContinueShopping: () => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order,
  lang,
  onContinueShopping,
}) => {
  const whatsappUrl = buildWhatsAppOrderUrl(
    order.items.map((item) => ({
      quantity: item.quantity,
      product: {
        id: item.productId,
        name: item.name,
        nameBn: item.name,
        category: 'Wireless Earbuds',
        description: '',
        descriptionBn: '',
        originalPrice: item.price,
        discountedPrice: item.price,
        stock: 1,
        rating: 5,
        reviewCount: 1,
        imageUrl: item.imageUrl,
        sku: item.productId,
        isFeatured: false,
        isBestSeller: false,
      },
    })),
    {
      customerName: order.customerName,
      phone: order.phone,
      division: order.division,
      district: order.district,
      address: order.address,
      orderNumber: order.orderNumber,
      total: order.total,
    }
  );

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
                {lang === 'bn' ? 'অর্ডার সফলভাবে গৃহীত হয়েছে' : 'Order Placed Successfully'}
              </p>
              <h1 className="font-display text-2xl font-bold text-zinc-950">
                {lang === 'bn'
                  ? `ধন্যবাদ, ${order.customerName}!`
                  : `Thank you, ${order.customerName}!`}
              </h1>
              <p className="text-sm text-zinc-600 mt-1">
                Order <span className="font-mono font-bold text-zinc-950">{order.orderNumber}</span>{' '}
                was placed on {formatOrderDateTime(order.createdAt)} and is queued for Cash on
                Delivery dispatch.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:border-zinc-950 transition-colors self-start cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>

        {/* Delivery & Payment Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-zinc-200 text-sm">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0066FF]" />
              Delivery Address
            </h2>
            <p className="font-semibold text-zinc-950">{order.customerName}</p>
            <p className="font-mono text-xs text-zinc-700 mt-0.5">{order.phone}</p>
            {order.email && <p className="text-xs text-zinc-500 mt-0.5">{order.email}</p>}
            <p className="text-zinc-600 mt-1 leading-relaxed">
              {order.address}, {order.city || order.district}, {order.district}, {order.division}
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#0066FF]" />
              Dispatch &amp; Payment
            </h2>
            <p className="font-semibold text-zinc-950">{order.paymentMethod}</p>
            <p className="text-zinc-600 mt-1">
              Status:{' '}
              <span className="font-semibold text-[#0066FF]">{order.status}</span>
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              {order.division === 'Dhaka'
                ? 'Estimated delivery: 24–48 hours inside Dhaka'
                : `Estimated delivery: 2–4 business days to ${order.city || order.district}`}
            </p>
          </div>
        </div>

        {/* Items Ordered */}
        <div className="py-6 border-b border-zinc-200">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
            Ordered Product Details
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-[#F4F5F7] border border-zinc-200 overflow-hidden shrink-0">
                    <SafeImage
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-950 truncate">{item.name}</p>
                    <p className="font-mono text-xs text-zinc-500 tabular-nums">
                      {item.quantity} × {formatBDT(item.price)}
                    </p>
                  </div>
                </div>
                <span className="font-mono font-semibold text-zinc-950 tabular-nums shrink-0">
                  {formatBDT(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="py-6 space-y-2 text-sm">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums">{formatBDT(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount Saved</span>
              <span className="font-mono tabular-nums">-{formatBDT(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-zinc-600">
            <span>Delivery Charge</span>
            <span className="font-mono tabular-nums">
              {order.deliveryFee === 0 ? 'Free' : formatBDT(order.deliveryFee)}
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-zinc-200 text-base font-bold text-zinc-950">
            <span>Total Payment Amount (COD)</span>
            <span className="font-mono text-xl text-[#0066FF] tabular-nums">
              {formatBDT(order.total)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onContinueShopping}
            className="flex-1 h-11 px-6 rounded-lg bg-[#0066FF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#0052CC] transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            {lang === 'bn' ? 'আরও শপিং করুন' : 'Continue Shopping'}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-5 rounded-lg border border-zinc-300 text-zinc-900 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:border-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            Send Receipt on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};
