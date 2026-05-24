import React, { useState } from 'react'
import { useAuth } from '../api/AuthContext'
import { Lock, Eye, EyeOff, Key, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNotification } from '@shared/ui/molecules/Notification'

export const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const { notify } = useNotification()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUsernameFocused, setIsUsernameFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedUsername = username.trim()
    if (!trimmedUsername) {
      notify({
        type: 'error',
        message: 'Please enter your username or email.'
      })
      return
    }

    if (!password.trim()) {
      notify({
        type: 'error',
        message: 'Please enter your password.'
      })
      return
    }

    setIsSubmitting(true)

    // Simulate warm bakery loader
    setTimeout(async () => {
      try {
        const success = await login(trimmedUsername, password)
        if (success) {
          setIsSubmitting(false)
          return
        }
        
        notify({
          type: 'error',
          title: 'Access denied',
          message: 'Incorrect username or password. Try again!'
        })
      } catch (err: any) {
        notify({
          type: 'error',
          title: 'Access restricted',
          message: err.message || 'An error occurred during login.'
        })
      } finally {
        setIsSubmitting(false)
      }
    }, 600)
  }

  return (
    <div className="h-screen w-screen bg-brand-cream/40 flex items-center justify-center p-4 fixed inset-0 overflow-hidden select-none">
      {/* Dynamic Bakery Decorative Backdrops */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-brand-dough/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] bg-brand-chocolate/5 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white border border-brand-chocolate/10 shadow-2xl rounded-md p-6 md:p-8 relative z-10 backdrop-blur-md"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-3xl font-display text-brand-chocolate flex items-center gap-1.5 justify-center tracking-tight">
            MysteryBakeBite
          </h1>
          <p className="text-xs text-brand-chocolate/50 font-bold tracking-wider mt-1">
            Bakery management suite
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Username / Email Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brand-chocolate/40 tracking-wider px-1">
              Username or email
            </label>
            <div className="relative">
              <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isUsernameFocused || username ? 'text-brand-chocolate' : 'text-brand-chocolate/40'}`}>
                <User size={15} strokeWidth={isUsernameFocused || username ? 2.5 : 2} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setIsUsernameFocused(true)}
                onBlur={() => setIsUsernameFocused(false)}
                placeholder="Enter username or email"
                className="w-full pl-10 pr-4 py-3 bg-brand-chocolate/5 border border-brand-chocolate/10 rounded-md text-sm text-brand-chocolate placeholder-brand-chocolate/30 focus:outline-none focus:border-brand-chocolate"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-bold text-brand-chocolate/40 tracking-wider px-1 flex items-center justify-between">
              <span>Password</span>
            </label>
            <div className="relative">
              <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isPasswordFocused || password ? 'text-brand-chocolate' : 'text-brand-chocolate/40'}`}>
                <Lock size={15} strokeWidth={isPasswordFocused || password ? 2.5 : 2} />
              </span>
              
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                placeholder="Enter account password"
                className="w-full pl-10 pr-12 py-3 bg-brand-chocolate/5 border border-brand-chocolate/10 rounded-md text-sm text-brand-chocolate placeholder-brand-chocolate/30 focus:outline-none focus:border-brand-chocolate"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-chocolate/40 hover:text-brand-chocolate transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Access Grant Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-brand-chocolate text-white font-bold rounded-md text-sm shadow-xl shadow-brand-chocolate/15 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 hover:bg-brand-chocolate/95"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-md animate-spin" />
            ) : (
              <>
                <Key size={14} />
                Login
              </>
            )}
          </button>
        </form>

      </motion.div>
    </div>
  )
}
