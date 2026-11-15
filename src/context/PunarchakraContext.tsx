import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  deleteDocumentFromFirestore,
  FcmPermissionState,
  firebaseSignOut,
  persistDocumentToFirestore,
  registerFcmPushNotifications,
  showBrowserOrSwNotification,
  signInWithGooglePopup,
  subscribeForegroundFcm,
  subscribeToLiveRates,
  subscribeUserNotifications,
  testFirestoreConnection,
} from '../lib/firebase';
import { LanguageCode, TRANSLATIONS } from '../i18n/translations';
import {
  ADDRESSES_SEED,
  ASSIGNMENTS_SEED,
  AUDIT_LOGS_SEED,
  BUSINESS_BRANCHES_SEED,
  BUSINESS_PROFILES_SEED,
  CMS_SEED,
  COUPONS_SEED,
  CUSTOMER_PROFILES_SEED,
  DOCUMENTS_SEED,
  EXECUTIVE_PROFILES_SEED,
  hashPassword,
  LOGIN_ACTIVITY_SEED,
  NOTIFICATIONS_SEED,
  PAYMENTS_SEED,
  PICKUP_ORDERS_SEED,
  QUOTATIONS_SEED,
  REVIEWS_SEED,
  REWARD_TX_SEED,
  SCRAP_CATEGORIES_SEED,
  SCRAP_RATES_SEED,
  SCRAP_SUBCATEGORIES_SEED,
  SERVICE_ZONES_SEED,
  SUPPORT_TICKETS_SEED,
  USERS_SEED,
  WEIGHING_RECORDS_SEED,
} from '../data/seedData';
import {
  Address,
  AuditLog,
  BusinessBranch,
  BusinessProfile,
  CmsContent,
  ContactEnquiry,
  Coupon,
  CustomerProfile,
  DocumentRecord,
  ExecutiveAssignment,
  ExecutiveProfile,
  ExecutiveRecommendation,
  LoginActivity,
  NotificationItem,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentMethod,
  PickupOrder,
  Quotation,
  QuotationItem,
  Review,
  RewardTransaction,
  ScrapCategory,
  ScrapRate,
  ScrapSubcategory,
  ServiceZone,
  SupportTicket,
  User,
  UserRole,
  WeighingRecord,
} from '../types/punarchakra';

export type AppView =
  | 'public'
  | 'auth'
  | 'b2c'
  | 'b2b'
  | 'executive'
  | 'admin';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface PunarchakraState {
  users: User[];
  customerProfiles: CustomerProfile[];
  businessProfiles: BusinessProfile[];
  businessBranches: BusinessBranch[];
  executiveProfiles: ExecutiveProfile[];
  addresses: Address[];
  categories: ScrapCategory[];
  subcategories: ScrapSubcategory[];
  rates: ScrapRate[];
  orders: PickupOrder[];
  assignments: ExecutiveAssignment[];
  weighingRecords: WeighingRecord[];
  payments: Payment[];
  quotations: Quotation[];
  notifications: NotificationItem[];
  reviews: Review[];
  documents: DocumentRecord[];
  coupons: Coupon[];
  serviceZones: ServiceZone[];
  supportTickets: SupportTicket[];
  auditLogs: AuditLog[];
  loginActivity: LoginActivity[];
  rewardTransactions: RewardTransaction[];
  cms: CmsContent;
  enquiries: ContactEnquiry[];
}

export interface AccessibilitySettings {
  highContrast: boolean;
  textScale: 100 | 112.5 | 125 | 137.5;
  screenReaderEnhanced: boolean;
  reduceMotion: boolean;
}

const DEFAULT_A11Y: AccessibilitySettings = {
  highContrast: false,
  textScale: 100,
  screenReaderEnhanced: false,
  reduceMotion: false,
};

const STORAGE_KEY = 'punarchakra_platform_state_v3';
const SESSION_KEY = 'punarchakra_active_session_v1';
const LANG_KEY = 'punarchakra_lang_v1';
const A11Y_KEY = 'punarchakra_a11y_v1';

const initialSeedState: PunarchakraState = {
  users: USERS_SEED,
  customerProfiles: CUSTOMER_PROFILES_SEED,
  businessProfiles: BUSINESS_PROFILES_SEED,
  businessBranches: BUSINESS_BRANCHES_SEED,
  executiveProfiles: EXECUTIVE_PROFILES_SEED,
  addresses: ADDRESSES_SEED,
  categories: SCRAP_CATEGORIES_SEED,
  subcategories: SCRAP_SUBCATEGORIES_SEED,
  rates: SCRAP_RATES_SEED,
  orders: PICKUP_ORDERS_SEED,
  assignments: ASSIGNMENTS_SEED,
  weighingRecords: WEIGHING_RECORDS_SEED,
  payments: PAYMENTS_SEED,
  quotations: QUOTATIONS_SEED,
  notifications: NOTIFICATIONS_SEED,
  reviews: REVIEWS_SEED,
  documents: DOCUMENTS_SEED,
  coupons: COUPONS_SEED,
  serviceZones: SERVICE_ZONES_SEED,
  supportTickets: SUPPORT_TICKETS_SEED,
  auditLogs: AUDIT_LOGS_SEED,
  loginActivity: LOGIN_ACTIVITY_SEED,
  rewardTransactions: REWARD_TX_SEED,
  cms: CMS_SEED,
  enquiries: [],
};

function loadInitialState(): PunarchakraState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialSeedState;
    const parsed = JSON.parse(raw);
    return { ...initialSeedState, ...parsed };
  } catch {
    return initialSeedState;
  }
}

interface ContextValue {
  state: PunarchakraState;
  currentUser: User | null;
  activeView: AppView;
  authInitialMode: 'login' | 'register';
  authInitialRole: UserRole;
  toasts: ToastMessage[];
  pendingBookingDraft: { items?: { categoryId: string; subcategoryId: string; qty: number }[]; pinCode?: string } | null;
  setPendingBookingDraft: (draft: { items?: { categoryId: string; subcategoryId: string; qty: number }[]; pinCode?: string } | null) => void;
  navigateTo: (view: AppView, opts?: { authMode?: 'login' | 'register'; role?: UserRole; section?: string }) => void;
  notify: (type: ToastMessage['type'], title: string, description?: string) => void;
  dismissToast: (id: string) => void;

  language: LanguageCode;
  toggleLanguage: () => void;
  t: Record<string, string>;
  isLoading: boolean;
  loadingLabel: string | null;
  isNavigatingSkeleton: boolean;
  lastRatesSyncAt: string | null;
  ratesSyncSource: string;
  syncLiveRatesOnline: () => Promise<void>;

  // WCAG Accessibility & Screen Reader Announcements
  a11y: AccessibilitySettings;
  a11yPanelOpen: boolean;
  setA11yPanelOpen: (open: boolean) => void;
  toggleHighContrast: () => void;
  setTextScale: (scale: AccessibilitySettings['textScale']) => void;
  toggleScreenReaderEnhanced: () => void;
  toggleReduceMotion: () => void;
  resetA11y: () => void;
  liveAnnouncement: string;
  assertiveAnnouncement: string;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;

  // FCM Real-Time Push Notifications (B2C, B2B, Executive)
  fcmStatus: FcmPermissionState;
  fcmToken: string | null;
  lastPushAlert: NotificationItem | null;
  enablePushNotifications: () => Promise<FcmPermissionState>;
  sendTestPushAlert: () => Promise<void>;

