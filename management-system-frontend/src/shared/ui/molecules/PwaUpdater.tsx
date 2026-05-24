
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const PwaUpdater = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every hour in the background
      if (r) {
        setInterval(() => {
          r.update()
        }, 60 * 60 * 1000)
      }
    },
  })

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[9999] bg-white/95 backdrop-blur-md border border-brand-chocolate/20 shadow-xl rounded-lg p-4 max-w-sm flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-brand-chocolate font-display tracking-wide mb-1">Update Available ✨</h4>
              <p className="text-xs text-brand-chocolate/80 leading-relaxed">
                A new version of Mystery Bake Bite is ready. Update now to get the latest features and bug fixes!
              </p>
            </div>
            <button 
              onClick={() => setNeedRefresh(false)} 
              className="text-brand-chocolate/50 hover:text-brand-chocolate transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
          <button
            onClick={() => updateServiceWorker(true)}
            className="w-full flex items-center justify-center gap-2 bg-brand-chocolate text-brand-dough py-2 rounded-md text-sm font-semibold hover:bg-brand-chocolate/90 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw size={14} />
            Update Now
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
