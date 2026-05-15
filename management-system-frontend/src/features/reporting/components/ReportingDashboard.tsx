import React, { useState } from 'react'
import { useOrders } from '../../orders/api/useOrders'
import { useCustomers } from '../../customers/api/useCustomers'
import { 
  TrendingUp, Users, ShoppingBag, Clock, 
  Wallet
} from 'lucide-react'
import { DatePresetFilter, type DateRange } from '@shared/ui/molecules/DatePresetFilter'
import { DateRangePicker } from '@shared/ui/molecules/DateRangePicker'
import { useTopBuyers } from '@shared/utils/front-end-calculations/topCustomerAnalytics'
import { calculateTotalRevenue, getPopularProducts } from '@shared/utils/front-end-calculations/orderAnalytics'
import { formatCurrency } from '@shared/utils/front-end-calculations/formatters'
import { format } from 'date-fns'
import { 
  filterOrdersByTimeframe, 
  filterCustomersByTimeframe, 
  calculateActivityPulse 
} from '@shared/utils/front-end-calculations/reportingAnalytics'

export const ReportingDashboard: React.FC = () => {
  const { orders, isLoading: ordersLoading } = useOrders()
  const { customers, isLoading: customersLoading } = useCustomers()
  
  const [timeView, setTimeView] = useState<'Today' | 'All'>('All')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null })

  // Filter Logic using centralized utilities
  const filteredOrders = filterOrdersByTimeframe(orders, timeView, dateRange)
  const filteredCustomers = filterCustomersByTimeframe(customers, timeView, dateRange)

  const completedOrders = filteredOrders.filter(o => o.status === 'Completed')
  const pendingOrders = filteredOrders.filter(o => o.status === 'Pending')
  const totalSales = calculateTotalRevenue(completedOrders)
  const pendingSales = calculateTotalRevenue(pendingOrders)

  // Activity Pulse Logic using centralized utility
  const { last7Days, maxCount } = calculateActivityPulse(filteredOrders)

  // Top Bite Logic
  const topBites = getPopularProducts(filteredOrders, 4)

  // Top Buyers Logic (Calculated from filtered orders)
  const topBuyers = useTopBuyers(filteredOrders, customers, 4)

  const stats = [
    { label: 'Total Sales', value: formatCurrency(totalSales), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Orders', value: filteredOrders.length, icon: ShoppingBag, color: 'text-brand-dough', bg: 'bg-brand-dough/10' },
    { label: 'New Customers', value: filteredCustomers.length, icon: Users, color: 'text-feature-customers', bg: 'bg-feature-customers/10' },
    { label: 'Pending Sales', value: formatCurrency(pendingSales), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  if (ordersLoading || customersLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4">
        <div className="h-20 bg-brand-chocolate/5 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-brand-chocolate/5 rounded-xl" />)}
        </div>
        <div className="h-64 bg-brand-chocolate/5 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-4 -mx-3 px-3 flex items-start justify-between border-b border-brand-chocolate/5">
        <div>
          <h1 className="text-3xl font-display">Insights</h1>
          <p className="text-brand-chocolate/40 text-sm">
            {timeView === 'Today' ? 'Today' : dateRange.start && dateRange.end 
              ? `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')}`
              : dateRange.start ? `Since ${format(dateRange.start, 'MMM d')}` : 'All time records'}
          </p>
        </div>

        <DatePresetFilter 
          dateRange={dateRange}
          timeView={timeView}
          onSelectRange={(range) => {
            setDateRange(range)
            setShowDatePicker(false)
          }}
          onSelectTimeView={(view) => {
            setTimeView(view)
            setShowDatePicker(false)
          }}
          onCustomRangeClick={() => {
            setDateRange({ start: null, end: null })
            setShowDatePicker(true)
          }}
        />
      </header>

      {showDatePicker && (
        <DateRangePicker
          value={dateRange}
          onChange={(range) => {
            setDateRange(range)
            if (range.start) setTimeView('All')
          }}
          onClose={() => setShowDatePicker(false)}
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
          {topBuyers.length > 0 ? topBuyers.map((tb, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-brand-surface border border-brand-chocolate/5 rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-brand-dough/10 text-brand-chocolate flex items-center justify-center font-display text-lg">
                {i === 0 ? '🏆' : i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-chocolate">{tb.customer.name}</p>
                <p className="text-[11px] font-bold text-brand-chocolate/40">{tb.count} orders</p>
              </div>
              <div className="h-1.5 w-16 bg-brand-chocolate/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-chocolate/40 rounded-full" 
                  style={{ width: `${(tb.count / (topBuyers[0].count || 1)) * 100}%` }} 
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
