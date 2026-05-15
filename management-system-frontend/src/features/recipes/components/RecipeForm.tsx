import React, { useState } from 'react'
import { useRecipes } from '../api/useRecipes.ts'
import { Reorder } from 'framer-motion'
import { Utensils, BookOpen, Clock, AlertCircle, Plus, X, Info, GripVertical } from 'lucide-react'
import type { Recipe } from '@backend/lib/db'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'
import { generateId } from '@shared/utils/front-end-calculations/commonUtils'

interface RecipeFormProps {
  recipe?: Recipe
  onSuccess: () => void
}

interface ListItem {
  id: string
  value: string
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onSuccess }) => {
  const { addRecipe, updateRecipe } = useRecipes()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfirm, setShowConfirm] = useState(false)
  
  // Initialize lists with stable IDs for framer-motion Reorder
  const [ingredientsList, setIngredientsList] = useState<ListItem[]>(
    recipe 
      ? recipe.ingredients.split('\n').map(i => ({ id: generateId(6), value: i.replace('• ', '') })) 
      : [{ id: generateId(6), value: '' }]
  )
  const [methodList, setMethodList] = useState<ListItem[]>(
    recipe 
      ? recipe.method.split('\n').map(m => ({ id: generateId(6), value: m.replace('• ', '') })) 
      : [{ id: generateId(6), value: '' }]
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

  const ingredientsContainerRef = React.useRef<HTMLDivElement>(null)
  const methodContainerRef = React.useRef<HTMLDivElement>(null)

  const focusLastItem = (containerRef: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      const textareas = containerRef.current?.querySelectorAll('textarea')
      if (textareas && textareas.length > 0) {
        const lastTextarea = textareas[textareas.length - 1] as HTMLTextAreaElement
        lastTextarea.focus()
        // Move cursor to end
        const length = lastTextarea.value.length
        lastTextarea.setSelectionRange(length, length)
      }
    }, 0)
  }

  const addIngredient = () => {
    // Don't add if last item is empty
    if (ingredientsList.length > 0 && !ingredientsList[ingredientsList.length - 1].value.trim()) {
      focusLastItem(ingredientsContainerRef)
      return
    }
    setIngredientsList([...ingredientsList, { id: generateId(6), value: '' }])
    focusLastItem(ingredientsContainerRef)
  }

  const removeIngredient = (index: number) => {
    if (ingredientsList.length > 1) {
      setIngredientsList(ingredientsList.filter((_, i) => i !== index))
    } else {
      setIngredientsList([{ id: generateId(6), value: '' }])
    }
  }

  const updateIngredient = (index: number, value: string) => {
    const newList = [...ingredientsList]
    newList[index] = { ...newList[index], value }
    setIngredientsList(newList)
    if (errors.ingredients) setErrors({ ...errors, ingredients: '' })
  }

  const addMethodStep = () => {
    // Don't add if last item is empty
    if (methodList.length > 0 && !methodList[methodList.length - 1].value.trim()) {
      focusLastItem(methodContainerRef)
      return
    }
    setMethodList([...methodList, { id: generateId(6), value: '' }])
    focusLastItem(methodContainerRef)
  }

  const removeMethodStep = (index: number) => {
    if (methodList.length > 1) {
      setMethodList(methodList.filter((_, i) => i !== index))
    } else {
      setMethodList([{ id: generateId(6), value: '' }])
    }
  }

  const updateMethodStep = (index: number, value: string) => {
    const newList = [...methodList]
    newList[index] = { ...newList[index], value }
    setMethodList(newList)
    if (errors.method) setErrors({ ...errors, method: '' })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Recipe title is required'
    if (ingredientsList.every(i => !i.value.trim())) newErrors.ingredients = 'At least one ingredient is required'
    if (methodList.every(i => !i.value.trim())) newErrors.method = 'At least one method step is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    const recipeData = {
      title: formData.title,
      ingredients: ingredientsList.filter(i => i.value.trim()).map(i => `• ${i.value}`).join('\n'),
      method: methodList.filter(i => i.value.trim()).map(i => `• ${i.value}`).join('\n'),
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
            onMouseDown={(e) => e.preventDefault()}
            disabled={ingredientsList.length > 0 && !ingredientsList[ingredientsList.length - 1].value.trim()}
            className="text-brand-chocolate hover:opacity-60 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
          </button>
        </label>
        
        <Reorder.Group 
          as="div"
          axis="y" 
          values={ingredientsList} 
          onReorder={setIngredientsList}
          ref={ingredientsContainerRef}
          className={`w-full min-h-[160px] max-h-[200px] overflow-y-auto no-scrollbar py-2 bg-brand-cream/10 border ${errors.ingredients ? 'border-red-500 bg-red-50/10' : 'border-brand-chocolate/10'} rounded-md flex flex-col`}
        >
          {ingredientsList.map((ingredient, index) => (
            <Reorder.Item 
              value={ingredient} 
              key={ingredient.id} 
              className="flex items-center gap-2 group px-4 bg-transparent touch-none"
            >
              <div className="text-brand-chocolate/20 cursor-grab active:cursor-grabbing hover:text-brand-chocolate transition-colors py-1">
                <GripVertical size={16} />
              </div>
              <textarea
                rows={1}
                placeholder="Ingredient..."
                className="flex-1 py-1.5 bg-transparent border-none focus:outline-none text-sm resize-none overflow-hidden"
                value={ingredient.value}
                enterKeyHint="next"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addIngredient()
                  } else if (e.key === 'Backspace' && !ingredient.value && ingredientsList.length > 1) {
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
            </Reorder.Item>
          ))}
        </Reorder.Group>
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
            onMouseDown={(e) => e.preventDefault()}
            disabled={methodList.length > 0 && !methodList[methodList.length - 1].value.trim()}
            className="text-brand-chocolate hover:opacity-60 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
          </button>
        </label>
        
        <Reorder.Group 
          as="div"
          axis="y" 
          values={methodList} 
          onReorder={setMethodList}
          ref={methodContainerRef}
          className={`w-full min-h-[160px] max-h-[200px] overflow-y-auto no-scrollbar py-2 bg-brand-cream/10 border ${errors.method ? 'border-red-500 bg-red-50/10' : 'border-brand-chocolate/10'} rounded-md flex flex-col`}
        >
          {methodList.map((step, index) => (
            <Reorder.Item 
              value={step} 
              key={step.id} 
              className="flex items-center gap-2 group px-4 bg-transparent touch-none"
            >
              <div className="text-brand-chocolate/20 cursor-grab active:cursor-grabbing hover:text-brand-chocolate transition-colors py-1">
                <GripVertical size={16} />
              </div>
              <textarea
                rows={1}
                placeholder="Method step..."
                className="flex-1 py-1.5 bg-transparent border-none focus:outline-none text-sm resize-none overflow-hidden"
                value={step.value}
                enterKeyHint="next"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addMethodStep()
                  } else if (e.key === 'Backspace' && !step.value && methodList.length > 1) {
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
            </Reorder.Item>
          ))}
        </Reorder.Group>
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
            ingredientsList.filter(i => i.value.trim()).join('\n') === recipe.ingredients.split('\n').map(i => i.replace('• ', '')).filter(i => i.trim()).join('\n') &&
            methodList.filter(m => m.value.trim()).join('\n') === recipe.method.split('\n').map(m => m.replace('• ', '')).filter(m => m.trim()).join('\n')
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
