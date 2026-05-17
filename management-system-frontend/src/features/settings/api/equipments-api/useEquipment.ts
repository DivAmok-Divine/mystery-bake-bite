import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, type Equipment } from '@backend/lib/db'

export const useEquipment = () => {
  const queryClient = useQueryClient()

  const equipmentQuery = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const data = await db.equipment.toArray()
      return data.sort((a, b) => {
        const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
        const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
        return timeB - timeA
      })
    },
  })

  const addEquipmentMutation = useMutation({
    mutationFn: (equipment: Equipment) => db.equipment.add({ ...equipment, updatedAt: new Date() } as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment'] })
  })

  const updateEquipmentMutation = useMutation({
    mutationFn: ({ id, changes }: { id: number, changes: Partial<Equipment> }) => 
      db.equipment.update(id, { ...changes, updatedAt: new Date() } as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment'] })
  })

  const deleteEquipmentMutation = useMutation({
    mutationFn: (id: number) => db.equipment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment'] })
  })

  return {
    equipment: equipmentQuery.data || [],
    isLoading: equipmentQuery.isLoading,
    addEquipment: addEquipmentMutation.mutateAsync,
    updateEquipment: updateEquipmentMutation.mutateAsync,
    deleteEquipment: deleteEquipmentMutation.mutateAsync,
  }
}
