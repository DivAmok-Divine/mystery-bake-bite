import React from 'react'
import { Package, Tag, TrendingUp, TrendingDown, BarChart3, Star } from 'lucide-react'
import type { Product } from '../../../shared/lib/db'

interface ProductSummaryProps {
  products: Product[]
  categories: string[]
  onViewProduct: (product: Product) => void
}

export const ProductSummary: React.FC<ProductSummaryProps> = ({ products, categories, onViewProduct }) => {
  const totalProducts = products.length
  const totalCategories = categories.filter(c => c !== 'All').length

  const prices = products.map(p => p.price)
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0

  const topPricedProduct = products.find(p => p.price === maxPrice)

  // Most popular category (most items)
  const categoryCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]

  const leftMetrics = [
    { label: 'Total bites', value: totalProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Categories', value: totalCategories, icon: Tag, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Avg price', value: `GH₵ ${avgPrice.toFixed(2)}`, icon: BarChart3, color: 'text-brand-chocolate', bg: 'bg-brand-chocolate/5' },
  ]

  const rightMetrics = [
    { label: 'Highest', value: `GH₵ ${maxPrice.toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Lowest', value: `GH₵ ${minPrice.toFixed(2)}`, icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="flex flex-col gap-5 pt-2 pb-6">

      {/* Top Card */}
      <div className="p-5 rounded-md border border-brand-chocolate/10 bg-brand-chocolate/5 shadow-sm flex flex-col items-center gap-1.5">
        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-brand-chocolate shadow-sm">
          <Package size={22} />
        </div>
        <span className="text-sm font-medium text-brand-chocolate/60">Total bites</span>
        <span className="text-4xl font-display text-brand-chocolate">{totalProducts}</span>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-2 gap-3">

        {/* Left: Inventory */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-brand-chocolate/40 px-0.5">Inventory</p>
          {leftMetrics.map((metric, idx) => (
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
              <span className={`text-sm font-display ${metric.color}`}>{metric.value}</span>
            </div>
          ))}
        </div>

        {/* Right: Pricing */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-brand-chocolate/40 px-0.5">Pricing</p>

          {/* Top Priced Card - Clickable */}
          <button
            onClick={() => topPricedProduct && onViewProduct(topPricedProduct)}
            className="px-2.5 py-2 rounded-md border border-amber-200 bg-amber-50 shadow-sm flex flex-col items-center text-center hover:bg-amber-100 transition-colors active:scale-95"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Star size={11} className="text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600">Top priced</span>
            </div>
            <p className="text-xs font-display text-brand-chocolate truncate w-full text-center">
              {topPricedProduct ? topPricedProduct.name : '—'}
            </p>
            {topPricedProduct && (
              <p className="text-[10px] text-brand-chocolate/50">GH₵ {topPricedProduct.price.toFixed(2)}</p>
            )}
          </button>

          {rightMetrics.map((metric, idx) => (
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
              <span className={`text-sm font-display ${metric.color}`}>{metric.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Top Category */}
      <div className="p-3.5 rounded-md bg-brand-chocolate text-white">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-sm opacity-80">
            <span>Most popular category</span>
            <span className="font-display">{topCategory ? topCategory[0] : '—'}</span>
          </div>
          {topCategory && (
            <>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-500"
                  style={{ width: `${(topCategory[1] / totalProducts) * 100}%` }}
                />
              </div>
              <p className="text-[10px] opacity-60 text-center">
                {topCategory[1]} out of {totalProducts} bites in this category
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
