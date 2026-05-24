import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, supabase, isCloudMode, generateUUID, type Recipe } from '@backend/lib/db'

export const useRecipes = () => {
  const queryClient = useQueryClient()
  const cloud = isCloudMode()

  const recipesQuery = useQuery({
    queryKey: ['recipes', cloud ? 'cloud' : 'local'],
    queryFn: async () => {
      if (cloud) {
        const { data, error } = await supabase.from('recipes').select('*')
        if (error) throw error
        return (data || []).map((r: any) => ({
          id: r.id,
          title: r.title,
          ingredients: r.ingredients,
          method: r.method,
          notes: r.notes,
          createdAt: new Date(r.created_at)
        })).sort((a, b) => {
          const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
          const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })
      } else {
        const data = await db.recipes.toArray()
        return data.sort((a, b) => {
          const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
          const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })
      }
    },
  })

  const addRecipeMutation = useMutation({
    mutationFn: async (recipe: Recipe) => {
      if (cloud) {
        const { data, error } = await supabase
          .from('recipes')
          .insert([{
            title: recipe.title,
            ingredients: recipe.ingredients,
            method: recipe.method,
            notes: recipe.notes,
            updated_at: new Date().toISOString()
          }])
          .select()
        if (error) throw error
        return data[0]
      } else {
        const id = generateUUID()
        await db.recipes.add({ ...recipe, id, createdAt: new Date(), updatedAt: new Date() } as any)
        return { ...recipe, id }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    }
  })

  const updateRecipeMutation = useMutation({
    mutationFn: async (recipe: Recipe) => {
      if (!recipe.id) throw new Error('Recipe ID is required for update')
      if (cloud) {
        const { data, error } = await supabase
          .from('recipes')
          .update({
            title: recipe.title,
            ingredients: recipe.ingredients,
            method: recipe.method,
            notes: recipe.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', recipe.id)
          .select()
        if (error) throw error
        return data[0]
      } else {
        await db.recipes.update(recipe.id, { ...recipe, updatedAt: new Date() } as any)
        return recipe
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    }
  })

  const deleteRecipeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (cloud) {
        const { error } = await supabase
          .from('recipes')
          .delete()
          .eq('id', id)
        if (error) throw error
      } else {
        await db.recipes.delete(id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    }
  })

  return {
    recipes: recipesQuery.data || [],
    isLoading: recipesQuery.isLoading,
    addRecipe: addRecipeMutation.mutateAsync,
    updateRecipe: updateRecipeMutation.mutateAsync,
    deleteRecipe: deleteRecipeMutation.mutateAsync,
  }
}
