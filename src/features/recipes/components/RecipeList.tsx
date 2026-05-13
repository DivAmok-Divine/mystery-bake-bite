import React, { useState } from 'react'
import { Plus, BookOpen, Pencil, Trash2, Search } from 'lucide-react'
import { useRecipes } from '../api/useRecipes'
import { BottomSheet } from '../../../shared/ui/molecules/BottomSheet'
import { RecipeForm } from './RecipeForm'
import { RecipeDetails } from './RecipeDetails'
import { SearchBar } from '../../../shared/ui/molecules/SearchBar'
import { ConfirmModal } from '../../../shared/ui/molecules/ConfirmModal'
import type { Recipe } from '../../../shared/lib/db'

export const RecipeList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingRecipe, setIsAddingRecipe] = useState(false)
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [recipeToDelete, setRecipeToDelete] = useState<number | null>(null)
  const { recipes, isLoading, deleteRecipe } = useRecipes()

  const filteredRecipes = recipes.filter(recipe => 
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.ingredients.toLowerCase().includes(searchQuery.toLowerCase())
  )



  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-6 px-6 flex flex-col gap-3 border-b border-brand-chocolate/5">
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
        <div className="grid grid-cols-1 gap-4">
          {[1, 2].map(i => <div key={i} className="h-40 glass-skeleton" />)}
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-10">
          <div className="w-20 h-20 bg-brand-chocolate/5 rounded-full flex items-center justify-center text-brand-chocolate/20 mb-4">
            <BookOpen size={40} strokeWidth={1.5} />
          </div>
          <p className="text-brand-chocolate font-display text-xl">No recipes yet</p>
          <p className="text-brand-chocolate/40 text-sm mt-2">
            Save your secret formulas by tapping the + button above.
          </p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-10">
          <div className="w-20 h-20 bg-brand-chocolate/5 rounded-full flex items-center justify-center text-brand-chocolate/20 mb-4">
            <Search size={40} strokeWidth={1.5} />
          </div>
          <p className="text-brand-chocolate font-display text-xl">No formulas found</p>
          <p className="text-brand-chocolate/40 text-sm mt-2">
            We couldn't find any recipes matching "{searchQuery}"
          </p>
        </div>
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
                <div className="flex-1 flex items-center gap-4 py-1">
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
        title={viewingRecipe?.title || 'Recipe Details'}
      >
        {viewingRecipe && <RecipeDetails recipe={viewingRecipe} />}
      </BottomSheet>

      {/* Add Recipe BottomSheet */}
      <BottomSheet 
        isOpen={isAddingRecipe} 
        onClose={() => setIsAddingRecipe(false)} 
        title="Add Secret Recipe"
      >
        <RecipeForm onSuccess={() => setIsAddingRecipe(false)} />
      </BottomSheet>

      {/* Edit Recipe BottomSheet */}
      <BottomSheet 
        isOpen={!!editingRecipe} 
        onClose={() => setEditingRecipe(null)} 
        title="Edit Secret Recipe"
      >
        {editingRecipe && (
          <RecipeForm 
            recipe={editingRecipe} 
            onSuccess={() => setEditingRecipe(null)} 
          />
        )}
      </BottomSheet>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={recipeToDelete !== null}
        onClose={() => setRecipeToDelete(null)}
        onConfirm={() => {
          if (recipeToDelete) deleteRecipe(recipeToDelete)
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
