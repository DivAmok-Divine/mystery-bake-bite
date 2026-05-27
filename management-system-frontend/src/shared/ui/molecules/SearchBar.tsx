import React, { useState } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onFocus?: () => void
  onBlur?: () => void
  className?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  placeholder = "Search...",
  onFocus,
  onBlur,
  className = ""
}) => {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <Search 
        className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${isFocused || value ? 'text-brand-chocolate' : 'text-brand-chocolate/40'}`} 
        size={18} 
        strokeWidth={isFocused || value ? 2.5 : 2}
      />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-10 pr-10 h-[46px] bg-brand-surface border border-brand-chocolate/10 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-dough/50 text-sm font-medium placeholder:text-brand-chocolate/30"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setIsFocused(true)
          if (onFocus) onFocus()
        }}
        onBlur={() => {
          setIsFocused(false)
          if (onBlur) onBlur()
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-chocolate/40 hover:text-brand-chocolate transition-colors p-0.5"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
