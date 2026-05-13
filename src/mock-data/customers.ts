import { type Customer } from '../shared/lib/db'

const names = [
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

const years = [2024, 2025, 2026]

export const mockCustomers: Customer[] = names.map((name, i) => {
  const year = years[i % 3]
  const month = Math.floor(Math.random() * 12)
  const day = Math.floor(Math.random() * 28) + 1
  return {
    name,
    phone: `02${Math.floor(Math.random() * 80 + 20)}${Math.floor(Math.random() * 900000 + 100000)}`,
    email: `${name.toLowerCase().replace(' ', '.')}@gmail.com`,
    address: `${Math.floor(Math.random() * 100 + 1)} Street, Accra`,
    totalOrders: Math.floor(Math.random() * 20),
    status: 'Active',
    createdAt: new Date(year, month, day)
  }
})
