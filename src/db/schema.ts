import { integer, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  shopName: text('shop_name').default('Neighborhood Mart & Kiosk'),
  currency: text('currency').default('USD'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull().default('General Wholesale'),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  paymentTerms: text('payment_terms').notNull().default('Net 14'), // 'Net 7', 'Net 14', 'Net 30', 'COD', 'Prepaid'
  creditLimit: real('credit_limit').notNull().default(0),
  currentBalance: real('current_balance').notNull().default(0), // outstanding debt owed to supplier
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull().default('General'),
  unit: text('unit').notNull().default('pcs'), // 'carton', 'crates', 'bags', 'kg', 'pcs', 'packs'
  costPrice: real('cost_price').notNull().default(0),
  sellingPrice: real('selling_price').notNull().default(0),
  quantity: integer('quantity').notNull().default(0),
  reorderLevel: integer('reorder_level').notNull().default(10),
  preferredSupplierId: integer('preferred_supplier_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const purchaseOrders = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  poNumber: text('po_number').notNull(),
  supplierId: integer('supplier_id').notNull(),
  supplierName: text('supplier_name').notNull(),
  status: text('status').notNull().default('draft'), // 'draft', 'sent', 'received', 'cancelled'
  paymentStatus: text('payment_status').notNull().default('unpaid'), // 'unpaid', 'partially_paid', 'paid'
  paymentTerms: text('payment_terms').notNull().default('Net 14'),
  totalAmount: real('total_amount').notNull().default(0),
  amountPaid: real('amount_paid').notNull().default(0),
  issueDate: text('issue_date').notNull(), // YYYY-MM-DD
  dueDate: text('due_date').notNull(), // YYYY-MM-DD
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: serial('id').primaryKey(),
  poId: integer('po_id').notNull(),
  inventoryId: integer('inventory_id'),
  itemName: text('item_name').notNull(),
  unit: text('unit').notNull().default('pcs'),
  quantity: integer('quantity').notNull().default(1),
  unitCost: real('unit_cost').notNull().default(0),
  subtotal: real('subtotal').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  supplierId: integer('supplier_id').notNull(),
  poId: integer('po_id'),
  amount: real('amount').notNull().default(0),
  paymentDate: text('payment_date').notNull(), // YYYY-MM-DD
  paymentMethod: text('payment_method').notNull().default('Cash'), // 'M-Pesa / Mobile Money', 'Cash', 'Bank Transfer', 'Cheque'
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const stockAdjustments = pgTable('stock_adjustments', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  inventoryId: integer('inventory_id').notNull(),
  changeType: text('change_type').notNull(), // 'sale', 'restock_po', 'damage', 'manual_adjustment'
  quantityDelta: integer('quantity_delta').notNull(),
  previousQty: integer('previous_qty').notNull(),
  newQty: integer('new_qty').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});
