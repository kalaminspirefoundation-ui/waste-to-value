export type UserRole = 'b2c' | 'b2b' | 'executive' | 'admin';

export type OrderStatus =
  | 'booking_created'
  | 'confirmed'
  | 'executive_assigned'
  | 'on_the_way'
  | 'reached_location'
  | 'scrap_collected'
  | 'weight_verified'
  | 'payment_completed'
  | 'cancelled';

export type QuotationStatus =
  | 'submitted'
  | 'priced_by_admin'
  | 'revision_requested'
  | 'accepted'
  | 'rejected'
  | 'converted_to_order';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'refunded' | 'failed';
export type PaymentMethod = 'UPI' | 'Bank Transfer' | 'Punarchakra Wallet' | 'RTGS / NEFT';

export interface Permission {
  id: string;
  code: string;
  label: string;
  module: string;
}

export interface RoleDefinition {
  id: UserRole;
  name: string;
  description: string;
  permissions: string[];
}

export interface User {
  id: string;
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  status: 'active' | 'deactivated';
  sessionRevokedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  loyaltyPoints: number;
  referralCode: string;
  referredBy?: string;
  walletBalance: number;
  preferredPaymentMethod: PaymentMethod;
  upiId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  companyName: string;
  industryType: string;
  gstin: string;
  contactPerson: string;
  businessAddress: string;
  contractTier: 'Standard' | 'Enterprise Gold' | 'Custom Rate';
  billingEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessBranch {
  id: string;
  businessUserId: string;
  branchName: string;
  address: string;
  city: string;
  pinCode: string;
  contactName: string;
  contactMobile: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ExecutiveProfile {
  id: string;
  userId: string;
  employeeId: string;
  assignedZoneId: string;
  vehicleNumber: string;
  vehicleType: 'E-Cargo Van' | 'E-Three Wheeler' | 'Pickup Truck';
  availabilityStatus: 'available' | 'on_pickup' | 'off_duty';
  activeShiftGps?: { lat: number; lng: number; updatedAt: string };
  rating: number;
  completedPickupsCount: number;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  line1: string;
  landmark?: string;
  city: string;
  state: string;
  pinCode: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
  createdAt: string;
}

export interface ScrapCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  description: string;
  co2FactorPerKg: number;
  unit: 'kg' | 'piece';
  isActive: boolean;
  sortOrder: number;
}

export interface ScrapSubcategory {
  id: string;
  categoryId: string;
  name: string;
  unit: 'kg' | 'piece';
  qualityNote: string;
  isActive: boolean;
}

export interface ScrapRate {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  city: string;
  zoneId: string;
  customerType: 'b2c' | 'b2b';
  qualityGrade: 'Standard' | 'Sorted Clean' | 'Industrial Bulk';
  ratePerUnit: number;
  effectiveFrom: string;
  isActive: boolean;
  updatedBy: string;
  updatedAt: string;
  history: { rate: number; changedAt: string; changedBy: string; note: string }[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  categoryId: string;
  subcategoryId: string;
  categoryName: string;
  subcategoryName: string;
  unit: 'kg' | 'piece';
  estimatedQty: number;
  actualQty?: number;
  appliedRate: number;
  estimatedAmount: number;
  actualAmount?: number;
  qualityGrade?: 'Standard' | 'Sorted Clean' | 'Industrial Bulk';
}

export interface WeighingRecord {
  id: string;
  orderId: string;
  executiveId: string;
  items: { itemId: string; categoryName: string; actualQty: number; rate: number; subtotal: number }[];
  totalWeightKg: number;
  totalAmount: number;
  weighingPhotos: string[];
  customerOtpVerified: boolean;
  notes?: string;
  recordedAt: string;
}

export interface ExecutiveAssignment {
  id: string;
  orderId: string;
  executiveUserId: string;
  executiveName: string;
  assignedBy: string;
  status: 'pending_acceptance' | 'accepted' | 'rejected' | 'completed';
  rejectionReason?: string;
  assignedAt: string;
  acceptedAt?: string;
}

export interface PickupOrder {
  id: string;
  orderNumber: string;
  customerUserId: string;
  customerName: string;
  customerMobile: string;
  customerRole: 'b2c' | 'b2b';
  branchId?: string;
  branchName?: string;
  addressText: string;
  city: string;
  pinCode: string;
  zoneId: string;
  lat?: number;
  lng?: number;
  scheduledDate: string;
  timeSlot: string;
  instructions?: string;
  status: OrderStatus;
  items: OrderItem[];
  photos: string[];
  estimatedTotalWeight: number;
  estimatedTotalAmount: number;
  actualTotalWeight?: number;
  finalAmount?: number;
  assignedExecutiveId?: string;
  assignedExecutiveName?: string;
  pickupOtp: string;
  paymentId?: string;
  quotationId?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'Weekly' | 'Bi-Weekly' | 'Monthly';
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  timeline: { status: OrderStatus; label: string; timestamp: string; actor: string }[];
}

export interface Payment {
  id: string;
  receiptNumber: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userRole: 'b2c' | 'b2b';
  amount: number;
  platformFee: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef: string;
  paidAt?: string;
  createdAt: string;
}

export interface QuotationItem {
  id: string;
  materialName: string;
  categoryId: string;
  categoryName: string;
  estimatedWeightKg: number;
  proposedRate?: number;
  proposedSubtotal?: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  businessUserId: string;
  businessName: string;
  branchId?: string;
  pickupLocation: string;
  city: string;
  pinCode: string;
  expectedCollectionDate: string;
  items: QuotationItem[];
  photos: string[];
  totalEstimatedWeightKg: number;
  totalQuotedAmount?: number;
  adminNotes?: string;
  revisionNotes?: string;
  status: QuotationStatus;
  convertedOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  channel: 'in_app' | 'email' | 'sms' | 'push';
  title: string;
  message: string;
  type: 'order' | 'payment' | 'assignment' | 'quotation' | 'reminder' | 'reward';
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  roleLabel: string;
  organization?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  ownerUserId: string;
  title: string;
  docType: 'gst_certificate' | 'invoice' | 'weighing_slip' | 'sustainability_report' | 'scrap_photo';
  fileName: string;
  dataUrl?: string;
  relatedOrderId?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  bonusPercent: number;
  minWeightKg: number;
  validUntil: string;
  isActive: boolean;
}

export interface ServiceZone {
  id: string;
  name: string;
  city: string;
  state: string;
  serviceSegment?: 'b2c' | 'b2b' | 'all';
  localities?: string[];
  pinCodes: string[];
  isActive: boolean;
  dailySlots: string[];
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  subject: string;
  category: 'Pickup Delay' | 'Payment / Payout' | 'Weighing Dispute' | 'B2B Account' | 'Technical';
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface LoginActivity {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
  method: 'Email/Password' | 'Mobile/OTP' | 'Quick Demo' | 'Google Sign-In';
  status: 'success' | 'failed';
  deviceInfo: string;
  timestamp: string;
}

export interface RewardTransaction {
  id: string;
  userId: string;
  points: number;
  type: 'earned' | 'redeemed' | 'referral_bonus';
  description: string;
  createdAt: string;
}

export interface CmsContent {
  heroHeadline: string;
  heroSubheading: string;
  announcementBanner: string;
  activeOfferText: string;
  faqs: { id: string; question: string; answer: string }[];
}

export interface ContactEnquiry {
  id: string;
  name: string;
  email: string;
  mobile: string;
  enquiryType: 'Household Pickup' | 'B2B Corporate' | 'Society Drive' | 'Partnership';
  message: string;
  createdAt: string;
}

export interface ExecutiveRecommendation {
  executive: User;
  profile: ExecutiveProfile;
  zoneMatch: boolean;
  activeWorkload: number;
  estimatedDistanceKm: number;
  score: number;
  reason: string;
}

export interface W2VProductItem {
  id: string;
  title: string;
  titleKn: string;
  wasteInput: string;
  wasteInputKn: string;
  engineeringProcess: string;
  marketDemand: string;
  marketDemandKn: string;
  imageUrl: string;
  diversionMetric: string;
}

export interface SegregationGuideStream {
  id: string;
  binColor: 'green' | 'blue' | 'yellow' | 'red';
  hex: string;
  title: string;
  titleKn: string;
  examples: string[];
  examplesKn: string[];
  ruleTip: string;
  ruleTipKn: string;
}

export interface CommunityInitiative {
  id: string;
  title: string;
  titleKn: string;
  audience: string;
  audienceKn: string;
  schedule: string;
  outcomes: string;
  outcomesKn: string;
}

export interface SegregationQuizQuestion {
  id: string;
  itemName: string;
  itemNameKn: string;
  correctBin: 'green' | 'blue' | 'yellow' | 'red';
  explanation: string;
  explanationKn: string;
}

export interface CommunityArticle {
  id: string;
  category: string;
  categoryKn: string;
  readTime: string;
  title: string;
  titleKn: string;
  summary: string;
  summaryKn: string;
  keyTakeaways: string[];
  keyTakeawaysKn: string[];
  bodyParagraphs: string[];
  bodyParagraphsKn: string[];
  bengaluruFocus: string;
}

export interface SegregationChecklistItem {
  id: string;
  label: string;
  labelKn: string;
  tip: string;
  tipKn: string;
}

export interface SegregationChecklist {
  id: string;
  audience: 'household' | 'apartment_office';
  title: string;
  titleKn: string;
  subtitle: string;
  subtitleKn: string;
  items: SegregationChecklistItem[];
}

export type DriveLedgerEventType =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_REGISTERED'
  | 'PASSWORD_RESET'
  | 'BOOKING_CREATED'
  | 'ORDER_CANCELLED'
  | 'EXECUTIVE_ASSIGNED'
  | 'PICKUP_STATUS'
  | 'SCRAP_WEIGHED'
  | 'SCRAP_SOLD'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_UPDATED'
  | 'QUOTATION_ACTIVITY'
  | 'SUPPORT_TICKET'
  | 'RATE_OR_CMS_UPDATE'
  | 'ADMIN_USER_MUTATION';

export interface DriveLedgerRecord {
  id: string;
  sequenceNo: number;
  timestamp: string;
  eventType: DriveLedgerEventType;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  actorEmail?: string;
  entityType: string;
  entityId: string;
  referenceCode?: string;
  summary: string;
  amountInr?: number;
  weightKg?: number;
  city?: string;
  pinCode?: string;
  payload: Record<string, unknown>;
  driveSyncStatus: 'local_only' | 'synced_drive';
  driveFileId?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface DriveVaultFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  kindLabel: string;
}
