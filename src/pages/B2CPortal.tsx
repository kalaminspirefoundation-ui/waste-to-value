import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Bell,
  Calculator,
  Calendar,
  CheckCircle2,
  Coins,
  CreditCard,
  HelpCircle,
  Home,
  IndianRupee,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  Navigation,
  Package,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
  Truck,
  Upload,
  User as UserIcon,
  Wallet,
  X,
} from 'lucide-react';
import { usePunarchakra } from '../context/PunarchakraContext';
import { Payment, PaymentMethod, PickupOrder } from '../types/punarchakra';
import { DonutBreakdownChart, SimpleBarChart } from '../components/ui/Charts';
import { DataTable } from '../components/ui/DataTable';
import { OrderTracker } from '../components/ui/OrderTracker';
import {
  AppLogo,
  Button,
  Card,
  EmptyState,
  ImageWithFallback,
  Input,
  Modal,
  Select,
  StatusIndicator,
  Textarea,
} from '../components/ui/Primitives';
import { AccessibilityTriggerButton } from '../components/ui/AccessibilityToolbar';
import { PushAlertsCard } from '../components/ui/PushAlertsCard';
import { ReceiptModal } from '../components/ui/ReceiptModal';

type B2CTab =
  | 'dashboard'
  | 'sell'
  | 'rates'
  | 'schedule'
  | 'orders'
  | 'track'
  | 'wallet'
  | 'payments'
  | 'rewards'
  | 'impact'
  | 'notifications'
  | 'profile'
  | 'support';

