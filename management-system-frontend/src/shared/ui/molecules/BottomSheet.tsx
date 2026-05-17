import React from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { XCloseBtn } from '../atoms/XCloseBtn'
import { ArrowLeft } from 'lucide-react'
import { ConfirmModal } from './ConfirmModal'
import { useNotification } from './Notification'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  onBack?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  children: React.ReactNode
  animationKey?: string | number
  disableSwipe?: boolean
  hasUnsavedChanges?: boolean
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  onBack,
  onSwipeLeft,
  onSwipeRight,
  children,
  animationKey,
  disableSwipe = false,
  hasUnsavedChanges = false
}) => {
  const { notify } = useNotification()
  const dragControls = useDragControls()
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false)

  // Reset discard confirm state when bottom sheet is opened/closed
  React.useEffect(() => {
    if (!isOpen) {
      setShowDiscardConfirm(false)
    }
  }, [isOpen])

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

  // Manual close handler
  const handleManualClose = () => {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true)
    } else {
      onClose()
    }
  }

  // Native swipe detection logic
  const [slideDirection, setSlideDirection] = React.useState(1)
  const touchStartX = React.useRef(0)
  const touchEndX = React.useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disableSwipe) {
      touchStartX.current = 0
      return
    }
    const target = e.target as HTMLElement
    // Ignore swipe gestures inside form tags, input elements, buttons, textareas, sliders or selects
    if (target.closest('input, textarea, select, button, a, [role="button"], form, .no-swipe')) {
      touchStartX.current = 0
      return
    }
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disableSwipe || touchStartX.current === 0) return
    touchEndX.current = e.changedTouches[0].clientX
    const swipeDistance = touchStartX.current - touchEndX.current
    const swipeThreshold = 50 // Minimum distance for a swipe

    if (swipeDistance > swipeThreshold) {
      setSlideDirection(1)
      if (onSwipeLeft) onSwipeLeft() // Swiped left
    } else if (swipeDistance < -swipeThreshold) {
      setSlideDirection(-1)
      if (onSwipeRight) onSwipeRight() // Swiped right
    }
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
            onClick={(e) => {
              e.stopPropagation()
              handleManualClose()
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="fixed inset-0 bg-black/60 z-[100]"
          />
          
          {/* Sheet */}
          <motion.div
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 1000 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                handleManualClose()
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              duration: 0.2,
              ease: "easeOut"
            }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-brand-surface dark:bg-brand-espresso rounded-t-[20px] z-[110] shadow-2xl will-change-transform"
            style={{ maxHeight: '92dvh' }}
          >



            {/* Handle bar area - made larger for easier touch */}
            <div 
              className="pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 bg-brand-chocolate/10 rounded-full mx-auto" />
            </div>
            
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
            
            <div 
              className="px-6 pt-4 pb-0 overflow-y-auto overscroll-contain touch-auto overflow-x-hidden" 
              style={{ maxHeight: 'calc(90dvh - 80px)' }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={animationKey || 'default'}
                  custom={slideDirection}
                  initial={{ x: 15 * slideDirection, opacity: 0 }}
                  animate={{ x: 0, opacity: 1, transition: { duration: 0.15, ease: "easeOut" } }}
                  exit={{ x: -15 * slideDirection, opacity: 0, transition: { duration: 0.1, ease: "easeIn" } }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          <ConfirmModal
            isOpen={showDiscardConfirm}
            onClose={() => setShowDiscardConfirm(false)}
            onConfirm={() => {
              setShowDiscardConfirm(false)
              notify({
                type: 'delete',
                title: 'Changes Discarded',
                message: 'Your unsaved modifications were discarded.'
              })
              onClose()
            }}
            title="Discard Changes?"
            message="Are you sure you want to discard your unsaved changes? Any entered data will be lost."
            confirmText="Yes, Discard"
            cancelText="Keep Editing"
            isDestructive={true}
            watermarkType="cancel"
          />
        </>
      )}
    </AnimatePresence>
  )
}

