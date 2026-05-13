import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XCloseBtn } from '../atoms/XCloseBtn'
import { ArrowLeft } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  onBack?: () => void
  children: React.ReactNode
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  onBack,
  children 
}) => {
  // Lock body scroll when sheet is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      
      // Push a dummy state to history so the back button closes the sheet
      window.history.pushState({ sheetOpen: true }, '')

      const handlePopState = () => {
        // If we're going back, close the sheet
        onClose()
      }

      window.addEventListener('popstate', handlePopState)
      
      return () => {
        document.body.style.overflow = 'unset'
        window.removeEventListener('popstate', handlePopState)
        
        // If the sheet is closed via UI (not back button), we should still pop the state
        // but only if the state we pushed is still there. 
        // This is complex in React, but a simple check is:
        if (window.history.state?.sheetOpen) {
          // We don't want to call history.back() here because it might trigger handlePopState again
          // and we already called onClose(). 
          // Actually, the most robust way is to let handlePopState be the source of truth for back button
          // and for manual close, we handle it elsewhere.
        }
      }
    }
  }, [isOpen, onClose])

  // Manual close handler to ensure history is synced
  const handleManualClose = () => {
    if (window.history.state?.sheetOpen) {
      window.history.back()
    }
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleManualClose}
            className="fixed inset-0 bg-black/60 z-[60]"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-brand-surface dark:bg-brand-espresso rounded-t-[20px] z-[70] shadow-2xl will-change-transform"
            style={{ maxHeight: '90dvh', transform: 'translateZ(0)' }}
          >
            {/* Handle bar */}
            <div className="w-12 h-1 bg-brand-chocolate/10 rounded-full mx-auto mt-2 mb-1" />
            
            <div className="px-6 py-3 flex items-start justify-between border-b border-brand-chocolate/5">
              <div className="flex items-center gap-3">
                {onBack && (
                  <button 
                    onClick={onBack}
                    className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center bg-brand-chocolate/5 text-brand-chocolate hover:bg-brand-chocolate/10 transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-lg font-display">{title}</h2>
                  {subtitle && <p className="text-xs text-brand-chocolate/50">{subtitle}</p>}
                </div>
              </div>
              <XCloseBtn onClick={handleManualClose} size={18} />
            </div>
            
            <div className="px-6 pt-4 pb-0 overflow-y-auto overscroll-contain touch-auto" style={{ maxHeight: 'calc(90dvh - 80px)' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

