import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, supabase, isCloudMode, generateUUID, type ProductCategory } from '@backend/lib/db'

export const useCategories = () => {
  const queryClient = useQueryClient()
  const cloud = isCloudMode()

  const categoriesQuery = useQuery({
    queryKey: ['categories', cloud ? 'cloud' : 'local'],
    queryFn: async () => {
      if (cloud) {
        const { data: cats, error } = await supabase.from('product_categories').select('*')
        if (error) throw error
        return (cats || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          createdAt: new Date(c.created_at)
        }))
      } else {
        return await db.productCategories.toArray()
      }
    },
  })

  const addCategoryMutation = useMutation({
    mutationFn: async (category: ProductCategory) => {
      if (cloud) {
        const { data, error } = await supabase
          .from('product_categories')
          .insert([{ name: category.name }])
          .select()
        if (error) throw error
        return data[0]
      } else {
        const id = generateUUID()
        await db.productCategories.add({ ...category, id, createdAt: new Date() })
        return { ...category, id }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: string, changes: Partial<ProductCategory> }) => {
      if (cloud) {
        const { data, error } = await supabase
          .from('product_categories')
          .update({ name: changes.name })
          .eq('id', id)
          .select()
        if (error) throw error
        return data[0]
      } else {
        await db.productCategories.update(id, changes)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      if (cloud) {
        const { error } = await supabase
          .from('product_categories')
          .delete()
          .eq('id', id)
        if (error) throw error
      } else {
        await db.productCategories.delete(id)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })

  return {
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    addCategory: addCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
  }
}
