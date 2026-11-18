import { jsPDF } from 'jspdf';
import { Order } from '../types';
import {
  STORE_ADDRESS_EN,
  STORE_EMAIL,
  STORE_PHONE_DISPLAY,
  formatBDT,
} from './formatters';

export function resolveOrderDate(raw: unknown): Date {
  if (!raw) return new Date();
  if (raw instanceof Date) return raw;
  if (typeof raw === 'string' || typeof raw === 'number') {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'toDate' in raw &&
    typeof (raw as { toDate: () => Date }).toDate === 'function'
  ) {
    return (raw as { toDate: () => Date }).toDate();
  }
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'seconds' in raw &&
    typeof (raw as { seconds: number }).seconds === 'number'
  ) {
    return new Date((raw as { seconds: number }).seconds * 1000);
  }
  return new Date();
}

export function formatOrderDateTime(raw: unknown): string {
  const date = resolveOrderDate(raw);
  return date.toLocaleString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getOrderDateKey(raw: unknown): string {
  const date = resolveOrderDate(raw);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function playOrderNotificationChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.18, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration);
    };

    playTone(587.33, 0, 0.18);
    playTone(880, 0.14, 0.28);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 600);
  } catch {
    // Browser autoplay policy may block audio before user gesture
  }
}

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadOrderCsv(orders: Order[], filename?: string): void {
  const headers = [
    'Order ID',
    'Order Date & Time',
    'Order Status',
    'Customer Full Name',
    'Customer Phone',
    'Customer Email',
    'Full Delivery Address',
    'City',
    'District',
    'Division',
    'Ordered Items',
    'Subtotal (BDT)',
    'Discount (BDT)',
    'Delivery Charge (BDT)',
    'Total Amount (BDT)',
    'Payment Method',
  ];

  const rows = orders.map((order) => {
    const itemsSummary = order.items
      .map((i) => `${i.name} (Qty: ${i.quantity} @ BDT ${i.price})`)
      .join(' | ');
    return [
      order.orderNumber,
      formatOrderDateTime(order.createdAt),
      order.status,
      order.customerName,
      order.phone,
      order.email || 'N/A',
      order.address,
      order.city || order.district,
      order.district,
      order.division,
      itemsSummary,
      order.subtotal,
      order.discount || 0,
      order.deliveryFee,
      order.total,
      order.paymentMethod,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  const csvContent = `\uFEFF${[headers.join(','), ...rows].join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download =
    filename ||
    (orders.length === 1
      ? `GadgetZone-Order-${orders[0].orderNumber}.csv`
      : `GadgetZone-Orders-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadOrderPdf(order: Order): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 50;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(9, 9, 11);
  doc.text('GADGET ZONE', 48, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(82, 82, 91);
  doc.text(STORE_ADDRESS_EN, 48, y + 16);
  doc.text(`Phone: ${STORE_PHONE_DISPLAY}  |  Email: ${STORE_EMAIL}`, 48, y + 29);

  // Invoice Meta Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 255);
  doc.text('ORDER INVOICE', pageWidth - 48, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(9, 9, 11);
  doc.text(`Order ID: ${order.orderNumber}`, pageWidth - 48, y + 18, { align: 'right' });
  doc.text(`Date: ${formatOrderDateTime(order.createdAt)}`, pageWidth - 48, y + 32, {
    align: 'right',
  });
  doc.text(`Status: ${order.status}`, pageWidth - 48, y + 46, { align: 'right' });

  y += 72;
  doc.setDrawColor(228, 228, 231);
  doc.line(48, y, pageWidth - 48, y);

  // Customer & Delivery Section
  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(82, 82, 91);
  doc.text('BILL & DELIVER TO', 48, y);
  doc.text('PAYMENT & LOGISTICS', pageWidth / 2 + 16, y);

  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(9, 9, 11);
  doc.text(order.customerName, 48, y);
  doc.text(order.paymentMethod, pageWidth / 2 + 16, y);

  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Phone: ${order.phone}`, 48, y);
  doc.text(`Division: ${order.division}`, pageWidth / 2 + 16, y);

  y += 14;
  doc.text(`Email: ${order.email || 'Not provided'}`, 48, y);
  doc.text(
    `District / City: ${order.district}, ${order.city || order.district}`,
    pageWidth / 2 + 16,
    y
  );

  y += 16;
  const wrappedAddress = doc.splitTextToSize(`Address: ${order.address}`, pageWidth - 96);
  doc.text(wrappedAddress, 48, y);
  y += wrappedAddress.length * 13 + 8;

  if (order.notes) {
    const wrappedNotes = doc.splitTextToSize(`Customer Note: ${order.notes}`, pageWidth - 96);
    doc.setTextColor(82, 82, 91);
    doc.text(wrappedNotes, 48, y);
    y += wrappedNotes.length * 13 + 8;
  }

  y += 12;

  // Table Header
  doc.setFillColor(244, 245, 247);
  doc.rect(48, y, pageWidth - 96, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(63, 63, 70);
  doc.text('PRODUCT', 58, y + 17);
  doc.text('UNIT PRICE', pageWidth - 200, y + 17, { align: 'right' });
  doc.text('QTY', pageWidth - 135, y + 17, { align: 'right' });
  doc.text('LINE TOTAL', pageWidth - 58, y + 17, { align: 'right' });

  y += 38;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(9, 9, 11);

  for (const item of order.items) {
    const nameLines = doc.splitTextToSize(item.name, 260);
    doc.text(nameLines, 58, y);
    doc.text(`BDT ${item.price.toLocaleString('en-BD')}`, pageWidth - 200, y, {
      align: 'right',
    });
    doc.text(String(item.quantity), pageWidth - 135, y, { align: 'right' });
    doc.text(
      `BDT ${(item.price * item.quantity).toLocaleString('en-BD')}`,
      pageWidth - 58,
      y,
      { align: 'right' }
    );
    y += Math.max(20, nameLines.length * 13 + 8);
    doc.setDrawColor(244, 244, 245);
    doc.line(48, y - 6, pageWidth - 48, y - 6);
  }

  // Totals Summary
  y += 14;
  const labelX = pageWidth - 200;
  const valueX = pageWidth - 58;

  doc.setFontSize(10);
  doc.setTextColor(82, 82, 91);
  doc.text('Subtotal:', labelX, y);
  doc.setTextColor(9, 9, 11);
  doc.text(`BDT ${order.subtotal.toLocaleString('en-BD')}`, valueX, y, { align: 'right' });

  y += 18;
  doc.setTextColor(82, 82, 91);
  doc.text('Discount Saved:', labelX, y);
  doc.setTextColor(9, 9, 11);
  doc.text(`BDT ${(order.discount || 0).toLocaleString('en-BD')}`, valueX, y, {
    align: 'right',
  });

  y += 18;
  doc.setTextColor(82, 82, 91);
  doc.text('Delivery Charge:', labelX, y);
  doc.setTextColor(9, 9, 11);
  doc.text(
    order.deliveryFee === 0 ? 'Free' : `BDT ${order.deliveryFee.toLocaleString('en-BD')}`,
    valueX,
    y,
    { align: 'right' }
  );

  y += 12;
  doc.setDrawColor(228, 228, 231);
  doc.line(labelX - 10, y, valueX, y);

  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 102, 255);
  doc.text('Total Payable:', labelX, y);
  doc.text(`BDT ${order.total.toLocaleString('en-BD')}`, valueX, y, { align: 'right' });

  // Footer
  y += 46;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(113, 113, 122);
  doc.text(
    `Thank you for shopping with Gadget Zone Bangladesh. Reference: ${formatBDT(order.total)} COD`,
    48,
    y
  );

  doc.save(`GadgetZone-Invoice-${order.orderNumber}.pdf`);
}
