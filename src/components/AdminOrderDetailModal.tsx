import React, { useState } from 'react';
import {
  Ban,
  Calendar,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
  Printer,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { ORDER_STATUSES, Order, OrderStatus } from '../types';
import {
  STORE_ADDRESS_EN,
  STORE_EMAIL,
  STORE_PHONE_DISPLAY,
  formatBDT,
} from '../utils/formatters';
import {
  downloadOrderCsv,
  downloadOrderPdf,
  formatOrderDateTime,
} from '../utils/orderExport';
import { SafeImage } from './SafeImage';

interface AdminOrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
}

const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  'New Order': 'bg-[#0066FF] text-white',
  Pending: 'bg-amber-100 text-amber-800',
  Confirmed: 'bg-sky-100 text-sky-800',
  Processing: 'bg-indigo-100 text-indigo-800',
  Shipped: 'bg-violet-100 text-violet-800',
  Delivered: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-red-100 text-red-700',
};

export const AdminOrderDetailModal: React.FC<AdminOrderDetailModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
  onDeleteOrder,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!order) return null;

  const handleStatusChange = async (next: OrderStatus) => {
    setBusy(true);
    try {
      await onUpdateStatus(order.id, next);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await onDeleteOrder(order.id);
      setConfirmDelete(false);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0 print:block"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Order details for ${order.orderNumber}`}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full border border-zinc-200 shadow-2xl my-auto overflow-hidden print:border-none print:shadow-none print:max-w-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Action Bar (hidden when printing) */}
        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold text-zinc-950">
              {order.orderNumber}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                STATUS_BADGE_STYLES[order.status]
              }`}
            >
              {order.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-9 px-3 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-800 inline-flex items-center gap-1.5 hover:border-zinc-950 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Invoice
            </button>
            <button
              type="button"
              onClick={() => downloadOrderPdf(order)}
              className="h-9 px-3 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-800 inline-flex items-center gap-1.5 hover:border-[#0066FF] hover:text-[#0066FF] transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              type="button"
              onClick={() => downloadOrderCsv([order])}
              className="h-9 px-3 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-800 inline-flex items-center gap-1.5 hover:border-[#0066FF] hover:text-[#0066FF] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close order details"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-200 hover:text-zinc-950 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice & Complete Order Details Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* Print Storefront Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-zinc-200">
            <div>
              <p className="font-display text-xl font-extrabold tracking-tight text-zinc-950">
                GADGET ZONE
              </p>
              <p className="text-xs text-zinc-500 mt-1">{STORE_ADDRESS_EN}</p>
              <p className="text-xs text-zinc-500 font-mono">
                {STORE_PHONE_DISPLAY} · {STORE_EMAIL}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0066FF]">
                Order Invoice
              </p>
              <p className="font-mono text-lg font-bold text-zinc-950 mt-0.5">
                {order.orderNumber}
              </p>
              <p className="text-xs text-zinc-500 inline-flex items-center gap-1 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatOrderDateTime(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Customer & Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-zinc-200 text-sm">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Customer Information
              </h3>
              <p className="font-semibold text-zinc-950 flex items-center gap-2">
                <User className="w-4 h-4 text-[#0066FF]" />
                {order.customerName}
              </p>
              <p className="font-mono text-xs text-zinc-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-400" />
                {order.phone}
              </p>
              <p className="text-xs text-zinc-600 flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-400" />
                {order.email || 'No email provided'}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Delivery &amp; Payment Details
              </h3>
              <p className="text-zinc-800 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
                <span>{order.address}</span>
              </p>
              <p className="text-xs text-zinc-600 pl-6">
                City: <span className="font-semibold text-zinc-900">{order.city || order.district}</span>{' '}
                · District:{' '}
                <span className="font-semibold text-zinc-900">{order.district}</span> ·
                Division: <span className="font-semibold text-zinc-900">{order.division}</span>
              </p>
              <p className="text-xs text-zinc-600 pl-6">
                Payment Method:{' '}
                <span className="font-semibold text-zinc-950">{order.paymentMethod}</span> ·
                Status: <span className="font-semibold text-[#0066FF]">{order.status}</span>
              </p>
              {order.notes && (
                <p className="text-xs text-zinc-500 pl-6">Customer Note: {order.notes}</p>
              )}
            </div>
          </div>

          {/* Ordered Products Table */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Ordered Products ({order.items.length})
            </h3>
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    <th className="py-2.5 px-4">Product</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Qty</th>
                    <th className="py-2.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {order.items.map((item) => (
                    <tr key={item.productId}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-[#F4F5F7] border border-zinc-200 overflow-hidden shrink-0">
                            <SafeImage
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-medium text-zinc-950">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-700">
                        {formatBDT(item.price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-950 font-semibold">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-zinc-950">
                        {formatBDT(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financials */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-80 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                  {formatBDT(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span className="font-mono font-semibold tabular-nums">
                  -{formatBDT(order.discount || 0)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Delivery Charge</span>
                <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                  {order.deliveryFee === 0 ? 'Free' : formatBDT(order.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-zinc-200 text-base font-bold text-zinc-950">
                <span>Total Amount</span>
                <span className="font-mono text-xl text-[#0066FF] tabular-nums">
                  {formatBDT(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Status & Danger Actions (hidden when printing) */}
          <div className="pt-5 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <label
                htmlFor="detail-status-select"
                className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
              >
                Update Status:
              </label>
              <select
                id="detail-status-select"
                disabled={busy}
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                className="h-9 px-3 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#0066FF]"
              >
                {ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {order.status !== 'Cancelled' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleStatusChange('Cancelled')}
                  className="h-9 px-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Cancel Order
                </button>
              )}

              {confirmDelete ? (
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleDelete}
                    className="h-9 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="h-9 px-3 rounded-lg border border-zinc-300 text-xs font-semibold text-zinc-700 cursor-pointer"
                  >
                    Keep
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="h-9 px-3 rounded-lg border border-red-200 text-red-600 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
