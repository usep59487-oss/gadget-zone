import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Language } from '../types';
import {
  STORE_ADDRESS_BN,
  STORE_ADDRESS_EN,
  STORE_EMAIL,
  STORE_PHONE_DISPLAY,
  STORE_WHATSAPP_NUMBER,
} from '../utils/formatters';
import { PolicyType } from './PolicyModal';

interface FooterProps {
  lang: Language;
  onNavigateSection: (sectionId: string) => void;
  onOpenPolicy: (policy: PolicyType) => void;
  onOpenAdminLogin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  lang,
  onNavigateSection,
  onOpenPolicy,
  onOpenAdminLogin,
}) => {
  return (
    <footer className="bg-zinc-950 text-zinc-300 border-t border-zinc-900 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-zinc-800">
          {/* Brand & About */}
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-white mb-3">
              GADGET ZONE
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              {lang === 'bn'
                ? 'বাংলাদেশের নির্ভরযোগ্য প্রিমিয়াম মোবাইল এক্সেসরিজ স্টোর। অরিজিনাল ওয়ারেন্টি ও দ্রুত ক্যাশ অন ডেলিভারি।'
                : 'Bangladesh’s curated destination for genuine wireless audio, GaN fast charging, smart wearables, and protective gear.'}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Gadget Zone Facebook Page"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white hover:border-[#0066FF] transition-colors"
              >
                <Facebook className="w-4 h-4 text-[#0066FF]" />
                Facebook
              </a>
              <a
                href={`https://wa.me/${STORE_WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Gadget Zone WhatsApp"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white hover:border-emerald-500 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Store Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              {lang === 'bn' ? 'স্টোর নেভিগেশন' : 'Storefront'}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection('shop')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {lang === 'bn' ? 'সব প্রোডাক্ট' : 'All Accessories'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection('categories')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {lang === 'bn' ? 'ক্যাটাগরি' : 'Product Categories'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {lang === 'bn' ? 'আমাদের সম্পর্কে' : 'About Us'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection('contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {lang === 'bn' ? 'যোগাযোগ' : 'Contact Support'}
                </button>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              {lang === 'bn' ? 'পলিসি ও সেবা' : 'Customer Care'}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('privacy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {lang === 'bn' ? 'প্রাইভেসি পলিসি' : 'Privacy Policy'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('returns')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {lang === 'bn' ? 'রিটার্ন ও ওয়ারেন্টি পলিসি' : 'Return & Replacement Policy'}
                </button>
              </li>
              <li className="text-zinc-400">Cash on Delivery Across 64 Districts</li>
              <li className="text-zinc-400">7-Day Replacement Guarantee</li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              {lang === 'bn' ? 'যোগাযোগের ঠিকানা' : 'Contact Information'}
            </h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
                <span>{lang === 'bn' ? STORE_ADDRESS_BN : STORE_ADDRESS_EN}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#0066FF] shrink-0" />
                <a href="tel:+8801711000000" className="font-mono hover:text-white">
                  {STORE_PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#0066FF] shrink-0" />
                <a href={`mailto:${STORE_EMAIL}`} className="hover:text-white">
                  {STORE_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Gadget Zone Bangladesh. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <p>Prices in Bangladeshi Taka (৳) · Nationwide Cash on Delivery</p>
            {onOpenAdminLogin && (
              <Link
                to="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenAdminLogin();
                }}
                className="text-zinc-400 hover:text-white underline underline-offset-4 transition-colors"
              >
                Admin Portal
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
