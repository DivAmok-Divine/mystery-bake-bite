import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, type Product } from '@backend/lib/db'

export const useProducts = () => {
  const queryClient = useQueryClient()

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const data = await db.products.toArray()
      return data.sort((a, b) => {
        const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
        const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
        return timeB - timeA
      })
    },
  })

  const addProductMutation = useMutation({
    mutationFn: (product: Product) => db.products.add({ ...product, updatedAt: new Date() } as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  })

  const updateProductMutation = useMutation({
    mutationFn: ({ id, changes }: { id: number, changes: Partial<Product> }) => 
      db.products.update(id, { ...changes, updatedAt: new Date() } as any),
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
