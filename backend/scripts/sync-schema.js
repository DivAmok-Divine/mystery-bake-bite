const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

//npm run db:sync - Complex@Plex1254 this is code t run it
// Check if 'pg' is installed. If not, install it.
try {
  require.resolve('pg');
} catch (e) {
  console.log('📦 Installing "pg" package for database connection...');
  execSync('npm install pg', { stdio: 'inherit' });
}

const { Client } = require('pg');

// Read VITE_SUPABASE_URL from env.local
const envPaths = [
  path.join(__dirname, '../../management-system-frontend/.env.local'),
  path.join(__dirname, '../management-system-frontend/.env.local'),
  path.join(process.cwd(), 'management-system-frontend/.env.local'),
  path.join(process.cwd(), '.env.local')
];

let supabaseUrl = '';
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8');
    const match = content.match(/VITE_SUPABASE_URL=["']?([^"'\s]+)/);
    if (match) {
      supabaseUrl = match[1];
      break;
    }
  }
}

if (!supabaseUrl) {
  console.error('❌ Could not find VITE_SUPABASE_URL in your .env.local file.');
  process.exit(1);
}

// Extract Project ID (e.g. nynympzaeyrtecqvufac from https://nynympzaeyrtecqvufac.supabase.co)
const hostMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
if (!hostMatch) {
  console.error('❌ Invalid Supabase URL format.');
  process.exit(1);
}

const projectId = hostMatch[1];

// Common Supabase AWS regions for auto-discovery (eu-west-1 is placed first for instant connection!)
const regions = [
  'eu-west-1',      // Ireland (Primary)
  'us-east-1',      // N. Virginia
  'eu-central-1',   // Frankfurt
  'ap-southeast-1', // Singapore
  'us-west-1',      // N. California
  'us-east-2',      // Ohio
  'us-west-2',      // Oregon
  'eu-west-2',      // London
  'eu-west-3',      // Paris
  'sa-east-1',      // São Paulo
  'ap-northeast-1', // Tokyo
  'ap-northeast-2', // Seoul
  'ca-central-1'    // Canada
];