  // Auth
  firebaseSynced: boolean;
  loginWithEmail: (email: string, password: string, role: UserRole, remember: boolean) => Promise<{ ok: boolean; error?: string }>;
  loginWithOtp: (mobile: string, role: UserRole, remember: boolean) => Promise<{ ok: boolean; error?: string }>;
  loginWithGoogle: (role: UserRole) => Promise<{ ok: boolean; error?: string }>;
  quickDemoLogin: (role: UserRole) => void;
  registerAccount: (payload: {
    role: 'b2c' | 'b2b' | 'executive';
    name: string;
    email: string;
    mobile: string;
    password: string;
    address: string;
    pinCode?: string;
    city?: string;
    companyName?: string;
    gstin?: string;
    contactPerson?: string;
    employeeId?: string;
    assignedZoneId?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  resetPasswordByEmail: (email: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;

  // Helpers & Analytics
  getApplicableRate: (categoryId: string, customerType: 'b2c' | 'b2b', city?: string) => number;
  checkPinServiceability: (pinCode: string) => { serviceable: boolean; zone?: ServiceZone };
  getSmartExecutiveRecommendations: (order: PickupOrder) => ExecutiveRecommendation[];
  getPredictivePickupForCustomer: (userId: string) => {
    hasEnoughHistory: boolean;
    averageDaysBetweenPickups: number | null;
    lastPickupDate: string | null;
    predictedNextDate: string | null;
    daysUntilNext: number | null;
    confidenceLabel: string;
    topCategories: string[];
  };

  // B2C / B2B Actions
  createAddress: (addr: Omit<Address, 'id' | 'createdAt'>) => Address;
  createBusinessBranch: (branch: Omit<BusinessBranch, 'id' | 'createdAt'>) => BusinessBranch;
  updateBusinessProfile: (userId: string, updates: Partial<BusinessProfile>) => void;
  updateCustomerProfile: (userId: string, updates: Partial<CustomerProfile>) => void;
  createPickupOrder: (payload: {
    customerUserId: string;
    addressText: string;
    city: string;
    pinCode: string;
    lat?: number;
    lng?: number;
    branchId?: string;
    branchName?: string;
    scheduledDate: string;
    timeSlot: string;
    instructions?: string;
    items: { categoryId: string; subcategoryId: string; estimatedQty: number }[];
    photos: string[];
    isRecurring?: boolean;
    recurringFrequency?: 'Weekly' | 'Bi-Weekly' | 'Monthly';
    couponCode?: string;
  }) => { ok: boolean; order?: PickupOrder; error?: string };
  cancelOrder: (orderId: string, reason: string) => void;
  redeemRewardsToWallet: (userId: string, pointsToRedeem: number) => { ok: boolean; error?: string };
  submitContactEnquiry: (enquiry: Omit<ContactEnquiry, 'id' | 'createdAt'>) => void;
  submitCommunitySignup: (payload: {
    name: string;
    email: string;
    mobile: string;
    pinCode: string;
    organisation: string;
    programTitle: string;
  }) => Promise<void>;
  createSupportTicket: (payload: Omit<SupportTicket, 'id' | 'ticketNumber' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: (userId: string) => void;

  // B2B Quotation Workflow
  submitQuotation: (payload: {
    businessUserId: string;
    branchId?: string;
    pickupLocation: string;
    city: string;
    pinCode: string;
    expectedCollectionDate: string;
    items: Omit<QuotationItem, 'id'>[];
    photos: string[];
  }) => Quotation;
  adminPriceQuotation: (quotationId: string, pricedItems: { id: string; proposedRate: number }[], adminNotes: string) => void;
  businessRespondQuotation: (quotationId: string, decision: 'accepted' | 'rejected' | 'revision_requested', revisionNotes?: string) => void;
  convertQuotationToOrder: (quotationId: string, timeSlot: string) => PickupOrder | null;

  // Executive Workflow
  respondAssignment: (orderId: string, executiveUserId: string, accept: boolean, rejectionReason?: string) => void;
  advanceExecutiveOrderStatus: (orderId: string, nextStatus: 'on_the_way' | 'reached_location' | 'scrap_collected') => void;
  updateExecutiveShiftGps: (userId: string, lat: number, lng: number, availability: ExecutiveProfile['availabilityStatus']) => void;
  completePickupWithWeighing: (payload: {
    orderId: string;
    executiveUserId: string;
    actualItems: { itemId: string; actualQty: number }[];
    weighingPhotos: string[];
    enteredOtp: string;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => { ok: boolean; error?: string; payment?: Payment };

  // Admin Master Controls
  adminCreateUser: (payload: {
    role: UserRole;
    name: string;
    email: string;
    mobile: string;
    password: string;
    zoneId?: string;
    employeeId?: string;
    companyName?: string;
    gstin?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  adminUpdateUser: (
    userId: string,
    payload: {
      name: string;
      email: string;
      mobile: string;
      status: 'active' | 'deactivated';
      password?: string;
      companyName?: string;
      gstin?: string;
      contactPerson?: string;
      businessAddress?: string;
      contractTier?: BusinessProfile['contractTier'];
      employeeId?: string;
      assignedZoneId?: string;
      vehicleNumber?: string;
      vehicleType?: ExecutiveProfile['vehicleType'];
      availabilityStatus?: ExecutiveProfile['availabilityStatus'];
      upiId?: string;
      loyaltyPoints?: number;
      walletBalance?: number;
      addressLine1?: string;
      addressPinCode?: string;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
  adminDeleteUser: (targetUserId: string) => Promise<{ ok: boolean; error?: string }>;
  adminToggleUserStatus: (targetUserId: string, status: 'active' | 'deactivated') => void;
  adminRevokeUserSession: (targetUserId: string) => void;
  adminAssignExecutive: (orderId: string, executiveUserId: string) => void;
  adminRescheduleOrder: (orderId: string, scheduledDate: string, timeSlot: string) => void;
  adminUpsertRate: (payload: {
    categoryId: string;
    city: string;
    zoneId: string;
    customerType: 'b2c' | 'b2b';
    qualityGrade: 'Standard' | 'Sorted Clean' | 'Industrial Bulk';
    ratePerUnit: number;
    effectiveFrom: string;
    note: string;
  }) => void;
  adminAddCategory: (cat: Omit<ScrapCategory, 'id' | 'sortOrder'>) => void;
  adminToggleCategory: (categoryId: string) => void;
  adminAddSubcategory: (sub: Omit<ScrapSubcategory, 'id'>) => void;
  adminAddServiceZone: (zone: Omit<ServiceZone, 'id'>) => void;
  adminToggleServiceZone: (zoneId: string) => void;
  adminUpdatePaymentStatus: (paymentId: string, status: Payment['status']) => void;
  adminReplySupportTicket: (ticketId: string, reply: string, status: SupportTicket['status']) => void;
  adminUpdateCms: (cms: CmsContent) => void;
  adminAddCoupon: (coupon: Omit<Coupon, 'id'>) => void;
  resetDemoWorkspace: () => void;
}

const PunarchakraContext = createContext<ContextValue | null>(null);

export const PunarchakraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PunarchakraState>(loadInitialState);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  });
  const [activeView, setActiveView] = useState<AppView>('public');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>('b2c');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pendingBookingDraft, setPendingBookingDraft] = useState<{
    items?: { categoryId: string; subcategoryId: string; qty: number }[];
    pinCode?: string;
  } | null>(null);

  const [firebaseSynced, setFirebaseSynced] = useState(false);
  const firebaseIdTokenRef = useRef<string | null>(null);

  const [language, setLanguage] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      return saved === 'kn' ? 'kn' : 'en';
    } catch {
      return 'en';
    }
  });

  const [loadingCount, setLoadingCount] = useState(0);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [isNavigatingSkeleton, setIsNavigatingSkeleton] = useState(false);
  const [lastRatesSyncAt, setLastRatesSyncAt] = useState<string | null>(null);
  const [ratesSyncSource, setRatesSyncSource] = useState<string>('Punarchakra Bengaluru Market Index');

  const [a11y, setA11y] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(A11Y_KEY);
      if (!saved) return DEFAULT_A11Y;
      return { ...DEFAULT_A11Y, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_A11Y;
    }
  });
  const [a11yPanelOpen, setA11yPanelOpen] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState('');

  const [fcmStatus, setFcmStatus] = useState<FcmPermissionState>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission as FcmPermissionState;
  });
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [lastPushAlert, setLastPushAlert] = useState<NotificationItem | null>(null);
  const pushChannelRef = useRef<BroadcastChannel | null>(null);

  const isLoading = loadingCount > 0;
  const t = TRANSLATIONS[language];

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!message) return;
    if (priority === 'assertive') {
      setAssertiveAnnouncement('');
      setTimeout(() => setAssertiveAnnouncement(message), 20);
    } else {
      setLiveAnnouncement('');
      setTimeout(() => setLiveAnnouncement(message), 20);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('pnc-high-contrast', a11y.highContrast);
    root.classList.toggle('pnc-sr-enhanced', a11y.screenReaderEnhanced);
    root.classList.toggle('pnc-reduce-motion', a11y.reduceMotion);
    root.style.fontSize = `${a11y.textScale}%`;
    try {
      localStorage.setItem(A11Y_KEY, JSON.stringify(a11y));
    } catch {
      // Ignore storage error
    }
  }, [a11y]);

  const toggleHighContrast = () => {
    setA11y((prev) => {
      const next = !prev.highContrast;
      announce(next ? 'High contrast mode enabled' : 'High contrast mode disabled');
      return { ...prev, highContrast: next };
    });
  };

  const setTextScale = (textScale: AccessibilitySettings['textScale']) => {
    setA11y((prev) => ({ ...prev, textScale }));
    announce(`Text size set to ${textScale}%`);
  };

  const toggleScreenReaderEnhanced = () => {
    setA11y((prev) => {
      const next = !prev.screenReaderEnhanced;
      announce(next ? 'Enhanced screen reader focus outlines enabled' : 'Standard focus outlines restored');
      return { ...prev, screenReaderEnhanced: next };
    });
  };

  const toggleReduceMotion = () => {
    setA11y((prev) => {
      const next = !prev.reduceMotion;
      announce(next ? 'Reduced motion enabled' : 'Standard transitions restored');
      return { ...prev, reduceMotion: next };
    });
  };

  const resetA11y = () => {
    setA11y(DEFAULT_A11Y);
    announce('Accessibility settings reset to defaults');
  };

  useEffect(() => {
    document.documentElement.lang = language === 'kn' ? 'kn' : 'en';
    try {
      localStorage.setItem(LANG_KEY, language);
    } catch {
      // Ignore
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === 'en' ? 'kn' : 'en';
      announce(next === 'kn' ? 'Language switched to Kannada' : 'Language switched to English');
      return next;
    });
  };

  const runWithLoading = async <T,>(label: string, task: () => Promise<T>): Promise<T> => {
    setLoadingCount((c) => c + 1);
    setLoadingLabel(label);
    try {
      return await task();
    } finally {
      setLoadingCount((c) => {
        const next = Math.max(0, c - 1);
        if (next === 0) setLoadingLabel(null);
        return next;
      });
    }
  };

  const postToApi = async (path: string, body: unknown, tokenOverride?: string | null, method: 'POST' | 'PUT' | 'DELETE' = 'POST') => {
    const token = tokenOverride ?? firebaseIdTokenRef.current;
    return runWithLoading('Syncing with Punarchakra Cloud...', async () => {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(path, {
          method,
          headers,
          body: method === 'DELETE' ? undefined : JSON.stringify(body),
        });
        return res;
      } catch {
        return null;
      }
    });
  };

  const mergeIncomingRates = (incoming: Record<string, unknown>[], sourceLabel?: string, syncedAt?: string) => {
    if (!Array.isArray(incoming) || incoming.length === 0) return;
    setState((prev) => {
      const updatedRates = [...prev.rates];
      incoming.forEach((raw) => {
        const categoryId = String(raw.categoryId || '');
        const customerType = raw.customerType === 'b2b' ? 'b2b' : 'b2c';
        const ratePerUnit = Number(raw.ratePerUnit);
        if (!categoryId || !Number.isFinite(ratePerUnit) || ratePerUnit <= 0) return;

        const idx = updatedRates.findIndex(
          (r) =>
            r.categoryId === categoryId &&
            r.customerType === customerType &&
            r.city.toLowerCase() === 'bengaluru'
        );
        const now = String(raw.updatedAt || syncedAt || new Date().toISOString());
        if (idx >= 0) {
          const cur = updatedRates[idx];
          const changed = cur.ratePerUnit !== ratePerUnit;
          updatedRates[idx] = {
            ...cur,
            ratePerUnit,
            effectiveFrom: String(raw.effectiveFrom || cur.effectiveFrom),
            updatedBy: String(raw.updatedBy || 'Live Bengaluru Sync'),
            updatedAt: now,
            history: changed
              ? [
                  ...cur.history,
                  {
                    rate: ratePerUnit,
                    changedAt: now,
                    changedBy: String(raw.updatedBy || 'Live Bengaluru Sync'),
                    note: sourceLabel || 'Online rate sync',
                  },
                ]
              : cur.history,
          };
        } else {
          updatedRates.unshift({
            id: String(raw.id || `rate-${categoryId}-blr-${customerType}`),
            categoryId,
            city: 'Bengaluru',
            zoneId: String(raw.zoneId || (customerType === 'b2b' ? 'zone-blr-ind-peenya' : 'zone-blr-north-hebbal')),
            customerType,
            qualityGrade: (raw.qualityGrade as ScrapRate['qualityGrade']) || (customerType === 'b2b' ? 'Industrial Bulk' : 'Standard'),
            ratePerUnit,
            effectiveFrom: String(raw.effectiveFrom || now.split('T')[0]),
            isActive: raw.isActive !== false,
            updatedBy: String(raw.updatedBy || 'Live Bengaluru Sync'),
            updatedAt: now,
            history: [
              {
                rate: ratePerUnit,
                changedAt: now,
                changedBy: String(raw.updatedBy || 'Live Bengaluru Sync'),
                note: sourceLabel || 'Online rate sync',
              },
            ],
          });
        }
      });
      return { ...prev, rates: updatedRates };
    });
    if (syncedAt) setLastRatesSyncAt(syncedAt);
    if (sourceLabel) setRatesSyncSource(sourceLabel);
  };

  const syncLiveRatesOnline = async () => {
    await runWithLoading('Syncing live Bengaluru scrap rates...', async () => {
      try {
        const res = await fetch('/api/public/live-rates');
        if (!res.ok) throw new Error('Live rates endpoint unavailable');
        const data = await res.json();
        if (Array.isArray(data.rates)) {
          mergeIncomingRates(data.rates, data.source, data.syncedAt || new Date().toISOString());
          notify(
            'success',
            language === 'kn' ? 'ಲೈವ್ ಬೆಂಗಳೂರು ದರಗಳು ನವೀಕರಿಸಲಾಗಿದೆ' : 'Live Bengaluru Rates Synced',
            data.source || 'Updated across Website, Calculator & Portals'
          );
        }
      } catch {
        notify('error', 'Unable to sync live online rates right now');
      }
    });
  };

  useEffect(() => {
    let active = true;
    testFirestoreConnection().then((ok) => {
      if (active) setFirebaseSynced(ok);
    });

    runWithLoading('Loading Bengaluru catalog & live rates...', async () => {
      try {
        const [catalogRes, liveRatesRes] = await Promise.all([
          fetch('/api/public/catalog').catch(() => null),
          fetch('/api/public/live-rates').catch(() => null),
        ]);
        if (!active) return;

        if (catalogRes && catalogRes.ok) {
          const data = await catalogRes.json();
          const blrZones = Array.isArray(data.serviceZones)
            ? data.serviceZones.filter((z: ServiceZone) => z.city?.toLowerCase() === 'bengaluru')
            : [];
          const hasSegmentedZones = blrZones.some((z: ServiceZone) => Boolean(z.serviceSegment));
          setState((prev) => ({
            ...prev,
            categories: Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : prev.categories,
            serviceZones: blrZones.length > 0 && hasSegmentedZones ? blrZones : prev.serviceZones,
          }));
        }

        if (liveRatesRes && liveRatesRes.ok) {
          const live = await liveRatesRes.json();
          if (Array.isArray(live.rates)) {
            mergeIncomingRates(live.rates, live.source, live.syncedAt || new Date().toISOString());
          }
        }
      } catch {
        // Seed state remains available
      }
    });

    const unsubscribeRates = subscribeToLiveRates((liveDocs) => {
      if (!active) return;
      const blrDocs = liveDocs.filter((d) => String(d.city || '').toLowerCase() === 'bengaluru');
      if (blrDocs.length > 0) {
        mergeIncomingRates(blrDocs, 'Firestore Live Real-Time Sync', new Date().toISOString());
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!active) return;
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          firebaseIdTokenRef.current = token;
        } catch {
          firebaseIdTokenRef.current = null;
        }
      } else {
        firebaseIdTokenRef.current = null;
      }
    });

    return () => {
      active = false;
      unsubscribeRates();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota exceeded if large base64 images are added
    }
  }, [state]);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === currentUserId && u.status === 'active') || null,
    [state.users, currentUserId]
  );

  const notify = (type: ToastMessage['type'], title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    if (a11y.screenReaderEnhanced || type === 'error') {
      announce(`${title}${description ? `. ${description}` : ''}`, type === 'error' ? 'assertive' : 'polite');
    }
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const dispatchPickupPush = (payload: {
    targetUserIds: string[];
    title: string;
    body: string;
    orderId: string;
    orderNumber?: string;
    status: string;
    targetRole?: UserRole;
  }) => {
    const rawTargets = Array.from(new Set(payload.targetUserIds.filter(Boolean)));
    const expandedTargets = Array.from(
      new Set(
        rawTargets.flatMap((id) => {
          const matchedUser = state.users.find((u) => u.id === id || u.uid === id);
          return matchedUser?.uid ? [id, matchedUser.id, matchedUser.uid] : [id];
        })
      )
    );
    const now = new Date().toISOString();
    const primaryTarget = rawTargets[0] || currentUser?.id || 'broadcast';
    const pushItem: NotificationItem = {
      id: `notif-push-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      userId: primaryTarget,
      channel: 'push',
      title: payload.title,
      message: payload.body,
      type:
        payload.status === 'payment_completed'
          ? 'payment'
          : payload.status.startsWith('quote')
            ? 'quotation'
            : payload.status === 'executive_assigned'
              ? 'assignment'
              : 'order',
      relatedId: payload.orderId,
      isRead: false,
      createdAt: now,
    };

    setLastPushAlert(pushItem);
    announce(`Push Notification: ${payload.title}. ${payload.body}`, 'polite');

    if (
      currentUser &&
      (expandedTargets.includes(currentUser.id) || (currentUser.uid && expandedTargets.includes(currentUser.uid)))
    ) {
      showBrowserOrSwNotification(payload.title, payload.body, {
        orderId: payload.orderId,
        orderNumber: payload.orderNumber || '',
        status: payload.status,
      }).catch(() => {});
    }

    try {
      pushChannelRef.current?.postMessage({
        ...payload,
        targetUserIds: expandedTargets,
        notification: pushItem,
      });
    } catch {
      // BroadcastChannel unavailable in restricted contexts
    }

    if (firebaseIdTokenRef.current && expandedTargets.length > 0) {
      fetch('/api/fcm/notify-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${firebaseIdTokenRef.current}`,
        },
        body: JSON.stringify({
          targetUserId: expandedTargets[0],
          targetUserIds: expandedTargets,
          targetRole: payload.targetRole,
          title: payload.title,
          body: payload.body,
          orderId: payload.orderId,
          orderNumber: payload.orderNumber || '',
          status: payload.status,
        }),
      }).catch(() => {});
    }
  };

  const enablePushNotifications = async (): Promise<FcmPermissionState> => {
    const uid = currentUser?.uid || currentUser?.id || 'guest-bengaluru';
    const role = currentUser?.role || 'b2c';
    const result = await runWithLoading('Activating FCM real-time push alerts...', async () =>
      registerFcmPushNotifications(uid, role, firebaseIdTokenRef.current, currentUser?.id)
    );
    setFcmStatus(result.status);
    if (result.token) setFcmToken(result.token);
    if (result.status === 'granted') {
      notify(
        'success',
        'Real-Time Pickup Push Enabled',
        result.token?.startsWith('browser-push-')
          ? 'Browser push & live status channel active for this portal.'
          : 'Firebase Cloud Messaging token registered for pickup updates.'
      );
      showBrowserOrSwNotification(
        'PUNARCHAKRA Alerts Active',
        `Live pickup status notifications enabled for ${role.toUpperCase()} portal.`,
        { role }
      ).catch(() => {});
    } else if (result.status === 'denied') {
      notify(
        'info',
        'Browser Notifications Blocked',
        'In-app live status push banners remain active; allow browser notifications to receive OS alerts.'
      );
    } else {
      notify('info', 'Push API Unsupported Here', 'In-app real-time pickup banners are active across portals.');
    }
    return result.status;
  };

  const sendTestPushAlert = async () => {
    if (!currentUser) return;
    const relatedOrder =
      state.orders.find(
        (o) =>
          o.customerUserId === currentUser.id ||
          o.assignedExecutiveId === currentUser.id
      ) || state.orders[0];
    const orderNumber = relatedOrder?.orderNumber || 'PNC-2026-1003';
    const statusLabel =
      currentUser.role === 'executive'
        ? `New Bengaluru Dispatch: ${orderNumber}`
        : currentUser.role === 'b2b'
          ? `${orderNumber}: Industrial Bulk Pickup En Route`
          : `${orderNumber}: Executive on the way`;
    const body =
      currentUser.role === 'executive'
        ? 'Priority pickup in Sahakara Nagar, North Bengaluru (560092). Tap Assigned Pickups to navigate.'
        : currentUser.role === 'b2b'
          ? 'Suresh Nair (Hydraulic EV Truck KA-01-EV-4821) is approaching Peenya Industrial Area (560058).'
          : 'Rajesh Kumar (EV Van KA-01-EV-4821) is 8 mins away from your North Bengaluru location.';

    const notifItem: NotificationItem = {
      id: `notif-test-${Date.now()}`,
      userId: currentUser.id,
      channel: 'push',
      title: statusLabel,
      message: body,
      type: currentUser.role === 'executive' ? 'assignment' : 'order',
      relatedId: relatedOrder?.id || 'ord-1003',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      notifications: [notifItem, ...prev.notifications],
    }));

    dispatchPickupPush({
      targetUserIds: [currentUser.id],
      title: statusLabel,
      body,
      orderId: relatedOrder?.id || 'ord-1003',
      orderNumber,
      status: 'on_the_way',
      targetRole: currentUser.role,
    });

    notify('success', statusLabel, body);
  };

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('punarchakra_push_bus');
        pushChannelRef.current = channel;
        channel.onmessage = (event) => {
          const data = event.data as {
            targetUserIds?: string[];
            title?: string;
            body?: string;
            notification?: NotificationItem;
          };
          if (!data?.title || !currentUser) return;
          const isRecipient =
            !data.targetUserIds ||
            data.targetUserIds.includes(currentUser.id) ||
            (currentUser.uid && data.targetUserIds.includes(currentUser.uid));
          if (isRecipient) {
            if (data.notification) {
              setLastPushAlert(data.notification);
              setState((prev) =>
                prev.notifications.some((n) => n.id === data.notification!.id)
                  ? prev
                  : { ...prev, notifications: [{ ...data.notification!, userId: currentUser.id }, ...prev.notifications] }
              );
            }
            notify('info', data.title, data.body);
          }
        };
      } catch {
        channel = null;
      }
    }

    if (currentUser && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      registerFcmPushNotifications(
        currentUser.uid || currentUser.id,
        currentUser.role,
        firebaseIdTokenRef.current,
        currentUser.id
      )
        .then((res) => {
          setFcmStatus(res.status);
          if (res.token) setFcmToken(res.token);
        })
        .catch(() => {});
    }

    let unsubFcm = () => {};
    subscribeForegroundFcm((payload) => {
      const notifItem: NotificationItem = {
        id: `notif-fcm-${Date.now()}`,
        userId: currentUser?.id || 'active',
        channel: 'push',
        title: payload.title,
        message: payload.body,
        type: 'order',
        relatedId: payload.data?.orderId,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setLastPushAlert(notifItem);
      setState((prev) => ({ ...prev, notifications: [notifItem, ...prev.notifications] }));
      notify('info', payload.title, payload.body);
    }).then((unsub) => {
      unsubFcm = unsub;
    });

    let unsubUserNotifs = () => {};
    if (currentUser && auth.currentUser) {
      unsubUserNotifs = subscribeUserNotifications(currentUser.uid || currentUser.id, (items) => {
        const mapped = items as unknown as NotificationItem[];
        const latest = mapped[0];
        if (latest && latest.title) {
          setLastPushAlert(latest);
        }
        if (mapped.length > 0) {
          setState((prev) => {
            const existingIds = new Set(prev.notifications.map((n) => n.id));
            const fresh = mapped
              .filter((item) => item?.id && !existingIds.has(item.id))
              .map((item) => ({ ...item, userId: currentUser.id }));
            if (fresh.length === 0) return prev;
            return { ...prev, notifications: [...fresh, ...prev.notifications] };
          });
        }
      });
    }

    return () => {
      if (channel) channel.close();
      pushChannelRef.current = null;
      unsubFcm();
      unsubUserNotifs();
    };
  }, [currentUser?.id, currentUser?.role]);

  const appendAudit = (
    prev: PunarchakraState,
    actor: User | { id: string; name: string; role: UserRole },
    action: string,
    entityType: string,
    entityId: string,
    details: string
  ): AuditLog[] => [
    {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      actorUserId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    },
    ...prev.auditLogs,
  ];

  const triggerNavigationSkeleton = (label: string) => {
    setIsNavigatingSkeleton(true);
    setLoadingLabel(label);
    setTimeout(() => {
      setIsNavigatingSkeleton(false);
      setLoadingLabel(null);
    }, 200);
  };

  const navigateTo = (
    view: AppView,
    opts?: { authMode?: 'login' | 'register'; role?: UserRole; section?: string }
  ) => {
    if (opts?.authMode) setAuthInitialMode(opts.authMode);
    if (opts?.role) setAuthInitialRole(opts.role);
    // Role-based route protection
    if (view !== 'public' && view !== 'auth') {
      if (!currentUser) {
        setAuthInitialRole(view as UserRole);
        setAuthInitialMode('login');
        setActiveView('auth');
        notify('info', 'Sign in required', 'Please sign in with an authorised account for this portal.');
        return;
      }
      if (currentUser.role !== view && currentUser.role !== 'admin') {
        notify('error', 'Access restricted', `Your ${currentUser.role.toUpperCase()} role cannot open the ${view.toUpperCase()} portal.`);
        setActiveView(currentUser.role);
        return;
      }
    }
    if (view !== activeView) {
      triggerNavigationSkeleton(`Loading ${view.toUpperCase()} workspace...`);
    }
    setActiveView(view);
    if (opts?.section && view === 'public') {
      setTimeout(() => {
        document.getElementById(opts.section!)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const setSession = (userId: string, remember: boolean) => {
    setCurrentUserId(userId);
    try {
      if (remember) {
        localStorage.setItem(SESSION_KEY, userId);
        sessionStorage.removeItem(SESSION_KEY);
      } else {
        sessionStorage.setItem(SESSION_KEY, userId);
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Ignore
    }
  };

  const loginWithEmail = async (
    email: string,
    password: string,
    role: UserRole,
    remember: boolean
  ): Promise<{ ok: boolean; error?: string }> =>
    runWithLoading('Authenticating your Punarchakra account...', async () => {
      const cleanEmail = email.trim().toLowerCase();
      const user = state.users.find((u) => u.email.toLowerCase() === cleanEmail && u.role === role);
      if (!user) {
        return { ok: false, error: `No ${role.toUpperCase()} account found for ${cleanEmail}.` };
      }
      if (user.status === 'deactivated') {
        return { ok: false, error: 'This account has been deactivated by an Administrator.' };
      }
      const candidateHash = await hashPassword(password);
      if (candidateHash !== user.passwordHash) {
        setState((prev) => ({
          ...prev,
          loginActivity: [
            {
              id: `log-${Date.now()}`,
              userId: user.id,
              email: user.email,
              role: user.role,
              method: 'Email/Password',
              status: 'failed',
              deviceInfo: navigator.userAgent.slice(0, 48),
              timestamp: new Date().toISOString(),
            },
            ...prev.loginActivity,
          ],
        }));
        return { ok: false, error: 'Incorrect password. Demo accounts use "Punarchakra@123".' };
      }
      setSession(user.id, remember);
      setState((prev) => ({
        ...prev,
        loginActivity: [
          {
            id: `log-${Date.now()}`,
            userId: user.id,
            email: user.email,
            role: user.role,
            method: 'Email/Password',
            status: 'success',
            deviceInfo: 'Web Browser Session · Bengaluru',
            timestamp: new Date().toISOString(),
          },
          ...prev.loginActivity,
        ],
      }));
      triggerNavigationSkeleton(`Loading ${user.role.toUpperCase()} Portal...`);
      setActiveView(user.role);
      notify('success', `Welcome back, ${user.name}`, `Signed in to ${user.role.toUpperCase()} Portal.`);
      return { ok: true };
    });

  const loginWithOtp = async (
    mobile: string,
    role: UserRole,
    remember: boolean
  ): Promise<{ ok: boolean; error?: string }> =>
    runWithLoading('Verifying mobile OTP...', async () => {
      const normalized = mobile.replace(/\D/g, '').slice(-10);
      const user = state.users.find(
        (u) => u.mobile.replace(/\D/g, '').slice(-10) === normalized && u.role === role
      );
      if (!user) {
        return { ok: false, error: `No ${role.toUpperCase()} account registered with mobile ending ${normalized}.` };
      }
      if (user.status === 'deactivated') {
        return { ok: false, error: 'Account is deactivated. Contact support.' };
      }
      setSession(user.id, remember);
      setState((prev) => ({
        ...prev,
        loginActivity: [
          {
            id: `log-${Date.now()}`,
            userId: user.id,
            email: user.email,
            role: user.role,
            method: 'Mobile/OTP',
            status: 'success',
            deviceInfo: 'OTP Verified Session · Bengaluru',
            timestamp: new Date().toISOString(),
          },
          ...prev.loginActivity,
        ],
      }));
      triggerNavigationSkeleton(`Loading ${user.role.toUpperCase()} Portal...`);
      setActiveView(user.role);
      notify('success', `OTP Verified — ${user.name}`);
      return { ok: true };
    });

  const loginWithGoogle = async (role: UserRole): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { user: fbUser, idToken } = await signInWithGooglePopup();
      firebaseIdTokenRef.current = idToken;

      const syncRes = await postToApi(
        '/api/auth/sync-profile',
        {
          role,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Punarchakra User',
          email: fbUser.email || '',
          mobile: fbUser.phoneNumber || '+91 98450 00000',
        },
        idToken
      );

      let verifiedRole: UserRole = role;
      let syncedName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Punarchakra User';
      if (syncRes && syncRes.ok) {
        const data = await syncRes.json();
        if (data?.user?.role) verifiedRole = data.user.role as UserRole;
        if (data?.user?.name) syncedName = data.user.name;
      } else if (role === 'admin' && fbUser.email?.toLowerCase() !== 'voltaraintelligentechnologies@gmail.com') {
        verifiedRole = 'b2c';
      }

      const now = new Date().toISOString();
      const userId = fbUser.uid;
      const cleanEmail = (fbUser.email || `${fbUser.uid}@google.local`).toLowerCase();

      const existing = state.users.find((u) => u.uid === fbUser.uid || u.id === userId || u.email.toLowerCase() === cleanEmail);
      const activeUserId = existing ? existing.id : userId;

      const newUserRecord: User = existing
        ? { ...existing, uid: fbUser.uid, role: verifiedRole, name: syncedName, updatedAt: now }
        : {
            id: activeUserId,
            uid: fbUser.uid,
            role: verifiedRole,
            name: syncedName,
            email: cleanEmail,
            mobile: fbUser.phoneNumber || '+91 98450 00000',
            passwordHash: 'google-oauth-verified',
            status: 'active',
            createdAt: now,
            updatedAt: now,
            createdBy: 'google_oauth',
          };

      setState((prev) => {
        const users = existing
          ? prev.users.map((u) => (u.id === existing.id ? newUserRecord : u))
          : [newUserRecord, ...prev.users];

        const next: PunarchakraState = {
          ...prev,
          users,
          loginActivity: [
            {
              id: `log-${Date.now()}`,
              userId: activeUserId,
              email: cleanEmail,
              role: verifiedRole,
              method: 'Google Sign-In',
              status: 'success',
              deviceInfo: 'Firebase Google OAuth',
              timestamp: now,
            },
            ...prev.loginActivity,
          ],
          auditLogs: appendAudit(
            prev,
            newUserRecord,
            'GOOGLE_SIGN_IN',
            'User',
            activeUserId,
            `Authenticated via Google (${verifiedRole.toUpperCase()})`
          ),
        };

        if (verifiedRole === 'b2c' && !prev.customerProfiles.some((cp) => cp.userId === activeUserId)) {
          next.customerProfiles = [
            {
              id: `cp-${Date.now()}`,
              userId: activeUserId,
              loyaltyPoints: 50,
              referralCode: `${syncedName.split(' ')[0].toUpperCase().slice(0, 6)}50`,
              walletBalance: 0,
              preferredPaymentMethod: 'UPI',
              createdAt: now,
              updatedAt: now,
            },
            ...prev.customerProfiles,
          ];
        } else if (verifiedRole === 'b2b' && !prev.businessProfiles.some((bp) => bp.userId === activeUserId)) {
          next.businessProfiles = [
            {
              id: `bp-${Date.now()}`,
              userId: activeUserId,
              companyName: syncedName,
              industryType: 'Corporate / Commercial',
              gstin: '29AAACP0000A1Z5',
              contactPerson: syncedName,
              businessAddress: 'Bengaluru Registered Office',
              contractTier: 'Standard',
              billingEmail: cleanEmail,
              createdAt: now,
              updatedAt: now,
            },
            ...prev.businessProfiles,
          ];
        } else if (verifiedRole === 'executive' && !prev.executiveProfiles.some((ep) => ep.userId === activeUserId)) {
          next.executiveProfiles = [
            {
              id: `ep-${Date.now()}`,
              userId: activeUserId,
              employeeId: `PNC-EX-${Math.floor(200 + Math.random() * 700)}`,
              assignedZoneId: prev.serviceZones[0]?.id || 'zone-blr-north-hebbal',
              vehicleNumber: 'KA-01-EV-GOOGLE',
              vehicleType: 'E-Cargo Van',
              availabilityStatus: 'available',
              rating: 5.0,
              completedPickupsCount: 0,
              createdAt: now,
            },
            ...prev.executiveProfiles,
          ];
        }
        return next;
      });

      setSession(activeUserId, true);
      setActiveView(verifiedRole);
      notify('success', `Signed in with Google — ${syncedName}`, `Portal: ${verifiedRole.toUpperCase()}`);
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google Sign-In was cancelled or blocked.';
      return { ok: false, error: message };
    }
  };

  const quickDemoLogin = (role: UserRole) => {
    const user = state.users.find((u) => u.role === role && u.status === 'active');
    if (!user) {
      notify('error', 'No active demo user available for this role.');
      return;
    }
    triggerNavigationSkeleton(`Entering ${role.toUpperCase()} Portal...`);
    setSession(user.id, true);
    setState((prev) => ({
      ...prev,
      loginActivity: [
        {
          id: `log-${Date.now()}`,
          userId: user.id,
          email: user.email,
          role: user.role,
          method: 'Quick Demo',
          status: 'success',
          deviceInfo: 'Preview Switcher · Bengaluru',
          timestamp: new Date().toISOString(),
        },
        ...prev.loginActivity,
      ],
    }));
    setActiveView(role);
    notify('success', `Switched to ${user.name}`, `Active portal: ${role.toUpperCase()}`);
  };

  const registerAccount = async (payload: {
    role: 'b2c' | 'b2b' | 'executive';
    name: string;
    email: string;
    mobile: string;
    password: string;
    address: string;
    pinCode?: string;
    city?: string;
    companyName?: string;
    gstin?: string;
    contactPerson?: string;
    employeeId?: string;
    assignedZoneId?: string;
  }): Promise<{ ok: boolean; error?: string }> =>
    runWithLoading('Provisioning your Bengaluru account...', async () => {
      const cleanEmail = payload.email.trim().toLowerCase();
      if (state.users.some((u) => u.email.toLowerCase() === cleanEmail && u.role === payload.role)) {
        return { ok: false, error: 'An account with this email already exists for this role.' };
      }
      if (payload.password.length < 6) {
        return { ok: false, error: 'Password must be at least 6 characters.' };
      }
      if (payload.role === 'b2b' && payload.gstin && !/^[0-9A-Z]{15}$/i.test(payload.gstin.trim())) {
        return { ok: false, error: 'Please enter a valid 15-character GSTIN.' };
      }
      const now = new Date().toISOString();
      const userId = `usr-${payload.role}-${Date.now()}`;
      const passwordHash = await hashPassword(payload.password);
      const newUser: User = {
        id: userId,
        uid: `fb-uid-${userId}`,
        role: payload.role,
        name: payload.role === 'b2b' ? (payload.companyName || payload.name) : payload.name,
        email: cleanEmail,
        mobile: payload.mobile,
        passwordHash,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        createdBy: 'self_registration',
      };

    setState((prev) => {
      const next: PunarchakraState = {
        ...prev,
        users: [newUser, ...prev.users],
        auditLogs: appendAudit(prev, newUser, 'USER_REGISTERED', 'User', userId, `Registered ${payload.role.toUpperCase()} account (${cleanEmail})`),
      };
      if (payload.role === 'b2c') {
        next.customerProfiles = [
          {
            id: `cp-${Date.now()}`,
            userId,
            loyaltyPoints: 50,
            referralCode: `${payload.name.split(' ')[0].toUpperCase().slice(0, 6)}50`,
            walletBalance: 0,
            preferredPaymentMethod: 'UPI',
            createdAt: now,
            updatedAt: now,
          },
          ...prev.customerProfiles,
        ];
        next.addresses = [
          {
            id: `addr-${Date.now()}`,
            userId,
            label: 'Primary Address',
            line1: payload.address,
            city: payload.city || 'Bengaluru',
            state: 'Karnataka',
            pinCode: payload.pinCode || '560092',
            isDefault: true,
            createdAt: now,
          },
          ...prev.addresses,
        ];
      } else if (payload.role === 'b2b') {
        const compName = payload.companyName || payload.name;
        next.businessProfiles = [
          {
            id: `bp-${Date.now()}`,
            userId,
            companyName: compName,
            industryType: 'Corporate / Commercial',
            gstin: (payload.gstin || '').toUpperCase(),
            contactPerson: payload.contactPerson || payload.name,
            businessAddress: payload.address,
            contractTier: 'Standard',
            billingEmail: cleanEmail,
            createdAt: now,
            updatedAt: now,
          },
          ...prev.businessProfiles,
        ];
        next.businessBranches = [
          {
            id: `br-${Date.now()}`,
            businessUserId: userId,
            branchName: `${compName} — HQ`,
            address: payload.address,
            city: payload.city || 'Bengaluru',
            pinCode: payload.pinCode || '560001',
            contactName: payload.contactPerson || payload.name,
            contactMobile: payload.mobile,
            isDefault: true,
            createdAt: now,
          },
          ...prev.businessBranches,
        ];
      } else if (payload.role === 'executive') {
        next.executiveProfiles = [
          {
            id: `ep-${Date.now()}`,
            userId,
            employeeId: payload.employeeId || `PNC-EX-${Math.floor(200 + Math.random() * 700)}`,
            assignedZoneId: payload.assignedZoneId || prev.serviceZones[0]?.id || 'zone-blr-north-hebbal',
            vehicleNumber: 'KA-01-EV-NEW',
            vehicleType: 'E-Cargo Van',
            availabilityStatus: 'available',
            rating: 5.0,
            completedPickupsCount: 0,
            createdAt: now,
          },
          ...prev.executiveProfiles,
        ];
      }
      return next;
    });

      triggerNavigationSkeleton(`Loading ${payload.role.toUpperCase()} Portal...`);
      setSession(userId, true);
      setActiveView(payload.role);
      notify('success', 'Account Created', `Welcome to Punarchakra, ${newUser.name}!`);
      return { ok: true };
    });

  const resetPasswordByEmail = async (email: string, newPassword: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const target = state.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!target) {
      return { ok: false, error: 'No account found with that email address.' };
    }
    if (newPassword.length < 6) {
      return { ok: false, error: 'New password must be at least 6 characters.' };
    }
    const newHash = await hashPassword(newPassword);
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === target.id ? { ...u, passwordHash: newHash, updatedAt: new Date().toISOString() } : u
      ),
      auditLogs: appendAudit(prev, target, 'PASSWORD_RESET', 'User', target.id, `Password reset verified for ${cleanEmail}`),
    }));
    return { ok: true };
  };

  const logout = () => {
    setCurrentUserId(null);
    firebaseIdTokenRef.current = null;
    firebaseSignOut().catch(() => {});
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore
    }
    setActiveView('public');
    notify('info', 'Signed out securely');
  };

  const getApplicableRate = (categoryId: string, customerType: 'b2c' | 'b2b', city?: string): number => {
    const matching = state.rates.filter(
      (r) => r.categoryId === categoryId && r.customerType === customerType && r.isActive
    );
    if (city) {
      const cityRate = matching.find((r) => r.city.toLowerCase() === city.toLowerCase());
      if (cityRate) return cityRate.ratePerUnit;
    }
    if (matching.length > 0) return matching[0].ratePerUnit;
    const anyRate = state.rates.find((r) => r.categoryId === categoryId && r.isActive);
    return anyRate ? anyRate.ratePerUnit : 15;
  };

  const checkPinServiceability = (pinCode: string) => {
    const clean = pinCode.trim();
    const zone = state.serviceZones.find((z) => z.isActive && z.pinCodes.includes(clean));
    return { serviceable: Boolean(zone), zone };
  };

  const getSmartExecutiveRecommendations = (order: PickupOrder): ExecutiveRecommendation[] => {
    return state.executiveProfiles
      .map((profile) => {
        const execUser = state.users.find((u) => u.id === profile.userId && u.status === 'active');
        if (!execUser) return null;
        const zoneMatch = profile.assignedZoneId === order.zoneId;
        const activeWorkload = state.orders.filter(
          (o) =>
            o.assignedExecutiveId === execUser.id &&
            !['payment_completed', 'cancelled'].includes(o.status)
        ).length;
        // Compute deterministic proximity estimate from active GPS or zone match
        let distanceKm = zoneMatch ? 3.2 : 14.8;
        if (order.lat && order.lng && profile.activeShiftGps) {
          const dLat = (order.lat - profile.activeShiftGps.lat) * 111;
          const dLng = (order.lng - profile.activeShiftGps.lng) * 105;
          distanceKm = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 10) / 10;
        }
        let score = 50;
        if (zoneMatch) score += 30;
        if (profile.availabilityStatus === 'available') score += 20;
        else if (profile.availabilityStatus === 'on_pickup') score += 5;
        else score -= 30;
        score -= activeWorkload * 8;
        score -= Math.min(20, Math.round(distanceKm));
        return {
          executive: execUser,
          profile,
          zoneMatch,
          activeWorkload,
          estimatedDistanceKm: Math.max(0.8, distanceKm),
          score: Math.max(0, Math.min(100, score)),
          reason: `${zoneMatch ? 'Assigned Zone Match' : 'Cross-Zone Backup'} · ${activeWorkload} active jobs · ~${Math.max(0.8, distanceKm)} km away`,
        };
      })
      .filter((x): x is ExecutiveRecommendation => x !== null)
      .sort((a, b) => b.score - a.score);
  };

  const getPredictivePickupForCustomer = (userId: string) => {
    const completedOrders = state.orders
      .filter((o) => o.customerUserId === userId && o.status === 'payment_completed')
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    if (completedOrders.length < 2) {
      return {
        hasEnoughHistory: false,
        averageDaysBetweenPickups: null,
        lastPickupDate: completedOrders[0]?.scheduledDate || null,
        predictedNextDate: null,
        daysUntilNext: null,
        confidenceLabel: 'Need at least 2 completed pickups to learn your cadence',
        topCategories: completedOrders.flatMap((o) => o.items.map((i) => i.categoryName)).slice(0, 3),
      };
    }

    const intervals: number[] = [];
    for (let i = 1; i < completedOrders.length; i++) {
      const prevTime = new Date(completedOrders[i - 1].scheduledDate).getTime();
      const currTime = new Date(completedOrders[i].scheduledDate).getTime();
      const diffDays = Math.max(1, Math.round((currTime - prevTime) / (1000 * 60 * 60 * 24)));
      intervals.push(diffDays);
    }
    const avgDays = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
    const lastOrder = completedOrders[completedOrders.length - 1];
    const lastDate = new Date(lastOrder.scheduledDate);
    const predictedDate = new Date(lastDate.getTime() + avgDays * 24 * 60 * 60 * 1000);
    const today = new Date();
    const daysUntil = Math.round((predictedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const categoryCounts: Record<string, number> = {};
    completedOrders.forEach((o) =>
      o.items.forEach((it) => {
        categoryCounts[it.categoryName] = (categoryCounts[it.categoryName] || 0) + (it.actualQty || it.estimatedQty);
      })
    );
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    return {
      hasEnoughHistory: true,
      averageDaysBetweenPickups: avgDays,
      lastPickupDate: lastOrder.scheduledDate,
      predictedNextDate: predictedDate.toISOString().split('T')[0],
      daysUntilNext: daysUntil,
      confidenceLabel: `Based on ${completedOrders.length} verified pickups (avg ${avgDays}-day cycle)`,
      topCategories,
    };
  };

  const createAddress = (addr: Omit<Address, 'id' | 'createdAt'>): Address => {
    const created: Address = {
      ...addr,
      id: `addr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      addresses: [
        created,
        ...prev.addresses.map((a) =>
          a.userId === addr.userId && addr.isDefault ? { ...a, isDefault: false } : a
        ),
      ],
    }));
    notify('success', 'Address saved');
    return created;
  };

  const createBusinessBranch = (branch: Omit<BusinessBranch, 'id' | 'createdAt'>): BusinessBranch => {
    const created: BusinessBranch = {
      ...branch,
      id: `br-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      businessBranches: [created, ...prev.businessBranches],
    }));
    notify('success', 'Branch added', created.branchName);
    return created;
  };

  const updateBusinessProfile = (userId: string, updates: Partial<BusinessProfile>) => {
    setState((prev) => ({
      ...prev,
      businessProfiles: prev.businessProfiles.map((bp) =>
        bp.userId === userId ? { ...bp, ...updates, updatedAt: new Date().toISOString() } : bp
      ),
    }));
    notify('success', 'Business profile updated');
  };

  const updateCustomerProfile = (userId: string, updates: Partial<CustomerProfile>) => {
    setState((prev) => ({
      ...prev,
      customerProfiles: prev.customerProfiles.map((cp) =>
        cp.userId === userId ? { ...cp, ...updates, updatedAt: new Date().toISOString() } : cp
      ),
    }));
    notify('success', 'Profile preferences saved');
  };

  const createPickupOrder: ContextValue['createPickupOrder'] = (payload) => {
    const customer = state.users.find((u) => u.id === payload.customerUserId);
    if (!customer) return { ok: false, error: 'Customer account not found.' };
    if (payload.items.length === 0) return { ok: false, error: 'Add at least one scrap material.' };

    const customerType = customer.role === 'b2b' ? 'b2b' : 'b2c';
    const orderId = `ord-${Date.now()}`;
    const orderNumber = `PNC-2026-${1006 + state.orders.length}`;
    const now = new Date().toISOString();
    const pinCheck = checkPinServiceability(payload.pinCode);
    const zoneId = pinCheck.zone?.id || state.serviceZones[0]?.id || (customerType === 'b2b' ? 'zone-blr-ind-peenya' : 'zone-blr-north-hebbal');

    const orderItems: OrderItem[] = payload.items.map((it, idx) => {
      const cat = state.categories.find((c) => c.id === it.categoryId)!;
      const sub = state.subcategories.find((s) => s.id === it.subcategoryId);
      const rate = getApplicableRate(it.categoryId, customerType, payload.city);
      return {
        id: `oi-${Date.now()}-${idx}`,
        orderId,
        categoryId: it.categoryId,
        subcategoryId: it.subcategoryId,
        categoryName: cat?.name || 'Scrap',
        subcategoryName: sub?.name || cat?.name || 'Standard',
        unit: sub?.unit || cat?.unit || 'kg',
        estimatedQty: it.estimatedQty,
        appliedRate: rate,
        estimatedAmount: Math.round(it.estimatedQty * rate),
      };
    });

    const estWeight = orderItems.reduce((sum, i) => sum + (i.unit === 'kg' ? i.estimatedQty : i.estimatedQty * 15), 0);
    let estAmount = orderItems.reduce((sum, i) => sum + i.estimatedAmount, 0);
    if (payload.couponCode) {
      const coupon = state.coupons.find(
        (c) => c.code.toUpperCase() === payload.couponCode?.trim().toUpperCase() && c.isActive
      );
      if (coupon && estWeight >= coupon.minWeightKg) {
        estAmount = Math.round(estAmount * (1 + coupon.bonusPercent / 100));
      }
    }

    const newOrder: PickupOrder = {
      id: orderId,
      orderNumber,
      customerUserId: customer.id,
      customerName: customer.name,
      customerMobile: customer.mobile,
      customerRole: customerType,
      branchId: payload.branchId,
      branchName: payload.branchName,
      addressText: payload.addressText,
      city: payload.city,
      pinCode: payload.pinCode,
      zoneId,
      lat: payload.lat,
      lng: payload.lng,
      scheduledDate: payload.scheduledDate,
      timeSlot: payload.timeSlot,
      instructions: payload.instructions,
      status: 'confirmed',
      items: orderItems,
      photos: payload.photos,
      estimatedTotalWeight: estWeight,
      estimatedTotalAmount: estAmount,
      pickupOtp: String(Math.floor(1000 + Math.random() * 9000)),
      isRecurring: payload.isRecurring,
      recurringFrequency: payload.recurringFrequency,
      createdAt: now,
      updatedAt: now,
      createdBy: customer.id,
      timeline: [
        { status: 'booking_created', label: 'Booking created', timestamp: now, actor: customer.name },
        { status: 'confirmed', label: 'Confirmed — awaiting executive assignment', timestamp: now, actor: 'Punarchakra System' },
      ],
    };

    const custNotif: NotificationItem = {
      id: `notif-${Date.now()}-c`,
      userId: customer.id,
      channel: 'in_app',
      title: `Booking Confirmed: ${orderNumber}`,
      message: `Scheduled for ${payload.scheduledDate} (${payload.timeSlot}). Est. value ₹${estAmount}.`,
      type: 'order',
      relatedId: orderId,
      isRead: false,
      createdAt: now,
    };

    const adminUsers = state.users.filter((u) => u.role === 'admin' && u.status === 'active');
    const adminNotifs: NotificationItem[] = adminUsers.map((adm) => ({
      id: `notif-${Date.now()}-${adm.id}`,
      userId: adm.id,
      channel: 'in_app',
      title: `New ${customerType.toUpperCase()} Pickup: ${orderNumber}`,
      message: `${customer.name} booked ${estWeight} kg in ${payload.city} (${payload.pinCode}).`,
      type: 'order',
      relatedId: orderId,
      isRead: false,
      createdAt: now,
    }));

    setState((prev) => ({
      ...prev,
      orders: [newOrder, ...prev.orders],
      notifications: [custNotif, ...adminNotifs, ...prev.notifications],
      auditLogs: appendAudit(
        prev,
        customer,
        'ORDER_CREATED',
        'PickupOrder',
        orderId,
        `Created ${orderNumber} (${estWeight} kg, est. ₹${estAmount})`
      ),
    }));

    if (firebaseIdTokenRef.current) {
      postToApi('/api/orders', newOrder);
    }

    dispatchPickupPush({
      targetUserIds: [customer.id, ...adminUsers.map((a) => a.id)],
      title: `Booking Confirmed: ${orderNumber}`,
      body: `Scheduled for ${payload.scheduledDate} (${payload.timeSlot}) in Bengaluru ${payload.pinCode}.`,
      orderId,
      orderNumber,
      status: 'confirmed',
      targetRole: customerType,
    });

    notify('success', `Pickup Booked: ${orderNumber}`, `Scheduled for ${payload.scheduledDate} · OTP ${newOrder.pickupOtp}`);
    return { ok: true, order: newOrder };
  };

  const cancelOrder = (orderId: string, reason: string) => {
    const actor = currentUser || { id: 'system', name: 'System', role: 'admin' as UserRole };
    const existing = state.orders.find((o) => o.id === orderId);
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'cancelled',
              cancellationReason: reason,
              updatedAt: now,
              timeline: [...o.timeline, { status: 'cancelled', label: `Cancelled: ${reason}`, timestamp: now, actor: actor.name }],
            }
          : o
      ),
      auditLogs: appendAudit(prev, actor, 'ORDER_CANCELLED', 'PickupOrder', orderId, reason),
    }));
    if (existing) {
      dispatchPickupPush({
        targetUserIds: [existing.customerUserId, existing.assignedExecutiveId || ''],
        title: `Order Cancelled: ${existing.orderNumber}`,
        body: `Reason: ${reason}`,
        orderId,
        status: 'cancelled',
      });
    }
    notify('info', 'Order cancelled');
  };

  const redeemRewardsToWallet = (userId: string, pointsToRedeem: number) => {
    const profile = state.customerProfiles.find((c) => c.userId === userId);
    if (!profile || profile.loyaltyPoints < pointsToRedeem) {
      return { ok: false, error: 'Insufficient loyalty points.' };
    }
    const rupeeValue = Math.floor(pointsToRedeem / 2); // 2 pts = ₹1
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      customerProfiles: prev.customerProfiles.map((cp) =>
        cp.userId === userId
          ? {
              ...cp,
              loyaltyPoints: cp.loyaltyPoints - pointsToRedeem,
              walletBalance: cp.walletBalance + rupeeValue,
              updatedAt: now,
            }
          : cp
      ),
      rewardTransactions: [
        {
          id: `rw-${Date.now()}`,
          userId,
          points: -pointsToRedeem,
          type: 'redeemed',
          description: `Redeemed ${pointsToRedeem} pts for ₹${rupeeValue} Wallet Credit`,
          createdAt: now,
        },
        ...prev.rewardTransactions,
      ],
    }));
    notify('success', `₹${rupeeValue} credited to Wallet`);
    return { ok: true };
  };

  const submitContactEnquiry = (enquiry: Omit<ContactEnquiry, 'id' | 'createdAt'>) => {
    const created: ContactEnquiry = {
      ...enquiry,
      id: `enq-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      enquiries: [created, ...prev.enquiries],
    }));
    postToApi('/api/public/enquiries', enquiry);
    notify('success', 'Enquiry Received', 'Our team will reach out within 2 business hours.');
  };

  const submitCommunitySignup: ContextValue['submitCommunitySignup'] = async (payload) => {
    const summaryMsg = `[Community Drive: ${payload.programTitle}] Org: ${payload.organisation || 'Individual'} · PIN ${payload.pinCode}`;
    const created: ContactEnquiry = {
      id: `comm-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      mobile: payload.mobile,
      enquiryType: 'Society Drive',
      message: summaryMsg,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      enquiries: [created, ...prev.enquiries],
    }));
    await postToApi('/api/public/community-signup', {
      ...payload,
      track: payload.programTitle,
      organization: payload.organisation,
    });
    notify(
      'success',
      language === 'kn' ? 'ಸಮುದಾಯ ನೋಂದಣಿ ದೃಢೀಕರಿಸಲಾಗಿದೆ' : 'Community Initiative Registered',
      `${payload.programTitle} · Bengaluru (${payload.pinCode})`
    );
  };

  const createSupportTicket: ContextValue['createSupportTicket'] = (payload) => {
    const now = new Date().toISOString();
    const ticketNumber = `TKT-2026-${302 + state.supportTickets.length}`;
    const ticket: SupportTicket = {
      ...payload,
      id: `tkt-${Date.now()}`,
      ticketNumber,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    setState((prev) => ({
      ...prev,
      supportTickets: [ticket, ...prev.supportTickets],
    }));
    if (firebaseIdTokenRef.current) {
      postToApi('/api/support-tickets', ticket);
    }
    notify('success', `Ticket ${ticketNumber} opened`);
  };

  const markNotificationRead = (notifId: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)),
    }));
  };

  const markAllNotificationsRead = (userId: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.userId === userId ? { ...n, isRead: true } : n)),
    }));
  };

  // B2B Quotation Workflow
  const submitQuotation: ContextValue['submitQuotation'] = (payload) => {
    const biz = state.users.find((u) => u.id === payload.businessUserId);
    const now = new Date().toISOString();
    const quoteNumber = `QT-2026-${403 + state.quotations.length}`;
    const items: QuotationItem[] = payload.items.map((it, idx) => ({
      ...it,
      id: `qi-${Date.now()}-${idx}`,
    }));
    const totalWeight = items.reduce((s, i) => s + i.estimatedWeightKg, 0);
    const newQuote: Quotation = {
      id: `qt-${Date.now()}`,
      quoteNumber,
      businessUserId: payload.businessUserId,
      businessName: biz?.name || 'Enterprise Client',
      branchId: payload.branchId,
      pickupLocation: payload.pickupLocation,
      city: payload.city,
      pinCode: payload.pinCode,
      expectedCollectionDate: payload.expectedCollectionDate,
      items,
      photos: payload.photos,
      totalEstimatedWeightKg: totalWeight,
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
    };
    const adminUsers = state.users.filter((u) => u.role === 'admin' && u.status === 'active');
    const bizNotif: NotificationItem = {
      id: `notif-qt-${Date.now()}`,
      userId: payload.businessUserId,
      channel: 'push',
      title: `Quotation Submitted: ${quoteNumber}`,
      message: `${totalWeight} kg lot from ${payload.pickupLocation} (${payload.pinCode}) sent for rate review.`,
      type: 'quotation',
      relatedId: newQuote.id,
      isRead: false,
      createdAt: now,
    };
    setState((prev) => ({
      ...prev,
      quotations: [newQuote, ...prev.quotations],
      notifications: [bizNotif, ...prev.notifications],
      auditLogs: appendAudit(
        prev,
        biz || { id: payload.businessUserId, name: 'B2B Client', role: 'b2b' },
        'QUOTATION_SUBMITTED',
        'Quotation',
        newQuote.id,
        `Submitted ${quoteNumber} (${totalWeight} kg)`
      ),
    }));
    if (firebaseIdTokenRef.current) {
      postToApi('/api/quotations', newQuote);
    }
    dispatchPickupPush({
      targetUserIds: [payload.businessUserId, ...adminUsers.map((a) => a.id)],
      title: `Quotation Submitted: ${quoteNumber}`,
      body: `${biz?.name || 'B2B Client'} submitted ${totalWeight} kg in Bengaluru (${payload.pinCode}).`,
      orderId: newQuote.id,
      orderNumber: quoteNumber,
      status: 'quote_submitted',
      targetRole: 'b2b',
    });
    notify('success', `Quotation ${quoteNumber} submitted`, 'Sent to Punarchakra Enterprise Pricing Desk.');
    return newQuote;
  };

  const adminPriceQuotation: ContextValue['adminPriceQuotation'] = (quotationId, pricedItems, adminNotes) => {
    const actor = currentUser || { id: 'usr-admin-1', name: 'Admin', role: 'admin' as UserRole };
    const now = new Date().toISOString();
    const targetQuote = state.quotations.find((q) => q.id === quotationId);
    let computedTotal = 0;
    if (targetQuote) {
      targetQuote.items.forEach((item) => {
        const match = pricedItems.find((p) => p.id === item.id);
        const rate = match ? match.proposedRate : item.proposedRate || 20;
        computedTotal += Math.round(rate * item.estimatedWeightKg);
      });
    }
    setState((prev) => {
      let targetBusinessId = '';
      let targetQuoteNumber = '';
      let totalQuoted = 0;
      const quotations = prev.quotations.map((q) => {
        if (q.id !== quotationId) return q;
        targetBusinessId = q.businessUserId;
        targetQuoteNumber = q.quoteNumber;
        const updatedItems = q.items.map((item) => {
          const match = pricedItems.find((p) => p.id === item.id);
          const rate = match ? match.proposedRate : item.proposedRate || 20;
          const sub = Math.round(rate * item.estimatedWeightKg);
          totalQuoted += sub;
          return { ...item, proposedRate: rate, proposedSubtotal: sub };
        });
        return {
          ...q,
          items: updatedItems,
          totalQuotedAmount: totalQuoted,
          adminNotes,
          status: 'priced_by_admin' as const,
          updatedAt: now,
        };
      });
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: targetBusinessId,
        channel: 'push',
        title: `Quotation ${targetQuoteNumber} Priced (₹${totalQuoted.toLocaleString('en-IN')})`,
        message: 'Review item-wise pricing and accept to convert into a scheduled pickup.',
        type: 'quotation',
        relatedId: quotationId,
        isRead: false,
        createdAt: now,
      };
      return {
        ...prev,
        quotations,
        notifications: [notif, ...prev.notifications],
        auditLogs: appendAudit(prev, actor, 'QUOTATION_PRICED', 'Quotation', quotationId, `Issued quote ${targetQuoteNumber} at ₹${totalQuoted}`),
      };
    });
    if (targetQuote) {
      dispatchPickupPush({
        targetUserIds: [targetQuote.businessUserId],
        title: `Quotation ${targetQuote.quoteNumber} Priced (₹${computedTotal.toLocaleString('en-IN')})`,
        body: 'Review contract pricing in your B2B Portal and convert into an industrial pickup.',
        orderId: quotationId,
        orderNumber: targetQuote.quoteNumber,
        status: 'quote_priced',
        targetRole: 'b2b',
      });
    }
    notify('success', 'Quotation pricing sent to business');
  };

  const businessRespondQuotation: ContextValue['businessRespondQuotation'] = (quotationId, decision, revisionNotes) => {
    const actor = currentUser || { id: 'usr-b2b-1', name: 'Business User', role: 'b2b' as UserRole };
    const now = new Date().toISOString();
    const targetQuote = state.quotations.find((q) => q.id === quotationId);
    setState((prev) => ({
      ...prev,
      quotations: prev.quotations.map((q) =>
        q.id === quotationId
          ? { ...q, status: decision, revisionNotes: revisionNotes || q.revisionNotes, updatedAt: now }
          : q
      ),
      auditLogs: appendAudit(prev, actor, `QUOTATION_${decision.toUpperCase()}`, 'Quotation', quotationId, revisionNotes || decision),
    }));
    if (targetQuote) {
      const adminUsers = state.users.filter((u) => u.role === 'admin' && u.status === 'active');
      dispatchPickupPush({
        targetUserIds: [targetQuote.businessUserId, ...adminUsers.map((a) => a.id)],
        title: `Quotation ${targetQuote.quoteNumber}: ${decision.replace('_', ' ')}`,
        body: revisionNotes || `${targetQuote.businessName} responded to quotation ${targetQuote.quoteNumber}.`,
        orderId: quotationId,
        orderNumber: targetQuote.quoteNumber,
        status: `quote_${decision}`,
        targetRole: 'b2b',
      });
    }
    notify('success', `Quotation marked as ${decision.replace('_', ' ')}`);
  };

  const convertQuotationToOrder = (quotationId: string, timeSlot: string): PickupOrder | null => {
    const quote = state.quotations.find((q) => q.id === quotationId);
    if (!quote) return null;
    const biz = state.users.find((u) => u.id === quote.businessUserId);
    const now = new Date().toISOString();
    const orderId = `ord-${Date.now()}`;
    const orderNumber = `PNC-2026-${1006 + state.orders.length}`;
    const pinCheck = checkPinServiceability(quote.pinCode);
    const orderItems: OrderItem[] = quote.items.map((qi, idx) => {
      const rate = qi.proposedRate || getApplicableRate(qi.categoryId, 'b2b', quote.city);
      return {
        id: `oi-${Date.now()}-${idx}`,
        orderId,
        categoryId: qi.categoryId,
        subcategoryId: 'custom-quote',
        categoryName: qi.categoryName,
        subcategoryName: qi.materialName,
        unit: 'kg',
        estimatedQty: qi.estimatedWeightKg,
        appliedRate: rate,
        estimatedAmount: Math.round(qi.estimatedWeightKg * rate),
      };
    });
    const newOrder: PickupOrder = {
      id: orderId,
      orderNumber,
      customerUserId: quote.businessUserId,
      customerName: quote.businessName,
      customerMobile: biz?.mobile || '+91 99001 77889',
      customerRole: 'b2b',
      branchId: quote.branchId,
      addressText: quote.pickupLocation,
      city: quote.city,
      pinCode: quote.pinCode,
      zoneId: pinCheck.zone?.id || 'zone-blr-ind-peenya',
      scheduledDate: quote.expectedCollectionDate,
      timeSlot,
      instructions: `Converted from Quotation ${quote.quoteNumber}. ${quote.adminNotes || ''}`,
      status: 'confirmed',
      items: orderItems,
      photos: quote.photos,
      estimatedTotalWeight: quote.totalEstimatedWeightKg,
      estimatedTotalAmount: quote.totalQuotedAmount || orderItems.reduce((s, i) => s + i.estimatedAmount, 0),
      pickupOtp: String(Math.floor(1000 + Math.random() * 9000)),
      quotationId: quote.id,
      createdAt: now,
      updatedAt: now,
      createdBy: quote.businessUserId,
      timeline: [
        { status: 'booking_created', label: `Converted from ${quote.quoteNumber}`, timestamp: now, actor: quote.businessName },
        { status: 'confirmed', label: 'Confirmed for bulk dispatch', timestamp: now, actor: 'Punarchakra System' },
      ],
    };

    const bizOrderNotif: NotificationItem = {
      id: `notif-conv-${Date.now()}`,
      userId: quote.businessUserId,
      channel: 'push',
      title: `Pickup Order Scheduled: ${orderNumber}`,
      message: `${quote.quoteNumber} converted for ${quote.expectedCollectionDate} (${timeSlot}) · OTP ${newOrder.pickupOtp}.`,
      type: 'order',
      relatedId: orderId,
      isRead: false,
      createdAt: now,
    };

    setState((prev) => ({
      ...prev,
      orders: [newOrder, ...prev.orders],
      notifications: [bizOrderNotif, ...prev.notifications],
      quotations: prev.quotations.map((q) =>
        q.id === quotationId ? { ...q, status: 'converted_to_order', convertedOrderId: orderId, updatedAt: now } : q
      ),
      auditLogs: appendAudit(
        prev,
        biz || { id: quote.businessUserId, name: quote.businessName, role: 'b2b' },
        'QUOTATION_CONVERTED',
        'PickupOrder',
        orderId,
        `Converted ${quote.quoteNumber} into Order ${orderNumber}`
      ),
    }));

    const adminUsers = state.users.filter((u) => u.role === 'admin' && u.status === 'active');
    dispatchPickupPush({
      targetUserIds: [quote.businessUserId, ...adminUsers.map((a) => a.id)],
      title: `B2B Order Scheduled: ${orderNumber}`,
      body: `Converted ${quote.quoteNumber} (${quote.totalEstimatedWeightKg} kg) for ${quote.expectedCollectionDate} in Bengaluru (${quote.pinCode}).`,
      orderId,
      orderNumber,
      status: 'confirmed',
      targetRole: 'b2b',
    });

    notify('success', `Converted to Order ${orderNumber}`);
    return newOrder;
  };

  // Executive Workflow
  const respondAssignment: ContextValue['respondAssignment'] = (orderId, executiveUserId, accept, rejectionReason) => {
    const exec = state.users.find((u) => u.id === executiveUserId);
    const now = new Date().toISOString();
    setState((prev) => {
      const assignments = prev.assignments.map((a) =>
        a.orderId === orderId && a.executiveUserId === executiveUserId
          ? { ...a, status: accept ? ('accepted' as const) : ('rejected' as const), rejectionReason, acceptedAt: accept ? now : undefined }
          : a
      );
      const orders = prev.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (!accept) {
          return {
            ...o,
            status: 'confirmed' as OrderStatus,
            assignedExecutiveId: undefined,
            assignedExecutiveName: undefined,
            updatedAt: now,
            timeline: [
              ...o.timeline,
              { status: 'confirmed' as OrderStatus, label: `Executive declined (${rejectionReason || 'Unavailable'}) — awaiting reassignment`, timestamp: now, actor: exec?.name || 'Executive' },
            ],
          };
        }
        return {
          ...o,
          updatedAt: now,
          timeline: [
            ...o.timeline,
            { status: 'executive_assigned' as OrderStatus, label: `${exec?.name || 'Executive'} accepted assignment`, timestamp: now, actor: exec?.name || 'Executive' },
          ],
        };
      });
      return {
        ...prev,
        assignments,
        orders,
        auditLogs: appendAudit(
          prev,
          exec || { id: executiveUserId, name: 'Executive', role: 'executive' },
          accept ? 'ASSIGNMENT_ACCEPTED' : 'ASSIGNMENT_REJECTED',
          'PickupOrder',
          orderId,
          rejectionReason || 'Accepted pickup job'
        ),
      };
    });
    const targetOrder = state.orders.find((o) => o.id === orderId);
    if (targetOrder) {
      dispatchPickupPush({
        targetUserIds: [targetOrder.customerUserId, executiveUserId],
        title: accept
          ? `Executive Confirmed: ${targetOrder.orderNumber}`
          : `Pickup Reassigning: ${targetOrder.orderNumber}`,
        body: accept
          ? `${exec?.name || 'Pickup Executive'} accepted your Bengaluru pickup.`
          : `${exec?.name || 'Executive'} declined (${rejectionReason || 'Unavailable'}).`,
        orderId,
        status: accept ? 'executive_assigned' : 'confirmed',
      });
    }
    notify(accept ? 'success' : 'info', accept ? 'Assignment Accepted' : 'Assignment Returned to Dispatch');
  };

  const advanceExecutiveOrderStatus: ContextValue['advanceExecutiveOrderStatus'] = (orderId, nextStatus) => {
    const labelMap: Record<'on_the_way' | 'reached_location' | 'scrap_collected', string> = {
      on_the_way: 'Executive on the way',
      reached_location: 'Reached location',
      scrap_collected: 'Scrap inspected & collected',
    };
    const now = new Date().toISOString();
    const actor = currentUser || { id: 'exec', name: 'Pickup Executive', role: 'executive' as UserRole };
    const existingOrder = state.orders.find((o) => o.id === orderId);
    setState((prev) => {
      let customerId = '';
      let orderNumber = '';
      const orders = prev.orders.map((o) => {
        if (o.id !== orderId) return o;
        customerId = o.customerUserId;
        orderNumber = o.orderNumber;
        return {
          ...o,
          status: nextStatus,
          updatedAt: now,
          timeline: [...o.timeline, { status: nextStatus, label: labelMap[nextStatus], timestamp: now, actor: actor.name }],
        };
      });
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: customerId,
        channel: 'push',
        title: `${orderNumber}: ${labelMap[nextStatus]}`,
        message: `${actor.name} updated your pickup status.`,
        type: 'order',
        relatedId: orderId,
        isRead: false,
        createdAt: now,
      };
      return {
        ...prev,
        orders,
        notifications: customerId ? [notif, ...prev.notifications] : prev.notifications,
      };
    });
    if (existingOrder) {
      dispatchPickupPush({
        targetUserIds: [existingOrder.customerUserId, actor.id],
        title: `${existingOrder.orderNumber}: ${labelMap[nextStatus]}`,
        body: `${actor.name} updated pickup status in Bengaluru (${existingOrder.pinCode}).`,
        orderId,
        status: nextStatus,
      });
    }
    notify('success', labelMap[nextStatus]);
  };

  const updateExecutiveShiftGps: ContextValue['updateExecutiveShiftGps'] = (userId, lat, lng, availability) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      executiveProfiles: prev.executiveProfiles.map((ep) =>
        ep.userId === userId
          ? { ...ep, availabilityStatus: availability, activeShiftGps: { lat, lng, updatedAt: now } }
          : ep
      ),
    }));
    notify('success', `Shift status: ${availability.replace('_', ' ')}`);
  };

  const completePickupWithWeighing: ContextValue['completePickupWithWeighing'] = (payload) => {
    const order = state.orders.find((o) => o.id === payload.orderId);
    const exec = state.users.find((u) => u.id === payload.executiveUserId);
    if (!order) return { ok: false, error: 'Order not found.' };
    if (payload.enteredOtp.trim() !== order.pickupOtp) {
      return { ok: false, error: `Invalid customer confirmation OTP. Expected ${order.pickupOtp} (shown on customer portal).` };
    }
    const now = new Date().toISOString();
    const updatedItems: OrderItem[] = order.items.map((item) => {
      const entry = payload.actualItems.find((a) => a.itemId === item.id);
      const actualQty = entry ? entry.actualQty : item.estimatedQty;
      // Executives cannot alter admin-published appliedRate
      const actualAmount = Math.round(actualQty * item.appliedRate);
      return { ...item, actualQty, actualAmount };
    });

    const totalWeight = Math.round(
      updatedItems.reduce((s, i) => s + (i.unit === 'kg' ? i.actualQty || 0 : (i.actualQty || 0) * 15), 0) * 10
    ) / 10;
    const finalAmount = updatedItems.reduce((s, i) => s + (i.actualAmount || 0), 0);
    const platformFee = Math.round(finalAmount * 0.08);

    const paymentId = `pay-${Date.now()}`;
    const receiptNumber = `RCP-PNC-${9004 + state.payments.length}`;
    const newPayment: Payment = {
      id: paymentId,
      receiptNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.customerUserId,
      userName: order.customerName,
      userRole: order.customerRole,
      amount: finalAmount,
      platformFee,
      method: payload.paymentMethod,
      status: 'completed',
      transactionRef: `${payload.paymentMethod === 'UPI' ? 'UPI' : 'TXN'}-${Math.floor(100000000000 + Math.random() * 899999999999)}`,
      paidAt: now,
      createdAt: now,
    };

    const newWeighing: WeighingRecord = {
      id: `weigh-${Date.now()}`,
      orderId: order.id,
      executiveId: payload.executiveUserId,
      items: updatedItems.map((i) => ({
        itemId: i.id,
        categoryName: i.categoryName,
        actualQty: i.actualQty || 0,
        rate: i.appliedRate,
        subtotal: i.actualAmount || 0,
      })),
      totalWeightKg: totalWeight,
      totalAmount: finalAmount,
      weighingPhotos: payload.weighingPhotos,
      customerOtpVerified: true,
      notes: payload.notes,
      recordedAt: now,
    };

    const earnedPoints = Math.max(25, Math.round(totalWeight * 5));

    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              items: updatedItems,
              actualTotalWeight: totalWeight,
              finalAmount,
              paymentId,
              status: 'payment_completed',
              updatedAt: now,
              timeline: [
                ...o.timeline,
                { status: 'weight_verified', label: `Weight verified (${totalWeight} kg)`, timestamp: now, actor: exec?.name || 'Executive' },
                { status: 'payment_completed', label: `Payment completed (₹${finalAmount} via ${payload.paymentMethod})`, timestamp: now, actor: 'Punarchakra Payouts' },
              ],
            }
          : o
      ),
      assignments: prev.assignments.map((a) =>
        a.orderId === order.id ? { ...a, status: 'completed' } : a
      ),
      weighingRecords: [newWeighing, ...prev.weighingRecords],
      payments: [newPayment, ...prev.payments],
      executiveProfiles: prev.executiveProfiles.map((ep) =>
        ep.userId === payload.executiveUserId
          ? { ...ep, completedPickupsCount: ep.completedPickupsCount + 1, availabilityStatus: 'available' }
          : ep
      ),
      customerProfiles: prev.customerProfiles.map((cp) =>
        cp.userId === order.customerUserId
          ? {
              ...cp,
              loyaltyPoints: cp.loyaltyPoints + earnedPoints,
              walletBalance:
                payload.paymentMethod === 'Punarchakra Wallet'
                  ? cp.walletBalance + finalAmount
                  : cp.walletBalance,
              updatedAt: now,
            }
          : cp
      ),
      rewardTransactions:
        order.customerRole === 'b2c'
          ? [
              {
                id: `rw-${Date.now()}`,
                userId: order.customerUserId,
                points: earnedPoints,
                type: 'earned',
                description: `Completed pickup ${order.orderNumber} (${totalWeight} kg recycled)`,
                createdAt: now,
              },
              ...prev.rewardTransactions,
            ]
          : prev.rewardTransactions,
      notifications: [
        {
          id: `notif-${Date.now()}-cust`,
          userId: order.customerUserId,
          channel: 'in_app',
          title: `Pickup Completed & Paid: ₹${finalAmount}`,
          message: `Order ${order.orderNumber} (${totalWeight} kg) verified. Receipt ${receiptNumber} is ready.`,
          type: 'payment',
          relatedId: order.id,
          isRead: false,
          createdAt: now,
        },
        ...prev.notifications,
      ],
      auditLogs: appendAudit(
        prev,
        exec || { id: payload.executiveUserId, name: 'Executive', role: 'executive' },
        'PICKUP_COMPLETED',
        'PickupOrder',
        order.id,
        `Verified ${totalWeight} kg, paid ₹${finalAmount} (${receiptNumber})`
      ),
    }));

    if (firebaseIdTokenRef.current) {
      postToApi('/api/orders', {
        ...order,
        items: updatedItems,
        actualTotalWeight: totalWeight,
        finalAmount,
        paymentId,
        status: 'payment_completed',
        updatedAt: now,
      });
      persistDocumentToFirestore('auditLogs', `aud-comp-${Date.now()}`, {
        actorUserId: auth.currentUser?.uid || payload.executiveUserId,
        actorName: exec?.name || 'Executive',
        actorRole: 'executive',
        action: 'PICKUP_COMPLETED',
        entityType: 'PickupOrder',
        entityId: order.id,
        details: `Verified ${totalWeight} kg, paid ₹${finalAmount} (${receiptNumber})`,
        timestamp: now,
      }).catch(() => {});
    }

    dispatchPickupPush({
      targetUserIds: [order.customerUserId, payload.executiveUserId],
      title: `Pickup Paid & Settled: ₹${finalAmount}`,
      body: `Order ${order.orderNumber} (${totalWeight} kg) verified. Receipt ${receiptNumber} issued.`,
      orderId: order.id,
      status: 'payment_completed',
    });

    notify('success', `Pickup Completed · ₹${finalAmount}`, `Receipt ${receiptNumber} synced across portals.`);
    return { ok: true, payment: newPayment };
  };

  // Admin Master Controls
  const adminCreateUser: ContextValue['adminCreateUser'] = async (payload) => {
    const cleanEmail = payload.email.trim().toLowerCase();
    if (state.users.some((u) => u.email.toLowerCase() === cleanEmail && u.role === payload.role)) {
      return { ok: false, error: 'User already exists for this role.' };
    }
    const now = new Date().toISOString();
    const id = `usr-${payload.role}-${Date.now()}`;
    const passwordHash = await hashPassword(payload.password);
    const actor = currentUser || { id: 'usr-admin-1', name: 'Admin', role: 'admin' as UserRole };
    const newUser: User = {
      id,
      uid: `fb-uid-${id}`,
      role: payload.role,
      name: payload.role === 'b2b' ? (payload.companyName || payload.name) : payload.name,
      email: cleanEmail,
      mobile: payload.mobile,
      passwordHash,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: actor.id,
    };

    setState((prev) => {
      const next: PunarchakraState = {
        ...prev,
        users: [newUser, ...prev.users],
        auditLogs: appendAudit(prev, actor, 'ADMIN_USER_CREATED', 'User', id, `Created ${payload.role.toUpperCase()} user ${newUser.name}`),
      };
      if (payload.role === 'executive') {
        next.executiveProfiles = [
          {
            id: `ep-${Date.now()}`,
            userId: id,
            employeeId: payload.employeeId || `PNC-EX-${Math.floor(200 + Math.random() * 700)}`,
            assignedZoneId: payload.zoneId || prev.serviceZones[0]?.id || 'zone-blr-north-hebbal',
            vehicleNumber: 'KA-01-EV-2209',
            vehicleType: 'E-Cargo Van',
            availabilityStatus: 'available',
            rating: 5.0,
            completedPickupsCount: 0,
            createdAt: now,
          },
          ...prev.executiveProfiles,
        ];
      } else if (payload.role === 'b2b') {
        next.businessProfiles = [
          {
            id: `bp-${Date.now()}`,
            userId: id,
            companyName: payload.companyName || payload.name,
            industryType: 'Corporate / Enterprise',
            gstin: (payload.gstin || '29AAACP0000A1Z5').toUpperCase(),
            contactPerson: payload.name,
            businessAddress: 'Bengaluru Registered Office',
            contractTier: 'Standard',
            billingEmail: cleanEmail,
            createdAt: now,
            updatedAt: now,
          },
          ...prev.businessProfiles,
        ];
      } else if (payload.role === 'b2c') {
        next.customerProfiles = [
          {
            id: `cp-${Date.now()}`,
            userId: id,
            loyaltyPoints: 0,
            referralCode: `${payload.name.split(' ')[0].toUpperCase().slice(0, 6)}50`,
            walletBalance: 0,
            preferredPaymentMethod: 'UPI',
            createdAt: now,
            updatedAt: now,
          },
          ...prev.customerProfiles,
        ];
      }
      return next;
    });
    if (firebaseIdTokenRef.current && auth.currentUser) {
      persistDocumentToFirestore('users', id, {
        uid: newUser.uid,
        role: newUser.role,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        status: newUser.status,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        createdBy: newUser.createdBy,
      }).catch(() => {});
    }
    notify('success', `${payload.role.toUpperCase()} account provisioned`);
    return { ok: true };
  };

  const adminUpdateUser: ContextValue['adminUpdateUser'] = async (userId, payload) => {
    const target = state.users.find((u) => u.id === userId);
    if (!target) return { ok: false, error: 'User record not found.' };

    const cleanEmail = payload.email.trim().toLowerCase();
    const duplicate = state.users.some(
      (u) => u.id !== userId && u.email.toLowerCase() === cleanEmail && u.role === target.role
    );
    if (duplicate) {
      return { ok: false, error: 'Another user with this email already exists in this role.' };
    }

    const now = new Date().toISOString();
    const nextPasswordHash =
      payload.password && payload.password.trim().length >= 6
        ? await hashPassword(payload.password.trim())
        : target.passwordHash;
    const actor = currentUser || { id: 'usr-admin-1', name: 'Admin', role: 'admin' as UserRole };

    const updatedUser: User = {
      ...target,
      name: payload.name.trim(),
      email: cleanEmail,
      mobile: payload.mobile.trim(),
      status: payload.status,
      passwordHash: nextPasswordHash,
      updatedAt: now,
    };

    setState((prev) => {
      const next: PunarchakraState = {
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? updatedUser : u)),
        auditLogs: appendAudit(
          prev,
          actor,
          'ADMIN_USER_UPDATED',
          'User',
          userId,
          `Updated ${target.role.toUpperCase()} profile for ${updatedUser.name} (${cleanEmail})`
        ),
      };

      if (target.role === 'b2c') {
        const hasCp = prev.customerProfiles.some((cp) => cp.userId === userId);
        next.customerProfiles = hasCp
          ? prev.customerProfiles.map((cp) =>
              cp.userId === userId
                ? {
                    ...cp,
                    upiId: payload.upiId ?? cp.upiId,
                    loyaltyPoints:
                      typeof payload.loyaltyPoints === 'number' ? payload.loyaltyPoints : cp.loyaltyPoints,
                    walletBalance:
                      typeof payload.walletBalance === 'number' ? payload.walletBalance : cp.walletBalance,
                    updatedAt: now,
                  }
                : cp
            )
          : [
              {
                id: `cp-${Date.now()}`,
                userId,
                loyaltyPoints: payload.loyaltyPoints ?? 0,
                referralCode: `${updatedUser.name.split(' ')[0].toUpperCase().slice(0, 6)}50`,
                walletBalance: payload.walletBalance ?? 0,
                preferredPaymentMethod: 'UPI',
                upiId: payload.upiId,
                createdAt: now,
                updatedAt: now,
              },
              ...prev.customerProfiles,
            ];

        if (payload.addressLine1 !== undefined) {
          const primaryAddr = prev.addresses.find((a) => a.userId === userId);
          if (primaryAddr) {
            next.addresses = prev.addresses.map((a) =>
              a.id === primaryAddr.id
                ? {
                    ...a,
                    line1: payload.addressLine1 || a.line1,
                    city: 'Bengaluru',
                    state: 'Karnataka',
                    pinCode: payload.addressPinCode || a.pinCode,
                  }
                : a
            );
          } else if (payload.addressLine1.trim()) {
            next.addresses = [
              {
                id: `addr-${Date.now()}`,
                userId,
                label: 'Home',
                line1: payload.addressLine1.trim(),
                city: 'Bengaluru',
                state: 'Karnataka',
                pinCode: payload.addressPinCode || '560092',
                isDefault: true,
                createdAt: now,
              },
              ...prev.addresses,
            ];
          }
        }
      } else if (target.role === 'b2b') {
        const hasBp = prev.businessProfiles.some((bp) => bp.userId === userId);
        next.businessProfiles = hasBp
          ? prev.businessProfiles.map((bp) =>
              bp.userId === userId
                ? {
                    ...bp,
                    companyName: payload.companyName ?? updatedUser.name,
                    gstin: (payload.gstin ?? bp.gstin).toUpperCase(),
                    contactPerson: payload.contactPerson ?? bp.contactPerson,
                    businessAddress: payload.businessAddress ?? bp.businessAddress,
                    contractTier: payload.contractTier ?? bp.contractTier,
                    billingEmail: cleanEmail,
                    updatedAt: now,
                  }
                : bp
            )
          : [
              {
                id: `bp-${Date.now()}`,
                userId,
                companyName: payload.companyName || updatedUser.name,
                industryType: 'Corporate / Enterprise',
                gstin: (payload.gstin || '29AAACP0000A1Z5').toUpperCase(),
                contactPerson: payload.contactPerson || updatedUser.name,
                businessAddress: payload.businessAddress || 'Bengaluru Registered Office',
                contractTier: payload.contractTier || 'Standard',
                billingEmail: cleanEmail,
                createdAt: now,
                updatedAt: now,
              },
              ...prev.businessProfiles,
            ];
      } else if (target.role === 'executive') {
        const hasEp = prev.executiveProfiles.some((ep) => ep.userId === userId);
        next.executiveProfiles = hasEp
          ? prev.executiveProfiles.map((ep) =>
              ep.userId === userId
                ? {
                    ...ep,
                    employeeId: payload.employeeId ?? ep.employeeId,
                    assignedZoneId: payload.assignedZoneId ?? ep.assignedZoneId,
                    vehicleNumber: payload.vehicleNumber ?? ep.vehicleNumber,
                    vehicleType: payload.vehicleType ?? ep.vehicleType,
                    availabilityStatus: payload.availabilityStatus ?? ep.availabilityStatus,
                  }
                : ep
            )
          : [
              {
                id: `ep-${Date.now()}`,
                userId,
                employeeId: payload.employeeId || `PNC-EX-${Math.floor(200 + Math.random() * 700)}`,
                assignedZoneId: payload.assignedZoneId || prev.serviceZones[0]?.id || 'zone-blr-north-hebbal',
                vehicleNumber: payload.vehicleNumber || 'KA-01-EV-0001',
                vehicleType: payload.vehicleType || 'E-Cargo Van',
                availabilityStatus: payload.availabilityStatus || 'available',
                rating: 5.0,
                completedPickupsCount: 0,
                createdAt: now,
              },
              ...prev.executiveProfiles,
            ];
      }

      return next;
    });

    if (firebaseIdTokenRef.current) {
      await postToApi(
        `/api/admin/users/${userId}`,
        {
          name: updatedUser.name,
          email: updatedUser.email,
          mobile: updatedUser.mobile,
          status: updatedUser.status,
          role: updatedUser.role,
          updatedAt: now,
        },
        undefined,
        'PUT'
      );
      if (auth.currentUser) {
        persistDocumentToFirestore('users', userId, {
          uid: updatedUser.uid,
          role: updatedUser.role,
          name: updatedUser.name,
          email: updatedUser.email,
          mobile: updatedUser.mobile,
          status: updatedUser.status,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
          createdBy: updatedUser.createdBy,
        }).catch(() => {});
      }
    }

    notify('success', `Updated ${updatedUser.name}`, `${target.role.toUpperCase()} profile saved across platform.`);
    return { ok: true };
  };

  const adminDeleteUser: ContextValue['adminDeleteUser'] = async (targetUserId) => {
    const target = state.users.find((u) => u.id === targetUserId);
    if (!target) return { ok: false, error: 'User not found.' };
    if (currentUser && target.id === currentUser.id) {
      return { ok: false, error: 'You cannot delete the currently signed-in administrator account.' };
    }
    const actor = currentUser || { id: 'usr-admin-1', name: 'Admin', role: 'admin' as UserRole };

    setState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== targetUserId),
      customerProfiles: prev.customerProfiles.filter((cp) => cp.userId !== targetUserId),
      businessProfiles: prev.businessProfiles.filter((bp) => bp.userId !== targetUserId),
      businessBranches: prev.businessBranches.filter((b) => b.businessUserId !== targetUserId),
      executiveProfiles: prev.executiveProfiles.filter((ep) => ep.userId !== targetUserId),
      addresses: prev.addresses.filter((a) => a.userId !== targetUserId),
      auditLogs: appendAudit(
        prev,
        actor,
        'ADMIN_USER_DELETED',
        'User',
        targetUserId,
        `Deleted ${target.role.toUpperCase()} profile ${target.name} (${target.email})`
      ),
    }));

    if (firebaseIdTokenRef.current) {
      await postToApi(`/api/admin/users/${targetUserId}`, {}, undefined, 'DELETE');
      if (auth.currentUser) {
        deleteDocumentFromFirestore('users', targetUserId).catch(() => {});
      }
    }

    notify('info', `Deleted ${target.name}`, `${target.role.toUpperCase()} profile removed from directory.`);
    return { ok: true };
  };

  const adminToggleUserStatus = (targetUserId: string, status: 'active' | 'deactivated') => {
    const actor = currentUser || { id: 'usr-admin-1', name: 'Admin', role: 'admin' as UserRole };
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === targetUserId ? { ...u, status, updatedAt: new Date().toISOString() } : u
      ),
      auditLogs: appendAudit(
        prev,
        actor,
        status === 'deactivated' ? 'USER_DEACTIVATED' : 'USER_REACTIVATED',
        'User',
        targetUserId,
        `Account status changed to ${status}`
      ),
    }));
    notify('success', `User ${status}`);
  };

  const adminRevokeUserSession = (targetUserId: string) => {
    const actor = currentUser || { id: 'usr-admin-1', name: 'Admin', role: 'admin' as UserRole };
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === targetUserId ? { ...u, sessionRevokedAt: now } : u)),
      auditLogs: appendAudit(prev, actor, 'SESSION_REVOKED', 'User', targetUserId, 'Revoked active sessions'),
    }));
    notify('info', 'User sessions revoked');
  };

  const adminAssignExecutive = (orderId: string, executiveUserId: string) => {
    const exec = state.users.find((u) => u.id === executiveUserId);
    const actor = currentUser || { id: 'usr-admin-1', name: 'Admin', role: 'admin' as UserRole };
    const now = new Date().toISOString();
    if (!exec) return;

    setState((prev) => {
      const order = prev.orders.find((o) => o.id === orderId);
      const newAssignment: ExecutiveAssignment = {
        id: `asgn-${Date.now()}`,
        orderId,
        executiveUserId,
        executiveName: exec.name,
        assignedBy: actor.name,
        status: 'pending_acceptance',
        assignedAt: now,
      };
      return {
        ...prev,
        assignments: [newAssignment, ...prev.assignments],
        orders: prev.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'executive_assigned',
                assignedExecutiveId: exec.id,
                assignedExecutiveName: exec.name,
                updatedAt: now,
                timeline: [
                  ...o.timeline,
                  { status: 'executive_assigned', label: `Executive assigned (${exec.name})`, timestamp: now, actor: actor.name },
                ],
              }
            : o
        ),
        notifications: [
          {
            id: `notif-${Date.now()}-exec`,
            userId: exec.id,
            channel: 'push',
            title: `New Pickup Assigned: ${order?.orderNumber || orderId}`,
            message: `Customer: ${order?.customerName} · ${order?.city} (${order?.pinCode})`,
            type: 'assignment',
            relatedId: orderId,
            isRead: false,
            createdAt: now,
          },
          ...(order
            ? [
                {
                  id: `notif-${Date.now()}-cust`,
                  userId: order.customerUserId,
                  channel: 'sms' as const,
                  title: `Executive Assigned for ${order.orderNumber}`,
                  message: `${exec.name} will handle your pickup on ${order.scheduledDate}.`,
                  type: 'assignment' as const,
                  relatedId: orderId,
                  isRead: false,
                  createdAt: now,
                },
              ]
            : []),
          ...prev.notifications,
        ],
        auditLogs: appendAudit(prev, actor, 'EXECUTIVE_ASSIGNED', 'PickupOrder', orderId, `Assigned ${exec.name}`),
      };
    });
    const assignedOrder = state.orders.find((o) => o.id === orderId);
    if (assignedOrder) {
      dispatchPickupPush({
        targetUserIds: [exec.id, assignedOrder.customerUserId],
        title: `Executive Assigned: ${assignedOrder.orderNumber}`,
        body: `${exec.name} assigned for ${assignedOrder.customerName} (${assignedOrder.pinCode}).`,
        orderId,
        status: 'executive_assigned',
      });
    }
    notify('success', `Assigned ${exec.name}`);
  };

  const adminRescheduleOrder = (orderId: string, scheduledDate: string, timeSlot: string) => {
    const actor = currentUser || { id: 'usr-admin-1', name: 'Admin', role: 'admin' as UserRole };
    const now = new Date().toISOString();
    const existingOrder = state.orders.find((o) => o.id === orderId);
    setState((prev) => {
      const target = prev.orders.find((o) => o.id === orderId);
      const customerNotif: NotificationItem[] = target
        ? [
            {
              id: `notif-resch-${Date.now()}`,
              userId: target.customerUserId,
              channel: 'push',
              title: `Pickup Rescheduled: ${target.orderNumber}`,
              message: `New pickup slot: ${scheduledDate} (${timeSlot}).`,
              type: 'order',
              relatedId: orderId,
              isRead: false,
              createdAt: now,
            },
          ]
        : [];
      return {
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                scheduledDate,
                timeSlot,
                updatedAt: now,
                timeline: [...o.timeline, { status: o.status, label: `Rescheduled to ${scheduledDate} (${timeSlot})`, timestamp: now, actor: actor.name }],
              }
            : o
        ),
        notifications: [...customerNotif, ...prev.notifications],
        auditLogs: appendAudit(prev, actor, 'ORDER_RESCHEDULED', 'PickupOrder', orderId, `${scheduledDate} · ${timeSlot}`),
      };
    });
    if (existingOrder) {
      dispatchPickupPush({
        targetUserIds: [existingOrder.customerUserId, existingOrder.assignedExecutiveId || ''],
        title: `Pickup Rescheduled: ${existingOrder.orderNumber}`,
        body: `Updated slot: ${scheduledDate} (${timeSlot}) in Bengaluru (${existingOrder.pinCode}).`,
        orderId,
        orderNumber: existingOrder.orderNumber,
        status: existingOrder.status,
      });
    }
    notify('success', 'Schedule updated');
  };

  const adminUpsertRate: ContextValue['adminUpsertRate'] = (payload) => {
    const actor = currentUser || { id: 'usr-admin-1', name: 'Admin', role: 'admin' as UserRole };
    const now = new Date().toISOString();
    setState((prev) => {
      const existing = prev.rates.find(
        (r) =>
          r.categoryId === payload.categoryId &&
          r.customerType === payload.customerType &&
          r.city.toLowerCase() === payload.city.toLowerCase() &&
          r.qualityGrade === payload.qualityGrade
      );
      let rates: ScrapRate[];
      if (existing) {
        rates = prev.rates.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                ratePerUnit: payload.ratePerUnit,
                effectiveFrom: payload.effectiveFrom,
                zoneId: payload.zoneId,
                updatedBy: actor.name,
                updatedAt: now,
                history: [
                  ...r.history,
                  { rate: payload.ratePerUnit, changedAt: now, changedBy: actor.name, note: payload.note },
                ],
              }
            : r
        );
      } else {
        const newRate: ScrapRate = {
          id: `rate-${Date.now()}`,
          categoryId: payload.categoryId,
          city: payload.city,
          zoneId: payload.zoneId,
          customerType: payload.customerType,
          qualityGrade: payload.qualityGrade,
          ratePerUnit: payload.ratePerUnit,
          effectiveFrom: payload.effectiveFrom,
          isActive: true,
          updatedBy: actor.name,
          updatedAt: now,
          history: [{ rate: payload.ratePerUnit, changedAt: now, changedBy: actor.name, note: payload.note }],
        };
        rates = [newRate, ...prev.rates];
      }
      return {
        ...prev,
        rates,
        auditLogs: appendAudit(
          prev,
          actor,
          'RATE_PUBLISHED',
          'ScrapRate',
          payload.categoryId,
          `${payload.customerType.toUpperCase()} rate in ${payload.city} set to ₹${payload.ratePerUnit} (${payload.note})`
        ),
      };
    });
    if (firebaseIdTokenRef.current) {
      postToApi('/api/rates', {
        id: `rate-${payload.categoryId}-${payload.city.toLowerCase()}-${payload.customerType}`,
        categoryId: payload.categoryId,
        city: payload.city,
        zoneId: payload.zoneId,
        customerType: payload.customerType,
        qualityGrade: payload.qualityGrade,
        ratePerUnit: payload.ratePerUnit,
        effectiveFrom: payload.effectiveFrom,
        isActive: true,
        updatedBy: actor.name,
        updatedAt: now,
      });
    }
    notify('success', 'Scrap rate published', 'Live across Customer Portal, B2B Portal, and Price Calculator.');
  };

  const adminAddCategory: ContextValue['adminAddCategory'] = (cat) => {
    const actor = currentUser || { id: 'usr-admin-1', name: 'Admin', role: 'admin' as UserRole };
    const id = `cat-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, { ...cat, id, sortOrder: prev.categories.length + 1 }],
      auditLogs: appendAudit(prev, actor, 'CATEGORY_CREATED', 'ScrapCategory', id, cat.name),
    }));
    notify('success', `Category "${cat.name}" added`);
  };

  const adminToggleCategory = (categoryId: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === categoryId ? { ...c, isActive: !c.isActive } : c)),
    }));
    notify('info', 'Category status toggled');
  };

  const adminAddSubcategory: ContextValue['adminAddSubcategory'] = (sub) => {
    const id = `sub-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      subcategories: [...prev.subcategories, { ...sub, id }],
    }));
    notify('success', `Subcategory "${sub.name}" added`);
  };

  const adminAddServiceZone: ContextValue['adminAddServiceZone'] = (zone) => {
    const id = `zone-${Date.now()}`;
    const normalizedZone: ServiceZone = {
      ...zone,
      city: 'Bengaluru',
      state: 'Karnataka',
      id,
    };
    setState((prev) => ({
      ...prev,
      serviceZones: [...prev.serviceZones, normalizedZone],
    }));
    notify('success', `Bengaluru zone "${zone.name}" added`);
  };

  const adminToggleServiceZone = (zoneId: string) => {
    setState((prev) => ({
      ...prev,
      serviceZones: prev.serviceZones.map((z) => (z.id === zoneId ? { ...z, isActive: !z.isActive } : z)),
    }));
  };

  const adminUpdatePaymentStatus: ContextValue['adminUpdatePaymentStatus'] = (paymentId, status) => {
    const actor = currentUser || { id: 'usr-admin-1', name: 'Admin', role: 'admin' as UserRole };
    setState((prev) => ({
      ...prev,
      payments: prev.payments.map((p) => (p.id === paymentId ? { ...p, status } : p)),
      auditLogs: appendAudit(prev, actor, 'PAYMENT_UPDATED', 'Payment', paymentId, `Status changed to ${status}`),
    }));
    notify('success', `Payment marked ${status}`);
  };

  const adminReplySupportTicket: ContextValue['adminReplySupportTicket'] = (ticketId, reply, status) => {
    setState((prev) => ({
      ...prev,
      supportTickets: prev.supportTickets.map((t) =>
        t.id === ticketId ? { ...t, adminReply: reply, status, updatedAt: new Date().toISOString() } : t
      ),
    }));
    notify('success', 'Support ticket updated');
  };

  const adminUpdateCms = (cms: CmsContent) => {
    const actor = currentUser || { id: 'usr-admin-1', name: 'Admin', role: 'admin' as UserRole };
    setState((prev) => ({
      ...prev,
      cms,
      auditLogs: appendAudit(prev, actor, 'CMS_UPDATED', 'CmsContent', 'homepage', 'Updated homepage content / FAQs'),
    }));
    notify('success', 'Homepage CMS published');
  };

  const adminAddCoupon: ContextValue['adminAddCoupon'] = (coupon) => {
    setState((prev) => ({
      ...prev,
      coupons: [{ ...coupon, id: `cpn-${Date.now()}` }, ...prev.coupons],
    }));
    notify('success', `Coupon ${coupon.code} created`);
  };

  const resetDemoWorkspace = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialSeedState);
    notify('info', 'Workspace restored to default Punarchakra seed data');
  };

  return (
    <PunarchakraContext.Provider
      value={{
        state,
        currentUser,
        activeView,
        authInitialMode,
        authInitialRole,
        toasts,
        pendingBookingDraft,
        setPendingBookingDraft,
        navigateTo,
        notify,
        dismissToast,
        language,
        toggleLanguage,
        t,
        isLoading,
        loadingLabel,
        isNavigatingSkeleton,
        lastRatesSyncAt,
        ratesSyncSource,
        syncLiveRatesOnline,
        a11y,
        a11yPanelOpen,
        setA11yPanelOpen,
        toggleHighContrast,
        setTextScale,
        toggleScreenReaderEnhanced,
        toggleReduceMotion,
        resetA11y,
        liveAnnouncement,
        assertiveAnnouncement,
        announce,
        fcmStatus,
        fcmToken,
        lastPushAlert,
        enablePushNotifications,
        sendTestPushAlert,
        firebaseSynced,
        loginWithEmail,
        loginWithOtp,
        loginWithGoogle,
        quickDemoLogin,
        registerAccount,
        resetPasswordByEmail,
        logout,
        getApplicableRate,
        checkPinServiceability,
        getSmartExecutiveRecommendations,
        getPredictivePickupForCustomer,
        createAddress,
        createBusinessBranch,
        updateBusinessProfile,
        updateCustomerProfile,
        createPickupOrder,
        cancelOrder,
        redeemRewardsToWallet,
        submitContactEnquiry,
        submitCommunitySignup,
        createSupportTicket,
        markNotificationRead,
        markAllNotificationsRead,
        submitQuotation,
        adminPriceQuotation,
        businessRespondQuotation,
        convertQuotationToOrder,
        respondAssignment,
        advanceExecutiveOrderStatus,
        updateExecutiveShiftGps,
        completePickupWithWeighing,
        adminCreateUser,
        adminUpdateUser,
        adminDeleteUser,
        adminToggleUserStatus,
        adminRevokeUserSession,
        adminAssignExecutive,
        adminRescheduleOrder,
        adminUpsertRate,
        adminAddCategory,
        adminToggleCategory,
        adminAddSubcategory,
        adminAddServiceZone,
        adminToggleServiceZone,
        adminUpdatePaymentStatus,
        adminReplySupportTicket,
        adminUpdateCms,
        adminAddCoupon,
        resetDemoWorkspace,
      }}
    >
      {children}
    </PunarchakraContext.Provider>
  );
};

export function usePunarchakra() {
  const ctx = useContext(PunarchakraContext);
  if (!ctx) throw new Error('usePunarchakra must be used inside PunarchakraProvider');
  return ctx;
}
