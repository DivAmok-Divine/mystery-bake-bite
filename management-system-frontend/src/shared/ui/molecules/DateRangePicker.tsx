import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
import {
  format, addMonths, subMonths, startOfMonth,
  endOfMonth, startOfWeek, endOfWeek,
  isSameMonth, isSameDay, addDays, isWithinInterval
} from 'date-fns'
import { XCloseBtn } from '../atoms/XCloseBtn'
import { MonthYearSelector, DAYS } from './MonthYearSelector'

export interface DateRange {
  start: Date | null
  end: Date | null
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  onClose: () => void
  confirmLabel?: string
  onConfirm?: () => void
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  onClose,
  confirmLabel,
  onConfirm
}) => {
  const [currentMonth, setCurrentMonth] = useState(
    value.start ?? new Date()
  )
  const [showSelector, setShowSelector] = useState(false)

  const handleDayClick = (day: Date) => {
    if (!value.start || (value.start && value.end)) {
      onChange({ start: day, end: null })
    } else {
      if (day < value.start) {
        onChange({ start: day, end: value.start })
      } else {
        onChange({ ...value, end: day })
      }
    }
  }

  const renderGrid = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd   = endOfMonth(monthStart)
    const startDate  = startOfWeek(monthStart)
    const endDate    = endOfWeek(monthEnd)
    const today      = new Date()

    const rows: React.ReactNode[] = []
    let cells: React.ReactNode[] = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day
        const isSelected =
          (value.start && isSameDay(day, value.start)) ||
          (value.end   && isSameDay(day, value.end))
        const isInRange =
          value.start && value.end &&
          isWithinInterval(day, { start: value.start, end: value.end })
        const isTodayDate = isSameDay(day, today)
        const isThisMonth = isSameMonth(day, monthStart)

        cells.push(
          <button
            key={day.toString()}
            type="button"
            onClick={() => handleDayClick(currentDay)}
            className={`
              h-8 w-full flex items-center justify-center text-[10px]
              rounded-md transition-all relative
              ${!isThisMonth ? 'opacity-20' : ''}
              ${isSelected
                ? 'bg-brand-dough text-brand-chocolate font-bold z-10'
                : isInRange
                  ? 'bg-brand-dough/20 text-brand-chocolate'
                  : isTodayDate
                    ? 'bg-brand-chocolate text-white font-bold'
                    : 'text-brand-chocolate/80'}
              hover:bg-brand-chocolate/5
            `}
          >
            {format(day, 'd')}
            {isTodayDate && (
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-chocolate" />
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

    return <div className="flex flex-col gap-1">{rows}</div>
  }


  return (
    <div className="card bg-brand-surface border border-brand-chocolate/10 p-4 animate-in zoom-in-95 relative overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-brand-chocolate/40 flex items-center gap-2">
          <CalendarIcon size={12} /> Date Range Picker
        </h4>
        <XCloseBtn onClick={onClose} size={14} />
      </div>

      {/* Calendar Container */}
      <div className="bg-brand-cream/10 rounded-md p-3 relative">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-brand-chocolate/5 rounded-full transition-colors"
          >
            <ChevronLeft size={20} className="text-brand-chocolate" />
          </button>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSelector(!showSelector)}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-brand-chocolate/5 rounded-md transition-colors group"
            >
              <span className="text-sm font-bold text-brand-chocolate">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <ChevronDown size={14} className={`text-brand-chocolate/40 group-hover:text-brand-chocolate transition-transform ${showSelector ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-brand-chocolate/5 rounded-full transition-colors"
          >
            <ChevronRight size={20} className="text-brand-chocolate" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-[11px] font-bold text-center text-brand-chocolate/40">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        {renderGrid()}
      </div>

      {/* Range summary + reset */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex-1 text-xs font-bold text-brand-chocolate/40">
          {value.start ? format(value.start, 'MMM d, yyyy') : 'Start'}
          {' → '}
          {value.end ? format(value.end, 'MMM d, yyyy') : 'To'}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onChange({ start: null, end: null })}
            className="text-xs font-bold underline text-brand-chocolate/40 hover:text-brand-chocolate"
          >
            Reset
          </button>
          {confirmLabel && onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className="text-xs font-bold underline text-brand-chocolate/40 hover:text-brand-chocolate"
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
      {/* Quick Month/Year Selector Popup (Centered to the whole card) */}
      <MonthYearSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        currentMonth={currentMonth}
        onChangeMonth={setCurrentMonth}
        topOffsetClassName="top-[120px]"
      />
    </div>
  )
}
