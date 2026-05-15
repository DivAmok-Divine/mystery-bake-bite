import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, Package } from 'lucide-react'

interface SplashScreenProps {
  onComplete: () => void
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true)

  const handleEnter = () => {
    setIsVisible(false)
    // Call onComplete after the fade-out duration (0.8s)
    setTimeout(onComplete, 800)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-brand-cream flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Decorative Elements */}
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "backOut" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-brand-dough/20 rounded-full blur-3xl animate-pulse" />
            <div className="w-40 h-40 flex items-center justify-center relative z-10">
              <img 
                src="/logo-clean.png" 
                alt="MBB Logo" 
                className="w-full h-full object-contain mix-blend-multiply" 
              />
            </div>
            
            {/* Floating Icons */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-2 -right-2 text-brand-dough"
            >
              <Cookie size={32} strokeWidth={1.5} />
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-2 -left-2 text-brand-chocolate/20"
            >
              <Package size={24} strokeWidth={1.5} />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-12 text-center"
          >
            <h1 className="text-4xl font-display text-brand-chocolate tracking-tight">
              MysteryBakeBite
            </h1>
            <p className="mt-2 text-brand-chocolate/40 font-bold tracking-[0.2em] text-xs">
              Freshly Baked Management
            </p>

            <div className="mt-8 space-y-1">
              <h2 className="text-xl font-display text-brand-chocolate">Welcome back, Prof. Ella</h2>
              <p className="text-xs font-bold text-brand-chocolate/40 tracking-widest">CEO & Master Baker</p>
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-12"
          >
            <button 
              onClick={handleEnter}
              className="px-10 py-4 bg-brand-chocolate text-white rounded-md font-bold text-sm shadow-xl shadow-brand-chocolate/20 active:scale-95 transition-all"
            >
              Thank U
            </button>
          </motion.div>

          {/* Loading Indicator (Restored) */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 200 }}
            transition={{ delay: 0.2, duration: 2, ease: "linear" }}
            className="absolute bottom-20 h-1 bg-brand-chocolate/10 rounded-full overflow-hidden"
          >
            <motion.div 
              className="h-full bg-brand-chocolate"
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 2, ease: "linear" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}



