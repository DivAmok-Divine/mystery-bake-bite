import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, supabase, isCloudMode, generateUUID, type Customer } from '@backend/lib/db'
import { logSystemAction } from '../../settings/api/useSystemLogs'

export const useCustomers = () => {
  const queryClient = useQueryClient()
  const cloud = isCloudMode()

  const customersQuery = useQuery({
    queryKey: ['customers', cloud ? 'cloud' : 'local'],
    queryFn: async () => {
      if (cloud) {
        const { data, error } = await supabase.from('customers').select('*')
        if (error) throw error
        return (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          totalOrders: c.total_orders,
          status: c.status,
          createdAt: new Date(c.created_at)
        })).sort((a, b) => {
          const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
          const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })
      } else {
        const data = await db.customers.toArray()
        return data.sort((a, b) => {
          const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
          const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })
      }
    },
  })

  const addCustomerMutation = useMutation({
    mutationFn: async (customer: Customer) => {
      if (cloud) {
        const { data, error } = await supabase
          .from('customers')
          .insert([{
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            total_orders: customer.totalOrders || 0,
            status: customer.status,
            updated_at: new Date().toISOString()
          }])
          .select()
        if (error) throw error
        return data[0]
      } else {
        const id = generateUUID()
        await db.customers.add({ ...customer, id, createdAt: new Date(), updatedAt: new Date() } as any)
        return { ...customer, id }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      logSystemAction('Create', `Created customer: ${variables.name}`)
    }
  })

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: string, changes: Partial<Customer> }) => {
      if (cloud) {
        const dbChanges: any = {}
        if (changes.name !== undefined) dbChanges.name = changes.name
        if (changes.phone !== undefined) dbChanges.phone = changes.phone
        if (changes.email !== undefined) dbChanges.email = changes.email
        if (changes.address !== undefined) dbChanges.address = changes.address
        if (changes.totalOrders !== undefined) dbChanges.total_orders = changes.totalOrders
        if (changes.status !== undefined) dbChanges.status = changes.status
        dbChanges.updated_at = new Date().toISOString()

        const { data, error } = await supabase
          .from('customers')
          .update(dbChanges)
          .eq('id', id)
          .select()
        if (error) throw error
        return data[0]
      } else {
        await db.customers.update(id, { ...changes, updatedAt: new Date() } as any)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      logSystemAction('Edit', `Updated customer ID: ${variables.id}`)
    }
  })

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      if (cloud) {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', id)
        if (error) throw error
      } else {
        await db.customers.delete(id)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      logSystemAction('Delete', `Deleted customer ID: ${variables}`)
    }
  })

  return {
    customers: customersQuery.data || [],
    isLoading: customersQuery.isLoading,
    addCustomer: addCustomerMutation.mutateAsync,
    updateCustomer: updateCustomerMutation.mutateAsync,
    deleteCustomer: deleteCustomerMutation.mutateAsync,
  }
}
