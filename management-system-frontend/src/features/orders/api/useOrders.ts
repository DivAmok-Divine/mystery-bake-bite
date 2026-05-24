import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, supabase, isCloudMode, generateUUID, type Order } from '@backend/lib/db'
import { determineCustomerStatus } from '@shared/utils/customerGeneralAnalytics'

export const useOrders = () => {
  const queryClient = useQueryClient()
  const cloud = isCloudMode()

  const ordersQuery = useQuery({
    queryKey: ['orders', cloud ? 'cloud' : 'local'],
    queryFn: async () => {
      if (cloud) {
        const { data, error } = await supabase.from('orders').select('*')
        if (error) throw error
        return (data || []).map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          customerId: o.customer_id,
          customerName: o.customer_name,
          items: o.items,
          amount: o.amount,
          status: o.status,
          deadline: new Date(o.deadline),
          createdAt: new Date(o.created_at),
          notes: o.notes
        })).sort((a, b) => {
          const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
          const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })
      } else {
        const data = await db.orders.toArray()
        return data.sort((a, b) => {
          const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
          const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })
      }
    },
  })

  const updateCustomerStatus = async (customerId: string) => {
    if (cloud) {
      const { data: customerOrders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
      if (orderError) throw orderError

      const mappedOrders = (customerOrders || []).map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        customerId: o.customer_id,
        customerName: o.customer_name,
        items: o.items,
        amount: o.amount,
        status: o.status,
        deadline: new Date(o.deadline),
        createdAt: new Date(o.created_at),
        notes: o.notes
      }))

      const status = determineCustomerStatus(mappedOrders)
      
      const { error: customerError } = await supabase
        .from('customers')
        .update({ status })
        .eq('id', customerId)
      if (customerError) throw customerError
    } else {
      const customerOrders = await db.orders.where('customerId').equals(customerId).toArray()
      const status = determineCustomerStatus(customerOrders)
      await db.customers.update(customerId, { status })
    }
  }

  const addOrderMutation = useMutation({
    mutationFn: async (order: Order) => {
      if (cloud) {
        const { data, error } = await supabase
          .from('orders')
          .insert([{
            order_number: order.orderNumber,
            customer_id: order.customerId,
            customer_name: order.customerName,
            items: order.items,
            amount: order.amount,
            status: order.status,
            deadline: new Date(order.deadline).toISOString(),
            notes: order.notes,
            updated_at: new Date().toISOString()
          }])
          .select()
        if (error) throw error
        if (order.customerId) await updateCustomerStatus(order.customerId)
        return data[0].id
      } else {
        const id = generateUUID()
        await db.orders.add({ ...order, id, createdAt: new Date(), updatedAt: new Date() } as any)
        if (order.customerId) await updateCustomerStatus(order.customerId)
        return id
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: string, changes: Partial<Order> }) => {
      if (cloud) {
        const dbChanges: any = {}
        if (changes.orderNumber !== undefined) dbChanges.order_number = changes.orderNumber
        if (changes.customerId !== undefined) dbChanges.customer_id = changes.customerId
        if (changes.customerName !== undefined) dbChanges.customer_name = changes.customerName
        if (changes.items !== undefined) dbChanges.items = changes.items
        if (changes.amount !== undefined) dbChanges.amount = changes.amount
        if (changes.status !== undefined) dbChanges.status = changes.status
        if (changes.deadline !== undefined) dbChanges.deadline = new Date(changes.deadline).toISOString()
        if (changes.notes !== undefined) dbChanges.notes = changes.notes
        dbChanges.updated_at = new Date().toISOString()

        const { error } = await supabase
          .from('orders')
          .update(dbChanges)
          .eq('id', id)
        if (error) throw error

        const { data: order, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single()
        if (fetchError) throw fetchError

        if (order?.customer_id) await updateCustomerStatus(order.customer_id)
      } else {
        await db.orders.update(id, { ...changes, updatedAt: new Date() } as any)
        const order = await db.orders.get(id)
        if (order?.customerId) await updateCustomerStatus(order.customerId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      if (cloud) {
        const { data: order, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single()
        if (fetchError) throw fetchError

        const { error: deleteError } = await supabase
          .from('orders')
          .delete()
          .eq('id', id)
        if (deleteError) throw deleteError

        if (order?.customer_id) await updateCustomerStatus(order.customer_id)
      } else {
        const order = await db.orders.get(id)
        await db.orders.delete(id)
        if (order?.customerId) await updateCustomerStatus(order.customerId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  return {
    orders: ordersQuery.data || [],
    isLoading: ordersQuery.isLoading,
    addOrder: addOrderMutation.mutateAsync,
    updateOrder: updateOrderMutation.mutateAsync,
    deleteOrder: deleteOrderMutation.mutateAsync,
  }
}
