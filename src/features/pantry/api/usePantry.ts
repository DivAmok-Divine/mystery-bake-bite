import { useLiveQuery } from 'dexie-react-hooks'
import { db, type PantryItem } from '../../../shared/lib/db'

export const usePantry = () => {
  // raw is undefined while Dexie is initialising, [] when empty, items[] when loaded
  const raw = useLiveQuery(() => db.pantry.orderBy('name').toArray())
  const pantryItems: PantryItem[] = raw ?? []
  const isLoading = raw === undefined

  const addPantryItem = async (item: Omit<PantryItem, 'id'>) => {
    // Exact match check (Name + Category + Price + Unit)
    const existing = pantryItems.find(i => 
      i.name.toLowerCase().trim() === item.name.toLowerCase().trim() &&
      i.category === item.category &&
      i.unit === item.unit &&
      i.lastPrice === item.lastPrice
    )

    if (existing && existing.id) {
      // Smart Merge: Add the new stock to the existing one
      return await updateStock(existing.id, (existing.currentStock || 0) + (item.currentStock || 0), 'Restock')
    }

    return await db.pantry.add(item)
  }


  const updatePantryItem = async ({ id, changes }: { id: number, changes: Partial<PantryItem> }) => {
    return await db.pantry.update(id, {
      ...changes,
      updatedAt: new Date()
    })
  }

  const deletePantryItem = async (id: number) => {
    return await db.pantry.delete(id)
  }

  const history = useLiveQuery(() => db.pantryHistory.orderBy('createdAt').reverse().toArray())
  const pantryHistory = history ?? []

  const updateStock = async (id: number, newStock: number, type: 'Restock' | 'Usage' | 'Waste' | 'Adjustment' = 'Adjustment') => {
    const item = await db.pantry.get(id)
    if (!item) return
    
    const delta = newStock - (item.currentStock || 0)
    if (delta === 0) return

    let status: PantryItem['status'] = 'In Stock'
    if (newStock <= 0) status = 'Out of Stock'
    else if (newStock <= (item.minStock || 0)) status = 'Low Stock'

    // Record movement
    await db.pantryHistory.add({
      itemId: id,
      itemName: item.name,
      type: type === 'Adjustment' ? (delta > 0 ? 'Restock' : 'Usage') : type,
      quantity: delta,
      unit: item.unit,
      pricePerUnit: item.lastPrice || 0,
      totalValue: Math.abs(delta * (item.lastPrice || 0)),
      createdAt: new Date()
    })

    return await db.pantry.update(id, {
      currentStock: newStock,
      status,
      updatedAt: new Date()
    })
  }

  return {
    pantryItems,
    pantryHistory,
    isLoading,
    addPantryItem,
    updatePantryItem,
    deletePantryItem,
    updateStock
  }

}

