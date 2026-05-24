import { db, generateUUID } from '../../lib/db'
import { mockCustomers } from './customers'
import { mockProducts, mockCategories } from './products'
import { mockOrders } from './orders'
import { mockRecipes } from './recipes'
import { mockEquipment } from './equipment'
import { mockPantry } from './pantry'

export * from './customers'
export * from './products'
export * from './orders'
export * from './recipes'
export * from './equipment'
export * from './pantry'

// Clear is exclusively local Dexie now (to protect real cloud data)
export const clearDatabase = async () => {
  await Promise.all([
    db.customers.clear(),
    db.productCategories.clear(),
    db.products.clear(),
    db.orders.clear(),
    db.recipes.clear(),
    db.equipment.clear(),
    db.pantry.clear(),
    db.pantryHistory.clear()
  ])
}

// Seed is exclusively local Dexie now (to protect real cloud data)
export const seedDatabase = async () => {
  await clearDatabase()

  // 1. Seed categories
  const seededCategories = mockCategories.map(c => ({ ...c, id: generateUUID() }))
  await db.productCategories.bulkPut(seededCategories)

  // 2. Calculate customer statuses based on mockOrders and assign UUIDs
  const customersWithStatus = mockCustomers.map(customer => {
    const customerOrders = mockOrders.filter(o => o.customerName === customer.name)
    let status: 'Active' | 'Inactive' = 'Inactive'
    
    if (customerOrders.length > 0) {
      const lastOrderDate = new Date(Math.max(...customerOrders.map(o => new Date(o.createdAt).getTime())))
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      status = lastOrderDate >= thirtyDaysAgo ? 'Active' : 'Inactive'
    }
    
    return {
      ...customer,
      id: generateUUID(),
      status
    }
  })
  await db.customers.bulkPut(customersWithStatus)

  // 3. Seed other modules with UUIDs
  const seededProducts = mockProducts.map(p => ({ ...p, id: generateUUID() }))
  await db.products.bulkPut(seededProducts)

  const seededOrders = mockOrders.map(o => {
    const customer = customersWithStatus.find(c => c.name === o.customerName)
    return {
      ...o,
      id: generateUUID(),
      customerId: customer?.id || o.customerId
    }
  })
  await db.orders.bulkPut(seededOrders)

  const seededRecipes = mockRecipes.map(r => ({ ...r, id: generateUUID() }))
  await db.recipes.bulkPut(seededRecipes)

  const seededEquipment = mockEquipment.map(e => ({ ...e, id: generateUUID() }))
  await db.equipment.bulkPut(seededEquipment)

  const seededPantry = mockPantry.map(p => ({ ...p, id: generateUUID() }))
  await db.pantry.bulkPut(seededPantry)
}
