import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  Calculator,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Factory,
  FileText,
  Leaf,
  MapPin,
  Menu,
  Phone,
  Plus,
  Recycle,
  RefreshCw,
  RotateCcw,
  Scale,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Square,
  Trash2,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { AccessibilityTriggerButton } from '../components/ui/AccessibilityToolbar';
import { PortalSwitcherDropdown } from '../components/ui/PortalSwitcherDropdown';
import { SustainabilityImpactDashboard } from '../components/SustainabilityImpactDashboard';
import { BengaluruCorridorsMap } from '../components/maps/BengaluruServiceMap';
import { Punarchakra3DHubScene } from '../components/three/Punarchakra3DHubScene';
import { usePunarchakra } from '../context/PunarchakraContext';
import {
  COMMUNITY_ARTICLES_SEED,
  COMMUNITY_INITIATIVES_SEED,
  HERO_IMAGE,
  IMG_COMMUNITY_DRIVE,
  SEGREGATION_CHECKLISTS_SEED,
  SEGREGATION_QUIZ_SEED,
  SEGREGATION_STREAMS_SEED,
  W2V_PRODUCTS_SEED,
} from '../data/seedData';
import { CommunityArticle } from '../types/punarchakra';
import { CATEGORY_KN_NAMES } from '../i18n/translations';
import {
  AppLogo,
  Button,
  Card,
  ImageWithFallback,
  Input,
  LanguageToggleButton,
  Modal,
  Select,
  Textarea,
} from '../components/ui/Primitives';

type PublicSeoPageKey =
  | 'home'
  | 'categories'
  | 'rates'
  | 'w2v-studio'
  | 'how-it-works'
  | 'b2b'
  | 'community'
  | 'impact'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'ewaste';

const PUBLIC_PAGE_SEO: Record<
  PublicSeoPageKey,
  {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    pathSuffix: string;
  }
> = {
  home: {
    title: 'PUNARCHAKRA Bengaluru | North Bengaluru B2C & Industrial B2B Scrap Pickup',
    description:
      'Sell household scrap across North Bengaluru (B2C) and industrial scrap across Bengaluru Industrial Areas (B2B) with transparent live rates, calibrated weighing, and instant UPI payouts.',
    ogTitle: 'PUNARCHAKRA — North Bengaluru B2C & Industrial B2B Waste-to-Value',
    ogDescription:
      'Doorstep electric scrap collection across North Bengaluru (Hebbal, Yelahanka, Sahakara Nagar) and Bengaluru Industrial Areas (Peenya, Bommasandra, Whitefield EPIP).',
    pathSuffix: '#home',
  },
  categories: {
    title: 'Scrap Categories in Bengaluru | Newspapers, Metals & E-Waste — PUNARCHAKRA',
    description:
      'Explore 12 verified scrap categories collected across North Bengaluru homes and Bengaluru industrial areas: newspapers, cardboard, plastic, iron, steel, aluminium, copper, brass & e-waste.',
    ogTitle: '12 Verified Scrap Material Streams — Punarchakra Bengaluru',
    ogDescription:
      'Sell sorted household and industrial scrap in Bengaluru with calibrated digital scales and category-wise online pricing.',
    pathSuffix: '#categories',
  },
  rates: {
    title: 'Today’s Live Bengaluru Scrap Rates & Price Calculator — PUNARCHAKRA',
    description:
      'Check live online Bengaluru scrap rates per kg for copper, aluminium, iron, cardboard, paper, and e-waste. Calculate instant B2C & B2B scrap payout estimates.',
    ogTitle: 'Live Online Bengaluru Scrap Rates & Payout Calculator',
    ogDescription:
      'Real-time admin-published scrap prices for North Bengaluru households and Bengaluru industrial enterprises.',
    pathSuffix: '#rates',
  },
  'w2v-studio': {
    title: 'Waste-to-Value (W2V) Design & Engineering Studio | PUNARCHAKRA Bengaluru',
    description:
      'Discover how Punarchakra uses smart sorting technology and creative industrial design to transform Bengaluru trash into acoustic panels, polymer furniture, and reclaimed alloys.',
    ogTitle: 'Punarchakra W2V Studio — Turning Trash Into High-Demand Products',
    ogDescription:
      'Waste-to-Value manufacturing in Bengaluru: upcycled architectural boards, outdoor courtyard benches, and reclaimed alloy feedstocks.',
    pathSuffix: '#w2v-studio',
  },
  'how-it-works': {
    title: 'How Doorstep Scrap Pickup Works in Bengaluru | PUNARCHAKRA',
    description:
      'Learn Punarchakra’s 4-step transparent recycling workflow: select scrap & slot, EV doorstep collection across North Bengaluru & Industrial Areas, digital weighing, and UPI payout.',
    ogTitle: '4-Step Transparent Doorstep Scrap Pickup in Bengaluru',
    ogDescription:
      'Calibrated digital scales, zero rate manipulation, and instant UPI payouts across Hebbal, Yelahanka, Sahakara Nagar, Peenya & Whitefield EPIP.',
    pathSuffix: '#how-it-works',
  },
  b2b: {
    title: 'B2B Scrap Recycling for Bengaluru Industrial Areas | PUNARCHAKRA',
    description:
      'Enterprise scrap management across Peenya, Bommasandra, Jigani, Electronic City, Whitefield EPIP, Yeshwanthpur & Bidadi. Batch quotations, GST invoicing & ESG diversion reports.',
    ogTitle: 'Punarchakra Industrial Desk — B2B Recycling Across Bengaluru Industrial Areas',
    ogDescription:
      'Multi-plant Bengaluru industrial scrap contracts, Form-6 e-waste manifests, and automated ESG landfill-diversion reporting.',
    pathSuffix: '#b2b',
  },
  community: {
    title: 'Community Learning: Segregation Guides, Articles & Checklists | PUNARCHAKRA Bengaluru',
    description:
      'Explore Bengaluru waste segregation guides, resident articles, interactive pre-pickup checklists, a 4-bin sorting skill check, and North Bengaluru RWA workshops.',
    ogTitle: 'Community Learning — Waste Segregation Guides, Articles & Checklists',
    ogDescription:
      'Interactive 4-stream sorting clinic, Bengaluru resident articles, downloadable pre-pickup checklists, and North Bengaluru RWA Zero-Landfill drives.',
    pathSuffix: '#community',
  },
  impact: {
    title: 'Bengaluru Environmental Impact & Customer Reviews | PUNARCHAKRA',
    description:
      'See verified scrap diverted from Bengaluru landfills, CO2 emissions avoided, tree carbon offset metrics, and reviews from North Bengaluru homes & industrial units.',
    ogTitle: 'Verified Circular Economy Impact in Bengaluru — PUNARCHAKRA',
    ogDescription:
      'Track real-time tonnes recycled and CO2 avoided across North Bengaluru residential societies and industrial estates.',
    pathSuffix: '#impact',
  },
  contact: {
    title: 'Contact Punarchakra Bengaluru | North BLR Drives & Industrial Audits',
    description:
      'Contact Punarchakra Bengaluru for North Bengaluru apartment society drives, W2V sourcing, or Peenya/Whitefield/Bommasandra industrial scrap audits on +91 80 4120 8899.',
    ogTitle: 'Contact & Enquiry Desk — Punarchakra Bengaluru',
    ogDescription:
      'Schedule a North Bengaluru apartment scrap drive or request an industrial recycling audit with our local operations desk.',
    pathSuffix: '#contact',
  },
  privacy: {
    title: 'Privacy & Data Protection Policy | PUNARCHAKRA Bengaluru',
    description:
      'Read how Punarchakra protects customer contact details, Bengaluru pickup addresses, GSTIN records, and UPI payout identifiers under strict access control.',
    ogTitle: 'Privacy Policy — Punarchakra Circular Technologies',
    ogDescription:
      'Salted cryptographic credential security and role-based data protection across Punarchakra customer, business, and executive portals.',
    pathSuffix: '#privacy-policy',
  },
  terms: {
    title: 'Terms of Service & Digital Weighing Policy | PUNARCHAKRA',
    description:
      'Review Punarchakra Bengaluru terms for indicative online scrap rates, calibrated digital scale verification, and mutual 4-digit OTP payout confirmation.',
    ogTitle: 'Terms of Service — Punarchakra Bengaluru',
    ogDescription:
      'Transparent pricing governance, OTP-verified digital payouts, and doorstep scrap pickup terms in Bengaluru.',
    pathSuffix: '#terms',
  },
  ewaste: {
    title: 'E-Waste & KSPCB Compliance Manifest Policy | PUNARCHAKRA Bengaluru',
    description:
      'Punarchakra routes all Bengaluru electronic waste and appliances to State Pollution Control Board authorised recyclers with Form-6 manifest traceability.',
    ogTitle: 'E-Waste & KSPCB Compliance — Punarchakra Bengaluru',
    ogDescription:
      'Authorised e-waste dismantling and Form-6 compliance documentation for Bengaluru households and IT enterprises.',
    pathSuffix: '#ewaste-compliance',
  },
};

function upsertMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export const PublicWebsite: React.FC = () => {
  const {
    state,
    currentUser,
    navigateTo,
    getApplicableRate,
    checkPinServiceability,
    setPendingBookingDraft,
    submitContactEnquiry,
    submitCommunitySignup,
    quickDemoLogin,
    language,
    toggleLanguage,
    t,
    isLoading,
    lastRatesSyncAt,
    ratesSyncSource,
    syncLiveRatesOnline,
  } = usePunarchakra();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSeoPage, setActiveSeoPage] = useState<PublicSeoPageKey>('home');

  // PIN code availability checker
  const [pinInput, setPinInput] = useState('560092');
  const [pinChecked, setPinChecked] = useState<{
    checked: boolean;
    pin: string;
    serviceable: boolean;
    zoneName?: string;
    city?: string;
    slots?: string[];
    serviceSegment?: 'b2c' | 'b2b' | 'all';
    localities?: string[];
  }>({ checked: false, pin: '', serviceable: false });

  // Price calculator
  const [calcRole, setCalcRole] = useState<'b2c' | 'b2b'>('b2c');
  const calcCity = 'Bengaluru';
  const [calcCategoryFilter, setCalcCategoryFilter] = useState<string>('all');
  const [calcItems, setCalcItems] = useState<{ categoryId: string; qty: number }[]>([
    { categoryId: 'cat-newspapers', qty: 15 },
    { categoryId: 'cat-copper', qty: 2 },
  ]);

  // FAQ accordion
  const [openFaqId, setOpenFaqId] = useState<string | null>(state.cms.faqs[0]?.id || null);

  // Community Learning state (Guides & Quiz, Articles Modal, Interactive Checklists)
  const [learningTab, setLearningTab] = useState<'guides' | 'articles' | 'checklists'>('guides');
  const [activeStreamId, setActiveStreamId] = useState<string>(SEGREGATION_STREAMS_SEED[1].id);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, 'green' | 'blue' | 'yellow' | 'red'>>({});
  const [activeArticle, setActiveArticle] = useState<CommunityArticle | null>(null);
  const [activeChecklistId, setActiveChecklistId] = useState<string>(SEGREGATION_CHECKLISTS_SEED[0].id);
  const [checkedChecklistItems, setCheckedChecklistItems] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('punarchakra_learning_checklist_v1');
      return raw ? JSON.parse(raw) : { 'chk-h-1': true };
    } catch {
      return { 'chk-h-1': true };
    }
  });
  const [commForm, setCommForm] = useState({
    name: '',
    email: '',
    mobile: '',
    pinCode: '560092',
    organisation: '',
    programTitle: COMMUNITY_INITIATIVES_SEED[0].title,
  });
  const [commSubmitted, setCommSubmitted] = useState(false);

  // Contact form
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    mobile: '',
    enquiryType: 'Household Pickup' as 'Household Pickup' | 'B2B Corporate' | 'Society Drive' | 'Partnership',
    message: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Legal modal
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'ewaste' | null>(null);

  // Sync unique Open Graph tags, meta description, canonical URL, and Schema.org JSON-LD per section/page
  useEffect(() => {
    const key: PublicSeoPageKey = legalModal ?? activeSeoPage;
    const seo = PUBLIC_PAGE_SEO[key] || PUBLIC_PAGE_SEO.home;
    const baseUrl = window.location.origin + window.location.pathname;
    const pageUrl = `${baseUrl}${seo.pathSuffix}`;

    document.title = seo.title;
    upsertMetaTag('name', 'description', seo.description);
    upsertMetaTag('property', 'og:title', seo.ogTitle);
    upsertMetaTag('property', 'og:description', seo.ogDescription);
    upsertMetaTag('property', 'og:url', pageUrl);
    upsertMetaTag('property', 'og:site_name', 'PUNARCHAKRA Bengaluru');
    upsertMetaTag('name', 'twitter:title', seo.ogTitle);
    upsertMetaTag('name', 'twitter:description', seo.ogDescription);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', pageUrl);

    let ldScript = document.getElementById('pnc-dynamic-jsonld') as HTMLScriptElement | null;
    if (!ldScript) {
      ldScript = document.createElement('script');
      ldScript.id = 'pnc-dynamic-jsonld';
      ldScript.type = 'application/ld+json';
      document.head.appendChild(ldScript);
    }
    ldScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: seo.title,
      description: seo.description,
      url: pageUrl,
      inLanguage: language === 'kn' ? 'kn-IN' : 'en-IN',
      about: {
        '@type': 'LocalBusiness',
        name: 'PUNARCHAKRA Bengaluru',
        areaServed: { '@type': 'City', name: 'Bengaluru' },
      },
    });
  }, [activeSeoPage, legalModal, language]);

  // Observe homepage sections to keep OG tags & meta descriptions synchronized while browsing
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const sectionIds: PublicSeoPageKey[] = [
      'home',
      'categories',
      'rates',
      'w2v-studio',
      'how-it-works',
      'b2b',
      'community',
      'impact',
      'contact',
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id && sectionIds.includes(visible[0].target.id as PublicSeoPageKey)) {
          setActiveSeoPage(visible[0].target.id as PublicSeoPageKey);
        }
      },
      { threshold: 0.25 }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const activeCategories = useMemo(
    () => state.categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [state.categories]
  );

  const blrZonesCount = useMemo(
    () => state.serviceZones.filter((z) => z.isActive && z.city.toLowerCase() === 'bengaluru').length,
    [state.serviceZones]
  );

  const calcBreakdown = useMemo(() => {
    return calcItems.map((ci) => {
      const cat = activeCategories.find((c) => c.id === ci.categoryId) || activeCategories[0];
      const rate = getApplicableRate(cat.id, calcRole, calcCity);
      return {
        ...ci,
        category: cat,
        rate,
        subtotal: Math.round(ci.qty * rate),
      };
    });
  }, [calcItems, activeCategories, calcRole, calcCity, getApplicableRate]);

  const calcTotal = calcBreakdown.reduce((s, i) => s + i.subtotal, 0);

  useEffect(() => {
    try {
      localStorage.setItem('punarchakra_learning_checklist_v1', JSON.stringify(checkedChecklistItems));
    } catch {
      // Ignore storage error
    }
  }, [checkedChecklistItems]);

  const handlePinCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const res = checkPinServiceability(pinInput);
    setPinChecked({
      checked: true,
      pin: pinInput.trim(),
      serviceable: res.serviceable,
      zoneName: res.zone?.name,
      city: res.zone?.city,
      slots: res.zone?.dailySlots,
      serviceSegment: res.zone?.serviceSegment,
      localities: res.zone?.localities,
    });
  };

  const quickCheckPin = (pin: string) => {
    setPinInput(pin);
    const res = checkPinServiceability(pin);
    setPinChecked({
      checked: true,
      pin,
      serviceable: res.serviceable,
      zoneName: res.zone?.name,
      city: res.zone?.city,
      slots: res.zone?.dailySlots,
      serviceSegment: res.zone?.serviceSegment,
      localities: res.zone?.localities,
    });
  };

  const handleSellFromCalculator = (roleOverride?: 'b2c' | 'b2b', pinOverride?: string) => {
    const targetRole = roleOverride || calcRole;
    const mapped = calcItems
      .filter((ci) => ci.qty > 0)
      .map((ci) => {
        const sub = state.subcategories.find((s) => s.categoryId === ci.categoryId);
        return {
          categoryId: ci.categoryId,
          subcategoryId: sub?.id || '',
          qty: ci.qty,
        };
      });
    setPendingBookingDraft({
      items: mapped,
      pinCode: pinOverride || (pinChecked.serviceable ? pinChecked.pin : undefined),
    });
    if (currentUser && currentUser.role === targetRole) {
      navigateTo(targetRole);
    } else {
      navigateTo('auth', { authMode: 'register', role: targetRole });
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.mobile.trim()) return;
    submitContactEnquiry(contactForm);
    setContactSubmitted(true);
    setContactForm({ name: '', email: '', mobile: '', enquiryType: 'Household Pickup', message: '' });
  };

  const handleCommunitySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commForm.name.trim() || !commForm.email.trim() || !commForm.mobile.trim()) return;
    await submitCommunitySignup(commForm);
    setCommSubmitted(true);
  };

  const quizAnsweredCount = Object.keys(quizAnswers).length;
  const quizScore = SEGREGATION_QUIZ_SEED.filter((q) => quizAnswers[q.id] === q.correctBin).length;
  const activeStream =
    SEGREGATION_STREAMS_SEED.find((s) => s.id === activeStreamId) || SEGREGATION_STREAMS_SEED[0];
  const activeChecklist =
    SEGREGATION_CHECKLISTS_SEED.find((c) => c.id === activeChecklistId) || SEGREGATION_CHECKLISTS_SEED[0];
  const checklistDoneCount = activeChecklist.items.filter((i) => checkedChecklistItems[i.id]).length;
  const checklistPct = Math.round((checklistDoneCount / activeChecklist.items.length) * 100);

  return (
    <div id="home" className="min-h-screen bg-[#F7F9F6] text-[#202820]">
      {/* Announcement Strip (CMS controlled) */}
      {state.cms.announcementBanner && (
        <div className="bg-[#174B37] text-white/95 text-xs py-2 px-4 text-center">
          <span>{state.cms.announcementBanner}</span>
          <span className="mx-2 text-[#A5D66D]" aria-hidden="true">
            ·
          </span>
          <span className="text-[#A5D66D] font-medium">{state.cms.activeOfferText}</span>
        </div>
      )}

      {/* Top Navigation (3-zone contract) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#202820]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <AppLogo onClick={() => navigateTo('public', { section: 'home' })} />

          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-5 text-sm font-medium text-[#202820]/75">
            <a
              href="#categories"
              onClick={() => setActiveSeoPage('categories')}
              className="hover:text-[#174B37] transition-colors whitespace-nowrap shrink-0"
            >
              {t.navSellScrap}
            </a>
            <a
              href="#rates"
              onClick={() => setActiveSeoPage('rates')}
              className="hover:text-[#174B37] transition-colors whitespace-nowrap shrink-0"
            >
              {t.navRates}
            </a>
            <a
              href="#w2v-studio"
              onClick={() => setActiveSeoPage('w2v-studio')}
              className="hover:text-[#174B37] transition-colors whitespace-nowrap shrink-0"
            >
              {t.navW2v}
            </a>
            <a
              href="#community"
              onClick={() => setActiveSeoPage('community')}
              className="hover:text-[#174B37] transition-colors whitespace-nowrap shrink-0"
            >
              {t.navCommunity}
            </a>
            <a
              href="#b2b"
              onClick={() => setActiveSeoPage('b2b')}
              className="hover:text-[#174B37] transition-colors whitespace-nowrap shrink-0"
            >
              {t.navB2b}
            </a>
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {currentUser ? (
              <Button size="sm" onClick={() => navigateTo(currentUser.role)}>
                {t.openPortal} ({currentUser.role.toUpperCase()})
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigateTo('auth', { authMode: 'login', role: 'b2c' })}
                  className="px-3 py-2 text-sm font-medium text-[#174B37] hover:text-[#28A66A] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.navLogin}
                </button>
                <Button
                  size="sm"
                  onClick={() => navigateTo('auth', { authMode: 'register', role: 'b2c' })}
                >
                  {t.navRegister}
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#174B37] hover:bg-[#174B37]/8 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#202820]/10 bg-white px-4 py-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#202820]/10">
              <span className="text-xs font-medium text-[#202820]/65">Bengaluru · Portals & ಭಾಷೆ</span>
              <div className="flex items-center gap-2">
                <PortalSwitcherDropdown compact />
                <LanguageToggleButton language={language} onToggle={toggleLanguage} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm font-medium">
              {[
                { label: t.navSellScrap, href: '#categories', seo: 'categories' as PublicSeoPageKey },
                { label: t.navRates, href: '#rates', seo: 'rates' as PublicSeoPageKey },
                { label: t.navW2v, href: '#w2v-studio', seo: 'w2v-studio' as PublicSeoPageKey },
                { label: t.navCommunity, href: '#community', seo: 'community' as PublicSeoPageKey },
                { label: t.navB2b, href: '#b2b', seo: 'b2b' as PublicSeoPageKey },
                { label: t.navContact, href: '#contact', seo: 'contact' as PublicSeoPageKey },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setActiveSeoPage(link.seo);
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 px-3 rounded-lg hover:bg-[#F7F9F6] text-[#202820]"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="pt-2 border-t border-[#202820]/10 flex items-center gap-3">
              {currentUser ? (
                <Button className="w-full" onClick={() => navigateTo(currentUser.role)}>
                  {t.openPortal} ({currentUser.role.toUpperCase()})
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigateTo('auth', { authMode: 'login', role: 'b2c' })}
                  >
                    {t.navLogin}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => navigateTo('auth', { authMode: 'register', role: 'b2c' })}
                  >
                    {t.navRegister}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Portal Quick Switcher & Language Toggle Strip */}
      <div className="bg-white border-b border-[#202820]/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[#202820]/65 font-medium">{t.explorePortals}</span>
            <PortalSwitcherDropdown />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LanguageToggleButton language={language} onToggle={toggleLanguage} />
          </div>
        </div>
      </div>

      <main id="main-content" tabIndex={-1}>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-medium text-[#28A66A]">{t.heroKicker}</p>
              <h1 className="font-display font-bold text-[#174B37] tracking-tight leading-[1.08] text-[clamp(2.15rem,3.6vw,3.25rem)] [text-wrap:balance]">
                {language === 'kn' ? t.heroHeadline : state.cms.heroHeadline}
              </h1>
              <p className="text-sm sm:text-base text-[#202820]/75 leading-relaxed">
                {language === 'kn' ? t.heroSubheading : state.cms.heroSubheading}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={() => {
                  if (currentUser?.role === 'b2c') {
                    navigateTo('b2c');
                  } else {
                    navigateTo('auth', { authMode: 'register', role: 'b2c' });
                  }
                }}
              >
                {t.ctaSellScrap}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (currentUser?.role === 'b2b') {
                    navigateTo('b2b');
                  } else {
                    navigateTo('auth', { authMode: 'register', role: 'b2b' });
                  }
                }}
              >
                {t.ctaRegisterBiz}
              </Button>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-[#202820]/10">
              <div>
                <p className="font-display font-bold text-xl text-[#174B37] tabular-nums">12+</p>
                <p className="text-xs text-[#202820]/60">{t.statCategories}</p>
              </div>
              <div>
                <p className="font-display font-bold text-xl text-[#174B37] tabular-nums">
                  {blrZonesCount} {t.statZones}
                </p>
                <p className="text-xs text-[#202820]/60">{t.statZonesSub}</p>
              </div>
              <div>
                <p className="font-display font-bold text-xl text-[#174B37] tabular-nums">{t.statUpi}</p>
                <p className="text-xs text-[#202820]/60">{t.statUpiSub}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-white border border-[#202820]/10 overflow-hidden shadow-sm">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#EBF1EB]">
                <ImageWithFallback
                  src={HERO_IMAGE}
                  alt="Punarchakra Bengaluru solar-powered Waste-to-Value sorting hub with electric collection truck, digital weighing platform, and sorted scrap bays"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#174B37]/90 via-[#174B37]/45 to-transparent px-5 pt-10 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2 text-white">
                  <div>
                    <p className="font-display font-bold text-sm sm:text-base tracking-tight">
                      {language === 'kn'
                        ? 'ಪುನರ್ಚಕ್ರ ಬೆಂಗಳೂರು W2V ಮತ್ತು EV ಸಂಗ್ರಹಣಾ ಕೇಂದ್ರ'
                        : 'Punarchakra Bengaluru W2V & EV Recovery Hub'}
                    </p>
                    <p className="text-xs text-white/85">
                      {language === 'kn'
                        ? 'ಸೌರಶಕ್ತಿ ವಿಂಗಡಣಾ ಕೇಂದ್ರ · ಡಿಜಿಟಲ್ ತೂಕ ಯಂತ್ರ · ತಕ್ಷಣದ UPI ಪಾವತಿ'
                        : 'Solar-powered material grading · EV fleet dispatch · Calibrated digital weighing'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
                    <a
                      href="#w2v-studio"
                      onClick={() => setActiveSeoPage('w2v-studio')}
                      className="text-xs font-semibold text-white hover:text-[#A5D66D] underline-offset-4 hover:underline"
                    >
                      {language === 'kn' ? '3D ಹಬ್ ವೀಕ್ಷಿಸಿ' : 'Explore 3D Hub'}
                    </a>
                    <span className="text-white/40">·</span>
                    <a
                      href="#impact"
                      onClick={() => setActiveSeoPage('impact')}
                      className="text-xs font-semibold text-[#A5D66D] hover:text-white underline-offset-4 hover:underline"
                    >
                      {language === 'kn' ? 'ಲೈವ್ ಪ್ರಭಾವ ವೀಕ್ಷಿಸಿ' : 'View Live Impact'}
                    </a>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#202820]/10 bg-white">
                <div className="px-4 py-3.5">
                  <p className="text-xs font-semibold text-[#174B37]">
                    {language === 'kn' ? '01. EV ಮನೆಬಾಗಿಲ ಪಿಕಪ್' : '01. Doorstep EV Dispatch'}
                  </p>
                  <p className="text-xs text-[#202820]/65 mt-0.5 leading-snug">
                    {language === 'kn'
                      ? 'ಉತ್ತರ ಬೆಂಗಳೂರು ಮತ್ತು ಕೈಗಾರಿಕಾ ವಲಯಗಳಲ್ಲಿ 2.5 ಗಂಟೆಗಳ ಸ್ಲಾಟ್'
                      : '2.5-hr slots across North BLR & Industrial Hubs'}
                  </p>
                </div>
                <div className="px-4 py-3.5">
                  <p className="text-xs font-semibold text-[#174B37]">
                    {language === 'kn' ? '02. ನಿಖರ ಡಿಜಿಟಲ್ ತೂಕ' : '02. Digital Scale & OTP'}
                  </p>
                  <p className="text-xs text-[#202820]/65 mt-0.5 leading-snug">
                    {language === 'kn'
                      ? 'ನಿಮ್ಮ ಮುಂದೆಯೇ ±10g ನಿಖರ ತೂಕ ಮತ್ತು ಲಾಕ್ ಆದ ದರ'
                      : '±10g calibrated weighing at locked published rates'}
                  </p>
                </div>
                <div className="px-4 py-3.5">
                  <p className="text-xs font-semibold text-[#174B37]">
                    {language === 'kn' ? '03. ತಕ್ಷಣದ ಪಾವತಿ & W2V' : '03. Instant UPI & W2V'}
                  </p>
                  <p className="text-xs text-[#202820]/65 mt-0.5 leading-snug">
                    {language === 'kn'
                      ? 'ತಕ್ಷಣದ UPI/RTGS ಮತ್ತು ಮೌಲ್ಯವರ್ಧಿತ ಉತ್ಪನ್ನ ತಯಾರಿಕೆ'
                      : 'Instant UPI/RTGS cash + upcycled W2V manufacturing'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Bengaluru Service Availability Checker (PIN Code) */}
        <Card className="mt-8" padding="md">
          <form onSubmit={handlePinCheck} className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#174B37] mb-1">{t.pinTitle}</p>
              <p className="text-xs text-[#202820]/60">{t.pinHint}</p>
            </div>
            <div className="flex items-end gap-3 w-full md:w-auto">
              <div className="w-full sm:w-52">
                <Input
                  placeholder={t.pinPlaceholder}
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <Button type="submit" variant="secondary">
                <MapPin className="w-4 h-4" />
                {t.pinBtn}
              </Button>
            </div>
          </form>

          {/* Quick-Check Corridors for B2C North Bengaluru & B2B Industrial Areas */}
          <div className="mt-3.5 pt-3 border-t border-[#202820]/8 grid md:grid-cols-2 gap-3 text-[11px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-[#174B37] mr-1">B2C North BLR:</span>
              {[
                { pin: '560024', area: 'Hebbal' },
                { pin: '560092', area: 'Sahakara Nagar' },
                { pin: '560064', area: 'Yelahanka' },
                { pin: '560097', area: 'Vidyaranyapura' },
                { pin: '560043', area: 'Hennur' },
              ].map((item) => (
                <button
                  key={item.pin}
                  type="button"
                  onClick={() => quickCheckPin(item.pin)}
                  className="px-2 py-1 rounded-md border border-[#174B37]/15 bg-[#F7F9F6] text-[#174B37] hover:bg-[#174B37] hover:text-white transition-colors font-mono cursor-pointer"
                >
                  {item.pin} · {item.area}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-[#28A66A] mr-1">B2B Industrial:</span>
              {[
                { pin: '560058', area: 'Peenya' },
                { pin: '560066', area: 'Whitefield EPIP' },
                { pin: '560099', area: 'Bommasandra' },
                { pin: '560100', area: 'Electronic City' },
              ].map((item) => (
                <button
                  key={item.pin}
                  type="button"
                  onClick={() => quickCheckPin(item.pin)}
                  className="px-2 py-1 rounded-md border border-[#28A66A]/25 bg-[#F7F9F6] text-[#174B37] hover:bg-[#174B37] hover:text-white transition-colors font-mono cursor-pointer"
                >
                  {item.pin} · {item.area}
                </button>
              ))}
            </div>
          </div>

          {pinChecked.checked && (
            <div className="mt-4 pt-4 border-t border-[#202820]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {pinChecked.serviceable ? (
                <>
                  <div className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#28A66A] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#174B37]">
                        {t.pinAvailablePrefix} ({pinChecked.pin})
                      </p>
                      <p className="text-xs font-medium text-[#28A66A] mt-0.5">
                        {pinChecked.serviceSegment === 'b2b'
                          ? t.pinSegmentB2b
                          : pinChecked.serviceSegment === 'b2c'
                            ? t.pinSegmentB2c
                            : t.pinSegmentAll}
                      </p>
                      <p className="text-xs text-[#202820]/70 mt-0.5">
                        {pinChecked.zoneName} · {pinChecked.slots?.join(' · ')}
                      </p>
                      {pinChecked.localities && pinChecked.localities.length > 0 && (
                        <p className="text-[11px] text-[#202820]/60 mt-0.5">
                          Areas: {pinChecked.localities.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleSellFromCalculator(
                        pinChecked.serviceSegment === 'b2b' ? 'b2b' : 'b2c',
                        pinChecked.pin
                      )
                    }
                  >
                    {t.pinBookBtn} {pinChecked.pin}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-[#D97706] font-medium">
                  PIN {pinChecked.pin} {t.pinUnavailable}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Interactive Bengaluru Service Corridors Google Map */}
        <BengaluruCorridorsMap
          zones={state.serviceZones}
          selectedPin={pinChecked.checked ? pinChecked.pin : undefined}
          language={language}
          onSelectPinForBooking={(segment, pin) => handleSellFromCalculator(segment, pin)}
        />
      </section>

      {/* Section 1: 12 Scrap Categories */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-[#202820]/8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-[#28A66A]">{t.catKicker}</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#174B37] mt-1">
              {t.catHeading}
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveSeoPage('rates');
              document.getElementById('rates')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t.catOpenCalc}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {activeCategories.map((cat) => {
            const b2cRate = getApplicableRate(cat.id, 'b2c', calcCity);
            const b2bRate = getApplicableRate(cat.id, 'b2b', calcCity);
            const displayName = language === 'kn' ? CATEGORY_KN_NAMES[cat.id] || cat.name : cat.name;
            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-[#202820]/10 overflow-hidden flex flex-col hover:border-[#28A66A]/50 transition-colors"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#F7F9F6]">
                  <ImageWithFallback
                    src={cat.imageUrl}
                    alt={`${cat.name} recycling category`}
                    title={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display font-bold text-base text-[#174B37]">{displayName}</h3>
                      <span className="font-mono text-sm font-bold text-[#28A66A] tabular-nums">
                        ₹{b2cRate}/{cat.unit}
                      </span>
                    </div>
                    <p className="text-xs text-[#202820]/65 mt-1 line-clamp-2">{cat.description}</p>
                  </div>
                  <div className="pt-2 border-t border-[#202820]/8 flex items-center justify-between text-xs">
                    <span className="text-[#202820]/55 font-mono tabular-nums">B2B: ₹{b2bRate}/{cat.unit}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCalcItems((prev) =>
                          prev.some((p) => p.categoryId === cat.id)
                            ? prev
                            : [...prev, { categoryId: cat.id, qty: 10 }]
                        );
                        setActiveSeoPage('rates');
                        document.getElementById('rates')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-[#174B37] font-semibold hover:text-[#28A66A] cursor-pointer"
                    >
                      {t.catEstimate}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Live Indicative Scrap Prices & Scrap Price Calculator */}
      <section id="rates" className="bg-white border-y border-[#202820]/10 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#28A66A]">{t.ratesKicker}</p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#174B37] mt-1">
                    {t.ratesHeading}
                  </h2>
                  <p className="text-sm text-[#202820]/65 mt-1">{t.ratesSub}</p>
                  {lastRatesSyncAt && (
                    <p className="text-[11px] text-[#202820]/55 mt-1 font-mono">
                      {t.lastSynced}: {new Date(lastRatesSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {ratesSyncSource}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={syncLiveRatesOnline}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? t.syncingRates : t.syncRatesBtn}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 p-1 bg-[#F7F9F6] rounded-xl border border-[#202820]/10">
                  <button
                    type="button"
                    onClick={() => setCalcRole('b2c')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      calcRole === 'b2c' ? 'bg-[#174B37] text-white' : 'text-[#202820]/70 hover:text-[#174B37]'
                    }`}
                  >
                    {t.segmentB2c}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcRole('b2b')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      calcRole === 'b2b' ? 'bg-[#174B37] text-white' : 'text-[#202820]/70 hover:text-[#174B37]'
                    }`}
                  >
                    {t.segmentB2b}
                  </button>
                </div>

                <div className="px-3.5 py-2 rounded-xl border border-[#202820]/10 bg-[#F7F9F6] text-xs font-semibold text-[#174B37] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#28A66A]" />
                  <span>Bengaluru (560xxx)</span>
                </div>

                <div className="w-44">
                  <Select value={calcCategoryFilter} onChange={(e) => setCalcCategoryFilter(e.target.value)}>
                    <option value="all">{t.filterAll}</option>
                    <option value="paper">{t.filterPaper}</option>
                    <option value="metal">{t.filterMetal}</option>
                    <option value="tech">{t.filterTech}</option>
                  </Select>
                </div>
              </div>

              <div className="border border-[#202820]/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#F7F9F6] border-b border-[#202820]/10">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#202820]/65">{t.thMaterial}</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#202820]/65">{t.thUnit}</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#202820]/65">{t.thRate}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202820]/8">
                    {activeCategories
                      .filter((c) => {
                        if (calcCategoryFilter === 'paper') return ['newspapers', 'books', 'cardboard'].includes(c.slug);
                        if (calcCategoryFilter === 'metal') return ['iron', 'steel', 'aluminium', 'copper', 'brass'].includes(c.slug);
                        if (calcCategoryFilter === 'tech') return ['ewaste', 'appliances'].includes(c.slug);
                        return true;
                      })
                      .map((cat) => (
                        <tr key={cat.id} className="hover:bg-[#F7F9F6]/60">
                          <td className="px-4 py-2.5 font-medium text-[#202820]">
                            {language === 'kn' ? CATEGORY_KN_NAMES[cat.id] || cat.name : cat.name}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-[#202820]/60">per {cat.unit}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold text-[#174B37] tabular-nums">
                            ₹{getApplicableRate(cat.id, calcRole, calcCity).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interactive Scrap Price Calculator */}
            <div className="lg:col-span-6">
              <Card className="bg-[#F7F9F6]" padding="lg">
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#202820]/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#174B37] text-[#A5D66D] flex items-center justify-center">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-[#174B37]">{t.calcTitle}</h3>
                      <p className="text-xs text-[#202820]/60">
                        {calcRole === 'b2c' ? t.segmentB2c : t.segmentB2b} · Bengaluru
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setCalcItems((prev) => [...prev, { categoryId: activeCategories[0].id, qty: 10 }])
                    }
                  >
                    <Plus className="w-4 h-4" />
                    {t.calcAddMaterial}
                  </Button>
                </div>

                <div className="space-y-3 py-4">
                  {calcBreakdown.map((row, idx) => (
                    <div
                      key={`${row.categoryId}-${idx}`}
                      className="grid grid-cols-12 gap-2.5 items-center bg-white p-3 rounded-xl border border-[#202820]/10"
                    >
                      <div className="col-span-6 sm:col-span-5">
                        <Select
                          value={row.categoryId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCalcItems((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, categoryId: val } : p))
                            );
                          }}
                        >
                          {activeCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {language === 'kn' ? CATEGORY_KN_NAMES[c.id] || c.name : c.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min={1}
                          value={row.qty}
                          onChange={(e) => {
                            const q = Math.max(0, Number(e.target.value));
                            setCalcItems((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, qty: q } : p))
                            );
                          }}
                        />
                      </div>
                      <div className="col-span-2 text-right font-mono text-sm font-semibold text-[#174B37] tabular-nums">
                        ₹{row.subtotal.toLocaleString('en-IN')}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          aria-label="Remove item"
                          onClick={() => setCalcItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 text-[#202820]/45 hover:text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#202820]/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#202820]/75">{t.calcEstValue}</span>
                    <span className="font-display text-3xl font-bold text-[#174B37] tabular-nums">
                      ₹{calcTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-[#202820]/60 leading-relaxed">{t.calcDisclaimer}</p>
                  <Button className="w-full" size="lg" onClick={() => handleSellFromCalculator()}>
                    {t.calcScheduleBtn}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Waste-to-Value (W2V) Innovation Studio Section */}
      <section id="w2v-studio" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-b border-[#202820]/8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold text-[#28A66A] flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.w2vKicker}</span>
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#174B37] mt-1">
              {t.w2vHeading}
            </h2>
            <p className="text-sm sm:text-base text-[#202820]/70 mt-2 leading-relaxed">{t.w2vSub}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setContactForm((f) => ({ ...f, enquiryType: 'Partnership' }));
              setActiveSeoPage('contact');
              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            {t.w2vCta}
          </Button>
        </div>

        <div className="mb-8">
          <Punarchakra3DHubScene
            language={language}
            onCtaClick={() => handleSellFromCalculator('b2c')}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {W2V_PRODUCTS_SEED.map((item) => (
            <Card key={item.id} padding="none" className="overflow-hidden flex flex-col">
              <div className="aspect-[16/10] w-full bg-[#F7F9F6] overflow-hidden">
                <ImageWithFallback
                  src={item.imageUrl}
                  alt={language === 'kn' ? item.titleKn : item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-[#28A66A]">
                    Input: {language === 'kn' ? item.wasteInputKn : item.wasteInput}
                  </p>
                  <h3 className="font-display font-bold text-lg text-[#174B37] leading-snug">
                    {language === 'kn' ? item.titleKn : item.title}
                  </h3>
                  <p className="text-xs text-[#202820]/70 leading-relaxed">
                    {item.engineeringProcess}
                  </p>
                  <p className="text-xs text-[#202820]/80 leading-relaxed">
                    <span className="font-semibold text-[#174B37]">Market Demand: </span>
                    {language === 'kn' ? item.marketDemandKn : item.marketDemand}
                  </p>
                </div>
                <div className="pt-3 border-t border-[#202820]/10 flex items-center justify-between text-xs font-mono font-semibold text-[#174B37] tabular-nums">
                  <span>{item.diversionMetric}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-5 rounded-2xl bg-white border border-[#202820]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#174B37]">{t.w2vPipelineTitle}</p>
            <p className="text-xs text-[#202820]/65 mt-0.5">
              Optical Sorting + Moisture Check → Material Upcycling Studio → Commercial Acoustic, Urban Furniture & Alloy Products
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#174B37]">
            <span className="px-3 py-1.5 rounded-lg bg-[#F7F9F6] border border-[#174B37]/15">01. Doorstep EV Collection</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#28A66A]" aria-hidden="true" />
            <span className="px-3 py-1.5 rounded-lg bg-[#F7F9F6] border border-[#174B37]/15">02. AI & Optical Grading</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#28A66A]" aria-hidden="true" />
            <span className="px-3 py-1.5 rounded-lg bg-[#174B37] text-white">03. High-Demand W2V Goods</span>
          </div>
        </div>
      </section>

      {/* Section 3 & 4: How Punarchakra Works + Benefits of Doorstep Collection */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold text-[#28A66A]">{t.howKicker}</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#174B37] mt-1">
            {t.howHeading}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { num: '01.', title: t.step1Title, desc: t.step1Desc, Icon: Smartphone },
            { num: '02.', title: t.step2Title, desc: t.step2Desc, Icon: Truck },
            { num: '03.', title: t.step3Title, desc: t.step3Desc, Icon: Scale },
            { num: '04.', title: t.step4Title, desc: t.step4Desc, Icon: ShieldCheck },
          ].map((step) => {
            const Icon = step.Icon;
            return (
              <Card key={step.num} padding="md" className="flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-[#28A66A] tabular-nums">{step.num}</span>
                  <div className="w-9 h-9 rounded-xl bg-[#174B37]/8 text-[#174B37] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#174B37]">{step.title}</h3>
                  <p className="text-sm text-[#202820]/65 mt-1.5 leading-relaxed">{step.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Benefits Strip */}
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            { title: t.ben1Title, desc: t.ben1Desc },
            { title: t.ben2Title, desc: t.ben2Desc },
            { title: t.ben3Title, desc: t.ben3Desc },
          ].map((b) => (
            <div key={b.title} className="p-5 rounded-2xl bg-white border border-[#202820]/10">
              <h4 className="font-display font-bold text-base text-[#174B37]">{b.title}</h4>
              <p className="text-sm text-[#202820]/65 mt-1.5">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: B2B Recycling Solutions Across Bengaluru Industrial Areas */}
      <section id="b2b" className="bg-[#174B37] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-semibold text-[#A5D66D]">{t.b2bKicker}</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight [text-wrap:balance]">
              {t.b2bHeading}
            </h2>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-2xl">{t.b2bSub}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-white/90 pt-1">
              {[
                'Peenya Phases I–IV (560058)',
                'Whitefield EPIP & Hoodi (560066)',
                'Bommasandra & Jigani (560099)',
                'Electronic City Ph I–II (560100)',
                'Yeshwanthpur & Rajajinagar (560022)',
                'Kumbalgodu & Bidadi KIADB (560074)',
              ].map((corridor) => (
                <div key={corridor} className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-[#A5D66D] shrink-0" />
                  <span>{corridor}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigateTo('auth', { authMode: 'register', role: 'b2b' })}
              >
                {t.ctaRegisterBiz}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent text-white border-white/30 hover:bg-white/10"
                onClick={() => quickDemoLogin('b2b')}
              >
                {t.b2bDemoBtn}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white/8 border border-white/15 rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-[#A5D66D]">{t.b2bWorkflowTitle}</h3>
            <ol className="space-y-3 text-sm text-white/85">
              <li>1. Upload scrap inventory with weights, industrial area branch, and photos.</li>
              <li>2. Receive category-wise contract pricing from our Bengaluru Enterprise Desk.</li>
              <li>3. Accept, reject, or request revision in one click.</li>
              <li>4. Convert accepted quotations directly into scheduled hydraulic EV pickups.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Community Learning Section: Guides, Articles, Interactive Checklists & Drives */}
      <section id="community" className="bg-white border-b border-[#202820]/10 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold text-[#28A66A] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.commKicker}</span>
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#174B37] mt-1">
                {t.commHeading}
              </h2>
              <p className="text-sm sm:text-base text-[#202820]/70 mt-2 leading-relaxed">{t.commSub}</p>
            </div>

            {/* Community Learning Module Switcher */}
            <div
              role="tablist"
              aria-label="Community Learning modules"
              className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F7F9F6] rounded-xl border border-[#202820]/10 shrink-0"
            >
              {(
                [
                  { id: 'guides', label: t.commGuidesTab, Icon: BookOpen },
                  { id: 'articles', label: t.commArticlesTab, Icon: FileText },
                  { id: 'checklists', label: t.commChecklistsTab, Icon: CheckSquare },
                ] as const
              ).map((tabItem) => {
                const Icon = tabItem.Icon;
                const active = learningTab === tabItem.id;
                return (
                  <button
                    key={tabItem.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setLearningTab(tabItem.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#174B37] text-white'
                        : 'text-[#202820]/75 hover:text-[#174B37]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{tabItem.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MODULE 1: 4-Stream Segregation Guide + Interactive Quiz */}
          {learningTab === 'guides' && (
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-4">
                <h3 className="font-display text-lg font-bold text-[#174B37]">{t.segGuideTitle}</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {SEGREGATION_STREAMS_SEED.map((stream) => {
                    const selected = stream.id === activeStream.id;
                    return (
                      <button
                        key={stream.id}
                        type="button"
                        onClick={() => setActiveStreamId(stream.id)}
                        aria-pressed={selected}
                        className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#F7F9F6] border-[#174B37] ring-1 ring-[#174B37]'
                            : 'bg-white border-[#202820]/12 hover:border-[#174B37]/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-sm shrink-0"
                            style={{ backgroundColor: stream.hex }}
                            aria-hidden="true"
                          />
                          <span className="font-display font-bold text-sm text-[#174B37]">
                            {language === 'kn' ? stream.titleKn : stream.title}
                          </span>
                        </div>
                        <ul className="mt-2.5 space-y-1 text-xs text-[#202820]/70">
                          {(language === 'kn' ? stream.examplesKn : stream.examples).map((ex) => (
                            <li key={ex}>• {ex}</li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-[#F7F9F6] border border-[#174B37]/20 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: activeStream.hex }} aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold text-[#174B37]">
                      {language === 'kn' ? activeStream.titleKn : activeStream.title}
                    </p>
                    <p className="text-xs text-[#202820]/75 mt-1">
                      {language === 'kn' ? activeStream.ruleTipKn : activeStream.ruleTip}
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Waste Segregation Skill Check Quiz */}
              <div className="lg:col-span-5">
                <Card className="bg-[#F7F9F6]" padding="md">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#202820]/10">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#28A66A]" aria-hidden="true" />
                      <h3 className="font-display font-bold text-base text-[#174B37]">{t.quizTitle}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#174B37] tabular-nums">
                        {quizScore}/{SEGREGATION_QUIZ_SEED.length}
                      </span>
                      {quizAnsweredCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setQuizAnswers({})}
                          aria-label="Reset segregation quiz"
                          className="p-1 text-[#202820]/60 hover:text-[#174B37] cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-3">
                    {SEGREGATION_QUIZ_SEED.map((q, qIdx) => {
                      const chosen = quizAnswers[q.id];
                      const isCorrect = chosen === q.correctBin;
                      return (
                        <div key={q.id} className="p-3.5 rounded-xl bg-white border border-[#202820]/10 space-y-2.5">
                          <p className="text-xs font-semibold text-[#202820]">
                            {qIdx + 1}. {language === 'kn' ? q.itemNameKn : q.itemName}
                          </p>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(
                              [
                                { id: 'green', label: 'Green Wet' },
                                { id: 'blue', label: 'Blue Dry' },
                                { id: 'yellow', label: 'Yellow E-Waste' },
                                { id: 'red', label: 'Red Hazard' },
                              ] as const
                            ).map((opt) => {
                              const active = chosen === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                                    active
                                      ? opt.id === q.correctBin
                                        ? 'bg-[#16A34A] text-white border-[#16A34A]'
                                        : 'bg-[#DC2626] text-white border-[#DC2626]'
                                      : 'bg-[#F7F9F6] text-[#202820]/75 border-[#202820]/12 hover:border-[#174B37]/40'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                          {chosen && (
                            <p
                              className={`text-[11px] leading-relaxed ${
                                isCorrect ? 'text-[#16A34A]' : 'text-[#DC2626]'
                              }`}
                            >
                              {isCorrect ? 'Correct! ' : `Best bin: ${q.correctBin.toUpperCase()}. `}
                              {language === 'kn' ? q.explanationKn : q.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* MODULE 2: Bengaluru Resident & Industrial Articles */}
          {learningTab === 'articles' && (
            <div className="grid md:grid-cols-3 gap-6">
              {COMMUNITY_ARTICLES_SEED.map((article) => (
                <Card key={article.id} padding="md" className="flex flex-col justify-between space-y-4 bg-[#F7F9F6]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#28A66A]">
                        {language === 'kn' ? article.categoryKn : article.category}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[#202820]/60 tabular-nums">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        {article.readTime}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg text-[#174B37] leading-snug">
                      {language === 'kn' ? article.titleKn : article.title}
                    </h3>
                    <p className="text-xs text-[#202820]/75 leading-relaxed">
                      {language === 'kn' ? article.summaryKn : article.summary}
                    </p>
                    <p className="text-[11px] font-mono text-[#174B37]/80 border-t border-[#202820]/10 pt-2.5">
                      {article.bengaluruFocus}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setActiveArticle(article)}
                  >
                    {t.commReadArticle}
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {/* MODULE 3: Interactive Segregation & Pre-Pickup Checklists */}
          {learningTab === 'checklists' && (
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 space-y-3">
                {SEGREGATION_CHECKLISTS_SEED.map((chk) => {
                  const selected = chk.id === activeChecklist.id;
                  const doneCount = chk.items.filter((i) => checkedChecklistItems[i.id]).length;
                  return (
                    <button
                      key={chk.id}
                      type="button"
                      onClick={() => setActiveChecklistId(chk.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                        selected
                          ? 'bg-[#174B37] text-white border-[#174B37]'
                          : 'bg-[#F7F9F6] text-[#202820] border-[#202820]/12 hover:border-[#174B37]/40'
                      }`}
                    >
                      <p className={`text-[11px] font-semibold ${selected ? 'text-[#A5D66D]' : 'text-[#28A66A]'}`}>
                        {chk.audience === 'household'
                          ? t.commChecklistAudienceHousehold
                          : t.commChecklistAudienceFacility}
                      </p>
                      <p className="font-display font-bold text-sm">
                        {language === 'kn' ? chk.titleKn : chk.title}
                      </p>
                      <p className={`text-xs font-mono tabular-nums ${selected ? 'text-white/80' : 'text-[#202820]/60'}`}>
                        {doneCount}/{chk.items.length} completed
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-8">
                <Card className="bg-[#F7F9F6]" padding="lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#202820]/10">
                    <div>
                      <h3 className="font-display font-bold text-lg text-[#174B37]">
                        {language === 'kn' ? activeChecklist.titleKn : activeChecklist.title}
                      </h3>
                      <p className="text-xs text-[#202820]/65 mt-0.5">
                        {language === 'kn' ? activeChecklist.subtitleKn : activeChecklist.subtitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCheckedChecklistItems((prev) => {
                            const next = { ...prev };
                            activeChecklist.items.forEach((it) => {
                              next[it.id] = true;
                            });
                            return next;
                          });
                        }}
                      >
                        {t.commChecklistCompleteAll}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCheckedChecklistItems((prev) => {
                            const next = { ...prev };
                            activeChecklist.items.forEach((it) => {
                              delete next[it.id];
                            });
                            return next;
                          });
                        }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        {t.commChecklistReset}
                      </Button>
                    </div>
                  </div>

                  {/* Progress Meter */}
                  <div className="py-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#174B37]">
                      <span>{t.commChecklistProgress}</span>
                      <span className="font-mono tabular-nums">
                        {checklistDoneCount}/{activeChecklist.items.length} ({checklistPct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white border border-[#202820]/10 overflow-hidden">
                      <div
                        className="h-full bg-[#28A66A] transition-all duration-300"
                        style={{ width: `${checklistPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Interactive Checklist Items */}
                  <div className="space-y-2.5 pt-2">
                    {activeChecklist.items.map((item) => {
                      const checked = Boolean(checkedChecklistItems[item.id]);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setCheckedChecklistItems((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }))
                          }
                          aria-pressed={checked}
                          className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer ${
                            checked
                              ? 'bg-white border-[#28A66A]/45'
                              : 'bg-white border-[#202820]/10 hover:border-[#174B37]/40'
                          }`}
                        >
                          {checked ? (
                            <CheckSquare className="w-5 h-5 text-[#28A66A] shrink-0 mt-0.5" aria-hidden="true" />
                          ) : (
                            <Square className="w-5 h-5 text-[#202820]/35 shrink-0 mt-0.5" aria-hidden="true" />
                          )}
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-medium ${
                                checked ? 'text-[#174B37] line-through opacity-75' : 'text-[#202820]'
                              }`}
                            >
                              {language === 'kn' ? item.labelKn : item.label}
                            </p>
                            <p className="text-xs text-[#202820]/60 mt-0.5">
                              {language === 'kn' ? item.tipKn : item.tip}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Community Drives & Workshop Registration */}
          <div className="grid lg:grid-cols-12 gap-8 items-start pt-6 border-t border-[#202820]/10">
            <div className="lg:col-span-7 space-y-5">
              <div className="aspect-[16/8] w-full rounded-2xl overflow-hidden border border-[#202820]/10 bg-[#F7F9F6]">
                <ImageWithFallback
                  src={IMG_COMMUNITY_DRIVE}
                  alt="North Bengaluru apartment community waste segregation learning workshop"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {COMMUNITY_INITIATIVES_SEED.map((init) => (
                  <Card key={init.id} padding="sm" className="flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#28A66A]">
                        <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{language === 'kn' ? init.audienceKn : init.audience}</span>
                      </div>
                      <h4 className="font-display font-bold text-sm text-[#174B37] mt-1.5">
                        {language === 'kn' ? init.titleKn : init.title}
                      </h4>
                      <p className="text-xs text-[#202820]/70 mt-1.5 leading-relaxed">
                        {language === 'kn' ? init.outcomesKn : init.outcomes}
                      </p>
                    </div>
                    <p className="text-[11px] font-mono text-[#174B37]/80 pt-2 border-t border-[#202820]/8">
                      {init.schedule}
                    </p>
                  </Card>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <Card className="bg-[#F7F9F6]" padding="lg">
                <h3 className="font-display text-xl font-bold text-[#174B37]">{t.commSignupTitle}</h3>
                <p className="text-xs text-[#202820]/65 mt-1 mb-4">
                  Invite Punarchakra’s Waste-to-Value educators to your North Bengaluru RWA, school, or industrial team.
                </p>

                {commSubmitted ? (
                  <div className="p-5 rounded-xl bg-white border border-[#28A66A]/30 space-y-3">
                    <div className="flex items-center gap-2 text-[#174B37] font-semibold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-[#28A66A]" aria-hidden="true" />
                      <span>{t.commSubmittedTitle}</span>
                    </div>
                    <p className="text-xs text-[#202820]/75 leading-relaxed">{t.commSubmittedDesc}</p>
                    <Button size="sm" variant="outline" onClick={() => setCommSubmitted(false)}>
                      Register Another Community Drive
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleCommunitySignup} className="space-y-3.5">
                    <Select
                      label="Community Program"
                      value={commForm.programTitle}
                      onChange={(e) => setCommForm((f) => ({ ...f, programTitle: e.target.value }))}
                    >
                      {COMMUNITY_INITIATIVES_SEED.map((p) => (
                        <option key={p.id} value={p.title}>
                          {p.title}
                        </option>
                      ))}
                    </Select>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input
                        label="Coordinator Name"
                        required
                        placeholder="Meera Krishnan"
                        value={commForm.name}
                        onChange={(e) => setCommForm((f) => ({ ...f, name: e.target.value }))}
                      />
                      <Input
                        label="Mobile"
                        required
                        placeholder="+91 98450 00000"
                        value={commForm.mobile}
                        onChange={(e) => setCommForm((f) => ({ ...f, mobile: e.target.value }))}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input
                        label="Email"
                        type="email"
                        required
                        placeholder="rwa@apartment.in"
                        value={commForm.email}
                        onChange={(e) => setCommForm((f) => ({ ...f, email: e.target.value }))}
                      />
                      <Input
                        label="Bengaluru PIN"
                        maxLength={6}
                        required
                        value={commForm.pinCode}
                        onChange={(e) => setCommForm((f) => ({ ...f, pinCode: e.target.value.replace(/\D/g, '') }))}
                      />
                    </div>
                    <Input
                      label="RWA / School / Organisation"
                      placeholder="Sahakara Nagar RWA / Yelahanka Vidyashilp"
                      value={commForm.organisation}
                      onChange={(e) => setCommForm((f) => ({ ...f, organisation: e.target.value }))}
                    />
                    <Button type="submit" className="w-full" size="md">
                      {t.commSubmitBtn}
                    </Button>
                  </form>
                )}
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Full Community Learning Article Reader Modal */}
      <Modal
        open={activeArticle !== null}
        onClose={() => setActiveArticle(null)}
        title={
          activeArticle
            ? language === 'kn'
              ? activeArticle.titleKn
              : activeArticle.title
            : ''
        }
        maxWidth="max-w-2xl"
      >
        {activeArticle && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#202820]/65 pb-3 border-b border-[#202820]/10">
              <span className="font-semibold text-[#28A66A]">
                {language === 'kn' ? activeArticle.categoryKn : activeArticle.category} · {activeArticle.readTime}
              </span>
              <span className="font-mono text-[#174B37]">
                {t.commArticleFocus}: {activeArticle.bengaluruFocus}
              </span>
            </div>

            <div className="space-y-3 text-sm text-[#202820]/85 leading-relaxed">
              {(language === 'kn' ? activeArticle.bodyParagraphsKn : activeArticle.bodyParagraphs).map(
                (para, idx) => (
                  <p key={idx}>{para}</p>
                )
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#F7F9F6] border border-[#174B37]/15 space-y-2">
              <p className="text-xs font-bold text-[#174B37]">{t.commArticleTakeaways}</p>
              <ul className="space-y-1.5 text-xs text-[#202820]/80">
                {(language === 'kn' ? activeArticle.keyTakeawaysKn : activeArticle.keyTakeaways).map(
                  (pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#28A66A] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{pt}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      {/* Section 6 & 7: Sustainability Impact Dashboard + Customer Testimonials */}
      <section id="impact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <SustainabilityImpactDashboard />

        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#174B37] mb-6">
            {t.reviewsHeading}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {state.reviews.map((rev) => (
              <Card key={rev.id} padding="md" className="flex flex-col justify-between space-y-4">
                <p className="text-sm text-[#202820]/80 leading-relaxed">“{rev.comment}”</p>
                <div className="pt-3 border-t border-[#202820]/8">
                  <p className="font-display font-bold text-sm text-[#174B37]">{rev.userName}</p>
                  <p className="text-xs text-[#202820]/60">
                    {rev.roleLabel}
                    {rev.organization ? ` · ${rev.organization}` : ''}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8 & 9: Frequently Asked Questions & Contact Enquiry Form */}
      <section id="contact" className="bg-white border-t border-[#202820]/10 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#174B37]">
              {t.faqHeading}
            </h2>
            <div className="divide-y divide-[#202820]/10 border border-[#202820]/10 rounded-2xl overflow-hidden">
              {state.cms.faqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div key={faq.id} className="bg-white">
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left font-medium text-sm text-[#174B37] hover:bg-[#F7F9F6] cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-sm text-[#202820]/70 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-6">
            <Card className="bg-[#F7F9F6]" padding="lg">
              <h2 className="font-display text-2xl font-bold text-[#174B37]">{t.contactHeading}</h2>
              <p className="text-sm text-[#202820]/65 mt-1 mb-5">{t.contactSub}</p>
              {contactSubmitted ? (
                <div className="p-5 rounded-xl bg-white border border-[#28A66A]/30 space-y-3">
                  <div className="flex items-center gap-2 text-[#174B37] font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-[#28A66A]" />
                    <span>{t.contactSuccess}</span>
                  </div>
                  <p className="text-sm text-[#202820]/70">{t.contactSuccessDesc}</p>
                  <Button size="sm" variant="outline" onClick={() => setContactSubmitted(false)}>
                    {t.contactAnother}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      required
                      placeholder="Priya Nair"
                      value={contactForm.name}
                      onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                    />
                    <Input
                      label="Mobile Number"
                      required
                      placeholder="+91 98450 00000"
                      value={contactForm.mobile}
                      onChange={(e) => setContactForm((f) => ({ ...f, mobile: e.target.value }))}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Email Address"
                      type="email"
                      required
                      placeholder="priya@company.in"
                      value={contactForm.email}
                      onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                    />
                    <Select
                      label="Enquiry Type"
                      value={contactForm.enquiryType}
                      onChange={(e) =>
                        setContactForm((f) => ({
                          ...f,
                          enquiryType: e.target.value as typeof contactForm.enquiryType,
                        }))
                      }
                    >
                      <option value="Household Pickup">Household Pickup</option>
                      <option value="B2B Corporate">B2B Corporate</option>
                      <option value="Society Drive">Society Drive</option>
                      <option value="Partnership">Partnership</option>
                    </Select>
                  </div>
                  <Textarea
                    label="Details"
                    rows={3}
                    placeholder="Share approximate scrap volume, Bengaluru area/PIN, or preferred pickup dates..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                  />
                  <Button type="submit" className="w-full" size="lg">
                    {t.contactSubmit}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </section>
      </main>

      {/* Section 10: Quiet Footer with Policies & Social Links */}
      <footer className="bg-[#103527] text-white/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-white/10">
          <div className="space-y-3">
            <AppLogo inverted />
            <p className="text-xs text-white/65 leading-relaxed">{t.footerTagline}</p>
            <div className="flex items-center gap-2 text-xs text-[#A5D66D]">
              <Phone className="w-3.5 h-3.5" />
              <span>+91 80 4120 8899 · support@punarchakra.in</span>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm text-white mb-3">Platform Portals</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={() => quickDemoLogin('b2c')} className="hover:text-[#A5D66D] cursor-pointer">
                  B2C Customer Portal
                </button>
              </li>
              <li>
                <button type="button" onClick={() => quickDemoLogin('b2b')} className="hover:text-[#A5D66D] cursor-pointer">
                  B2B Business Portal
                </button>
              </li>
              <li>
                <button type="button" onClick={() => quickDemoLogin('executive')} className="hover:text-[#A5D66D] cursor-pointer">
                  Pickup Executive Portal
                </button>
              </li>
              <li>
                <button type="button" onClick={() => quickDemoLogin('admin')} className="hover:text-[#A5D66D] cursor-pointer">
                  Admin Master Portal
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm text-white mb-3">Policies & Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={() => setLegalModal('privacy')} className="hover:text-[#A5D66D] cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setLegalModal('terms')} className="hover:text-[#A5D66D] cursor-pointer">
                  Terms of Service
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setLegalModal('ewaste')} className="hover:text-[#A5D66D] cursor-pointer">
                  E-Waste & PCB Compliance
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm text-white mb-3">Connect</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#contact" className="hover:text-[#A5D66D]">
                  LinkedIn · @punarchakra-india
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#A5D66D]">
                  Instagram · @punarchakra.eco
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#A5D66D]">
                  X / Twitter · @punarchakra
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/55">
          <span>© 2026 Punarchakra Circular Technologies Pvt. Ltd. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span>{t.footerCityScope}</span>
            <PortalSwitcherDropdown compact inverted />
            <AccessibilityTriggerButton inverted />
          </div>
        </div>
      </footer>

      <Modal
        open={legalModal !== null}
        onClose={() => setLegalModal(null)}
        title={
          legalModal === 'privacy'
            ? 'Privacy & Data Protection Policy'
            : legalModal === 'terms'
            ? 'Terms of Service'
            : 'E-Waste & CPCB Compliance'
        }
      >
        <p className="text-sm text-[#202820]/75 leading-relaxed">
          {legalModal === 'privacy' &&
            'Punarchakra protects personal contact numbers, pickup addresses, GSTIN records, and UPI/bank settlement identifiers with strict role-based access control. Passwords are stored exclusively as salted cryptographic hashes.'}
          {legalModal === 'terms' &&
            'Indicative scrap rates displayed in the calculator are governed by city, zone, and material grade at the time of physical weighing. Final payout requires mutual OTP verification between customer and Pickup Executive.'}
          {legalModal === 'ewaste' &&
            'All collected electronic waste and appliances are routed to State Pollution Control Board authorised dismantling facilities with Form-6 manifest traceability for B2B clients.'}
        </p>
      </Modal>
    </div>
  );
};
