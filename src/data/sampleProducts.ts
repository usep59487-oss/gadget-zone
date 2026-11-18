import { BdDivision, Product, ProductCategory } from '../types';

export const HERO_IMAGE = '/src/assets/images/hero_gadget_zone_1795008564190.jpg';
export const OFFER_BANNER_IMAGE = '/src/assets/images/offer_banner_tech_1795008567803.jpg';

export const CATEGORY_IMAGES: Record<ProductCategory, string> = {
  'Wireless Earbuds': '/src/assets/images/prod_wireless_earbuds_1795008564806.jpg',
  'Bluetooth Headphones': '/src/assets/images/prod_bluetooth_headphones_1795008565635.jpg',
  'Fast Chargers': '/src/assets/images/prod_fast_charger_1795008565336.jpg',
  'USB Cables': '/src/assets/images/prod_usb_cable_1795008565769.jpg',
  'Power Banks': '/src/assets/images/prod_power_bank_1795008566242.jpg',
  'Mobile Covers': '/src/assets/images/prod_mobile_cover_1795008565738.jpg',
  'Screen Protectors': '/src/assets/images/prod_screen_protector_1795008565905.jpg',
  'Smart Watches': '/src/assets/images/prod_smart_watch_1795008566194.jpg',
  'Mobile Stands': '/src/assets/images/prod_mobile_stand_1795008567966.jpg',
};

