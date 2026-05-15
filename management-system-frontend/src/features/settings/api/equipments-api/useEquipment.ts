import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, type Equipment } from '@backend/lib/db'

export const useEquipment = () => {
  const queryClient = useQueryClient()

  const equipmentQuery = useQuery({
    queryKey: ['equipment'],
    queryFn: () => db.equipment.toArray(),
  })

  const addEquipmentMutation = useMutation({
    mutationFn: (equipment: Equipment) => db.equipment.add(equipment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment'] })
  })

  const updateEquipmentMutation = useMutation({
    mutationFn: ({ id, changes }: { id: number, changes: Partial<Equipment> }) => 
      db.equipment.update(id, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment'] })
  })

  const deleteEquipmentMutation = useMutation({
    mutationFn: (id: number) => db.equipment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment'] })
  })

  return {
    equipment: equipmentQuery.data || [],
    isLoading: equipmentQuery.isLoading,
    addEquipment: addEquipmentMutation.mutate,
    updateEquipment: updateEquipmentMutation.mutate,
    deleteEquipment: deleteEquipmentMutation.mutate,
  }
}
