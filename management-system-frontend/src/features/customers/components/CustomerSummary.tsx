import React from 'react'
import { Users, UserCheck, UserX, Crown, ShoppingBag, Calendar, Info } from 'lucide-react'

import type { Customer } from '@backend/lib/db'

import { 
  getCustomerStatusCounts,
  getNewestCustomer,
  calculateCustomerRetentionRate,
  calculateAverageCustomerOrders,
  findTopCustomer
} from '@shared/utils/front-end-calculations/customerGeneralAnalytics'
import { formatNumber, formatPercentage } from '@shared/utils/front-end-calculations/formatters'

interface CustomerSummaryProps {
  customers: Customer[]
  onViewCustomer: (customer: Customer) => void
}

export const CustomerSummary: React.FC<CustomerSummaryProps> = ({ customers, onViewCustomer }) => {
  const { active: activeCustomers, inactive: inactiveCustomers } = getCustomerStatusCounts(customers)
  
  const avgOrders = calculateAverageCustomerOrders(customers)
  const topCustomer = findTopCustomer(customers)

  const newestCustomer = getNewestCustomer(customers)
  const retentionRate = calculateCustomerRetentionRate(customers)

  const customerStats = [
    { label: 'Total', value: customers.length, icon: Users, color: 'text-brand-chocolate', bg: 'bg-brand-chocolate/5' },
    { label: 'Active', value: activeCustomers, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Inactive', value: inactiveCustomers, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  return (
    <div className="flex flex-col gap-5 pt-2 pb-6">
      {/* Hero Card: Total Customers */}
      <div className="p-6 rounded-md bg-brand-chocolate text-white shadow-xl flex flex-col items-center gap-2 relative overflow-hidden text-center">
        {/* Background Watermark */}
        <div className="absolute -right-10 -bottom-10 opacity-10 transform rotate-12">
          <Users size={160} />
        </div>
        
        <span className="text-xs font-bold tracking-widest opacity-60">Total Customers</span>
        
        <h2 className="text-4xl font-display leading-none text-white">
          {customers.length} <span className="text-lg opacity-40">Lovers</span>
        </h2>

        <p className="text-[10px] opacity-40 font-medium">People who enjoy your bites</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Left Column: Status */}
        <div className="flex flex-col gap-2 h-full">
          <p className="text-sm font-bold text-brand-chocolate/40 px-0.5">Status</p>
          {customerStats.map((stat, idx) => (
            <div 
              key={idx}
              className="flex flex-1 items-center justify-between px-2.5 py-2 rounded-md border border-brand-chocolate/5 bg-white shadow-sm group relative"
            >
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-md ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon size={14} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-brand-chocolate/70">{stat.label}</span>
                  {(stat.label === 'Active' || stat.label === 'Inactive') && (
                    <div className="relative group/tooltip">
                      <div className="text-brand-chocolate/40 cursor-help transition-all hover:text-brand-chocolate group-hover/tooltip:scale-110">
                        <Info size={14} strokeWidth={2.5} /> 
                      </div>


                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-[#3D261C] text-white text-[10px] rounded-lg shadow-2xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all transform scale-95 group-hover/tooltip:scale-100 z-50 text-center leading-relaxed">
                        <p className="font-bold mb-1 underline decoration-white/20 underline-offset-2">
                          {stat.label} Customer
                        </p>
                        {stat.label === 'Active' 
                          ? "Any customer who has placed at least one order within the last 30 days." 
                          : "Any customer who hasn't placed an order in more than 30 days."
                        }
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#3D261C]" />
                      </div>
                    </div>
                  )}
                </div>

              </div>
              <span className={`text-base font-display ${stat.color}`}>{stat.value}</span>
            </div>
          ))}

        </div>

        {/* Right Column: Insights */}
        <div className="flex flex-col gap-2 h-full">
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
            className="flex flex-1 items-center justify-between px-2.5 py-2 rounded-md border border-brand-chocolate/5 bg-white shadow-sm hover:bg-brand-chocolate/5 transition-colors active:scale-95"
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
          <div className="flex flex-1 items-center justify-between px-2.5 py-2 rounded-md border border-brand-chocolate/5 bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={14} />
              </div>
              <span className="text-xs font-medium text-brand-chocolate/70">Avg orders</span>
            </div>
            <span className="text-base font-display text-violet-600">{formatNumber(avgOrders, 1)}</span>
          </div>
        </div>
      </div>

      {/* Footer: Retention Bar */}
      <div className="p-3.5 rounded-md bg-brand-chocolate text-white">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-sm opacity-80">
            <span>Customer Retention Rate</span>
            <span className="font-display">
              {formatPercentage(retentionRate)}
            </span>
          </div>
          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-500" 
              style={{ width: `${retentionRate}%` }}
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
