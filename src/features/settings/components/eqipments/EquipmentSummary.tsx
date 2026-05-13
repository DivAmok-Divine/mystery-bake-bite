import React from 'react'
import { Wrench, CheckCircle2, AlertTriangle, XCircle, Tag, DollarSign, TrendingUp } from 'lucide-react'
import type { Equipment } from '../../../../shared/lib/db'

interface EquipmentSummaryProps {
  equipment: Equipment[]
}

export const EquipmentSummary: React.FC<EquipmentSummaryProps> = ({ equipment }) => {
  const statusCounts = {
    Operational: equipment.filter(e => e.status === 'Operational').length,
    Maintenance: equipment.filter(e => e.status === 'Maintenance').length,
    Broken: equipment.filter(e => e.status === 'Broken').length,
  }

  const totalValue = equipment.reduce((sum, e) => sum + (e.price || 0), 0)
  const healthScore = equipment.length > 0 ? (statusCounts.Operational / equipment.length) * 100 : 0

  const categories = Array.from(new Set(equipment.map(e => e.category))).length

  const equipmentStats = [
    { label: 'Operational', value: statusCounts.Operational, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Maintenance', value: statusCounts.Maintenance, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Broken', value: statusCounts.Broken, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  const assetIntel = [
    { label: 'Categories', value: categories, icon: Tag, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Total value', value: `GH₵ ${totalValue.toLocaleString()}`, icon: DollarSign, color: 'text-brand-chocolate', bg: 'bg-brand-chocolate/5' },
  ]

  return (
    <div className="flex flex-col gap-5 pt-2 pb-6">
      {/* Hero Card: Total Equipment */}
      <div className="p-5 rounded-md border border-brand-chocolate/10 bg-brand-chocolate/5 shadow-sm flex flex-col items-center gap-1.5">
        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-brand-chocolate shadow-sm">
          <Wrench size={22} />
        </div>
        <span className="text-sm font-medium text-brand-chocolate/60 tracking-wider">Total Equipment</span>
        <span className="text-4xl font-display text-brand-chocolate">{equipment.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Left Column: Health */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-brand-chocolate/40 px-0.5">Status</p>
          {equipmentStats.map((stat, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between px-2.5 py-2 rounded-md border border-brand-chocolate/5 bg-white shadow-sm"
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
        <div className="flex flex-col gap-2">
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
              {healthScore.toFixed(0)}%
            </p>
            <p className="text-[10px] text-brand-chocolate/50">Kitchen Readiness</p>
          </div>

          {assetIntel.map((intel, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between px-2.5 py-2 rounded-md border border-brand-chocolate/5 bg-white shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-md ${intel.bg} ${intel.color} flex items-center justify-center flex-shrink-0`}>
                  <intel.icon size={14} />
                </div>
                <span className="text-xs font-medium text-brand-chocolate/70 truncate max-w-[60px]">{intel.label}</span>
              </div>
              <span className={`text-xs font-display ${intel.color}`}>{intel.value}</span>
            </div>
          ))}
        </div>
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
