import React from 'react'
import { createPortal } from 'react-dom'
import type { Order } from '@backend/lib/db'
import { 
  CheckCircle2, XCircle, Printer 
} from 'lucide-react'
import { OrderReceipt } from './OrderReceipt'

interface OrderDetailsProps {
  order: Order
  onCancel?: () => void
  onComplete?: () => void
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onCancel, onComplete }) => {
  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* 1. On-Screen View (Normal render inside the sheet) */}
      <OrderReceipt order={order} />

      {/* 2. Print-Only Portal (Renders at the root of body, hidden on screen) */}
      {createPortal(
        <div id="print-portal-container" className="hidden print:block">
          <OrderReceipt order={order} />
        </div>,
        document.body
      )}

      {/* Quick Actions (Interactive UI Only) */}
      {order.status === 'Pending' && (
        <div className="grid grid-cols-2 gap-3 pt-2 no-print">
          <button
            onClick={onCancel}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs active:scale-95 transition-all whitespace-nowrap"
          >
            <XCircle size={14} />
            Cancel Order
          </button>
          <button
            onClick={onComplete}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-emerald-600 text-white font-bold text-xs active:scale-95 transition-all whitespace-nowrap"
          >
            <CheckCircle2 size={14} />
            Mark Done
          </button>
        </div>
      )}

      {/* Completed Actions (Interactive UI Only) */}
      {order.status === 'Completed' && (
        <div className="pt-2 no-print">
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-brand-chocolate text-white font-bold text-xs active:scale-95 transition-all shadow-lg whitespace-nowrap"
          >
            <Printer size={14} />
            Print Receipt
          </button>
        </div>
      )}
    </div>
  )
}


