import React from 'react'
import { 
  Package, AlertTriangle, 
  ShoppingCart, 
  BarChart3, Star,
  CheckCircle2
} from 'lucide-react'
import type { PantryItem, PantryHistory } from '@backend/lib/db'
import { 
  calculatePantryValue, 
  calculateMonthlySpend, 
  calculateMonthlyUsage,
  getPantryStockHealth,
  getTopPantryCategory
} from '@shared/utils/front-end-calulations/pantryAnalytics'
import { formatCurrency } from '@shared/utils/front-end-calulations/formatters'

interface PantrySummaryProps {
  items: PantryItem[]
  history: PantryHistory[]
  onRestock: (item: PantryItem) => void
  onViewDetails: (item: PantryItem) => void
}




export const PantrySummary: React.FC<PantrySummaryProps> = ({ items, history, onRestock, onViewDetails }) => {
  const totalItems = items.length
  const { lowStock: lowStockItems, outOfStock: outOfStockItems } = getPantryStockHealth(items)
  
  const totalInvestment = calculatePantryValue(items)
  const monthlySpend = calculateMonthlySpend(history)
  const monthlyUsage = calculateMonthlyUsage(history)

  const topCategory = getTopPantryCategory(items)


  return (
    <div className="flex flex-col gap-6 pb-10 pt-2">
      
      {/* Main Metric */}
      <div className="p-6 rounded-md bg-brand-chocolate text-white shadow-xl flex flex-col items-center gap-2 relative overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute -right-10 -bottom-10 opacity-10 transform rotate-12">
          <ShoppingCart size={160} />
        </div>
        
        <span className="text-xs font-bold tracking-widest opacity-60">Pantry value</span>
        <h2 className="text-4xl font-display leading-none text-white">{formatCurrency(totalInvestment)}</h2>

        <p className="text-[10px] opacity-40 font-medium">Estimated value of current stock</p>
      </div>

      {/* Health Checks */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-4 rounded-md border flex flex-col gap-1 ${lowStockItems.length > 0 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          <div className="flex items-center justify-between mb-1">
            {lowStockItems.length > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span className="text-xl font-display">{lowStockItems.length}</span>
          </div>
          <span className="text-[10px] font-bold tracking-tight opacity-70">Low stock</span>
        </div>

        <div className={`p-4 rounded-md border flex flex-col gap-1 ${outOfStockItems.length > 0 ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-brand-chocolate/5 border-brand-chocolate/10 text-brand-chocolate/60'}`}>
          <div className="flex items-center justify-between mb-1">
             <Package size={18} />
            <span className="text-xl font-display">{outOfStockItems.length}</span>
          </div>
          <span className="text-[10px] font-bold tracking-tight opacity-70">Out of stock</span>
        </div>
      </div>

      {/* Monthly Performance Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-brand-chocolate/40 tracking-wider px-1 text-sm">Monthly Performance</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-md bg-brand-chocolate/5 border border-brand-chocolate/10 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-brand-chocolate/40">Monthly Spend</span>
            <span className="text-lg font-display text-brand-chocolate">{formatCurrency(monthlySpend)}</span>
            <p className="text-[10px] text-brand-chocolate/30 mt-1">Total value of restocks</p>
          </div>
          
          <div className="p-4 rounded-md bg-brand-chocolate/5 border border-brand-chocolate/10 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-brand-chocolate/40">Usage Cost</span>
            <span className="text-lg font-display text-brand-chocolate">{formatCurrency(monthlyUsage)}</span>
            <p className="text-[10px] text-brand-chocolate/30 mt-1">Total value of ingredients used</p>
          </div>
        </div>
      </div>

      {/* Shopping List Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-brand-chocolate/40 tracking-wider flex items-center gap-2">
            <ShoppingCart size={12} /> Shopping List
          </h3>
          <span className="text-[10px] bg-brand-chocolate/5 text-brand-chocolate px-2 py-0.5 rounded-full font-bold">
            {lowStockItems.length} items needed
          </span>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="py-10 border-2 border-dashed border-brand-chocolate/10 rounded-md flex flex-col items-center justify-center text-brand-chocolate/20 text-center px-6">
            <CheckCircle2 size={32} strokeWidth={1} className="mb-2 text-emerald-500" />
            <p className="text-xs font-bold text-brand-chocolate/60">Your pantry is full!</p>
            <p className="text-[10px] mt-1">Everything is in stock. No shopping needed.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {lowStockItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-brand-cream/10 border border-brand-chocolate/5 rounded-md">
                <button 
                  onClick={() => onViewDetails(item)}
                  className="flex flex-col text-left active:opacity-60 transition-opacity"
                >
                  <span className="text-sm font-bold text-brand-chocolate underline decoration-brand-chocolate/20 underline-offset-2">{item.name}</span>

                  <span className="text-[10px] text-brand-chocolate/40">
                    Currently: {item.currentStock} {item.unit} (Min: {item.minStock} {item.unit})
                  </span>
                </button>

                <div className="text-right">
                   <button 
                    onClick={() => onRestock(item)}
                    className="text-xs font-bold text-amber-600 italic  underline hover:text-amber-700 transition-colors"
                   >
                    Restock
                   </button>
                   <p className="text-[10px] text-brand-chocolate/40 mt-0.5">Category: {item.category}</p>
                </div>
              </div>
            ))}
            <button 
              onClick={() => window.print()} 
              className="mt-2 py-3 border border-brand-chocolate/20 rounded-md text-xs font-bold text-brand-chocolate/60 hover:bg-brand-chocolate/5 transition-colors"
            >
              Share Shopping List
            </button>
          </div>
        )}
      </div>

      {/* Stats Breakdown */}
      <div className="flex flex-col gap-3 pt-2">
        <h3 className="text-xs font-bold text-brand-chocolate/40 tracking-wider px-1">Statistics</h3>
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center justify-between p-3 bg-white border border-brand-chocolate/5 rounded-md shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Star size={16} />
              </div>
              <span className="text-xs font-medium text-brand-chocolate/70">Main Category</span>
            </div>
            <span className="text-sm font-display text-blue-600">{topCategory ? topCategory[0] : 'None'}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white border border-brand-chocolate/5 rounded-md shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center">
                <BarChart3 size={16} />
              </div>
              <span className="text-xs font-medium text-brand-chocolate/70">Total Varieties</span>
            </div>
            <span className="text-sm font-display text-violet-600">{totalItems} items</span>
          </div>
        </div>
      </div>


    </div>
  )
}
