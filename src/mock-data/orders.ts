import { type Order } from '../shared/lib/db'
import { mockProducts } from './products'

const statuses: ("Pending" | "Completed" | "Cancelled")[] = ['Pending', 'Completed', 'Cancelled']
const years = [2024, 2025, 2026]
const customerNames = [
  'Kofi Mensah', 'Ama Serwaa', 'Kwame Boateng', 'Abena Appiah', 'Yaw Adu',
  'Efua Forson', 'Kojo Antwi', 'Akosua Darko', 'Kwesi Arthur', 'Nana Ama',
  'Ekow Taylor', 'Baaba Smith', 'Paa Kwesi', 'Mansa Musa', 'Esi Mansa',
  'Fiifi Aggrey', 'Araba Pratt', 'Kobby Asare', 'Naa Lamley', 'Jojo Mills',
  'Samuel Dogbe', 'Mary Osei', 'Prince Appiah', 'Dorcas Manu', 'Isaac Tetteh',
  'Grace Amponsah', 'Daniel Kojo', 'Sarah Mensah', 'Peter Anane', 'Esther Dede',
  'Joseph Lamptey', 'Lydia Baah', 'Stephen Addo', 'Ruth Anim', 'Benjamin Sackey',
  'Comfort Antwi', 'Gideon Boateng', 'Mercy Appiah', 'Joshua Nti', 'Patricia Osei',
  'Emanuel Arthur', 'Beatrice Serwaa', 'Charles Mensah', 'Alice Darko', 'Thomas Owusu',
  'Elizabeth Akoto', 'Francis Kobby', 'Janet Aba', 'Paulina Esi', 'Simon Peter'
]

export const mockOrders: Order[] = Array.from({ length: 80 }).map((_, i) => {
  const customerIndex = i % customerNames.length
  
  // Distribute dates: Some old (2024-2025), some new (2026)
  // Ensure a good chunk of 2026 orders are very recent (last 30 days)
  const today = new Date('2026-05-13')
  const isRecent = i % 4 === 0 // 25% of orders are recent
  
  let createdAt: Date
  if (isRecent) {
    // Random date within last 25 days
    createdAt = new Date(today)
    createdAt.setDate(today.getDate() - Math.floor(Math.random() * 25))
  } else {
    // Older dates spread over 2024-2026
    const year = years[i % 3]
    const month = Math.floor(Math.random() * 12)
    const day = Math.floor(Math.random() * 28) + 1
    createdAt = new Date(year, month, day)
    
    // Ensure "older" dates don't accidentally land in the last 30 days if it's 2026
    if (year === 2026 && createdAt > new Date('2026-04-01')) {
      createdAt.setMonth(2) // Move to March
    }
  }

  const deadline = new Date(createdAt)
  deadline.setDate(deadline.getDate() + Math.floor(Math.random() * 7) + 2)

  // Randomly pick 1-7 products for each order
  const numItems = Math.floor(Math.random() * 7) + 1
  const selectedProducts = []
  let totalAmount = 0

  for (let j = 0; j < numItems; j++) {
    const product = mockProducts[Math.floor(Math.random() * mockProducts.length)]
    const qty = Math.floor(Math.random() * 3) + 1
    selectedProducts.push(`${qty}x ${product.name}`)
    totalAmount += product.price * qty
  }

  return {
    orderNumber: `#MBB-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    customerId: customerIndex + 1,
    customerName: customerNames[customerIndex],
    items: selectedProducts.join(', '),
    amount: totalAmount,
    status: statuses[Math.floor(Math.random() * 3)],
    deadline,
    createdAt,
    notes: i % 5 === 0 ? 'Special request for event' : undefined
  }
})
