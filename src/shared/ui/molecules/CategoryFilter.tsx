import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CategoryFilterProps {
  options: string[]
  activeOptions: string[]
  onToggle: (option: string) => void
  getCount: (option: string) => number
  show?: boolean
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  options, 
  activeOptions, 
  onToggle, 
  getCount,
  show = true
}) => {
  if (!show) return null

  return (
    <div className="flex items-center gap-3 h-10">
      <div 
        className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 h-full py-1.5 overflow-y-visible touch-pan-x"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {options.map(option => (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={`px-4 h-full rounded-md text-[10px] font-bold whitespace-nowrap transition-all flex items-center justify-center flex-shrink-0 snap-start min-w-[72px] relative ${
              activeOptions.includes(option) 
                ? "bg-brand-chocolate text-white shadow-md" 
                : "bg-brand-chocolate/5 text-brand-chocolate/60 hover:bg-brand-chocolate/10"
            }`}
          >
            {option}
            {/* Floating Count Badge - Only shows when active */}
            {activeOptions.includes(option) && (
              <span className="absolute -top-1.5 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border-2 leading-none pt-[0.5px] bg-brand-dough text-brand-chocolate border-brand-chocolate animate-in zoom-in duration-200">
                {getCount(option)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

interface FilterToggleProps {
  isOpen: boolean
  onClick: () => void
  title?: string
}

export const FilterToggle: React.FC<FilterToggleProps> = ({ isOpen, onClick, title }) => {
  return (
    <button
      onClick={onClick}
      className={`w-11 h-[46px] rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
        isOpen 
          ? 'bg-brand-chocolate text-white shadow-md' 
          : 'bg-brand-chocolate/5 text-brand-chocolate border border-brand-chocolate/10'
      }`}
      title={title || (isOpen ? "Hide Filters" : "Show Filters")}
    >
      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </button>
  )
}
