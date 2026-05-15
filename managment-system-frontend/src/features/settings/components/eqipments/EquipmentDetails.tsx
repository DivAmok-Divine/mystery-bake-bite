import React from 'react'
import { 
  Activity, Calendar, Wallet, 
  Hash, StickyNote, Tag
} from 'lucide-react'
import { format } from 'date-fns'
import type { Equipment } from '@backend/lib/db'
import { formatCurrency } from '@shared/utils/front-end-calulations/formatters'

interface EquipmentDetailsProps {
  equipment: Equipment
}

import { StatusBadge } from '@shared/ui/atoms/StatusBadge'

export const EquipmentDetails: React.FC<EquipmentDetailsProps> = ({ equipment }) => {

  const safeFormatDate = (val: any, formatStr: string) => {
    if (!val) return 'N/A'
    const d = new Date(val)
    return isNaN(d.getTime()) ? 'N/A' : format(d, formatStr)
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header Info */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-display text-brand-chocolate leading-tight">{equipment.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-cream/10 border border-brand-chocolate/5 text-xs font-bold text-brand-chocolate/60">
                <Tag size={12} /> {equipment.category}
              </span>
            </div>
          </div>
          <StatusBadge status={equipment.status} className="text-xs px-3 py-1.5 border" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Price */}
        <div className="flex flex-col gap-1 p-4 bg-brand-cream/10 rounded-xl border border-brand-chocolate/5">
          <span className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-1.5">
            <Wallet size={12} /> Price
          </span>
          <span className="text-lg font-bold text-brand-chocolate">
            {formatCurrency(equipment.price)}
          </span>
        </div>

        {/* Serial Number */}
        <div className="flex flex-col gap-1 p-4 bg-brand-cream/10 rounded-xl border border-brand-chocolate/5">
          <span className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-1.5">
            <Hash size={12} /> Seriel / Model
          </span>
          <span className="text-sm font-bold text-brand-chocolate mt-1 truncate">
            {equipment.serialNumber || 'N/A'}
          </span>
        </div>
      </div>

      {/* Dates */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2 px-1">
          <Calendar size={14} /> Dates
        </h3>
        <div className="flex flex-col bg-brand-cream/10 rounded-xl border border-brand-chocolate/5 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-brand-chocolate/5">
            <span className="text-xs font-bold text-brand-chocolate/60">Purchase Date</span>
            <span className="text-sm font-bold text-brand-chocolate">
              {safeFormatDate(equipment.purchaseDate, 'MMMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-brand-chocolate/5">
            <span className="text-xs font-bold text-brand-chocolate/60 flex items-center gap-1.5">
              <Activity size={14} className="opacity-60" /> Last Maintained
            </span>
            <span className="text-sm font-bold text-brand-chocolate">
              {equipment.lastMaintained && safeFormatDate(equipment.lastMaintained, 'MMMM d, yyyy') !== 'N/A' 
                ? safeFormatDate(equipment.lastMaintained, 'MMMM d, yyyy') 
                : 'No maintenance record'}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {equipment.notes && (
        <div className="flex flex-col gap-3 px-1">
          <h3 className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2">
            <StickyNote size={14} /> Notes
          </h3>
          <div className="bg-brand-cream/10 p-4 rounded-xl border border-brand-chocolate/5">
            <p className="text-sm text-brand-chocolate/80 leading-relaxed whitespace-pre-wrap">
              {equipment.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
