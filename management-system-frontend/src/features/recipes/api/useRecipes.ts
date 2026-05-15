import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, type Recipe } from '@backend/lib/db'

export const useRecipes = () => {
  const queryClient = useQueryClient()

  const recipesQuery = useQuery({
    queryKey: ['recipes'],
    queryFn: () => db.recipes.toArray(),
  })

  const addRecipeMutation = useMutation({
    mutationFn: (recipe: Recipe) => db.recipes.add(recipe),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    }
  })

  const updateRecipeMutation = useMutation({
    mutationFn: (recipe: Recipe) => {
      if (!recipe.id) throw new Error('Recipe ID is required for update')
      return db.recipes.update(recipe.id, recipe)
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
