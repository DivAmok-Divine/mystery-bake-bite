import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, supabase, isCloudMode, generateUUID, type Equipment } from '@backend/lib/db'
import { logSystemAction } from '../../api/useSystemLogs'

export const useEquipment = () => {
  const queryClient = useQueryClient()
  const cloud = isCloudMode()

  const equipmentQuery = useQuery({
    queryKey: ['equipment', cloud ? 'cloud' : 'local'],
    queryFn: async () => {
      if (cloud) {
        const { data, error } = await supabase.from('equipment').select('*')
        if (error) throw error
        return (data || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          category: e.category,
          status: e.status,
          purchaseDate: new Date(e.purchase_date),
          lastMaintained: e.last_maintained ? new Date(e.last_maintained) : undefined,
          price: e.price,
          serialNumber: e.serial_number,
          notes: e.notes,
          createdAt: new Date(e.created_at)
        })).sort((a, b) => {
          const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
          const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })
      } else {
        const data = await db.equipment.toArray()
        return data.sort((a, b) => {
          const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
          const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })
      }
    },
  })

  const addEquipmentMutation = useMutation({
    mutationFn: async (equipment: Equipment) => {
      if (cloud) {
        const { data, error } = await supabase
          .from('equipment')
          .insert([{
            name: equipment.name,
            category: equipment.category,
            status: equipment.status,
            purchase_date: new Date(equipment.purchaseDate).toISOString(),
            last_maintained: equipment.lastMaintained ? new Date(equipment.lastMaintained).toISOString() : null,
            price: equipment.price,
            serial_number: equipment.serialNumber,
            notes: equipment.notes,
            updated_at: new Date().toISOString()
          }])
          .select()
        if (error) throw error
        return data[0]
      } else {
        const id = generateUUID()
        await db.equipment.add({ ...equipment, id, createdAt: new Date(), updatedAt: new Date() } as any)
        return { ...equipment, id }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      logSystemAction('Create', `Created equipment: ${variables.name}`)
    }
  })

  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: string, changes: Partial<Equipment> }) => {
      if (cloud) {
        const dbChanges: any = {}
        if (changes.name !== undefined) dbChanges.name = changes.name
        if (changes.category !== undefined) dbChanges.category = changes.category
        if (changes.status !== undefined) dbChanges.status = changes.status
        if (changes.purchaseDate !== undefined) dbChanges.purchase_date = new Date(changes.purchaseDate).toISOString()
        if (changes.lastMaintained !== undefined) dbChanges.last_maintained = changes.lastMaintained ? new Date(changes.lastMaintained).toISOString() : null
        if (changes.price !== undefined) dbChanges.price = changes.price
        if (changes.serialNumber !== undefined) dbChanges.serial_number = changes.serialNumber
        if (changes.notes !== undefined) dbChanges.notes = changes.notes
        dbChanges.updated_at = new Date().toISOString()

        const { data, error } = await supabase
          .from('equipment')
          .update(dbChanges)
          .eq('id', id)
          .select()
        if (error) throw error
        return data[0]
      } else {
        await db.equipment.update(id, { ...changes, updatedAt: new Date() } as any)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      logSystemAction('Edit', `Updated equipment ID: ${variables.id}`)
    }
  })

  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: string) => {
      if (cloud) {
        const { error } = await supabase
          .from('equipment')
          .delete()
          .eq('id', id)
        if (error) throw error
      } else {
        await db.equipment.delete(id)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      logSystemAction('Delete', `Deleted equipment ID: ${variables}`)
    }
  })

  return {
    equipment: equipmentQuery.data || [],
    isLoading: equipmentQuery.isLoading,
    addEquipment: addEquipmentMutation.mutateAsync,
    updateEquipment: updateEquipmentMutation.mutateAsync,
    deleteEquipment: deleteEquipmentMutation.mutateAsync,
  }
}
