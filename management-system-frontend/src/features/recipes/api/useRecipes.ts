import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, type Recipe } from '@backend/lib/db'

export const useRecipes = () => {
  const queryClient = useQueryClient()

  const recipesQuery = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const data = await db.recipes.toArray()
      return data.sort((a, b) => {
        const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
        const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
        return timeB - timeA
      })
    },
  })

  const addRecipeMutation = useMutation({
    mutationFn: (recipe: Recipe) => db.recipes.add({ ...recipe, updatedAt: new Date() } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    }
  })

  const updateRecipeMutation = useMutation({
    mutationFn: (recipe: Recipe) => {
      if (!recipe.id) throw new Error('Recipe ID is required for update')
      return db.recipes.update(recipe.id, { ...recipe, updatedAt: new Date() } as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    }
  })

  const deleteRecipeMutation = useMutation({
    mutationFn: (id: number) => db.recipes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    }
  })

  return {
    recipes: recipesQuery.data || [],
    isLoading: recipesQuery.isLoading,
    addRecipe: addRecipeMutation.mutate,
    updateRecipe: updateRecipeMutation.mutate,
    deleteRecipe: deleteRecipeMutation.mutate,
  }
}
