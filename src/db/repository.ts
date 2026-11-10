import { db } from './index.ts';
import {
  suppliers,
  inventory,
  purchaseOrders,
  purchaseOrderItems,
  payments,
  stockAdjustments,
} from './schema.ts';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface CreateSupplierInput {
  name: string;
  category: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  paymentTerms: string;
  creditLimit: number;
  currentBalance?: number;
  notes?: string;
}

export interface CreateInventoryInput {
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderLevel: number;
  preferredSupplierId?: number;
}

export interface CreatePOItemInput {
  inventoryId?: number;
  itemName: string;
  unit: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface CreatePOInput {
  supplierId: number;
  supplierName: string;
  paymentTerms: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  items: CreatePOItemInput[];
}

export interface CreatePaymentInput {
  supplierId: number;
  poId?: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

// ---------------- SUPPLIERS ----------------
export async function getSuppliers(userId: string) {
  try {
    return await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.userId, userId))
      .orderBy(desc(suppliers.currentBalance));
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw new Error('Failed to fetch suppliers', { cause: error });
  }
}

export async function createSupplier(userId: string, data: CreateSupplierInput) {
  try {
    const result = await db
      .insert(suppliers)
      .values({
        userId,
        name: data.name,
        category: data.category || 'General Wholesale',
        contactPerson: data.contactPerson || '',
        phone: data.phone || '',
        email: data.email || '',
        paymentTerms: data.paymentTerms || 'Net 14',
        creditLimit: data.creditLimit || 0,
        currentBalance: data.currentBalance || 0,
        notes: data.notes || '',
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw new Error('Failed to create supplier', { cause: error });
  }
}

export async function updateSupplier(userId: string, id: number, data: Partial<CreateSupplierInput>) {
  try {
    const result = await db
      .update(suppliers)
      .set({
        ...data,
      })
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw new Error('Failed to update supplier', { cause: error });
  }
}

export async function deleteSupplier(userId: string, id: number) {
  try {
    await db.delete(suppliers).where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)));
    return { success: true };
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw new Error('Failed to delete supplier', { cause: error });
  }
}

// ---------------- INVENTORY ----------------
export async function getInventory(userId: string) {
  try {
    return await db
      .select()
      .from(inventory)
      .where(eq(inventory.userId, userId))
      .orderBy(inventory.name);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw new Error('Failed to fetch inventory', { cause: error });
  }
}

export async function createInventoryItem(userId: string, data: CreateInventoryInput) {
  try {
    const result = await db
      .insert(inventory)
      .values({
        userId,
        sku: data.sku || `SKU-${Date.now().toString().slice(-4)}`,
        name: data.name,
        category: data.category || 'General',
        unit: data.unit || 'pcs',
        costPrice: data.costPrice || 0,
        sellingPrice: data.sellingPrice || 0,
        quantity: data.quantity || 0,
        reorderLevel: data.reorderLevel || 10,
        preferredSupplierId: data.preferredSupplierId || null,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw new Error('Failed to create inventory item', { cause: error });
  }
}

export async function updateInventoryItem(userId: string, id: number, data: Partial<CreateInventoryInput>) {
  try {
    const result = await db
      .update(inventory)
      .set({ ...data })
      .where(and(eq(inventory.id, id), eq(inventory.userId, userId)))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw new Error('Failed to update inventory item', { cause: error });
  }
}

export async function adjustStock(
  userId: string,
  inventoryId: number,
  changeType: 'sale' | 'restock_po' | 'damage' | 'manual_adjustment',
  quantityDelta: number,
  notes?: string
) {
  try {
    const current = await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.id, inventoryId), eq(inventory.userId, userId)))
      .limit(1);

    if (current.length === 0) throw new Error('Item not found');

    const item = current[0];
    const newQty = Math.max(0, item.quantity + quantityDelta);

    await db
      .update(inventory)
      .set({ quantity: newQty })
      .where(eq(inventory.id, inventoryId));

    await db.insert(stockAdjustments).values({
      userId,
      inventoryId,
      changeType,
      quantityDelta,
      previousQty: item.quantity,
      newQty,
      notes: notes || '',
    });

    return { ...item, quantity: newQty };
  } catch (error) {
    console.error('Error adjusting stock:', error);
    throw new Error('Failed to adjust stock', { cause: error });
  }
}