export const CATEGORY_LABELS_BN: Record<ProductCategory, string> = {
  'Wireless Earbuds': 'ওয়্যারলেস ইয়ারবাডস',
  'Bluetooth Headphones': 'ব্লুটুথ হেডফোন',
  'Fast Chargers': 'ফাস্ট চার্জার',
  'USB Cables': 'ইউএসবি ক্যাবল',
  'Power Banks': 'পাওয়ার ব্যাংক',
  'Mobile Covers': 'মোবাইল কভার',
  'Screen Protectors': 'স্ক্রিন প্রটেক্টর',
  'Smart Watches': 'স্মার্ট ওয়াচ',
  'Mobile Stands': 'মোবাইল স্ট্যান্ড',
};

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'gz-earbuds-anc-pro',
    name: 'SoundCore Pulse ANC Pro Earbuds',
    nameBn: 'সাউন্ডকোর পালস এএনসি প্রো ইয়ারবাডস',
    category: 'Wireless Earbuds',
    description:
      '45dB hybrid active noise cancellation, 38-hour total playtime, low-latency gaming mode, and IPX5 sweat resistance engineered for Dhaka commutes.',
    descriptionBn:
      '৪৫ ডেসিবেল অ্যাক্টিভ নয়েজ ক্যান্সেলেশন, ৩৮ ঘণ্টা ব্যাটারি ব্যাকআপ, লো-ল্যাটেন্সি গেমিং মোড এবং আইপিএক্স৫ ওয়াটার রেজিস্ট্যান্স।',
    originalPrice: 3890,
    discountedPrice: 2890,
    stock: 34,
    rating: 4.9,
    reviewCount: 184,
    imageUrl: CATEGORY_IMAGES['Wireless Earbuds'],
    sku: 'GZ-EAR-101',
    isFeatured: true,
    isBestSeller: true,
  },
  {
    id: 'gz-headphones-studio-x',
    name: 'AeroMax Studio Wireless Headphones',
    nameBn: 'অ্যারোম্যাক্স স্টুডিও ওয়্যারলেস হেডফোন',
    category: 'Bluetooth Headphones',
    description:
      '40mm Hi-Res custom drivers, memory-foam acoustic earcups, dual-device Bluetooth 5.4 multipoint pairing, and 60-hour battery life.',
    descriptionBn:
      '৪০মিমি হাই-রেজ ড্রাইভার, মেমোরি-ফোম ইয়ারকাপ, ব্লুটুথ ৫.৪ ডুয়াল-ডিভাইস পেয়ারিং এবং ৬০ ঘণ্টা একটানা ব্যাটারি ব্যাকআপ।',
    originalPrice: 6490,
    discountedPrice: 4990,
    stock: 19,
    rating: 4.8,
    reviewCount: 96,
    imageUrl: CATEGORY_IMAGES['Bluetooth Headphones'],
    sku: 'GZ-HDP-204',
    isFeatured: true,
    isBestSeller: true,
  },
  {
    id: 'gz-charger-gan-65w',
    name: 'VoltEdge 65W GaN Dual USB-C Charger',
    nameBn: 'ভোল্টএজ ৬৫ ওয়াট গ্যান ডুয়াল ফাস্ট চার্জার',
    category: 'Fast Chargers',
    description:
      'Ultra-compact GaN III power architecture supporting PD 3.0 & PPS fast charging for smartphones, tablets, and USB-C ultrabooks with thermal shield.',
    descriptionBn:
      'গ্যান ৩ টেকনোলজির কমপ্যাক্ট ৬৫ ওয়াট ফাস্ট চার্জার যা পিডি ৩.০ ও পিপিএস সাপোর্ট করে ফোন ও ল্যাপটপ দ্রুত চার্জ করে।',
    originalPrice: 2450,
    discountedPrice: 1790,
    stock: 52,
    rating: 4.9,
    reviewCount: 242,
    imageUrl: CATEGORY_IMAGES['Fast Chargers'],
    sku: 'GZ-CHG-301',
    isFeatured: true,
    isBestSeller: true,
  },
  {
    id: 'gz-powerbank-20k-pd',
    name: 'VoltEdge Slim 20000mAh 30W Power Bank',
    nameBn: 'ভোল্টএজ স্লিম ২০০০০ এমএএইচ পাওয়ার ব্যাংক',
    category: 'Power Banks',
    description:
      'High-density lithium polymer cell with real-time digital LED percentage readout, 30W bi-directional USB-C PD, and airline-safe chassis.',
    descriptionBn:
      'ডিজিটাল এলইডি ব্যাটারি ডিসপ্লে, ৩০ ওয়াট টু-ওয়ে ইউএসবি-সি ফাস্ট চার্জিং এবং স্লিম টেকসই ডিজাইন।',
    originalPrice: 3400,
    discountedPrice: 2590,
    stock: 28,
    rating: 4.8,
    reviewCount: 163,
    imageUrl: CATEGORY_IMAGES['Power Banks'],
    sku: 'GZ-PWB-402',
    isFeatured: true,
    isBestSeller: true,
  },
  {
    id: 'gz-watch-titan-amoled',
    name: 'ChronoFit Titanium AMOLED Smart Watch',
    nameBn: 'ক্রোনোফিট টাইটানিয়াম অ্যামোলেড স্মার্ট ওয়াচ',
    category: 'Smart Watches',
    description:
      '1.96-inch 60Hz sapphire-coated AMOLED display, Bluetooth calling, SpO2 & heart-rate sensors, 100+ sports modes, and 10-day standby.',
    descriptionBn:
      '১.৯৬ ইঞ্চি অ্যামোলেড ডিসপ্লে, ব্লুটুথ কলিং, হার্ট-রেট ও এসপিও২ সেন্সর এবং ১০ দিন পর্যন্ত ব্যাটারি লাইফ।',
    originalPrice: 5490,
    discountedPrice: 4190,
    stock: 15,
    rating: 4.9,
    reviewCount: 127,
    imageUrl: CATEGORY_IMAGES['Smart Watches'],
    sku: 'GZ-WTC-501',
    isFeatured: true,
    isBestSeller: false,
  },
  {
    id: 'gz-cable-100w-braided',
    name: 'ArmorWeave 100W Braided USB-C Cable (1.5m)',
    nameBn: 'আর্মারউইভ ১০০ ওয়াট ব্রেইডেড ইউএসবি-সি ক্যাবল',
    category: 'USB Cables',
    description:
      'Double-braided ballistic nylon jacket, CNC anodized aluminum connector shells, E-Marker chip for safe 100W power delivery, tested to 30,000 bends.',
    descriptionBn:
      'ডাবল-ব্রেইডেড নাইলন ও অ্যালুমিনিয়াম শেলসহ ১০০ ওয়াট ই-মার্কার চিপযুক্ত অত্যন্ত টেকসই ফাস্ট চার্জিং ক্যাবল।',
    originalPrice: 690,
    discountedPrice: 490,
    stock: 110,
    rating: 4.7,
    reviewCount: 310,
    imageUrl: CATEGORY_IMAGES['USB Cables'],
    sku: 'GZ-CBL-601',
    isFeatured: false,
    isBestSeller: true,
  },
  {
    id: 'gz-cover-aramid-magsafe',
    name: 'KevlarShield MagSafe Aramid Phone Case',
    nameBn: 'কেভলারশিল্ড ম্যাগসেফ অ্যারামিড মোবাইল কভার',
    category: 'Mobile Covers',
    description:
      'Featherweight woven aramid texture with N52 neodymium MagSafe magnetic ring, raised anodized camera bezel, and tactile metallic buttons.',
    descriptionBn:
      'হালকা ও প্রিমিয়াম অ্যারামিড টেক্সচার, শক্তিশালী ম্যাগসেফ ম্যাগনেটিক রিং এবং ক্যামেরা লেন্স প্রটেকশন।',
    originalPrice: 1490,
    discountedPrice: 1090,
    stock: 46,
    rating: 4.8,
    reviewCount: 119,
    imageUrl: CATEGORY_IMAGES['Mobile Covers'],
    sku: 'GZ-CVR-701',
    isFeatured: true,
    isBestSeller: false,
  },
  {
    id: 'gz-glass-9h-sapphire',
    name: 'ClearGuard 9H Tempered Glass + Alignment Kit',
    nameBn: 'ক্লিয়ারগার্ড ৯এইচ টেম্পারড গ্লাস প্রটেক্টর',
    category: 'Screen Protectors',
    description:
      'Zero-bubble dust-free installation tray included. 0.33mm aluminosilicate glass with oleophobic fingerprint-resistant coating.',
    descriptionBn:
      'অ্যালাইনমেন্ট ফ্রেমসহ বাবল-ফ্রি ইনস্টলেশন, ০.৩৩ মিমি অ্যালুমিনোসিলিকেট গ্লাস এবং ফিঙ্গারপ্রিন্ট-রেজিস্ট্যান্ট কোটিং।',
    originalPrice: 590,
    discountedPrice: 390,
    stock: 85,
    rating: 4.7,
    reviewCount: 205,
    imageUrl: CATEGORY_IMAGES['Screen Protectors'],
    sku: 'GZ-GLS-801',
    isFeatured: false,
    isBestSeller: true,
  },
  {
    id: 'gz-stand-cnc-alloy',
    name: 'AxisFold CNC Aluminum Desk Stand',
    nameBn: 'অ্যাক্সিসফোল্ড অ্যালুমিনিয়াম ডেস্ক মোবাইল স্ট্যান্ড',
    category: 'Mobile Stands',
    description:
      'Dual-axis stainless steel torque hinges crafted from aerospace aluminum alloy with anti-slip silicone pads and open charging port cutout.',
    descriptionBn:
      'অ্যারোস্পেস গ্রেড অ্যালুমিনিয়াম বডি, ডুয়াল-অ্যাক্সিস হিঞ্জ এবং চার্জিং পোর্ট কাটআউটসহ ফোল্ডেবল ডেস্ক স্ট্যান্ড।',
    originalPrice: 1290,
    discountedPrice: 890,
    stock: 41,
    rating: 4.8,
    reviewCount: 88,
    imageUrl: CATEGORY_IMAGES['Mobile Stands'],
    sku: 'GZ-STD-901',
    isFeatured: false,
    isBestSeller: false,
  },
  {
    id: 'gz-earbuds-lite-air',
    name: 'SoundCore Air Lite ENC Earbuds',
    nameBn: 'সাউন্ডকোর এয়ার লাইট ইয়ারবাডস',
    category: 'Wireless Earbuds',
    description:
      'Quad-mic Environmental Noise Cancellation for crystal-clear voice calls in busy traffic, ergonomic featherlight fit, and 30-hour battery.',
    descriptionBn:
      'কোয়াড-মাইক ইএনসি প্রযুক্তিসহ স্পষ্ট কল কোয়ালিটি, হালকা ডিজাইন এবং ৩০ ঘণ্টা ব্যাটারি ব্যাকআপ।',
    originalPrice: 2290,
    discountedPrice: 1650,
    stock: 39,
    rating: 4.6,
    reviewCount: 142,
    imageUrl: CATEGORY_IMAGES['Wireless Earbuds'],
    sku: 'GZ-EAR-105',
    isFeatured: false,
    isBestSeller: false,
  },
  {
    id: 'gz-charger-pd-30w-mini',
    name: 'VoltEdge Nano 30W USB-C Fast Adapter',
    nameBn: 'ভোল্টএজ ন্যানো ৩০ ওয়াট ফাস্ট অ্যাডাপ্টার',
    category: 'Fast Chargers',
    description:
      'Pocket-sized 30W USB-C PD adapter built for iPhone, Samsung Galaxy, and Pixel rapid charging with voltage surge protection.',
    descriptionBn:
      'পকেট-সাইজ ৩০ ওয়াট ইউএসবি-সি পিডি অ্যাডাপ্টার, ভোল্টেজ প্রটেকশনসহ আইফোন ও অ্যান্ড্রয়েডের জন্য উপযুক্ত।',
    originalPrice: 1350,
    discountedPrice: 990,
    stock: 64,
    rating: 4.8,
    reviewCount: 175,
    imageUrl: CATEGORY_IMAGES['Fast Chargers'],
    sku: 'GZ-CHG-309',
    isFeatured: false,
    isBestSeller: false,
  },
  {
    id: 'gz-powerbank-10k-magsafe',
    name: 'VoltEdge 10000mAh Magnetic Wireless Pack',
    nameBn: 'ভোল্টএজ ১০০০০ এমএএইচ ম্যাগনেটিক পাওয়ার ব্যাংক',
    category: 'Power Banks',
    description:
      'Snap-on 15W MagSafe wireless charging paired with 22.5W wired USB-C fast output in a matte aluminum slim enclosure.',
    descriptionBn:
      '১৫ ওয়াট ম্যাগনেটিক ওয়্যারলেস ও ২২.৫ ওয়াট ওয়্যার্ড ফাস্ট চার্জিং সাপোর্টেড স্লিম পাওয়ার ব্যাংক।',
    originalPrice: 2990,
    discountedPrice: 2290,
    stock: 23,
    rating: 4.8,
    reviewCount: 91,
    imageUrl: CATEGORY_IMAGES['Power Banks'],
    sku: 'GZ-PWB-410',
    isFeatured: false,
    isBestSeller: false,
  },
];

