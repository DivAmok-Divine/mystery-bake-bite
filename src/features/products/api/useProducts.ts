import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, type Product } from '../../../shared/lib/db'

export const useProducts = () => {
  const queryClient = useQueryClient()

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => db.products.toArray(),
  })

  const addProductMutation = useMutation({
    mutationFn: (product: Product) => db.products.add(product),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  })

  const updateProductMutation = useMutation({
    mutationFn: ({ id, changes }: { id: number, changes: Partial<Product> }) => db.products.update(id, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  })

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => db.products.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  })

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    addProduct: addProductMutation.mutate,
    updateProduct: updateProductMutation.mutate,
    deleteProduct: deleteProductMutation.mutate,
  }
}
