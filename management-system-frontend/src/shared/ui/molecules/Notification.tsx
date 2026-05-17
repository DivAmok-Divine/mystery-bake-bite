import React, { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export type NotificationType = 'add' | 'update' | 'delete' | 'error' | 'info'

export interface NotificationItem {
  id: string
  type: NotificationType
  title?: string
  message: string
  duration?: number
}

interface NotificationContextType {
  notify: (options: Omit<NotificationItem, 'id'>) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const notify = useCallback(({ type, title, message, duration = 3500 }: Omit<NotificationItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newNotification: NotificationItem = { id, type, title, message, duration }
    setNotifications((prev) => [...prev, newNotification])

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }, [removeNotification])

  // Custom styling and gradients for different premium variants
  const getNotificationConfig = (type: NotificationType) => {
    switch (type) {
      case 'add':
        return {
          gradient: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-800',
          defaultTitle: 'Added',
          accentBar: 'bg-emerald-500'
        }
      case 'update':
        return {
          gradient: 'from-blue-500/10 to-indigo-500/5 border-blue-500/20 text-blue-800',
          defaultTitle: 'Updated',
          accentBar: 'bg-blue-500'
        }
      case 'delete':
        return {
          gradient: 'from-amber-500/10 to-orange-500/5 border-amber-500/20 text-amber-800',
          defaultTitle: 'Removed',
          accentBar: 'bg-amber-500'
        }
      case 'error':
        return {
          gradient: 'from-rose-500/10 to-red-500/5 border-rose-500/20 text-rose-800',
          defaultTitle: 'Error',
          accentBar: 'bg-rose-500'
        }
      case 'info':
      default:
        return {
          gradient: 'from-brand-chocolate/10 to-brand-dough/5 border-brand-chocolate/10 text-brand-chocolate',
          defaultTitle: 'Notice',
          accentBar: 'bg-brand-chocolate'
        }
    }
  }

  return (
    <NotificationContext.Provider value={{ notify, removeNotification }}>
      {children}
      
      {/* Toast Notification Portal/Overlay Container */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 flex flex-col-reverse gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((item) => {
            const config = getNotificationConfig(item.type)
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`w-full pointer-events-auto relative overflow-hidden bg-white/95 backdrop-blur-md rounded-md border py-2.5 px-4 flex items-center justify-between gap-3 bg-gradient-to-br ${config.gradient}`}
              >
                {/* Visual Left Accent Highlight bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accentBar}`} />

                <div className="flex-1 min-w-0 flex flex-col gap-0.5 pl-1">
                  <span className="text-xs font-bold font-display tracking-wider leading-none opacity-60">
                    {item.title || config.defaultTitle}
                  </span>
                  <span className="text-xs font-semibold truncate leading-tight">
                    {item.message}
                  </span>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => removeNotification(item.id)}
                  className="p-0.5 rounded text-brand-chocolate/40 hover:text-brand-chocolate/80 hover:bg-brand-chocolate/5 active:scale-90 transition-all shrink-0"
                >
                  <X size={12} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}
