import React, { useState, useRef, useEffect } from 'react'
import { Filter, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export type DateRange = {
  start: Date | null
  end: Date | null
}

interface DatePresetFilterProps {
  dateRange: DateRange
  timeView: 'Today' | 'All'
  onSelectRange: (range: DateRange) => void
  onSelectTimeView: (view: 'Today' | 'All') => void
  onCustomRangeClick: () => void
}

export const DatePresetFilter: React.FC<DatePresetFilterProps> = ({
  dateRange,
  timeView,
  onSelectRange,
  onSelectTimeView,
  onCustomRangeClick
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkIsThisMonth = () => {
    if (!dateRange.start || !dateRange.end) return false
    const now = new Date()
    return dateRange.start.getTime() === startOfMonth(now).getTime() && 
           dateRange.end.getTime() === endOfMonth(now).getTime()
  }

  const checkIsLastMonth = () => {
    if (!dateRange.start || !dateRange.end) return false
    const lastMonth = subMonths(new Date(), 1)
    return dateRange.start.getTime() === startOfMonth(lastMonth).getTime() && 
           dateRange.end.getTime() === endOfMonth(lastMonth).getTime()
  }

  const isAllTime = !dateRange.start && timeView === 'All'
  const isTodayActive = !dateRange.start && timeView === 'Today'
  const isThisMonthActive = checkIsThisMonth()
  const isLastMonthActive = checkIsLastMonth()
  const isCustomRangeActive = !!dateRange.start && !isThisMonthActive && !isLastMonthActive

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-brand-surface border border-brand-chocolate/10 rounded-md shadow-sm text-brand-chocolate active:scale-95 transition-transform"
      >
        <Filter size={14} className="text-brand-chocolate/40" />
        <span className="text-xs font-bold">Filter</span>
        <ChevronDown size={14} className={`text-brand-chocolate transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-48 bg-brand-surface border border-brand-chocolate/10 z-50 rounded-md shadow-xl overflow-hidden"
          >
            <div className="flex flex-col">
              <button
                onClick={() => {
                  onSelectRange({ start: null, end: null })
                  onSelectTimeView('Today')
                  setIsOpen(false)
                }}
                className={`px-4 py-3 text-left text-sm font-medium transition-colors border-b border-brand-chocolate/5 ${
                  isTodayActive ? 'bg-brand-dough/20' : 'hover:bg-brand-chocolate/5'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => {
                  const now = new Date()
                  onSelectRange({ start: startOfMonth(now), end: endOfMonth(now) })
                  onSelectTimeView('All')
                  setIsOpen(false)
                }}
                className={`px-4 py-3 text-left text-sm font-medium transition-colors border-b border-brand-chocolate/5 ${
                  isThisMonthActive ? 'bg-brand-dough/20' : 'hover:bg-brand-chocolate/5'
                }`}
              >
                This month
              </button>
              <button
                onClick={() => {
                  const lastMonth = subMonths(new Date(), 1)
                  onSelectRange({ start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) })
                  onSelectTimeView('All')
                  setIsOpen(false)
                }}
                className={`px-4 py-3 text-left text-sm font-medium transition-colors border-b border-brand-chocolate/5 ${
                  isLastMonthActive ? 'bg-brand-dough/20' : 'hover:bg-brand-chocolate/5'
                }`}
              >
                Last month
              </button>
              <button
                onClick={() => {
                  onSelectRange({ start: null, end: null })
                  onSelectTimeView('All')
                  setIsOpen(false)
                }}
                className={`px-4 py-3 text-left text-sm font-medium transition-colors border-b border-brand-chocolate/5 ${
                  isAllTime ? 'bg-brand-dough/20' : 'hover:bg-brand-chocolate/5'
                }`}
              >
                All time
              </button>
              <button
                onClick={() => {
                  onCustomRangeClick()
                  setIsOpen(false)
                }}
                className={`px-4 py-3 text-left text-sm font-medium transition-colors ${
                  isCustomRangeActive ? 'bg-brand-dough/20' : 'hover:bg-brand-chocolate/5'
                }`}
              >
                Custom range
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
