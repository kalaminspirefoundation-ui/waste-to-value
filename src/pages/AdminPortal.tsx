import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  Cloud,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  HardDrive,
  HelpCircle,
  IndianRupee,
  LayoutDashboard,
  Layers,
  Leaf,
  Lock,
  LogOut,
  MapPin,
  Menu,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Tag,
  Trash2,
  Truck,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { usePunarchakra } from '../context/PunarchakraContext';
import {
  BusinessProfile,
  DriveLedgerEventType,
  DriveLedgerRecord,
  DriveVaultFile,
  ExecutiveProfile,
  Payment,
  PickupOrder,
  Quotation,
  SupportTicket,
  User,
  UserRole,
} from '../types/punarchakra';
import { DonutBreakdownChart, SimpleBarChart } from '../components/ui/Charts';
import { DataTable } from '../components/ui/DataTable';
import { PortalFooter, PortalSwitcherDropdown } from '../components/ui/PortalSwitcherDropdown';
import {
  AppLogo,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  LanguageToggleButton,
  Modal,
  Select,
  StatusIndicator,
  Textarea,
} from '../components/ui/Primitives';

type AdminTab =
  | 'dashboard'
  | 'users'
  | 'b2c_customers'
  | 'b2b_customers'
  | 'executives'
  | 'admin_staff'
  | 'categories'
  | 'subcategories'
  | 'pricing'
  | 'orders'
  | 'assignments'
  | 'quotations'
  | 'payments'
  | 'wallets'
  | 'notifications'
  | 'analytics'
  | 'environmental'
  | 'cms'
  | 'service_areas'
  | 'tickets'
  | 'drive_vault'
  | 'audit_logs'
  | 'settings';

