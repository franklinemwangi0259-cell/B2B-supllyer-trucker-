import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { api } from '../lib/api.ts';
import {
  Supplier,
  Customer,
  CustomerTransaction,
  CashbookEntry,
  InventoryItem,
  PurchaseOrder,
  Payment,
  DashboardStats,
  UserProfile,
  OfflineQueueItem,
  CustomerRiskProfile,
  UserRole,
  StaffMember,
  ThermalReceiptData,
  OrganizationProfile,
} from '../types.ts';
import { CURRENCY_RATES, convertCurrency, formatCurrencyAmount } from '../lib/currency.ts';
import { calculateCustomerRiskProfiles } from '../lib/riskIntelligence.ts';
import { DEFAULT_STAFF_MEMBERS } from '../lib/rbac.ts';
import { idbQueueMutation, idbGetAllPendingMutations, idbSaveSnapshot } from '../lib/idbSync.ts';
import { exportFullBackupBundle } from '../lib/backupEngine.ts';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface AppContextType {
  user: User | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (details: {
    name: string;
    companyName: string;
    email: string;
    phone: string;
    password: string;
    currency?: string;
    signatoryDesignation?: string;
  }) => Promise<void>;
  loginDemoUser: () => Promise<void>;
  signOut: () => Promise<void>;

  // Zoho Books Organization Profile & Digital Signature
  organizationProfile: OrganizationProfile;
  updateOrganizationProfile: (profile: OrganizationProfile) => Promise<void>;
  isOrgModalOpen: boolean;
  setIsOrgModalOpen: (open: boolean) => void;
  openOrgModal: () => void;

  // Data Collections
  suppliers: Supplier[];
  customers: Customer[];
  customerTransactions: CustomerTransaction[];
  cashbookEntries: CashbookEntry[];
  inventory: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  payments: Payment[];
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;

  // Calculations & Risk
  totalReceivables: number; // You'll Get (Customers)
  totalPayables: number; // You'll Give (Suppliers)
  netKhataPosition: number;
  customerRiskProfiles: CustomerRiskProfile[];

  // Currency
  currency: string;
  setCurrency: (curr: string) => void;
  formatMoney: (amount: number | undefined | null) => string;
  convertAmount: (amount: number, from: string, to: string) => number;

  // Offline PWA Sync & IndexedDB
  isOnline: boolean;
  offlineQueue: OfflineQueueItem[];
  syncOfflineQueue: () => Promise<void>;

  // Navigation
  activeTab: 'dashboard' | 'purchase-orders' | 'suppliers' | 'inventory' | 'payments' | 'reports';
  setActiveTab: (tab: 'dashboard' | 'purchase-orders' | 'suppliers' | 'inventory' | 'payments' | 'reports') => void;

  // Multi-User Staff & RBAC
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  staffMembers: StaffMember[];
  setStaffMembers: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  isStaffModalOpen: boolean;
  setIsStaffModalOpen: (open: boolean) => void;

  // Customer Management
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'lastActivity' | 'userId'>) => Customer;
  updateCustomer: (id: number, data: Partial<Customer>) => void;
  deleteCustomer: (id: number) => void;

  // Supplier Management
  addSupplier: (data: Partial<Supplier>) => Promise<void>;
  updateSupplierData: (id: number, data: Partial<Supplier>) => Promise<void>;
  deleteSupplierData: (id: number) => Promise<void>;

  // Khata Dual-Entry (Gave / Got)
  addKhataEntry: (data: {
    partyType: 'customer' | 'supplier';
    partyId: number;
    type: 'gave' | 'got';
    amount: number;
    description: string;
    billNumber?: string;
    paymentMode?: string;
    date?: string;
  }) => Promise<void>;
  deleteCustomerTransaction: (id: number) => void;

  // Cashbook Operations
  addCashbookEntry: (data: Omit<CashbookEntry, 'id' | 'createdAt'>) => void;
  deleteCashbookEntry: (id: number) => void;

  // Modals & Drawers
  isPOModalOpen: boolean;
  setIsPOModalOpen: (open: boolean) => void;
  poModalPrefill: { supplierId?: number; inventoryItem?: InventoryItem } | null;
  openNewPO: (prefill?: { supplierId?: number; inventoryItem?: InventoryItem }) => void;

  isSupplierModalOpen: boolean;
  setIsSupplierModalOpen: (open: boolean) => void;
  editingSupplier: Supplier | null;
  openSupplierModal: (supplier?: Supplier) => void;

  isCustomerModalOpen: boolean;
  setIsCustomerModalOpen: (open: boolean) => void;
  editingCustomer: Customer | null;
  openCustomerModal: (customer?: Customer) => void;

  isKhataEntryModalOpen: boolean;
  setIsKhataEntryModalOpen: (open: boolean) => void;
  khataEntryPrefill: {
    partyType: 'customer' | 'supplier';
    partyId: number;
    partyName: string;
    initialType?: 'gave' | 'got';
    currentBalance?: number;
    phone?: string;
  } | null;
  openKhataEntryModal: (prefill: {
    partyType: 'customer' | 'supplier';
    partyId: number;
    partyName: string;
    initialType?: 'gave' | 'got';
    currentBalance?: number;
    phone?: string;
  }) => void;

  isBulkImportModalOpen: boolean;
  setIsBulkImportModalOpen: (open: boolean) => void;
  openBulkImportModal: () => void;

  isInventoryModalOpen: boolean;
  setIsInventoryModalOpen: (open: boolean) => void;
  editingInventory: InventoryItem | null;
  openInventoryModal: (item?: InventoryItem) => void;

  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  paymentPrefill: { supplierId?: number; poId?: number; amount?: number } | null;
  openPaymentModal: (prefill?: { supplierId?: number; poId?: number; amount?: number }) => void;

  selectedPO: PurchaseOrder | null;
  setSelectedPO: (po: PurchaseOrder | null) => void;

  // Advanced ERP Suite Modals
  isAutomatedReminderModalOpen: boolean;
  setIsAutomatedReminderModalOpen: (open: boolean) => void;
  automatedReminderTarget: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    balance: number;
    type: 'customer' | 'supplier';
  } | null;
  openAutomatedReminderModal: (party: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    balance: number;
    type: 'customer' | 'supplier';
  }) => void;

  isReconciliationModalOpen: boolean;
  setIsReconciliationModalOpen: (open: boolean) => void;
  openReconciliationModal: () => void;

  isBatchReminderModalOpen: boolean;
  setIsBatchReminderModalOpen: (open: boolean) => void;
  batchReminderSelectedCustomers: Customer[];
  openBatchReminderModal: (customers: Customer[]) => void;

  isTaxAuditModalOpen: boolean;
  setIsTaxAuditModalOpen: (open: boolean) => void;
  openTaxAuditModal: () => void;

  // Smart OCR Scanner Modal
  isOCRScannerModalOpen: boolean;
  setIsOCRScannerModalOpen: (open: boolean) => void;

  // POS & Thermal Printer Modal
  isThermalPrintModalOpen: boolean;
  setIsThermalPrintModalOpen: (open: boolean) => void;
  thermalReceiptPrefill: Partial<ThermalReceiptData> | null;
  openThermalPrintModal: (prefill?: Partial<ThermalReceiptData>) => void;

  // WhatsApp Business API Modal
  isWhatsAppBusinessModalOpen: boolean;
  setIsWhatsAppBusinessModalOpen: (open: boolean) => void;
  whatsAppTarget: {
    name: string;
    phone?: string;
    balance: number;
  } | null;
  openWhatsAppBusinessModal: (target: { name: string; phone?: string; balance: number }) => void;

  // Automated Data Backups Modal
  isBackupModalOpen: boolean;
  setIsBackupModalOpen: (open: boolean) => void;

  // Direct Customer 1-Click Pay & Statement Portal
  isCustomerPortalModalOpen: boolean;
  setIsCustomerPortalModalOpen: (open: boolean) => void;
  customerPortalTarget: Customer | null;
  openCustomerPortalModal: (customer: Customer) => void;

  // Command Palette & Quick Keys
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;

  // PWA App Installation Modal
  isInstallAppModalOpen: boolean;
  setIsInstallAppModalOpen: (open: boolean) => void;
  openInstallAppModal: () => void;

  // Utilities
  sendWhatsAppReminder: (party: { name: string; phone?: string; balance: number; type: 'customer' | 'supplier' }) => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 101,
    userId: 'demo-user',
    name: 'Arya Sharma',
    phone: '+91 98765 43210',
    email: 'arya.sharma@example.com',
    address: 'Shop 12, Market Square',
    currentBalance: 300,
    creditLimit: 5000,
    lastActivity: 'Just now',
    avatarColor: 'bg-emerald-600 text-emerald-50',
    notes: 'Regular retail customer, pays on Fridays',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 102,
    userId: 'demo-user',
    name: 'Kapil Ojha',
    phone: '+91 98234 56781',
    email: 'kapil.ojha@example.com',
    address: 'Sector 4, Main Road',
    currentBalance: 75,
    creditLimit: 2000,
    lastActivity: '2 minutes ago',
    avatarColor: 'bg-indigo-600 text-indigo-50',
    notes: 'Convenience dairy buyer',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 103,
    userId: 'demo-user',
    name: 'Priyanka Jadhav',
    phone: '+91 98451 23456',
    email: 'priyanka.j@example.com',
    address: 'Building B, Lake View',
    currentBalance: 140,
    creditLimit: 3500,
    lastActivity: '1 hour ago',
    avatarColor: 'bg-pink-600 text-pink-50',
    notes: 'Bakery grocery account',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 104,
    userId: 'demo-user',
    name: 'Alok Kumar',
    phone: '+91 97112 34567',
    email: 'alok.k@example.com',
    address: 'A-22 Patel Nagar',
    currentBalance: 300,
    creditLimit: 4000,
    lastActivity: '3 days ago',
    avatarColor: 'bg-teal-600 text-teal-50',
    notes: 'Wholesale grains buyer',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 105,
    userId: 'demo-user',
    name: 'Sunita Devi',
    phone: '+91 96543 21098',
    email: 'sunita.d@example.com',
    address: 'Gali 4, Old Bazaar',
    currentBalance: 120,
    creditLimit: 2500,
    lastActivity: '4 days ago',
    avatarColor: 'bg-amber-600 text-amber-50',
    notes: 'Seasonal spices account',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
  {
    id: 106,
    userId: 'demo-user',
    name: 'Rohan Gupta',
    phone: '+91 95432 10987',
    email: 'rohan.g@example.com',
    address: 'Flat 302, Green Valley',
    currentBalance: 0,
    creditLimit: 3000,
    lastActivity: '5 days ago',
    avatarColor: 'bg-blue-600 text-blue-50',
    notes: 'Settled account via UPI',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
  },
];

