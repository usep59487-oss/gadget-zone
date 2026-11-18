import React from 'react';
import { X } from 'lucide-react';

export type PolicyType = 'privacy' | 'returns' | null;

interface PolicyModalProps {
  type: PolicyType;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isPrivacy ? 'Privacy Policy' : 'Return Policy'}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-zinc-200 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-200">
          <h2 className="font-display text-xl font-bold text-zinc-950">
            {isPrivacy
              ? 'Privacy Policy – Gadget Zone Bangladesh'
              : '7-Day Return & Replacement Policy'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close policy dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isPrivacy ? (
          <div className="space-y-4 text-sm text-zinc-600 leading-relaxed">
            <p>
              Gadget Zone respects your privacy and handles customer information strictly for
              fulfilling Cash on Delivery orders across Bangladesh.
            </p>
            <h3 className="font-semibold text-zinc-950">1. Information We Collect</h3>
            <p>
              We collect only the name, Bangladesh mobile number, delivery division/district, and
              street address required by our courier partners to deliver your order.
            </p>
            <h3 className="font-semibold text-zinc-950">2. Data Protection</h3>
            <p>
              Your order details and delivery profile are stored in protected Firestore collections
              accessible only to you and verified Gadget Zone administrators. We never sell or share
              customer phone numbers with third-party marketers.
            </p>
            <h3 className="font-semibold text-zinc-950">3. Contact</h3>
            <p>
              For data deletion or privacy questions, email support@gadgetzone.com.bd or visit our
              Banani, Dhaka office.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-sm text-zinc-600 leading-relaxed">
            <p>
              Every mobile accessory purchased from Gadget Zone includes a 7-day instant replacement
              policy for manufacturing defects or transit damage.
            </p>
            <h3 className="font-semibold text-zinc-950">1. Eligibility</h3>
            <p>
              Keep the original retail box, warranty card, and all included cables/ear-tips. Report
              any defect within 7 days of delivery via WhatsApp or phone support.
            </p>
            <h3 className="font-semibold text-zinc-950">2. Zero-Cost Replacement</h3>
            <p>
              Inside Dhaka, we arrange doorstep pickup and swap within 24–48 hours at zero extra
              delivery charge for verified manufacturing faults.
            </p>
            <h3 className="font-semibold text-zinc-950">3. Manufacturer Warranty</h3>
            <p>
              Smart watches, GaN fast chargers, power banks, and audio products carry 6 to 12 months
              official Gadget Zone service warranty.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
