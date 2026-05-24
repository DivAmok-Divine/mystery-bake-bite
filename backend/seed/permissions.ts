export interface SystemPermission {
  key: string;
  title: string;
  desc: string;
}

export const SYSTEM_PERMISSIONS: SystemPermission[] = [
  // Orders
  { key: 'view:orders', title: 'View Orders', desc: 'Allows viewing the orders list.' },
  { key: 'create:orders', title: 'Create Orders', desc: 'Allows creating new customer orders.' },
  { key: 'edit:orders', title: 'Edit Orders', desc: 'Allows editing existing customer orders.' },
  { key: 'delete:orders', title: 'Delete Orders', desc: 'Allows cancelling or deleting customer orders.' },
  
  // Bite Products
  { key: 'view:products', title: 'View Bite Products', desc: 'Allows viewing the bakery product menu.' },
  { key: 'create:products', title: 'Create Bite Products', desc: 'Allows creating new products.' },
  { key: 'edit:products', title: 'Edit Bite Products', desc: 'Allows editing product details and pricing.' },
  { key: 'delete:products', title: 'Delete Bite Products', desc: 'Allows deleting product menu items.' },
  
  // Customers
  { key: 'view:customers', title: 'View Customers', desc: 'Allows viewing the customer directory.' },
  { key: 'create:customers', title: 'Create Customers', desc: 'Allows adding new customer profiles.' },
  { key: 'edit:customers', title: 'Edit Customers', desc: 'Allows editing customer profile details.' },
  { key: 'delete:customers', title: 'Delete Customers', desc: 'Allows deleting customer records.' },

  // Recipes
  { key: 'view:recipes', title: 'View Recipes', desc: 'Allows viewing secret baking recipes.' },
  { key: 'create:recipes', title: 'Create Recipes', desc: 'Allows adding new secret recipes.' },
  { key: 'edit:recipes', title: 'Edit Recipes', desc: 'Allows editing existing recipes.' },
  { key: 'delete:recipes', title: 'Delete Recipes', desc: 'Allows deleting secret recipes.' },

  // Pantry
  { key: 'view:pantry', title: 'View Pantry', desc: 'Allows viewing kitchen inventory status.' },
  { key: 'create:pantry', title: 'Restock Pantry', desc: 'Allows creating new pantry items and restocking.' },
  { key: 'edit:pantry', title: 'Adjust Pantry', desc: 'Allows adjusting current stock counts.' },
  { key: 'delete:pantry', title: 'Delete Pantry', desc: 'Allows deleting pantry items.' },

  // Reports
  { key: 'view:reports', title: 'View Reports', desc: 'Allows viewing analytics and financial reporting dashboard.' },

  // Settings & Administration
  { key: 'view:settings', title: 'View Settings', desc: 'Allows viewing the settings page.' },
  { key: 'manage:users', title: 'User Privileges', desc: 'Allows modifying user accounts, roles, and overrides.' }
];