export const BD_DISTRICTS_BY_DIVISION: Record<BdDivision, string[]> = {
  Dhaka: ['Dhaka', 'Gazipur', 'Narayanganj', 'Tangail', 'Narsingdi', 'Savar', 'Manikganj', 'Munshiganj'],
  Chattogram: ['Chattogram', "Cox's Bazar", 'Cumilla', 'Feni', 'Brahmanbaria', 'Noakhali', 'Chandpur'],
  Rajshahi: ['Rajshahi', 'Bogura', 'Pabna', 'Sirajganj', 'Natore', 'Naogaon', 'Chapainawabganj'],
  Khulna: ['Khulna', 'Jashore', 'Kushtia', 'Satkhira', 'Bagerhat', 'Jhenaidah', 'Magura'],
  Sylhet: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  Barishal: ['Barishal', 'Patuakhali', 'Bhola', 'Pirojpur', 'Barguna', 'Jhalokati'],
  Rangpur: ['Rangpur', 'Dinajpur', 'Kurigram', 'Gaibandha', 'Nilphamari', 'Lalmonirhat', 'Thakurgaon'],
  Mymensingh: ['Mymensingh', 'Jamalpur', 'Sherpur', 'Netrokona'],
};

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  city: string;
  productName: string;
  rating: number;
  quote: string;
  quoteBn: string;
}

