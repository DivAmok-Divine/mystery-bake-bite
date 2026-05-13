import React from 'react'
import { Users, UserCheck, UserX, Crown, ShoppingBag, Calendar } from 'lucide-react'
import type { Customer } from '../../../shared/lib/db'

interface CustomerSummaryProps {
  customers: Customer[]
  onViewCustomer: (customer: Customer) => void
}

export const CustomerSummary: React.FC<CustomerSummaryProps> = ({ customers, onViewCustomer }) => {
  const activeCustomers = customers.filter(c => c.status === 'Active').length
  const inactiveCustomers = customers.filter(c => c.status === 'Inactive').length
  
  const totalOrdersAcrossAll = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)
  const avgOrders = customers.length > 0 ? (totalOrdersAcrossAll / customers.length).toFixed(1) : '0'

  const topCustomer = customers.length > 0
    ? [...customers].sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))[0]
    : null

  const newestCustomer = customers.length > 0
    ? [...customers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null

  const customerStats = [
    { label: 'Total', value: customers.length, icon: Users, color: 'text-brand-chocolate', bg: 'bg-brand-chocolate/5' },
    { label: 'Active', value: activeCustomers, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Inactive', value: inactiveCustomers, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  return (
    <div className="flex flex-col gap-5 pt-2 pb-6">
      {/* Hero Card: Total Customers */}
      <div className="p-5 rounded-md border border-brand-chocolate/10 bg-brand-chocolate/5 shadow-sm flex flex-col items-center gap-1.5">
        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-brand-chocolate shadow-sm">
          <Users size={22} />
        </div>
        <span className="text-sm font-medium text-brand-chocolate/60 tracking-wider">Total Customers</span>
        <span className="text-4xl font-display text-brand-chocolate">{customers.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Left Column: Status */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-brand-chocolate/40 px-0.5">Status</p>
          {customerStats.map((stat, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between px-2.5 py-2 rounded-md border border-brand-chocolate/5 bg-white shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-md ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon size={14} />
                </div>
                <span className="text-xs font-medium text-brand-chocolate/70">{stat.label}</span>
              </div>
              <span className={`text-base font-display ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Right Column: Insights */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-brand-chocolate/40 px-0.5">Insights</p>
          
          {/* Top Customer Card */}
          <button
            onClick={() => topCustomer && onViewCustomer(topCustomer)}
            className="px-2.5 py-2 rounded-md border border-amber-200 bg-amber-50 shadow-sm flex flex-col items-center text-center hover:bg-amber-100 transition-colors active:scale-95"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Crown size={11} className="text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600">Top Customer</span>
            </div>
            <p className="text-xs font-display text-brand-chocolate truncate w-full">
              {topCustomer ? topCustomer.name : '—'}
            </p>
            {topCustomer && (
              <p className="text-[10px] text-brand-chocolate/50">{topCustomer.totalOrders} orders</p>
            )}
          </button>

          {/* Newest Customer Card */}
          <button
            onClick={() => newestCustomer && onViewCustomer(newestCustomer)}
            className="flex items-center justify-between px-2.5 py-2 rounded-md border border-brand-chocolate/5 bg-white shadow-sm hover:bg-brand-chocolate/5 transition-colors active:scale-95"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Calendar size={14} />
              </div>
              <span className="text-xs font-medium text-brand-chocolate/70">Newest</span>
            </div>
            <span className="text-xs font-display text-blue-600 truncate max-w-[60px]">
              {newestCustomer ? newestCustomer.name.split(' ')[0] : 'None'}
            </span>
          </button>

          {/* Avg Orders Stat */}
          <div className="flex items-center justify-between px-2.5 py-2 rounded-md border border-brand-chocolate/5 bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={14} />
              </div>
              <span className="text-xs font-medium text-brand-chocolate/70">Avg orders</span>
            </div>
            <span className="text-base font-display text-violet-600">{avgOrders}</span>
          </div>
        </div>
      </div>

      {/* Footer: Retention Bar */}
      <div className="p-3.5 rounded-md bg-brand-chocolate text-white">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-sm opacity-80">
            <span>Customer Retention Rate</span>
            <span className="font-display">
              {customers.length > 0 ? ((activeCustomers / customers.length) * 100).toFixed(0) : '0'}%
            </span>
          </div>
          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-500" 
              style={{ width: `${customers.length > 0 ? (activeCustomers / customers.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] opacity-60 text-center">
            {activeCustomers} out of {customers.length} customers are currently active
          </p>
        </div>
      </div>
    </div>
  )
}
