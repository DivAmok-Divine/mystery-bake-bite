import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface DropDownOption {
  value: string;
  label: string;
}

interface DropDownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropDownOption[];
  placeholder?: string;
  disabled?: boolean;
  direction?: 'up' | 'down';
}

export const DropDown: React.FC<DropDownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  direction = 'down'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 h-[46px] bg-brand-chocolate/5 border border-brand-chocolate/10 rounded-md text-sm font-bold focus:outline-none focus:ring-1 focus:ring-brand-chocolate flex items-center justify-between transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-chocolate/10 cursor-pointer'} ${!selectedOption ? 'text-brand-chocolate/40' : 'text-brand-chocolate'}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-brand-chocolate/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className={`absolute left-0 right-0 ${direction === 'up' ? 'bottom-full mb-1.5 animate-in fade-in slide-in-from-bottom-2' : 'top-full mt-1.5 animate-in fade-in slide-in-from-top-2'} bg-white border border-brand-chocolate/10 rounded-md shadow-xl overflow-hidden z-50 duration-200 max-h-60 overflow-y-auto`}>
          {options.length === 0 ? (
            <div className="p-4 text-xs text-center text-brand-chocolate/40 italic font-bold">
              No options available
            </div>
          ) : (
            options.map(option => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center justify-between transition-colors ${
                    isSelected 
                      ? 'bg-brand-chocolate/5 text-brand-chocolate' 
                      : 'text-brand-chocolate/60 hover:bg-brand-chocolate/5 hover:text-brand-chocolate'
                  }`}
                >
                  <span className="truncate pr-4">{option.label}</span>
                  {isSelected && <Check size={14} className="text-brand-chocolate flex-shrink-0" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
