import { useState, useEffect } from 'react'
import { Database, Trash2, Loader2 } from 'lucide-react'
import { ConfirmModal } from '../shared/ui/molecules/ConfirmModal'
import { db } from '../shared/lib/db'

export * from './customers'
export * from './products'
export * from './orders'
export * from './recipes'
export * from './equipment'
export * from './pantry'

import { mockCustomers } from './customers'
import { mockProducts, mockCategories } from './products'
import { mockOrders } from './orders'
import { mockRecipes } from './recipes'
import { mockEquipment } from './equipment'
import { mockPantry } from './pantry'

export const seedDatabase = async () => {
  await db.transaction('rw', [
    db.customers, 
    db.products, 
    db.productCategories, 
    db.orders, 
    db.recipes, 
    db.equipment,
    db.pantry
  ], async () => {
    await Promise.all([
      db.customers.clear(),
      db.productCategories.clear(),
      db.products.clear(),
      db.orders.clear(),
      db.recipes.clear(),
      db.equipment.clear(),
      db.pantry.clear()
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
        status: (lastOrderDate >= thirtyDaysAgo ? 'Active' : 'Inactive') as 'Active' | 'Inactive'
      }
    })

    await db.customers.bulkAdd(customersWithStatus)
    await db.productCategories.bulkAdd(mockCategories)
    await db.products.bulkAdd(mockProducts)
    await db.orders.bulkAdd(mockOrders)
    await db.recipes.bulkAdd(mockRecipes)
    await db.equipment.bulkAdd(mockEquipment)
    await db.pantry.bulkAdd(mockPantry)
  })
}

export const clearDatabase = async () => {
  await db.transaction('rw', [
    db.customers, 
    db.products, 
    db.productCategories, 
    db.orders, 
    db.recipes, 
    db.equipment,
    db.pantry
  ], async () => {
    await Promise.all([
      db.customers.clear(),
      db.productCategories.clear(),
      db.products.clear(),
      db.orders.clear(),
      db.recipes.clear(),
      db.equipment.clear(),
      db.pantry.clear()
    ])
  })
}


export const useDeveloperTools = () => {
  const [showSeedConfirm, setShowSeedConfirm] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    const checkData = async () => {
      const count = await db.customers.count()
      setHasData(count > 0)
    }
    checkData()
  }, [])

  const handleSeed = async () => {
    setIsSeeding(true)
    try {
      await seedDatabase()
      window.location.reload()
    } finally {
      setIsSeeding(false)
    }
  }

  const handleClear = async () => {
    setIsSeeding(true)
    try {
      await clearDatabase()
      window.location.reload()
    } finally {
      setIsSeeding(false)
    }
  }

  const developerToolsSection = {
    title: 'Developer Tools',
    items: [
      { 
        label: hasData ? 'Clear Mock Data' : 'Seed Mock Data', 
        value: hasData ? 'Remove all records from database' : 'Fill with 50+ records per module', 
        icon: isSeeding ? Loader2 : (hasData ? Trash2 : Database), 
        action: () => hasData ? setShowClearConfirm(true) : setShowSeedConfirm(true),
        actionLabel: isSeeding ? 'Working...' : (hasData ? 'Clear Data' : 'Load Seed Data'),
        disabled: isSeeding
      },
    ]
  }

  const DeveloperToolsModal = (
    <>
      <ConfirmModal
        isOpen={showSeedConfirm}
        onClose={() => setShowSeedConfirm(false)}
        onConfirm={handleSeed}
        title="Seed Mock Data?"
        message="This will replace ALL your current data with 50+ fresh records per module."
        confirmText="Yes, Seed Data"
        isDestructive={false}
      />
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClear}
        title="Clear All Data?"
        message="This will PERMANENTLY remove all records from your database. The app will be empty."
        confirmText="Yes, Clear Everything"
        isDestructive={true}
      />
    </>
  )

  return { developerToolsSection, DeveloperToolsModal }
}
