/**
 * Multi-User Role-Based Access Control (RBAC)
 * Granular permissions matrix for Owner, Manager, Cashier, and Accountant.
 */

import { UserRole, RolePermissions, StaffMember } from '../types.ts';

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  owner: {
    canViewDashboard: true,
    canCreatePO: true,
    canDeletePO: true,
    canAdjustInventory: true,
    canAddKhataEntry: true,
    canDeleteKhataEntry: true,
    canManageSuppliers: true,
    canManageCustomers: true,
    canViewReports: true,
    canAccessTaxAudit: true,
    canAccessReconciliation: true,
    canManageStaff: true,
    canPrintThermal: true,
    canScanOCR: true,
    canManageBackups: true,
  },
  manager: {
    canViewDashboard: true,
    canCreatePO: true,
    canDeletePO: false,
    canAdjustInventory: true,
    canAddKhataEntry: true,
    canDeleteKhataEntry: false,
    canManageSuppliers: true,
    canManageCustomers: true,
    canViewReports: true,
    canAccessTaxAudit: false,
    canAccessReconciliation: true,
    canManageStaff: false,
    canPrintThermal: true,
    canScanOCR: true,
    canManageBackups: false,
  },
  cashier: {
    canViewDashboard: false,
    canCreatePO: false,
    canDeletePO: false,
    canAdjustInventory: false,
    canAddKhataEntry: true,
    canDeleteKhataEntry: false,
    canManageSuppliers: false,
    canManageCustomers: true,
    canViewReports: false,
    canAccessTaxAudit: false,
    canAccessReconciliation: false,
    canManageStaff: false,
    canPrintThermal: true,
    canScanOCR: true,
    canManageBackups: false,
  },
  accountant: {
    canViewDashboard: true,
    canCreatePO: false,
    canDeletePO: false,
    canAdjustInventory: false,
    canAddKhataEntry: true,
    canDeleteKhataEntry: false,
    canManageSuppliers: true,
    canManageCustomers: true,
    canViewReports: true,
    canAccessTaxAudit: true,
    canAccessReconciliation: true,
    canManageStaff: false,
    canPrintThermal: true,
    canScanOCR: true,
    canManageBackups: true,
  },
};

export const DEFAULT_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Rajesh Patel (Owner)',
    email: 'rajesh.owner@retailmart.com',
    phone: '+91 98201 11223',
    role: 'owner',
    pinCode: '1111',
    avatarColor: 'bg-indigo-600 text-white',
    status: 'active',
    lastActive: 'Just now',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: 'staff-2',
    name: 'Sunita Sharma (Manager)',
    email: 'sunita.manager@retailmart.com',
    phone: '+91 98202 22334',
    role: 'manager',
    pinCode: '2222',
    avatarColor: 'bg-emerald-600 text-white',
    status: 'active',
    lastActive: '10 mins ago',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
  {
    id: 'staff-3',
    name: 'Amit Kumar (Cashier)',
    email: 'amit.cashier@retailmart.com',
    phone: '+91 98203 33445',
    role: 'cashier',
    pinCode: '3333',
    avatarColor: 'bg-amber-600 text-white',
    status: 'active',
    lastActive: '1 hour ago',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'staff-4',
    name: 'Vikram Joshi (Accountant)',
    email: 'vikram.cpa@retailmart.com',
    phone: '+91 98204 44556',
    role: 'accountant',
    pinCode: '4444',
    avatarColor: 'bg-purple-600 text-white',
    status: 'active',
    lastActive: 'Yesterday',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
];

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

export function getRoleBadgeInfo(role: UserRole): { label: string; bg: string; text: string; border: string } {
  switch (role) {
    case 'owner':
      return { label: 'Business Owner', bg: 'bg-indigo-100 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' };
    case 'manager':
      return { label: 'Store Manager', bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' };
    case 'cashier':
      return { label: 'Counter Cashier', bg: 'bg-amber-100 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' };
    case 'accountant':
      return { label: 'Chartered Accountant', bg: 'bg-purple-100 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' };
    default:
      return { label: 'User', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  }
}
