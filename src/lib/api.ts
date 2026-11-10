import { auth } from './firebase.ts';
import {
  Supplier,
  InventoryItem,
  PurchaseOrder,
  Payment,
  DashboardStats,
  UserProfile,
} from '../types.ts';

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    } catch (e) {
      console.warn('Failed to get user id token, falling back to demo mode:', e);
    }
  }

  // Fallback to local session demo mode
  headers['Authorization'] = 'Bearer demo-token';
  headers['x-demo-user'] = 'true';
  return headers;
}

export const api = {
  async getProfile(): Promise<UserProfile> {
    const res = await fetch('/api/profile', { headers: await getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch('/api/dashboard/stats', { headers: await getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load dashboard statistics');
    return res.json();
  },

  async seedDemoData(): Promise<{ message: string }> {
    const res = await fetch('/api/seed', {
      method: 'POST',
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to seed demo data');
    return res.json();
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const res = await fetch('/api/suppliers', { headers: await getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch suppliers');
    return res.json();
  },

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create supplier');
    return res.json();
  },

  async updateSupplier(id: number, data: Partial<Supplier>): Promise<Supplier> {
    const res = await fetch(`/api/suppliers/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update supplier');
    return res.json();
  },

  async deleteSupplier(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/suppliers/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete supplier');
    return res.json();
  },

  // Inventory
  async getInventory(): Promise<InventoryItem[]> {
    const res = await fetch('/api/inventory', { headers: await getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
  },

  async createInventoryItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create inventory item');
    return res.json();
  },

  async updateInventoryItem(id: number, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update inventory item');
    return res.json();
  },

  async adjustStock(
    id: number,
    changeType: 'sale' | 'restock_po' | 'damage' | 'manual_adjustment',
    quantityDelta: number,
    notes?: string
  ): Promise<InventoryItem> {
    const res = await fetch(`/api/inventory/${id}/adjust`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ changeType, quantityDelta, notes }),
    });
    if (!res.ok) throw new Error('Failed to adjust stock');
    return res.json();
  },

  async deleteInventoryItem(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/inventory/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete inventory item');
    return res.json();
  },

  // Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const res = await fetch('/api/purchase-orders', { headers: await getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch purchase orders');
    return res.json();
  },

  async createPurchaseOrder(data: {
    supplierId: number;
    supplierName: string;
    paymentTerms: string;
    issueDate: string;
    dueDate: string;
    notes?: string;
    items: Array<{
      inventoryId?: number;
      itemName: string;
      unit: string;
      quantity: number;
      unitCost: number;
    }>;
  }): Promise<PurchaseOrder> {
    const res = await fetch('/api/purchase-orders', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create purchase order');
    return res.json();
  },

  async updatePOStatus(
    id: number,
    status: 'draft' | 'sent' | 'received' | 'cancelled'
  ): Promise<PurchaseOrder> {
    const res = await fetch(`/api/purchase-orders/${id}/status`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update PO status');
    return res.json();
  },

  // Payments
  async getPayments(supplierId?: number): Promise<Payment[]> {
    const url = supplierId ? `/api/payments?supplierId=${supplierId}` : '/api/payments';
    const res = await fetch(url, { headers: await getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch payments');
    return res.json();
  },

  async recordPayment(data: {
    supplierId: number;
    poId?: number | null;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
  }): Promise<Payment> {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to record payment');
    return res.json();
  },

  createPayment(data: {
    supplierId: number;
    poId?: number | null;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
  }): Promise<Payment> {
    return this.recordPayment(data);
  },
};
