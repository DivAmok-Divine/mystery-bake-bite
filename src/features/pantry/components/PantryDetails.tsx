import React from 'react'
import { 
  Package, Tag, Hash, Wallet, 
  StickyNote, AlertTriangle, CheckCircle2, 
  TrendingDown, CalendarClock
} from 'lucide-react'
import { StatusBadge } from '../../../shared/ui/atoms/StatusBadge'
import type { PantryItem } from '../../../shared/lib/db'

interface PantryDetailsProps {
  item: PantryItem
  onRestock?: () => void
}

export const PantryDetails: React.FC<PantryDetailsProps> = ({ item, onRestock }) => {

  const stockPercent = Math.min(100, ((item.currentStock || 0) / Math.max(1, (item.minStock || 1) * 3)) * 100)

  const stockColor =
    item.status === 'Out of Stock' ? 'bg-rose-500' :
    item.status === 'Low Stock'    ? 'bg-amber-400' :
                                     'bg-emerald-500'

  const totalValue = (item.currentStock || 0) * (item.lastPrice || 0)

  return (
    <div className="flex flex-col gap-5 pb-8">

      {/* Hero Stock Banner */}
      <div className={`p-5 rounded-md flex items-center gap-4 ${
        item.status === 'Out of Stock' ? 'bg-rose-50 border border-rose-100' :
        item.status === 'Low Stock'    ? 'bg-amber-50 border border-amber-100' :
                                         'bg-emerald-50 border border-emerald-100'
      }`}>
        <div className={`w-14 h-14 rounded-md flex items-center justify-center shrink-0 ${
          item.status === 'Out of Stock' ? 'bg-rose-100 text-rose-600' :
          item.status === 'Low Stock'    ? 'bg-amber-100 text-amber-600' :
                                           'bg-emerald-100 text-emerald-600'
        }`}>
          {item.status === 'In Stock' ? <CheckCircle2 size={28} /> :
           item.status === 'Low Stock' ? <AlertTriangle size={28} /> :
           <TrendingDown size={28} />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-display text-brand-chocolate leading-tight truncate">{item.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={item.status || 'In Stock'} className="text-[10px] px-2 py-0.5" />
            <span className="text-[10px] text-brand-chocolate/40 font-bold">{item.category}</span>
          </div>
        </div>
      </div>

      {/* Stock Level */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-brand-chocolate/40">Stock level</span>
          <span className="text-xs font-bold text-brand-chocolate">
            {item.currentStock ?? 0} / {(item.minStock || 0) * 3} {item.unit}
          </span>
        </div>
        <div className="h-2.5 bg-brand-chocolate/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${stockColor}`}
            style={{ width: `${stockPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] text-brand-chocolate/30">
            Minimum threshold: {item.minStock ?? 0} {item.unit}
          </p>
          {onRestock && (
            <button 
              onClick={onRestock}
              className="text-[10px] font-bold text-orange-600 underline"
            >
              Restock
            </button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-brand-chocolate/5 rounded-md flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-brand-chocolate/40 mb-1">
            <Package size={13} />
            <span className="text-[10px] font-bold">Current stock</span>
          </div>
          <span className="text-2xl font-display text-brand-chocolate leading-none">{item.currentStock ?? 0}</span>
          <span className="text-[10px] text-brand-chocolate/40">{item.unit}</span>
        </div>

        <div className="p-4 bg-emerald-50 rounded-md flex flex-col gap-1 border border-emerald-100">
          <div className="flex items-center gap-1.5 text-emerald-600/60 mb-1">
            <Wallet size={13} />
            <span className="text-[10px] font-bold">Stock value</span>
          </div>
          <span className="text-2xl font-display text-emerald-700 leading-none">
            GH₵ {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-600/50">@ GH₵ {(item.lastPrice || 0).toFixed(2)} / {item.unit}</span>
        </div>
      </div>

      {/* Details List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between p-3 bg-brand-surface rounded-md border border-brand-chocolate/5">
          <div className="flex items-center gap-2 text-brand-chocolate/40">
            <Tag size={14} />
            <span className="text-xs font-bold">Category</span>
          </div>
          <span className="text-xs font-bold text-brand-chocolate">{item.category}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-brand-surface rounded-md border border-brand-chocolate/5">
          <div className="flex items-center gap-2 text-brand-chocolate/40">
            <Hash size={14} />
            <span className="text-xs font-bold">Unit of measure</span>
          </div>
          <span className="text-xs font-bold text-brand-chocolate">{item.unit}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-brand-surface rounded-md border border-brand-chocolate/5">
          <div className="flex items-center gap-2 text-brand-chocolate/40">
            <AlertTriangle size={14} />
            <span className="text-xs font-bold">Low stock alert at</span>
          </div>
          <span className="text-xs font-bold text-amber-600">{item.minStock ?? 0} {item.unit}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-brand-surface rounded-md border border-brand-chocolate/5">
          <div className="flex items-center gap-2 text-brand-chocolate/40">
            <CalendarClock size={14} />
            <span className="text-xs font-bold">Last updated</span>
          </div>
          <span className="text-xs font-bold text-brand-chocolate">
            {new Date(item.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Notes */}
      {item.notes && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-brand-chocolate/40">
            <StickyNote size={14} />
            <span className="text-xs font-bold">Notes</span>
          </div>
          <div className="p-4 bg-brand-cream/10 rounded-md border border-brand-chocolate/5">
            <p className="text-sm text-brand-chocolate/70 leading-relaxed">{item.notes}</p>
          </div>
        </div>
      )}

    </div>
  )
}

