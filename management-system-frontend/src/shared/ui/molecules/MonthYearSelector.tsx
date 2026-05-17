import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { setMonth, setYear, getYear, getMonth } from 'date-fns'

export interface MonthYearSelectorProps {
  isOpen: boolean
  onClose: () => void
  currentMonth: Date
  onChangeMonth: (newMonth: Date) => void
  topOffsetClassName?: string // e.g., "top-[120px]" or "top-[130px]"
}

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export const MonthYearSelector: React.FC<MonthYearSelectorProps> = ({
  isOpen,
  onClose,
  currentMonth,
  onChangeMonth,
  topOffsetClassName = 'top-[120px]'
}) => {
  const selectorRef = useRef<HTMLDivElement>(null)
  const monthScrollRef = useRef<HTMLDivElement>(null)
  const yearScrollRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside the selector to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Auto-scroll to selected month/year when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const activeMonth = monthScrollRef.current?.querySelector('[data-active="true"]')
        const activeYear = yearScrollRef.current?.querySelector('[data-active="true"]')
        
        activeMonth?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        activeYear?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, 50)
    }
  }, [isOpen])

  const currentYear = getYear(currentMonth)
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={selectorRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className={`absolute ${topOffsetClassName} inset-x-0 mx-auto bg-brand-surface border border-brand-chocolate/10 rounded-md shadow-2xl z-[100] p-3 flex flex-col gap-3 w-[210px]`}
        >
          <div className="flex gap-2">
            {/* Months Column */}
            <div className="flex-1 flex flex-col min-w-0">
              <p className="text-[11px] font-bold text-brand-chocolate/30 tracking-widest mb-2 px-2">Month</p>
              <div 
                ref={monthScrollRef}
                className="max-h-[180px] overflow-y-auto no-scrollbar flex flex-col gap-1"
              >
                {MONTHS.map((m, idx) => {
                  const isActive = getMonth(currentMonth) === idx
                  return (
                    <button
                      key={m}
                      type="button"
                      data-active={isActive}
                      onClick={() => {
                        onChangeMonth(setMonth(currentMonth, idx))
                        onClose()
                      }}
                      className={`text-left px-2 py-1.5 rounded text-xs font-bold transition-colors ${isActive ? 'bg-brand-dough text-brand-chocolate' : 'text-brand-chocolate/60 hover:bg-brand-chocolate/5'}`}
                    >
                      {m}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Years Column */}
            <div className="flex-1 flex flex-col min-w-0 border-l border-brand-chocolate/5 pl-3">
              <p className="text-[11px] font-bold text-brand-chocolate/30 tracking-widest mb-2 px-2">Year</p>
              <div 
                ref={yearScrollRef}
                className="max-h-[180px] overflow-y-auto no-scrollbar flex flex-col gap-1"
              >
                {years.map((y) => {
                  const isActive = currentYear === y
                  return (
                    <button
                      key={y}
                      type="button"
                      data-active={isActive}
                      onClick={() => {
                        onChangeMonth(setYear(currentMonth, y))
                        onClose()
                      }}
                      className={`text-left px-2 py-1.5 rounded text-xs font-bold transition-colors ${isActive ? 'bg-brand-dough text-brand-chocolate' : 'text-brand-chocolate/60 hover:bg-brand-chocolate/5'}`}
                    >
                      {y}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Today Button Footer */}
          <div className="pt-2 border-t border-brand-chocolate/5">
            <button
              type="button"
              onClick={() => {
                onChangeMonth(new Date())
                onClose()
              }}
              className="w-full py-2 rounded-md bg-brand-chocolate/5 text-brand-chocolate font-bold text-xs hover:bg-brand-chocolate/10 transition-colors"
            >
              Go to Today
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
