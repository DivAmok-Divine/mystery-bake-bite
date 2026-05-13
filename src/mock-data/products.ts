import { type ProductCategory, type Product } from '../shared/lib/db'

export const mockCategories: ProductCategory[] = [
  { name: 'Cakes', createdAt: new Date('2024-01-01') },
  { name: 'Pastries', createdAt: new Date('2024-01-01') },
  { name: 'Breads', createdAt: new Date('2024-01-01') },
  { name: 'Cookies', createdAt: new Date('2024-01-01') },
  { name: 'Savory', createdAt: new Date('2024-01-01') }
]

const productNames = [
  'Red Velvet Cake', 'Meat Pie (Dozen)', 'Chocolate Fudge Cake', 'Butter Croissant', 'Sugar Cookies (Set of 6)',
  'Whole Wheat Bread', 'Sausage Roll', 'Vanilla Cupcake', 'Carrot Cake', 'Oatmeal Raisin Cookies',
  'Brioche Loaf', 'Apple Turnover', 'Chicken Pie', 'Lemon Drizzle Cake', 'Chocolate Chip Cookies',
  'Garlic Bread', 'Cheese Straws', 'Strawberry Tart', 'Pound Cake', 'Banana Bread',
  'Blueberry Muffin', 'Cinnamon Roll', 'Sourdough Loaf', 'Rainbow Cake', 'Peanut Butter Cookies',
  'Beef Wellington (Small)', 'Quiche Lorraine', 'Black Forest Cake', 'Danish Pastry', 'Focaccia',
  'Shortbread Cookies', 'Baguette', 'Spinach & Feta Roll', 'Red Fruit Tart', 'Sponge Cake',
  'Challah Bread', 'Macarons (Box of 12)', 'Cheese Cake', 'Gingerbread Cookies', 'Multigrain Bread',
  'Eclairs', 'Profiteroles', 'Bagels (Set of 4)', 'Tiramisu Cake', 'Snickerdoodles',
  'Fish Pie', 'Ham & Cheese Croissant', 'Marble Cake', 'Pain au Chocolat', 'Ciabatta'
]

const categories = ['Cakes', 'Pastries', 'Breads', 'Cookies', 'Savory']
const years = [2024, 2025, 2026]

export const mockProducts: Product[] = productNames.map((name, i) => {
  const year = years[i % 3]
  const month = Math.floor(Math.random() * 12)
  const day = Math.floor(Math.random() * 28) + 1
  return {
    name,
    price: Math.floor(Math.random() * 200) + 10,
    category: categories[i % 5],
    description: `Delicious ${name.toLowerCase()} made with fresh ingredients.`,
    createdAt: new Date(year, month, day)
  }
})
