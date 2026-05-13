export * from './customers'
export * from './products'
export * from './orders'
export * from './recipes'
export * from './equipment'

import { db, type Customer } from '../shared/lib/db'
import { mockCustomers } from './customers'
import { mockProducts, mockCategories } from './products'
import { mockOrders } from './orders'
import { mockRecipes } from './recipes'
import { mockEquipment } from './equipment'

import { Database } from 'lucide-react'

export const seedDatabase = async () => {
  await db.transaction('rw', [
    db.customers, 
    db.products, 
    db.productCategories, 
    db.orders, 
    db.recipes, 
    db.equipment
  ], async () => {
    // Clear existing data first
    await Promise.all([
      db.customers.clear(),
      db.productCategories.clear(),
      db.products.clear(),
      db.orders.clear(),
      db.recipes.clear(),
      db.equipment.clear()
    ])
    
    // Calculate and add customers with proper status
    const customersWithStatus = mockCustomers.map(customer => {
      // Find orders for this customer (mockCustomers name maps to order customerName in mockOrders)
      const customerOrders = mockOrders.filter(o => o.customerName === customer.name)
      if (customerOrders.length === 0) return { ...customer, status: 'Inactive' as const }
      
      const lastOrderDate = new Date(Math.max(...customerOrders.map(o => new Date(o.createdAt).getTime())))
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      return {
        ...customer,
        status: lastOrderDate >= thirtyDaysAgo ? 'Active' : 'Inactive'
      }
    }) as Customer[]

    await db.customers.bulkAdd(customersWithStatus)
    await db.productCategories.bulkAdd(mockCategories)
    await db.products.bulkAdd(mockProducts)
    await db.orders.bulkAdd(mockOrders)
    await db.recipes.bulkAdd(mockRecipes)
    await db.equipment.bulkAdd(mockEquipment)
  })
  
  console.log('✅ Database seeded successfully with accurate customer statuses!')
}

export const getDeveloperToolsSection = (onSeed: () => void) => ({
  title: 'Developer Tools',
  items: [
    { 
      label: 'Seed Mock Data', 
      value: 'Fill with 50+ records per module', 
      icon: Database, 
      action: onSeed,
      actionLabel: 'Seed'
    },
  ]
})

