import Dexie, { type Table } from 'dexie'
import { createClient } from '@supabase/supabase-js'

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalOrders: number;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt?: Date;
}

export interface Product {
  id?: string;
  name: string;
  price: number;
  category: string; // Dynamic now
  description?: string;
  image?: string;
  images?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface ProductCategory {
  id?: string;
  name: string;
  createdAt: Date;
}

export interface Order {
  id?: string;
  orderNumber: string; // Branded ID: #MBB-XXXXX
  customerId: string;
  customerName: string; 
  items: string; 
  amount: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  deadline: Date;
  createdAt: Date;
  notes?: string;
  updatedAt?: Date;
}

export interface Recipe {
  id?: string;
  title: string;
  ingredients: string;
  method: string;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Equipment {
  id?: string;
  name: string;
  category: string;
  status: 'Operational' | 'Maintenance' | 'Broken';
  purchaseDate: Date;
  lastMaintained?: Date;
  price: number;
  serialNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PantryItem {
  id?: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unit: string; // e.g. kg, liters, crates, bags
  lastPrice: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  notes?: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface PantryHistory {
  id?: string;
  itemId: string;
  itemName: string;
  type: 'Restock' | 'Usage' | 'Waste' | 'Adjustment';
  quantity: number; // The delta (+ or -)
  unit: string;
  pricePerUnit: number; // At the time of transaction
  totalValue: number;
  createdAt: Date;
}

// -------------------------------------------------------------
// 💾 LOCAL DATABASE (DEXIE INDEXEDDB) - For Testing & Mock Data
// -------------------------------------------------------------
export class MysteryBakeDB extends Dexie {
  customers!: Table<Customer, string>;
  products!: Table<Product, string>;
  productCategories!: Table<ProductCategory, string>;
  orders!: Table<Order, string>;
  recipes!: Table<Recipe, string>;
  equipment!: Table<Equipment, string>;
  pantry!: Table<PantryItem, string>;
  pantryHistory!: Table<PantryHistory, string>;

  constructor() {
    super('MysteryBakeDB');
    this.version(1).stores({
      customers: 'id, name, status',
      products: 'id, name, category',
      productCategories: 'id, name',
      orders: 'id, orderNumber, customerId, customerName, status',
      recipes: 'id, title',
      equipment: 'id, name, status',
      pantry: 'id, name, category, status',
      pantryHistory: 'id, itemId, type'
    });
  }
}

export const db = new MysteryBakeDB();

// -------------------------------------------------------------
// ☁️ CLOUD DATABASE (SUPABASE POSTGRES) - For Real Production Data
// -------------------------------------------------------------
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://nynympzaeyrtecqvufac.supabase.co'
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55bnltcHphZXlydGVjcXZ1ZmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTc4ODgsImV4cCI6MjA5Mzk5Mzg4OH0.V-G_9i0tDYYCwAjUO25mbNndxgZVhuVJBA-yFj-styI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// -------------------------------------------------------------
export const isCloudMode = (): boolean => {
  const mode = localStorage.getItem('mbb_db_mode');
  if (mode === null) {
    return true; // Default to cloud mode
  }
  return mode === 'cloud';
}

export const setDbMode = (mode: 'local' | 'cloud') => {
  localStorage.setItem('mbb_db_mode', mode);
}

// -------------------------------------------------------------
// 🔑 Safe UUID Generator (handles non-secure HTTP contexts dynamically)
// -------------------------------------------------------------
export const generateUUID = (): string => {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID()
  }
  // Math.random fallback (RF-4122 compliant)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
