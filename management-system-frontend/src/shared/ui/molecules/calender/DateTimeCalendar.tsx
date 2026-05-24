import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react'
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

export const DateTimeCalendar: React.FC<CalendarProps> = ({
  title = 'Select Date & Time',
  value,
  onChange,
  onClose,
}) => {
  // Parse initial date-time value or fallback to now
  const initialDate = value ? new Date(value) : new Date()
  
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate)
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate)
  const [showSelector, setShowSelector] = useState(false)
  
  const [selectedHour, setSelectedHour] = useState(initialDate.getHours())
  const [selectedMinute, setSelectedMinute] = useState(initialDate.getMinutes())
  
  // Custom screen/tab state to avoid native select menu triggers
  const [activeTab, setActiveTab] = useState<'date' | 'hour' | 'minute'>('date')

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day)
  }

  const handleConfirm = () => {
    const finalDate = new Date(selectedDate)
    finalDate.setHours(selectedHour, selectedMinute, 0, 0)
    onChange(finalDate.toISOString())
    onClose()
  }

  // Quick preset for "Today at current time"
  const handleToday = () => {
    const now = new Date()
    setSelectedDate(now)
    setCurrentMonth(now)
    setSelectedHour(now.getHours())
    setSelectedMinute(now.getMinutes())
    setActiveTab('date')
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
        const isSelected  = isSameDay(day, selectedDate)
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

  // Combined selected date for display
  const combinedDate = new Date(selectedDate)
  combinedDate.setHours(selectedHour, selectedMinute, 0, 0)

  // Custom Hour Grid render (24 Hours)
  const renderHourSelector = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    return (
      <div className="grid grid-cols-4 gap-2 h-[200px] p-2 overflow-y-auto no-scrollbar bg-brand-chocolate/[0.02] border border-brand-chocolate/5 rounded-md">
        {hours.map(h => {
          const isSelected = selectedHour === h
          return (
            <button
              key={h}
              type="button"
              onClick={() => {
                setSelectedHour(h)
                setActiveTab('date')
              }}
              className={`h-11 rounded-md text-xs font-bold transition-all flex items-center justify-center ${
                isSelected
                  ? 'bg-brand-dough text-brand-chocolate shadow-sm scale-95'
                  : 'bg-white hover:bg-brand-chocolate/5 border border-brand-chocolate/5 text-brand-chocolate/80'
              }`}
            >
              {String(h).padStart(2, '0')}:00
            </button>
          )
        })}
      </div>
    )
  }

  // Custom Minute Grid render (60 Minutes)
  const renderMinuteSelector = () => {
    const minutes = Array.from({ length: 60 }, (_, i) => i)
    return (
      <div className="grid grid-cols-5 gap-1.5 h-[200px] p-2 overflow-y-auto no-scrollbar bg-brand-chocolate/[0.02] border border-brand-chocolate/5 rounded-md">
        {minutes.map(m => {
          const isSelected = selectedMinute === m
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                setSelectedMinute(m)
                setActiveTab('date')
              }}
              className={`h-9 rounded-md text-xs font-bold transition-all flex items-center justify-center ${
                isSelected
                  ? 'bg-brand-dough text-brand-chocolate shadow-sm scale-95'
                  : 'bg-white hover:bg-brand-chocolate/5 border border-brand-chocolate/5 text-brand-chocolate/80'
              }`}
            >
              :{String(m).padStart(2, '0')}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-6 pb-20 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-brand-surface rounded-md shadow-2xl p-6 animate-in slide-in-from-bottom-12 duration-200">

        {/* Custom Header with Back Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {activeTab !== 'date' && (
              <button 
                type="button"
                onClick={() => setActiveTab('date')}
                className="p-1 hover:bg-brand-chocolate/5 rounded-full transition-colors"
              >
                <ChevronLeft size={20} className="text-brand-chocolate/60" />
              </button>
            )}
            <h3 className="text-lg font-display text-brand-chocolate">
              {activeTab === 'date' ? title : activeTab === 'hour' ? 'Select Hour' : 'Select Minute'}
            </h3>
          </div>
          <XCloseBtn onClick={onClose} />
        </div>

        {/* Tab 1: Date Selection */}
        {activeTab === 'date' && (
          <>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3">
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
              topOffsetClassName="top-[115px]"
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

            {/* Premium Custom Time Picker Buttons */}
            <div className="mt-4 pt-4 border-t border-brand-chocolate/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-brand-chocolate/40" />
                <span className="text-xs font-bold text-brand-chocolate/70">Time</span>
              </div>
              
              <div className="flex items-center gap-1 bg-brand-chocolate/[0.03] border border-brand-chocolate/5 rounded-md px-1 py-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('hour')}
                  className="px-3 py-1 bg-white hover:bg-brand-chocolate/5 border border-brand-chocolate/5 text-sm font-bold text-brand-chocolate rounded transition-colors shadow-sm"
                >
                  {String(selectedHour).padStart(2, '0')}
                </button>
                <span className="text-sm font-bold text-brand-chocolate/40">:</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('minute')}
                  className="px-3 py-1 bg-white hover:bg-brand-chocolate/5 border border-brand-chocolate/5 text-sm font-bold text-brand-chocolate rounded transition-colors shadow-sm"
                >
                  {String(selectedMinute).padStart(2, '0')}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Custom Hour Grid */}
        {activeTab === 'hour' && renderHourSelector()}

        {/* Tab 3: Custom Minute Grid */}
        {activeTab === 'minute' && renderMinuteSelector()}

        {/* Selection Summary */}
        <div className="mt-4 text-center">
          <span className="inline-block px-3 py-1 bg-brand-dough/15 text-brand-chocolate/85 rounded-md text-xs font-medium">
            {format(combinedDate, 'EEE, MMM d, yyyy')} at {format(combinedDate, 'hh:mm a')}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="btn-secondary flex-1 py-3 text-xs rounded-md"
          >
            Today
          </button>
          <button
            type="button"
            disabled={activeTab !== 'date'}
            onClick={handleConfirm}
            className="btn-primary flex-[2] py-3 text-xs rounded-md bg-brand-chocolate hover:bg-brand-chocolate/90 text-white disabled:opacity-55 disabled:cursor-not-allowed"
          >
            Confirm Date & Time
          </button>
        </div>
      </div>
    </div>
  )
}