export async function deleteInventoryItem(userId: string, id: number) {
  try {
    await db.delete(inventory).where(and(eq(inventory.id, id), eq(inventory.userId, userId)));
    return { success: true };
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw new Error('Failed to delete inventory item', { cause: error });
  }
}

// ---------------- PURCHASE ORDERS ----------------
export async function getPurchaseOrders(userId: string) {
  try {
    const pos = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.userId, userId))
      .orderBy(desc(purchaseOrders.createdAt));

    const poIds = pos.map((p) => p.id);
    let items: any[] = [];
    if (poIds.length > 0) {
      items = await db
        .select()
        .from(purchaseOrderItems)
        .where(sql`${purchaseOrderItems.poId} IN ${poIds}`);
    }

    return pos.map((po) => ({
      ...po,
      items: items.filter((item) => item.poId === po.id),
    }));
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    throw new Error('Failed to fetch purchase orders', { cause: error });
  }
}

export async function createPurchaseOrder(userId: string, data: CreatePOInput) {
  try {
    const totalAmount = data.items.reduce((sum, it) => sum + (it.quantity * it.unitCost), 0);
    const poNumber = `PO-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPO = await db
      .insert(purchaseOrders)
      .values({
        userId,
        poNumber,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        status: 'draft',
        paymentStatus: 'unpaid',
        paymentTerms: data.paymentTerms || 'Net 14',
        totalAmount,
        amountPaid: 0,
        issueDate: data.issueDate || new Date().toISOString().slice(0, 10),
        dueDate: data.dueDate,
        notes: data.notes || '',
      })
      .returning();

    const po = newPO[0];

    const insertedItems = [];
    for (const item of data.items) {
      const it = await db
        .insert(purchaseOrderItems)
        .values({
          poId: po.id,
          inventoryId: item.inventoryId || null,
          itemName: item.itemName,
          unit: item.unit || 'pcs',
          quantity: item.quantity,
          unitCost: item.unitCost,
          subtotal: item.quantity * item.unitCost,
        })
        .returning();
      insertedItems.push(it[0]);
    }

    return { ...po, items: insertedItems };
  } catch (error) {
    console.error('Error creating purchase order:', error);
    throw new Error('Failed to create purchase order', { cause: error });
  }
}

export async function updatePOStatus(
  userId: string,
  poId: number,
  newStatus: 'draft' | 'sent' | 'received' | 'cancelled'
) {
  try {
    const existing = await db
      .select()
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.id, poId), eq(purchaseOrders.userId, userId)))
      .limit(1);

    if (existing.length === 0) throw new Error('Purchase order not found');
    const po = existing[0];

    // If changing to 'received' and wasn't already received:
    // 1. Increment inventory levels
    // 2. Increase supplier credit balance
    if (newStatus === 'received' && po.status !== 'received') {
      const items = await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.poId, poId));

      for (const item of items) {
        if (item.inventoryId) {
          const invItem = await db
            .select()
            .from(inventory)
            .where(eq(inventory.id, item.inventoryId))
            .limit(1);

          if (invItem.length > 0) {
            const currentQty = invItem[0].quantity;
            await db
              .update(inventory)
              .set({ quantity: currentQty + item.quantity })
              .where(eq(inventory.id, item.inventoryId));

            await db.insert(stockAdjustments).values({
              userId,
              inventoryId: item.inventoryId,
              changeType: 'restock_po',
              quantityDelta: item.quantity,
              previousQty: currentQty,
              newQty: currentQty + item.quantity,
              notes: `Restock received from PO #${po.poNumber}`,
            });
          }
        }
      }

      // Add to supplier debt/balance
      const supplier = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.id, po.supplierId))
        .limit(1);

      if (supplier.length > 0) {
        const unpaidOnThisPO = po.totalAmount - po.amountPaid;
        await db
          .update(suppliers)
          .set({ currentBalance: supplier[0].currentBalance + unpaidOnThisPO })
          .where(eq(suppliers.id, po.supplierId));
      }
    }

    const updated = await db
      .update(purchaseOrders)
      .set({ status: newStatus })
      .where(eq(purchaseOrders.id, poId))
      .returning();

    return updated[0];
  } catch (error) {
    console.error('Error updating PO status:', error);
    throw new Error('Failed to update PO status', { cause: error });
  }
}

