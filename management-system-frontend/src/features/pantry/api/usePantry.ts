import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { db, supabase, isCloudMode, generateUUID, type PantryItem, type PantryHistory } from '@backend/lib/db'

export const usePantry = () => {
  const queryClient = useQueryClient()
  const cloud = isCloudMode()

  // 1. Query for pantry items
  const pantryQuery = useQuery({
    queryKey: ['pantry', cloud ? 'cloud' : 'local'],
    queryFn: async () => {
      if (cloud) {
        const { data, error } = await supabase.from('pantry').select('*')
        if (error) throw error
        return (data || []).map((i: any) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          currentStock: Number(i.current_stock),
          minStock: Number(i.min_stock),
          maxStock: i.max_stock !== undefined && i.max_stock !== null ? Number(i.max_stock) : Number(i.current_stock),
          unit: i.unit,
          lastPrice: Number(i.last_price),
          status: i.status,
          notes: i.notes,
          updatedAt: new Date(i.updated_at),
          createdAt: new Date(i.created_at)
        })).sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime()
          const timeB = new Date(b.updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })
      } else {
        const data = await db.pantry.toArray()
        return data.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime()
          const timeB = new Date(b.updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })
      }
    }
  })

  // 2. Query for history
  const historyQuery = useQuery({
    queryKey: ['pantryHistory', cloud ? 'cloud' : 'local'],
    queryFn: async () => {
      if (cloud) {
        const { data, error } = await supabase.from('pantry_history').select('*')
        if (error) throw error
        return (data || []).map((h: any) => ({
          id: h.id,
          itemId: h.item_id,
          itemName: h.item_name,
          type: h.type,
          quantity: Number(h.quantity),
          unit: h.unit,
          pricePerUnit: Number(h.price_per_unit),
          totalValue: Number(h.total_value),
          createdAt: new Date(h.created_at)
        })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      } else {
        const data = await db.pantryHistory.orderBy('createdAt').reverse().toArray()
        return data
      }
    }
  })

  const pantryItems: PantryItem[] = pantryQuery.data || []
  const pantryHistory: PantryHistory[] = historyQuery.data || []
  const isLoading = pantryQuery.isLoading || historyQuery.isLoading

  const hasHealedRef = React.useRef(false)

  React.useEffect(() => {
    if (isLoading || pantryItems.length === 0 || !historyQuery.data || hasHealedRef.current) return

    const healDatabase = async () => {
      hasHealedRef.current = true // Lock to prevent race condition triggers!
      let healed = false

      // 1. Deduplicate any duplicate history entries created by concurrent race conditions during fast refreshes
      const toDeleteIds: string[] = []
      
      for (let i = 0; i < pantryHistory.length; i++) {
        for (let j = i + 1; j < pantryHistory.length; j++) {
          const r1 = pantryHistory[i]
          const r2 = pantryHistory[j]
          
          if (
            r1.itemId === r2.itemId &&
            r1.type === r2.type &&
            Number(r1.quantity) === Number(r2.quantity) &&
            Number(r1.pricePerUnit) === Number(r2.pricePerUnit) &&
            Math.abs(new Date(r1.createdAt).getTime() - new Date(r2.createdAt).getTime()) < 10000 // created within 10 seconds of each other
          ) {
            // Found a duplicate! Keep r1 and delete r2
            if (r2.id && !toDeleteIds.includes(r2.id)) {
              toDeleteIds.push(r2.id)
            }
          }
        }
      }

      if (toDeleteIds.length > 0) {
        console.log(`🧹 Deduplicating ${toDeleteIds.length} duplicate restock records...`)
        if (cloud) {
          const { error } = await supabase
            .from('pantry_history')
            .delete()
            .in('id', toDeleteIds)
          if (error) console.error('Error deleting cloud duplicates:', error)
          else healed = true
        } else {
          await db.pantryHistory.bulkDelete(toDeleteIds)
          healed = true
        }
      }

      // 2. Heal missing starting stock restock logs or mismatches
      for (const item of pantryItems) {
        if (!item.id) continue
        
        // Find if this item has any Restock history entries left after deduplication
        const itemHistory = pantryHistory.filter(h => h.itemId === item.id && h.id && !toDeleteIds.includes(h.id))
        const hasRestock = itemHistory.some(h => h.type === 'Restock')

        if (!hasRestock) {
          // Calculate starting stock = currentStock + absolute sum of all usage quantities
          const usages = itemHistory.filter(h => h.type === 'Usage')
          const absUsagesQty = usages.reduce((sum, h) => sum + Math.abs(h.quantity || 0), 0)
          const startingQty = (item.currentStock || 0) + absUsagesQty

          if (startingQty > 0) {
            console.log(`🔧 Healing pantry item history for "${item.name}": inserting missing initial restock of ${startingQty} ${item.unit}`)
            
            // Determine creation date: use the oldest usage date minus 1 minute, or item.createdAt, or 1 day ago
            let baseDate = item.createdAt ? new Date(item.createdAt) : new Date()
            if (itemHistory.length > 0) {
              const oldestHist = itemHistory[itemHistory.length - 1]
              baseDate = new Date(new Date(oldestHist.createdAt).getTime() - 60000)
            }

            if (cloud) {
              const { error } = await supabase
                .from('pantry_history')
                .insert([{
                  item_id: item.id,
                  item_name: item.name,
                  type: 'Restock',
                  quantity: startingQty,
                  unit: item.unit,
                  price_per_unit: Number(item.lastPrice || 0),
                  total_value: startingQty * Number(item.lastPrice || 0),
                  created_at: baseDate.toISOString()
                }])
              if (error) console.error('Error healing cloud history:', error)
              else healed = true
            } else {
              await db.pantryHistory.add({
                id: generateUUID(),
                itemId: item.id,
                itemName: item.name,
                type: 'Restock',
                quantity: startingQty,
                unit: item.unit,
                pricePerUnit: item.lastPrice || 0,
                totalValue: startingQty * (item.lastPrice || 0),
                createdAt: baseDate
              })
              healed = true
            }
          }
        } else {
          // The item ALREADY has restocks logged! Let's check for any arithmetic mismatches!
          // Qty Restocked = sum of h.quantity for all h.type === 'Restock'
          // Qty Used = sum of h.quantity for all h.type === 'Usage' (signed negative numbers!)
          const totalRestockQty = itemHistory.filter(h => h.type === 'Restock').reduce((sum, h) => sum + (h.quantity || 0), 0)
          const totalUsageQty = itemHistory.filter(h => h.type === 'Usage').reduce((sum, h) => sum + (h.quantity || 0), 0)
          
          const theoreticalStock = totalRestockQty + totalUsageQty
          const mismatch = (item.currentStock || 0) - theoreticalStock
          
          if (Math.abs(mismatch) > 0.001) {
            console.log(`🔧 Mismatch detected for "${item.name}": Actual Stock is ${item.currentStock}, but logs sum up to ${theoreticalStock}. Difference is ${mismatch} ${item.unit}`)
            
            let baseDate = new Date()
            if (mismatch < 0) {
              // Missing a Usage! (Actual stock is lower than theoretical)
              if (cloud) {
                const { error } = await supabase
                  .from('pantry_history')
                  .insert([{
                    item_id: item.id,
                    item_name: item.name,
                    type: 'Usage',
                    quantity: mismatch, // e.g. -1
                    unit: item.unit,
                    price_per_unit: Number(item.lastPrice || 0),
                    total_value: Math.abs(mismatch * Number(item.lastPrice || 0)),
                    created_at: baseDate.toISOString()
                  }])
                if (error) console.error('Error correcting cloud mismatch:', error)
                else healed = true
              } else {
                await db.pantryHistory.add({
                  id: generateUUID(),
                  itemId: item.id,
                  itemName: item.name,
                  type: 'Usage',
                  quantity: mismatch,
                  unit: item.unit,
                  pricePerUnit: item.lastPrice || 0,
                  totalValue: Math.abs(mismatch * (item.lastPrice || 0)),
                  createdAt: baseDate
                })
                healed = true
              }
            } else {
              // Missing a Restock! (Actual stock is higher than theoretical)
              if (cloud) {
                const { error } = await supabase
                  .from('pantry_history')
                  .insert([{
                    item_id: item.id,
                    item_name: item.name,
                    type: 'Restock',
                    quantity: mismatch, // e.g. 1
                    unit: item.unit,
                    price_per_unit: Number(item.lastPrice || 0),
                    total_value: mismatch * Number(item.lastPrice || 0),
                    created_at: baseDate.toISOString()
                  }])
                if (error) console.error('Error correcting cloud mismatch:', error)
                else healed = true
              } else {
                await db.pantryHistory.add({
                  id: generateUUID(),
                  itemId: item.id,
                  itemName: item.name,
                  type: 'Restock',
                  quantity: mismatch,
                  unit: item.unit,
                  pricePerUnit: item.lastPrice || 0,
                  totalValue: mismatch * (item.lastPrice || 0),
                  createdAt: baseDate
                })
                healed = true
              }
            }
          }
        }
      }

      if (healed) {
        console.log('🎉 Database healed successfully! Refreshing charts...')
        queryClient.invalidateQueries({ queryKey: ['pantryHistory'] })
      }
    }

    healDatabase()
  }, [isLoading, pantryItems, pantryHistory, cloud, queryClient, historyQuery.data])

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

    if (cloud) {
      const { data, error } = await supabase
        .from('pantry')
        .insert([{
          name: item.name,
          category: item.category,
          current_stock: item.currentStock,
          min_stock: item.minStock,
          max_stock: item.maxStock || item.currentStock,
          unit: item.unit,
          last_price: item.lastPrice,
          status: item.status,
          notes: item.notes,
          updated_at: new Date().toISOString()
        }])
        .select()
      if (error) throw error
      
      const inserted = data[0]
      if (inserted && Number(inserted.current_stock || 0) > 0) {
        const { error: histErr } = await supabase
          .from('pantry_history')
          .insert([{
            item_id: inserted.id,
            item_name: inserted.name,
            type: 'Restock',
            quantity: Number(inserted.current_stock),
            unit: inserted.unit,
            price_per_unit: Number(inserted.last_price || 0),
            total_value: Number(inserted.current_stock) * Number(inserted.last_price || 0)
          }])
        if (histErr) console.error('Error inserting initial history:', histErr)
      }
      
      queryClient.invalidateQueries({ queryKey: ['pantry'] })
      queryClient.invalidateQueries({ queryKey: ['pantryHistory'] })
      return inserted
    } else {
      const id = generateUUID()
      await db.pantry.add({ ...item, id, maxStock: item.maxStock || item.currentStock, updatedAt: new Date() } as any)
      
      if (Number(item.currentStock || 0) > 0) {
        await db.pantryHistory.add({
          id: generateUUID(),
          itemId: id,
          itemName: item.name,
          type: 'Restock',
          quantity: Number(item.currentStock || 0),
          unit: item.unit,
          pricePerUnit: Number(item.lastPrice || 0),
          totalValue: Number(item.currentStock || 0) * Number(item.lastPrice || 0),
          createdAt: new Date()
        })
      }
      
      queryClient.invalidateQueries({ queryKey: ['pantry'] })
      queryClient.invalidateQueries({ queryKey: ['pantryHistory'] })
      return { ...item, id }
    }
  }

  const updatePantryItem = async ({ id, changes }: { id: string, changes: Partial<PantryItem> }) => {
    if (cloud) {
      const dbChanges: any = {}
      if (changes.name !== undefined) dbChanges.name = changes.name
      if (changes.category !== undefined) dbChanges.category = changes.category
      if (changes.currentStock !== undefined) dbChanges.current_stock = changes.currentStock
      if (changes.minStock !== undefined) dbChanges.min_stock = changes.minStock
      if (changes.maxStock !== undefined) dbChanges.max_stock = changes.maxStock
      if (changes.unit !== undefined) dbChanges.unit = changes.unit
      if (changes.lastPrice !== undefined) dbChanges.last_price = changes.lastPrice
      if (changes.status !== undefined) dbChanges.status = changes.status
      if (changes.notes !== undefined) dbChanges.notes = changes.notes
      dbChanges.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('pantry')
        .update(dbChanges)
        .eq('id', id)
        .select()
      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['pantry'] })
      return data[0]
    } else {
      const res = await db.pantry.update(id, {
        ...changes,
        updatedAt: new Date()
      })
      queryClient.invalidateQueries({ queryKey: ['pantry'] })
      return res
    }
  }

  const deletePantryItem = async (id: string) => {
    if (cloud) {
      const { error } = await supabase
        .from('pantry')
        .delete()
        .eq('id', id)
      if (error) throw error
    } else {
      await db.pantry.delete(id)
    }
    queryClient.invalidateQueries({ queryKey: ['pantry'] })
  }

  const updateStock = async (id: string, newStock: number, type: 'Restock' | 'Usage' | 'Waste' | 'Adjustment' = 'Adjustment') => {
    const queryKey = ['pantry', cloud ? 'cloud' : 'local']
    const previousPantry = queryClient.getQueryData<PantryItem[]>(queryKey)

    // 1. Instantly apply optimistic UI update to React Query cache (0ms latency visual feedback!)
    if (previousPantry) {
      queryClient.setQueryData<PantryItem[]>(
        queryKey,
        previousPantry.map(item => {
          if (item.id === id) {
            let status: PantryItem['status'] = 'In Stock'
            if (newStock <= 0) status = 'Out of Stock'
            else if (newStock <= (item.minStock || 0)) status = 'Low Stock'
            return {
              ...item,
              currentStock: newStock,
              status,
              updatedAt: new Date()
            }
          }
          return item
        })
      )
    }

    try {
      if (cloud) {
        const { data: item, error: fetchError } = await supabase
          .from('pantry')
          .select('*')
          .eq('id', id)
          .single()
        if (fetchError) throw fetchError
        if (!item) return
        
        const delta = newStock - Number(item.current_stock || 0)
        if (delta === 0) return

        let status: PantryItem['status'] = 'In Stock'
        if (newStock <= 0) status = 'Out of Stock'
        else if (newStock <= Number(item.min_stock || 0)) status = 'Low Stock'

        // Record movement
        const { error: historyError } = await supabase
          .from('pantry_history')
          .insert([{
            item_id: id,
            item_name: item.name,
            type: type === 'Adjustment' ? 'Usage' : type,
            quantity: delta,
            unit: item.unit,
            price_per_unit: Number(item.last_price || 0),
            total_value: type === 'Adjustment' ? (-1 * delta * Number(item.last_price || 0)) : Math.abs(delta * Number(item.last_price || 0))
          }])
        if (historyError) throw historyError

        const { data: updated, error: updateError } = await supabase
          .from('pantry')
          .update({
            current_stock: newStock,
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
        if (updateError) throw updateError

        queryClient.invalidateQueries({ queryKey: ['pantry'] })
        queryClient.invalidateQueries({ queryKey: ['pantryHistory'] })
        return updated[0]
      } else {
        const item = await db.pantry.get(id)
        if (!item) return
        
        const delta = newStock - (item.currentStock || 0)
        if (delta === 0) return

        let status: PantryItem['status'] = 'In Stock'
        if (newStock <= 0) status = 'Out of Stock'
        else if (newStock <= (item.minStock || 0)) status = 'Low Stock'

        // Record movement
        await db.pantryHistory.add({
          id: generateUUID(),
          itemId: id,
          itemName: item.name,
          type: type === 'Adjustment' ? 'Usage' : type,
          quantity: delta,
          unit: item.unit,
          pricePerUnit: item.lastPrice || 0,
          totalValue: type === 'Adjustment' ? (-1 * delta * (item.lastPrice || 0)) : Math.abs(delta * (item.lastPrice || 0)),
          createdAt: new Date()
        })

        const res = await db.pantry.update(id, {
          currentStock: newStock,
          status,
          updatedAt: new Date()
        })

        queryClient.invalidateQueries({ queryKey: ['pantry'] })
        queryClient.invalidateQueries({ queryKey: ['pantryHistory'] })
        return res
      }
    } catch (err) {
      // 2. Revert query cache back to its pristine previous state if write operations fail
      if (previousPantry) {
        queryClient.setQueryData(queryKey, previousPantry)
      }
      throw err
    }
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
