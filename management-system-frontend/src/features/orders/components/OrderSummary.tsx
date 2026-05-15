import React, { useState } from 'react'
import { ShoppingBag, Clock, CheckCircle2, XCircle, Users, UserCheck, UserX, Crown, Star } from 'lucide-react'
import type { Order, Customer, Product } from '@backend/lib/db'
import { useCustomers } from '../../customers/api/useCustomers'
import { useProducts } from '../../products/api/useProducts'

import { useTopBuyers } from '@shared/utils/front-end-calculations/topCustomerAnalytics'
import { 
  calculateTotalRevenue, 
  calculateStatusCounts, 
  getPopularProducts,
  calculateAverageOrderValue,
  calculateCompletionRate
} from '@shared/utils/front-end-calculations/orderAnalytics'
import { formatCurrency } from '@shared/utils/front-end-calculations/formatters'
import { BottomSheet } from '@shared/ui/molecules/BottomSheet'
import { CustomerDetails } from '../../customers/components/CustomerDetails'
import { ProductDetails } from '../../products/components/ProductDetails'
import { 
  getCustomerStatusCounts,
  getCustomersInPeriod 
} from '@shared/utils/front-end-calculations/customerGeneralAnalytics'

interface OrderSummaryProps {
  orders: Order[]
  filterLabel?: string
  children?: React.ReactNode
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ orders, filterLabel = 'all orders', children }) => {
  const { customers } = useCustomers()
  const { products } = useProducts()
  const topBuyers = useTopBuyers(orders, customers, 1)
  const topBuyer = topBuyers[0]?.customer || null

  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)

  const totalRevenue = calculateTotalRevenue(orders)
  const statusCounts = calculateStatusCounts(orders)
  const avgOrderValue = calculateAverageOrderValue(orders)
  const completionRate = calculateCompletionRate(orders)

  // Customer stats for this period - Using centralized utility
  const customersInPeriod = getCustomersInPeriod(customers, orders)
  const { active: activeCustomers, inactive: inactiveCustomers } = getCustomerStatusCounts(customersInPeriod)

  // Product Intelligence
  const popularProducts = getPopularProducts(orders, 1)
  const topProduct = popularProducts[0]?.[0] || null
  const topProductCount = popularProducts[0]?.[1] || 0
  const topProductObj = topProduct ? products.find(p => p.name === topProduct) || null : null

  const orderMetrics = [
    { label: 'Total', value: orders.length, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending', value: statusCounts.Pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Done', value: statusCounts.Completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Cancelled', value: statusCounts.Cancelled, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  const customerMetrics = [
    { label: 'Total', value: customersInPeriod.length, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Active', value: activeCustomers, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Inactive', value: inactiveCustomers, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  return (
    <div className="flex flex-col gap-5 pt-2 pb-4">
      {children}

      {/* Primary Revenue Card */}
      <div className="p-6 rounded-md bg-brand-chocolate text-white shadow-xl flex flex-col items-center gap-2 relative overflow-hidden text-center">
        {/* Background Watermark */}
        <div className="absolute -right-10 -bottom-10 opacity-10 transform rotate-12">
          <ShoppingBag size={160} />
        </div>
        
        <span className="text-xs font-bold tracking-widest opacity-60">Total Revenue</span>
        
        <h2 className="text-4xl font-display leading-none text-white">
          {formatCurrency(totalRevenue)}
        </h2>

        <p className="text-[10px] opacity-40 font-medium">Gross earnings from {filterLabel}</p>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-2 gap-3">

        {/* Left: Orders */}
        <div className="flex flex-col gap-2 h-full">
          <p className="text-sm font-bold text-brand-chocolate/40 px-0.5">Orders</p>
          {orderMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="flex flex-1 items-center justify-between px-2.5 py-2 rounded-md border border-brand-chocolate/5 bg-white shadow-sm"
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
        <div className="flex flex-col gap-2 h-full">
          <p className="text-sm font-bold text-brand-chocolate/40 px-0.5">Customers</p>

          {/* Top Buyer — Clickable */}
          <button
            onClick={() => topBuyer && setViewingCustomer(topBuyer)}
            disabled={!topBuyer}
            className="px-2.5 py-2 rounded-md border border-amber-200 bg-amber-50 shadow-sm flex flex-col items-center text-center active:scale-95 transition-transform disabled:cursor-default"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Crown size={11} className="text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600">Top Buyer</span>
            </div>
            <p className="text-xs font-display text-brand-chocolate truncate w-full text-center">
              {topBuyer ? topBuyer.name : '—'}
            </p>
            {topBuyer && (
              <p className="text-[10px] text-brand-chocolate/50">{topBuyers[0].count} orders</p>
            )}
          </button>

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

      {/* Product Insights: Top Selling Bite — Clickable */}
      <button
        onClick={() => topProductObj && setViewingProduct(topProductObj)}
        disabled={!topProductObj}
        className="px-4 py-3 rounded-md border border-indigo-100 bg-indigo-50/20 shadow-sm flex flex-col items-center text-center active:scale-[0.98] transition-transform disabled:cursor-default"
      >
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
      </button>

      {/* Footer: Avg Order Value */}
      <div className="p-3.5 rounded-md bg-brand-chocolate text-white">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm opacity-80">
            <span>Average Order Value</span>
            <span>{formatCurrency(avgOrderValue)}</span>
          </div>
          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-[10px] opacity-60 text-center">
            {statusCounts.Completed} out of {orders.length} orders successfully completed
          </p>
        </div>
      </div>

      {/* Customer Details Sheet */}
      <BottomSheet
        isOpen={!!viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        title={viewingCustomer?.name || 'Customer'}
        subtitle="Top buyer details"
      >
        {viewingCustomer && <CustomerDetails customer={viewingCustomer} />}
      </BottomSheet>

      {/* Product Details Sheet */}
      <BottomSheet
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        title={viewingProduct?.name || 'Product'}
        subtitle="Most popular bite"
      >
        {viewingProduct && <ProductDetails product={viewingProduct} />}
      </BottomSheet>
    </div>
  )
}
