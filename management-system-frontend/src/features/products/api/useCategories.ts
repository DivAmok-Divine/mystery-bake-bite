import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, type ProductCategory } from '@backend/lib/db'

export const useCategories = () => {
  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const cats = await db.productCategories.toArray()
      if (cats.length === 0) {
        // Seed default categories if empty
        const defaults: ProductCategory[] = [
          { name: 'Donut', createdAt: new Date() },
          { name: 'Pastry', createdAt: new Date() },
          { name: 'Cake', createdAt: new Date() }
        ]
        await db.productCategories.bulkAdd(defaults)
        return db.productCategories.toArray()
      }
      return cats
    },
  })

  const addCategoryMutation = useMutation({
    mutationFn: (category: ProductCategory) => db.productCategories.add(category),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, changes }: { id: number, changes: Partial<ProductCategory> }) => 
      db.productCategories.update(id, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => db.productCategories.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })

  return {
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    addCategory: addCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutate,
  }
}
