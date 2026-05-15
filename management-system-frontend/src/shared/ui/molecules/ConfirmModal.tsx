import React, { type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Yes, Delete",
  cancelText = "Cancel",
  isDestructive = true
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 pb-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-brand-chocolate/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-brand-surface rounded-md shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* Subtle Watermark */}
        {isDestructive && (
          <div className="absolute top-1/2 left-[65%] -translate-x-1/2 -translate-y-1/2 rotate-12 text-red-500 opacity-[0.03] pointer-events-none z-0">
            <Trash2 size={180} />
          </div>
        )}

        <div className="relative z-10 p-6 text-center">
          <h2 className="text-lg font-bold text-brand-chocolate mb-2">{title}</h2>
          <p className="text-sm text-brand-chocolate/60 leading-tight">{message}</p>
        </div>
        
        <div className="relative z-10 flex border-t border-brand-chocolate/5 bg-white/40 backdrop-blur-sm">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-sm font-bold text-brand-chocolate/60 active:bg-brand-cream/50 transition-colors"
          >
            {cancelText}
          </button>
          <div className="w-[1px] bg-brand-chocolate/5" />
          <button 
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              isDestructive 
                ? 'bg-red-500/10 text-red-600 active:bg-red-500/20' 
                : 'bg-emerald-600/10 text-emerald-700 active:bg-emerald-600/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