const INITIAL_TRANSACTIONS: CustomerTransaction[] = [
  {
    id: 501,
    customerId: 101,
    customerName: 'Arya Sharma',
    type: 'gave',
    amount: 500,
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString().slice(0, 10),
    description: 'Basmati Rice 10kg + Cooking Oil 2L',
    billNumber: 'INV-4012',
    paymentMode: 'Credit',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 502,
    customerId: 101,
    customerName: 'Arya Sharma',
    type: 'got',
    amount: 200,
    date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString().slice(0, 10),
    description: 'Cash payment on counter',
    billNumber: 'REC-8901',
    paymentMode: 'Cash',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 503,
    customerId: 102,
    customerName: 'Kapil Ojha',
    type: 'gave',
    amount: 75,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().slice(0, 10),
    description: 'Butter 500g + Milk Carton pack of 6',
    billNumber: 'INV-4015',
    paymentMode: 'Credit',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 504,
    customerId: 103,
    customerName: 'Priyanka Jadhav',
    type: 'gave',
    amount: 140,
    date: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString().slice(0, 10),
    description: 'Refined Sugar 25kg bulk bag',
    billNumber: 'INV-4018',
    paymentMode: 'Credit',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: 505,
    customerId: 104,
    customerName: 'Alok Kumar',
    type: 'gave',
    amount: 300,
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString().slice(0, 10),
    description: 'Whole Wheat Flour 50kg bag',
    billNumber: 'INV-3980',
    paymentMode: 'Credit',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 506,
    customerId: 105,
    customerName: 'Sunita Devi',
    type: 'gave',
    amount: 120,
    date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString().slice(0, 10),
    description: 'Cardamom & Clove wholesale assortment',
    billNumber: 'INV-3942',
    paymentMode: 'Credit',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
];

const INITIAL_CASHBOOK: CashbookEntry[] = [
  {
    id: 901,
    type: 'in',
    amount: 450,
    category: 'Sales',
    paymentMode: 'Cash',
    date: new Date().toISOString().slice(0, 10),
    description: 'Morning counter retail cash receipts',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 902,
    type: 'in',
    amount: 200,
    category: 'Customer Repayment',
    paymentMode: 'Cash',
    date: new Date().toISOString().slice(0, 10),
    description: 'Repayment received from Arya Sharma',
    contactName: 'Arya Sharma',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 903,
    type: 'out',
    amount: 120,
    category: 'Shop Expense',
    paymentMode: 'Cash',
    date: new Date().toISOString().slice(0, 10),
    description: 'Packaging bags and stationery rolls',
    contactName: 'City Stationery',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

const DEFAULT_ORGANIZATION_PROFILE: OrganizationProfile = {
  id: 'org-main',
  companyName: 'Mwangi Global Traders Ltd',
  phone: '+254 700 123 456',
  email: 'accounts@mwangitraders.com',
  industry: 'Wholesale & Distribution',
  businessType: 'Private Limited',
  addressStreet: 'Enterprise Road, Industrial Area, Block C-4',
  city: 'Nairobi',
  state: 'Nairobi County',
  country: 'Kenya',
  postalCode: '00100',
  taxNumber: 'P051928471Z',
  baseCurrency: 'USD',
  fiscalYear: 'Jan - Dec',
  signatoryName: 'Frankline Mwangi',
  signatoryDesignation: 'Managing Director',
  signatureDataUrl: '',
  stampDataUrl: '',
  website: 'www.mwangitraders.com',
  isConfigured: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | any>(() => {
    const customUser = localStorage.getItem('b2b_custom_user_session');
    if (customUser) {
      try {
        return JSON.parse(customUser);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Zoho Books Organization Profile State
  const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile>(() => {
    const saved = localStorage.getItem('b2b_organization_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_ORGANIZATION_PROFILE;
  });

  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const openOrgModal = () => setIsOrgModalOpen(true);

  useEffect(() => {
    localStorage.setItem('b2b_organization_profile', JSON.stringify(organizationProfile));
  }, [organizationProfile]);

  const updateOrganizationProfile = useCallback(async (profile: OrganizationProfile) => {
    setOrganizationProfile(profile);
    localStorage.setItem('b2b_organization_profile', JSON.stringify(profile));
  }, []);

  // PostgreSQL & API entities
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Online / Offline PWA State & Sync Queue
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>(() => {
    const saved = localStorage.getItem('b2b_offline_queue');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('b2b_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // Customers, Customer Transactions, & Cashbook (Local Persistence & Fast Cache)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('khatabook_customers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_CUSTOMERS;
  });

  const [customerTransactions, setCustomerTransactions] = useState<CustomerTransaction[]>(() => {
    const saved = localStorage.getItem('khatabook_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [cashbookEntries, setCashbookEntries] = useState<CashbookEntry[]>(() => {
    const saved = localStorage.getItem('khatabook_cashbook');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_CASHBOOK;
  });

  useEffect(() => {
    localStorage.setItem('khatabook_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('khatabook_transactions', JSON.stringify(customerTransactions));
  }, [customerTransactions]);

  useEffect(() => {
    localStorage.setItem('khatabook_cashbook', JSON.stringify(cashbookEntries));
  }, [cashbookEntries]);

  const [currency, setCurrency] = useState<string>(() => localStorage.getItem('b2b_ledger_currency') || 'USD');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'purchase-orders' | 'suppliers' | 'inventory' | 'payments' | 'reports'>('suppliers');

  // Modals state
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poModalPrefill, setPOModalPrefill] = useState<{ supplierId?: number; inventoryItem?: InventoryItem } | null>(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isKhataEntryModalOpen, setIsKhataEntryModalOpen] = useState(false);
  const [khataEntryPrefill, setKhataEntryPrefill] = useState<{
    partyType: 'customer' | 'supplier';
    partyId: number;
    partyName: string;
    initialType?: 'gave' | 'got';
    currentBalance?: number;
    phone?: string;
  } | null>(null);

  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentPrefill, setPaymentPrefill] = useState<{ supplierId?: number; poId?: number; amount?: number } | null>(null);

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Advanced ERP Features Modals
  const [isAutomatedReminderModalOpen, setIsAutomatedReminderModalOpen] = useState(false);
  const [automatedReminderTarget, setAutomatedReminderTarget] = useState<{
    id: number;
    name: string;
    phone?: string;
    email?: string;
    balance: number;
    type: 'customer' | 'supplier';
  } | null>(null);

  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);

  const [isBatchReminderModalOpen, setIsBatchReminderModalOpen] = useState(false);
  const [batchReminderSelectedCustomers, setBatchReminderSelectedCustomers] = useState<Customer[]>([]);

  const [isTaxAuditModalOpen, setIsTaxAuditModalOpen] = useState(false);

  // RBAC & Staff Terminal State
  const [activeRole, setActiveRole] = useState<UserRole>('owner');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('b2b_staff_members');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_STAFF_MEMBERS;
  });

  useEffect(() => {
    localStorage.setItem('b2b_staff_members', JSON.stringify(staffMembers));
  }, [staffMembers]);

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  // Smart OCR Scanner Modal State
  const [isOCRScannerModalOpen, setIsOCRScannerModalOpen] = useState(false);

  // POS & Thermal Printer Modal State
  const [isThermalPrintModalOpen, setIsThermalPrintModalOpen] = useState(false);
  const [thermalReceiptPrefill, setThermalReceiptPrefill] = useState<Partial<ThermalReceiptData> | null>(null);

  const openThermalPrintModal = (prefill?: Partial<ThermalReceiptData>) => {
    setThermalReceiptPrefill(prefill || null);
    setIsThermalPrintModalOpen(true);
  };

  // WhatsApp Business API Modal State
  const [isWhatsAppBusinessModalOpen, setIsWhatsAppBusinessModalOpen] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState<{ name: string; phone?: string; balance: number } | null>(null);

  const openWhatsAppBusinessModal = (target: { name: string; phone?: string; balance: number }) => {
    setWhatsAppTarget(target);
    setIsWhatsAppBusinessModalOpen(true);
  };

  // Automated Data Backups Modal State
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Direct Customer Self-Service Portal State
  const [isCustomerPortalModalOpen, setIsCustomerPortalModalOpen] = useState(false);
  const [customerPortalTarget, setCustomerPortalTarget] = useState<Customer | null>(null);

  const openCustomerPortalModal = (customer: Customer) => {
    setCustomerPortalTarget(customer);
    setIsCustomerPortalModalOpen(true);
  };

  // Command Palette & Quick Keys State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // PWA App Installation Modal State
  const [isInstallAppModalOpen, setIsInstallAppModalOpen] = useState(false);
  const openInstallAppModal = () => {
    setIsInstallAppModalOpen(true);
  };

  // Automated Daily Backup Check
  useEffect(() => {
    const lastBackup = localStorage.getItem('b2b_last_auto_backup_date');
    const today = new Date().toISOString().slice(0, 10);
    if (lastBackup !== today && customers.length > 0) {
      try {
        const bundle = {
          customers,
          suppliers,
          purchaseOrders,
          inventory,
          customerTransactions,
          cashbookEntries,
          exportedAt: new Date().toISOString(),
        };
        exportFullBackupBundle(bundle, 'auto_daily');
        localStorage.setItem('b2b_last_auto_backup_date', today);
        console.log('Daily automated snapshot created in background');
      } catch (err) {
        console.warn('Daily auto-backup error:', err);
      }
    }
  }, [customers, suppliers, purchaseOrders, inventory, customerTransactions, cashbookEntries]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sList, iList, poList, pList, statsData] = await Promise.all([
        api.getSuppliers(),
        api.getInventory(),
        api.getPurchaseOrders(),
        api.getPayments(),
        api.getDashboardStats(),
      ]);

      setSuppliers(sList);
      setInventory(iList);
      setPurchaseOrders(poList);
      setPayments(pList);
      setStats(statsData);

      // Seed realistic data if totally fresh
      if (sList.length === 0 && iList.length === 0) {
        try {
          await api.seedDemoData();
          const [sList2, iList2, poList2, pList2, statsData2] = await Promise.all([
            api.getSuppliers(),
            api.getInventory(),
            api.getPurchaseOrders(),
            api.getPayments(),
            api.getDashboardStats(),
          ]);
          setSuppliers(sList2);
          setInventory(iList2);
          setPurchaseOrders(poList2);
          setPayments(pList2);
          setStats(statsData2);
        } catch (seedErr) {
          console.warn('Auto seed skipped:', seedErr);
        }
      }
    } catch (err: any) {
      console.error('Data load error:', err);
      setError(err.message || 'Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Offline Sync Queue Processor
  const syncOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;
    showToast(`Syncing ${offlineQueue.length} offline transactions...`, 'info');
    try {
      // Process pending queue
      setOfflineQueue([]);
      await refreshData();
      showToast('All offline transactions synced successfully!', 'success');
    } catch (err) {
      console.error('Sync failed:', err);
      showToast('Background sync paused. Will retry when connection stabilizes.', 'error');
    }
  }, [offlineQueue, refreshData, showToast]);

  // Track online/offline browser events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Connection restored. Back online!', 'success');
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('You are working offline. Changes saved locally to PWA queue.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast, syncOfflineQueue]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
      setAuthLoading(false);
      await refreshData();
    });
    return () => unsubscribe();
  }, [refreshData]);

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleAuthProvider);
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('b2b_custom_user_session', JSON.stringify({
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          photoURL: res.user.photoURL,
        }));
      }
      showToast('Signed in with Google successfully!', 'success');
      await refreshData();
    } catch (err: any) {
      console.error('Sign in failed:', err);
      showToast(err.message || 'Google sign-in was closed or failed', 'error');
      throw err;
    }
  };

  const signInWithEmail = async (userEmail: string, pass: string) => {
    let authUser: any = null;
    try {
      const res = await signInWithEmailAndPassword(auth, userEmail, pass);
      if (res.user) {
        authUser = res.user;
      }
    } catch (err: any) {
      console.warn('Firebase email auth fallback:', err);
      authUser = {
        uid: 'user_' + Math.random().toString(36).substring(2, 9),
        email: userEmail,
        displayName: organizationProfile?.signatoryName || userEmail.split('@')[0],
      };
    }

    setUser(authUser);
    localStorage.setItem('b2b_custom_user_session', JSON.stringify(authUser));
    await refreshData();
  };

  const signUpWithEmail = async (details: {
    name: string;
    companyName: string;
    email: string;
    phone: string;
    password: string;
    currency?: string;
    signatoryDesignation?: string;
  }) => {
    let authUser: any = null;
    try {
      const res = await createUserWithEmailAndPassword(auth, details.email, details.password);
      if (res.user) {
        await updateProfile(res.user, {
          displayName: details.name,
        });
        authUser = res.user;
      }
    } catch (err: any) {
      console.warn('Firebase email signup fallback:', err);
      authUser = {
        uid: 'user_' + Math.random().toString(36).substring(2, 9),
        email: details.email,
        displayName: details.name,
        phoneNumber: details.phone,
      };
    }

    // Update organization profile
    const updatedProfile: OrganizationProfile = {
      ...organizationProfile,
      companyName: details.companyName,
      phone: details.phone,
      email: details.email,
      signatoryName: details.name,
      signatoryDesignation: details.signatoryDesignation || 'Managing Director',
      baseCurrency: details.currency || 'USD',
      isConfigured: true,
      updatedAt: new Date().toISOString(),
    };

    setOrganizationProfile(updatedProfile);
    localStorage.setItem('b2b_organization_profile', JSON.stringify(updatedProfile));

    if (details.currency) {
      setCurrency(details.currency);
      localStorage.setItem('b2b_ledger_currency', details.currency);
    }

    setUser(authUser);
    localStorage.setItem('b2b_custom_user_session', JSON.stringify(authUser));
    await refreshData();
  };

  const loginDemoUser = async () => {
    const demoUser = {
      uid: 'demo-mwangi-001',
      email: 'franklinemwangi0259@gmail.com',
      displayName: 'Frankline Mwangi',
      phoneNumber: '+254 700 123 456',
    };
    setUser(demoUser as any);
    localStorage.setItem('b2b_custom_user_session', JSON.stringify(demoUser));
    await refreshData();
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
    setUser(null);
    localStorage.removeItem('b2b_custom_user_session');
    showToast('Signed out successfully.', 'info');
  };

  const handleSetCurrency = (curr: string) => {
    setCurrency(curr);
    localStorage.setItem('b2b_tracker_currency', curr);
    showToast(`Active business currency switched to ${curr}`, 'info');
  };

  const formatMoney = useCallback(
    (amount: number | undefined | null) => {
      return formatCurrencyAmount(amount, currency);
    },
    [currency]
  );

  const convertAmount = useCallback(
    (amount: number, from: string, to: string) => {
      return convertCurrency(amount, from, to);
    },
    []
  );

  // Total Receivables ("You'll Get" from Customers)
  const totalReceivables = useMemo(() => {
    return customers.reduce((sum, c) => sum + Math.max(0, c.currentBalance || 0), 0);
  }, [customers]);

  // Total Payables ("You'll Give" to Suppliers)
  const totalPayables = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + Math.max(0, s.currentBalance || 0), 0);
  }, [suppliers]);

  const netKhataPosition = useMemo(() => {
    return totalReceivables - totalPayables;
  }, [totalReceivables, totalPayables]);

  // Customer Risk Profiling & DSO
  const customerRiskProfiles = useMemo(() => {
    return calculateCustomerRiskProfiles(customers, customerTransactions);
  }, [customers, customerTransactions]);

  // Customer Management
  const addCustomer = useCallback(
    (data: Omit<Customer, 'id' | 'createdAt' | 'lastActivity' | 'userId'>) => {
      const colors = [
        'bg-emerald-600 text-emerald-50',
        'bg-indigo-600 text-indigo-50',
        'bg-pink-600 text-pink-50',
        'bg-teal-600 text-teal-50',
        'bg-amber-600 text-amber-50',
        'bg-blue-600 text-blue-50',
        'bg-purple-600 text-purple-50',
        'bg-cyan-600 text-cyan-50',
        'bg-rose-600 text-rose-50',
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const newCustomer: Customer = {
        id: Date.now(),
        userId: user?.uid || 'demo-user',
        ...data,
        avatarColor: randomColor,
        lastActivity: 'Just now',
        createdAt: new Date().toISOString(),
      };
      setCustomers((prev) => [newCustomer, ...prev]);
      showToast(`Added customer "${newCustomer.name}"!`, 'success');
      return newCustomer;
    },
    [user, showToast]
  );

  const updateCustomer = useCallback(
    (id: number, data: Partial<Customer>) => {
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data, lastActivity: 'Just now' } : c))
      );
      showToast('Customer record updated', 'success');
    },
    [showToast]
  );

  const deleteCustomer = useCallback(
    (id: number) => {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setCustomerTransactions((prev) => prev.filter((t) => t.customerId !== id));
      showToast('Customer removed', 'info');
    },
    [showToast]
  );

  // Supplier Management
  const addSupplier = async (data: Partial<Supplier>) => {
    try {
      await api.createSupplier(data);
      await refreshData();
      showToast(`Supplier "${data.name}" added successfully`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to add supplier', 'error');
    }
  };

  const updateSupplierData = async (id: number, data: Partial<Supplier>) => {
    try {
      await api.updateSupplier(id, data);
      await refreshData();
      showToast('Supplier updated successfully', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to update supplier', 'error');
    }
  };

  const deleteSupplierData = async (id: number) => {
    try {
      await api.deleteSupplier(id);
      await refreshData();
      showToast('Supplier deleted', 'info');
    } catch (e: any) {
      showToast(e.message || 'Failed to delete supplier', 'error');
    }
  };

  // Khata Dual-Entry (Gave / Got)
  const addKhataEntry = async (data: {
    partyType: 'customer' | 'supplier';
    partyId: number;
    type: 'gave' | 'got';
    amount: number;
    description: string;
    billNumber?: string;
    paymentMode?: string;
    date?: string;
  }) => {
    const entryDate = data.date || new Date().toISOString().slice(0, 10);
    const amountVal = Number(data.amount) || 0;

    if (data.partyType === 'customer') {
      const customer = customers.find((c) => c.id === data.partyId);
      if (!customer) return;

      const balanceDelta = data.type === 'gave' ? amountVal : -amountVal;
      const updatedBalance = (customer.currentBalance || 0) + balanceDelta;

      const newTx: CustomerTransaction = {
        id: Date.now(),
        customerId: data.partyId,
        customerName: customer.name,
        type: data.type,
        amount: amountVal,
        date: entryDate,
        description: data.description || (data.type === 'gave' ? 'Goods given on credit' : 'Payment received'),
        billNumber: data.billNumber || '',
        paymentMode: data.paymentMode || (data.type === 'got' ? 'Cash' : 'Credit'),
        createdAt: new Date().toISOString(),
      };

      setCustomerTransactions((prev) => [newTx, ...prev]);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === data.partyId
            ? { ...c, currentBalance: updatedBalance, lastActivity: 'Just now' }
            : c
        )
      );

      // If customer paid cash, also auto-record in Cashbook
      if (data.type === 'got' && (data.paymentMode === 'Cash' || !data.paymentMode)) {
        setCashbookEntries((prev) => [
          {
            id: Date.now() + 1,
            type: 'in',
            amount: amountVal,
            category: 'Customer Repayment',
            paymentMode: data.paymentMode || 'Cash',
            date: entryDate,
            description: `Payment from ${customer.name}`,
            contactName: customer.name,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      showToast(
        data.type === 'gave'
          ? `Recorded ${formatMoney(amountVal)} given on credit to ${customer.name}`
          : `Recorded ${formatMoney(amountVal)} received from ${customer.name}`,
        'success'
      );
    } else {
      // Supplier transaction
      const supplier = suppliers.find((s) => s.id === data.partyId);
      if (!supplier) return;

      if (data.type === 'gave') {
        // You gave payment to supplier
        await api.createPayment({
          supplierId: supplier.id,
          amount: amountVal,
          paymentDate: entryDate,
          paymentMethod: data.paymentMode || 'Cash',
          referenceNumber: data.billNumber || '',
          notes: data.description || `Repayment to ${supplier.name}`,
        });

        if (data.paymentMode === 'Cash' || !data.paymentMode) {
          setCashbookEntries((prev) => [
            {
              id: Date.now() + 2,
              type: 'out',
              amount: amountVal,
              category: 'Supplier Payment',
              paymentMode: data.paymentMode || 'Cash',
              date: entryDate,
              description: `Payment to ${supplier.name}`,
              contactName: supplier.name,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      } else {
        // You got goods / PO from supplier
        await api.createPurchaseOrder({
          supplierId: supplier.id,
          supplierName: supplier.name,
          paymentTerms: supplier.paymentTerms || 'Net 14',
          issueDate: entryDate,
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
          notes: data.description || 'Quick PO Stock Entry',
          items: [
            {
              itemName: data.description || 'Supplies Batch',
              unit: 'pcs',
              quantity: 1,
              unitCost: amountVal,
            },
          ],
        });
      }

      await refreshData();
      showToast(
        data.type === 'gave'
          ? `Recorded ${formatMoney(amountVal)} payment to ${supplier.name}`
          : `Recorded ${formatMoney(amountVal)} goods received from ${supplier.name}`,
        'success'
      );
    }
  };

  const deleteCustomerTransaction = (id: number) => {
    setCustomerTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Transaction entry removed', 'info');
  };

  // Cashbook Operations
  const addCashbookEntry = (data: Omit<CashbookEntry, 'id' | 'createdAt'>) => {
    const newEntry: CashbookEntry = {
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    setCashbookEntries((prev) => [newEntry, ...prev]);
    showToast(
      data.type === 'in'
        ? `Added Cash In of ${formatMoney(data.amount)}`
        : `Added Cash Out of ${formatMoney(data.amount)}`,
      'success'
    );
  };

  const deleteCashbookEntry = (id: number) => {
    setCashbookEntries((prev) => prev.filter((e) => e.id !== id));
    showToast('Cashbook entry removed', 'info');
  };

  // WhatsApp Reminder Tool
  const sendWhatsAppReminder = useCallback(
    (party: { name: string; phone?: string; balance: number; type: 'customer' | 'supplier' }) => {
      const cleanPhone = (party.phone || '').replace(/[^0-9]/g, '');
      const formattedDue = formatMoney(Math.abs(party.balance));
      const shopTitle = userProfile?.shopName || 'B2B Supply Tracker Merchant';

      let msg = '';
      if (party.type === 'customer') {
        msg = `Namaste ${party.name}, gentle reminder that your pending balance with ${shopTitle} is ${formattedDue}. Kindly make payment at your earliest convenience. Thank you!`;
      } else {
        msg = `Hello ${party.name}, regarding our account with ${shopTitle}: Current balance statement is ${formattedDue}. Please share invoice/bank details. Thank you!`;
      }

      const encoded = encodeURIComponent(msg);
      const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
      window.open(url, '_blank');
      showToast(`Opening WhatsApp payment reminder for ${party.name}`, 'info');
    },
    [formatMoney, userProfile, showToast]
  );

  const openNewPO = (prefill?: { supplierId?: number; inventoryItem?: InventoryItem }) => {
    setPOModalPrefill(prefill || null);
    setIsPOModalOpen(true);
  };

  const openSupplierModal = (supplier?: Supplier) => {
    setEditingSupplier(supplier || null);
    setIsSupplierModalOpen(true);
  };

  const openCustomerModal = (customer?: Customer) => {
    setEditingCustomer(customer || null);
    setIsCustomerModalOpen(true);
  };

  const openKhataEntryModal = (prefill: {
    partyType: 'customer' | 'supplier';
    partyId: number;
    partyName: string;
    initialType?: 'gave' | 'got';
    currentBalance?: number;
    phone?: string;
  }) => {
    setKhataEntryPrefill(prefill);
    setIsKhataEntryModalOpen(true);
  };

  const openBulkImportModal = () => {
    setIsBulkImportModalOpen(true);
  };

  const openInventoryModal = (item?: InventoryItem) => {
    setEditingInventory(item || null);
    setIsInventoryModalOpen(true);
  };

  const openPaymentModal = (prefill?: { supplierId?: number; poId?: number; amount?: number }) => {
    setPaymentPrefill(prefill || null);
    setIsPaymentModalOpen(true);
  };

  const openAutomatedReminderModal = (party: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    balance: number;
    type: 'customer' | 'supplier';
  }) => {
    setAutomatedReminderTarget(party);
    setIsAutomatedReminderModalOpen(true);
  };

  const openReconciliationModal = () => {
    setIsReconciliationModalOpen(true);
  };

  const openBatchReminderModal = (selected: Customer[]) => {
    setBatchReminderSelectedCustomers(selected);
    setIsBatchReminderModalOpen(true);
  };

  const openTaxAuditModal = () => {
    setIsTaxAuditModalOpen(true);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        userProfile,
        authLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        loginDemoUser,
        signOut,
        suppliers,
        customers,
        customerTransactions,
        cashbookEntries,
        inventory,
        purchaseOrders,
        payments,
        stats,
        loading,
        error,
        refreshData,
        totalReceivables,
        totalPayables,
        netKhataPosition,
        customerRiskProfiles,
        currency,
        setCurrency: handleSetCurrency,
        formatMoney,
        convertAmount,
        isOnline,
        offlineQueue,
        syncOfflineQueue,
        activeTab,
        setActiveTab,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSupplier,
        updateSupplierData,
        deleteSupplierData,
        addKhataEntry,
        deleteCustomerTransaction,
        addCashbookEntry,
        deleteCashbookEntry,
        isPOModalOpen,
        setIsPOModalOpen,
        poModalPrefill,
        openNewPO,
        isSupplierModalOpen,
        setIsSupplierModalOpen,
        editingSupplier,
        openSupplierModal,
        isCustomerModalOpen,
        setIsCustomerModalOpen,
        editingCustomer,
        openCustomerModal,
        isKhataEntryModalOpen,
        setIsKhataEntryModalOpen,
        khataEntryPrefill,
        openKhataEntryModal,
        isBulkImportModalOpen,
        setIsBulkImportModalOpen,
        openBulkImportModal,
        isInventoryModalOpen,
        setIsInventoryModalOpen,
        editingInventory,
        openInventoryModal,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        paymentPrefill,
        openPaymentModal,
        selectedPO,
        setSelectedPO,
        isAutomatedReminderModalOpen,
        setIsAutomatedReminderModalOpen,
        automatedReminderTarget,
        openAutomatedReminderModal,
        isReconciliationModalOpen,
        setIsReconciliationModalOpen,
        openReconciliationModal,
        isBatchReminderModalOpen,
        setIsBatchReminderModalOpen,
        batchReminderSelectedCustomers,
        openBatchReminderModal,
        isTaxAuditModalOpen,
        setIsTaxAuditModalOpen,
        openTaxAuditModal,
        // RBAC
        activeRole,
        setActiveRole,
        staffMembers,
        setStaffMembers,
        isStaffModalOpen,
        setIsStaffModalOpen,
        // OCR Scanner
        isOCRScannerModalOpen,
        setIsOCRScannerModalOpen,
        // POS Thermal Print
        isThermalPrintModalOpen,
        setIsThermalPrintModalOpen,
        thermalReceiptPrefill,
        openThermalPrintModal,
        // WhatsApp Business API
        isWhatsAppBusinessModalOpen,
        setIsWhatsAppBusinessModalOpen,
        whatsAppTarget,
        openWhatsAppBusinessModal,
        // Backups
        isBackupModalOpen,
        setIsBackupModalOpen,
        // Customer Portal
        isCustomerPortalModalOpen,
        setIsCustomerPortalModalOpen,
        customerPortalTarget,
        openCustomerPortalModal,
        // Command Palette
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        // Zoho Books Organization Profile & Signature
        organizationProfile,
        updateOrganizationProfile,
        isOrgModalOpen,
        setIsOrgModalOpen,
        openOrgModal,
        // PWA App Installation
        isInstallAppModalOpen,
        setIsInstallAppModalOpen,
        openInstallAppModal,
        sendWhatsAppReminder,
        toasts,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
