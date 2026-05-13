import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, addMonths, subMonths, startOfMonth,
  endOfMonth, startOfWeek, endOfWeek,
  isSameMonth, isSameDay, addDays
} from 'date-fns'
import { XCloseBtn } from '../atoms/XCloseBtn'

interface CalendarProps {
  title?: string
  value: string         // ISO date string
  onChange: (iso: string) => void
  onClose: () => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const Calendar: React.FC<CalendarProps> = ({
  title = 'Select Date',
  value,
  onChange,
  onClose,
}) => {
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  )

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
              h-12 w-full flex items-center justify-center text-sm rounded-md
              transition-all relative
              ${!isThisMonth ? 'opacity-20' : ''}
              ${isSelected
                ? 'bg-brand-chocolate text-white font-bold shadow-lg scale-110 z-10'
                : 'hover:bg-brand-dough/30 text-brand-chocolate/80'}
            `}
          >
            {format(day, 'd')}
            {isTodayDate && !isSelected && (
              <div className="absolute inset-0 border-2 border-brand-chocolate/20 rounded-md m-1 pointer-events-none" />
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-brand-surface rounded-md shadow-2xl p-6 animate-in zoom-in-95 fade-in duration-200">

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
          <span className="text-md font-bold text-brand-chocolate">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-brand-dough/10 rounded-md transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-sm font-bold text-center opacity-40">
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