export const B2CPortal: React.FC = () => {
  const {
    state,
    currentUser,
    navigateTo,
    logout,
    notify,
    getApplicableRate,
    checkPinServiceability,
    getPredictivePickupForCustomer,
    createAddress,
    updateCustomerProfile,
    createPickupOrder,
    cancelOrder,
    redeemRewardsToWallet,
    createSupportTicket,
    markNotificationRead,
    markAllNotificationsRead,
    pendingBookingDraft,
    setPendingBookingDraft,
  } = usePunarchakra();

  const [tab, setTab] = useState<B2CTab>(() => (pendingBookingDraft?.items?.length ? 'sell' : 'dashboard'));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Cart for Sell Scrap
  const activeCategories = useMemo(
    () => state.categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [state.categories]
  );
  const [selectedCatId, setSelectedCatId] = useState(activeCategories[0]?.id || 'cat-newspapers');
  const matchingSubs = useMemo(
    () => state.subcategories.filter((s) => s.categoryId === selectedCatId && s.isActive),
    [state.subcategories, selectedCatId]
  );
  const [selectedSubId, setSelectedSubId] = useState(matchingSubs[0]?.id || '');
  const [estQty, setEstQty] = useState(12);
  const [cartItems, setCartItems] = useState<
    { categoryId: string; subcategoryId: string; estimatedQty: number }[]
  >(() =>
    pendingBookingDraft?.items?.length
      ? pendingBookingDraft.items.map((i) => ({
          categoryId: i.categoryId,
          subcategoryId: i.subcategoryId || state.subcategories.find((s) => s.categoryId === i.categoryId)?.id || '',
          estimatedQty: i.qty,
        }))
      : []
  );
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (matchingSubs.length > 0 && !matchingSubs.some((s) => s.id === selectedSubId)) {
      setSelectedSubId(matchingSubs[0].id);
    }
  }, [matchingSubs, selectedSubId]);

  useEffect(() => {
    if (pendingBookingDraft) {
      setPendingBookingDraft(null);
    }
  }, [pendingBookingDraft, setPendingBookingDraft]);

  // Booking / Address state
  const myAddresses = useMemo(
    () => state.addresses.filter((a) => a.userId === currentUser?.id),
    [state.addresses, currentUser]
  );
  const [selectedAddressId, setSelectedAddressId] = useState(myAddresses[0]?.id || '');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddrForm, setNewAddrForm] = useState({
    label: '',
    line1: '',
    landmark: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: '560092',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
  });
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('09:00 AM - 11:30 AM');
  const [instructions, setInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');

  // Tracking & Receipts
  const [trackedOrderId, setTrackedOrderId] = useState<string>('');
  const [receiptModalData, setReceiptModalData] = useState<{ payment: Payment; order?: PickupOrder } | null>(null);

  // Support ticket form
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'Pickup Delay' as const,
    message: '',
  });

  // Profile form
  const customerProfile = state.customerProfiles.find((c) => c.userId === currentUser?.id);
  const [upiInput, setUpiInput] = useState(customerProfile?.upiId || '');
  const [prefMethod, setPrefMethod] = useState<PaymentMethod>(customerProfile?.preferredPaymentMethod || 'UPI');

  if (!currentUser) return null;

  const myOrders = useMemo(
    () =>
      state.orders
        .filter((o) => o.customerUserId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [state.orders, currentUser.id]
  );

  const myPayments = useMemo(
    () =>
      state.payments
        .filter((p) => p.userId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [state.payments, currentUser.id]
  );

  const myNotifications = useMemo(
    () => state.notifications.filter((n) => n.userId === currentUser.id),
    [state.notifications, currentUser.id]
  );
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  const myRewards = useMemo(
    () => state.rewardTransactions.filter((r) => r.userId === currentUser.id),
    [state.rewardTransactions, currentUser.id]
  );

  const myTickets = useMemo(
    () => state.supportTickets.filter((t) => t.userId === currentUser.id),
    [state.supportTickets, currentUser.id]
  );

  const activeAddress = myAddresses.find((a) => a.id === selectedAddressId) || myAddresses[0];
  const pinStatus = activeAddress ? checkPinServiceability(activeAddress.pinCode) : { serviceable: false };

  const completedOrders = myOrders.filter((o) => o.status === 'payment_completed');
  const upcomingOrder = myOrders.find((o) => !['payment_completed', 'cancelled'].includes(o.status));
  const pendingOrders = myOrders.filter((o) => !['payment_completed', 'cancelled'].includes(o.status));
  const totalScrapKg = Math.round(
    completedOrders.reduce((s, o) => s + (o.actualTotalWeight || o.estimatedTotalWeight), 0) * 10
  ) / 10;
  const totalEarnings = completedOrders.reduce((s, o) => s + (o.finalAmount || 0), 0);
  const pendingPayoutEst = pendingOrders.reduce((s, o) => s + o.estimatedTotalAmount, 0);
  const totalCo2Avoided = Math.round(
    completedOrders.reduce(
      (s, o) =>
        s +
        o.items.reduce((is, it) => {
          const cat = state.categories.find((c) => c.id === it.categoryId);
          return is + (it.actualQty ?? it.estimatedQty) * (cat?.co2FactorPerKg || 1.5);
        }, 0),
      0
    )
  );

  const prediction = getPredictivePickupForCustomer(currentUser.id);
  const trackedOrder = myOrders.find((o) => o.id === trackedOrderId) || upcomingOrder || myOrders[0];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files)
      .slice(0, 3)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setUploadedPhotos((prev) => [...prev.slice(0, 2), reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
  };

  const handleAddToCart = () => {
    if (estQty <= 0) {
      notify('error', 'Enter a valid quantity');
      return;
    }
    setCartItems((prev) => [
      ...prev,
      { categoryId: selectedCatId, subcategoryId: selectedSubId, estimatedQty: estQty },
    ]);
    notify('success', 'Material added to pickup list');
  };

  const cartSummary = useMemo(() => {
    const city = activeAddress?.city || 'Bengaluru';
    const items = cartItems.map((ci) => {
      const cat = activeCategories.find((c) => c.id === ci.categoryId);
      const sub = state.subcategories.find((s) => s.id === ci.subcategoryId);
      const rate = getApplicableRate(ci.categoryId, 'b2c', city);
      return {
        ...ci,
        catName: cat?.name || 'Scrap',
        subName: sub?.name || 'Standard',
        unit: sub?.unit || cat?.unit || 'kg',
        rate,
        estAmount: Math.round(ci.estimatedQty * rate),
      };
    });
    return {
      items,
      totalAmount: items.reduce((s, i) => s + i.estAmount, 0),
    };
  }, [cartItems, activeAddress, activeCategories, state.subcategories, getApplicableRate]);

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setNewAddrForm((f) => ({ ...f, lat: 12.9716, lng: 77.5946 }));
      notify('info', 'GPS coordinates populated from regional hub');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewAddrForm((f) => ({
          ...f,
          lat: Math.round(pos.coords.latitude * 10000) / 10000,
          lng: Math.round(pos.coords.longitude * 10000) / 10000,
        }));
        notify('success', 'GPS location locked');
      },
      () => {
        setNewAddrForm((f) => ({ ...f, lat: 12.9716, lng: 77.5946 }));
        notify('info', 'Location permission declined — using city centroid');
      }
    );
  };

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const created = createAddress({
      userId: currentUser.id,
      label: newAddrForm.label || 'Home',
      line1: newAddrForm.line1,
      landmark: newAddrForm.landmark,
      city: newAddrForm.city,
      state: newAddrForm.state,
      pinCode: newAddrForm.pinCode,
      lat: newAddrForm.lat,
      lng: newAddrForm.lng,
      isDefault: true,
    });
    setSelectedAddressId(created.id);
    setShowAddAddress(false);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAddress) {
      notify('error', 'Please add a pickup address first');
      return;
    }
    const itemsToBook =
      cartItems.length > 0
        ? cartItems
        : [{ categoryId: selectedCatId, subcategoryId: selectedSubId, estimatedQty: estQty }];

    const res = createPickupOrder({
      customerUserId: currentUser.id,
      addressText: `${activeAddress.line1}, ${activeAddress.city}`,
      city: activeAddress.city,
      pinCode: activeAddress.pinCode,
      lat: activeAddress.lat,
      lng: activeAddress.lng,
      scheduledDate,
      timeSlot,
      instructions,
      items: itemsToBook,
      photos: uploadedPhotos,
      couponCode,
    });
    if (res.ok && res.order) {
      setCartItems([]);
      setUploadedPhotos([]);
      setInstructions('');
      setCouponCode('');
      setTrackedOrderId(res.order.id);
      setTab('track');
    }
  };

  const NAV_ITEMS: { id: B2CTab; label: string; Icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', Icon: Home },
    { id: 'sell', label: 'Sell Scrap', Icon: Package },
    { id: 'rates', label: 'Scrap Rates', Icon: Calculator },
    { id: 'schedule', label: 'Schedule Pickup', Icon: Calendar },
    { id: 'orders', label: 'My Orders', Icon: Receipt },
    { id: 'track', label: 'Track Pickup', Icon: Truck },
    { id: 'wallet', label: 'Wallet', Icon: Wallet },
    { id: 'payments', label: 'Payment History', Icon: CreditCard },
    { id: 'rewards', label: 'Rewards', Icon: Award },
    { id: 'impact', label: 'Environmental Impact', Icon: Leaf },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
    { id: 'profile', label: 'My Profile', Icon: UserIcon },
    { id: 'support', label: 'Support', Icon: HelpCircle },
  ];

  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    completedOrders.forEach((o) =>
      o.items.forEach((i) => {
        totals[i.categoryName] = (totals[i.categoryName] || 0) + (i.actualQty ?? i.estimatedQty);
      })
    );
    const palette = ['#174B37', '#28A66A', '#A5D66D', '#528265', '#82B366'];
    return Object.entries(totals).map(([label, value], idx) => ({
      label,
      value: Math.round(value * 10) / 10,
      color: palette[idx % palette.length],
    }));
  }, [completedOrders]);

  return (
    <div className="min-h-screen bg-[#F7F9F6] flex flex-col lg:flex-row pb-20 lg:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-[#202820]/10 z-30">
        <div className="h-16 px-5 flex items-center border-b border-[#202820]/10">
          <AppLogo onClick={() => navigateTo('public')} />
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.Icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#174B37] text-white'
                    : 'text-[#202820]/75 hover:bg-[#F7F9F6] hover:text-[#174B37]'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className="font-mono text-xs font-bold text-[#A5D66D]">{unreadCount}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-[#202820]/10">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#DC2626] hover:bg-[#DC2626]/8 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar (compact on mobile <= 56px) */}
        <header className="sticky top-0 z-30 h-14 lg:h-16 bg-white/95 backdrop-blur-md border-b border-[#202820]/10 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#174B37] hover:bg-[#F7F9F6] cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="font-display font-bold text-base text-[#174B37] truncate">
                {NAV_ITEMS.find((n) => n.id === tab)?.label}
              </p>
              <p className="hidden sm:block text-xs text-[#202820]/55 truncate">
                B2C Customer Portal · {currentUser.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AccessibilityTriggerButton compact />
            <Button variant="outline" size="sm" onClick={() => navigateTo('public')}>
              Public Site
            </Button>
            <Button size="sm" onClick={() => setTab('sell')}>
              <Plus className="w-4 h-4" />
              Sell Scrap
            </Button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-black/50 flex">
            <div className="w-72 bg-white h-full flex flex-col shadow-xl">
              <div className="h-14 px-4 flex items-center justify-between border-b border-[#202820]/10">
                <AppLogo />
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-2 text-[#202820]/60"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTab(item.id);
                        setMobileNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                        tab === item.id ? 'bg-[#174B37] text-white' : 'text-[#202820]/80'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="p-3 border-t border-[#202820]/10">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#DC2626]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Viewport Container */}
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <>
              <PushAlertsCard portalLabel="B2C Customer" />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Total Pickups</span>
                  <p className="font-display text-2xl sm:text-3xl font-bold text-[#174B37] mt-1 tabular-nums">
                    {myOrders.length}
                  </p>
                  <span className="text-xs text-[#28A66A] font-medium">
                    {completedOrders.length} completed
                  </span>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Total Scrap Sold</span>
                  <p className="font-display text-2xl sm:text-3xl font-bold text-[#174B37] mt-1 tabular-nums">
                    {totalScrapKg} kg
                  </p>
                  <span className="text-xs text-[#202820]/55">Verified on digital scale</span>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Total Earnings</span>
                  <p className="font-display text-2xl sm:text-3xl font-bold text-[#174B37] mt-1 tabular-nums">
                    ₹{totalEarnings.toLocaleString('en-IN')}
                  </p>
                  <span className="text-xs text-[#28A66A] font-medium">Direct UPI & Wallet payouts</span>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Upcoming Pickup</span>
                  <p className="font-display text-lg font-bold text-[#174B37] mt-1 tabular-nums">
                    {upcomingOrder ? upcomingOrder.scheduledDate : 'None scheduled'}
                  </p>
                  <span className="text-xs text-[#202820]/55">
                    {upcomingOrder ? `${upcomingOrder.orderNumber} · OTP ${upcomingOrder.pickupOtp}` : 'Ready when you are'}
                  </span>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Pending Payments (Est.)</span>
                  <p className="font-display text-2xl font-bold text-[#D97706] mt-1 tabular-nums">
                    ₹{pendingPayoutEst.toLocaleString('en-IN')}
                  </p>
                  <span className="text-xs text-[#202820]/55">Settled upon doorstep weighing</span>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Environmental Contribution</span>
                  <p className="font-display text-2xl font-bold text-[#28A66A] mt-1 tabular-nums">
                    {totalCo2Avoided} kg CO₂
                  </p>
                  <span className="text-xs text-[#202820]/55">Emissions avoided</span>
                </Card>
              </div>

              {/* Predictive Smart Reminder */}
              <Card padding="md" className="bg-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#28A66A]">
                      <Sparkles className="w-4 h-4" />
                      <span>Smart Pickup Prediction (Historical Cadence)</span>
                    </div>
                    {prediction.hasEnoughHistory ? (
                      <>
                        <h3 className="font-display text-lg font-bold text-[#174B37]">
                          Next Expected Pickup Ready Around {prediction.predictedNextDate}
                        </h3>
                        <p className="text-xs text-[#202820]/65">
                          {prediction.confidenceLabel} · Frequent materials: {prediction.topCategories.join(', ')}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-display text-lg font-bold text-[#174B37]">
                          Building Your Recycling Cadence
                        </h3>
                        <p className="text-xs text-[#202820]/65">
                          {prediction.confidenceLabel}. Complete another pickup to unlock personalized schedule reminders.
                        </p>
                      </>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (prediction.predictedNextDate) setScheduledDate(prediction.predictedNextDate);
                      setTab('sell');
                    }}
                  >
                    {prediction.hasEnoughHistory ? 'Schedule Suggested Pickup' : 'Book Pickup'}
                  </Button>
                </div>
              </Card>

              {upcomingOrder && (
                <Card padding="md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-display font-bold text-base text-[#174B37]">
                        Active Order Progress · {upcomingOrder.orderNumber}
                      </h3>
                      <p className="text-xs text-[#202820]/60">
                        Share Confirmation OTP <span className="font-mono font-bold text-[#174B37]">{upcomingOrder.pickupOtp}</span> with executive only after weighing.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTrackedOrderId(upcomingOrder.id);
                        setTab('track');
                      }}
                    >
                      Open Live Tracker
                    </Button>
                  </div>
                  <OrderTracker currentStatus={upcomingOrder.status} />
                </Card>
              )}

              <div className="grid lg:grid-cols-2 gap-6">
                <Card padding="md">
                  <h3 className="font-display font-bold text-base text-[#174B37] mb-4">
                    Material Mix Recycled
                  </h3>
                  <DonutBreakdownChart
                    segments={categoryBreakdown}
                    centerLabel="Total"
                    centerValue={`${totalScrapKg} kg`}
                  />
                </Card>
                <Card padding="md">
                  <h3 className="font-display font-bold text-base text-[#174B37] mb-4">
                    Recent Payout History
                  </h3>
                  <SimpleBarChart
                    data={completedOrders.map((o) => ({
                      label: o.scheduledDate.slice(5),
                      value: o.finalAmount || 0,
                    }))}
                    unit="₹"
                    primaryLabel="Payout"
                  />
                </Card>
              </div>
            </>
          )}

          {/* SELL SCRAP */}
          {tab === 'sell' && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-5">
                <Card padding="md">
                  <h2 className="font-display font-bold text-lg text-[#174B37] mb-3">
                    1. Select Scrap Category
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeCategories.map((cat) => {
                      const rate = getApplicableRate(cat.id, 'b2c', activeAddress?.city);
                      const selected = selectedCatId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCatId(cat.id)}
                          className={`rounded-xl border overflow-hidden text-left transition-all cursor-pointer ${
                            selected
                              ? 'border-[#174B37] ring-2 ring-[#28A66A]/40 bg-[#F7F9F6]'
                              : 'border-[#202820]/10 bg-white hover:border-[#28A66A]/50'
                          }`}
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden">
                            <ImageWithFallback src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-2.5">
                            <p className="font-display font-bold text-xs text-[#174B37] truncate">{cat.name}</p>
                            <p className="font-mono text-xs text-[#28A66A] font-semibold tabular-nums">
                              ₹{rate}/{cat.unit}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                <Card padding="md" className="space-y-4">
                  <h2 className="font-display font-bold text-lg text-[#174B37]">
                    2. Subcategory, Quantity & Photos
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Select
                      label="Subcategory / Grade"
                      value={selectedSubId}
                      onChange={(e) => setSelectedSubId(e.target.value)}
                    >
                      {matchingSubs.length > 0 ? (
                        matchingSubs.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))
                      ) : (
                        <option value="standard">Standard Sorted Grade</option>
                      )}
                    </Select>
                    <Input
                      label="Estimated Quantity (kg or pieces)"
                      type="number"
                      min={1}
                      value={estQty}
                      onChange={(e) => setEstQty(Math.max(1, Number(e.target.value)))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7F9F6] border border-[#202820]/10">
                    <span className="text-xs text-[#202820]/70">
                      Indicative Rate:{' '}
                      <strong className="font-mono text-[#174B37]">
                        ₹{getApplicableRate(selectedCatId, 'b2c', activeAddress?.city)}
                      </strong>
                    </span>
                    <Button size="sm" onClick={handleAddToCart}>
                      <Plus className="w-4 h-4" />
                      Add to Pickup List
                    </Button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#202820]/80 mb-1.5">
                      Upload Scrap Photographs (optional, max 3)
                    </label>
                    <label className="flex items-center justify-center gap-2 p-4 border border-dashed border-[#174B37]/30 rounded-xl bg-[#F7F9F6] hover:bg-[#174B37]/5 cursor-pointer text-xs font-medium text-[#174B37]">
                      <Upload className="w-4 h-4" />
                      <span>Choose photos from device</span>
                      <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    {uploadedPhotos.length > 0 && (
                      <div className="flex items-center gap-3 mt-3">
                        {uploadedPhotos.map((src, i) => (
                          <img key={i} src={src} alt={`Scrap upload ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-[#202820]/10" />
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-5">
                <Card padding="lg" className="sticky top-20 space-y-4">
                  <h3 className="font-display font-bold text-lg text-[#174B37]">Pickup Estimate Summary</h3>
                  {cartSummary.items.length === 0 ? (
                    <p className="text-xs text-[#202820]/60 py-4">
                      Add one or more scrap categories on the left to build your pickup request.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {cartSummary.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-xs p-2.5 rounded-xl bg-[#F7F9F6]">
                          <div className="min-w-0">
                            <p className="font-semibold text-[#174B37] truncate">{item.catName}</p>
                            <p className="text-[#202820]/60 truncate">
                              {item.estimatedQty} {item.unit} × ₹{item.rate}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-bold text-[#174B37] tabular-nums">
                              ₹{item.estAmount.toLocaleString('en-IN')}
                            </span>
                            <button
                              type="button"
                              onClick={() => setCartItems((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-[#202820]/45 hover:text-[#DC2626] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#202820]/10 flex items-center justify-between">
                    <span className="text-sm font-medium text-[#202820]/75">Estimated Value</span>
                    <span className="font-display text-2xl font-bold text-[#174B37] tabular-nums">
                      ₹{cartSummary.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-[#202820]/60">
                    Final payment depends on physical calibrated weighing and material quality inspection at your doorstep.
                  </p>
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={cartSummary.items.length === 0}
                    onClick={() => setTab('schedule')}
                  >
                    Proceed to Schedule Pickup
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {/* SCRAP RATES */}
          {tab === 'rates' && (
            <Card padding="md">
              <h2 className="font-display font-bold text-lg text-[#174B37] mb-1">
                Today’s Admin-Published B2C Scrap Rates ({activeAddress?.city || 'Bengaluru'})
              </h2>
              <p className="text-xs text-[#202820]/60 mb-4">
                These rates are automatically applied during doorstep weighing. Executives cannot alter published prices.
              </p>
              <DataTable
                data={activeCategories}
                searchFilter={(row, q) => row.name.toLowerCase().includes(q)}
                searchPlaceholder="Filter material..."
                pageSize={12}
                columns={[
                  { key: 'name', header: 'Material Category', render: (r) => <span className="font-semibold text-[#174B37]">{r.name}</span> },
                  { key: 'desc', header: 'Acceptable Quality', render: (r) => <span className="text-xs text-[#202820]/70">{r.description}</span> },
                  { key: 'unit', header: 'Unit', render: (r) => <span className="text-xs uppercase">{r.unit}</span> },
                  {
                    key: 'rate',
                    header: 'Published Rate',
                    align: 'right',
                    render: (r) => (
                      <span className="font-mono font-bold text-[#28A66A]">
                        ₹{getApplicableRate(r.id, 'b2c', activeAddress?.city)}/{r.unit}
                      </span>
                    ),
                  },
                ]}
              />
            </Card>
          )}

          {/* SCHEDULE PICKUP */}
          {tab === 'schedule' && (
            <form onSubmit={handleConfirmBooking} className="grid lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-5">
                <Card padding="md" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-bold text-lg text-[#174B37]">1. Pickup Address & PIN Verification</h2>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowAddAddress(true)}>
                      <Plus className="w-4 h-4" />
                      Add New Address
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    {myAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`block p-4 rounded-xl border cursor-pointer transition-colors ${
                          activeAddress?.id === addr.id
                            ? 'border-[#174B37] bg-[#F7F9F6]'
                            : 'border-[#202820]/12 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="pickupAddress"
                            checked={activeAddress?.id === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 text-[#174B37]"
                          />
                          <div className="flex-1 text-sm">
                            <p className="font-semibold text-[#174B37]">{addr.label}</p>
                            <p className="text-xs text-[#202820]/70 mt-0.5">
                              {addr.line1}, {addr.city} — {addr.pinCode}
                            </p>
                            {addr.lat && addr.lng && (
                              <p className="text-[11px] font-mono text-[#28A66A] mt-1">
                                GPS: {addr.lat}, {addr.lng}
                              </p>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {activeAddress && (
                    <div className="p-3 rounded-xl bg-[#F7F9F6] border border-[#202820]/10 flex items-center gap-2 text-xs">
                      <MapPin className="w-4 h-4 text-[#28A66A]" />
                      {pinStatus.serviceable ? (
                        <span className="text-[#174B37] font-medium">
                          PIN {activeAddress.pinCode} serviceable ({pinStatus.zone?.name})
                        </span>
                      ) : (
                        <span className="text-[#D97706]">
                          PIN {activeAddress.pinCode} assigned to nearest metro corridor
                        </span>
                      )}
                    </div>
                  )}
                </Card>

                <Card padding="md" className="space-y-4">
                  <h2 className="font-display font-bold text-lg text-[#174B37]">2. Date, Slot & Instructions</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Preferred Pickup Date"
                      type="date"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                    <Select label="Available Time Slot" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                      {(pinStatus.zone?.dailySlots || ['09:00 AM - 11:30 AM', '12:00 PM - 02:30 PM', '03:00 PM - 05:30 PM']).map(
                        (slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        )
                      )}
                    </Select>
                  </div>
                  <Input
                    label="Promotional Coupon (Optional)"
                    placeholder="e.g. GREEN10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <Textarea
                    label="Pickup Instructions for Executive"
                    rows={3}
                    placeholder="Gate code, floor number, elevator availability..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </Card>
              </div>

              <div className="lg:col-span-5">
                <Card padding="lg" className="space-y-4">
                  <h3 className="font-display font-bold text-lg text-[#174B37]">Confirm Booking</h3>
                  <div className="text-xs space-y-2 text-[#202820]/75">
                    <p>
                      <strong>Items:</strong>{' '}
                      {cartSummary.items.length > 0
                        ? cartSummary.items.map((i) => `${i.catName} (${i.estimatedQty} ${i.unit})`).join(', ')
                        : `${activeCategories.find((c) => c.id === selectedCatId)?.name} (${estQty} kg)`}
                    </p>
                    <p>
                      <strong>Date & Slot:</strong> {scheduledDate} · {timeSlot}
                    </p>
                    <p>
                      <strong>Estimated Payout:</strong>{' '}
                      <span className="font-mono font-bold text-[#174B37]">
                        ₹
                        {(cartSummary.items.length > 0
                          ? cartSummary.totalAmount
                          : Math.round(estQty * getApplicableRate(selectedCatId, 'b2c', activeAddress?.city))
                        ).toLocaleString('en-IN')}
                      </span>
                    </p>
                  </div>
                  <Button type="submit" size="lg" className="w-full">
                    Confirm Doorstep Pickup
                  </Button>
                </Card>
              </div>
            </form>
          )}

          {/* MY ORDERS */}
          {tab === 'orders' && (
            <Card padding="md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg text-[#174B37]">My Pickup Orders</h2>
                <Button size="sm" onClick={() => setTab('sell')}>
                  + New Pickup
                </Button>
              </div>
              <DataTable
                data={myOrders}
                searchFilter={(o, q) =>
                  o.orderNumber.toLowerCase().includes(q) ||
                  o.items.some((i) => i.categoryName.toLowerCase().includes(q))
                }
                searchPlaceholder="Search by order # or material..."
                columns={[
                  {
                    key: 'num',
                    header: 'Order #',
                    render: (o) => (
                      <div>
                        <span className="font-mono font-semibold text-[#174B37]">{o.orderNumber}</span>
                        <span className="block text-[11px] font-mono text-[#202820]/55">OTP: {o.pickupOtp}</span>
                      </div>
                    ),
                  },
                  {
                    key: 'date',
                    header: 'Schedule',
                    render: (o) => (
                      <span className="text-xs">
                        {o.scheduledDate} · {o.timeSlot}
                      </span>
                    ),
                  },
                  {
                    key: 'items',
                    header: 'Materials',
                    render: (o) => (
                      <span className="text-xs text-[#202820]/75">
                        {o.items.map((i) => `${i.categoryName} (${i.actualQty ?? i.estimatedQty} ${i.unit})`).join(', ')}
                      </span>
                    ),
                  },
                  { key: 'status', header: 'Status', render: (o) => <StatusIndicator status={o.status} /> },
                  {
                    key: 'amount',
                    header: 'Amount',
                    align: 'right',
                    render: (o) => (
                      <span className="font-mono font-semibold">
                        ₹{(o.finalAmount ?? o.estimatedTotalAmount).toLocaleString('en-IN')}
                      </span>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    align: 'right',
                    render: (o) => (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTrackedOrderId(o.id);
                            setTab('track');
                          }}
                        >
                          Track
                        </Button>
                        {['booking_created', 'confirmed'].includes(o.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => cancelOrder(o.id, 'Cancelled by customer')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          )}

          {/* TRACK PICKUP */}
          {tab === 'track' && (
            <div className="space-y-5">
              {!trackedOrder ? (
                <EmptyState
                  title="No Orders to Track"
                  description="Once you book a doorstep scrap pickup, its 8-stage live progress will appear here."
                  actionLabel="Sell Scrap Now"
                  onAction={() => setTab('sell')}
                />
              ) : (
                <>
                  <Card padding="md" className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-[#202820]/60">Live Order Tracking</p>
                        <h2 className="font-display text-xl font-bold text-[#174B37]">
                          {trackedOrder.orderNumber}
                        </h2>
                      </div>
                      <Select
                        value={trackedOrder.id}
                        onChange={(e) => setTrackedOrderId(e.target.value)}
                        className="sm:w-64"
                      >
                        {myOrders.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.orderNumber} ({o.scheduledDate})
                          </option>
                        ))}
                      </Select>
                    </div>

                    <OrderTracker currentStatus={trackedOrder.status} />

                    <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-[#202820]/10 text-xs">
                      <div>
                        <span className="text-[#202820]/55 block">Assigned Pickup Executive</span>
                        <span className="font-semibold text-[#174B37]">
                          {trackedOrder.assignedExecutiveName || 'Assigning nearest EV executive'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#202820]/55 block">Customer Verification OTP</span>
                        <span className="font-mono text-base font-bold text-[#174B37]">
                          {trackedOrder.pickupOtp}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#202820]/55 block">
                          {trackedOrder.finalAmount ? 'Final Verified Payout' : 'Estimated Value'}
                        </span>
                        <span className="font-mono text-base font-bold text-[#28A66A]">
                          ₹{(trackedOrder.finalAmount ?? trackedOrder.estimatedTotalAmount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card padding="md">
                    <h3 className="font-display font-bold text-base text-[#174B37] mb-3">Activity Timeline</h3>
                    <div className="space-y-3">
                      {trackedOrder.timeline.map((ev, i) => (
                        <div key={i} className="flex items-start justify-between gap-4 text-xs pb-2.5 border-b border-[#202820]/8 last:border-0">
                          <div>
                            <p className="font-semibold text-[#202820]">{ev.label}</p>
                            <p className="text-[#202820]/55">Actor: {ev.actor}</p>
                          </div>
                          <span className="font-mono text-[#202820]/55 whitespace-nowrap">
                            {new Date(ev.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* WALLET */}
          {tab === 'wallet' && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card padding="lg" className="bg-[#174B37] text-white space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A5D66D] font-semibold">Punarchakra Wallet Balance</span>
                  <Wallet className="w-5 h-5 text-[#A5D66D]" />
                </div>
                <p className="font-display text-4xl font-bold tabular-nums">
                  ₹{(customerProfile?.walletBalance || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-white/75">
                  Instant withdrawals to UPI ({customerProfile?.upiId || 'not configured'}) or redeem loyalty points directly into wallet cash.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => redeemRewardsToWallet(currentUser.id, 100)}
                >
                  Convert 100 Loyalty Points → ₹50 Wallet
                </Button>
              </Card>

              <Card padding="lg" className="space-y-4">
                <h3 className="font-display font-bold text-lg text-[#174B37]">Payout Preferences</h3>
                <Select
                  label="Preferred Payout Channel"
                  value={prefMethod}
                  onChange={(e) => setPrefMethod(e.target.value as PaymentMethod)}
                >
                  <option value="UPI">Instant UPI</option>
                  <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                  <option value="Punarchakra Wallet">Punarchakra Wallet</option>
                </Select>
                <Input
                  label="UPI ID"
                  placeholder="yourname@okicici"
                  value={upiInput}
                  onChange={(e) => setUpiInput(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() =>
                    updateCustomerProfile(currentUser.id, {
                      preferredPaymentMethod: prefMethod,
                      upiId: upiInput,
                    })
                  }
                >
                  Save Payout Preference
                </Button>
              </Card>
            </div>
          )}

          {/* PAYMENT HISTORY */}
          {tab === 'payments' && (
            <Card padding="md">
              <h2 className="font-display font-bold text-lg text-[#174B37] mb-4">
                Payment History & Digital Receipts
              </h2>
              <DataTable
                data={myPayments}
                searchFilter={(p, q) =>
                  p.receiptNumber.toLowerCase().includes(q) || p.orderNumber.toLowerCase().includes(q)
                }
                columns={[
                  { key: 'rcp', header: 'Receipt #', render: (p) => <span className="font-mono font-semibold text-[#174B37]">{p.receiptNumber}</span> },
                  { key: 'ord', header: 'Order #', render: (p) => <span className="font-mono text-xs">{p.orderNumber}</span> },
                  { key: 'method', header: 'Method', render: (p) => <span className="text-xs">{p.method}</span> },
                  { key: 'status', header: 'Status', render: (p) => <StatusIndicator status={p.status} /> },
                  {
                    key: 'amount',
                    header: 'Amount',
                    align: 'right',
                    render: (p) => <span className="font-mono font-bold text-[#174B37]">₹{p.amount.toLocaleString('en-IN')}</span>,
                  },
                  {
                    key: 'dl',
                    header: 'Receipt',
                    align: 'right',
                    render: (p) => (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setReceiptModalData({
                            payment: p,
                            order: state.orders.find((o) => o.id === p.orderId),
                          })
                        }
                      >
                        Download Receipt
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>
          )}

          {/* REWARDS */}
          {tab === 'rewards' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card padding="lg" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#28A66A]">Loyalty Points</span>
                    <Coins className="w-5 h-5 text-[#28A66A]" />
                  </div>
                  <p className="font-display text-4xl font-bold text-[#174B37] tabular-nums">
                    {customerProfile?.loyaltyPoints || 0} pts
                  </p>
                  <p className="text-xs text-[#202820]/65">
                    Earn 5 points per kg recycled. Redeem 100 pts for ₹50 direct wallet credit.
                  </p>
                  <Button size="sm" onClick={() => redeemRewardsToWallet(currentUser.id, 100)}>
                    Redeem 100 Points
                  </Button>
                </Card>

                <Card padding="lg" className="space-y-3">
                  <span className="text-xs font-semibold text-[#28A66A]">Referral Program</span>
                  <h3 className="font-display text-xl font-bold text-[#174B37]">
                    Invite Neighbors & Earn 100 Bonus Points
                  </h3>
                  <div className="p-3 rounded-xl bg-[#F7F9F6] border border-[#202820]/10 flex items-center justify-between">
                    <span className="font-mono font-bold text-base text-[#174B37]">
                      {customerProfile?.referralCode || 'PUNAR50'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard?.writeText(customerProfile?.referralCode || 'PUNAR50');
                        notify('success', 'Referral code copied');
                      }}
                    >
                      Copy Code
                    </Button>
                  </div>
                </Card>
              </div>

              <Card padding="md">
                <h3 className="font-display font-bold text-base text-[#174B37] mb-3">Promotional Offers</h3>
                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  {state.coupons
                    .filter((c) => c.isActive)
                    .map((cpn) => (
                      <div key={cpn.id} className="p-4 rounded-xl bg-[#F7F9F6] border border-[#202820]/10 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-mono font-bold text-sm text-[#174B37]">{cpn.code}</p>
                          <p className="text-xs text-[#202820]/70">{cpn.title}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCouponCode(cpn.code);
                            setTab('schedule');
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    ))}
                </div>
                <h3 className="font-display font-bold text-base text-[#174B37] mb-3">Reward History</h3>
                <div className="divide-y divide-[#202820]/8">
                  {myRewards.map((rw) => (
                    <div key={rw.id} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="text-[#202820]/80">{rw.description}</span>
                      <span className={`font-mono font-bold ${rw.points >= 0 ? 'text-[#28A66A]' : 'text-[#DC2626]'}`}>
                        {rw.points >= 0 ? `+${rw.points}` : rw.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ENVIRONMENTAL IMPACT */}
          {tab === 'impact' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Total Waste Diverted</span>
                  <p className="font-display text-3xl font-bold text-[#174B37] mt-1 tabular-nums">{totalScrapKg} kg</p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">CO₂ Emissions Avoided</span>
                  <p className="font-display text-3xl font-bold text-[#28A66A] mt-1 tabular-nums">{totalCo2Avoided} kg</p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Trees Equivalent</span>
                  <p className="font-display text-3xl font-bold text-[#174B37] mt-1 tabular-nums">
                    {Math.max(1, Math.round(totalCo2Avoided / 21))} Trees
                  </p>
                </Card>
              </div>
              <Card padding="md">
                <h3 className="font-display font-bold text-base text-[#174B37] mb-4">
                  Your Verified Recycling Contribution by Material
                </h3>
                <DonutBreakdownChart segments={categoryBreakdown} centerLabel="Recycled" centerValue={`${totalScrapKg} kg`} />
              </Card>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {tab === 'notifications' && (
            <div className="space-y-4">
              <PushAlertsCard portalLabel="B2C Customer" />
              <Card padding="md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-lg text-[#174B37]">Notifications</h2>
                  <Button size="sm" variant="outline" onClick={() => markAllNotificationsRead(currentUser.id)}>
                    Mark All Read
                  </Button>
                </div>
              {myNotifications.length === 0 ? (
                <EmptyState title="All Caught Up" description="Booking confirmations, executive arrival updates, and payment alerts will appear here." />
              ) : (
                <div className="divide-y divide-[#202820]/10">
                  {myNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`py-3.5 px-3 rounded-xl flex items-start justify-between gap-4 cursor-pointer ${
                        n.isRead ? 'bg-white' : 'bg-[#F7F9F6]'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#174B37]">{n.title}</p>
                        <p className="text-xs text-[#202820]/70 mt-0.5">{n.message}</p>
                      </div>
                      <span className="text-[11px] font-mono text-[#202820]/50 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            </div>
          )}

          {/* PROFILE */}
          {tab === 'profile' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card padding="md" className="space-y-3">
                <h2 className="font-display font-bold text-lg text-[#174B37]">My Account</h2>
                <div className="text-sm space-y-2">
                  <p><strong>Name:</strong> {currentUser.name}</p>
                  <p><strong>Email:</strong> {currentUser.email}</p>
                  <p><strong>Mobile:</strong> {currentUser.mobile}</p>
                  <p><strong>Customer ID:</strong> <span className="font-mono">{currentUser.id}</span></p>
                </div>
              </Card>
              <Card padding="md" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-lg text-[#174B37]">Saved Addresses</h2>
                  <Button size="sm" variant="outline" onClick={() => setShowAddAddress(true)}>
                    + Add Address
                  </Button>
                </div>
                {myAddresses.map((a) => (
                  <div key={a.id} className="p-3 rounded-xl bg-[#F7F9F6] text-xs">
                    <p className="font-semibold text-[#174B37]">{a.label}</p>
                    <p className="text-[#202820]/70">{a.line1}, {a.city} — {a.pinCode}</p>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* SUPPORT */}
          {tab === 'support' && (
            <div className="grid lg:grid-cols-12 gap-6">
              <Card padding="md" className="lg:col-span-5 space-y-4">
                <h2 className="font-display font-bold text-lg text-[#174B37]">Raise a Support Ticket</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createSupportTicket({
                      userId: currentUser.id,
                      userName: currentUser.name,
                      userRole: 'b2c',
                      subject: ticketForm.subject,
                      category: ticketForm.category,
                      message: ticketForm.message,
                    });
                    setTicketForm({ subject: '', category: 'Pickup Delay', message: '' });
                  }}
                  className="space-y-3"
                >
                  <Input
                    label="Subject"
                    required
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm((f) => ({ ...f, subject: e.target.value }))}
                  />
                  <Select
                    label="Category"
                    value={ticketForm.category}
                    onChange={(e) =>
                      setTicketForm((f) => ({ ...f, category: e.target.value as typeof ticketForm.category }))
                    }
                  >
                    <option value="Pickup Delay">Pickup Delay</option>
                    <option value="Payment / Payout">Payment / Payout</option>
                    <option value="Weighing Dispute">Weighing Dispute</option>
                    <option value="Technical">Technical</option>
                  </Select>
                  <Textarea
                    label="Message"
                    rows={3}
                    required
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm((f) => ({ ...f, message: e.target.value }))}
                  />
                  <Button type="submit" className="w-full">
                    Submit Ticket
                  </Button>
                </form>
              </Card>
              <Card padding="md" className="lg:col-span-7">
                <h3 className="font-display font-bold text-base text-[#174B37] mb-3">My Support Tickets</h3>
                {myTickets.length === 0 ? (
                  <EmptyState title="No Support Tickets" description="Need help with a pickup or payout? Submit a ticket on the left." />
                ) : (
                  <div className="space-y-3">
                    {myTickets.map((t) => (
                      <div key={t.id} className="p-4 rounded-xl bg-[#F7F9F6] border border-[#202820]/10 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#174B37]">{t.ticketNumber}</span>
                          <StatusIndicator status={t.status} />
                        </div>
                        <p className="font-semibold text-sm text-[#202820]">{t.subject}</p>
                        <p className="text-xs text-[#202820]/70">{t.message}</p>
                        {t.adminReply && (
                          <p className="text-xs text-[#174B37] pt-1 font-medium">Admin Reply: {t.adminReply}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (Thumb Zone, <=15% height) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-[#202820]/10 grid grid-cols-4 items-center">
        {[
          { id: 'dashboard' as B2CTab, label: 'Home', Icon: Home },
          { id: 'sell' as B2CTab, label: 'Sell', Icon: Package },
          { id: 'track' as B2CTab, label: 'Track', Icon: Truck },
          { id: 'wallet' as B2CTab, label: 'Wallet', Icon: Wallet },
        ].map((item) => {
          const Icon = item.Icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center justify-center h-full ${
                active ? 'text-[#174B37] font-semibold' : 'text-[#202820]/55'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Add Address Modal */}
      <Modal open={showAddAddress} onClose={() => setShowAddAddress(false)} title="Add Pickup Address">
        <form onSubmit={handleSaveNewAddress} className="space-y-3">
          <Input
            label="Address Label"
            required
            placeholder="Home / Villa / Office"
            value={newAddrForm.label}
            onChange={(e) => setNewAddrForm((f) => ({ ...f, label: e.target.value }))}
          />
          <Input
            label="Street Address & Flat/House No. (North Bengaluru)"
            placeholder="e.g. Sahakara Nagar, Hebbal, Yelahanka, Jakkur"
            required
            value={newAddrForm.line1}
            onChange={(e) => setNewAddrForm((f) => ({ ...f, line1: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City (North Bengaluru B2C)"
              value="Bengaluru"
              readOnly
            />
            <Input
              label="North Bengaluru PIN Code"
              placeholder="560092 / 560024 / 560064"
              required
              maxLength={6}
              value={newAddrForm.pinCode}
              onChange={(e) => setNewAddrForm((f) => ({ ...f, pinCode: e.target.value.replace(/\D/g, '') }))}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F9F6]">
            <span className="text-xs text-[#202820]/70">
              {newAddrForm.lat ? `GPS: ${newAddrForm.lat}, ${newAddrForm.lng}` : 'Optional: Attach GPS coordinates'}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={handleCaptureGps}>
              <Navigation className="w-3.5 h-3.5" />
              Use GPS
            </Button>
          </div>
          <Button type="submit" className="w-full">
            Save Address
          </Button>
        </form>
      </Modal>

      <ReceiptModal
        open={receiptModalData !== null}
        onClose={() => setReceiptModalData(null)}
        payment={receiptModalData?.payment || null}
        order={receiptModalData?.order}
      />
    </div>
  );
};
