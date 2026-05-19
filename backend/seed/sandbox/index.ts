import { db } from '../../lib/db'
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
  await db.productCategories.bulkPut(mockCategories)

  // 2. Calculate customer statuses based on mockOrders
  const customersWithStatus = mockCustomers.map(customer => {
    const customerOrders = mockOrders.filter(o => o.customerName === customer.name)
    if (customerOrders.length === 0) return { ...customer, status: 'Inactive' as const }
    
    const lastOrderDate = new Date(Math.max(...customerOrders.map(o => new Date(o.createdAt).getTime())))
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return {
      ...customer,
      status: (lastOrderDate >= thirtyDaysAgo ? 'Active' : 'Inactive') as 'Active' | 'Inactive'
    }
  })
  await db.customers.bulkPut(customersWithStatus)

  // 3. Seed other modules
  await db.products.bulkPut(mockProducts)
  await db.orders.bulkPut(mockOrders)
  await db.recipes.bulkPut(mockRecipes)
  await db.equipment.bulkPut(mockEquipment)
  await db.pantry.bulkPut(mockPantry)
}
