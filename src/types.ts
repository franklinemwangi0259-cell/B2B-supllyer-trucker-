export interface Supplier {
  id: number;
  userId: string;
  name: string;
  category: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  paymentTerms: string; // 'Net 7', 'Net 14', 'Net 30', 'COD', 'Prepaid'
  creditLimit: number;
  currentBalance: number; // Positive = You'll Give (money owed to supplier)
  notes?: string;
  createdAt: string;
  lastActivity?: string;
  avatarColor?: string;
}

export interface Customer {
  id: number;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  currentBalance: number; // Positive = You'll Get (customer owes you), Negative = Advance paid
  creditLimit: number;
  lastActivity: string;
  avatarColor?: string;
  notes?: string;
  createdAt: string;
}

export interface CustomerTransaction {
  id: number;
  userId?: string;
  customerId: number;
  customerName?: string;
  type: 'gave' | 'got'; // 'gave' = You Gave Goods/Loan on Credit (Customer owes you +), 'got' = You Got Cash/Payment (Reduces balance -)
  amount: number;
  date: string;
  description: string;
  billNumber?: string;
  paymentMode?: string; // 'Cash', 'UPI / M-Pesa', 'Bank Transfer', 'Cheque', 'Card'
  attachmentsCount?: number;
  items?: Array<{
    inventoryId: number;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
  taxAmount?: number;
  taxRate?: number; // e.g. 5, 12, 18, 0
  paymentGatewayRef?: string;
  createdAt: string;
}

export interface CashbookEntry {
  id: number;
  type: 'in' | 'out'; // 'in' = Cash In, 'out' = Cash Out
  amount: number;
  category: string; // 'Sales', 'Customer Repayment', 'Supplier Payment', 'Shop Expense', 'Rent', 'Salaries', 'Other'
  paymentMode: string;
  date: string;
  description: string;
  contactName?: string;
  referenceNumber?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: number;
  userId: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderLevel: number;
  preferredSupplierId?: number | null;
  taxRate?: number; // e.g. 18% GST / 16% VAT
  hsnCode?: string;
  leadTimeDays?: number; // Vendor lead time in transit (e.g. 3, 7, 14 days)
  dailySalesVelocity?: number; // Estimated consumption units per day
  safetyStockUnits?: number; // Buffer stock for unexpected demand spikes
  createdAt: string;
}

export interface PurchaseOrderItem {
  id?: number;
  poId?: number;
  inventoryId?: number | null;
  itemName: string;
  unit: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  taxRate?: number;
}

export interface PurchaseOrder {
  id: number;
  userId: string;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  paymentTerms: string;
  totalAmount: number;
  amountPaid: number;
  issueDate: string;
  dueDate: string;
  notes?: string;
  invoiceNumber?: string;
  createdAt: string;
  items?: PurchaseOrderItem[];
}

export interface Payment {
  id: number;
  userId: string;
  supplierId: number;
  poId?: number | null;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string; // e.g. REC-8901, UTR, Cheque No
  notes?: string;
  reconciled?: boolean;
  reconciledWith?: string; // e.g. "PO-2026-001" or "INV-4012"
  createdAt: string;
}

export interface DueObligation {
  id: number;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  dueDate: string;
  daysRemaining: number;
  totalAmount: number;
  amountPaid: number;
  remainingDebt: number;
  urgency: 'overdue' | 'due_soon' | 'upcoming';
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
}

// Payment Gateway & Automated Reminders
export type PaymentGatewayProvider = 'razorpay' | 'stripe' | 'mpesa' | 'upi' | 'paypal' | 'bank_transfer';

export interface AutomatedPaymentLink {
  id: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  amount: number;
  currency: string;
  gateway: PaymentGatewayProvider;
  linkUrl: string;
  qrDataUrl?: string;
  invoiceRef: string;
  dueDate: string;
  status: 'created' | 'sent' | 'viewed' | 'paid';
  createdDate: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'all';
}

// Multi-Currency Exchange Rates
export interface CurrencyRate {
  code: string;
  symbol: string;
  name: string;
  rateToUSD: number; // 1 USD = X Currency
  flag: string;
}

// Offline PWA Sync Queue
export interface OfflineQueueItem {
  id: string;
  timestamp: number;
  actionType: 'ADD_KHATA_ENTRY' | 'ADD_PO' | 'RECORD_PAYMENT' | 'ADJUST_STOCK' | 'ADD_CUSTOMER';
  payload: any;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

// Automated Reconciliation Engine
export interface ReconciliationCandidate {
  id: string;
  paymentId: number;
  paymentReference: string; // e.g. REC-8901
  paymentAmount: number;
  paymentDate: string;
  paymentPartyName: string;
  matchedPOId?: number;
  matchedPONumber?: string; // e.g. INV-4012
  matchedAmount?: number;
  confidenceScore: number; // 0 - 100%
  matchReason: string;
  status: 'matched' | 'unmatched' | 'suggested' | 'reconciled';
}

// Customer Credit Intelligence & Risk Scoring
export interface CustomerRiskProfile {
  customerId: number;
  customerName: string;
  currentBalance: number;
  creditLimit: number;
  utilizationPct: number;
  avgPaymentDays: number; // Days Sales Outstanding (DSO)
  riskTier: 'low' | 'medium' | 'high' | 'critical';
  riskLabel: string;
  riskScore: number; // 0 (safest) - 100 (most risky)
  recommendedAction: string;
  isOverLimit: boolean;
  overLimitAmount: number;
}

// Tax & Audit Report Types (GST, VAT, Sales Tax)
export interface TaxAuditSummary {
  taxRegime: 'GST' | 'VAT' | 'SALES_TAX';
  period: string; // e.g., "Q1 2026-27"
  grossSalesTurnover: number;
  taxableSalesAmount: number;
  totalOutputTax: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grossPurchasesCOGS: number;
  taxablePurchasesAmount: number;
  totalInputTaxCredit: number;
  netTaxPayable: number;
  exemptTurnover: number;
  recordsCount: number;
}

export interface DashboardStats {
  totalCreditLimit: number;
  totalOutstandingDebt: number; // You'll Give (Suppliers)
  totalReceivables: number; // You'll Get (Customers)
  creditUtilization: number;
  totalWholesaleValue: number;
  totalRetailValue: number;
  potentialGrossMargin: number;
  inventoryCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockItems: InventoryItem[];
  overdueCount: number;
  overdueDebt: number;
  dueIn3DaysCount: number;
  dueIn3DaysDebt: number;
  upcomingObligations: DueObligation[];
  topSuppliersByDebt: Supplier[];
  recentPayments: Payment[];
  highRiskReceivables?: number;
  averageDSO?: number;
}

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  shopName: string;
  currency: string;
  phone?: string;
  address?: string;
  taxNumber?: string; // GSTIN / VAT ID
  activeRole?: UserRole;
}

// Zoho Books Complete Organization & Business Profile
export interface OrganizationProfile {
  id: string;
  companyName: string;
  phone: string;
  email: string;
  industry: string;
  businessType: string;
  addressStreet: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  taxNumber: string; // VAT / GSTIN / TIN / Tax ID
  baseCurrency: string;
  fiscalYear: string; // 'Jan - Dec' | 'Apr - Mar' | 'Jul - Jun' | 'Oct - Sep'
  signatoryName: string;
  signatoryDesignation: string;
  signatureDataUrl?: string; // Drawn or uploaded authorized signature
  stampDataUrl?: string; // Company rubber stamp / seal
  logoUrl?: string;
  website?: string;
  isConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

// Multi-User Role Based Access Control (RBAC)
export type UserRole = 'owner' | 'manager' | 'cashier' | 'accountant';

export interface RolePermissions {
  canViewDashboard: boolean;
  canCreatePO: boolean;
  canDeletePO: boolean;
  canAdjustInventory: boolean;
  canAddKhataEntry: boolean;
  canDeleteKhataEntry: boolean;
  canManageSuppliers: boolean;
  canManageCustomers: boolean;
  canViewReports: boolean;
  canAccessTaxAudit: boolean;
  canAccessReconciliation: boolean;
  canManageStaff: boolean;
  canPrintThermal: boolean;
  canScanOCR: boolean;
  canManageBackups: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  pinCode: string; // 4-digit PIN for quick cashier switching
  avatarColor: string;
  status: 'active' | 'suspended';
  lastActive: string;
  createdAt: string;
}

// Smart OCR Receipt & Bill Scanning
export interface OCRScannedBillItem {
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  taxRate?: number;
  total: number;
}

export interface OCRScannedBill {
  id: string;
  vendorName: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  items: OCRScannedBillItem[];
  confidenceScore: number;
  detectedCurrency: string;
  rawText?: string;
  notes?: string;
}

// POS & Thermal Printer Support (58mm / 80mm)
export type ThermalPaperWidth = '58mm' | '80mm';

export interface ThermalReceiptData {
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  taxNumber?: string;
  receiptNumber: string;
  date: string;
  time: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discount?: number;
  taxAmount: number;
  grandTotal: number;
  paymentMode: string;
  amountReceived?: number;
  changeDue?: number;
  runningBalance?: number;
  qrPayload?: string;
  footerNote?: string;
  paperWidth: ThermalPaperWidth;
}

// WhatsApp Business API Interactive Message Workflows
export interface WhatsAppBusinessMessage {
  id: string;
  recipientPhone: string;
  recipientName: string;
  templateType: 'payment_request' | 'invoice_receipt' | 'overdue_alert' | 'khata_statement';
  headerText: string;
  bodyText: string;
  amount: number;
  currency: string;
  invoiceNumber: string;
  paymentLinkUrl: string;
  interactiveButtons: Array<{
    type: 'QUICK_REPLY' | 'URL';
    title: string;
    payloadOrUrl: string;
  }>;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'paid' | 'failed';
  sentTimestamp: number;
  deliveryTimestamp?: number;
  readTimestamp?: number;
  paidTimestamp?: number;
}

// Automated Backup & Restore
export interface BackupSnapshot {
  id: string;
  timestamp: string;
  formattedDate: string;
  sizeKb: number;
  type: 'manual' | 'auto_daily' | 'cloud_drive';
  counts: {
    customers: number;
    suppliers: number;
    purchaseOrders: number;
    inventoryItems: number;
    customerTransactions: number;
    payments: number;
    cashbookEntries: number;
  };
  dataPayload?: any;
}

// Advanced Lead Time & Auto-Reorder Radar
export interface AutoReorderSuggestion {
  inventoryId: number;
  itemName: string;
  sku: string;
  category: string;
  unit: string;
  currentQuantity: number;
  dailyVelocity: number;
  leadTimeDays: number;
  safetyStock: number;
  dynamicROP: number; // (Velocity * LeadTime) + SafetyStock
  daysRemaining: number;
  estimatedStockoutDate: string;
  suggestedOrderQty: number;
  unitCost: number;
  estimatedOrderCost: number;
  preferredSupplierId?: number | null;
  supplierName: string;
  isTriggered: boolean;
  urgency: 'stockout' | 'critical' | 'reorder_now' | 'healthy';
}

// Self-Service Customer Statement & Direct 1-Click Pay Portal
export interface CustomerPortalData {
  customer: Customer;
  transactions: CustomerTransaction[];
  merchant: {
    shopName: string;
    phone?: string;
    email?: string;
    address?: string;
    taxNumber?: string;
    mpesaPaybill?: string;
    mpesaTillNumber?: string;
    mpesaAccountName?: string;
    upiId?: string;
    bankName?: string;
    bankAccountNumber?: string;
  };
  totalBilled: number;
  totalPaid: number;
  currentBalance: number;
  overdueStatus: 'current' | 'due_soon' | 'overdue' | 'settled';
  daysOverdue: number;
}


