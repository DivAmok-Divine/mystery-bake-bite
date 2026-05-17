import React, { type ReactNode, useState, useEffect } from 'react'
import { Trash2, XCircle, CheckCircle2, Save } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  watermarkType?: 'delete' | 'cancel' | 'complete' | 'update' | 'none'
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Yes, Delete",
  cancelText = "Cancel",
  isDestructive = true,
  watermarkType
}) => {
  const [isSaving, setIsSaving] = useState(false)

  // Reset loading state whenever the modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setIsSaving(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Determine active watermark type based on props
  const activeWatermark = watermarkType || (isDestructive ? 'delete' : 'none')

  // Generate a premium present continuous loading text based on confirmation verb
  const getSavingText = () => {
    const text = confirmText.toLowerCase()
    if (text.includes('delete')) return 'Deleting'
    if (text.includes('update')) return 'Updating'
    if (text.includes('create')) return 'Creating'
    if (text.includes('save')) return 'Saving'
    if (text.includes('add')) return 'Adding'
    if (text.includes('restock')) return 'Restocking'
    return 'Processing'
  }

  const handleConfirmClick = async () => {
    if (isSaving) return
    setIsSaving(true)
    
    // Call the original onConfirm inside a micro-task so it runs immediately
    // in the background, updating state/databases and showing skeleton at the back
    onConfirm()
    
    // Let the wiggling dots animate beautifully for 1200ms
    await new Promise(resolve => setTimeout(resolve, 1200))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 pb-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-brand-chocolate/40 backdrop-blur-sm" onClick={isSaving ? undefined : onClose} />
      
      <div className="relative w-full max-w-sm bg-brand-surface rounded-md shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* Subtle Watermark */}
        {activeWatermark === 'delete' && (
          <div className="absolute top-1/2 left-[65%] -translate-x-1/2 -translate-y-1/2 rotate-12 text-red-500 opacity-[0.03] pointer-events-none z-0">
            <Trash2 size={180} />
          </div>
        )}
        {activeWatermark === 'cancel' && (
          <div className="absolute top-1/2 left-[65%] -translate-x-1/2 -translate-y-1/2 rotate-12 text-red-500 opacity-[0.03] pointer-events-none z-0">
            <XCircle size={180} />
          </div>
        )}
        {activeWatermark === 'complete' && (
          <div className="absolute top-1/2 left-[65%] -translate-x-1/2 -translate-y-1/2 rotate-12 text-emerald-500 opacity-[0.03] pointer-events-none z-0">
            <CheckCircle2 size={180} />
          </div>
        )}
        {activeWatermark === 'update' && (
          <div className="absolute top-1/2 left-[65%] -translate-x-1/2 -translate-y-1/2 rotate-12 text-brand-dough opacity-[0.06] pointer-events-none z-0">
            <Save size={180} />
          </div>
        )}

        <div className="relative z-10 p-6 text-center">
          <h2 className="text-lg font-bold text-brand-chocolate mb-2">{title}</h2>
          <p className="text-sm text-brand-chocolate/60 leading-tight">{message}</p>
        </div>
        
        <div className="relative z-10 flex border-t border-brand-chocolate/5 bg-white/40 backdrop-blur-sm">
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-4 text-sm font-bold text-brand-chocolate/60 active:bg-brand-cream/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <div className="w-[1px] bg-brand-chocolate/5" />
          <button 
            onClick={handleConfirmClick}
            disabled={isSaving}
            className={`flex-1 py-4 text-sm font-bold transition-colors disabled:cursor-not-allowed ${
              isDestructive 
                ? 'bg-red-500/10 text-red-600 active:bg-red-500/20' 
                : 'bg-emerald-600/10 text-emerald-700 active:bg-emerald-600/20'
            }`}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-1">
                {getSavingText()}
                <span className="inline-flex gap-[2px] items-end pb-[2px] ml-0.5">
                  <span className="inline-block w-[4px] h-[4px] bg-current rounded-full animate-dot-1"></span>
                  <span className="inline-block w-[4px] h-[4px] bg-current rounded-full animate-dot-2"></span>
                  <span className="inline-block w-[4px] h-[4px] bg-current rounded-full animate-dot-3"></span>
                </span>
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