export const CUSTOMER_TESTIMONIALS: Testimonial[] = [
  {
    id: 'rev-1',
    name: 'Tahmidul Islam',
    role: 'Software Engineer',
    city: 'Banani, Dhaka',
    productName: 'VoltEdge 65W GaN Dual USB-C Charger',
    rating: 5,
    quote:
      'Ordered at 11 AM and received Cash on Delivery in Banani the very next morning. Charges both my MacBook Air and Galaxy S24 Ultra without heating up.',
    quoteBn:
      'সকাল ১১টায় অর্ডার করে পরদিন সকালেই ক্যাশ অন ডেলিভারিতে পেয়েছি। ল্যাপটপ ও ফোন একসাথে গরম না হয়েই ফাস্ট চার্জ হয়।',
  },
  {
    id: 'rev-2',
    name: 'Nusrat Jahan',
    role: 'Architecture Student',
    city: 'Agrabad, Chattogram',
    productName: 'SoundCore Pulse ANC Pro Earbuds',
    rating: 5,
    quote:
      'The noise cancellation completely blocks traffic noise on my daily bus commute in Chattogram, and the battery easily lasts me an entire week.',
    quoteBn:
      'চট্টগ্রামের রাস্তার জ্যাম ও বাসের শব্দ একদমই শোনা যায় না। এক চার্জে পুরো সপ্তাহ অনায়াসে চলে যায়।',
  },
  {
    id: 'rev-3',
    name: 'Farhan Ahmed',
    role: 'Content Creator',
    city: 'Zindabazar, Sylhet',
    productName: 'ChronoFit Titanium AMOLED Smart Watch',
    rating: 5,
    quote:
      'Packaging was sealed and authentic. Display brightness outdoors in daylight is razor sharp, and Gadget Zone support confirmed my order on WhatsApp in minutes.',
    quoteBn:
      'অরিজিনাল সিল্ড প্যাকেজিং পেয়েছি। রোদের মধ্যেও ডিসপ্লে একদম পরিষ্কার দেখা যায় এবং হোয়াটসঅ্যাপ সাপোর্ট খুবই দ্রুত।',
  },
];

