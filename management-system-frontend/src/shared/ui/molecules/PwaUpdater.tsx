import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const PwaUpdater = () => {
  const [isUpdating, setIsUpdating] = useState(false)
  const {
    needRefresh: [needRefresh], // We no longer need setNeedRefresh since it's forced
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // 1. Check for updates aggressively every 1 minute
        setInterval(() => {
          r.update()
        }, 60 * 1000)

        // 2. Check for updates instantly whenever the user switches back to this tab
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            r.update()
          }
        })

        // 3. For aggressive caching on iPhones / mobile Safari where tabs freeze
        window.addEventListener('focus', () => r.update())
        window.addEventListener('online', () => r.update())
      }
    },
  })

  return (
    <AnimatePresence>
      {needRefresh && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-brand-chocolate/60 backdrop-blur-md px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-brand-cream border border-brand-chocolate/20 shadow-2xl rounded-2xl p-6 w-full max-w-sm flex flex-col gap-6 text-center"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-brand-chocolate/10 flex items-center justify-center text-brand-chocolate mb-2">
                <RefreshCw size={32} className={isUpdating ? 'animate-spin' : ''} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-brand-chocolate font-display tracking-wide mb-2">
                  Update Required ✨
                </h4>
                <p className="text-sm text-brand-chocolate/80 leading-relaxed px-2">
                  A new version of Mystery Bake Bite is ready. You must update now to continue using the application and get the latest features.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsUpdating(true)
                updateServiceWorker(true)
              }}
              disabled={isUpdating}
              className="w-full flex items-center justify-center gap-2 bg-brand-chocolate text-brand-dough py-3.5 rounded-xl text-base font-bold hover:bg-brand-chocolate/90 transition-all active:scale-[0.98] shadow-lg disabled:opacity-80 disabled:cursor-wait"
            >
              <RefreshCw size={18} className={isUpdating ? 'animate-spin' : ''} />
              {isUpdating ? 'Installing Update...' : 'Update Now'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

