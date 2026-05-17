import React, { useState, useMemo } from 'react'
import { useDebounce } from '@shared/hooks/useDebounce'
import { useEquipment } from '../../api/equipments-api/useEquipment'
import { 
  Plus, Wrench, Trash2, 
  ArrowLeft, Activity, Calendar,
  Eye, Pencil, BarChart3, Search
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { BottomSheet } from '@shared/ui/molecules/BottomSheet'
import { EmptyState } from '@shared/ui/molecules/EmptyState'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'
import { SearchBar } from '@shared/ui/molecules/SearchBar'
import { formatCurrency } from '@shared/utils/front-end-calculations/formatters'
import { EquipmentForm } from '../eqipments/EquipmentForm'
import { EquipmentDetails } from './EquipmentDetails'
import { EquipmentSummary } from './EquipmentSummary'
import type { Equipment } from '@backend/lib/db'


import { CategoryFilter, FilterToggle } from '@shared/ui/molecules/CategoryFilter'
import { StatusBadge } from '@shared/ui/atoms/StatusBadge'
import { ListSkeleton } from '@shared/ui/atoms/ListSkeleton'
import { toggleFilterValue } from '@shared/utils/front-end-calculations/commonUtils'

interface EquipmentListProps {
  onBack: () => void
}

export const EquipmentList: React.FC<EquipmentListProps> = ({ onBack }) => {
  const { equipment, isLoading, deleteEquipment } = useEquipment()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 150)
  const [activeCategories, setActiveCategories] = useState<string[]>(['All'])
  const [activeStatuses, setActiveStatuses] = useState<string[]>(['All'])
  const [isAdding, setIsAdding] = useState(false)
  const [isShowingSummary, setIsShowingSummary] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isFormDirty, setIsFormDirty] = useState(false)

  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null)
  const [viewingItem, setViewingItem] = useState<Equipment | null>(null)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)

  const toggleCategory = (category: string) => {
    setActiveCategories(toggleFilterValue(activeCategories, category))
  }

  const toggleStatus = (status: string) => {
    setActiveStatuses(toggleFilterValue(activeStatuses, status))
  }

  const baseFilteredEquipment = useMemo(() => {
    return equipment.filter(e => {
      return e.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
             e.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    })
  }, [equipment, debouncedSearchQuery])

  const getCategoryCount = (category: string) => {
    const baseItemsForCategory = baseFilteredEquipment.filter(e => 
      activeStatuses.includes('All') || activeStatuses.includes(e.status)
    )
    if (category === 'All') return baseItemsForCategory.length
    return baseItemsForCategory.filter(e => e.category === category).length
  }

  const getStatusCount = (status: string) => {
    const baseItemsForStatus = baseFilteredEquipment.filter(e => 
      activeCategories.includes('All') || activeCategories.includes(e.category)
    )
    if (status === 'All') return baseItemsForStatus.length
    return baseItemsForStatus.filter(e => e.status === status).length
  }

  const allCategories = ['Ovens', 'Mixers', 'Prep', 'Storage', 'Finishing', 'Display', 'Beverage', 'Cleaning']
  const displayCategories = ['All', ...allCategories]
  const displayStatuses = ['All', 'Operational', 'Maintenance', 'Broken']

  const safeFormatDate = (val: any, formatStr: string) => {
    if (!val) return 'N/A'
    const d = new Date(val)
    return isNaN(d.getTime()) ? 'N/A' : format(d, formatStr)
  }

  const filteredEquipment = useMemo(() => {
    return baseFilteredEquipment.filter(e => {
      const matchesCategory = activeCategories.includes('All') || activeCategories.includes(e.category)
      const matchesStatus = activeStatuses.includes('All') || activeStatuses.includes(e.status)
      return matchesCategory && matchesStatus
    })
  }, [baseFilteredEquipment, activeCategories, activeStatuses])



  const navigateItem = (direction: 'next' | 'prev', list = filteredEquipment, currentItem = viewingItem || selectedItem) => {
    if (!currentItem || list.length <= 1) return
    const currentIndex = list.findIndex(e => e.id === currentItem.id)
    if (currentIndex === -1) return
    
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (newIndex >= list.length) newIndex = 0
    if (newIndex < 0) newIndex = list.length - 1
    
    const nextItem = list[newIndex]
    if (viewingItem) setViewingItem(nextItem)
    if (selectedItem) setSelectedItem(nextItem)
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-3 px-3 flex flex-col gap-3 border-b border-brand-chocolate/5">
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
                className="overflow-hidden flex flex-col gap-0.5 mt-1"
              >
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-brand-chocolate/30 px-1 -mb-1 z-10 tracking-tighter">Categories</p>
                  <CategoryFilter 
                    show={equipment.length > 0}
                    options={displayCategories}
                    activeOptions={activeCategories}
                    onToggle={toggleCategory}
                    getCount={getCategoryCount}
                  />
                </div>
                
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-brand-chocolate/30 px-1 -mb-1 z-10 tracking-tighter">Status</p>
                  <CategoryFilter 
                    show={equipment.length > 0}
                    options={displayStatuses}
                    activeOptions={activeStatuses}
                    onToggle={toggleStatus}
                    getCount={getStatusCount}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {isLoading ? (
        <ListSkeleton count={3} className="h-32" />
      ) : equipment.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No equipment listed yet"
          description="Add a new asset to your kitchen to start tracking maintenance and value."
          actionLabel="+ Add first gear"
          onAction={() => setIsAdding(true)}
        />
      ) : filteredEquipment.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No gear matching filters"
          description={`We couldn't find any equipment matching "${searchQuery}"`}
        />
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
                  <p className="text-xs font-bold text-brand-chocolate mt-1">{formatCurrency(item.price)}</p>
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
          setIsFormDirty(false)
        }} 
        animationKey={selectedItem?.id}
        title={selectedItem ? 'Edit Equipment' : 'New Equipment'}
        subtitle={selectedItem ? 'Modify equipment details and status' : 'Add a new asset to your kitchen'}
        disableSwipe={true}
        hasUnsavedChanges={isFormDirty}
      >
        <EquipmentForm 
          onSuccess={() => {
            setIsAdding(false)
            setSelectedItem(null)
            setIsFormDirty(false)
          }} 
          initialData={selectedItem || undefined}
          onDirtyChange={setIsFormDirty}
        />
      </BottomSheet>

      <BottomSheet 
        isOpen={!!viewingItem} 
        onClose={() => setViewingItem(null)} 
        onSwipeLeft={() => navigateItem('next')}
        onSwipeRight={() => navigateItem('prev')}
        animationKey={viewingItem?.id}
        title="Equipment Details"
        subtitle="View full asset history and notes"
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
