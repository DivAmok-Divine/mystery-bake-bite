import React, { useState } from 'react'
import { useOrders } from '../../orders/api/useOrders'
import { useCustomers } from '../../customers/api/useCustomers'
import { 
  TrendingUp, Users, ShoppingBag, Clock, 
  ChevronDown, Filter, Wallet
} from 'lucide-react'
import { format, isSameMonth, isSameDay, subDays, subMonths, isWithinInterval } from 'date-fns'
import { DateRangePicker, type DateRange } from '../../../shared/ui/molecules/DateRangePicker'
import { useClickOutside } from '../../../shared/lib/hooks'


export const ReportingDashboard: React.FC = () => {
  const { orders } = useOrders()
  const { customers } = useCustomers()
  
  const [timeFrame, setTimeFrame] = useState<'current' | 'last' | 'all' | 'custom'>('current')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [customRange, setCustomRange] = useState<DateRange>({ start: null, end: null })
  const dropdownRef = useClickOutside(() => setIsDropdownOpen(false))


  // Filter Logic
  const now = new Date()
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt)
    if (timeFrame === 'current') {
      return isSameMonth(orderDate, now)
    }
    if (timeFrame === 'last') {
      return isSameMonth(orderDate, subMonths(now, 1))
    }
    if (timeFrame === 'custom' && customRange.start && customRange.end) {
      return isWithinInterval(orderDate, { 
        start: customRange.start, 
        end: new Date(new Date(customRange.end).setHours(23, 59, 59)) 
      })
    }
    return true
  })

  const completedOrders = filteredOrders.filter(o => o.status === 'Completed')
  const pendingOrders = filteredOrders.filter(o => o.status === 'Pending')
  const totalSales = completedOrders.reduce((acc, o) => acc + o.amount, 0)
  const pendingSales = pendingOrders.reduce((acc, o) => acc + o.amount, 0)

  // Activity Pulse Logic (Last 7 Days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i)
    const count = orders.filter(o => {
      const orderDate = new Date(o.createdAt)
      return isSameDay(orderDate, d)
    }).length
    return { day: format(d, 'EEEEE'), count }
  })
  const maxCount = Math.max(...last7Days.map(d => d.count), 1)

  // Top Bites Logic
  const productCounts: Record<string, number> = {}
  filteredOrders.forEach(order => {
    const items = order.items.split(', ')
    items.forEach(item => {
      const parts = item.split(' x')
      const name = parts[0]
      const qty = parseInt(parts[1]) || 1
      if (name) {
        productCounts[name] = (productCounts[name] || 0) + qty
      }
    })
  })
  const topBites = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)

  // Top Buyers Logic (Calculated from filtered orders)
  const customerOrderCounts: Record<string, number> = {}
  filteredOrders.forEach(order => {
    if (order.customerName) {
      customerOrderCounts[order.customerName] = (customerOrderCounts[order.customerName] || 0) + 1
    }
  })

  const topBuyers = Object.entries(customerOrderCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)

  const stats = [
    { label: 'Total Sales', value: `GH₵ ${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Orders', value: filteredOrders.length, icon: ShoppingBag, color: 'text-brand-dough', bg: 'bg-brand-dough/10' },
    { label: 'New Customers', value: customers.length, icon: Users, color: 'text-feature-customers', bg: 'bg-feature-customers/10' },
    { label: 'Pending Sales', value: `GH₵ ${pendingSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-4 -mx-3 px-3 flex items-start justify-between border-b border-brand-chocolate/5">
        <div>
          <h1 className="text-3xl font-display">Insights</h1>
          <p className="text-brand-chocolate/40 text-sm">
            {timeFrame === 'custom' && customRange.start && customRange.end 
              ? `${format(customRange.start, 'MMM d')} - ${format(customRange.end, 'MMM d')}`
              : timeFrame === 'custom' ? 'Select date range' : (timeFrame === 'current' ? 'This month' : timeFrame === 'last' ? 'Last month' : 'All time')}
          </p>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-brand-surface border border-brand-chocolate/10 rounded-md px-4 py-2 text-xs font-bold text-brand-chocolate shadow-sm"
          >
            <Filter size={14} className="text-brand-chocolate/40" />
            Filter
            <ChevronDown size={14} className={isDropdownOpen ? 'rotate-180' : ''} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-brand-surface border border-brand-chocolate/10 rounded-md shadow-2xl z-[60] overflow-hidden">
              {(['current', 'last', 'all', 'custom'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setTimeFrame(opt); setIsDropdownOpen(false) }}
                  className={`w-full text-left px-4 py-3 text-xs font-medium border-b border-brand-chocolate/5 last:border-0 hover:bg-brand-dough/10 ${timeFrame === opt ? 'bg-brand-dough/20' : ''}`}
                >
                  {opt === 'current' ? 'This month' : opt === 'last' ? 'Last month' : opt === 'all' ? 'All time' : 'Custom range'}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {timeFrame === 'custom' && (
        <DateRangePicker
          value={customRange}
          onChange={setCustomRange}
          onClose={() => setTimeFrame('all')}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card relative overflow-hidden flex flex-col gap-1 py-6 px-5 group">
            {/* Watermark Icon - Tilted Right */}
            <div className={`absolute -bottom-4 -right-4 opacity-[0.06] ${stat.color} transform rotate-12 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-[20deg] duration-500`}>
              {stat.label.includes('Sales') ? <Wallet size={84} /> : <stat.icon size={84} />}
            </div>

            <div className="relative z-10">
              <p className="text-sm font-bold text-brand-chocolate/40 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-brand-chocolate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card flex flex-col gap-4">
        <h3 className="text-sm tracking-tight text-brand-chocolate/40 font-bold">Activity pulse</h3>
        <div className="flex items-end justify-between h-32 gap-3 pt-4 border-b border-brand-chocolate/5">
          {last7Days.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full bg-brand-chocolate/10 rounded-t-lg transition-all hover:bg-brand-dough relative group min-h-[2px]" 
                style={{ height: `${(h.count / maxCount) * 100}%` }}
              >
                {h.count > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-chocolate text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    {h.count} {h.count === 1 ? 'order' : 'orders'}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-brand-chocolate/50 mb-[-12px]">{h.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-sm tracking-tight text-brand-chocolate/40 font-bold">Top bites leaderboard</h3>
        <div className="flex flex-col gap-3">
          {topBites.length > 0 ? topBites.map(([name, count], i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-brand-surface border border-brand-chocolate/5 rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-brand-dough/10 text-brand-chocolate flex items-center justify-center font-display text-lg">
                {i === 0 ? '👑' : i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-chocolate">{name}</p>
                <p className="text-[11px] font-bold text-brand-chocolate/40">{count} sold</p>
              </div>
              <div className="h-1.5 w-16 bg-brand-chocolate/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-dough rounded-full" 
                  style={{ width: `${(count / (topBites[0][1] || 1)) * 100}%` }} 
                />
              </div>
            </div>
          )) : (
            <div className="p-10 text-center bg-brand-chocolate/5 rounded-md border border-dashed border-brand-chocolate/10">
              <p className="text-xs font-bold text-brand-chocolate/40 italic">No sales data yet for this period</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-sm tracking-tight text-brand-chocolate/40 font-bold">Top buyers leaderboard</h3>
        <div className="flex flex-col gap-3">
          {topBuyers.length > 0 ? topBuyers.map((customer, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-brand-surface border border-brand-chocolate/5 rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-brand-dough/10 text-brand-chocolate flex items-center justify-center font-display text-lg">
                {i === 0 ? '🏆' : i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-chocolate">{customer.name}</p>
                <p className="text-[11px] font-bold text-brand-chocolate/40">{customer.count} orders</p>
              </div>
              <div className="h-1.5 w-16 bg-brand-chocolate/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-chocolate/40 rounded-full" 
                  style={{ width: `${(customer.count / (topBuyers[0].count || 1)) * 100}%` }} 
                />
              </div>
            </div>
          )) : (
            <div className="p-10 text-center bg-brand-chocolate/5 rounded-md border border-dashed border-brand-chocolate/10">
              <p className="text-xs font-bold text-brand-chocolate/40 italic">No customer data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
