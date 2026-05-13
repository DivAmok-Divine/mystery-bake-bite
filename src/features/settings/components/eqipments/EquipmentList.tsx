import React, { useState } from 'react'
import { useEquipment } from '../../api/equipments-api/useEquipment'
import { 
  Plus, Wrench, Trash2, 
  ArrowLeft, Activity, Calendar,
  Eye, Pencil, BarChart3
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { BottomSheet } from '../../../../shared/ui/molecules/BottomSheet'
import { ConfirmModal } from '../../../../shared/ui/molecules/ConfirmModal'
import { SearchBar } from '../../../../shared/ui/molecules/SearchBar'
import { EquipmentForm } from '../eqipments/EquipmentForm'
import { EquipmentDetails } from './EquipmentDetails'
import { EquipmentSummary } from './EquipmentSummary'
import type { Equipment } from '../../../../shared/lib/db'

import { CategoryFilter, FilterToggle } from '../../../../shared/ui/molecules/CategoryFilter'
import { StatusBadge } from '../../../../shared/ui/atoms/StatusBadge'

interface EquipmentListProps {
  onBack: () => void
}

export const EquipmentList: React.FC<EquipmentListProps> = ({ onBack }) => {
  const { equipment, isLoading, deleteEquipment } = useEquipment()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategories, setActiveCategories] = useState<string[]>(['All'])
  const [activeStatuses, setActiveStatuses] = useState<string[]>(['All'])
  const [isAdding, setIsAdding] = useState(false)
  const [isShowingSummary, setIsShowingSummary] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null)
  const [viewingItem, setViewingItem] = useState<Equipment | null>(null)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)

  const toggleCategory = (category: string) => {
    if (category === 'All') {
      setActiveCategories(['All'])
      return
    }
    let newCategories = activeCategories.includes('All') ? [] : [...activeCategories]
    if (newCategories.includes(category)) {
      newCategories = newCategories.filter(c => c !== category)
    } else {
      newCategories.push(category)
    }
    if (newCategories.length === 0) newCategories = ['All']
    setActiveCategories(newCategories)
  }

  const toggleStatus = (status: string) => {
    if (status === 'All') {
      setActiveStatuses(['All'])
      return
    }
    let newStatuses = activeStatuses.includes('All') ? [] : [...activeStatuses]
    if (newStatuses.includes(status)) {
      newStatuses = newStatuses.filter(s => s !== status)
    } else {
      newStatuses.push(status)
    }
    if (newStatuses.length === 0) newStatuses = ['All']
    setActiveStatuses(newStatuses)
  }

  const getCategoryCount = (category: string) => {
    const baseItems = equipment.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = activeStatuses.includes('All') || activeStatuses.includes(e.status)
      return matchesSearch && matchesStatus
    })
    if (category === 'All') return baseItems.length
    return baseItems.filter(e => e.category === category).length
  }

  const getStatusCount = (status: string) => {
    const baseItems = equipment.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategories.includes('All') || activeCategories.includes(e.category)
      return matchesSearch && matchesCategory
    })
    if (status === 'All') return baseItems.length
    return baseItems.filter(e => e.status === status).length
  }

  const allCategories = ['Ovens', 'Mixers', 'Prep', 'Storage', 'Finishing', 'Display', 'Beverage', 'Cleaning']
  const displayCategories = ['All', ...allCategories]
  const displayStatuses = ['All', 'Operational', 'Maintenance', 'Broken']

  const safeFormatDate = (val: any, formatStr: string) => {
    if (!val) return 'N/A'
    const d = new Date(val)
    return isNaN(d.getTime()) ? 'N/A' : format(d, formatStr)
  }

  const filteredEquipment = equipment.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategories.includes('All') || activeCategories.includes(e.category)
    const matchesStatus = activeStatuses.includes('All') || activeStatuses.includes(e.status)
    return matchesSearch && matchesCategory && matchesStatus
  })



  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-6 px-6 flex flex-col gap-3 border-b border-brand-chocolate/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-chocolate/5 text-brand-chocolate hover:bg-brand-chocolate/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-display">Equipments</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsShowingSummary(true)}
              className="w-10 h-10 rounded-md bg-brand-chocolate/5 text-brand-chocolate flex items-center justify-center border border-brand-chocolate/10 active:scale-90 transition-transform"
            >
              <BarChart3 size={20} />
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className="w-10 h-10 bg-brand-chocolate text-white rounded-md flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery} 
                placeholder="Search your equipment..."
              />
            </div>
            <FilterToggle 
              isOpen={showFilters} 
              onClick={() => setShowFilters(!showFilters)} 
            />
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden flex flex-col gap-2"
              >
                <CategoryFilter 
                  show={equipment.length > 0}
                  options={displayCategories}
                  activeOptions={activeCategories}
                  onToggle={toggleCategory}
                  getCount={getCategoryCount}
                />

                <CategoryFilter 
                  show={equipment.length > 0}
                  options={displayStatuses}
                  activeOptions={activeStatuses}
                  onToggle={toggleStatus}
                  getCount={getStatusCount}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-brand-chocolate/10 border-t-brand-chocolate rounded-full animate-spin mx-auto"></div>
          <p className="text-brand-chocolate/40 text-sm mt-4 font-bold italic">Gathering your gear...</p>
        </div>
      ) : filteredEquipment.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-3 bg-brand-chocolate/5 rounded-md border border-dashed border-brand-chocolate/10">
          <div className="w-16 h-16 bg-brand-chocolate/5 rounded-full flex items-center justify-center text-brand-chocolate/20">
            <Wrench size={32} />
          </div>
          <p className="text-brand-chocolate/60 font-bold">
            {searchQuery || activeCategories.length > 1 ? `No gear matching filters` : "No equipment listed yet"}
          </p>
          <p className="text-brand-chocolate/40 text-xs max-w-[240px]">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredEquipment.map((item) => (
            <div key={item.id} className="card rounded-md flex flex-col gap-3 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-brand-dough/10 text-brand-chocolate flex items-center justify-center">
                    <Wrench size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg leading-tight font-display">{item.name}</h3>
                    <p className="text-xs text-brand-chocolate/40 font-bold">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                    <StatusBadge status={item.status} className="text-[10px] px-2 py-0.5" />
                  <p className="text-xs font-bold text-brand-chocolate mt-1">GH₵ {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-chocolate/5 text-[11px] text-brand-chocolate/50">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>Bought {safeFormatDate(item.purchaseDate, 'MMM yyyy')}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Activity size={12} />
                  <span>{item.lastMaintained && safeFormatDate(item.lastMaintained, 'MMM d') !== 'N/A' ? `Maintained ${safeFormatDate(item.lastMaintained, 'MMM d')}` : 'No maintenance'}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <button 
                  onClick={() => setViewingItem(item)}
                  className="text-xs font-bold text-brand-chocolate/40 hover:text-brand-chocolate flex items-center gap-1 transition-colors"
                >
                  <Eye size={14} /> View
                </button>
                <button 
                  onClick={() => setSelectedItem(item)}
                  className="text-xs font-bold text-brand-chocolate/40 hover:text-brand-chocolate flex items-center gap-1 transition-colors"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button 
                  onClick={() => setItemToDelete(item.id!)}
                  className="text-xs font-bold text-red-500/70 hover:text-red-500 flex items-center gap-1 ml-auto transition-colors"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      <BottomSheet 
        isOpen={isAdding || !!selectedItem} 
        onClose={() => {
          setIsAdding(false)
          setSelectedItem(null)
        }} 
        title={selectedItem ? 'Edit Equipment' : 'New Equipment'}
      >
        <EquipmentForm 
          onSuccess={() => {
            setIsAdding(false)
            setSelectedItem(null)
          }} 
          initialData={selectedItem || undefined}
        />
      </BottomSheet>

      {/* View Details */}
      <BottomSheet 
        isOpen={!!viewingItem} 
        onClose={() => setViewingItem(null)} 
        title="Equipment Details"
      >
        {viewingItem && <EquipmentDetails equipment={viewingItem} />}
      </BottomSheet>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) deleteEquipment(itemToDelete)
          setItemToDelete(null)
        }}
        title="Remove Equipment?"
        message="Are you sure you want to remove this piece of equipment from your list? This action cannot be undone."
      />
      <BottomSheet 
        isOpen={isShowingSummary} 
        onClose={() => setIsShowingSummary(false)}
        title="Asset Analytics"
        subtitle="Quick overview of your kitchen health"
      >
        <EquipmentSummary equipment={equipment} />
      </BottomSheet>
    </div>
  )
}
