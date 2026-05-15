import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  image?: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  image,
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-3">
      {image ? (
        <img src={image} alt="Empty state" className="w-24 h-24 opacity-20 mb-2" />
      ) : Icon ? (
        <div className="w-20 h-20 bg-brand-chocolate/5 rounded-full flex items-center justify-center text-brand-chocolate/20 mb-2">
          <Icon size={40} />
        </div>
      ) : null}
      <p className="text-brand-chocolate/60 font-bold text-lg">{title}</p>
      <p className="text-brand-chocolate/40 text-sm max-w-[240px]">{description}</p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction} 
          className="btn-primary px-5 py-3 rounded-md text-sm mt-4 shadow-lg active:scale-95 transition-transform"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
