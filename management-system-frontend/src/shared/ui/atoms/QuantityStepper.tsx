import React from 'react'
import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  value: number
  onChange: (newValue: number) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  size?: 'sm' | 'md'
  className?: string
  isDecimal?: boolean
  disabled?: boolean
  disableIncrement?: boolean
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  placeholder = '0',
  size = 'md',
  className = '',
  isDecimal = false,
  disabled = false,
  disableIncrement = false
}) => {
  const isSm = size === 'sm'

  const handleDecrement = () => {
    if (disabled) return
    const nextVal = value - step
    if (nextVal >= min) {
      onChange(Number(nextVal.toFixed(isDecimal ? 2 : 0)))
    }
  }

  const handleIncrement = () => {
    if (disabled) return
    const nextVal = value + step
    if (nextVal <= max) {
      onChange(Number(nextVal.toFixed(isDecimal ? 2 : 0)))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const valStr = e.target.value
    if (valStr === '') {
      onChange(0)
      return
    }
    const parsed = isDecimal ? parseFloat(valStr) : parseInt(valStr, 10)
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed))
      onChange(Number(clamped.toFixed(isDecimal ? 2 : 0)))
    }
  }

  return (
    <div 
      className={`flex items-center gap-1 bg-brand-surface border border-brand-chocolate/10 rounded-md ${isSm ? 'p-0.5' : 'p-1'} ${className}`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={`flex items-center justify-center rounded transition-all shrink-0 disabled:opacity-20 disabled:cursor-not-allowed ${
          isSm ? 'w-6 h-6' : 'w-8 h-full'
        } ${
          disableIncrement 
            ? 'bg-brand-chocolate text-white active:scale-90' 
            : 'text-brand-chocolate bg-brand-chocolate/5 hover:bg-brand-chocolate/10 transition-colors'
        }`}
      >
        <Minus size={isSm ? 12 : 14} />
      </button>
      
      <input
        type="number"
        step={step}
        disabled={disabled}
        value={value === 0 ? '' : value}
        onChange={handleInputChange}
        className={`text-center font-bold text-brand-chocolate bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
          isSm ? 'w-8 text-xs' : 'flex-1 w-full min-w-[24px] text-sm'
        }`}
        placeholder={placeholder}
      />
      
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max || disableIncrement}
        className={`flex items-center justify-center bg-brand-chocolate text-white rounded transition-transform active:scale-90 shrink-0 disabled:opacity-20 disabled:cursor-not-allowed ${
          isSm ? 'w-6 h-6' : 'w-8 h-full'
        } ${disableIncrement ? 'opacity-30 cursor-not-allowed bg-brand-chocolate/20 text-brand-chocolate/50' : ''}`}
      >
        <Plus size={isSm ? 12 : 14} />
      </button>
    </div>
  )
}
