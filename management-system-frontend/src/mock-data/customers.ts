import { type Customer } from '@backend/lib/db'

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

const firstNames = [
  'Kofi', 'Ama', 'Kwame', 'Abena', 'Yaw', 'Efua', 'Kojo', 'Akosua', 'Kwesi', 'Nana',
  'Ekow', 'Baaba', 'Paa', 'Mansa', 'Esi', 'Fiifi', 'Araba', 'Kobby', 'Naa', 'Jojo',
  'Samuel', 'Mary', 'Prince', 'Dorcas', 'Isaac', 'Grace', 'Daniel', 'Sarah', 'Peter',
  'Esther', 'Joseph', 'Lydia', 'Stephen', 'Ruth', 'Benjamin', 'Comfort', 'Gideon',
  'Mercy', 'Joshua', 'Patricia', 'Emanuel', 'Beatrice', 'Charles', 'Alice', 'Thomas',
  'Elizabeth', 'Francis', 'Janet', 'Paulina', 'Simon'
]

const lastNames = [
  'Mensah', 'Serwaa', 'Boateng', 'Appiah', 'Adu', 'Forson', 'Antwi', 'Darko', 'Arthur',
  'Taylor', 'Smith', 'Aggrey', 'Pratt', 'Asare', 'Lamley', 'Mills', 'Dogbe', 'Osei',
  'Manu', 'Tetteh', 'Amponsah', 'Anane', 'Dede', 'Lamptey', 'Baah', 'Addo', 'Anim',
  'Sackey', 'Nti', 'Owusu', 'Akoto', 'Aba', 'Peter'
]

// Generate total mock customer size dynamically between 50 and 200
const totalCustomersCount = Math.floor(Math.random() * 151) + 50
const generatedNames = [...names]
const nameSet = new Set(names)

while (generatedNames.length < totalCustomersCount) {
  const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)]
  const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)]
  const uniqueName = `${randomFirst} ${randomLast}`
  if (!nameSet.has(uniqueName)) {
    nameSet.add(uniqueName)
    generatedNames.push(uniqueName)
  }
}

const years = [2024, 2025, 2026]

export const mockCustomers: Customer[] = generatedNames.map((name, i) => {
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
