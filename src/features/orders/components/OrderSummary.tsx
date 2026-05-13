import React from 'react'
import { ShoppingBag, TrendingUp, Clock, CheckCircle2, XCircle, Users, UserCheck, UserX, Crown, Star } from 'lucide-react'
import type { Order } from '../../../shared/lib/db'
import { useCustomers } from '../../customers/api/useCustomers'

interface OrderSummaryProps {
  orders: Order[]
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ orders }) => {
  const { customers } = useCustomers()

  const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0)
  const statusCounts = {
    Pending: orders.filter(o => o.status === 'Pending').length,
    Completed: orders.filter(o => o.status === 'Completed').length,
    Cancelled: orders.filter(o => o.status === 'Cancelled').length,
  }

  // Top buyer by totalOrders field
  const topBuyer = customers.length > 0
    ? customers.reduce((prev, curr) => (curr.totalOrders > prev.totalOrders ? curr : prev), customers[0])
    : null

  const activeCustomers = customers.filter(c => c.status === 'Active').length
  const inactiveCustomers = customers.filter(c => c.status === 'Inactive').length

  // Product Intelligence
  const allItems = orders.flatMap(o => o.items.split(',').map(i => i.trim()))
  
  const productCounts = allItems.reduce((acc, item) => {
    if (item) acc[item] = (acc[item] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topProduct = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)[0]
    ?.[0] || null

  const topProductCount = topProduct ? productCounts[topProduct] : 0

  const orderMetrics = [
    { label: 'Total', value: orders.length, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending', value: statusCounts.Pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Done', value: statusCounts.Completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Cancelled', value: statusCounts.Cancelled, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  const customerMetrics = [
    { label: 'Total', value: customers.length, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Active', value: activeCustomers, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Inactive', value: inactiveCustomers, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  return (
    <div className="flex flex-col gap-5 pt-2 pb-4">

      {/* Primary Revenue Card */}
      <div className="p-5 rounded-md border border-brand-chocolate/10 bg-brand-chocolate/5 shadow-sm flex flex-col items-center gap-1.5">
        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-brand-chocolate shadow-sm">
          <TrendingUp size={22} />
        </div>
        <span className="text-sm font-medium text-brand-chocolate/60 tracking-wider">Total Revenue</span>
        <span className="text-4xl font-display text-brand-chocolate">GH₵ {totalRevenue.toLocaleString()}</span>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-2 gap-3">

        {/* Left: Orders */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-brand-chocolate/40 px-0.5">Orders</p>
          {orderMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-2.5 py-2 rounded-md border border-brand-chocolate/5 bg-white shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-md ${metric.bg} ${metric.color} flex items-center justify-center flex-shrink-0`}>
                  <metric.icon size={14} />
                </div>
                <span className="text-xs font-medium text-brand-chocolate/70">{metric.label}</span>
              </div>
              <span className={`text-base font-display ${metric.color}`}>{metric.value}</span>
            </div>
          ))}
        </div>

        {/* Right: Customers */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-brand-chocolate/40 px-0.5">Customers</p>

          {/* Top Buyer */}
          <div className="px-2.5 py-2 rounded-md border border-amber-200 bg-amber-50 shadow-sm flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 mb-1">
              <Crown size={11} className="text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600">Top Buyer</span>
            </div>
            <p className="text-xs font-display text-brand-chocolate truncate w-full text-center">
              {topBuyer ? topBuyer.name : '—'}
            </p>
            {topBuyer && (
              <p className="text-[10px] text-brand-chocolate/50">{topBuyer.totalOrders} orders</p>
            )}
          </div>

          {customerMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-2.5 py-2 rounded-md border border-brand-chocolate/5 bg-white shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-md ${metric.bg} ${metric.color} flex items-center justify-center flex-shrink-0`}>
                  <metric.icon size={14} />
                </div>
                <span className="text-xs font-medium text-brand-chocolate/70">{metric.label}</span>
              </div>
              <span className={`text-base font-display ${metric.color}`}>{metric.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Product Insights: Top Selling Bite */}
      <div className="px-4 py-3 rounded-md border border-indigo-100 bg-indigo-50/20 shadow-sm flex flex-col items-center text-center">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Star size={14} className="text-indigo-500 fill-indigo-500" />
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Most Popular Bite</span>
        </div>
        <p className="text-lg font-display text-brand-chocolate truncate w-full">
          {topProduct || '—'}
        </p>
        {topProduct && (
          <p className="text-[11px] text-brand-chocolate/50 italic font-medium mt-0.5">
            Captured {topProductCount} orders this period
          </p>
        )}
      </div>

      {/* Footer: Avg Order Value */}
      <div className="p-3.5 rounded-md bg-brand-chocolate text-white">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm opacity-80">
            <span>Average Order Value</span>
            <span>{orders.length > 0 ? `GH₵ ${(totalRevenue / orders.length).toFixed(2)}` : 'GH₵ 0.00'}</span>
          </div>
          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-500"
              style={{ width: `${orders.length > 0 ? (statusCounts.Completed / orders.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] opacity-60 text-center">
            {statusCounts.Completed} out of {orders.length} orders successfully completed
          </p>
        </div>
      </div>
    </div>
  )
}