export const AdminPortal: React.FC = () => {
  const {
    state,
    currentUser,
    navigateTo,
    logout,
    notify,
    getSmartExecutiveRecommendations,
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
    adminPriceQuotation,
    adminReplySupportTicket,
    adminUpdateCms,
    adminAddCoupon,
    cancelOrder,
    resetDemoWorkspace,
    language,
    toggleLanguage,
    isLoading,
    lastRatesSyncAt,
    ratesSyncSource,
    syncLiveRatesOnline,
    driveConnectedEmail,
    driveFolderId,
    driveFiles,
    driveSyncing,
    lastDriveSyncAt,
    connectAdminGoogleDrive,
    disconnectAdminGoogleDrive,
    syncAllLedgerToGoogleDrive,
    refreshDriveFiles,
    readDriveFile,
    adminEditDriveFile,
    adminDeleteDriveFile,
    adminEditLedgerRecord,
    adminDeleteLedgerRecord,
  } = usePunarchakra();

  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Modals & Forms
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    role: 'executive' as UserRole,
    name: '',
    email: '',
    mobile: '',
    password: 'Punarchakra@123',
    zoneId: state.serviceZones[0]?.id || 'zone-blr-north-hebbal',
    employeeId: '',
    companyName: '',
    gstin: '',
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    mobile: '',
    status: 'active' as 'active' | 'deactivated',
    password: '',
    companyName: '',
    gstin: '',
    contactPerson: '',
    businessAddress: '',
    contractTier: 'Standard' as BusinessProfile['contractTier'],
    employeeId: '',
    assignedZoneId: 'zone-blr-north-hebbal',
    vehicleNumber: '',
    vehicleType: 'E-Cargo Van' as ExecutiveProfile['vehicleType'],
    availabilityStatus: 'available' as ExecutiveProfile['availabilityStatus'],
    upiId: '',
    loyaltyPoints: 0,
    walletBalance: 0,
    addressLine1: '',
    addressPinCode: '560092',
  });
  const [confirmDeactivateUser, setConfirmDeactivateUser] = useState<User | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);

  // Pricing Form
  const [rateForm, setRateForm] = useState({
    categoryId: state.categories[0]?.id || 'cat-newspapers',
    city: 'Bengaluru',
    zoneId: state.serviceZones[0]?.id || 'zone-blr-north-hebbal',
    customerType: 'b2c' as 'b2c' | 'b2b',
    qualityGrade: 'Standard' as 'Standard' | 'Sorted Clean' | 'Industrial Bulk',
    ratePerUnit: 18,
    effectiveFrom: new Date().toISOString().split('T')[0],
    note: 'Market rate adjustment',
  });

  // Category & Subcategory Forms
  const [newCatForm, setNewCatForm] = useState({ name: '', description: '', co2FactorPerKg: 1.8, unit: 'kg' as 'kg' | 'piece' });
  const [newSubForm, setNewSubForm] = useState({ categoryId: state.categories[0]?.id || 'cat-newspapers', name: '', qualityNote: '', unit: 'kg' as 'kg' | 'piece' });

  // Order inspection & smart assignment modal
  const [assignModalOrder, setAssignModalOrder] = useState<PickupOrder | null>(null);
  const [inspectOrder, setInspectOrder] = useState<PickupOrder | null>(null);
  const [reschedDate, setReschedDate] = useState('');
  const [reschedSlot, setReschedSlot] = useState('');

  // B2B Quotation pricing modal
  const [pricingQuote, setPricingQuote] = useState<Quotation | null>(null);
  const [quoteRatesMap, setQuoteRatesMap] = useState<Record<string, number>>({});
  const [quoteAdminNote, setQuoteAdminNote] = useState('');

  // Service Area form (Bengaluru North B2C & Industrial B2B)
  const [newZoneForm, setNewZoneForm] = useState({
    name: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    serviceSegment: 'b2c' as 'b2c' | 'b2b' | 'all',
    pinCodesRaw: '',
  });

  const openEditUserModal = (u: User) => {
    const cp = state.customerProfiles.find((p) => p.userId === u.id);
    const bp = state.businessProfiles.find((p) => p.userId === u.id);
    const ep = state.executiveProfiles.find((p) => p.userId === u.id);
    const addr = state.addresses.find((a) => a.userId === u.id);
    setEditUserForm({
      name: u.name,
      email: u.email,
      mobile: u.mobile,
      status: u.status,
      password: '',
      companyName: bp?.companyName || u.name,
      gstin: bp?.gstin || '',
      contactPerson: bp?.contactPerson || '',
      businessAddress: bp?.businessAddress || '',
      contractTier: bp?.contractTier || 'Standard',
      employeeId: ep?.employeeId || '',
      assignedZoneId: ep?.assignedZoneId || state.serviceZones[0]?.id || 'zone-blr-north-hebbal',
      vehicleNumber: ep?.vehicleNumber || '',
      vehicleType: ep?.vehicleType || 'E-Cargo Van',
      availabilityStatus: ep?.availabilityStatus || 'available',
      upiId: cp?.upiId || '',
      loyaltyPoints: cp?.loyaltyPoints || 0,
      walletBalance: cp?.walletBalance || 0,
      addressLine1: addr?.line1 || '',
      addressPinCode: addr?.pinCode || '560092',
    });
    setEditingUser(u);
  };

  // CMS editor
  const [cmsDraft, setCmsDraft] = useState(state.cms);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

  // Coupon form
  const [newCoupon, setNewCoupon] = useState({ code: '', title: '', bonusPercent: 10, minWeightKg: 20, validUntil: '2026-12-31' });

  // Support ticket reply
  const [replyTicket, setReplyTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  // Admin-Only Google Drive Vault State
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'logins' | 'bookings' | 'scrap_sold' | 'payments' | 'quotations_admin'>('all');
  const [viewLedgerRecord, setViewLedgerRecord] = useState<DriveLedgerRecord | null>(null);
  const [editingLedgerRecord, setEditingLedgerRecord] = useState<DriveLedgerRecord | null>(null);
  const [editLedgerDraft, setEditLedgerDraft] = useState({
    summary: '',
    referenceCode: '',
    weightKg: '',
    amountInr: '',
    city: 'Bengaluru',
    pinCode: '',
  });
  const [confirmSaveLedgerEdit, setConfirmSaveLedgerEdit] = useState(false);
  const [confirmDeleteLedger, setConfirmDeleteLedger] = useState<DriveLedgerRecord | null>(null);

  const [driveFileBusyId, setDriveFileBusyId] = useState<string | null>(null);
  const [viewDriveFileModal, setViewDriveFileModal] = useState<{ file: DriveVaultFile; content: string } | null>(null);
  const [editDriveFileModal, setEditDriveFileModal] = useState<{ file: DriveVaultFile; fileName: string; content: string } | null>(null);
  const [confirmSaveDriveFileEdit, setConfirmSaveDriveFileEdit] = useState(false);
  const [confirmDeleteDriveFileModal, setConfirmDeleteDriveFileModal] = useState<DriveVaultFile | null>(null);

  if (!currentUser) return null;

  const b2cUsers = state.users.filter((u) => u.role === 'b2c');
  const b2bUsers = state.users.filter((u) => u.role === 'b2b');
  const execUsers = state.users.filter((u) => u.role === 'executive');
  const adminUsers = state.users.filter((u) => u.role === 'admin');

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysBookings = state.orders.filter((o) => o.createdAt.startsWith(todayStr) || o.scheduledDate === todayStr);
  const pendingPickups = state.orders.filter((o) => !['payment_completed', 'cancelled'].includes(o.status));
  const completedPickups = state.orders.filter((o) => o.status === 'payment_completed');
  const totalScrapKg = Math.round(completedPickups.reduce((s, o) => s + (o.actualTotalWeight || 0), 0) * 10) / 10;
  const totalPayouts = state.payments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const platformRevenue = state.payments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.platformFee, 0);
  const pendingPaymentsValue = pendingPickups.reduce((s, o) => s + o.estimatedTotalAmount, 0);

  // Analytics derived strictly from central database records
  const categoryVolumeChart = useMemo(() => {
    const map: Record<string, number> = {};
    completedPickups.forEach((o) =>
      o.items.forEach((i) => {
        map[i.categoryName] = (map[i.categoryName] || 0) + (i.actualQty ?? i.estimatedQty);
      })
    );
    const colors = ['#174B37', '#28A66A', '#A5D66D', '#528265', '#2E6F56', '#7AB87C'];
    return Object.entries(map).map(([label, value], i) => ({
      label,
      value: Math.round(value * 10) / 10,
      color: colors[i % colors.length],
    }));
  }, [completedPickups]);

  const cityCollectionsChart = useMemo(() => {
    const map: Record<string, { kg: number; revenue: number }> = {};
    completedPickups.forEach((o) => {
      if (!map[o.city]) map[o.city] = { kg: 0, revenue: 0 };
      map[o.city].kg += o.actualTotalWeight || 0;
      map[o.city].revenue += o.finalAmount || 0;
    });
    return Object.entries(map).map(([label, vals]) => ({
      label,
      value: Math.round(vals.kg),
      secondaryValue: Math.round(vals.revenue / 100),
    }));
  }, [completedPickups]);

  const repeatBookingPct = useMemo(() => {
    const counts: Record<string, number> = {};
    state.orders.forEach((o) => {
      counts[o.customerUserId] = (counts[o.customerUserId] || 0) + 1;
    });
    const totalCustomersWithOrders = Object.keys(counts).length;
    if (totalCustomersWithOrders === 0) return 0;
    const repeaters = Object.values(counts).filter((c) => c > 1).length;
    return Math.round((repeaters / totalCustomersWithOrders) * 100);
  }, [state.orders]);

  const avgOrderValue = completedPickups.length > 0 ? Math.round(totalPayouts / completedPickups.length) : 0;

  const handleExportMasterCsv = () => {
    const header = 'OrderNumber,Customer,Role,City,ScheduledDate,Status,WeightKg,FinalAmountINR\n';
    const rows = state.orders
      .map(
        (o) =>
          `${o.orderNumber},"${o.customerName}",${o.customerRole},${o.city},${o.scheduledDate},${o.status},${
            o.actualTotalWeight ?? o.estimatedTotalWeight
          },${o.finalAmount ?? o.estimatedTotalAmount}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Punarchakra_Master_Report_${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('success', 'Master Excel/CSV report downloaded');
  };

  const handleExportUsersCsv = () => {
    const header = 'ID,Role,Name,Email,Mobile,Status,CreatedAt\n';
    const rows = state.users
      .map((u) => `${u.id},${u.role},"${u.name}",${u.email},${u.mobile},${u.status},${u.createdAt}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Punarchakra_Users_${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('success', 'Users CSV exported');
  };

  const NAV_GROUPS: { group: string; items: { id: AdminTab; label: string; Icon: React.ElementType }[] }[] = [
    {
      group: 'Command Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
        { id: 'analytics', label: 'Reports & Analytics', Icon: BarChart3 },
        { id: 'environmental', label: 'Environmental Impact', Icon: Leaf },
      ],
    },
    {
      group: 'User & Partner Directory',
      items: [
        { id: 'users', label: 'User Management', Icon: Users },
        { id: 'b2c_customers', label: 'B2C Customers', Icon: Users },
        { id: 'b2b_customers', label: 'B2B Customers', Icon: Building2 },
        { id: 'executives', label: 'Pickup Executives', Icon: Truck },
        { id: 'admin_staff', label: 'Admin Staff', Icon: Shield },
      ],
    },
    {
      group: 'Catalog & Pricing',
      items: [
        { id: 'categories', label: 'Scrap Categories', Icon: Package },
        { id: 'subcategories', label: 'Scrap Subcategories', Icon: Layers },
        { id: 'pricing', label: 'Scrap Price Management', Icon: Tag },
      ],
    },
    {
      group: 'Operations & Finance',
      items: [
        { id: 'orders', label: 'Pickup Orders', Icon: Truck },
        { id: 'assignments', label: 'Executive Assignments', Icon: UserCheck },
        { id: 'quotations', label: 'B2B Quotations', Icon: FileText },
        { id: 'payments', label: 'Payments', Icon: CreditCard },
        { id: 'wallets', label: 'Wallet Management', Icon: Wallet },
      ],
    },
    {
      group: 'Platform & Governance',
      items: [
        { id: 'drive_vault', label: 'Google Drive Vault', Icon: HardDrive },
        { id: 'service_areas', label: 'Service Areas', Icon: MapPin },
        { id: 'cms', label: 'Website CMS', Icon: Globe },
        { id: 'notifications', label: 'Notifications', Icon: Bell },
        { id: 'tickets', label: 'Support Tickets', Icon: HelpCircle },
        { id: 'audit_logs', label: 'Audit Logs', Icon: Activity },
        { id: 'settings', label: 'Settings', Icon: Settings },
      ],
    },
  ];

  const allNavItems = NAV_GROUPS.flatMap((g) => g.items);

  return (
    <div className="min-h-screen bg-[#F7F9F6] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-68 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-[#202820]/10 z-30">
        <div className="h-16 px-5 flex items-center border-b border-[#202820]/10">
          <AppLogo onClick={() => navigateTo('public')} />
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {NAV_GROUPS.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold text-[#202820]/45">{grp.group}</p>
              {grp.items.map((item) => {
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
            </div>
          ))}
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

      <div className="flex-1 lg:pl-68 flex flex-col min-w-0">
        {/* Top Admin Header */}
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
                {allNavItems.find((i) => i.id === tab)?.label}
              </p>
              <p className="hidden sm:block text-xs text-[#202820]/55">
                Admin Master Control · {currentUser.name}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center relative w-72">
            <Search className="w-4 h-4 text-[#202820]/40 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Jump to order # or user..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && globalSearch.trim()) {
                  if (globalSearch.toUpperCase().startsWith('PNC')) setTab('orders');
                  else setTab('users');
                }
              }}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#202820]/12 bg-[#F7F9F6] text-xs focus:outline-none focus:ring-2 focus:ring-[#28A66A]/30"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PortalSwitcherDropdown compact />
            <LanguageToggleButton language={language} onToggle={toggleLanguage} />
            <Button variant="outline" size="sm" onClick={() => navigateTo('public')}>
              Public Site
            </Button>
            <Button size="sm" onClick={handleExportMasterCsv}>
              <Download className="w-4 h-4" />
              Export CSV
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
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {NAV_GROUPS.map((grp) => (
                  <div key={grp.group} className="space-y-1">
                    <p className="px-3 text-[11px] font-semibold text-[#202820]/45">{grp.group}</p>
                    {grp.items.map((item) => {
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
                ))}
              </div>
            </div>
          </div>
        )}

        <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* 1. DASHBOARD */}
          {tab === 'dashboard' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-bold text-lg text-[#174B37]">Platform Command Metrics</h2>
                <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-[#202820]/10">
                  {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAnalyticsPeriod(p)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize cursor-pointer ${
                        analyticsPeriod === p ? 'bg-[#174B37] text-white' : 'text-[#202820]/65'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Total B2C Users</span>
                  <p className="font-display text-2xl font-bold text-[#174B37] mt-1 tabular-nums">{b2cUsers.length}</p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Total B2B Users</span>
                  <p className="font-display text-2xl font-bold text-[#174B37] mt-1 tabular-nums">{b2bUsers.length}</p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Total Executives</span>
                  <p className="font-display text-2xl font-bold text-[#174B37] mt-1 tabular-nums">{execUsers.length}</p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Today’s Bookings</span>
                  <p className="font-display text-2xl font-bold text-[#28A66A] mt-1 tabular-nums">{todaysBookings.length}</p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Pending Pickups</span>
                  <p className="font-display text-2xl font-bold text-[#D97706] mt-1 tabular-nums">{pendingPickups.length}</p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Completed Pickups</span>
                  <p className="font-display text-2xl font-bold text-[#174B37] mt-1 tabular-nums">{completedPickups.length}</p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Total Scrap Collected</span>
                  <p className="font-display text-2xl font-bold text-[#174B37] mt-1 tabular-nums">{totalScrapKg} kg</p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Total Payouts</span>
                  <p className="font-display text-2xl font-bold text-[#174B37] mt-1 tabular-nums">
                    ₹{totalPayouts.toLocaleString('en-IN')}
                  </p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Platform Revenue (8%)</span>
                  <p className="font-display text-2xl font-bold text-[#28A66A] mt-1 tabular-nums">
                    ₹{platformRevenue.toLocaleString('en-IN')}
                  </p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Pending Payments Est.</span>
                  <p className="font-display text-2xl font-bold text-[#D97706] mt-1 tabular-nums">
                    ₹{pendingPaymentsValue.toLocaleString('en-IN')}
                  </p>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card padding="md">
                  <h3 className="font-display font-bold text-base text-[#174B37] mb-4">
                    City-Wise Collections ({analyticsPeriod})
                  </h3>
                  <SimpleBarChart
                    data={cityCollectionsChart}
                    primaryLabel="Weight (kg)"
                    secondaryLabel="Payout (₹100s)"
                  />
                </Card>
                <Card padding="md">
                  <h3 className="font-display font-bold text-base text-[#174B37] mb-4">
                    Scrap Category Volume Trends
                  </h3>
                  <DonutBreakdownChart
                    segments={categoryVolumeChart}
                    centerLabel="Collected"
                    centerValue={`${totalScrapKg} kg`}
                  />
                </Card>
              </div>
            </>
          )}

          {/* 2–6. USER MANAGEMENT */}
          {(['users', 'b2c_customers', 'b2b_customers', 'executives', 'admin_staff'] as AdminTab[]).includes(tab) && (
            <Card padding="md" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-lg text-[#174B37]">
                    {allNavItems.find((i) => i.id === tab)?.label}
                  </h2>
                  <p className="text-xs text-[#202820]/60">
                    Manage active accounts, deactivate/reactivate access, revoke sessions, or export records.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleExportUsersCsv}>
                    <Download className="w-4 h-4" />
                    Export Users
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const defaultRole: UserRole =
                        tab === 'b2c_customers'
                          ? 'b2c'
                          : tab === 'b2b_customers'
                          ? 'b2b'
                          : tab === 'executives'
                          ? 'executive'
                          : 'admin';
                      setNewUserForm((f) => ({ ...f, role: defaultRole }));
                      setShowAddUser(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Provision User
                  </Button>
                </div>
              </div>

              <DataTable
                data={state.users.filter((u) => {
                  if (tab === 'b2c_customers') return u.role === 'b2c';
                  if (tab === 'b2b_customers') return u.role === 'b2b';
                  if (tab === 'executives') return u.role === 'executive';
                  if (tab === 'admin_staff') return u.role === 'admin';
                  return true;
                })}
                searchFilter={(u, q) =>
                  u.name.toLowerCase().includes(q) ||
                  u.email.toLowerCase().includes(q) ||
                  u.id.toLowerCase().includes(q)
                }
                searchPlaceholder="Search by name, email, or unique ID..."
                columns={[
                  { key: 'id', header: 'User ID', render: (u) => <span className="font-mono text-xs text-[#174B37]">{u.id}</span> },
                  {
                    key: 'name',
                    header: 'Name / Account',
                    render: (u) => (
                      <div>
                        <p className="font-semibold text-sm">{u.name}</p>
                        <p className="text-xs text-[#202820]/60">{u.email} · {u.mobile}</p>
                      </div>
                    ),
                  },
                  { key: 'role', header: 'Role', render: (u) => <span className="font-mono text-xs uppercase font-semibold">{u.role}</span> },
                  { key: 'status', header: 'Status', render: (u) => <StatusIndicator status={u.status} /> },
                  {
                    key: 'act',
                    header: 'Governance (Add / Edit / Delete)',
                    align: 'right',
                    render: (u) => (
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => openEditUserModal(u)}>
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => adminRevokeUserSession(u.id)}>
                          Revoke Session
                        </Button>
                        {u.status === 'active' ? (
                          <Button size="sm" variant="outline" onClick={() => setConfirmDeactivateUser(u)}>
                            Deactivate
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => adminToggleUserStatus(u.id, 'active')}>
                            Reactivate
                          </Button>
                        )}
                        {u.id !== currentUser.id && (
                          <Button size="sm" variant="danger" onClick={() => setConfirmDeleteUser(u)}>
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </Button>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          )}

          {/* 7 & 8. CATEGORIES & SUBCATEGORIES */}
          {(tab === 'categories' || tab === 'subcategories') && (
            <div className="space-y-6">
              <Card padding="md" className="space-y-4">
                <h3 className="font-display font-bold text-base text-[#174B37]">
                  {tab === 'categories' ? 'Add Scrap Category' : 'Add Scrap Subcategory'}
                </h3>
                {tab === 'categories' ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      adminAddCategory({
                        name: newCatForm.name,
                        slug: newCatForm.name.toLowerCase().replace(/\s+/g, '-'),
                        description: newCatForm.description,
                        co2FactorPerKg: newCatForm.co2FactorPerKg,
                        unit: newCatForm.unit,
                        imageUrl: state.categories[0]?.imageUrl || '',
                        isActive: true,
                      });
                      setNewCatForm({ name: '', description: '', co2FactorPerKg: 1.8, unit: 'kg' });
                    }}
                    className="grid sm:grid-cols-4 gap-3 items-end"
                  >
                    <Input label="Category Name" required value={newCatForm.name} onChange={(e) => setNewCatForm((f) => ({ ...f, name: e.target.value }))} />
                    <Input label="Description" required value={newCatForm.description} onChange={(e) => setNewCatForm((f) => ({ ...f, description: e.target.value }))} />
                    <Select label="Unit" value={newCatForm.unit} onChange={(e) => setNewCatForm((f) => ({ ...f, unit: e.target.value as 'kg' | 'piece' }))}>
                      <option value="kg">kg</option>
                      <option value="piece">piece</option>
                    </Select>
                    <Button type="submit">Add Category</Button>
                  </form>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      adminAddSubcategory({
                        ...newSubForm,
                        isActive: true,
                      });
                      setNewSubForm((f) => ({ ...f, name: '', qualityNote: '' }));
                    }}
                    className="grid sm:grid-cols-4 gap-3 items-end"
                  >
                    <Select label="Parent Category" value={newSubForm.categoryId} onChange={(e) => setNewSubForm((f) => ({ ...f, categoryId: e.target.value }))}>
                      {state.categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                    <Input label="Subcategory Name" required value={newSubForm.name} onChange={(e) => setNewSubForm((f) => ({ ...f, name: e.target.value }))} />
                    <Input label="Quality Note" required value={newSubForm.qualityNote} onChange={(e) => setNewSubForm((f) => ({ ...f, qualityNote: e.target.value }))} />
                    <Button type="submit">Add Subcategory</Button>
                  </form>
                )}
              </Card>

              <Card padding="md">
                {tab === 'categories' ? (
                  <DataTable
                    data={state.categories}
                    pageSize={12}
                    columns={[
                      { key: 'n', header: 'Category', render: (c) => <span className="font-semibold text-[#174B37]">{c.name}</span> },
                      { key: 'u', header: 'Unit', render: (c) => <span className="text-xs uppercase">{c.unit}</span> },
                      { key: 'co2', header: 'CO₂ Factor', render: (c) => <span className="font-mono text-xs">{c.co2FactorPerKg} kg/kg</span> },
                      { key: 's', header: 'Status', render: (c) => <StatusIndicator status={c.isActive ? 'active' : 'deactivated'} /> },
                      {
                        key: 'a',
                        header: 'Toggle',
                        align: 'right',
                        render: (c) => (
                          <Button size="sm" variant="outline" onClick={() => adminToggleCategory(c.id)}>
                            {c.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        ),
                      },
                    ]}
                  />
                ) : (
                  <DataTable
                    data={state.subcategories}
                    columns={[
                      { key: 'n', header: 'Subcategory', render: (s) => <span className="font-semibold text-[#174B37]">{s.name}</span> },
                      { key: 'p', header: 'Parent', render: (s) => <span className="text-xs">{state.categories.find((c) => c.id === s.categoryId)?.name}</span> },
                      { key: 'q', header: 'Quality Note', render: (s) => <span className="text-xs text-[#202820]/70">{s.qualityNote}</span> },
                    ]}
                  />
                )}
              </Card>
            </div>
          )}

          {/* 9. SCRAP PRICE MANAGEMENT */}
          {tab === 'pricing' && (
            <div className="space-y-6">
              <Card padding="lg">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-display font-bold text-lg text-[#174B37] mb-1">
                      Publish Bengaluru / Zone / Contract Scrap Rate
                    </h2>
                    <p className="text-xs text-[#202820]/60">
                      Published updates immediately reflect in the Customer Portal, B2B Portal, and Homepage Price Calculator.
                    </p>
                    {lastRatesSyncAt && (
                      <p className="text-[11px] font-mono text-[#28A66A] mt-1">
                        Online Sync: {new Date(lastRatesSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {ratesSyncSource}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={syncLiveRatesOnline} disabled={isLoading}>
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Syncing...' : 'Sync Live Rates Online'}
                  </Button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    adminUpsertRate({ ...rateForm, city: 'Bengaluru' });
                  }}
                  className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4 items-end"
                >
                  <Select label="Scrap Category" value={rateForm.categoryId} onChange={(e) => setRateForm((f) => ({ ...f, categoryId: e.target.value }))}>
                    {state.categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                  <Input label="City (Exclusive)" value="Bengaluru" readOnly />
                  <Select label="Customer Segment" value={rateForm.customerType} onChange={(e) => setRateForm((f) => ({ ...f, customerType: e.target.value as 'b2c' | 'b2b' }))}>
                    <option value="b2c">B2C Household</option>
                    <option value="b2b">B2B Enterprise Contract</option>
                  </Select>
                  <Select label="Quality Grade" value={rateForm.qualityGrade} onChange={(e) => setRateForm((f) => ({ ...f, qualityGrade: e.target.value as typeof rateForm.qualityGrade }))}>
                    <option value="Standard">Standard</option>
                    <option value="Sorted Clean">Sorted Clean</option>
                    <option value="Industrial Bulk">Industrial Bulk</option>
                  </Select>
                  <Input
                    label="Rate (₹ per unit)"
                    type="number"
                    min={1}
                    required
                    value={rateForm.ratePerUnit}
                    onChange={(e) => setRateForm((f) => ({ ...f, ratePerUnit: Number(e.target.value) }))}
                  />
                  <Input
                    label="Effective Date"
                    type="date"
                    required
                    value={rateForm.effectiveFrom}
                    onChange={(e) => setRateForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
                  />
                  <Input
                    label="Revision Note"
                    required
                    value={rateForm.note}
                    onChange={(e) => setRateForm((f) => ({ ...f, note: e.target.value }))}
                  />
                  <Button type="submit">Publish Rate Live</Button>
                </form>
              </Card>

              <Card padding="md">
                <h3 className="font-display font-bold text-base text-[#174B37] mb-3">Active Rates & History</h3>
                <DataTable
                  data={state.rates}
                  searchFilter={(r, q) => {
                    const catName = state.categories.find((c) => c.id === r.categoryId)?.name || '';
                    return catName.toLowerCase().includes(q) || r.city.toLowerCase().includes(q);
                  }}
                  columns={[
                    { key: 'cat', header: 'Material', render: (r) => <span className="font-semibold text-[#174B37]">{state.categories.find((c) => c.id === r.categoryId)?.name}</span> },
                    { key: 'seg', header: 'Segment', render: (r) => <span className="font-mono text-xs uppercase">{r.customerType} · {r.qualityGrade}</span> },
                    { key: 'city', header: 'City', render: (r) => <span className="text-xs">{r.city}</span> },
                    { key: 'eff', header: 'Effective', render: (r) => <span className="font-mono text-xs">{r.effectiveFrom}</span> },
                    { key: 'hist', header: 'Revisions', render: (r) => <span className="text-xs text-[#202820]/65">{r.history.length} entries</span> },
                    { key: 'rate', header: 'Published Rate', align: 'right', render: (r) => <span className="font-mono font-bold text-[#28A66A]">₹{r.ratePerUnit}</span> },
                  ]}
                />
              </Card>
            </div>
          )}

          {/* 10 & 11. PICKUP ORDERS & SMART EXECUTIVE ASSIGNMENTS */}
          {(tab === 'orders' || tab === 'assignments') && (
            <Card padding="md" className="space-y-4">
              <h2 className="font-display font-bold text-lg text-[#174B37]">
                {tab === 'assignments' ? 'Smart Executive Dispatch & Workload Balancing' : 'All Pickup Orders'}
              </h2>
              <DataTable
                data={state.orders}
                searchFilter={(o, q) =>
                  o.orderNumber.toLowerCase().includes(q) ||
                  o.customerName.toLowerCase().includes(q) ||
                  o.city.toLowerCase().includes(q)
                }
                columns={[
                  {
                    key: 'num',
                    header: 'Order #',
                    render: (o) => (
                      <div>
                        <span className="font-mono font-semibold text-[#174B37]">{o.orderNumber}</span>
                        <span className="block text-[11px] uppercase text-[#202820]/55">{o.customerRole}</span>
                      </div>
                    ),
                  },
                  {
                    key: 'cust',
                    header: 'Customer & Location',
                    render: (o) => (
                      <div>
                        <p className="font-semibold text-xs">{o.customerName}</p>
                        <p className="text-[11px] text-[#202820]/60">{o.city} ({o.pinCode})</p>
                      </div>
                    ),
                  },
                  { key: 'exec', header: 'Executive', render: (o) => <span className="text-xs font-medium">{o.assignedExecutiveName || 'Unassigned'}</span> },
                  { key: 'status', header: 'Status', render: (o) => <StatusIndicator status={o.status} /> },
                  { key: 'val', header: 'Amount', align: 'right', render: (o) => <span className="font-mono font-bold">₹{(o.finalAmount ?? o.estimatedTotalAmount).toLocaleString('en-IN')}</span> },
                  {
                    key: 'act',
                    header: 'Actions',
                    align: 'right',
                    render: (o) => (
                      <div className="flex items-center justify-end gap-2">
                        {!['payment_completed', 'cancelled'].includes(o.status) && (
                          <Button size="sm" onClick={() => setAssignModalOrder(o)}>
                            Smart Assign
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setInspectOrder(o);
                            setReschedDate(o.scheduledDate);
                            setReschedSlot(o.timeSlot);
                          }}
                        >
                          Inspect
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          )}

          {/* 12. B2B QUOTATIONS */}
          {tab === 'quotations' && (
            <Card padding="md" className="space-y-4">
              <h2 className="font-display font-bold text-lg text-[#174B37]">B2B Enterprise Quotation Desk</h2>
              <DataTable
                data={state.quotations}
                columns={[
                  { key: 'q', header: 'Quote #', render: (q) => <span className="font-mono font-semibold text-[#174B37]">{q.quoteNumber}</span> },
                  { key: 'b', header: 'Business', render: (q) => <span className="text-xs font-semibold">{q.businessName}</span> },
                  { key: 'w', header: 'Est. Weight', align: 'right', render: (q) => <span className="font-mono">{q.totalEstimatedWeightKg} kg</span> },
                  { key: 's', header: 'Status', render: (q) => <StatusIndicator status={q.status} /> },
                  { key: 'amt', header: 'Quoted Total', align: 'right', render: (q) => <span className="font-mono font-bold">{q.totalQuotedAmount ? `₹${q.totalQuotedAmount.toLocaleString('en-IN')}` : '—'}</span> },
                  {
                    key: 'act',
                    header: 'Pricing',
                    align: 'right',
                    render: (q) => (
                      <Button
                        size="sm"
                        onClick={() => {
                          setPricingQuote(q);
                          const init: Record<string, number> = {};
                          q.items.forEach((it) => {
                            init[it.id] = it.proposedRate || 30;
                          });
                          setQuoteRatesMap(init);
                          setQuoteAdminNote(q.adminNotes || '');
                        }}
                      >
                        Prepare / Update Quote
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>
          )}

          {/* 13. PAYMENTS */}
          {tab === 'payments' && (
            <Card padding="md" className="space-y-4">
              <h2 className="font-display font-bold text-lg text-[#174B37]">Financial Reconciliation & Payouts</h2>
              <DataTable
                data={state.payments}
                searchFilter={(p, q) => p.receiptNumber.toLowerCase().includes(q) || p.userName.toLowerCase().includes(q)}
                columns={[
                  { key: 'r', header: 'Receipt #', render: (p) => <span className="font-mono font-semibold text-[#174B37]">{p.receiptNumber}</span> },
                  { key: 'u', header: 'Recipient', render: (p) => <span className="text-xs font-medium">{p.userName} ({p.userRole.toUpperCase()})</span> },
                  { key: 'm', header: 'Method', render: (p) => <span className="text-xs">{p.method}</span> },
                  { key: 'fee', header: 'Platform Fee', align: 'right', render: (p) => <span className="font-mono text-xs">₹{p.platformFee}</span> },
                  { key: 'amt', header: 'Payout', align: 'right', render: (p) => <span className="font-mono font-bold">₹{p.amount.toLocaleString('en-IN')}</span> },
                  { key: 's', header: 'Status', render: (p) => <StatusIndicator status={p.status} /> },
                  {
                    key: 'act',
                    header: 'Reconcile',
                    align: 'right',
                    render: (p) => (
                      <Select
                        value={p.status}
                        onChange={(e) => adminUpdatePaymentStatus(p.id, e.target.value as Payment['status'])}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="refunded">Refunded</option>
                      </Select>
                    ),
                  },
                ]}
              />
            </Card>
          )}

          {/* 14. WALLET MANAGEMENT */}
          {tab === 'wallets' && (
            <Card padding="md">
              <h2 className="font-display font-bold text-lg text-[#174B37] mb-4">Customer Wallet & Loyalty Ledgers</h2>
              <DataTable
                data={state.customerProfiles}
                columns={[
                  {
                    key: 'u',
                    header: 'Customer',
                    render: (c) => <span className="font-semibold text-sm">{state.users.find((u) => u.id === c.userId)?.name}</span>,
                  },
                  { key: 'ref', header: 'Referral Code', render: (c) => <span className="font-mono text-xs">{c.referralCode}</span> },
                  { key: 'pts', header: 'Loyalty Points', align: 'right', render: (c) => <span className="font-mono font-semibold">{c.loyaltyPoints} pts</span> },
                  { key: 'bal', header: 'Wallet Balance', align: 'right', render: (c) => <span className="font-mono font-bold text-[#28A66A]">₹{c.walletBalance.toLocaleString('en-IN')}</span> },
                ]}
              />
            </Card>
          )}

          {/* 15. NOTIFICATIONS */}
          {tab === 'notifications' && (
            <Card padding="md">
              <h2 className="font-display font-bold text-lg text-[#174B37] mb-4">Platform Dispatch & Alert Log</h2>
              <DataTable
                data={state.notifications}
                columns={[
                  { key: 'ch', header: 'Channel', render: (n) => <span className="font-mono text-xs uppercase">{n.channel}</span> },
                  { key: 't', header: 'Title', render: (n) => <span className="font-semibold text-xs">{n.title}</span> },
                  { key: 'm', header: 'Message', render: (n) => <span className="text-xs text-[#202820]/70">{n.message}</span> },
                ]}
              />
            </Card>
          )}

          {/* 16 & 17. ANALYTICS & ENVIRONMENTAL IMPACT */}
          {(tab === 'analytics' || tab === 'environmental') && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-4 gap-4">
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Repeat Booking %</span>
                  <p className="font-display text-2xl font-bold text-[#174B37] mt-1 tabular-nums">{repeatBookingPct}%</p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Average Order Value</span>
                  <p className="font-display text-2xl font-bold text-[#174B37] mt-1 tabular-nums">
                    ₹{avgOrderValue.toLocaleString('en-IN')}
                  </p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Waste Diverted</span>
                  <p className="font-display text-2xl font-bold text-[#28A66A] mt-1 tabular-nums">{totalScrapKg} kg</p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#202820]/60">Estimated CO₂ Avoided</span>
                  <p className="font-display text-2xl font-bold text-[#174B37] mt-1 tabular-nums">
                    {Math.round(totalScrapKg * 2.1)} kg
                  </p>
                </Card>
              </div>
              <Card padding="md" className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-base text-[#174B37]">Executive Performance Leaderboard</h3>
                  <p className="text-xs text-[#202820]/60">Ranked by verified completed pickups and customer rating.</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.print()}>Print PDF</Button>
                  <Button size="sm" onClick={handleExportMasterCsv}>Download Excel/CSV</Button>
                </div>
              </Card>
              <Card padding="md">
                <DataTable
                  data={state.executiveProfiles}
                  columns={[
                    { key: 'id', header: 'Emp ID', render: (e) => <span className="font-mono text-xs">{e.employeeId}</span> },
                    { key: 'n', header: 'Executive', render: (e) => <span className="font-semibold text-sm">{state.users.find((u) => u.id === e.userId)?.name}</span> },
                    { key: 'v', header: 'Vehicle', render: (e) => <span className="text-xs">{e.vehicleType} ({e.vehicleNumber})</span> },
                    { key: 'c', header: 'Completed Jobs', align: 'right', render: (e) => <span className="font-mono font-bold">{e.completedPickupsCount}</span> },
                    { key: 'r', header: 'Rating', align: 'right', render: (e) => <span className="font-mono">{e.rating} / 5</span> },
                  ]}
                />
              </Card>
            </div>
          )}

          {/* 18. WEBSITE CMS */}
          {tab === 'cms' && (
            <div className="space-y-6">
              <Card padding="lg" className="space-y-4">
                <h2 className="font-display font-bold text-lg text-[#174B37]">Homepage CMS & Promotions</h2>
                <Input label="Hero Headline" value={cmsDraft.heroHeadline} onChange={(e) => setCmsDraft((c) => ({ ...c, heroHeadline: e.target.value }))} />
                <Textarea label="Hero Subheading" rows={2} value={cmsDraft.heroSubheading} onChange={(e) => setCmsDraft((c) => ({ ...c, heroSubheading: e.target.value }))} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Announcement Banner" value={cmsDraft.announcementBanner} onChange={(e) => setCmsDraft((c) => ({ ...c, announcementBanner: e.target.value }))} />
                  <Input label="Active Offer Text" value={cmsDraft.activeOfferText} onChange={(e) => setCmsDraft((c) => ({ ...c, activeOfferText: e.target.value }))} />
                </div>
                <div className="pt-2 border-t border-[#202820]/10 space-y-3">
                  <h4 className="font-display font-bold text-sm text-[#174B37]">Add FAQ Item</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Input placeholder="Question" value={newFaq.question} onChange={(e) => setNewFaq((f) => ({ ...f, question: e.target.value }))} />
                    <Input placeholder="Answer" value={newFaq.answer} onChange={(e) => setNewFaq((f) => ({ ...f, answer: e.target.value }))} />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!newFaq.question || !newFaq.answer) return;
                      setCmsDraft((c) => ({ ...c, faqs: [...c.faqs, { id: `faq-${Date.now()}`, ...newFaq }] }));
                      setNewFaq({ question: '', answer: '' });
                    }}
                  >
                    + Append FAQ
                  </Button>
                </div>
                <Button onClick={() => adminUpdateCms(cmsDraft)}>Publish Homepage Changes Live</Button>
              </Card>

              <Card padding="md" className="space-y-4">
                <h3 className="font-display font-bold text-base text-[#174B37]">Promotional Coupons</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    adminAddCoupon({ ...newCoupon, isActive: true });
                    setNewCoupon({ code: '', title: '', bonusPercent: 10, minWeightKg: 20, validUntil: '2026-12-31' });
                  }}
                  className="grid sm:grid-cols-4 gap-3 items-end"
                >
                  <Input label="Code" required value={newCoupon.code} onChange={(e) => setNewCoupon((c) => ({ ...c, code: e.target.value.toUpperCase() }))} />
                  <Input label="Offer Title" required value={newCoupon.title} onChange={(e) => setNewCoupon((c) => ({ ...c, title: e.target.value }))} />
                  <Input label="Bonus %" type="number" value={newCoupon.bonusPercent} onChange={(e) => setNewCoupon((c) => ({ ...c, bonusPercent: Number(e.target.value) }))} />
                  <Button type="submit">Create Coupon</Button>
                </form>
              </Card>
            </div>
          )}

          {/* 19. SERVICE AREAS */}
          {tab === 'service_areas' && (
            <div className="space-y-6">
              <Card padding="md">
                <h2 className="font-display font-bold text-lg text-[#174B37] mb-3">
                  Add Bengaluru Service Corridor / PIN Codes
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    adminAddServiceZone({
                      name: newZoneForm.name,
                      city: 'Bengaluru',
                      state: 'Karnataka',
                      serviceSegment: newZoneForm.serviceSegment,
                      pinCodes: newZoneForm.pinCodesRaw.split(',').map((p) => p.trim()).filter(Boolean),
                      isActive: true,
                      dailySlots: ['09:00 AM - 12:00 PM', '02:00 PM - 05:00 PM'],
                    });
                    setNewZoneForm({ name: '', city: 'Bengaluru', state: 'Karnataka', serviceSegment: 'b2c', pinCodesRaw: '' });
                  }}
                  className="grid sm:grid-cols-4 gap-3 items-end"
                >
                  <Input
                    label="Bengaluru Zone Name"
                    required
                    placeholder="e.g. North Bengaluru (Hebbal) or Peenya Industrial"
                    value={newZoneForm.name}
                    onChange={(e) => setNewZoneForm((z) => ({ ...z, name: e.target.value }))}
                  />
                  <Select
                    label="Service Segment"
                    value={newZoneForm.serviceSegment}
                    onChange={(e) =>
                      setNewZoneForm((z) => ({ ...z, serviceSegment: e.target.value as 'b2c' | 'b2b' | 'all' }))
                    }
                  >
                    <option value="b2c">B2C — North Bengaluru</option>
                    <option value="b2b">B2B — Bengaluru Industrial Area</option>
                    <option value="all">Both B2C & B2B</option>
                  </Select>
                  <Input
                    label="Bengaluru PIN Codes (comma separated)"
                    required
                    placeholder="560092, 560024 or 560058"
                    value={newZoneForm.pinCodesRaw}
                    onChange={(e) => setNewZoneForm((z) => ({ ...z, pinCodesRaw: e.target.value }))}
                  />
                  <Button type="submit">Add Bengaluru Zone</Button>
                </form>
              </Card>
              <Card padding="md">
                <DataTable
                  data={state.serviceZones}
                  columns={[
                    { key: 'n', header: 'Zone', render: (z) => <span className="font-semibold text-[#174B37]">{z.name}</span> },
                    {
                      key: 'seg',
                      header: 'Segment',
                      render: (z) => (
                        <span className="text-xs font-semibold uppercase text-[#174B37]">
                          {z.serviceSegment === 'b2b'
                            ? 'B2B Industrial'
                            : z.serviceSegment === 'b2c'
                            ? 'B2C North BLR'
                            : 'B2C + B2B'}
                        </span>
                      ),
                    },
                    { key: 'p', header: 'PIN Codes', render: (z) => <span className="font-mono text-xs">{z.pinCodes.join(', ')}</span> },
                    { key: 's', header: 'Status', render: (z) => <StatusIndicator status={z.isActive ? 'active' : 'deactivated'} /> },
                    {
                      key: 't',
                      header: 'Toggle',
                      align: 'right',
                      render: (z) => (
                        <Button size="sm" variant="outline" onClick={() => adminToggleServiceZone(z.id)}>
                          {z.isActive ? 'Pause' : 'Enable'}
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            </div>
          )}

          {/* 20. SUPPORT TICKETS */}
          {tab === 'tickets' && (
            <Card padding="md">
              <h2 className="font-display font-bold text-lg text-[#174B37] mb-4">Support Tickets</h2>
              <DataTable
                data={state.supportTickets}
                columns={[
                  { key: 'num', header: 'Ticket #', render: (t) => <span className="font-mono font-semibold text-[#174B37]">{t.ticketNumber}</span> },
                  { key: 'u', header: 'User', render: (t) => <span className="text-xs">{t.userName} ({t.userRole.toUpperCase()})</span> },
                  { key: 's', header: 'Subject', render: (t) => <span className="text-xs font-medium">{t.subject}</span> },
                  { key: 'st', header: 'Status', render: (t) => <StatusIndicator status={t.status} /> },
                  {
                    key: 'act',
                    header: 'Reply',
                    align: 'right',
                    render: (t) => (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyTicket(t);
                          setReplyText(t.adminReply || '');
                        }}
                      >
                        Respond
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>
          )}

          {/* 21. GOOGLE DRIVE VAULT (ADMIN-ONLY VIEW, EDIT, DELETE) */}
          {tab === 'drive_vault' && currentUser.role === 'admin' && (
            <div className="space-y-6">
              {/* Connection & RBAC Guard Banner */}
              <Card padding="lg" className="border-[#174B37]/20">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#174B37] bg-[#A5D66D]/25 px-2.5 py-1 rounded-md">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Strict Admin-Only Google Drive Vault</span>
                    </div>
                    <h2 className="font-display font-bold text-xl text-[#174B37]">
                      Punarchakra End-to-End Lifecycle Vault (Login → Scrap Sold → Payment)
                    </h2>
                    <p className="text-xs text-[#202820]/70 max-w-3xl">
                      Every authentication session, pickup booking, digital weighing record, scrap sale, payment receipt, quotation, and admin change is captured into the master ledger and stored inside your Google Drive folder{' '}
                      <span className="font-mono font-semibold text-[#174B37]">Punarchakra Admin Audit Vault</span>. Only authenticated Administrators can view, edit, or delete Drive records.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {!driveConnectedEmail ? (
                      <button
                        type="button"
                        onClick={connectAdminGoogleDrive}
                        disabled={driveSyncing || isLoading}
                        className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#202820]/20 bg-white text-sm font-semibold text-[#202820] hover:bg-[#F7F9F6] shadow-xs cursor-pointer transition-colors"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24Z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                          />
                        </svg>
                        <span>Connect Google Drive</span>
                      </button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => syncAllLedgerToGoogleDrive()}
                          disabled={driveSyncing}
                        >
                          <RefreshCw className={`w-4 h-4 ${driveSyncing ? 'animate-spin' : ''}`} />
                          {driveSyncing ? 'Syncing Drive...' : 'Sync All to Drive'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={refreshDriveFiles} disabled={driveSyncing}>
                          Refresh Files
                        </Button>
                        <Button size="sm" variant="ghost" onClick={disconnectAdminGoogleDrive}>
                          Disconnect
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#202820]/10 grid sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#F7F9F6]">
                    <span className="text-[#202820]/60">Drive OAuth Status</span>
                    <p className="font-semibold text-[#174B37] mt-0.5 truncate">
                      {driveConnectedEmail ? `Connected (${driveConnectedEmail})` : 'Not Connected (In-Memory Token)'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F7F9F6]">
                    <span className="text-[#202820]/60">Captured Lifecycle Events</span>
                    <p className="font-display text-lg font-bold text-[#174B37] mt-0.5 tabular-nums">
                      {state.driveLedger.length} events
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F7F9F6]">
                    <span className="text-[#202820]/60">Scrap Sold & Settled</span>
                    <p className="font-display text-lg font-bold text-[#28A66A] mt-0.5 tabular-nums">
                      {state.driveLedger.filter((r) => r.eventType === 'SCRAP_SOLD').length} sales · ₹
                      {Math.round(
                        state.driveLedger
                          .filter((r) => r.eventType === 'PAYMENT_COMPLETED')
                          .reduce((s, r) => s + (r.amountInr || 0), 0)
                      ).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F7F9F6]">
                    <span className="text-[#202820]/60">Last Google Drive Sync</span>
                    <p className="font-mono text-xs font-semibold text-[#174B37] mt-1">
                      {lastDriveSyncAt ? new Date(lastDriveSyncAt).toLocaleString('en-IN') : 'Awaiting Drive sync'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Google Drive Vault Files (Live Drive API v3 CRUD) */}
              <Card padding="md">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-display font-bold text-base text-[#174B37] flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-[#28A66A]" />
                      <span>Google Drive Vault Files ({driveFiles.length})</span>
                    </h3>
                    <p className="text-xs text-[#202820]/60">
                      Files inside your Google Drive folder <span className="font-mono">Punarchakra Admin Audit Vault</span>. All edits & deletions require Admin confirmation.
                    </p>
                  </div>
                </div>

                {!driveConnectedEmail ? (
                  <EmptyState
                    title="Connect Google Drive to Manage Vault Files"
                    description="Click 'Connect Google Drive' above to create or open your Punarchakra Admin Audit Vault folder and view, edit, or delete synced JSON & CSV ledger files."
                  />
                ) : driveFiles.length === 0 ? (
                  <EmptyState
                    title="Vault Folder Empty"
                    description="Click 'Sync All to Drive' to write punarchakra_master_ledger.json, punarchakra_scrap_sold_and_payments.csv, and punarchakra_login_activity.csv."
                  />
                ) : (
                  <DataTable
                    data={driveFiles}
                    columns={[
                      {
                        key: 'name',
                        header: 'Drive File Name',
                        render: (f) => (
                          <div>
                            <p className="font-semibold text-xs text-[#174B37]">{f.name}</p>
                            <p className="text-[11px] text-[#202820]/55">{f.kindLabel || f.mimeType}</p>
                          </div>
                        ),
                      },
                      {
                        key: 'size',
                        header: 'Size',
                        render: (f) => (
                          <span className="font-mono text-xs tabular-nums">
                            {f.size ? `${Math.max(1, Math.round(Number(f.size) / 1024))} KB` : '—'}
                          </span>
                        ),
                      },
                      {
                        key: 'mod',
                        header: 'Last Modified',
                        render: (f) => (
                          <span className="font-mono text-xs">
                            {f.modifiedTime ? new Date(f.modifiedTime).toLocaleString('en-IN') : '—'}
                          </span>
                        ),
                      },
                      {
                        key: 'act',
                        header: 'Admin Controls',
                        align: 'right',
                        render: (f) => (
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={driveFileBusyId === f.id}
                              onClick={async () => {
                                try {
                                  setDriveFileBusyId(f.id);
                                  const content = await readDriveFile(f.id);
                                  setViewDriveFileModal({ file: f, content });
                                } catch (err) {
                                  notify('error', err instanceof Error ? err.message : 'Unable to read Drive file');
                                } finally {
                                  setDriveFileBusyId(null);
                                }
                              }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={driveFileBusyId === f.id}
                              onClick={async () => {
                                try {
                                  setDriveFileBusyId(f.id);
                                  const content = await readDriveFile(f.id);
                                  setEditDriveFileModal({ file: f, fileName: f.name, content });
                                } catch (err) {
                                  notify('error', err instanceof Error ? err.message : 'Unable to load Drive file');
                                } finally {
                                  setDriveFileBusyId(null);
                                }
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </Button>
                            {f.webViewLink && (
                              <a
                                href={f.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#202820]/15 text-xs font-semibold text-[#174B37] hover:bg-[#F7F9F6]"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setConfirmDeleteDriveFileModal(f)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </Button>
                          </div>
                        ),
                      },
                    ]}
                  />
                )}
              </Card>

              {/* Captured End-to-End Lifecycle Ledger Table */}
              <Card padding="md" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-base text-[#174B37]">
                      Captured Activity & Transaction Ledger
                    </h3>
                    <p className="text-xs text-[#202820]/60">
                      Every user login, booking, weighing, scrap sold, payment, quotation, and admin action recorded in real time.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'All Events' },
                        { id: 'logins', label: 'Logins & Auth' },
                        { id: 'bookings', label: 'Bookings & Dispatch' },
                        { id: 'scrap_sold', label: 'Scrap Sold' },
                        { id: 'payments', label: 'Payments' },
                        { id: 'quotations_admin', label: 'Quotes & Admin' },
                      ] as const
                    ).map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setLedgerFilter(chip.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          ledgerFilter === chip.id
                            ? 'bg-[#174B37] text-white border-[#174B37]'
                            : 'bg-[#F7F9F6] text-[#202820]/75 border-[#202820]/10 hover:border-[#174B37]/30'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <DataTable
                  data={state.driveLedger.filter((r) => {
                    const matchMap: Record<typeof ledgerFilter, DriveLedgerEventType[] | null> = {
                      all: null,
                      logins: ['USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTERED', 'PASSWORD_RESET'],
                      bookings: ['BOOKING_CREATED', 'EXECUTIVE_ASSIGNED', 'PICKUP_STATUS', 'ORDER_CANCELLED'],
                      scrap_sold: ['SCRAP_SOLD', 'SCRAP_WEIGHED'],
                      payments: ['PAYMENT_COMPLETED', 'PAYMENT_UPDATED'],
                      quotations_admin: ['QUOTATION_ACTIVITY', 'ADMIN_USER_MUTATION', 'RATE_OR_CMS_UPDATE', 'SUPPORT_TICKET'],
                    };
                    const allowed = matchMap[ledgerFilter];
                    return allowed ? allowed.includes(r.eventType) : true;
                  })}
                  searchPlaceholder="Search actor, order #, receipt, or summary..."
                  searchFilter={(r, q) =>
                    r.actorName.toLowerCase().includes(q) ||
                    (r.referenceCode || '').toLowerCase().includes(q) ||
                    r.summary.toLowerCase().includes(q) ||
                    r.eventType.toLowerCase().includes(q)
                  }
                  columns={[
                    {
                      key: 'seq',
                      header: '# / Time',
                      render: (r) => (
                        <div>
                          <span className="font-mono text-xs font-bold text-[#174B37]">#{r.sequenceNo}</span>
                          <p className="font-mono text-[11px] text-[#202820]/55">
                            {new Date(r.timestamp).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: 'evt',
                      header: 'Event',
                      render: (r) => (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-md bg-[#174B37]/10 text-[#174B37] font-mono text-[11px] font-semibold">
                            {r.eventType}
                          </span>
                          {r.referenceCode && (
                            <p className="font-mono text-[11px] text-[#202820]/65 mt-0.5">{r.referenceCode}</p>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: 'actor',
                      header: 'Actor',
                      render: (r) => (
                        <div>
                          <p className="text-xs font-semibold text-[#202820]">{r.actorName}</p>
                          <p className="text-[11px] text-[#202820]/55 uppercase font-mono">{r.actorRole}</p>
                        </div>
                      ),
                    },
                    {
                      key: 'metrics',
                      header: 'Qty / ₹',
                      render: (r) => (
                        <div className="font-mono text-xs tabular-nums">
                          {r.weightKg !== undefined && <p>{r.weightKg} kg</p>}
                          {r.amountInr !== undefined && (
                            <p className="font-bold text-[#174B37]">₹{r.amountInr.toLocaleString('en-IN')}</p>
                          )}
                          {r.weightKg === undefined && r.amountInr === undefined && (
                            <span className="text-[#202820]/40">—</span>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: 'sum',
                      header: 'Captured Summary',
                      render: (r) => (
                        <div className="max-w-xs">
                          <p className="text-xs text-[#202820]/85">{r.summary}</p>
                          {r.lastEditedBy && (
                            <p className="text-[10px] text-[#D97706] mt-0.5">
                              Edited by {r.lastEditedBy}
                            </p>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: 'sync',
                      header: 'Drive Sync',
                      render: (r) => (
                        <StatusIndicator status={r.driveSyncStatus === 'synced_drive' ? 'completed' : 'pending'} />
                      ),
                    },
                    {
                      key: 'act',
                      header: 'Admin Actions',
                      align: 'right',
                      render: (r) => (
                        <div className="inline-flex items-center gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setViewLedgerRecord(r)}>
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingLedgerRecord(r);
                              setEditLedgerDraft({
                                summary: r.summary,
                                referenceCode: r.referenceCode || '',
                                weightKg: r.weightKg !== undefined ? String(r.weightKg) : '',
                                amountInr: r.amountInr !== undefined ? String(r.amountInr) : '',
                                city: r.city || 'Bengaluru',
                                pinCode: r.pinCode || '',
                              });
                            }}
                          >
                            Edit
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setConfirmDeleteLedger(r)}>
                            Delete
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            </div>
          )}

          {/* 22. AUDIT LOGS */}
          {tab === 'audit_logs' && (
            <div className="space-y-6">
              <Card padding="md">
                <h2 className="font-display font-bold text-lg text-[#174B37] mb-4">Immutable Audit Trail</h2>
                <DataTable
                  data={state.auditLogs}
                  searchFilter={(a, q) => a.action.toLowerCase().includes(q) || a.actorName.toLowerCase().includes(q)}
                  columns={[
                    { key: 'ts', header: 'Timestamp', render: (a) => <span className="font-mono text-xs">{new Date(a.timestamp).toLocaleString('en-IN')}</span> },
                    { key: 'actor', header: 'Actor', render: (a) => <span className="text-xs font-semibold">{a.actorName} ({a.actorRole})</span> },
                    { key: 'act', header: 'Action', render: (a) => <span className="font-mono text-xs text-[#174B37]">{a.action}</span> },
                    { key: 'det', header: 'Details', render: (a) => <span className="text-xs text-[#202820]/75">{a.details}</span> },
                  ]}
                />
              </Card>
              <Card padding="md">
                <h3 className="font-display font-bold text-base text-[#174B37] mb-3">Security Login Activity</h3>
                <DataTable
                  data={state.loginActivity}
                  columns={[
                    { key: 'ts', header: 'Time', render: (l) => <span className="font-mono text-xs">{new Date(l.timestamp).toLocaleString('en-IN')}</span> },
                    { key: 'e', header: 'Email', render: (l) => <span className="text-xs">{l.email}</span> },
                    { key: 'r', header: 'Role', render: (l) => <span className="font-mono text-xs uppercase">{l.role}</span> },
                    { key: 'm', header: 'Method', render: (l) => <span className="text-xs">{l.method}</span> },
                    { key: 's', header: 'Result', render: (l) => <StatusIndicator status={l.status === 'success' ? 'completed' : 'failed'} /> },
                  ]}
                />
              </Card>
            </div>
          )}

          {/* 23. SETTINGS */}
          {tab === 'settings' && (
            <Card padding="lg" className="max-w-xl space-y-4">
              <h2 className="font-display font-bold text-lg text-[#174B37]">Platform Settings & Data Management</h2>
              <p className="text-sm text-[#202820]/70">
                Platform commission rate is locked at 8% on verified material payouts. All financial records are soft-archived to preserve statutory GST & audit compliance.
              </p>
              <Button variant="outline" onClick={resetDemoWorkspace}>
                Restore Default Punarchakra Seed Data
              </Button>
            </Card>
          )}
        </main>
        <PortalFooter portalLabel="Admin Master Control" />
      </div>

      {/* Provision User Modal */}
      <Modal open={showAddUser} onClose={() => setShowAddUser(false)} title="Provision New Platform Account">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await adminCreateUser(newUserForm);
            if (res.ok) setShowAddUser(false);
            else notify('error', res.error || 'Failed to provision user');
          }}
          className="space-y-3"
        >
          <Select label="Role" value={newUserForm.role} onChange={(e) => setNewUserForm((f) => ({ ...f, role: e.target.value as UserRole }))}>
            <option value="b2c">B2C Customer</option>
            <option value="b2b">B2B Business</option>
            <option value="executive">Pickup Executive</option>
            <option value="admin">Administrator</option>
          </Select>
          <Input label="Full Name / Contact Person" required value={newUserForm.name} onChange={(e) => setNewUserForm((f) => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" type="email" required value={newUserForm.email} onChange={(e) => setNewUserForm((f) => ({ ...f, email: e.target.value }))} />
            <Input label="Mobile" required value={newUserForm.mobile} onChange={(e) => setNewUserForm((f) => ({ ...f, mobile: e.target.value }))} />
          </div>
          {newUserForm.role === 'b2b' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Company Name" value={newUserForm.companyName} onChange={(e) => setNewUserForm((f) => ({ ...f, companyName: e.target.value }))} />
              <Input label="GSTIN" maxLength={15} value={newUserForm.gstin} onChange={(e) => setNewUserForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))} />
            </div>
          )}
          {newUserForm.role === 'executive' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Employee ID" placeholder="PNC-EX-150" value={newUserForm.employeeId} onChange={(e) => setNewUserForm((f) => ({ ...f, employeeId: e.target.value }))} />
              <Select label="Zone" value={newUserForm.zoneId} onChange={(e) => setNewUserForm((f) => ({ ...f, zoneId: e.target.value }))}>
                {state.serviceZones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </Select>
            </div>
          )}
          <Input label="Initial Password" type="password" required value={newUserForm.password} onChange={(e) => setNewUserForm((f) => ({ ...f, password: e.target.value }))} />
          <Button type="submit" className="w-full">Create Account</Button>
        </form>
      </Modal>

      {/* Edit User Profile Modal (B2C / B2B / Pickup Executive / Admin) */}
      <Modal
        open={editingUser !== null}
        onClose={() => setEditingUser(null)}
        title={editingUser ? `Edit ${editingUser.role.toUpperCase()} Profile` : 'Edit User'}
        subtitle={editingUser ? `User ID: ${editingUser.id}` : ''}
      >
        {editingUser && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await adminUpdateUser(editingUser.id, editUserForm);
              if (res.ok) setEditingUser(null);
              else notify('error', res.error || 'Failed to update profile');
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Full Name / Account Name"
                required
                value={editUserForm.name}
                onChange={(e) => setEditUserForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Select
                label="Account Status"
                value={editUserForm.status}
                onChange={(e) =>
                  setEditUserForm((f) => ({ ...f, status: e.target.value as 'active' | 'deactivated' }))
                }
              >
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Email Address"
                type="email"
                required
                value={editUserForm.email}
                onChange={(e) => setEditUserForm((f) => ({ ...f, email: e.target.value }))}
              />
              <Input
                label="Mobile Number"
                required
                value={editUserForm.mobile}
                onChange={(e) => setEditUserForm((f) => ({ ...f, mobile: e.target.value }))}
              />
            </div>

            {editingUser.role === 'b2c' && (
              <div className="pt-2 border-t border-[#202820]/10 space-y-3">
                <p className="text-xs font-semibold text-[#174B37]">B2C Customer Details</p>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="UPI ID"
                    placeholder="user@okicici"
                    value={editUserForm.upiId}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, upiId: e.target.value }))}
                  />
                  <Input
                    label="Loyalty Points"
                    type="number"
                    min={0}
                    value={editUserForm.loyaltyPoints}
                    onChange={(e) =>
                      setEditUserForm((f) => ({ ...f, loyaltyPoints: Number(e.target.value) }))
                    }
                  />
                  <Input
                    label="Wallet (₹)"
                    type="number"
                    min={0}
                    value={editUserForm.walletBalance}
                    onChange={(e) =>
                      setEditUserForm((f) => ({ ...f, walletBalance: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input
                      label="Bengaluru Address Line"
                      value={editUserForm.addressLine1}
                      onChange={(e) => setEditUserForm((f) => ({ ...f, addressLine1: e.target.value }))}
                    />
                  </div>
                  <Input
                    label="PIN Code"
                    maxLength={6}
                    value={editUserForm.addressPinCode}
                    onChange={(e) =>
                      setEditUserForm((f) => ({ ...f, addressPinCode: e.target.value.replace(/\D/g, '') }))
                    }
                  />
                </div>
              </div>
            )}

            {editingUser.role === 'b2b' && (
              <div className="pt-2 border-t border-[#202820]/10 space-y-3">
                <p className="text-xs font-semibold text-[#174B37]">B2B Enterprise Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Company Name"
                    value={editUserForm.companyName}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, companyName: e.target.value }))}
                  />
                  <Input
                    label="GSTIN"
                    maxLength={15}
                    value={editUserForm.gstin}
                    onChange={(e) =>
                      setEditUserForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Contact Person"
                    value={editUserForm.contactPerson}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, contactPerson: e.target.value }))}
                  />
                  <Select
                    label="Contract Tier"
                    value={editUserForm.contractTier}
                    onChange={(e) =>
                      setEditUserForm((f) => ({
                        ...f,
                        contractTier: e.target.value as BusinessProfile['contractTier'],
                      }))
                    }
                  >
                    <option value="Standard">Standard</option>
                    <option value="Gold Enterprise">Gold Enterprise</option>
                    <option value="Platinum Annual">Platinum Annual</option>
                  </Select>
                </div>
                <Input
                  label="Bengaluru Business Address"
                  value={editUserForm.businessAddress}
                  onChange={(e) => setEditUserForm((f) => ({ ...f, businessAddress: e.target.value }))}
                />
              </div>
            )}

            {editingUser.role === 'executive' && (
              <div className="pt-2 border-t border-[#202820]/10 space-y-3">
                <p className="text-xs font-semibold text-[#174B37]">Pickup Executive Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Employee ID"
                    value={editUserForm.employeeId}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, employeeId: e.target.value }))}
                  />
                  <Select
                    label="Assigned Bengaluru Zone"
                    value={editUserForm.assignedZoneId}
                    onChange={(e) =>
                      setEditUserForm((f) => ({ ...f, assignedZoneId: e.target.value }))
                    }
                  >
                    {state.serviceZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Vehicle Number"
                    value={editUserForm.vehicleNumber}
                    onChange={(e) =>
                      setEditUserForm((f) => ({ ...f, vehicleNumber: e.target.value.toUpperCase() }))
                    }
                  />
                  <Select
                    label="Vehicle Type"
                    value={editUserForm.vehicleType}
                    onChange={(e) =>
                      setEditUserForm((f) => ({
                        ...f,
                        vehicleType: e.target.value as ExecutiveProfile['vehicleType'],
                      }))
                    }
                  >
                    <option value="E-Cargo Van">E-Cargo Van</option>
                    <option value="E-Three Wheeler">E-Three Wheeler</option>
                    <option value="Pickup Truck">Pickup Truck</option>
                  </Select>
                  <Select
                    label="Shift Status"
                    value={editUserForm.availabilityStatus}
                    onChange={(e) =>
                      setEditUserForm((f) => ({
                        ...f,
                        availabilityStatus: e.target.value as ExecutiveProfile['availabilityStatus'],
                      }))
                    }
                  >
                    <option value="available">Available</option>
                    <option value="on_pickup">On Pickup</option>
                    <option value="off_duty">Off Duty</option>
                  </Select>
                </div>
              </div>
            )}

            <Input
              label="Reset Password (Optional, min 6 chars)"
              type="password"
              placeholder="Leave blank to keep existing password"
              value={editUserForm.password}
              onChange={(e) => setEditUserForm((f) => ({ ...f, password: e.target.value }))}
            />

            <Button type="submit" className="w-full">
              Save Profile Changes
            </Button>
          </form>
        )}
      </Modal>

      {/* Confirm Deactivate Dialog */}
      <ConfirmDialog
        open={confirmDeactivateUser !== null}
        onClose={() => setConfirmDeactivateUser(null)}
        danger
        title="Deactivate User Account"
        description={`Deactivating ${confirmDeactivateUser?.name} prevents portal sign-in while preserving historical transaction & audit records.`}
        confirmLabel="Deactivate Account"
        onConfirm={() => {
          if (confirmDeactivateUser) adminToggleUserStatus(confirmDeactivateUser.id, 'deactivated');
        }}
      />

      {/* Confirm Delete User Dialog */}
      <ConfirmDialog
        open={confirmDeleteUser !== null}
        onClose={() => setConfirmDeleteUser(null)}
        danger
        title="Delete User Profile"
        description={`Permanently remove ${confirmDeleteUser?.name} (${confirmDeleteUser?.role.toUpperCase()}) and their associated portal profile from the Punarchakra directory?`}
        confirmLabel="Delete Profile"
        onConfirm={() => {
          if (confirmDeleteUser) {
            adminDeleteUser(confirmDeleteUser.id);
          }
        }}
      />

      {/* Smart Executive Assignment Modal */}
      <Modal
        open={assignModalOrder !== null}
        onClose={() => setAssignModalOrder(null)}
        title="Smart Executive Assignment"
        subtitle={assignModalOrder ? `${assignModalOrder.orderNumber} · ${assignModalOrder.city} (${assignModalOrder.pinCode})` : ''}
      >
        {assignModalOrder && (
          <div className="space-y-3">
            <p className="text-xs text-[#202820]/65">
              Ranked by service zone match, availability, active workload, and proximity:
            </p>
            {getSmartExecutiveRecommendations(assignModalOrder).map((rec) => (
              <div key={rec.executive.id} className="p-3.5 rounded-xl border border-[#202820]/12 bg-[#F7F9F6] flex items-center justify-between gap-3">
                <div>
                  <p className="font-display font-bold text-sm text-[#174B37]">
                    {rec.executive.name} <span className="font-mono text-xs text-[#28A66A]">({rec.score}/100 match)</span>
                  </p>
                  <p className="text-xs text-[#202820]/70">{rec.reason}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    adminAssignExecutive(assignModalOrder.id, rec.executive.id);
                    setAssignModalOrder(null);
                  }}
                >
                  Assign
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Inspect / Reschedule Order Modal */}
      <Modal
        open={inspectOrder !== null}
        onClose={() => setInspectOrder(null)}
        title={inspectOrder ? `Inspect Order ${inspectOrder.orderNumber}` : ''}
      >
        {inspectOrder && (
          <div className="space-y-4">
            <div className="text-xs space-y-1">
              <p><strong>Customer:</strong> {inspectOrder.customerName} ({inspectOrder.customerMobile})</p>
              <p><strong>Address:</strong> {inspectOrder.addressText} ({inspectOrder.pinCode})</p>
              <p><strong>Pickup OTP:</strong> <span className="font-mono font-bold text-[#174B37]">{inspectOrder.pickupOtp}</span></p>
            </div>
            <div className="border-t border-[#202820]/10 pt-3 space-y-1.5">
              {inspectOrder.items.map((it) => (
                <div key={it.id} className="flex justify-between text-xs">
                  <span>{it.categoryName} ({it.actualQty ?? it.estimatedQty} {it.unit} @ ₹{it.appliedRate})</span>
                  <span className="font-mono font-bold">₹{(it.actualAmount ?? it.estimatedAmount).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#202820]/10">
              <Input label="Reschedule Date" type="date" value={reschedDate} onChange={(e) => setReschedDate(e.target.value)} />
              <Input label="Time Slot" value={reschedSlot} onChange={(e) => setReschedSlot(e.target.value)} />
            </div>
            <div className="flex justify-between gap-3">
              {!['payment_completed', 'cancelled'].includes(inspectOrder.status) && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    cancelOrder(inspectOrder.id, 'Cancelled by Administrator');
                    setInspectOrder(null);
                  }}
                >
                  Cancel Order
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  adminRescheduleOrder(inspectOrder.id, reschedDate, reschedSlot);
                  setInspectOrder(null);
                }}
              >
                Update Schedule
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Price Quotation Modal */}
      <Modal
        open={pricingQuote !== null}
        onClose={() => setPricingQuote(null)}
        title={pricingQuote ? `Price B2B Quotation ${pricingQuote.quoteNumber}` : ''}
      >
        {pricingQuote && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              adminPriceQuotation(
                pricingQuote.id,
                pricingQuote.items.map((it) => ({ id: it.id, proposedRate: quoteRatesMap[it.id] || 20 })),
                quoteAdminNote
              );
              setPricingQuote(null);
            }}
            className="space-y-4"
          >
            {pricingQuote.items.map((it) => (
              <div key={it.id} className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-[#F7F9F6]">
                <div className="col-span-7 text-xs">
                  <p className="font-semibold text-[#174B37]">{it.categoryName}: {it.materialName}</p>
                  <p className="font-mono text-[#202820]/60">{it.estimatedWeightKg} kg</p>
                </div>
                <div className="col-span-5">
                  <Input
                    label="Rate (₹/kg)"
                    type="number"
                    value={quoteRatesMap[it.id] ?? 25}
                    onChange={(e) =>
                      setQuoteRatesMap((m) => ({ ...m, [it.id]: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
            ))}
            <Textarea
              label="Contract & Logistics Notes for Client"
              rows={2}
              value={quoteAdminNote}
              onChange={(e) => setQuoteAdminNote(e.target.value)}
            />
            <Button type="submit" className="w-full">
              Send Priced Quotation to {pricingQuote.businessName}
            </Button>
          </form>
        )}
      </Modal>

      {/* Support Reply Modal */}
      <Modal open={replyTicket !== null} onClose={() => setReplyTicket(null)} title={`Reply to ${replyTicket?.ticketNumber}`}>
        {replyTicket && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              adminReplySupportTicket(replyTicket.id, replyText, 'resolved');
              setReplyTicket(null);
            }}
            className="space-y-3"
          >
            <p className="text-xs text-[#202820]/70">{replyTicket.message}</p>
            <Textarea label="Resolution Reply" rows={3} required value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            <Button type="submit" className="w-full">Send Reply & Resolve</Button>
          </form>
        )}
      </Modal>

      {/* View Captured Lifecycle Record Modal */}
      <Modal
        open={viewLedgerRecord !== null}
        onClose={() => setViewLedgerRecord(null)}
        title={viewLedgerRecord ? `Captured Event #${viewLedgerRecord.sequenceNo} (${viewLedgerRecord.eventType})` : ''}
        subtitle={viewLedgerRecord ? `${viewLedgerRecord.actorName} · ${new Date(viewLedgerRecord.timestamp).toLocaleString('en-IN')}` : ''}
        maxWidth="max-w-2xl"
      >
        {viewLedgerRecord && (
          <div className="space-y-3 text-xs">
            <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#F7F9F6]">
              <p><strong>Reference:</strong> <span className="font-mono">{viewLedgerRecord.referenceCode || viewLedgerRecord.entityId}</span></p>
              <p><strong>Actor Role:</strong> <span className="font-mono uppercase">{viewLedgerRecord.actorRole}</span></p>
              <p><strong>City / PIN:</strong> {viewLedgerRecord.city || 'Bengaluru'} {viewLedgerRecord.pinCode || ''}</p>
              <p><strong>Weight / Amount:</strong> {viewLedgerRecord.weightKg ?? '—'} kg / {viewLedgerRecord.amountInr !== undefined ? `₹${viewLedgerRecord.amountInr.toLocaleString('en-IN')}` : '—'}</p>
            </div>
            <div>
              <p className="font-semibold text-[#174B37] mb-1">Captured Summary</p>
              <p className="text-[#202820]/80">{viewLedgerRecord.summary}</p>
            </div>
            <div>
              <p className="font-semibold text-[#174B37] mb-1">Full Structured Payload (Synced to Google Drive)</p>
              <pre className="p-3 rounded-xl bg-[#174B37] text-[#A5D66D] font-mono text-[11px] overflow-x-auto max-h-64">
                {JSON.stringify(viewLedgerRecord.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Captured Ledger Record Modal -> Triggers Explicit Confirmation */}
      <Modal
        open={editingLedgerRecord !== null}
        onClose={() => setEditingLedgerRecord(null)}
        title={editingLedgerRecord ? `Edit Ledger Event #${editingLedgerRecord.sequenceNo}` : ''}
        subtitle="Admin-only edit. Saves to platform ledger, Firestore adminLedger, and syncs to Google Drive."
      >
        {editingLedgerRecord && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setConfirmSaveLedgerEdit(true);
            }}
            className="space-y-3"
          >
            <Input
              label="Reference Code"
              value={editLedgerDraft.referenceCode}
              onChange={(e) => setEditLedgerDraft((d) => ({ ...d, referenceCode: e.target.value }))}
            />
            <Textarea
              label="Event Summary"
              rows={2}
              required
              value={editLedgerDraft.summary}
              onChange={(e) => setEditLedgerDraft((d) => ({ ...d, summary: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Weight (kg)"
                type="number"
                step="0.1"
                value={editLedgerDraft.weightKg}
                onChange={(e) => setEditLedgerDraft((d) => ({ ...d, weightKg: e.target.value }))}
              />
              <Input
                label="Amount (₹)"
                type="number"
                value={editLedgerDraft.amountInr}
                onChange={(e) => setEditLedgerDraft((d) => ({ ...d, amountInr: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City"
                value={editLedgerDraft.city}
                onChange={(e) => setEditLedgerDraft((d) => ({ ...d, city: e.target.value }))}
              />
              <Input
                label="PIN Code"
                maxLength={6}
                value={editLedgerDraft.pinCode}
                onChange={(e) => setEditLedgerDraft((d) => ({ ...d, pinCode: e.target.value.replace(/\D/g, '') }))}
              />
            </div>
            <Button type="submit" className="w-full">
              Review & Confirm Ledger Edit
            </Button>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmSaveLedgerEdit && editingLedgerRecord !== null}
        onClose={() => setConfirmSaveLedgerEdit(false)}
        title="Confirm Ledger & Google Drive Update"
        description={`Save Admin edits to captured event #${editingLedgerRecord?.sequenceNo} (${editingLedgerRecord?.eventType})? If Google Drive is connected, vault files will be updated immediately.`}
        confirmLabel="Confirm & Save"
        onConfirm={async () => {
          if (!editingLedgerRecord) return;
          await adminEditLedgerRecord(editingLedgerRecord.id, {
            summary: editLedgerDraft.summary,
            referenceCode: editLedgerDraft.referenceCode || undefined,
            weightKg: editLedgerDraft.weightKg ? Number(editLedgerDraft.weightKg) : undefined,
            amountInr: editLedgerDraft.amountInr ? Number(editLedgerDraft.amountInr) : undefined,
            city: editLedgerDraft.city || 'Bengaluru',
            pinCode: editLedgerDraft.pinCode || undefined,
          });
          setEditingLedgerRecord(null);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteLedger !== null}
        onClose={() => setConfirmDeleteLedger(null)}
        danger
        title="Delete Captured Lifecycle Record"
        description={`Permanently delete event #${confirmDeleteLedger?.sequenceNo} (${confirmDeleteLedger?.referenceCode || confirmDeleteLedger?.eventType}) from the Admin ledger, Firestore, and synced Google Drive vault files?`}
        confirmLabel="Delete Permanently"
        onConfirm={async () => {
          if (confirmDeleteLedger) {
            await adminDeleteLedgerRecord(confirmDeleteLedger.id);
          }
        }}
      />

      {/* View Live Google Drive File Content Modal */}
      <Modal
        open={viewDriveFileModal !== null}
        onClose={() => setViewDriveFileModal(null)}
        title={viewDriveFileModal ? `Google Drive File: ${viewDriveFileModal.file.name}` : ''}
        maxWidth="max-w-3xl"
      >
        {viewDriveFileModal && (
          <pre className="p-4 rounded-xl bg-[#174B37] text-[#A5D66D] font-mono text-xs overflow-auto max-h-[60vh]">
            {viewDriveFileModal.content}
          </pre>
        )}
      </Modal>

      {/* Edit Live Google Drive File Modal -> Triggers Explicit Confirmation */}
      <Modal
        open={editDriveFileModal !== null}
        onClose={() => setEditDriveFileModal(null)}
        title={editDriveFileModal ? `Edit Google Drive File: ${editDriveFileModal.file.name}` : ''}
        subtitle="Modifying this file updates it directly inside your Punarchakra Admin Audit Vault on Google Drive."
        maxWidth="max-w-3xl"
      >
        {editDriveFileModal && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setConfirmSaveDriveFileEdit(true);
            }}
            className="space-y-3"
          >
            <Input
              label="File Name"
              required
              value={editDriveFileModal.fileName}
              onChange={(e) =>
                setEditDriveFileModal((m) => (m ? { ...m, fileName: e.target.value } : null))
              }
            />
            <Textarea
              label="File Content (JSON / CSV)"
              rows={12}
              required
              className="font-mono text-xs"
              value={editDriveFileModal.content}
              onChange={(e) =>
                setEditDriveFileModal((m) => (m ? { ...m, content: e.target.value } : null))
              }
            />
            <Button type="submit" className="w-full">
              Review & Confirm Drive Update
            </Button>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmSaveDriveFileEdit && editDriveFileModal !== null}
        onClose={() => setConfirmSaveDriveFileEdit(false)}
        title="Confirm Google Drive File Edit"
        description={`Overwrite "${editDriveFileModal?.fileName}" in your Google Drive Punarchakra Admin Audit Vault?`}
        confirmLabel="Overwrite Drive File"
        onConfirm={async () => {
          if (!editDriveFileModal) return;
          const res = await adminEditDriveFile({
            fileId: editDriveFileModal.file.id,
            fileName: editDriveFileModal.fileName,
            mimeType: editDriveFileModal.file.mimeType,
            content: editDriveFileModal.content,
          });
          if (res.ok) setEditDriveFileModal(null);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteDriveFileModal !== null}
        onClose={() => setConfirmDeleteDriveFileModal(null)}
        danger
        title="Delete File from Google Drive"
        description={`Permanently delete "${confirmDeleteDriveFileModal?.name}" from Google Drive? This action cannot be undone from Punarchakra.`}
        confirmLabel="Delete Drive File"
        onConfirm={async () => {
          if (confirmDeleteDriveFileModal) {
            await adminDeleteDriveFile(confirmDeleteDriveFileModal.id);
          }
        }}
      />
    </div>
  );
};
