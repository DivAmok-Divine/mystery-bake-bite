import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import {
  format, addMonths, subMonths, startOfMonth,
  endOfMonth, startOfWeek, endOfWeek,
  isSameMonth, isSameDay, addDays
} from 'date-fns'
import { XCloseBtn } from '../../atoms/XCloseBtn'
import { MonthYearSelector, DAYS } from './MonthYearSelector'

interface CalendarProps {
  title?: string
  value: string         // ISO date string
  onChange: (iso: string) => void
  onClose: () => void
}

export const Calendar: React.FC<CalendarProps> = ({
  title = 'Select Date',
  value,
  onChange,
  onClose,
}) => {
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  )
  const [showSelector, setShowSelector] = useState(false)

  const handleSelectDay = (day: Date) => {
    const d = new Date(day)
    d.setHours(12, 0, 0, 0)
    onChange(d.toISOString())
    onClose()
  }

  const handleToday = () => {
    const t = new Date()
    t.setHours(12, 0, 0, 0)
    onChange(t.toISOString())
    onClose()
  }

  const renderGrid = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd  = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate   = endOfWeek(monthEnd)
    const today     = new Date()

    const rows: React.ReactNode[] = []
    let cells: React.ReactNode[] = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay  = day
        const isSelected  = value ? isSameDay(day, new Date(value)) : false
        const isTodayDate = isSameDay(day, today)
        const isThisMonth = isSameMonth(day, monthStart)

        cells.push(
          <button
            key={day.toString()}
            type="button"
            onClick={() => handleSelectDay(currentDay)}
            className={`
              h-8 w-full flex items-center justify-center text-[10px]
              rounded-md transition-all relative
              ${!isThisMonth ? 'opacity-20' : ''}
              ${isSelected
                ? 'bg-brand-dough text-brand-chocolate font-bold z-10'
                : isTodayDate
                  ? 'bg-brand-chocolate text-white font-bold'
                  : 'text-brand-chocolate/80'}
              hover:bg-brand-chocolate/5
            `}
          >
            {format(day, 'd')}
            {isTodayDate && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-chocolate z-20" />
            )}
          </button>
        )
        day = addDays(day, 1)
      }

      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {cells}
        </div>
      )
      cells = []
    }

    return rows
  }


  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-6 pb-20">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-brand-surface rounded-md shadow-2xl p-6 animate-in slide-in-from-bottom-12 fade-in duration-300">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-display text-brand-chocolate">{title}</h3>
          <XCloseBtn onClick={onClose} />
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-brand-dough/10 rounded-md transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button
            type="button"
            onClick={() => setShowSelector(!showSelector)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-brand-chocolate/5 rounded-md transition-colors group"
          >
            <span className="text-md font-bold text-brand-chocolate">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <ChevronDown size={14} className={`text-brand-chocolate/40 group-hover:text-brand-chocolate transition-transform ${showSelector ? 'rotate-180' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-brand-dough/10 rounded-md transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Quick Month/Year Selector Popup */}
        <MonthYearSelector
          isOpen={showSelector}
          onClose={() => setShowSelector(false)}
          currentMonth={currentMonth}
          onChangeMonth={setCurrentMonth}
          topOffsetClassName="top-[130px]"
        />

        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-[11px] font-bold text-center text-brand-chocolate/40">
              {d}
            </div>
          ))}
        </div>

        {/* Day Grid */}
        <div className="flex flex-col gap-1">
          {renderGrid()}
        </div>

        {/* Today shortcut */}
        <button
          type="button"
          onClick={handleToday}
          className="btn-primary w-full mt-8 py-3 text-sm rounded-md"
        >
          Today
        </button>
      </div>
    </div>
  )
}
