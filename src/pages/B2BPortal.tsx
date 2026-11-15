import React, { useMemo, useState } from 'react';
import {
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  PackageCheck,
  Plus,
  Receipt,
  Repeat,
  ShieldCheck,
  Truck,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { usePunarchakra } from '../context/PunarchakraContext';
import { Payment, PickupOrder, Quotation } from '../types/punarchakra';
import { DonutBreakdownChart, SimpleBarChart } from '../components/ui/Charts';
import { DataTable } from '../components/ui/DataTable';
import { OrderTracker } from '../components/ui/OrderTracker';
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

type B2BTab =
  | 'dashboard'
  | 'profile'
  | 'gst'
  | 'branches'
  | 'inventory'
  | 'bulk_booking'
  | 'recurring'
  | 'quotations'
  | 'rate_contracts'
  | 'orders'
  | 'tracking'
  | 'invoices'
  | 'payments'
  | 'reports'
  | 'sustainability'
  | 'notifications'
  | 'users'
  | 'support';

export const B2BPortal: React.FC = () => {
  const {
    state,
    currentUser,
    navigateTo,
    logout,
    notify,
    getApplicableRate,
    createBusinessBranch,
    updateBusinessProfile,
    createPickupOrder,
    submitQuotation,
    businessRespondQuotation,
    convertQuotationToOrder,
    createSupportTicket,
    markNotificationRead,
    markAllNotificationsRead,
  } = usePunarchakra();

  const [tab, setTab] = useState<B2BTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profile = state.businessProfiles.find((b) => b.userId === currentUser?.id);
  const myBranches = useMemo(
    () => state.businessBranches.filter((b) => b.businessUserId === currentUser?.id),
    [state.businessBranches, currentUser]
  );

  const [profileForm, setProfileForm] = useState({
    companyName: profile?.companyName || currentUser?.name || '',
    industryType: profile?.industryType || 'IT Parks & Corporate Offices',
    gstin: profile?.gstin || '',
    contactPerson: profile?.contactPerson || '',
    businessAddress: profile?.businessAddress || '',
    billingEmail: profile?.billingEmail || currentUser?.email || '',
  });

  // Add Branch Modal
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchForm, setBranchForm] = useState({
    branchName: '',
    address: '',
    city: 'Bengaluru',
    pinCode: '560058',
    contactName: '',
    contactMobile: '',
  });

  // Request Quotation State
  const [quoteBranchId, setQuoteBranchId] = useState(myBranches[0]?.id || '');
  const [quoteDate, setQuoteDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  });
  const [quoteItems, setQuoteItems] = useState<
    { materialName: string; categoryId: string; estimatedWeightKg: number }[]
  >([
    { materialName: 'Server Room Copper & Aluminium Cabling', categoryId: 'cat-copper', estimatedWeightKg: 65 },
    { materialName: 'Baled Office Cardboard Cartons', categoryId: 'cat-cardboard', estimatedWeightKg: 420 },
  ]);
  const [quotePhotos, setQuotePhotos] = useState<string[]>([]);
  const [revisionModalQuote, setRevisionModalQuote] = useState<Quotation | null>(null);
  const [revisionNote, setRevisionNote] = useState('');

  // Bulk / Recurring Booking State
  const [bulkBranchId, setBulkBranchId] = useState(myBranches[0]?.id || '');
  const [bulkCatId, setBulkCatId] = useState('cat-ewaste');
  const [bulkQty, setBulkQty] = useState(150);
  const [bulkDate, setBulkDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [bulkSlot, setBulkSlot] = useState('09:00 AM - 11:30 AM');
  const [bulkInstructions, setBulkInstructions] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState<'Weekly' | 'Bi-Weekly' | 'Monthly'>('Monthly');

  // Tracking & Receipts
  const [trackedOrderId, setTrackedOrderId] = useState('');
  const [receiptModalData, setReceiptModalData] = useState<{ payment: Payment; order?: PickupOrder } | null>(null);

  // Support ticket
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });

  // Team coordinators (local UI list synced in session)
  const [coordinators, setCoordinators] = useState([
    { id: 'coord-1', name: profile?.contactPerson || 'Meenakshi Sundaram', email: currentUser?.email || '', role: 'Facility Admin', branch: myBranches[0]?.branchName || 'HQ' },
  ]);
  const [newCoord, setNewCoord] = useState({ name: '', email: '', role: 'Branch Coordinator', branch: myBranches[0]?.branchName || 'HQ' });

  if (!currentUser) return null;

  const myOrders = useMemo(
    () =>
      state.orders
        .filter((o) => o.customerUserId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [state.orders, currentUser.id]
  );
  const myQuotations = useMemo(
    () =>
      state.quotations
        .filter((q) => q.businessUserId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [state.quotations, currentUser.id]
  );
  const myPayments = useMemo(
    () => state.payments.filter((p) => p.userId === currentUser.id),
    [state.payments, currentUser.id]
  );
  const myDocuments = useMemo(
    () => state.documents.filter((d) => d.ownerUserId === currentUser.id),
    [state.documents, currentUser.id]
  );
  const myNotifications = useMemo(
    () => state.notifications.filter((n) => n.userId === currentUser.id),
    [state.notifications, currentUser.id]
  );
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  const completedOrders = myOrders.filter((o) => o.status === 'payment_completed');
  const pendingOrders = myOrders.filter((o) => !['payment_completed', 'cancelled'].includes(o.status));
  const totalScrapSold = Math.round(
    completedOrders.reduce((s, o) => s + (o.actualTotalWeight || o.estimatedTotalWeight), 0)
  );
  const totalEarnings = completedOrders.reduce((s, o) => s + (o.finalAmount || 0), 0);
  const outstandingAmount = pendingOrders.reduce((s, o) => s + o.estimatedTotalAmount, 0);

  const trackedOrder = myOrders.find((o) => o.id === trackedOrderId) || pendingOrders[0] || myOrders[0];

  const handleQuotePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files)
      .slice(0, 3)
      .forEach((f) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') setQuotePhotos((p) => [...p.slice(0, 2), reader.result as string]);
        };
        reader.readAsDataURL(f);
      });
  };

  const handleSubmitQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = myBranches.find((b) => b.id === quoteBranchId) || myBranches[0];
    submitQuotation({
      businessUserId: currentUser.id,
      branchId: branch?.id,
      pickupLocation: branch ? `${branch.branchName}, ${branch.address}` : profileForm.businessAddress,
      city: branch?.city || 'Bengaluru',
      pinCode: branch?.pinCode || '560058',
      expectedCollectionDate: quoteDate,
      items: quoteItems.map((qi) => ({
        ...qi,
        categoryName: state.categories.find((c) => c.id === qi.categoryId)?.name || 'Scrap',
      })),
      photos: quotePhotos,
    });
    setQuotePhotos([]);
  };

  const handleBulkBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = myBranches.find((b) => b.id === bulkBranchId) || myBranches[0];
    const sub = state.subcategories.find((s) => s.categoryId === bulkCatId);
    const res = createPickupOrder({
      customerUserId: currentUser.id,
      branchId: branch?.id,
      branchName: branch?.branchName,
      addressText: branch ? `${branch.address}, ${branch.city}` : profileForm.businessAddress,
      city: branch?.city || 'Bengaluru',
      pinCode: branch?.pinCode || '560058',
      scheduledDate: bulkDate,
      timeSlot: bulkSlot,
      instructions: bulkInstructions,
      items: [{ categoryId: bulkCatId, subcategoryId: sub?.id || '', estimatedQty: bulkQty }],
      photos: [],
      isRecurring,
      recurringFrequency: isRecurring ? recurringFreq : undefined,
    });
    if (res.ok && res.order) {
      setTrackedOrderId(res.order.id);
      setTab('orders');
    }
  };

  const handleDownloadCsv = () => {
    const header = 'OrderNumber,Date,Branch,WeightKg,AmountINR,Status\n';
    const rows = myOrders
      .map(
        (o) =>
          `${o.orderNumber},${o.scheduledDate},"${o.branchName || o.city}",${
            o.actualTotalWeight || o.estimatedTotalWeight
          },${o.finalAmount || o.estimatedTotalAmount},${o.status}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Punarchakra_B2B_Report_${currentUser.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('success', 'CSV Report Exported');
  };

  const NAV_ITEMS: { id: B2BTab; label: string; Icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'quotations', label: 'Request Quotation', Icon: FileText },
    { id: 'bulk_booking', label: 'Bulk Pickup Booking', Icon: Truck },
    { id: 'recurring', label: 'Recurring Pickup', Icon: Repeat },
    { id: 'orders', label: 'Order Management', Icon: PackageCheck },
    { id: 'tracking', label: 'Pickup Tracking', Icon: MapPin },
    { id: 'branches', label: 'Branch Management', Icon: Building2 },
    { id: 'inventory', label: 'Scrap Inventory', Icon: FileSpreadsheet },
    { id: 'rate_contracts', label: 'Rate Contracts', Icon: ShieldCheck },
    { id: 'invoices', label: 'Invoices', Icon: Receipt },
    { id: 'payments', label: 'Payment History', Icon: CreditCard },
    { id: 'reports', label: 'Reports', Icon: Download },
    { id: 'sustainability', label: 'Sustainability Reports', Icon: Leaf },
    { id: 'notifications', label: unreadCount > 0 ? `Notifications (${unreadCount})` : 'Notifications', Icon: Bell },
    { id: 'profile', label: 'Business Profile', Icon: Building2 },
    { id: 'gst', label: 'GST Details', Icon: CheckCircle2 },
    { id: 'users', label: 'User Management', Icon: Users },
    { id: 'support', label: 'Support', Icon: HelpCircle },
  ];

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    myOrders.forEach((o) =>
      o.items.forEach((i) => {
        map[i.categoryName] = (map[i.categoryName] || 0) + (i.actualQty ?? i.estimatedQty);
      })
    );
    const colors = ['#174B37', '#28A66A', '#A5D66D', '#4B7F67'];
    return Object.entries(map).map(([label, value], i) => ({
      label,
      value,
      color: colors[i % colors.length],
    }));
  }, [myOrders]);

  return (
    <div className="min-h-screen bg-[#F7F9F6] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-[#202820]/10 z-30">
        <div className="h-16 px-5 flex items-center border-b border-[#202820]/10">
          <AppLogo onClick={() => navigateTo('public')} />
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.Icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#174B37] text-white'
                    : 'text-[#202820]/75 hover:bg-[#F7F9F6] hover:text-[#174B37]'
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
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#DC2626] hover:bg-[#DC2626]/8 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#202820]/10 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#174B37]"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="font-display font-bold text-base text-[#174B37] truncate">
                {NAV_ITEMS.find((n) => n.id === tab)?.label}
              </p>
              <p className="text-xs text-[#202820]/55 truncate">
                B2B Enterprise Portal · {profile?.companyName || currentUser.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PortalSwitcherDropdown compact />
            <Button variant="outline" size="sm" onClick={() => navigateTo('public')}>
              Public Site
            </Button>
            <Button size="sm" onClick={() => setTab('quotations')}>
              <Plus className="w-4 h-4" />
              Request Quote
            </Button>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-black/50 flex">
            <div className="w-72 bg-white h-full flex flex-col">
              <div className="h-16 px-4 flex items-center justify-between border-b border-[#202820]/10">
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
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium ${
                        tab === item.id ? 'bg-[#174B37] text-white' : 'text-[#202820]/80'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <>
              <PushAlertsCard portalLabel="B2B Enterprise" />
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Total Scrap Sold</span>
                  <p className="font-display text-2xl font-bold text-[#174B37] mt-1 tabular-nums">
                    {totalScrapSold.toLocaleString('en-IN')} kg
                  </p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Total Earnings</span>
                  <p className="font-display text-2xl font-bold text-[#174B37] mt-1 tabular-nums">
                    ₹{totalEarnings.toLocaleString('en-IN')}
                  </p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Total Pickups</span>
                  <p className="font-display text-2xl font-bold text-[#174B37] mt-1 tabular-nums">
                    {myOrders.length}
                  </p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Pending Collections</span>
                  <p className="font-display text-2xl font-bold text-[#D97706] mt-1 tabular-nums">
                    {pendingOrders.length}
                  </p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Outstanding Est.</span>
                  <p className="font-display text-2xl font-bold text-[#28A66A] mt-1 tabular-nums">
                    ₹{outstandingAmount.toLocaleString('en-IN')}
                  </p>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card padding="md">
                  <h3 className="font-display font-bold text-base text-[#174B37] mb-4">
                    Monthly Scrap Volume (kg)
                  </h3>
                  <SimpleBarChart
                    data={myOrders.map((o) => ({
                      label: o.scheduledDate.slice(5),
                      value: o.actualTotalWeight || o.estimatedTotalWeight,
                    }))}
                    primaryLabel="Weight (kg)"
                  />
                </Card>
                <Card padding="md">
                  <h3 className="font-display font-bold text-base text-[#174B37] mb-4">
                    Enterprise Material Breakdown
                  </h3>
                  <DonutBreakdownChart
                    segments={categoryBreakdown}
                    centerLabel="Volume"
                    centerValue={`${myOrders.reduce((s, o) => s + (o.actualTotalWeight || o.estimatedTotalWeight), 0)} kg`}
                  />
                </Card>
              </div>
            </>
          )}

          {/* REQUEST QUOTATION & WORKFLOW */}
          {tab === 'quotations' && (
            <div className="space-y-6">
              <Card padding="lg">
                <h2 className="font-display font-bold text-lg text-[#174B37] mb-1">
                  Submit Enterprise Scrap Quotation Request
                </h2>
                <p className="text-xs text-[#202820]/60 mb-4">
                  Upload scrap inventory with weights and photos. Admin reviews and sends custom contract pricing.
                </p>
                <form onSubmit={handleSubmitQuotation} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Select label="Branch / Pickup Location" value={quoteBranchId} onChange={(e) => setQuoteBranchId(e.target.value)}>
                      {myBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branchName} ({b.pinCode})
                        </option>
                      ))}
                    </Select>
                    <Input
                      label="Expected Collection Date"
                      type="date"
                      required
                      value={quoteDate}
                      onChange={(e) => setQuoteDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#174B37]">Scrap Inventory Items</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setQuoteItems((prev) => [
                            ...prev,
                            { materialName: '', categoryId: 'cat-steel', estimatedWeightKg: 100 },
                          ])
                        }
                      >
                        + Add Item
                      </Button>
                    </div>
                    {quoteItems.map((qi, idx) => (
                      <div key={idx} className="grid sm:grid-cols-12 gap-3 p-3 rounded-xl bg-[#F7F9F6] border border-[#202820]/10">
                        <div className="sm:col-span-5">
                          <Input
                            placeholder="Material description (e.g. Old server racks)"
                            required
                            value={qi.materialName}
                            onChange={(e) =>
                              setQuoteItems((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, materialName: e.target.value } : p))
                              )
                            }
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <Select
                            value={qi.categoryId}
                            onChange={(e) =>
                              setQuoteItems((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, categoryId: e.target.value } : p))
                              )
                            }
                          >
                            {state.categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="sm:col-span-3">
                          <Input
                            type="number"
                            min={10}
                            placeholder="Weight (kg)"
                            value={qi.estimatedWeightKg}
                            onChange={(e) =>
                              setQuoteItems((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, estimatedWeightKg: Number(e.target.value) } : p))
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-[#174B37]/30 rounded-xl bg-[#F7F9F6] cursor-pointer text-xs font-medium text-[#174B37]">
                      <Upload className="w-4 h-4" />
                      <span>Upload Lot Photographs ({quotePhotos.length} attached)</span>
                      <input type="file" accept="image/*" multiple onChange={handleQuotePhotoUpload} className="hidden" />
                    </label>
                  </div>

                  <Button type="submit" size="lg">
                    Submit Quotation Request to Admin Desk
                  </Button>
                </form>
              </Card>

              <Card padding="md" className="space-y-4">
                <h3 className="font-display font-bold text-base text-[#174B37]">Active & Past Quotations</h3>
                {myQuotations.length === 0 ? (
                  <EmptyState title="No Quotations Yet" description="Submit your first bulk lot above to receive contract pricing." />
                ) : (
                  <div className="space-y-4">
                    {myQuotations.map((q) => (
                      <div key={q.id} className="p-4 rounded-xl border border-[#202820]/10 bg-[#F7F9F6]/60 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-sm text-[#174B37]">{q.quoteNumber}</span>
                            <span className="mx-2 text-[#202820]/30">·</span>
                            <span className="text-xs text-[#202820]/70">{q.pickupLocation}</span>
                          </div>
                          <StatusIndicator status={q.status} />
                        </div>

                        <div className="bg-white rounded-xl border border-[#202820]/8 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-[#F7F9F6]">
                              <tr>
                                <th className="px-3 py-2 text-left">Material</th>
                                <th className="px-3 py-2 text-right">Est. Weight</th>
                                <th className="px-3 py-2 text-right">Quoted Rate</th>
                                <th className="px-3 py-2 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#202820]/8">
                              {q.items.map((it) => (
                                <tr key={it.id}>
                                  <td className="px-3 py-2">
                                    <strong>{it.categoryName}:</strong> {it.materialName}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono">{it.estimatedWeightKg} kg</td>
                                  <td className="px-3 py-2 text-right font-mono">
                                    {it.proposedRate ? `₹${it.proposedRate}/kg` : 'Pending Admin'}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono font-semibold">
                                    {it.proposedSubtotal ? `₹${it.proposedSubtotal.toLocaleString('en-IN')}` : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {q.adminNotes && (
                          <p className="text-xs text-[#174B37]">Admin Note: {q.adminNotes}</p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <span className="font-mono text-sm font-bold text-[#174B37]">
                            {q.totalQuotedAmount ? `Total Quoted: ₹${q.totalQuotedAmount.toLocaleString('en-IN')}` : `Total Weight: ${q.totalEstimatedWeightKg} kg`}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {q.status === 'priced_by_admin' && (
                              <>
                                <Button size="sm" onClick={() => businessRespondQuotation(q.id, 'accepted')}>
                                  Accept Quote
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setRevisionModalQuote(q)}>
                                  Request Revision
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => businessRespondQuotation(q.id, 'rejected')}>
                                  Reject
                                </Button>
                              </>
                            )}
                            {q.status === 'accepted' && (
                              <Button size="sm" variant="secondary" onClick={() => convertQuotationToOrder(q.id, '09:00 AM - 11:30 AM')}>
                                Convert to Pickup Order
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* BULK PICKUP & RECURRING PICKUP */}
          {(tab === 'bulk_booking' || tab === 'recurring') && (
            <Card padding="lg" className="max-w-2xl">
              <h2 className="font-display font-bold text-lg text-[#174B37] mb-1">
                {tab === 'recurring' ? 'Configure Recurring Pickup Schedule' : 'Book Bulk Enterprise Pickup'}
              </h2>
              <p className="text-xs text-[#202820]/60 mb-5">
                Pickups sync immediately with Admin Order Management and Executive Dispatch.
              </p>
              <form onSubmit={handleBulkBooking} className="space-y-4">
                <Select label="Branch Location" value={bulkBranchId} onChange={(e) => setBulkBranchId(e.target.value)}>
                  {myBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branchName} — {b.city} ({b.pinCode})
                    </option>
                  ))}
                </Select>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Select label="Primary Scrap Category" value={bulkCatId} onChange={(e) => setBulkCatId(e.target.value)}>
                    {state.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (₹{getApplicableRate(c.id, 'b2b', 'Bengaluru')}/{c.unit})
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Estimated Weight (kg)"
                    type="number"
                    min={25}
                    value={bulkQty}
                    onChange={(e) => setBulkQty(Number(e.target.value))}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Collection Date" type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} />
                  <Select label="Dock Time Slot" value={bulkSlot} onChange={(e) => setBulkSlot(e.target.value)}>
                    <option value="09:00 AM - 11:30 AM">09:00 AM - 11:30 AM</option>
                    <option value="12:00 PM - 02:30 PM">12:00 PM - 02:30 PM</option>
                    <option value="03:00 PM - 05:30 PM">03:00 PM - 05:30 PM</option>
                  </Select>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F7F9F6] border border-[#202820]/10 space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-[#174B37] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRecurring || tab === 'recurring'}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                    />
                    <span>Enable Recurring Automated Schedule</span>
                  </label>
                  {(isRecurring || tab === 'recurring') && (
                    <Select
                      label="Recurrence Cadence"
                      value={recurringFreq}
                      onChange={(e) => setRecurringFreq(e.target.value as typeof recurringFreq)}
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-Weekly">Bi-Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </Select>
                  )}
                </div>
                <Textarea
                  label="Loading Bay / Gate Pass Instructions"
                  rows={2}
                  value={bulkInstructions}
                  onChange={(e) => setBulkInstructions(e.target.value)}
                />
                <Button type="submit" size="lg" className="w-full">
                  Schedule Enterprise Collection
                </Button>
              </form>
            </Card>
          )}

          {/* BRANCH MANAGEMENT */}
          {tab === 'branches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-[#174B37]">Registered Business Branches</h2>
                <Button size="sm" onClick={() => setShowAddBranch(true)}>
                  + Add Branch
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {myBranches.map((b) => (
                  <Card key={b.id} padding="md" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-base text-[#174B37]">{b.branchName}</h3>
                      {b.isDefault && <span className="text-xs font-semibold text-[#28A66A]">Primary Branch</span>}
                    </div>
                    <p className="text-xs text-[#202820]/70">{b.address}, {b.city} — {b.pinCode}</p>
                    <p className="text-xs text-[#202820]/60">Coordinator: {b.contactName} ({b.contactMobile})</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ORDER MANAGEMENT */}
          {tab === 'orders' && (
            <Card padding="md">
              <h2 className="font-display font-bold text-lg text-[#174B37] mb-4">Corporate Order Management</h2>
              <DataTable
                data={myOrders}
                searchFilter={(o, q) => o.orderNumber.toLowerCase().includes(q) || (o.branchName || '').toLowerCase().includes(q)}
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
                  { key: 'branch', header: 'Branch', render: (o) => <span className="text-xs">{o.branchName || o.city}</span> },
                  { key: 'date', header: 'Date', render: (o) => <span className="text-xs">{o.scheduledDate}</span> },
                  { key: 'rec', header: 'Cadence', render: (o) => <span className="text-xs">{o.isRecurring ? o.recurringFrequency : 'One-Time'}</span> },
                  { key: 'status', header: 'Status', render: (o) => <StatusIndicator status={o.status} /> },
                  {
                    key: 'val',
                    header: 'Value',
                    align: 'right',
                    render: (o) => <span className="font-mono font-bold">₹{(o.finalAmount ?? o.estimatedTotalAmount).toLocaleString('en-IN')}</span>,
                  },
                  {
                    key: 'track',
                    header: 'Track',
                    align: 'right',
                    render: (o) => (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTrackedOrderId(o.id);
                          setTab('tracking');
                        }}
                      >
                        Track
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>
          )}

          {/* PICKUP TRACKING */}
          {tab === 'tracking' && (
            <Card padding="md" className="space-y-5">
              {trackedOrder ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display font-bold text-lg text-[#174B37]">{trackedOrder.orderNumber}</h2>
                      <p className="text-xs text-[#202820]/60">{trackedOrder.branchName || trackedOrder.addressText}</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-[#174B37]">OTP: {trackedOrder.pickupOtp}</span>
                  </div>
                  <OrderTracker currentStatus={trackedOrder.status} />
                </>
              ) : (
                <EmptyState title="No Active Pickups" description="Schedule a bulk pickup or convert an accepted quotation." />
              )}
            </Card>
          )}

          {/* SCRAP INVENTORY & RATE CONTRACTS */}
          {(tab === 'inventory' || tab === 'rate_contracts') && (
            <Card padding="md">
              <h2 className="font-display font-bold text-lg text-[#174B37] mb-1">
                {tab === 'rate_contracts'
                  ? `B2B Rate Contract (${profile?.contractTier || 'Enterprise'})`
                  : 'Approved Corporate Scrap Categories'}
              </h2>
              <p className="text-xs text-[#202820]/60 mb-4">
                Contract pricing reflects admin-published B2B industrial bulk rates.
              </p>
              <DataTable
                data={state.categories.filter((c) => c.isActive)}
                pageSize={12}
                columns={[
                  { key: 'cat', header: 'Material', render: (c) => <span className="font-semibold text-[#174B37]">{c.name}</span> },
                  { key: 'b2c', header: 'Standard Rate', align: 'right', render: (c) => <span className="font-mono">₹{getApplicableRate(c.id, 'b2c', 'Bengaluru')}/{c.unit}</span> },
                  { key: 'b2b', header: 'Your B2B Rate', align: 'right', render: (c) => <span className="font-mono font-bold text-[#28A66A]">₹{getApplicableRate(c.id, 'b2b', 'Bengaluru')}/{c.unit}</span> },
                  { key: 'co2', header: 'CO₂ Factor', align: 'right', render: (c) => <span className="font-mono text-xs">{c.co2FactorPerKg} kg/kg</span> },
                ]}
              />
            </Card>
          )}

          {/* INVOICES & PAYMENT HISTORY */}
          {(tab === 'invoices' || tab === 'payments') && (
            <Card padding="md">
              <h2 className="font-display font-bold text-lg text-[#174B37] mb-4">
                {tab === 'invoices' ? 'Tax Invoices & Manifests' : 'Enterprise Settlement History'}
              </h2>
              <DataTable
                data={myPayments}
                columns={[
                  { key: 'rcp', header: 'Invoice / Receipt #', render: (p) => <span className="font-mono font-semibold text-[#174B37]">{p.receiptNumber}</span> },
                  { key: 'ord', header: 'Order #', render: (p) => <span className="font-mono text-xs">{p.orderNumber}</span> },
                  { key: 'ref', header: 'UTR / Reference', render: (p) => <span className="font-mono text-xs">{p.transactionRef}</span> },
                  { key: 'status', header: 'Status', render: (p) => <StatusIndicator status={p.status} /> },
                  { key: 'amt', header: 'Settled Amount', align: 'right', render: (p) => <span className="font-mono font-bold">₹{p.amount.toLocaleString('en-IN')}</span> },
                  {
                    key: 'act',
                    header: 'Download',
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
                        Download
                      </Button>
                    ),
                  },
                ]}
              />
              {myDocuments.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#202820]/10">
                  <h3 className="font-display font-bold text-sm text-[#174B37] mb-2">Compliance Documents</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {myDocuments.map((doc) => (
                      <div key={doc.id} className="p-3 rounded-xl bg-[#F7F9F6] flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-[#174B37]">{doc.title}</p>
                          <p className="font-mono text-[#202820]/55">{doc.fileName}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => notify('info', `Downloaded ${doc.fileName}`)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* REPORTS & SUSTAINABILITY REPORTS */}
          {(tab === 'reports' || tab === 'sustainability') && (
            <Card padding="lg" className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-lg text-[#174B37]">
                    {tab === 'sustainability' ? 'ESG & Landfill Diversion Sustainability Report' : 'Enterprise Operations & Financial Export'}
                  </h2>
                  <p className="text-xs text-[#202820]/60">Generated directly from verified central weighing records.</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    Print PDF Report
                  </Button>
                  <Button size="sm" onClick={handleDownloadCsv}>
                    <Download className="w-4 h-4" />
                    Export Excel / CSV
                  </Button>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#F7F9F6]">
                  <span className="text-xs text-[#202820]/60">Total Verified Weight</span>
                  <p className="font-display text-2xl font-bold text-[#174B37] mt-1 tabular-nums">{totalScrapSold} kg</p>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F9F6]">
                  <span className="text-xs text-[#202820]/60">CO₂ Emissions Mitigated</span>
                  <p className="font-display text-2xl font-bold text-[#28A66A] mt-1 tabular-nums">
                    {Math.round(totalScrapSold * 2.1).toLocaleString('en-IN')} kg CO₂e
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F9F6]">
                  <span className="text-xs text-[#202820]/60">Circular Recovery Value</span>
                  <p className="font-display text-2xl font-bold text-[#174B37] mt-1 tabular-nums">
                    ₹{totalEarnings.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* PROFILE & GST DETAILS */}
          {(tab === 'profile' || tab === 'gst') && (
            <Card padding="lg" className="max-w-2xl space-y-4">
              <h2 className="font-display font-bold text-lg text-[#174B37]">
                {tab === 'gst' ? 'GST & Tax Compliance Details' : 'Business Profile'}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateBusinessProfile(currentUser.id, profileForm);
                }}
                className="space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Company Legal Name"
                    value={profileForm.companyName}
                    onChange={(e) => setProfileForm((f) => ({ ...f, companyName: e.target.value }))}
                  />
                  <Input
                    label="15-Digit GSTIN"
                    maxLength={15}
                    value={profileForm.gstin}
                    onChange={(e) => setProfileForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Authorized Contact Person"
                    value={profileForm.contactPerson}
                    onChange={(e) => setProfileForm((f) => ({ ...f, contactPerson: e.target.value }))}
                  />
                  <Input
                    label="Billing Email"
                    type="email"
                    value={profileForm.billingEmail}
                    onChange={(e) => setProfileForm((f) => ({ ...f, billingEmail: e.target.value }))}
                  />
                </div>
                <Input
                  label="Registered Business Address"
                  value={profileForm.businessAddress}
                  onChange={(e) => setProfileForm((f) => ({ ...f, businessAddress: e.target.value }))}
                />
                <Button type="submit">Save Corporate Details</Button>
              </form>
            </Card>
          )}

          {/* USER MANAGEMENT */}
          {tab === 'users' && (
            <Card padding="md" className="space-y-4">
              <h2 className="font-display font-bold text-lg text-[#174B37]">Branch Coordinators & Access</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCoord.name || !newCoord.email) return;
                  setCoordinators((prev) => [...prev, { ...newCoord, id: `coord-${Date.now()}` }]);
                  setNewCoord({ name: '', email: '', role: 'Branch Coordinator', branch: myBranches[0]?.branchName || 'HQ' });
                  notify('success', 'Branch coordinator added');
                }}
                className="grid sm:grid-cols-4 gap-3 items-end"
              >
                <Input label="Name" value={newCoord.name} onChange={(e) => setNewCoord((c) => ({ ...c, name: e.target.value }))} />
                <Input label="Work Email" type="email" value={newCoord.email} onChange={(e) => setNewCoord((c) => ({ ...c, email: e.target.value }))} />
                <Select label="Branch" value={newCoord.branch} onChange={(e) => setNewCoord((c) => ({ ...c, branch: e.target.value }))}>
                  {myBranches.map((b) => (
                    <option key={b.id} value={b.branchName}>{b.branchName}</option>
                  ))}
                </Select>
                <Button type="submit">Add Coordinator</Button>
              </form>
              <DataTable
                data={coordinators}
                columns={[
                  { key: 'n', header: 'Name', render: (c) => <span className="font-semibold">{c.name}</span> },
                  { key: 'e', header: 'Email', render: (c) => <span className="text-xs">{c.email}</span> },
                  { key: 'r', header: 'Role', render: (c) => <span className="text-xs">{c.role}</span> },
                  { key: 'b', header: 'Assigned Branch', render: (c) => <span className="text-xs">{c.branch}</span> },
                ]}
              />
            </Card>
          )}

          {/* NOTIFICATIONS */}
          {tab === 'notifications' && (
            <div className="space-y-4">
              <PushAlertsCard portalLabel="B2B Enterprise" />
              <Card padding="md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-lg text-[#174B37]">Enterprise Push & Status Alerts</h2>
                  <Button size="sm" variant="outline" onClick={() => markAllNotificationsRead(currentUser.id)}>
                    Mark All Read
                  </Button>
                </div>
                {myNotifications.length === 0 ? (
                  <EmptyState
                    title="All Caught Up"
                    description="Quotation approvals, bulk dispatch assignments, weighbridge updates, and RTGS/NEFT settlement alerts will appear here."
                  />
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

          {/* SUPPORT */}
          {tab === 'support' && (
            <Card padding="md" className="max-w-xl space-y-4">
              <h2 className="font-display font-bold text-lg text-[#174B37]">Enterprise Account Desk</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createSupportTicket({
                    userId: currentUser.id,
                    userName: currentUser.name,
                    userRole: 'b2b',
                    subject: ticketForm.subject,
                    category: 'B2B Account',
                    message: ticketForm.message,
                  });
                  setTicketForm({ subject: '', message: '' });
                }}
                className="space-y-3"
              >
                <Input
                  label="Subject"
                  required
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm((f) => ({ ...f, subject: e.target.value }))}
                />
                <Textarea
                  label="Message"
                  rows={3}
                  required
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm((f) => ({ ...f, message: e.target.value }))}
                />
                <Button type="submit">Send to Dedicated Account Manager</Button>
              </form>
            </Card>
          )}
        </main>
        <PortalFooter portalLabel="B2B Enterprise Portal" />
      </div>

      {/* Add Branch Modal */}
      <Modal open={showAddBranch} onClose={() => setShowAddBranch(false)} title="Add Business Branch">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createBusinessBranch({
              businessUserId: currentUser.id,
              ...branchForm,
              isDefault: false,
            });
            setShowAddBranch(false);
            setBranchForm({ branchName: '', address: '', city: 'Bengaluru', pinCode: '560058', contactName: '', contactMobile: '' });
          }}
          className="space-y-3"
        >
          <Input label="Branch Name" required value={branchForm.branchName} onChange={(e) => setBranchForm((f) => ({ ...f, branchName: e.target.value }))} />
          <Input label="Street Address (Bengaluru Industrial Area)" placeholder="e.g. Plot 42, Peenya Phase II / Whitefield EPIP" required value={branchForm.address} onChange={(e) => setBranchForm((f) => ({ ...f, address: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City (Bengaluru Industrial)" value="Bengaluru" readOnly />
            <Input label="Industrial PIN Code" placeholder="560058 / 560066 / 560099" required maxLength={6} value={branchForm.pinCode} onChange={(e) => setBranchForm((f) => ({ ...f, pinCode: e.target.value.replace(/\D/g, '') }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Site Contact Name" required value={branchForm.contactName} onChange={(e) => setBranchForm((f) => ({ ...f, contactName: e.target.value }))} />
            <Input label="Site Mobile" required value={branchForm.contactMobile} onChange={(e) => setBranchForm((f) => ({ ...f, contactMobile: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full">Save Branch</Button>
        </form>
      </Modal>

      {/* Revision Modal */}
      <Modal open={revisionModalQuote !== null} onClose={() => setRevisionModalQuote(null)} title="Request Quotation Revision">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (revisionModalQuote) {
              businessRespondQuotation(revisionModalQuote.id, 'revision_requested', revisionNote);
              setRevisionModalQuote(null);
              setRevisionNote('');
            }
          }}
          className="space-y-3"
        >
          <Textarea
            label="Specify requested rate adjustments or additional volume details"
            rows={3}
            required
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
          />
          <Button type="submit" className="w-full">Send Revision Request</Button>
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