export const UI_COPY = {
  en: {
    navHome: 'Home',
    navShop: 'Shop',
    navCategories: 'Categories',
    navAbout: 'About Us',
    navContact: 'Contact',
    searchPlaceholder: 'Search earbuds, 65W GaN chargers, smart watches...',
    heroHeadline: 'Upgrade Your Mobile Experience',
    heroSubtitle: 'Discover Premium Accessories at the Best Prices.',
    shopNow: 'Shop Now',
    exploreCategories: 'Browse Categories',
    categoriesTitle: 'Shop by Category',
    categoriesSubtitle: 'Curated mobile hardware across 9 essential accessory lines.',
    featuredTitle: 'Featured Products',
    featuredSubtitle: 'Precision-engineered essentials with verified warranty across Bangladesh.',
    bestSellingTitle: 'Best Selling Products',
    bestSellingSubtitle: 'Top-rated daily gear trusted by thousands of shoppers nationwide.',
    shopCatalogTitle: 'All Accessories',
    shopCatalogSubtitle: 'Filter by category, search by name or SKU, and sort by price or savings.',
    offerTitle: 'Power & Audio Essential Bundle',
    offerSubtitle: 'Save up to 28% on GaN Fast Chargers, Power Banks, and ANC Earbuds — plus free Dhaka delivery on orders over ৳3,000.',
    offerCta: 'Shop Offer Deals',
    whyTitle: 'Why Choose Gadget Zone',
    reviewsTitle: 'Verified Customer Reviews',
    reviewsSubtitle: 'Real feedback from shoppers across Dhaka, Chattogram, Sylhet, and beyond.',
    newsletterTitle: 'Stay Ahead on Restocks & Drops',
    newsletterSubtitle: 'Get early access to new GaN chargers, audio releases, and exclusive BDT flash deals.',
    newsletterPlaceholder: 'Enter your email address',
    newsletterBtn: 'Subscribe',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    outOfStock: 'Out of Stock',
    inStock: 'In Stock',
    allCategories: 'All Categories',
    freeDeliveryNote: 'Free delivery inside Bangladesh on orders ৳3,000+',
  },
  bn: {
    navHome: 'হোম',
    navShop: 'শপ',
    navCategories: 'ক্যাটাগরি',
    navAbout: 'আমাদের সম্পর্কে',
    navContact: 'যোগাযোগ',
    searchPlaceholder: 'ইয়ারবাডস, ৬৫ ওয়াট চার্জার বা স্মার্ট ওয়াচ খুঁজুন...',
    heroHeadline: 'আপনার মোবাইল অভিজ্ঞতাকে আপগ্রেড করুন',
    heroSubtitle: 'সেরা দামে প্রিমিয়াম মোবাইল এক্সেসরিজ এখন বাংলাদেশে।',
    shopNow: 'এখনই কিনুন',
    exploreCategories: 'ক্যাটাগরি দেখুন',
    categoriesTitle: 'ক্যাটাগরি অনুযায়ী শপিং',
    categoriesSubtitle: '৯টি প্রিমিয়াম ক্যাটাগরিতে আপনার ফোনের প্রয়োজনীয় সব এক্সেসরিজ।',
    featuredTitle: 'ফিচার্ড প্রোডাক্টস',
    featuredSubtitle: 'অফিশিয়াল ওয়ারেন্টিসহ সেরা মানের বাছাইকৃত গ্যাজেট।',
    bestSellingTitle: 'বেস্ট সেলিং প্রোডাক্টস',
    bestSellingSubtitle: 'সারাদেশের হাজারো ক্রেতার পছন্দের সেরা এক্সেসরিজ।',
    shopCatalogTitle: 'সব এক্সেসরিজ',
    shopCatalogSubtitle: 'ক্যাটাগরি, দাম ও ডিসকাউন্ট অনুযায়ী আপনার পছন্দের পণ্য খুঁজুন।',
    offerTitle: 'পাওয়ার ও অডিও স্পেশাল অফার',
    offerSubtitle: 'গ্যান ফাস্ট চার্জার, পাওয়ার ব্যাংক এবং ইয়ারবাডসে ২৮% পর্যন্ত ছাড় — ৩,০০০৳+ অর্ডারে ফ্রি ডেলিভারি।',
    offerCta: 'অফার দেখুন',
    whyTitle: 'কেন গ্যাজেট জোন সেরা?',
    reviewsTitle: 'ক্রেতাদের মতামত',
    reviewsSubtitle: 'ঢাকা, চট্টগ্রাম, সিলেটসহ সারাদেশের ক্রেতাদের অভিজ্ঞতা।',
    newsletterTitle: 'নতুন স্টক ও অফারের আপডেট পান',
    newsletterSubtitle: 'নতুন প্রোডাক্ট ও এক্সক্লুসিভ ডিসকাউন্টের খবর সবার আগে পেতে সাবস্ক্রাইব করুন।',
    newsletterPlaceholder: 'আপনার ইমেইল লিখুন',
    newsletterBtn: 'সাবস্ক্রাইব করুন',
    addToCart: 'কার্টে যোগ করুন',
    buyNow: 'এখনই অর্ডার',
    outOfStock: 'স্টক শেষ',
    inStock: 'স্টকে আছে',
    allCategories: 'সব ক্যাটাগরি',
    freeDeliveryNote: '৩,০০০৳+ অর্ডারে সারাদেশে ফ্রি ডেলিভারি',
  },
} as const;