// ---------------- PAYMENTS ----------------
export async function getPayments(userId: string, supplierId?: number) {
  try {
    if (supplierId) {
      return await db
        .select()
        .from(payments)
        .where(and(eq(payments.userId, userId), eq(payments.supplierId, supplierId)))
        .orderBy(desc(payments.createdAt));
    }
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw new Error('Failed to fetch payments', { cause: error });
  }
}

export async function createPayment(userId: string, data: CreatePaymentInput) {
  try {
    const payment = await db
      .insert(payments)
      .values({
        userId,
        supplierId: data.supplierId,
        poId: data.poId || null,
        amount: data.amount,
        paymentDate: data.paymentDate || new Date().toISOString().slice(0, 10),
        paymentMethod: data.paymentMethod || 'Cash',
        referenceNumber: data.referenceNumber || '',
        notes: data.notes || '',
      })
      .returning();

    // 1. Decrement supplier debt balance
    const supplier = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, data.supplierId))
      .limit(1);

    if (supplier.length > 0) {
      const newBalance = Math.max(0, supplier[0].currentBalance - data.amount);
      await db
        .update(suppliers)
        .set({ currentBalance: newBalance })
        .where(eq(suppliers.id, data.supplierId));
    }

    // 2. If tied to a specific PO, update PO payment status
    if (data.poId) {
      const po = await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, data.poId))
        .limit(1);

      if (po.length > 0) {
        const newPaid = po[0].amountPaid + data.amount;
        let newPayStatus = po[0].paymentStatus;
        if (newPaid >= po[0].totalAmount) {
          newPayStatus = 'paid';
        } else if (newPaid > 0) {
          newPayStatus = 'partially_paid';
        }

        await db
          .update(purchaseOrders)
          .set({
            amountPaid: newPaid,
            paymentStatus: newPayStatus,
          })
          .where(eq(purchaseOrders.id, data.poId));
      }
    }

    return payment[0];
  } catch (error) {
    console.error('Error recording payment:', error);
    throw new Error('Failed to record payment', { cause: error });
  }
}

