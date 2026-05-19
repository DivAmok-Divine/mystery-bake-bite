export interface SystemPermission {
  key: string;
  title: string;
  desc: string;
}

export const SYSTEM_PERMISSIONS: SystemPermission[] = [
  { key: 'view:dashboard', title: 'Dashboard Access', desc: 'Allows viewing general analytics and charts on home.' },
  { key: 'view:financials', title: 'Financial Reporting', desc: 'Allows viewing costs, revenues, and detailed business values.' },
  { key: 'manage:orders', title: 'Orders Control', desc: 'Allows creating, editing, and updating customer orders.' },
  { key: 'manage:recipes', title: 'Secret Recipes', desc: 'Allows creating, modifying, and viewing baking formulas.' },
  { key: 'manage:products', title: 'Bite Products', desc: 'Allows pricing and creating bakery menu items.' },
  { key: 'manage:pantry_view', title: 'Pantry Catalog', desc: 'Allows viewing kitchen inventory status.' },
  { key: 'manage:pantry_restock', title: 'Restock Action', desc: 'Allows restocking pantry logs.' },
  { key: 'manage:pantry_adjust', title: 'Quick Adjustments', desc: 'Allows quick steppers to change current stock.' },
  { key: 'manage:users', title: 'User Privileges', desc: 'Allows modifying user accounts, roles, and overrides.' }
];
