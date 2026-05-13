import React from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface XCloseBtnProps {
  onClick: () => void
  className?: string
  size?: number
}

export const XCloseBtn: React.FC<XCloseBtnProps> = ({ onClick, className, size = 18 }) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-8 h-8 rounded-md bg-brand-chocolate/5 flex items-center justify-center text-brand-chocolate hover:bg-brand-chocolate/10 active:scale-90 transition-all",
        className
      )}
    >
      <X size={size} />
    </button>
  )
}
