import React, { useState, useMemo } from 'react'
import { useDebounce } from '@shared/hooks/useDebounce'
import { Plus, BookOpen, Pencil, Trash2, Search } from 'lucide-react'
import { useRecipes } from '../api/useRecipes'
import { BottomSheet } from '@shared/ui/molecules/BottomSheet'
import { RecipeForm } from './RecipeForm'
import { RecipeDetails } from './RecipeDetails'
import { SearchBar } from '@shared/ui/molecules/SearchBar'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'
import { EmptyState } from '@shared/ui/molecules/EmptyState'
import { ListSkeleton } from '@shared/ui/atoms/ListSkeleton'
import { useNotification } from '@shared/ui/molecules/Notification'
import type { Recipe } from '@backend/lib/db'

export const RecipeList: React.FC = () => {
  const { notify } = useNotification()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 150)
  const [isAddingRecipe, setIsAddingRecipe] = useState(false)
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const { recipes, isLoading, deleteRecipe } = useRecipes()

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => 
      recipe.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      recipe.ingredients.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    )
  }, [recipes, debouncedSearchQuery])



  const navigateItem = (direction: 'next' | 'prev', list = filteredRecipes, currentItem = viewingRecipe || editingRecipe) => {
    if (!currentItem || list.length <= 1) return
    const currentIndex = list.findIndex(r => r.id === currentItem.id)
    if (currentIndex === -1) return
    
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (newIndex >= list.length) newIndex = 0
    if (newIndex < 0) newIndex = list.length - 1
    
    const nextItem = list[newIndex]
    if (viewingRecipe) setViewingRecipe(nextItem)
    if (editingRecipe) setEditingRecipe(nextItem)
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-3 px-3 flex flex-col gap-3 border-b border-brand-chocolate/5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display">Secret Recipes</h1>
          <button 
            onClick={() => setIsAddingRecipe(true)}
            className="w-10 h-10 rounded-md bg-brand-chocolate text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <Plus size={20} />
          </button>
        </div>

        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search your secret recipes..."
        />
      </header>

      {isLoading ? (
        <ListSkeleton count={2} className="h-40" />
      ) : recipes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No recipes yet"
          description="Save your secret formulas by tapping the button below."
          actionLabel="+ Add secret recipe"
          onAction={() => setIsAddingRecipe(true)}
        />
      ) : filteredRecipes.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No formulas found"
          description={`We couldn't find any recipes matching "${searchQuery}"`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="card transition-colors relative overflow-hidden">
              {/* Branded Watermark Logo */}
              <div className="absolute -bottom-16 -right-16 opacity-[0.03] pointer-events-none transform rotate-[15deg] transition-transform group-hover:scale-110">
                <img src="/logo-clean.png" alt="" className="w-64 h-64 grayscale" />
              </div>

              <div className="relative z-10 flex justify-between items-center gap-4">
                {/* Left aligned Icon and Title */}
                <div 
                  onClick={() => setViewingRecipe(recipe)}
                  className="flex-1 flex items-center gap-4 py-1 cursor-pointer active:scale-[0.98] hover:opacity-80 transition-all"
                  title="View Full Recipe"
                >
                  <div className="w-10 h-10 rounded-md bg-brand-dough/10 flex items-center justify-center text-brand-chocolate flex-shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="text-xl font-display leading-tight text-brand-chocolate">
                    {recipe.title}
                  </h3>
                </div>

                {/* Right side: Compact Vertical Action Column */}
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => setEditingRecipe(recipe)}
                    className="w-8 h-8 rounded-md bg-brand-chocolate/5 text-brand-chocolate/40 hover:text-brand-chocolate transition-colors flex items-center justify-center"
                    title="Edit Recipe"
                  >
                    <Pencil size={15} />
                  </button>
                  <button 
                    onClick={() => recipe.id && setRecipeToDelete(recipe.id)}
                    className="w-8 h-8 rounded-md bg-red-50 text-red-400 hover:text-red-600 transition-colors flex items-center justify-center"
                    title="Delete Recipe"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => setViewingRecipe(recipe)}
                className="w-full mt-4 py-2 text-xs font-bold  border border-brand-chocolate/10 rounded-md text-brand-chocolate/60 hover:bg-brand-chocolate hover:text-white transition-all"
              >
                View Full Recipe
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail View BottomSheet */}
      <BottomSheet 
        isOpen={!!viewingRecipe} 
        onClose={() => setViewingRecipe(null)} 
        onSwipeLeft={() => navigateItem('next')}
        onSwipeRight={() => navigateItem('prev')}
        animationKey={viewingRecipe?.id}
        title={viewingRecipe?.title || 'Recipe Details'}
        subtitle="View full recipe ingredients and instructions"
      >
        {viewingRecipe && <RecipeDetails recipe={viewingRecipe} />}
      </BottomSheet>

      {/* Add Recipe BottomSheet */}
      <BottomSheet 
        isOpen={isAddingRecipe} 
        onClose={() => {
          setIsAddingRecipe(false)
          setIsFormDirty(false)
        }} 
        title="Add Secret Recipe"
        subtitle="Create a new formula for your bakery"
        disableSwipe={true}
        hasUnsavedChanges={isFormDirty}
      >
        <RecipeForm 
          onSuccess={() => {
            setIsAddingRecipe(false)
            setIsFormDirty(false)
          }} 
          onDirtyChange={setIsFormDirty}
        />
      </BottomSheet>

      {/* Edit Recipe BottomSheet */}
      <BottomSheet 
        isOpen={!!editingRecipe} 
        onClose={() => {
          setEditingRecipe(null)
          setIsFormDirty(false)
        }} 
        animationKey={editingRecipe?.id}
        title="Edit Secret Recipe"
        subtitle="Modify recipe ingredients and instructions"
        disableSwipe={true}
        hasUnsavedChanges={isFormDirty}
      >
        {editingRecipe && (
          <RecipeForm 
            recipe={editingRecipe} 
            onSuccess={() => {
              setEditingRecipe(null)
              setIsFormDirty(false)
            }} 
            onDirtyChange={setIsFormDirty}
          />
        )}
      </BottomSheet>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={recipeToDelete !== null}
        onClose={() => setRecipeToDelete(null)}
        onConfirm={async () => {
          if (recipeToDelete) {
            const recipe = recipes.find(r => r.id === recipeToDelete)
            try {
              await deleteRecipe(recipeToDelete)
              notify({
                type: 'delete',
                title: 'Recipe Removed',
                message: `Recipe ${recipe?.title || ''} successfully deleted!`
              })
            } catch (err) {
              notify({
                type: 'error',
                message: `Failed to delete recipe ${recipe?.title || ''}.`
              })
            }
          }
          setRecipeToDelete(null)
        }}
        title="Delete Recipe?"
        message={
          <>
            Are you sure you want to permanently delete this secret recipe?{' '}
            <span className="text-red-500">This action cannot be undone.</span>
          </>
        }
      />
    </div>
  )
}
