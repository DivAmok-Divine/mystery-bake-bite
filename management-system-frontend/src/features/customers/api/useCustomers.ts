import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, type Customer } from '@backend/lib/db'

export const useCustomers = () => {
  const queryClient = useQueryClient()

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const data = await db.customers.toArray()
      return data.sort((a, b) => {
        const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
        const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
        return timeB - timeA
      })
    },
  })

  const addCustomerMutation = useMutation({
    mutationFn: (customer: Customer) => db.customers.add({ ...customer, updatedAt: new Date() } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, changes }: { id: number, changes: Partial<Customer> }) => 
      db.customers.update(id, { ...changes, updatedAt: new Date() } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: number) => db.customers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  return {
    customers: customersQuery.data || [],
    isLoading: customersQuery.isLoading,
    addCustomer: addCustomerMutation.mutate,
    updateCustomer: updateCustomerMutation.mutate,
    deleteCustomer: deleteCustomerMutation.mutate,
  }
}
