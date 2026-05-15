import React from 'react'
import { Wrench, CheckCircle2, AlertTriangle, XCircle, Tag, Wallet, TrendingUp } from 'lucide-react'
import type { Equipment } from '@backend/lib/db'

import { calculateEquipmentMetrics } from '@shared/utils/front-end-calulations/equipmentAnalytics'
import { formatCurrency, formatPercentage } from '@shared/utils/front-end-calulations/formatters'

interface EquipmentSummaryProps {
  equipment: Equipment[]
}

export const EquipmentSummary: React.FC<EquipmentSummaryProps> = ({ equipment }) => {
  const { statusCounts, totalValue, healthScore } = calculateEquipmentMetrics(equipment)

  const categories = Array.from(new Set(equipment.map(e => e.category))).length

  const equipmentStats = [
    { label: 'Operational', value: statusCounts.Operational, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Maintenance', value: statusCounts.Maintenance, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Broken', value: statusCounts.Broken, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]



  return (
    <div className="flex flex-col gap-5 pt-2 pb-6">
      {/* Hero Card: Total Equipment */}
      <div className="p-6 rounded-md bg-brand-chocolate text-white shadow-xl flex flex-col items-center gap-2 relative overflow-hidden text-center">
        {/* Background Watermark */}
        <div className="absolute -right-10 -bottom-10 opacity-10 transform rotate-12">
          <Wrench size={160} />
        </div>
        
        <span className="text-xs font-bold tracking-widest opacity-60">Total Equipment</span>
        
        <h2 className="text-4xl font-display leading-none text-white">
          {equipment.length} <span className="text-lg opacity-40">Assets</span>
        </h2>

        <p className="text-[10px] opacity-40 font-medium">Essential tools for your kitchen</p>
      </div>


      <div className="grid grid-cols-2 gap-3">
        {/* Left Column: Status */}
        <div className="flex flex-col gap-2 h-full">
          <p className="text-sm font-bold text-brand-chocolate/40 px-0.5">Status</p>
          {equipmentStats.map((stat, idx) => (
            <div 
              key={idx}
              className="flex flex-1 items-center justify-between px-2.5 py-2 rounded-md border border-brand-chocolate/5 bg-white shadow-sm"
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

        {/* Right Column: Assets */}
        <div className="flex flex-col gap-2 h-full">
          <p className="text-sm font-bold text-brand-chocolate/40 px-0.5">Assets</p>
          
          {/* Health Score Card */}
          <div className={`px-2.5 py-2 rounded-md border shadow-sm flex flex-col items-center text-center ${
            healthScore > 80 ? 'border-emerald-200 bg-emerald-50' : 
            healthScore > 50 ? 'border-amber-200 bg-amber-50' : 
            'border-rose-200 bg-rose-50'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={11} className={healthScore > 80 ? 'text-emerald-500' : 'text-amber-500'} />
              <span className={`text-[10px] font-bold ${healthScore > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>Health Score</span>
            </div>
            <p className={`text-base font-display ${healthScore > 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {formatPercentage(healthScore)}
            </p>
            <p className="text-[10px] text-brand-chocolate/50">Kitchen Readiness</p>
          </div>

          {/* Categories */}
          <div className="flex flex-1 items-center justify-between px-2.5 py-2 rounded-md border border-brand-chocolate/5 bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                <Tag size={14} />
              </div>
              <span className="text-xs font-medium text-brand-chocolate/70">Categories</span>
            </div>
            <span className="text-base font-display text-violet-600">{categories}</span>
          </div>
        </div>
      </div>

      {/* Total Value — Full Width Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 rounded-md border border-brand-chocolate/10 bg-brand-chocolate/5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-brand-chocolate/10 text-brand-chocolate flex items-center justify-center flex-shrink-0">
            <Wallet size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-brand-chocolate/40 tracking-wider">Total Asset Value</span>
            <span className="text-xs text-brand-chocolate/50">Estimated cost of all equipment</span>
          </div>
        </div>
        <span className="text-xl font-display text-brand-chocolate">{formatCurrency(totalValue)}</span>
      </div>

      {/* Footer: Maintenance Bar */}
      <div className="p-3.5 rounded-md bg-brand-chocolate text-white">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-sm opacity-80">
            <span>Operational Assets</span>
            <span className="font-display">
              {statusCounts.Operational} / {equipment.length}
            </span>
          </div>
          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-500" 
              style={{ width: `${equipment.length > 0 ? (statusCounts.Operational / equipment.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] opacity-60 text-center">
            {statusCounts.Maintenance} items currently in maintenance
          </p>
        </div>
      </div>
    </div>
  )
}
