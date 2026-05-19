import React, { useState, useEffect } from 'react'
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

  // Automatically dismiss splash screen after 2.2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleEnter()
    }, 2200)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          onClick={handleEnter}
          className="fixed inset-0 z-[9999] bg-brand-cream flex flex-col items-center justify-center overflow-hidden cursor-pointer"
          title="Click to skip"
        >
          {/* Centered Logo Element */}
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "backOut" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-brand-dough/20 rounded-full blur-3xl animate-pulse" />
            <div className="w-48 h-48 flex items-center justify-center relative z-10">
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}



