import React, { useState } from 'react'
import { useRecipes } from '../api/useRecipes.ts'
import { Utensils, BookOpen, Clock, AlertCircle, Plus, X, Info } from 'lucide-react'
import type { Recipe } from '@backend/lib/db'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'

interface RecipeFormProps {
  recipe?: Recipe
  onSuccess: () => void
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onSuccess }) => {
  const { addRecipe, updateRecipe } = useRecipes()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfirm, setShowConfirm] = useState(false)
  
  // Initialize lists from existing recipe or defaults
  const [ingredientsList, setIngredientsList] = useState<string[]>(
    recipe ? recipe.ingredients.split('\n').map(i => i.replace('• ', '')) : ['']
  )
  const [methodList, setMethodList] = useState<string[]>(
    recipe ? recipe.method.split('\n').map(i => i.replace('• ', '')) : ['']
  )
  
  const [formData, setFormData] = useState({
    title: recipe?.title || '',
    notes: recipe?.notes || ''
  })

  // Auto-resize all textareas on mount
  React.useEffect(() => {
    const textareas = document.querySelectorAll('textarea')
    textareas.forEach(ta => {
      ta.style.height = 'auto'
      ta.style.height = `${ta.scrollHeight}px`
    })
  }, [recipe])

  const addIngredient = () => {
    setIngredientsList([...ingredientsList, ''])
  }

  const removeIngredient = (index: number) => {
    if (ingredientsList.length > 1) {
      setIngredientsList(ingredientsList.filter((_, i) => i !== index))
    } else {
      setIngredientsList([''])
    }
  }

  const updateIngredient = (index: number, value: string) => {
    const newList = [...ingredientsList]
    newList[index] = value
    setIngredientsList(newList)
    if (errors.ingredients) setErrors({ ...errors, ingredients: '' })
  }

  const addMethodStep = () => {
    setMethodList([...methodList, ''])
  }

  const removeMethodStep = (index: number) => {
    if (methodList.length > 1) {
      setMethodList(methodList.filter((_, i) => i !== index))
    } else {
      setMethodList([''])
    }
  }

  const updateMethodStep = (index: number, value: string) => {
    const newList = [...methodList]
    newList[index] = value
    setMethodList(newList)
    if (errors.method) setErrors({ ...errors, method: '' })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Recipe title is required'
    if (ingredientsList.every(i => !i.trim())) newErrors.ingredients = 'At least one ingredient is required'
    if (methodList.every(i => !i.trim())) newErrors.method = 'At least one method step is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    const recipeData = {
      title: formData.title,
      ingredients: ingredientsList.filter(i => i.trim()).map(i => `• ${i}`).join('\n'),
      method: methodList.filter(i => i.trim()).map(i => `• ${i}`).join('\n'),
      notes: formData.notes.trim(),
      createdAt: recipe?.createdAt || new Date()
    }

    if (recipe?.id) {
      updateRecipe({ ...recipeData, id: recipe.id })
    } else {
      addRecipe(recipeData)
    }
    onSuccess()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setShowConfirm(true)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2">
          <BookOpen size={14} /> Recipe Title
        </label>
        <input
          type="text"
          placeholder="e.g. Signature Chocolate Donut"
          className={`w-full p-4 bg-brand-cream/10 border ${errors.title ? 'border-red-500 bg-red-50/10' : 'border-brand-chocolate/10'} rounded-md focus:outline-none focus:ring-1 ${errors.title ? 'focus:ring-red-500' : 'focus:ring-feature-recipes'}`}
          value={formData.title}
          onChange={(e) => {
            setFormData({ ...formData, title: e.target.value })
            if (errors.title) setErrors({ ...errors, title: '' })
          }}
        />
        {errors.title && (
          <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
            <AlertCircle size={10} /> {errors.title}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><Utensils size={14} /> Ingredients</span>
          <button 
            type="button" 
            onClick={addIngredient}
            className="text-brand-chocolate hover:opacity-60 transition-opacity"
          >
            <Plus size={20} />
          </button>
        </label>
        
        <div className={`w-full min-h-[160px] max-h-[200px] overflow-y-auto no-scrollbar py-2 bg-brand-cream/10 border ${errors.ingredients ? 'border-red-500 bg-red-50/10' : 'border-brand-chocolate/10'} rounded-md flex flex-col`}>
          {ingredientsList.map((ingredient, index) => (
            <div key={index} className="flex items-center gap-2 group px-4">
              <span className="text-brand-chocolate font-bold text-base">•</span>
              <textarea
                rows={1}
                placeholder="Ingredient..."
                className="flex-1 py-1.5 bg-transparent border-none focus:outline-none text-sm resize-none overflow-hidden"
                value={ingredient}
                enterKeyHint="next"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addIngredient()
                  } else if (e.key === 'Backspace' && !ingredient && ingredientsList.length > 1) {
                    e.preventDefault()
                    removeIngredient(index)
                  }
                }}
                onChange={(e) => {
                  updateIngredient(index, e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = `${e.target.scrollHeight}px`
                }}
                onFocus={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = `${e.target.scrollHeight}px`
                }}
              />
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-brand-chocolate/20 hover:text-red-500 transition-all"
                title="Wipe out line"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        {errors.ingredients && (
          <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
            <AlertCircle size={10} /> {errors.ingredients}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><Clock size={14} /> Method Steps</span>
          <button 
            type="button" 
            onClick={addMethodStep}
            className="text-brand-chocolate hover:opacity-60 transition-opacity"
          >
            <Plus size={20} />
          </button>
        </label>
        
        <div className={`w-full min-h-[160px] max-h-[200px] overflow-y-auto no-scrollbar py-2 bg-brand-cream/10 border ${errors.method ? 'border-red-500 bg-red-50/10' : 'border-brand-chocolate/10'} rounded-md flex flex-col`}>
          {methodList.map((step, index) => (
            <div key={index} className="flex items-center gap-2 group px-4">
              <span className="text-brand-chocolate font-bold text-base">•</span>
              <textarea
                rows={1}
                placeholder="Method step..."
                className="flex-1 py-1.5 bg-transparent border-none focus:outline-none text-sm resize-none overflow-hidden"
                value={step}
                enterKeyHint="next"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addMethodStep()
                  } else if (e.key === 'Backspace' && !step && methodList.length > 1) {
                    e.preventDefault()
                    removeMethodStep(index)
                  }
                }}
                onChange={(e) => {
                  updateMethodStep(index, e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = `${e.target.scrollHeight}px`
                }}
                onFocus={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = `${e.target.scrollHeight}px`
                }}
              />
              <button
                type="button"
                onClick={() => removeMethodStep(index)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-brand-chocolate/20 hover:text-red-500 transition-all"
                title="Wipe out line"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        {errors.method && (
          <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
            <AlertCircle size={10} /> {errors.method}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2">
          <Info size={14} /> Baker's Notes (Optional)
        </label>
        <textarea
          rows={2}
          placeholder="e.g. A family heirloom recipe passed down through generations..."
          className="w-full p-4 bg-brand-cream/10 border border-brand-chocolate/10 rounded-md focus:outline-none focus:ring-1 focus:ring-feature-recipes text-sm resize-none"
          value={formData.notes}
          onChange={(e) => {
            setFormData({ ...formData, notes: e.target.value })
            e.target.style.height = 'auto'
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
        />
      </div>

      <div className="sticky bottom-0 bg-transparent pt-2 pb-2 z-10 border-t border-brand-chocolate/5">
        <button 
          type="submit" 
          disabled={!!recipe && 
            formData.title === recipe.title && 
            formData.notes === (recipe.notes || '') &&
            ingredientsList.filter(i => i.trim()).join('\n') === recipe.ingredients.split('\n').map(i => i.replace('• ', '')).filter(i => i.trim()).join('\n') &&
            methodList.filter(m => m.trim()).join('\n') === recipe.method.split('\n').map(m => m.replace('• ', '')).filter(m => m.trim()).join('\n')
          }
          className="btn-primary w-full bg-feature-recipes hover:bg-feature-recipes/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {recipe ? 'Update Recipe' : 'Save Recipe'}
        </button>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title={recipe ? 'Update Recipe?' : 'Save Recipe?'}
        message={recipe
          ? `Save your changes to "${formData.title}"?`
          : `Save "${formData.title}" to your secret recipes?`
        }
        confirmText={recipe ? 'Yes, Update' : 'Yes, Save'}
        isDestructive={false}
      />
    </form>
  )
}
