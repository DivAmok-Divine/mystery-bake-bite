import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, type Customer } from '@backend/lib/db'

export const useCustomers = () => {
  const queryClient = useQueryClient()

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: () => db.customers.toArray(),
  })

  const addCustomerMutation = useMutation({
    mutationFn: (customer: Customer) => db.customers.add(customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, changes }: { id: number, changes: Partial<Customer> }) => db.customers.update(id, changes),
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
