import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { ActivePage, Language } from '../types';
import { UI_COPY } from '../data/sampleProducts';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  cartCount: number;
  onOpenCart: () => void;
  activePage: ActivePage;
  onNavigateSection: (sectionId: string) => void;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  user: FirebaseUser | null;
  isAdmin: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  cartCount,
  onOpenCart,
  activePage,
  onNavigateSection,
  onOpenAccount,
  onOpenAdmin,
  user,
  isAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const copy = UI_COPY[lang];

  const handleLinkClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    onNavigateSection(sectionId);
  };

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileSearchOpen(false);
    onSearchSubmit();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark (single element) */}
        <button
          type="button"
          onClick={() => handleLinkClick('top')}
          className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-zinc-950 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0066FF] rounded"
        >
          GADGET ZONE
        </button>

        {/* Zone 2: Concise Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-600"
        >
          <button
            type="button"
            onClick={() => handleLinkClick('top')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
              activePage === 'storefront'
                ? 'border-transparent hover:border-[#0066FF] hover:text-zinc-950'
                : 'border-transparent hover:text-zinc-950'
            }`}
          >
            {copy.navHome}
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('shop')}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#0066FF] hover:text-zinc-950 transition-colors cursor-pointer"
          >
            {copy.navShop}
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('categories')}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#0066FF] hover:text-zinc-950 transition-colors cursor-pointer"
          >
            {copy.navCategories}
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('about')}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#0066FF] hover:text-zinc-950 transition-colors cursor-pointer"
          >
            {copy.navAbout}
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('contact')}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#0066FF] hover:text-zinc-950 transition-colors cursor-pointer"
          >
            {copy.navContact}
          </button>
        </nav>

        {/* Search Input (Desktop) */}
        <form
          onSubmit={handleSearchFormSubmit}
          className="hidden md:flex items-center flex-1 max-w-xs relative"
        >
          <Search
            className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={copy.searchPlaceholder}
            aria-label={copy.searchPlaceholder}
            className="w-full h-9 pl-9 pr-3 text-sm bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-950 placeholder:text-zinc-500 focus:outline-none focus:bg-white focus:border-[#0066FF] transition-colors"
          />
        </form>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="Toggle search"
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onToggleLang}
            aria-label="Switch language"
            className="h-9 px-2.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === 'en' ? 'বাং' : 'EN'}
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-zinc-900 text-xs font-semibold text-zinc-950 hover:bg-zinc-950 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAccount}
            aria-label="User Account"
            className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-800 hover:border-zinc-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline max-w-[90px] truncate">
              {user ? user.displayName?.split(' ')[0] || 'Account' : lang === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label="Shopping Cart"
            className="relative inline-flex items-center gap-2 h-9 px-3 sm:px-4 rounded-lg bg-[#0066FF] text-white text-xs font-semibold hover:bg-[#0052CC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'কার্ট' : 'Cart'}</span>
            <span className="tabular-nums inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded bg-white text-[#0066FF] text-[11px] font-bold">
              {cartCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-zinc-800 hover:bg-zinc-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-3">
          <form onSubmit={handleSearchFormSubmit} className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full h-10 pl-9 pr-4 text-sm bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-950 focus:outline-none focus:border-[#0066FF]"
            />
          </form>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-1">
          {[
            { id: 'top', label: copy.navHome },
            { id: 'shop', label: copy.navShop },
            { id: 'categories', label: copy.navCategories },
            { id: 'about', label: copy.navAbout },
            { id: 'contact', label: copy.navContact },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleLinkClick(item.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition-colors"
            >
              {item.label}
            </button>
          ))}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[#0066FF] hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Dashboard
            </button>
          )}
        </div>
      )}
    </header>
  );
};
