import React, { useMemo, useState } from 'react';
import {
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Lock,
  LogOut,
  MapPin,
  Menu,
  Navigation,
  Phone,
  Scale,
  Truck,
  Upload,
  User as UserIcon,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { usePunarchakra } from '../context/PunarchakraContext';
import { Payment, PaymentMethod, PickupOrder } from '../types/punarchakra';
import { DataTable } from '../components/ui/DataTable';
import {
  AppLogo,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  StatusIndicator,
  Textarea,
} from '../components/ui/Primitives';
import { PortalFooter, PortalSwitcherDropdown } from '../components/ui/PortalSwitcherDropdown';
import { PushAlertsCard } from '../components/ui/PushAlertsCard';
import { ReceiptModal } from '../components/ui/ReceiptModal';
import {
  BengaluruRouteMap,
  PUNARCHAKRA_HQ,
  resolveOrderCoordinates,
} from '../components/maps/BengaluruServiceMap';

type ExecTab =
  | 'assigned'
  | 'calendar'
  | 'customers'
  | 'navigation'
  | 'collections'
  | 'payments'
  | 'performance'
  | 'notifications'
  | 'profile';

interface OfflineQueueEntry {
  orderId: string;
  orderNumber: string;
  actualItems: { itemId: string; actualQty: number }[];
  weighingPhotos: string[];
  enteredOtp: string;
  paymentMethod: PaymentMethod;
  notes: string;
  savedAt: string;
}

export const ExecutivePortal: React.FC = () => {
  const {
    state,
    currentUser,
    navigateTo,
    logout,
    notify,
    respondAssignment,
    advanceExecutiveOrderStatus,
    updateExecutiveShiftGps,
    completePickupWithWeighing,
    markAllNotificationsRead,
  } = usePunarchakra();

  const [tab, setTab] = useState<ExecTab>('assigned');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active job workflow state
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [rejectOrder, setRejectOrder] = useState<PickupOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Weighing form state
  const [actualQuantities, setActualQuantities] = useState<Record<string, number>>({});
  const [weighPhotos, setWeighPhotos] = useState<string[]>([]);
  const [otpInput, setOtpInput] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('UPI');
  const [weighNotes, setWeighNotes] = useState('');

  // Offline support queue
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueEntry[]>([]);

  // Receipt preview
  const [receiptModal, setReceiptModal] = useState<{ payment: Payment; order?: PickupOrder } | null>(null);

  if (!currentUser) return null;

  const execProfile = state.executiveProfiles.find((ep) => ep.userId === currentUser.id);
  const execZone = state.serviceZones.find((z) => z.id === execProfile?.assignedZoneId);

  const myOrders = useMemo(
    () =>
      state.orders
        .filter((o) => o.assignedExecutiveId === currentUser.id)
        .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()),
    [state.orders, currentUser.id]
  );

  const pendingJobs = myOrders.filter((o) =>
    ['executive_assigned', 'on_the_way', 'reached_location', 'scrap_collected', 'weight_verified'].includes(o.status)
  );
  const completedJobs = myOrders.filter((o) => o.status === 'payment_completed');
  const cancelledJobs = myOrders.filter((o) => o.status === 'cancelled');

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysJobs = myOrders.filter((o) => o.scheduledDate === todayStr || pendingJobs.some((p) => p.id === o.id));
  const totalWeightCollected = Math.round(
    completedJobs.reduce((s, o) => s + (o.actualTotalWeight || 0), 0) * 10
  ) / 10;
  const totalCollectionValue = completedJobs.reduce((s, o) => s + (o.finalAmount || 0), 0);

  const myWeighings = useMemo(
    () => state.weighingRecords.filter((w) => w.executiveId === currentUser.id),
    [state.weighingRecords, currentUser.id]
  );
  const myPayments = useMemo(
    () => state.payments.filter((p) => completedJobs.some((o) => o.id === p.orderId)),
    [state.payments, completedJobs]
  );
  const myNotifications = useMemo(
    () => state.notifications.filter((n) => n.userId === currentUser.id),
    [state.notifications, currentUser.id]
  );

  const activeJob = myOrders.find((o) => o.id === activeJobId) || pendingJobs[0] || null;
  const activeAssignment = activeJob
    ? state.assignments.find((a) => a.orderId === activeJob.id && a.executiveUserId === currentUser.id)
    : null;

  const openJobWeighing = (order: PickupOrder) => {
    setActiveJobId(order.id);
    const map: Record<string, number> = {};
    order.items.forEach((it) => {
      map[it.id] = it.actualQty ?? it.estimatedQty;
    });
    setActualQuantities(map);
    setWeighPhotos([]);
    setOtpInput('');
    setWeighNotes('');
  };

  const handleWeighPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files)
      .slice(0, 3)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') setWeighPhotos((p) => [...p.slice(0, 2), reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
  };

  const handleToggleActiveGps = () => {
    if (!navigator.geolocation) {
      updateExecutiveShiftGps(currentUser.id, 12.9352, 77.6245, 'on_pickup');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateExecutiveShiftGps(
          currentUser.id,
          Math.round(pos.coords.latitude * 10000) / 10000,
          Math.round(pos.coords.longitude * 10000) / 10000,
          'on_pickup'
        );
      },
      () => {
        updateExecutiveShiftGps(currentUser.id, 12.9352, 77.6245, 'on_pickup');
      }
    );
  };

  const handleCompleteJob = (order: PickupOrder) => {
    const actualItems = order.items.map((it) => ({
      itemId: it.id,
      actualQty: actualQuantities[it.id] ?? it.estimatedQty,
    }));

    if (isOfflineMode) {
      if (otpInput.trim() !== order.pickupOtp) {
        notify('error', `Invalid Customer OTP. Verify code ${order.pickupOtp} with customer.`);
        return;
      }
      setOfflineQueue((prev) => [
        ...prev,
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          actualItems,
          weighingPhotos: weighPhotos,
          enteredOtp: otpInput,
          paymentMethod: payMethod,
          notes: weighNotes,
          savedAt: new Date().toISOString(),
        },
      ]);
      notify('info', `Saved ${order.orderNumber} to Offline Queue`, 'Will sync safely once connection resumes.');
      return;
    }

    const res = completePickupWithWeighing({
      orderId: order.id,
      executiveUserId: currentUser.id,
      actualItems,
      weighingPhotos: weighPhotos,
      enteredOtp: otpInput,
      paymentMethod: payMethod,
      notes: weighNotes,
    });
    if (!res.ok) {
      notify('error', res.error || 'Could not complete pickup');
      return;
    }
    if (res.payment) {
      setReceiptModal({ payment: res.payment, order: state.orders.find((o) => o.id === order.id) });
    }
    setActiveJobId(null);
  };

  const handleSyncOfflineQueue = () => {
    if (offlineQueue.length === 0) return;
    let syncedCount = 0;
    offlineQueue.forEach((entry) => {
      const res = completePickupWithWeighing({
        orderId: entry.orderId,
        executiveUserId: currentUser.id,
        actualItems: entry.actualItems,
        weighingPhotos: entry.weighingPhotos,
        enteredOtp: entry.enteredOtp,
        paymentMethod: entry.paymentMethod,
        notes: entry.notes,
      });
      if (res.ok) syncedCount++;
    });
    setOfflineQueue([]);
    setIsOfflineMode(false);
    notify('success', `Synced ${syncedCount} offline pickup record(s) to central database`);
  };

  const NAV_ITEMS: { id: ExecTab; label: string; Icon: React.ElementType }[] = [
    { id: 'assigned', label: 'Assigned Pickups', Icon: Truck },
    { id: 'calendar', label: 'Pickup Calendar', Icon: Calendar },
    { id: 'customers', label: 'Customer Details', Icon: UserIcon },
    { id: 'navigation', label: 'Navigation', Icon: Navigation },
    { id: 'collections', label: 'Collection Records', Icon: ClipboardCheck },
    { id: 'payments', label: 'Payment Records', Icon: CreditCard },
    { id: 'performance', label: 'Performance', Icon: Award },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
    { id: 'profile', label: 'My Profile', Icon: UserIcon },
  ];

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
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  active ? 'bg-[#174B37] text-white' : 'text-[#202820]/75 hover:bg-[#F7F9F6]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
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

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 lg:h-16 bg-white/95 backdrop-blur-md border-b border-[#202820]/10 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#174B37]"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="font-display font-bold text-sm sm:text-base text-[#174B37] truncate">
                {currentUser.name} ({execProfile?.employeeId})
              </p>
              <p className="text-[11px] text-[#202820]/55 truncate">
                {execZone?.name} · {execProfile?.vehicleNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PortalSwitcherDropdown compact />
            <button
              type="button"
              onClick={() => setIsOfflineMode((v) => !v)}
              className={`min-h-[36px] px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border cursor-pointer ${
                isOfflineMode
                  ? 'bg-[#D97706]/10 border-[#D97706]/30 text-[#D97706]'
                  : 'bg-[#F7F9F6] border-[#202820]/12 text-[#174B37]'
              }`}
            >
              {isOfflineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-[#28A66A]" />}
              <span className="hidden sm:inline">{isOfflineMode ? 'Offline Queue Mode' : 'Online Sync'}</span>
            </button>
            <Button size="sm" variant="outline" onClick={() => navigateTo('public')}>
              Site
            </Button>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-black/50 flex">
            <div className="w-72 bg-white h-full flex flex-col">
              <div className="h-14 px-4 flex items-center justify-between border-b border-[#202820]/10">
                <AppLogo />
                <button type="button" onClick={() => setMobileMenuOpen(false)}>
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
                        setMobileMenuOpen(false);
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

        <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-5">
          {/* Offline Queue Sync Banner */}
          {offlineQueue.length > 0 && (
            <Card padding="sm" className="bg-[#D97706]/8 border-[#D97706]/30 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[#D97706]">
                {offlineQueue.length} weighing record(s) stored safely in offline queue
              </span>
              <Button size="sm" onClick={handleSyncOfflineQueue}>
                Sync Queued Entries Now
              </Button>
            </Card>
          )}

          {/* Field Dashboard Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card padding="sm">
              <span className="text-[11px] text-[#202820]/60">Today’s Jobs</span>
              <p className="font-display text-xl font-bold text-[#174B37] tabular-nums">{todaysJobs.length}</p>
            </Card>
            <Card padding="sm">
              <span className="text-[11px] text-[#202820]/60">Pending</span>
              <p className="font-display text-xl font-bold text-[#D97706] tabular-nums">{pendingJobs.length}</p>
            </Card>
            <Card padding="sm">
              <span className="text-[11px] text-[#202820]/60">Completed</span>
              <p className="font-display text-xl font-bold text-[#28A66A] tabular-nums">{completedJobs.length}</p>
            </Card>
            <Card padding="sm">
              <span className="text-[11px] text-[#202820]/60">Cancelled</span>
              <p className="font-display text-xl font-bold text-[#DC2626] tabular-nums">{cancelledJobs.length}</p>
            </Card>
            <Card padding="sm">
              <span className="text-[11px] text-[#202820]/60">Weight Collected</span>
              <p className="font-display text-xl font-bold text-[#174B37] tabular-nums">{totalWeightCollected} kg</p>
            </Card>
            <Card padding="sm">
              <span className="text-[11px] text-[#202820]/60">Value Settled</span>
              <p className="font-display text-xl font-bold text-[#174B37] tabular-nums">
                ₹{totalCollectionValue.toLocaleString('en-IN')}
              </p>
            </Card>
          </div>

          {tab !== 'notifications' && <PushAlertsCard portalLabel="Pickup Executive" />}

          {/* ASSIGNED PICKUPS & ACTIVE 14-STEP WORKFLOW */}
          {tab === 'assigned' && (
            <div className="space-y-5">
              {pendingJobs.length === 0 ? (
                <EmptyState
                  title="No Pending Assignments"
                  description="All assigned pickups in your queue are completed. New dispatches from Admin will appear here immediately."
                />
              ) : (
                pendingJobs.map((order) => {
                  const isExpanded = activeJob?.id === order.id;
                  const assignment = state.assignments.find(
                    (a) => a.orderId === order.id && a.executiveUserId === currentUser.id
                  );
                  const isPendingAcceptance = assignment?.status === 'pending_acceptance';

                  // Live calculated payout using locked admin-published rates
                  const liveCalculatedAmount = order.items.reduce((sum, it) => {
                    const qty = actualQuantities[it.id] ?? it.estimatedQty;
                    return sum + Math.round(qty * it.appliedRate);
                  }, 0);

                  return (
                    <Card key={order.id} padding="md" className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-base text-[#174B37]">{order.orderNumber}</span>
                            <StatusIndicator status={order.status} />
                          </div>
                          <p className="font-semibold text-sm text-[#202820] mt-1">{order.customerName}</p>
                          <p className="text-xs text-[#202820]/70">{order.addressText} · PIN {order.pinCode}</p>
                          <p className="text-xs text-[#28A66A] font-medium mt-0.5">
                            Slot: {order.scheduledDate} · {order.timeSlot}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`tel:${order.customerMobile}`}
                            className="min-h-[40px] px-3.5 rounded-xl border border-[#202820]/15 bg-white text-xs font-semibold text-[#174B37] inline-flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {order.customerMobile}
                          </a>
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(order.addressText)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="min-h-[40px] px-3.5 rounded-xl bg-[#174B37]/8 text-xs font-semibold text-[#174B37] inline-flex items-center gap-1.5"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            Open Maps
                          </a>
                        </div>
                      </div>

                      {/* Accept / Reject Step */}
                      {isPendingAcceptance ? (
                        <div className="p-4 rounded-xl bg-[#F7F9F6] border border-[#202820]/10 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-[#174B37]">
                            New assignment awaiting your confirmation
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                respondAssignment(order.id, currentUser.id, true);
                                openJobWeighing(order);
                              }}
                            >
                              Accept Assignment
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => setRejectOrder(order)}>
                              Reject with Reason
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Journey Action Stepper */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#202820]/8">
                            <Button
                              size="sm"
                              variant={order.status === 'executive_assigned' ? 'primary' : 'outline'}
                              disabled={order.status !== 'executive_assigned'}
                              onClick={() => {
                                handleToggleActiveGps();
                                advanceExecutiveOrderStatus(order.id, 'on_the_way');
                              }}
                            >
                              Start Journey
                            </Button>
                            <Button
                              size="sm"
                              variant={order.status === 'on_the_way' ? 'primary' : 'outline'}
                              disabled={order.status !== 'on_the_way'}
                              onClick={() => advanceExecutiveOrderStatus(order.id, 'reached_location')}
                            >
                              Mark Arrival
                            </Button>
                            <Button
                              size="sm"
                              variant={order.status === 'reached_location' ? 'primary' : 'outline'}
                              disabled={order.status !== 'reached_location'}
                              onClick={() => {
                                advanceExecutiveOrderStatus(order.id, 'scrap_collected');
                                openJobWeighing(order);
                              }}
                            >
                              Inspect & Weigh Scrap
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => (isExpanded ? setActiveJobId(null) : openJobWeighing(order))}
                            >
                              <Scale className="w-4 h-4" />
                              {isExpanded ? 'Hide Weighing Sheet' : 'Open Weighing & OTP'}
                            </Button>
                          </div>

                          {/* Weighing & OTP Verification Form */}
                          {isExpanded && (
                            <div className="p-4 rounded-xl bg-[#F7F9F6] border border-[#174B37]/20 space-y-4">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-display font-bold text-sm text-[#174B37]">
                                  Calibrated Weighing Entry (Rates Locked by Admin)
                                </h4>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#202820]/65">
                                  <Lock className="w-3.5 h-3.5 text-[#174B37]" />
                                  Rates Non-Editable
                                </span>
                              </div>

                              <div className="space-y-2.5">
                                {order.items.map((item) => {
                                  const qty = actualQuantities[item.id] ?? item.estimatedQty;
                                  return (
                                    <div
                                      key={item.id}
                                      className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-xl border border-[#202820]/10"
                                    >
                                      <div className="col-span-5">
                                        <p className="text-xs font-bold text-[#174B37]">{item.categoryName}</p>
                                        <p className="text-[11px] text-[#202820]/60">
                                          Est: {item.estimatedQty} {item.unit} · Rate: ₹{item.appliedRate}/{item.unit}
                                        </p>
                                      </div>
                                      <div className="col-span-4">
                                        <Input
                                          type="number"
                                          step="0.1"
                                          min={0}
                                          value={qty}
                                          onChange={(e) =>
                                            setActualQuantities((prev) => ({
                                              ...prev,
                                              [item.id]: Math.max(0, Number(e.target.value)),
                                            }))
                                          }
                                        />
                                      </div>
                                      <div className="col-span-3 text-right font-mono text-sm font-bold text-[#174B37]">
                                        ₹{Math.round(qty * item.appliedRate).toLocaleString('en-IN')}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-[#202820]/80 mb-1.5">
                                    Upload Weighing Scale Photo
                                  </label>
                                  <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-[#174B37]/30 rounded-xl bg-white cursor-pointer text-xs font-medium text-[#174B37]">
                                    <Upload className="w-4 h-4" />
                                    <span>Attach Scale Photo ({weighPhotos.length})</span>
                                    <input type="file" accept="image/*" onChange={handleWeighPhotoUpload} className="hidden" />
                                  </label>
                                </div>
                                <Select
                                  label="Customer Settlement Method"
                                  value={payMethod}
                                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                                >
                                  <option value="UPI">Instant UPI</option>
                                  <option value="Punarchakra Wallet">Punarchakra Wallet</option>
                                  <option value="Bank Transfer">Bank Transfer</option>
                                  <option value="RTGS / NEFT">RTGS / NEFT</option>
                                </Select>
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4 items-end">
                                <Input
                                  label={`Customer Confirmation OTP (Customer code: ${order.pickupOtp})`}
                                  placeholder="Enter 4-digit OTP"
                                  maxLength={4}
                                  value={otpInput}
                                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                />
                                <div className="p-3 rounded-xl bg-white border border-[#202820]/10 flex items-center justify-between">
                                  <span className="text-xs font-medium text-[#202820]/70">Final Payout</span>
                                  <span className="font-display text-xl font-bold text-[#174B37] tabular-nums">
                                    ₹{liveCalculatedAmount.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>

                              <Input
                                label="Field Weighing Notes (Optional)"
                                placeholder="e.g. Digital scale calibrated, clean sorted paper"
                                value={weighNotes}
                                onChange={(e) => setWeighNotes(e.target.value)}
                              />

                              <Button className="w-full" size="lg" onClick={() => handleCompleteJob(order)}>
                                <CheckCircle2 className="w-4 h-4" />
                                Complete Pickup & Generate Digital Receipt
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* PICKUP CALENDAR */}
          {tab === 'calendar' && (
            <Card padding="md">
              <h2 className="font-display font-bold text-lg text-[#174B37] mb-4">Scheduled Pickup Calendar</h2>
              <DataTable
                data={myOrders}
                columns={[
                  { key: 'd', header: 'Date & Slot', render: (o) => <span className="text-xs font-medium">{o.scheduledDate} · {o.timeSlot}</span> },
                  { key: 'n', header: 'Order #', render: (o) => <span className="font-mono font-semibold text-[#174B37]">{o.orderNumber}</span> },
                  { key: 'c', header: 'Customer', render: (o) => <span className="text-xs">{o.customerName}</span> },
                  { key: 's', header: 'Status', render: (o) => <StatusIndicator status={o.status} /> },
                ]}
              />
            </Card>
          )}

          {/* CUSTOMER DETAILS */}
          {tab === 'customers' && (
            <div className="grid md:grid-cols-2 gap-4">
              {myOrders.map((o) => (
                <Card key={o.id} padding="md" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#174B37]">{o.orderNumber}</span>
                    <StatusIndicator status={o.status} />
                  </div>
                  <p className="font-display font-bold text-base text-[#174B37]">{o.customerName}</p>
                  <p className="text-xs text-[#202820]/70">{o.addressText} ({o.pinCode})</p>
                  <p className="text-xs text-[#28A66A] font-medium">Mobile: {o.customerMobile}</p>
                  <p className="text-xs text-[#202820]/65">
                    Est. Materials: {o.items.map((i) => `${i.categoryName} (${i.estimatedQty} ${i.unit})`).join(', ')}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {/* NAVIGATION */}
          {tab === 'navigation' && (
            <Card padding="lg" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-lg text-[#174B37]">Active Shift GPS & Route Navigation</h2>
                  <p className="text-xs text-[#202820]/60">
                    GPS telemetry is active only during authorised pickup shifts.
                  </p>
                </div>
                <Button size="sm" onClick={handleToggleActiveGps}>
                  <MapPin className="w-4 h-4" />
                  Refresh Live Shift GPS
                </Button>
              </div>
              {execProfile?.activeShiftGps && (
                <div className="p-4 rounded-xl bg-[#F7F9F6] border border-[#202820]/10 text-xs font-mono">
                  Active Coordinates: {execProfile.activeShiftGps.lat}, {execProfile.activeShiftGps.lng} · Updated{' '}
                  {new Date(execProfile.activeShiftGps.updatedAt).toLocaleTimeString('en-IN')}
                </div>
              )}

              {pendingJobs.length > 0 && (
                <BengaluruRouteMap
                  origin={
                    execProfile?.activeShiftGps
                      ? { lat: execProfile.activeShiftGps.lat, lng: execProfile.activeShiftGps.lng }
                      : { lat: PUNARCHAKRA_HQ.lat, lng: PUNARCHAKRA_HQ.lng }
                  }
                  destination={resolveOrderCoordinates(
                    (activeJob || pendingJobs[0]).lat,
                    (activeJob || pendingJobs[0]).lng,
                    (activeJob || pendingJobs[0]).pinCode,
                    (activeJob || pendingJobs[0]).zoneId
                  )}
                  originLabel={execProfile?.activeShiftGps ? 'Your EV Shift GPS' : 'Punarchakra Hub'}
                  destinationLabel={`${(activeJob || pendingJobs[0]).orderNumber} · ${(activeJob || pendingJobs[0]).pinCode}`}
                  destinationAddress={(activeJob || pendingJobs[0]).addressText}
                  heightClass="h-[360px]"
                />
              )}

              <div className="space-y-3">
                {pendingJobs.map((o) => {
                  const isFocused = (activeJob?.id || pendingJobs[0]?.id) === o.id;
                  return (
                    <div
                      key={o.id}
                      className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                        isFocused ? 'border-[#174B37] bg-[#F7F9F6]' : 'border-[#202820]/10 bg-white'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-sm text-[#174B37]">
                          {o.orderNumber} · {o.customerName}
                        </p>
                        <p className="text-xs text-[#202820]/70">{o.addressText} — {o.pinCode}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={isFocused ? 'primary' : 'outline'}
                          onClick={() => setActiveJobId(o.id)}
                        >
                          {isFocused ? 'Active Route' : 'Preview Route'}
                        </Button>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(o.addressText)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-[#174B37]/10 text-[#174B37] text-xs font-semibold whitespace-nowrap hover:bg-[#174B37] hover:text-white transition-colors"
                        >
                          Open Google Maps
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* COLLECTION RECORDS */}
          {tab === 'collections' && (
            <Card padding="md">
              <h2 className="font-display font-bold text-lg text-[#174B37] mb-4">Verified Collection & Weighing Records</h2>
              <DataTable
                data={myWeighings}
                columns={[
                  { key: 'ord', header: 'Order ID', render: (w) => <span className="font-mono text-xs">{w.orderId}</span> },
                  { key: 'items', header: 'Materials', render: (w) => <span className="text-xs">{w.items.map((i) => `${i.categoryName}: ${i.actualQty} kg`).join(', ')}</span> },
                  { key: 'wt', header: 'Total Weight', align: 'right', render: (w) => <span className="font-mono font-bold">{w.totalWeightKg} kg</span> },
                  { key: 'amt', header: 'Settled Value', align: 'right', render: (w) => <span className="font-mono font-bold text-[#28A66A]">₹{w.totalAmount.toLocaleString('en-IN')}</span> },
                ]}
              />
            </Card>
          )}

          {/* PAYMENT RECORDS */}
          {tab === 'payments' && (
            <Card padding="md">
              <h2 className="font-display font-bold text-lg text-[#174B37] mb-4">Collection Payment Records</h2>
              <DataTable
                data={myPayments}
                columns={[
                  { key: 'rcp', header: 'Receipt #', render: (p) => <span className="font-mono font-semibold text-[#174B37]">{p.receiptNumber}</span> },
                  { key: 'cust', header: 'Customer', render: (p) => <span className="text-xs">{p.userName}</span> },
                  { key: 'm', header: 'Method', render: (p) => <span className="text-xs">{p.method}</span> },
                  { key: 'amt', header: 'Payout', align: 'right', render: (p) => <span className="font-mono font-bold">₹{p.amount.toLocaleString('en-IN')}</span> },
                  {
                    key: 'dl',
                    header: 'Receipt',
                    align: 'right',
                    render: (p) => (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setReceiptModal({
                            payment: p,
                            order: state.orders.find((o) => o.id === p.orderId),
                          })
                        }
                      >
                        View Receipt
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>
          )}

          {/* PERFORMANCE */}
          {tab === 'performance' && (
            <div className="grid sm:grid-cols-3 gap-4">
              <Card padding="lg">
                <span className="text-xs text-[#202820]/60">Customer Rating</span>
                <p className="font-display text-3xl font-bold text-[#174B37] mt-1 tabular-nums">
                  {execProfile?.rating || 4.9} / 5.0
                </p>
              </Card>
              <Card padding="lg">
                <span className="text-xs text-[#202820]/60">Lifetime Pickups</span>
                <p className="font-display text-3xl font-bold text-[#28A66A] mt-1 tabular-nums">
                  {execProfile?.completedPickupsCount || completedJobs.length}
                </p>
              </Card>
              <Card padding="lg">
                <span className="text-xs text-[#202820]/60">Assigned Zone</span>
                <p className="font-display text-lg font-bold text-[#174B37] mt-1">{execZone?.name}</p>
              </Card>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {tab === 'notifications' && (
            <div className="space-y-4">
              <PushAlertsCard portalLabel="Pickup Executive" />
              <Card padding="md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-lg text-[#174B37]">Dispatch Alerts</h2>
                  <Button size="sm" variant="outline" onClick={() => markAllNotificationsRead(currentUser.id)}>
                    Mark All Read
                  </Button>
                </div>
                {myNotifications.length === 0 ? (
                  <EmptyState title="No Alerts" description="New assignments and schedule changes will appear here." />
                ) : (
                  <div className="divide-y divide-[#202820]/10">
                    {myNotifications.map((n) => (
                      <div key={n.id} className="py-3 text-xs">
                        <p className="font-semibold text-[#174B37]">{n.title}</p>
                        <p className="text-[#202820]/70 mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* PROFILE */}
          {tab === 'profile' && (
            <Card padding="lg" className="max-w-lg space-y-4">
              <h2 className="font-display font-bold text-lg text-[#174B37]">Executive Profile & Shift Controls</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {currentUser.name}</p>
                <p><strong>Employee ID:</strong> <span className="font-mono">{execProfile?.employeeId}</span></p>
                <p><strong>Vehicle:</strong> {execProfile?.vehicleType} ({execProfile?.vehicleNumber})</p>
                <p><strong>Service Zone:</strong> {execZone?.city} — {execZone?.name}</p>
              </div>
              <div className="pt-2 flex flex-wrap gap-2">
                {(['available', 'on_pickup', 'off_duty'] as const).map((st) => (
                  <Button
                    key={st}
                    size="sm"
                    variant={execProfile?.availabilityStatus === st ? 'primary' : 'outline'}
                    onClick={() =>
                      updateExecutiveShiftGps(
                        currentUser.id,
                        execProfile?.activeShiftGps?.lat || 12.9352,
                        execProfile?.activeShiftGps?.lng || 77.6245,
                        st
                      )
                    }
                  >
                    Set {st.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </main>
        <PortalFooter portalLabel="Pickup Executive Portal" withMobileBottomBarSpace />
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-[#202820]/10 grid grid-cols-4 items-center">
        {[
          { id: 'assigned' as ExecTab, label: 'Jobs', Icon: Truck },
          { id: 'navigation' as ExecTab, label: 'Route', Icon: Navigation },
          { id: 'collections' as ExecTab, label: 'Records', Icon: ClipboardCheck },
          { id: 'profile' as ExecTab, label: 'Profile', Icon: UserIcon },
        ].map((item) => {
          const Icon = item.Icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center justify-center h-full ${
                tab === item.id ? 'text-[#174B37] font-semibold' : 'text-[#202820]/55'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Reject Modal */}
      <Modal open={rejectOrder !== null} onClose={() => setRejectOrder(null)} title="Reject Assignment">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (rejectOrder) {
              respondAssignment(rejectOrder.id, currentUser.id, false, rejectReason);
              setRejectOrder(null);
              setRejectReason('');
            }
          }}
          className="space-y-3"
        >
          <Textarea
            label="Reason for rejection"
            required
            rows={3}
            placeholder="Vehicle maintenance / Route capacity full..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <Button type="submit" variant="danger" className="w-full">
            Confirm Rejection
          </Button>
        </form>
      </Modal>

      <ReceiptModal
        open={receiptModal !== null}
        onClose={() => setReceiptModal(null)}
        payment={receiptModal?.payment || null}
        order={receiptModal?.order}
      />
    </div>
  );
};