// ---------------- SEED REALISTIC KIOSK & SUPPLIER DATA ----------------
export async function seedDemoData(userId: string) {
  try {
    // Check if user already has suppliers
    const existing = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return { message: 'Data already exists for this shop' };
    }

    const today = new Date();
    const formatDate = (daysOffset: number) => {
      const d = new Date();
      d.setDate(today.getDate() + daysOffset);
      return d.toISOString().slice(0, 10);
    };

    // 1. Insert 4 Suppliers with varying credit terms & credit balances
    const s1 = (
      await db
        .insert(suppliers)
        .values({
          userId,
          name: 'Apex Wholesale Beverages Ltd',
          category: 'Beverages & Soft Drinks',
          contactPerson: 'David Mutua',
          phone: '+1 (555) 234-8901',
          email: 'orders@apexbeverages.com',
          paymentTerms: 'Net 7',
          creditLimit: 3500,
          currentBalance: 1850,
          notes: 'Delivers on Mondays & Thursdays. Delivers chilled crates.',
        })
        .returning()
    )[0];

    const s2 = (
      await db
        .insert(suppliers)
        .values({
          userId,
          name: 'Crown Dairy & Bakery Mills',
          category: 'Dairy, Bread & Pastries',
          contactPerson: 'Sarah Jenkins',
          phone: '+1 (555) 432-1199',
          email: 'sarah@crowndairy.com',
          paymentTerms: 'Net 14',
          creditLimit: 2000,
          currentBalance: 820,
          notes: 'Daily early morning delivery (6:30 AM). Returns accepted for expired loaves within 24h.',
        })
        .returning()
    )[0];

    const s3 = (
      await db
        .insert(suppliers)
        .values({
          userId,
          name: 'Equator Commodities & Grains',
          category: 'Staples & Dry Goods',
          contactPerson: 'Hassan Ali',
          phone: '+1 (555) 789-3320',
          email: 'sales@equatorcommodities.com',
          paymentTerms: 'Net 30',
          creditLimit: 6000,
          currentBalance: 4200,
          notes: '50kg sacks of rice, sugar, maize flour, and 20L cooking oil jerricans.',
        })
        .returning()
    )[0];

    const s4 = (
      await db
        .insert(suppliers)
        .values({
          userId,
          name: 'Prime FMCG & Toiletries Co.',
          category: 'Household & Personal Care',
          contactPerson: 'Grace Wanjiru',
          phone: '+1 (555) 998-6644',
          email: 'supply@primefmcg.com',
          paymentTerms: 'Net 14',
          creditLimit: 2500,
          currentBalance: 450,
          notes: 'Soaps, detergents, toothpaste, batteries, matches.',
        })
        .returning()
    )[0];

    // 2. Insert Retail & Kiosk Inventory
    const invData = [
      {
        userId,
        sku: 'BEV-001',
        name: 'Sparkling Soda 500ml (Pack of 24)',
        category: 'Beverages',
        unit: 'packs',
        costPrice: 14.5,
        sellingPrice: 22.0,
        quantity: 4, // Low stock (Reorder point: 8)
        reorderLevel: 8,
        preferredSupplierId: s1.id,
      },
      {
        userId,
        sku: 'BEV-002',
        name: 'Mineral Water 1L (Carton of 12)',
        category: 'Beverages',
        unit: 'carton',
        costPrice: 6.8,
        sellingPrice: 12.0,
        quantity: 2, // Low stock (Reorder point: 6)
        reorderLevel: 6,
        preferredSupplierId: s1.id,
      },
      {
        userId,
        sku: 'BEV-003',
        name: 'Tropical Energy Drink 250ml (Crate of 24)',
        category: 'Beverages',
        unit: 'crates',
        costPrice: 18.0,
        sellingPrice: 28.8,
        quantity: 15,
        reorderLevel: 5,
        preferredSupplierId: s1.id,
      },
      {
        userId,
        sku: 'DRY-101',
        name: 'Premium Long Grain Rice (25kg Bag)',
        category: 'Dry Goods',
        unit: 'bags',
        costPrice: 28.0,
        sellingPrice: 38.5,
        quantity: 3, // Low stock
        reorderLevel: 5,
        preferredSupplierId: s3.id,
      },
      {
        userId,
        sku: 'DRY-102',
        name: 'Refined Sunflower Cooking Oil (5L)',
        category: 'Dry Goods',
        unit: 'pcs',
        costPrice: 9.2,
        sellingPrice: 13.5,
        quantity: 14,
        reorderLevel: 6,
        preferredSupplierId: s3.id,
      },
      {
        userId,
        sku: 'DRY-103',
        name: 'Fortified Wheat Flour (10x2kg Bundle)',
        category: 'Dry Goods',
        unit: 'bundle',
        costPrice: 16.5,
        sellingPrice: 24.0,
        quantity: 1, // Critical low stock
        reorderLevel: 4,
        preferredSupplierId: s3.id,
      },
      {
        userId,
        sku: 'DAIRY-201',
        name: 'Pasteurized Whole Milk 500ml (Crate of 20)',
        category: 'Dairy',
        unit: 'crates',
        costPrice: 12.0,
        sellingPrice: 18.0,
        quantity: 5,
        reorderLevel: 4,
        preferredSupplierId: s2.id,
      },
      {
        userId,
        sku: 'DAIRY-202',
        name: 'Fresh Sandwich Bread 800g (Crate of 10)',
        category: 'Bakery',
        unit: 'crates',
        costPrice: 8.5,
        sellingPrice: 13.0,
        quantity: 2, // Low stock
        reorderLevel: 5,
        preferredSupplierId: s2.id,
      },
      {
        userId,
        sku: 'FMCG-301',
        name: 'Antibacterial Bar Soap (Box of 48)',
        category: 'Household',
        unit: 'box',
        costPrice: 22.0,
        sellingPrice: 35.0,
        quantity: 6,
        reorderLevel: 3,
        preferredSupplierId: s4.id,
      },
      {
        userId,
        sku: 'FMCG-302',
        name: 'Heavy Duty AA Batteries (Card of 24)',
        category: 'Household',
        unit: 'packs',
        costPrice: 11.0,
        sellingPrice: 19.2,
        quantity: 8,
        reorderLevel: 4,
        preferredSupplierId: s4.id,
      },
    ];

    const insertedInventory = [];
    for (const inv of invData) {
      const it = await db.insert(inventory).values(inv).returning();
      insertedInventory.push(it[0]);
    }

    // 3. Insert Realistic Purchase Orders with Due Dates
    // PO 1: Overdue by 2 days (Apex Beverages)
    const po1 = (
      await db
        .insert(purchaseOrders)
        .values({
          userId,
          poNumber: 'PO-2608-8120',
          supplierId: s1.id,
          supplierName: s1.name,
          status: 'received',
          paymentStatus: 'unpaid',
          paymentTerms: 'Net 7',
          totalAmount: 1100,
          amountPaid: 0,
          issueDate: formatDate(-9),
          dueDate: formatDate(-2), // Overdue!
          notes: 'Restock for weekend rush. Credit line invoice #INV-9901.',
        })
        .returning()
    )[0];

    await db.insert(purchaseOrderItems).values([
      {
        poId: po1.id,
        inventoryId: insertedInventory[0].id,
        itemName: 'Sparkling Soda 500ml (Pack of 24)',
        unit: 'packs',
        quantity: 50,
        unitCost: 14.5,
        subtotal: 725,
      },
      {
        poId: po1.id,
        inventoryId: insertedInventory[1].id,
        itemName: 'Mineral Water 1L (Carton of 12)',
        unit: 'carton',
        quantity: 55,
        unitCost: 6.8,
        subtotal: 374,
      },
    ]);

    // PO 2: Due in 2 days (Crown Dairy)
    const po2 = (
      await db
        .insert(purchaseOrders)
        .values({
          userId,
          poNumber: 'PO-2608-8145',
          supplierId: s2.id,
          supplierName: s2.name,
          status: 'received',
          paymentStatus: 'partially_paid',
          paymentTerms: 'Net 14',
          totalAmount: 820,
          amountPaid: 300,
          issueDate: formatDate(-12),
          dueDate: formatDate(2), // Due in 2 days!
          notes: 'Morning supply batch. Partial cash paid on drop-off.',
        })
        .returning()
    )[0];

    await db.insert(purchaseOrderItems).values([
      {
        poId: po2.id,
        inventoryId: insertedInventory[6].id,
        itemName: 'Pasteurized Whole Milk 500ml (Crate of 20)',
        unit: 'crates',
        quantity: 40,
        unitCost: 12.0,
        subtotal: 480,
      },
      {
        poId: po2.id,
        inventoryId: insertedInventory[7].id,
        itemName: 'Fresh Sandwich Bread 800g (Crate of 10)',
        unit: 'crates',
        quantity: 40,
        unitCost: 8.5,
        subtotal: 340,
      },
    ]);

    // Record partial payment for PO 2
    await db.insert(payments).values({
      userId,
      supplierId: s2.id,
      poId: po2.id,
      amount: 300,
      paymentDate: formatDate(-12),
      paymentMethod: 'Cash',
      referenceNumber: 'CASH-REC-001',
      notes: 'Initial cash deposit upon delivery.',
    });

    // PO 3: Due in 18 days (Equator Commodities)
    const po3 = (
      await db
        .insert(purchaseOrders)
        .values({
          userId,
          poNumber: 'PO-2608-8188',
          supplierId: s3.id,
          supplierName: s3.name,
          status: 'received',
          paymentStatus: 'unpaid',
          paymentTerms: 'Net 30',
          totalAmount: 2600,
          amountPaid: 0,
          issueDate: formatDate(-12),
          dueDate: formatDate(18),
          notes: 'Bulk grain and cooking oil monthly replenishment.',
        })
        .returning()
    )[0];

    await db.insert(purchaseOrderItems).values([
      {
        poId: po3.id,
        inventoryId: insertedInventory[3].id,
        itemName: 'Premium Long Grain Rice (25kg Bag)',
        unit: 'bags',
        quantity: 50,
        unitCost: 28.0,
        subtotal: 1400,
      },
      {
        poId: po3.id,
        inventoryId: insertedInventory[4].id,
        itemName: 'Refined Sunflower Cooking Oil (5L)',
        unit: 'pcs',
        quantity: 80,
        unitCost: 9.2,
        subtotal: 736,
      },
      {
        poId: po3.id,
        inventoryId: insertedInventory[5].id,
        itemName: 'Fortified Wheat Flour (10x2kg Bundle)',
        unit: 'bundle',
        quantity: 28,
        unitCost: 16.5,
        subtotal: 462,
      },
    ]);

    return { message: 'Demo data loaded successfully' };
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw new Error('Failed to seed demo data', { cause: error });
  }
}
