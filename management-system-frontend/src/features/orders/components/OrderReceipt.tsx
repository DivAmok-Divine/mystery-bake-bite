import React, { useMemo } from 'react'
import { format } from 'date-fns'
import { 
  User, ShoppingCart, Calendar, 
  Wallet, StickyNote, ShoppingBag,
  CheckCircle2, XCircle, Check, AlertTriangle, Eye
} from 'lucide-react'
import { StatusBadge } from '@shared/ui/atoms/StatusBadge'
import type { Order } from '@backend/lib/db'
import { formatCurrency } from '@shared/utils/front-end-calculations/formatters'
import { useOrders } from '../api/useOrders'
import { calculateCustomerOrdersCount } from '@shared/utils/front-end-calculations/customerGeneralAnalytics'

interface OrderReceiptProps {
  order: Order
  onViewCustomer?: () => void
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({ order, onViewCustomer }) => {
  const { orders } = useOrders()
  const customerOrdersCount = useMemo(() => {
    return calculateCustomerOrdersCount(orders, order.customerId)
  }, [orders, order.customerId])

  return (
    <div id="printable-receipt" className="flex flex-col gap-3 pb-4">
      {/* Receipt Header (Print Only) */}
      <div className="hidden print:flex flex-col items-center justify-center border-b-2 border-brand-chocolate/20 pb-6 mb-4 text-center">
        <h1 className="text-2xl font-display text-brand-chocolate">MysteryBakeBite</h1>
        <p className="text-xs font-bold tracking-[0.3em] text-brand-chocolate/40 mt-1">Official Order Receipt</p>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between bg-brand-chocolate/5 p-4 rounded-md border border-brand-chocolate/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-chocolate rounded-md flex items-center justify-center text-white no-print">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-brand-chocolate/40">Order reference</p>
            <p className="text-sm font-bold text-brand-chocolate">{order.orderNumber}</p>
            <p className="text-[10px] text-brand-chocolate/30 font-bold italic">
              Created on {format(new Date(order.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge 
            status={order.status} 
            className="text-xs tracking-wider px-3 py-1" 
          />
          {order.status === 'Completed' && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              <Check size={10} /> Paid
            </div>
          )}
        </div>
      </div>

      {/* Customer Info */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2 px-1">
          <User size={12} /> Customer information
        </label>
        <div className="bg-brand-surface border border-brand-chocolate/10 rounded-md p-4 flex items-center justify-between group">
          <div>
            <p className="text-lg font-display text-brand-chocolate">{order.customerName}</p>
            <p className="text-xs text-brand-chocolate/40 mt-1 italic">
              {customerOrdersCount} Total Order{customerOrdersCount !== 1 ? 's' : ''}
            </p>
          </div>
          {onViewCustomer && (
            <button 
              onClick={onViewCustomer}
              className="no-print w-10 h-10 rounded-full bg-feature-customers/5 text-feature-customers flex items-center justify-center hover:bg-feature-customers/10 transition-colors"
              title="View customer profile"
            >
              <Eye size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Items Summary */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2 px-1">
          <ShoppingCart size={12} /> Ordered bites
        </label>
        <div className="bg-brand-surface border border-brand-chocolate/10 rounded-md p-4">
          <p className="text-sm leading-relaxed text-brand-chocolate">{order.items}</p>
        </div>
      </div>

      {/* Financials & Deadline */}
      <div className="grid grid-cols-2 gap-3 items-stretch">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2 px-1">
            <Wallet size={12} /> Amount
          </label>
          <div className="bg-brand-chocolate text-white rounded-md p-4 shadow-lg shadow-brand-chocolate/10 flex-1 flex flex-col justify-center min-h-[72px]">
            <p className="text-xl font-bold">{formatCurrency(order.amount)}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2 px-1">
            <Calendar size={12} /> Deadline
          </label>
          <div className="bg-brand-surface border border-brand-chocolate/10 rounded-md p-4 flex-1 flex items-center gap-3 min-h-[72px]">
            {(() => {
              const now = new Date()
              const deadline = new Date(order.deadline)
              const isPassed = deadline < now
              const isSoon = deadline >= now && deadline < new Date(now.getTime() + 24 * 60 * 60 * 1000)
              
              if (order.status === 'Completed') return <CheckCircle2 size={16} className="text-emerald-500" />
              if (isPassed) return <XCircle size={16} className="text-rose-500" />
              if (isSoon) return <AlertTriangle size={16} className="text-amber-500" />
              return <CheckCircle2 size={16} className="text-emerald-500/40" />
            })()}
            <div className="flex flex-col">
              <p className={`text-sm font-bold ${(() => {
                const now = new Date()
                const deadline = new Date(order.deadline)
                const isPassed = deadline < now
                const isSoon = deadline >= now && deadline < new Date(now.getTime() + 24 * 60 * 60 * 1000)
                if (order.status === 'Completed') return 'text-emerald-600'
                if (isPassed) return 'text-rose-600'
                if (isSoon) return 'text-amber-600'
                return 'text-brand-chocolate'
              })()}`}>
                {format(new Date(order.deadline), 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-brand-chocolate/40">{format(new Date(order.deadline), 'h:mm a')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2 px-1">
            <StickyNote size={12} /> Special notes
          </label>
          <div className="bg-brand-dough/10 border border-brand-chocolate/5 rounded-md p-4 italic text-sm text-brand-chocolate/70">
            "{order.notes}"
          </div>
        </div>
      )}
      
      {/* Footer Branding (Print Only) */}
      <div className="hidden print:block mt-auto pt-10 text-center border-t border-brand-chocolate/10">
        <p className="text-[10px] font-bold text-brand-chocolate/30 italic">Thank you for choosing MysteryBakeBite!</p>
        <p className="text-xs text-brand-chocolate/20 mt-1 tracking-widest">Digital Receipt Generated on {format(new Date(), 'MMM d, yyyy @ h:mm a')}</p>
      </div>
    </div>
  )
}

