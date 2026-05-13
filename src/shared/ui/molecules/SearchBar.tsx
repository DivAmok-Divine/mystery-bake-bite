import React from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-chocolate/40 pointer-events-none" size={18} />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 bg-brand-surface border border-brand-chocolate/10 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-dough/50 text-sm font-medium placeholder:text-brand-chocolate/30"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
