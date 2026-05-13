import Dexie, { type Table } from 'dexie';

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalOrders: number;
  status: 'Active' | 'Inactive';
  createdAt: Date;
}

export interface Product {
  id?: number;
  name: string;
  price: number;
  category: string; // Dynamic now
  description?: string;
  image?: string;
  images?: string[];
  createdAt: Date;
}

export interface ProductCategory {
  id?: number;
  name: string;
  createdAt: Date;
}

export interface Order {
  id?: number;
  orderNumber: string; // Branded ID: #MBB-XXXXX
  customerId: number;
  customerName: string; 
  items: string; 
  amount: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  deadline: Date;
  createdAt: Date;
  notes?: string;
}

export interface Recipe {
  id?: number;
  title: string;
  ingredients: string;
  method: string;
  notes?: string;
  createdAt: Date;
}

export interface Equipment {
  id?: number;
  name: string;
  category: string;
  status: 'Operational' | 'Maintenance' | 'Broken';
  purchaseDate: Date;
  lastMaintained?: Date;
  price: number;
  serialNumber?: string;
  notes?: string;
  createdAt: Date;
}

export class MysteryBakeDB extends Dexie {
  customers!: Table<Customer>;
  orders!: Table<Order>;
  recipes!: Table<Recipe>;
  products!: Table<Product>;
  productCategories!: Table<ProductCategory>;
  equipment!: Table<Equipment>;

  constructor() {
    super('MysteryBakeDB');
    this.version(6).stores({
      customers: '++id, name, phone, status',
      orders: '++id, orderNumber, customerId, status, deadline',
      recipes: '++id, title',
      products: '++id, name, category',
      productCategories: '++id, name',
      equipment: '++id, name, category, status'
    });
  }
}

export const db = new MysteryBakeDB();