console.log('----------------------------------------------------');
console.log('🥞 MysteryBakeBite Database Auto-Sync Tool');
console.log('----------------------------------------------------');
console.log(`🔌 Project ID: ${projectId}`);
console.log('🌎 Auto-detecting your project region...');
console.log('----------------------------------------------------');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('🔑 Enter your Database Password: ', async (password) => {
  rl.close();
  
  if (!password) {
    console.error('❌ Password cannot be empty.');
    process.exit(1);
  }

  let connectedClient = null;

  console.log('📡 Scanning region poolers for your project (this takes a few seconds)...');
  
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const uri = `postgres://postgres.${projectId}:${encodeURIComponent(password)}@${host}:6543/postgres`;
    
    process.stdout.write(`⏳ Testing pooler in: ${region}... `);
    
    const client = new Client({
      connectionString: uri,
      connectionTimeoutMillis: 3500, // Quick timeout for scanning
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      console.log('✅ CONNECTED!');
      connectedClient = client;
      break;
    } catch (err) {
      if (err.message.includes('password authentication failed')) {
        console.log('❌ Password Incorrect');
        console.error('\n❌ Error: Incorrect database password. Check your password and try again.');
        process.exit(1);
      }
      console.log('⏭️ Not found');
    }
  }

  if (!connectedClient) {
    console.log('📡 Trying direct connection fallback to db.' + projectId + '.supabase.co...');
    const directHost = `db.${projectId}.supabase.co`;
    const directUri = `postgres://postgres.${projectId}:${encodeURIComponent(password)}@${directHost}:6543/postgres`;
    
    const client = new Client({
      connectionString: directUri,
      connectionTimeoutMillis: 5000,
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      console.log('✅ DIRECT FALLBACK CONNECTED!');
      connectedClient = client;
    } catch (err) {
      // Try standard port 5432 direct connection too
      const directUriAlt = `postgres://postgres.${projectId}:${encodeURIComponent(password)}@${directHost}:5432/postgres`;
      const clientAlt = new Client({
        connectionString: directUriAlt,
        connectionTimeoutMillis: 5000,
        ssl: {
          rejectUnauthorized: false
        }
      });
      try {
        await clientAlt.connect();
        console.log('✅ DIRECT FALLBACK (5432) CONNECTED!');
        connectedClient = clientAlt;
      } catch (errAlt) {
        console.log('❌ Direct fallback failed: ' + errAlt.message);
      }
    }
  }

  if (!connectedClient) {
    console.error('\n❌ Error: Could not connect to any regional poolers. Please check:');
    console.log('   1. Is your internet connection active?');
    console.log('   2. Is your database password correct?');
    console.log('   3. Is your project active on Supabase?');
    process.exit(1);
  }

  console.log('🚀 Connected successfully! Applying schema migrations...');

  const sqlSchema = `
-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables commented out (No longer needed since migration to UUID is complete! Future runs are 100% data-safe!)
-- DROP TABLE IF EXISTS pantry_history CASCADE;
-- DROP TABLE IF EXISTS pantry CASCADE;
-- DROP TABLE IF EXISTS equipment CASCADE;
-- DROP TABLE IF EXISTS recipes CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS product_categories CASCADE;

-- 2. CREATE PRODUCT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. CREATE CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    total_orders INTEGER DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. CREATE PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image TEXT,
    images TEXT[],
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. CREATE ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    items TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Cancelled')) NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. CREATE RECIPES TABLE
CREATE TABLE IF NOT EXISTS recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    ingredients TEXT NOT NULL,
    method TEXT NOT NULL,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. CREATE EQUIPMENT TABLE
CREATE TABLE IF NOT EXISTS equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'Operational' CHECK (status IN ('Operational', 'Maintenance', 'Broken')) NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
    last_maintained TIMESTAMP WITH TIME ZONE,
    price NUMERIC(10, 2) NOT NULL,
    serial_number TEXT,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. CREATE PANTRY ITEMS TABLE
CREATE TABLE IF NOT EXISTS pantry (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    current_stock NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    min_stock NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    max_stock NUMERIC(10, 2) DEFAULT 99999.00,
    unit TEXT NOT NULL,
    last_price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    status TEXT DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock')) NOT NULL,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. CREATE PANTRY HISTORY TABLE
CREATE TABLE IF NOT EXISTS pantry_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES pantry(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    type TEXT CHECK (type IN ('Restock', 'Usage', 'Waste', 'Adjustment')) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    price_per_unit NUMERIC(10, 2) NOT NULL,
    total_value NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. CREATE SYSTEM LOGS TABLE
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Database Migrations / Structural Adjustments
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS max_stock NUMERIC(10, 2) DEFAULT 99999.00;

-- 11. Enable Row Level Security (RLS)
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- 11. Allow Public Access Policies (Safe to run multiple times)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read product_categories" ON product_categories;
    DROP POLICY IF EXISTS "Allow public write product_categories" ON product_categories;
    DROP POLICY IF EXISTS "Allow public read customers" ON customers;
    DROP POLICY IF EXISTS "Allow public write customers" ON customers;
    DROP POLICY IF EXISTS "Allow public read products" ON products;
    DROP POLICY IF EXISTS "Allow public write products" ON products;
    DROP POLICY IF EXISTS "Allow public read orders" ON orders;
    DROP POLICY IF EXISTS "Allow public write orders" ON orders;
    DROP POLICY IF EXISTS "Allow public read recipes" ON recipes;
    DROP POLICY IF EXISTS "Allow public write recipes" ON recipes;
    DROP POLICY IF EXISTS "Allow public read equipment" ON equipment;
    DROP POLICY IF EXISTS "Allow public write equipment" ON equipment;
    DROP POLICY IF EXISTS "Allow public read pantry" ON pantry;
    DROP POLICY IF EXISTS "Allow public write pantry" ON pantry;
    DROP POLICY IF EXISTS "Allow public read pantry_history" ON pantry_history;
    DROP POLICY IF EXISTS "Allow public write pantry_history" ON pantry_history;
    DROP POLICY IF EXISTS "Allow public read system_logs" ON system_logs;
    DROP POLICY IF EXISTS "Allow public write system_logs" ON system_logs;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Allow public read product_categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Allow public write product_categories" ON product_categories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow public write customers" ON customers FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public write products" ON products FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public write orders" ON orders FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read recipes" ON recipes FOR SELECT USING (true);
CREATE POLICY "Allow public write recipes" ON recipes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read equipment" ON equipment FOR SELECT USING (true);
CREATE POLICY "Allow public write equipment" ON equipment FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read pantry" ON pantry FOR SELECT USING (true);
CREATE POLICY "Allow public write pantry" ON pantry FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read pantry_history" ON pantry_history FOR SELECT USING (true);
CREATE POLICY "Allow public write pantry_history" ON pantry_history FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read system_logs" ON system_logs FOR SELECT USING (true);
CREATE POLICY "Allow public write system_logs" ON system_logs FOR ALL USING (true) WITH CHECK (true);

-- 12. HIGH-PERFORMANCE DATABASE INDEXES
-- Indexing foreign keys to prevent sequential scans during JOINs or relationship filters
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_pantry_history_item_id ON pantry_history(item_id);

-- Speeding up frequent search, filter, and sorting query patterns
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pantry_status ON pantry(status);

-- 13. AUTOMATED updated_at TIMESTAMP TRIGGERS
-- Create central database trigger function
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers to avoid duplication
DROP TRIGGER IF EXISTS trg_update_customers_timestamp ON customers;
DROP TRIGGER IF EXISTS trg_update_products_timestamp ON products;
DROP TRIGGER IF EXISTS trg_update_orders_timestamp ON orders;
DROP TRIGGER IF EXISTS trg_update_recipes_timestamp ON recipes;
DROP TRIGGER IF EXISTS trg_update_equipment_timestamp ON equipment;
DROP TRIGGER IF EXISTS trg_update_pantry_timestamp ON pantry;

-- Attach triggers to all tables supporting updated_at
CREATE TRIGGER trg_update_customers_timestamp BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE trigger_update_timestamp();
CREATE TRIGGER trg_update_products_timestamp BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE trigger_update_timestamp();
CREATE TRIGGER trg_update_orders_timestamp BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE trigger_update_timestamp();
CREATE TRIGGER trg_update_recipes_timestamp BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE PROCEDURE trigger_update_timestamp();
CREATE TRIGGER trg_update_equipment_timestamp BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE PROCEDURE trigger_update_timestamp();
CREATE TRIGGER trg_update_pantry_timestamp BEFORE UPDATE ON pantry FOR EACH ROW EXECUTE PROCEDURE trigger_update_timestamp();

-- 14. ENABLE SUPABASE STORAGE BUCKET FOR PRODUCT IMAGES
-- Ensure the storage schema is loaded and insert the product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Grant RLS policies for storage buckets to allow public operations safely
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read product-images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public write product-images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public update product-images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public delete product-images" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Allow public read product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Allow public write product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Allow public update product-images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Allow public delete product-images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

-- 15. CREATE ROLES AND USERS TABLES (For cloud synchronization fallback)
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL,
    permissions TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    username TEXT,
    email TEXT,
    phone TEXT,
    role_id TEXT REFERENCES roles(id) ON DELETE SET NULL,
    password TEXT NOT NULL,
    assigned_permissions TEXT[],
    revoked_permissions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Enable RLS for roles & users
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public access
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read roles" ON roles;
    DROP POLICY IF EXISTS "Allow public write roles" ON roles;
    DROP POLICY IF EXISTS "Allow public read users" ON users;
    DROP POLICY IF EXISTS "Allow public write users" ON users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Allow public read roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Allow public write roles" ON roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public write users" ON users FOR ALL USING (true) WITH CHECK (true);
`;

const sqlSeed = `
-- Seed Roles
INSERT INTO roles (id, name, description, color, permissions)
VALUES 
('e8e81561-12f8-456b-a25e-ea78a48ef89a', 'Admin', 'Has full access to all areas of the system.', '#3d2314', ARRAY['*'])
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;

-- Seed Users
INSERT INTO users (id, name, username, email, phone, role_id, password)
VALUES 
('a1c84b4a-f326-444a-a38f-a9cb6b6c085f', 'DivAmok', 'DivAmok', 'divamok@gmail.com', '0540000000', 'e8e81561-12f8-456b-a25e-ea78a48ef89a', '0b14d501a594442a01c6859541bcb3e8164d183d32937b851835442f69d5c94e')
ON CONFLICT (name) DO UPDATE SET username = EXCLUDED.username, email = EXCLUDED.email, phone = EXCLUDED.phone, role_id = EXCLUDED.role_id, password = EXCLUDED.password;
`;

  async function runMigrations() {
    try {
      console.log('🚀 Executing sqlSchema...');
      await connectedClient.query(sqlSchema);
      console.log('✅ sqlSchema executed successfully!');
      
      console.log('🚀 Executing sqlSeed...');
      await connectedClient.query(sqlSeed);
      console.log('✅ sqlSeed executed successfully!');
      
      console.log('\n🎉 SCHEMA SYNCHRONIZED SUCCESSFULLY! All tables, relationships, and RLS policies are live!');
      process.exit(0);
    } catch (err) {
      console.error('❌ Migration Execution error:', err.message);
      process.exit(1);
    }
  }
  
  runMigrations();
});
