import { type Equipment } from '../shared/lib/db'

const equipmentNames = [
  'Industrial Oven A1', 'Stand Mixer Pro', 'Dough Sheeter', 'Commercial Fridge', 'Bread Slicer',
  'Cooling Rack 1', 'Cooling Rack 2', 'Scale Precision 5kg', 'Convection Oven B2', 'Walk-in Freezer',
  'Cake Display Case', 'Espresso Machine', 'Proofer Cabinet', 'Hand Mixer', 'Induction Hob',
  'Food Processor', 'Dishwasher', 'Blast Chiller', 'Pasta Extruder', 'Dough Hook XL',
  'Industrial Oven A2', 'Mixer Master 5000', 'Automatic Sheeter', 'Reach-in Cooler', 'Crust Slicer',
  'Cooling Rack 3', 'Cooling Rack 4', 'Digital Scale 10kg', 'Pizza Oven C1', 'Storage Freezer',
  'Pastry Case', 'Coffee Grinder', 'Steam Proofer', 'Turbo Hand Mixer', 'Gas Range',
  'Vegetable Chopper', 'High Temp Dishwasher', 'Ice Machine', 'Ravioli Maker', 'Beater Attachment',
  'Deck Oven D1', 'Planetary Mixer', 'Manual Sheeter', 'Beverage Cooler', 'Sandwich Press',
  'Mobile Rack', 'Ingredient Bin', 'Kitchen Scale 1kg', 'Rotary Oven E1', 'Under-counter Fridge'
]

const categories = ['Ovens', 'Mixers', 'Prep', 'Storage', 'Finishing', 'Display', 'Beverage', 'Cleaning']
const statuses: ("Operational" | "Maintenance" | "Broken")[] = ['Operational', 'Maintenance', 'Broken']
const years = [2024, 2025, 2026]

export const mockEquipment: Equipment[] = equipmentNames.map((name, i) => {
  const year = years[i % 3]
  const month = Math.floor(Math.random() * 12)
  const day = Math.floor(Math.random() * 28) + 1
  const purchaseDate = new Date(year, month, day)
  
  return {
    name,
    category: categories[i % 8],
    status: statuses[Math.floor(Math.random() * 3)],
    purchaseDate,
    lastMaintained: i % 2 === 0 ? new Date(2026, Math.floor(Math.random() * 5), day) : undefined,
    price: Math.floor(Math.random() * 15000) + 500,
    serialNumber: `${name.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}-${Math.random().toString(36).substring(2, 3).toUpperCase()}`,
    notes: i % 10 === 0 ? 'Recently serviced' : undefined,
    createdAt: purchaseDate
  }
})
