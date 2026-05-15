import React from 'react'
import { Utensils, Clock, Info } from 'lucide-react'
import type { Recipe } from '@backend/lib/db'

interface RecipeDetailsProps {
  recipe: Recipe
}

export const RecipeDetails: React.FC<RecipeDetailsProps> = ({ recipe }) => {
  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center gap-2 text-xs font-bold text-brand-chocolate/30 border-b border-brand-chocolate/5 pb-4">
        <Clock size={12} />
        <span>Created: {new Date(recipe.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-bold tracking-[0.2em] text-feature-recipes flex items-center gap-2">
          <Utensils size={14} /> Ingredients
        </h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-brand-cream/5 border border-brand-chocolate/5 rounded-md p-4">
          {recipe.ingredients.split('\n').map((line, i) => (
            <div key={i} className="text-sm text-brand-chocolate/80 leading-relaxed pl-2 border-l-2 border-brand-chocolate/10 min-w-0 break-words">
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-bold tracking-[0.2em] text-feature-recipes flex items-center gap-2">
          <Clock size={14} /> Method
        </h4>
        <div className="flex flex-col gap-4">
          {recipe.method.split('\n').map((line, i) => (
            <div key={i} className="flex gap-4 group">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-chocolate/5 flex items-center justify-center text-[10px] font-bold text-brand-chocolate">
                {i + 1}
              </span>
              <p className="text-sm text-brand-chocolate/80 leading-relaxed pt-0.5">
                {line.replace('• ', '')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {recipe.notes && (
        <div className="flex flex-col gap-3 p-4 bg-brand-dough/10 rounded-md border border-brand-dough/20">
          <h4 className="text-xs font-bold tracking-widest text-brand-dough flex items-center gap-1.5">
            <Info size={12} /> Baker's Notes
          </h4>
          <p className="text-sm italic text-brand-chocolate/70 leading-relaxed">
            "{recipe.notes}"
          </p>
        </div>
      )}
    </div>
  )
}
