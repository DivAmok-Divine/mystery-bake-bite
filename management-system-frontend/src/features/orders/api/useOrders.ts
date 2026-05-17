import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, type Order } from '@backend/lib/db'
import { determineCustomerStatus } from '@shared/utils/front-end-calculations/customerGeneralAnalytics'

export const useOrders = () => {
  const queryClient = useQueryClient()

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const data = await db.orders.toArray()
      return data.sort((a, b) => {
        const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
        const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
        return timeB - timeA
      })
    },
  })

  const updateCustomerStatus = async (customerId: number) => {
    const customerOrders = await db.orders.where('customerId').equals(customerId).toArray()
    const status = determineCustomerStatus(customerOrders)
    
    await db.customers.update(customerId, { status })
  }

  const addOrderMutation = useMutation({
    mutationFn: async (order: Order) => {
      const id = await db.orders.add({ ...order, updatedAt: new Date() } as any)
      if (order.customerId) await updateCustomerStatus(order.customerId)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: number, changes: Partial<Order> }) => {
      await db.orders.update(id, { ...changes, updatedAt: new Date() } as any)
      const order = await db.orders.get(id)
      if (order?.customerId) await updateCustomerStatus(order.customerId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      const order = await db.orders.get(id)
      await db.orders.delete(id)
      if (order?.customerId) await updateCustomerStatus(order.customerId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  return {
    orders: ordersQuery.data || [],
    isLoading: ordersQuery.isLoading,
    addOrder: addOrderMutation.mutate,
    updateOrder: updateOrderMutation.mutate,
    deleteOrder: deleteOrderMutation.mutate,
  }
}
