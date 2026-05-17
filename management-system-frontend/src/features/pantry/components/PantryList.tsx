import React, { useState, useMemo } from 'react'
import { 
  Plus, Package, Pencil, Trash2, 
  Search, BarChart3,
  Minus, ShoppingCart, Eye
} from 'lucide-react'

import { motion, AnimatePresence } from 'framer-motion'
import { usePantry } from '../api/usePantry'
import { BottomSheet } from '@shared/ui/molecules/BottomSheet'

import { PantryForm } from './PantryForm'
import { PantryDetails } from './PantryDetails'
import { PantrySummary } from './PantrySummary'
import { SearchBar } from '@shared/ui/molecules/SearchBar'
import { formatCurrency } from '@shared/utils/front-end-calculations/formatters'
import { CategoryFilter, FilterToggle } from '@shared/ui/molecules/CategoryFilter'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'
import { EmptyState } from '@shared/ui/molecules/EmptyState'
import { StatusBadge } from '@shared/ui/atoms/StatusBadge'
import { ListSkeleton } from '@shared/ui/atoms/ListSkeleton'
import type { PantryItem } from '@backend/lib/db'
import { getAdjustedStock, calculateStockProgress } from '@shared/utils/front-end-calculations/pantryAnalytics'
import { toggleFilterValue } from '@shared/utils/front-end-calculations/commonUtils'

export const PantryList: React.FC = () => {
  const { pantryItems, pantryHistory, isLoading, deletePantryItem, updateStock } = usePantry()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategories, setActiveCategories] = useState<string[]>(['All'])
  const [activeStatuses, setActiveStatuses] = useState<string[]>(['All'])
  const [showFilters, setShowFilters] = useState(false)


  const [isAddingItem, setIsAddingItem] = useState(false)

  const [isViewingItem, setIsViewingItem] = useState(false)
  const [isEditingItem, setIsEditingItem] = useState(false)
  const [isRestockForm, setIsRestockForm] = useState(false)
  const [isNavigatingFromDetails, setIsNavigatingFromDetails] = useState(false)
  const [isShowingSummary, setIsShowingSummary] = useState(false)

  const [summaryView, setSummaryView] = useState<'main' | 'details' | 'edit'>('main')
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null)

  const [itemToDelete, setItemToDelete] = useState<number | null>(null)

  const categories = ['All', 'Ingredients', 'Packaging', 'Cleaning', 'Toppings', 'Other']
  const statuses = ['All', 'In Stock', 'Low Stock', 'Out of Stock']


  const baseFilteredItems = useMemo(() => {
    return (pantryItems || []).filter(item => {
      if (!item) return false
      return (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
             (item.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [pantryItems, searchQuery])

  const filteredItems = useMemo(() => {
    return baseFilteredItems.filter(item => {
      const matchesCategory = activeCategories.includes('All') || activeCategories.includes(item.category)
      const matchesStatus = activeStatuses.includes('All') || activeStatuses.includes(item.status || 'In Stock')
      return matchesCategory && matchesStatus
    })
  }, [baseFilteredItems, activeCategories, activeStatuses])

  const getCategoryCount = (cat: string) => {
    const baseItemsForCategory = baseFilteredItems.filter(item => 
      activeStatuses.includes('All') || activeStatuses.includes(item.status || 'In Stock')
    )
    if (cat === 'All') return baseItemsForCategory.length
    return baseItemsForCategory.filter(item => item.category === cat).length
  }

  const toggleCategory = (cat: string) => {
    setActiveCategories(toggleFilterValue(activeCategories, cat))
  }

  const toggleStatus = (stat: string) => {
    setActiveStatuses(toggleFilterValue(activeStatuses, stat))
  }

  const getStatusCount = (stat: string) => {
    const baseItemsForStatus = baseFilteredItems.filter(item => 
      activeCategories.includes('All') || activeCategories.includes(item.category)
    )
    if (stat === 'All') return baseItemsForStatus.length
    return baseItemsForStatus.filter(item => (item.status || 'In Stock') === stat).length
  }

  const handleAdjustStock = (e: React.MouseEvent, item: PantryItem, delta: number) => {
    e.stopPropagation()
    const newStock = getAdjustedStock(item.currentStock || 0, delta)
    if (item.id) updateStock(item.id, newStock)
  }

  const navigateItem = (direction: 'next' | 'prev', list: PantryItem[] = filteredItems) => {
    if (!selectedItem || list.length <= 1) return
    const currentIndex = list.findIndex(i => i.id === selectedItem.id)
    if (currentIndex === -1) return
    
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (newIndex >= list.length) newIndex = 0
    if (newIndex < 0) newIndex = list.length - 1
    
    setSelectedItem(list[newIndex])
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-3 px-3 flex flex-col gap-3 border-b border-brand-chocolate/5">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display">The Pantry</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShowingSummary(true)}
              className="w-10 h-10 rounded-md bg-brand-chocolate/5 text-brand-chocolate flex items-center justify-center border border-brand-chocolate/10 active:scale-90 transition-transform"
            >
              <BarChart3 size={20} />
            </button>
            <button
              onClick={() => setIsAddingItem(true)}
              className="w-10 h-10 bg-brand-chocolate text-white rounded-md flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>


        <div className="flex flex-col gap-1">

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search ingredients..." />
            </div>
            <FilterToggle isOpen={showFilters} onClick={() => setShowFilters(!showFilters)} />
          </div>
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden flex flex-col gap-1 mt-1 pt-2"
              >
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-brand-chocolate/40 px-1">Categories</p>
                  <CategoryFilter
                    show={(pantryItems || []).length > 0}
                    options={categories}
                    activeOptions={activeCategories}
                    onToggle={toggleCategory}
                    getCount={getCategoryCount}
                  />
                </div>

                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-brand-chocolate/40 px-1">Status</p>
                  <CategoryFilter
                    show={(pantryItems || []).length > 0}
                    options={statuses}
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
        <ListSkeleton count={4} className="h-28" />
      ) : (pantryItems || []).length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your pantry is empty"
          description="Add your flour, sugar, and other supplies to start tracking."
          actionLabel="+ Add first item"
          onAction={() => setIsAddingItem(true)}
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No ingredients found"
          description="Try a different search or filter."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="card px-4 pt-4 pb-2 flex flex-col gap-3 group relative overflow-hidden">
              {/* Stock Progress Watermark */}
              <div
                className="absolute top-0 left-0 h-full opacity-[0.04] bg-brand-chocolate pointer-events-none"
                style={{ width: `${calculateStockProgress(item.currentStock || 0, item.minStock || 1)}%` }}
              />

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${
                    item.status === 'Low Stock' ? 'bg-amber-100 text-amber-600' :
                    item.status === 'Out of Stock' ? 'bg-rose-100 text-rose-600' :
                    'bg-brand-dough/10 text-brand-chocolate'
                  }`}>
                    <Package size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-brand-chocolate truncate leading-tight">{item.name}</h3>
                    <p className="text-[10px] font-bold text-brand-chocolate/40 tracking-tight mt-0.5">{item.category}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 bg-brand-surface border border-brand-chocolate/10 rounded-md p-0.5 shadow-sm">
                    <button onClick={(e) => handleAdjustStock(e, item, -1)} className="w-6 h-6 flex items-center justify-center text-brand-chocolate hover:bg-brand-dough/10 rounded transition-colors">
                      <Minus size={12} />
                    </button>
                    <span className="w-10 text-center text-xs font-bold text-brand-chocolate">{item.currentStock || 0}</span>
                    <button onClick={(e) => handleAdjustStock(e, item, 1)} className="w-6 h-6 flex items-center justify-center text-brand-chocolate hover:bg-brand-dough/10 rounded transition-colors">
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={item.status || 'In Stock'} className="text-[10px] px-2 py-0.5" />
                    <span className="text-[10px] font-bold text-brand-chocolate/40">{item.unit}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-brand-chocolate/5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setSelectedItem(item); setIsViewingItem(true) }}
                    className="w-7 h-7 flex items-center justify-center rounded text-brand-chocolate/40 hover:text-brand-chocolate hover:bg-brand-chocolate/5 transition-colors"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => { 
                      setSelectedItem(item); 
                      setIsRestockForm(false); 
                      setIsEditingItem(true) 
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded text-brand-chocolate/40 hover:text-brand-chocolate hover:bg-brand-chocolate/5 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => item.id && setItemToDelete(item.id)}
                    className="w-7 h-7 flex items-center justify-center rounded text-red-400/50 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-emerald-600 leading-none">{formatCurrency(item.lastPrice || 0)} / {item.unit}</span>
                  {item.status !== 'In Stock' && (
                    <button 
                      onClick={() => {
                        setSelectedItem(item)
                        setIsRestockForm(true)
                        setIsEditingItem(true)
                      }}
                      className="px-3 py-1 bg-amber-600 text-white text-[10px] font-bold rounded-md shadow-sm active:scale-95 transition-transform"
                    >
                      Restock
                    </button>

                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item */}
      <BottomSheet
        isOpen={isAddingItem}
        onClose={() => setIsAddingItem(false)}
        title="Add to Pantry"
        subtitle="Keep track of your bakery supplies"
      >
        <PantryForm onSuccess={() => setIsAddingItem(false)} />
      </BottomSheet>

      <BottomSheet
        isOpen={isViewingItem}
        onClose={() => { setIsViewingItem(false); setSelectedItem(null) }}
        onSwipeLeft={() => navigateItem('next')}
        onSwipeRight={() => navigateItem('prev')}
        animationKey={selectedItem?.id}
        title="Item details"
        subtitle="Stock levels, value and history"
      >
        {selectedItem && (
          <PantryDetails 
            item={selectedItem} 
            onRestock={() => {
              setIsViewingItem(false)
              setIsRestockForm(true)
              setIsEditingItem(true)
              setIsNavigatingFromDetails(true)
            }}
          />
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={isEditingItem}
        onClose={() => { 
          setIsEditingItem(false); 
          setSelectedItem(null);
          setIsRestockForm(false);
          setIsNavigatingFromDetails(false);
        }}
        onBack={isNavigatingFromDetails ? () => {
          setIsEditingItem(false);
          setIsRestockForm(false);
          setIsNavigatingFromDetails(false);
          setIsViewingItem(true);
        } : undefined}
        onSwipeLeft={() => navigateItem('next')}
        onSwipeRight={() => navigateItem('prev')}
        animationKey={selectedItem?.id}
        title={isRestockForm ? "Restock Item" : "Edit Pantry Item"}
        subtitle={isRestockForm ? "Restock ingredient stock" : "Update ingredient stock and details"}
      >
        {selectedItem && (
          <PantryForm
            onSuccess={() => { 
              setIsEditingItem(false); 
              setIsRestockForm(false);
              if (isNavigatingFromDetails) {
                setIsViewingItem(true);
                setIsNavigatingFromDetails(false);
              } else {
                setSelectedItem(null);
              }
            }}
            initialData={selectedItem}
            isRestock={isRestockForm}
          />
        )}
      </BottomSheet>


      <BottomSheet
        isOpen={isShowingSummary}
        onClose={() => {
          setIsShowingSummary(false)
          setTimeout(() => {
            setSummaryView('main')
            setSelectedItem(null)
          }, 300)
        }}
        onBack={
          summaryView === 'edit' ? () => setSummaryView('details') :
          summaryView === 'details' ? () => setSummaryView('main') : undefined
        }
        onSwipeLeft={() => {
          if (summaryView !== 'main') {
            const lowStockItems = pantryItems.filter(i => i.status !== 'In Stock')
            navigateItem('next', lowStockItems)
          }
        }}
        onSwipeRight={() => {
          if (summaryView !== 'main') {
            const lowStockItems = pantryItems.filter(i => i.status !== 'In Stock')
            navigateItem('prev', lowStockItems)
          }
        }}
        animationKey={summaryView === 'main' ? 'main' : selectedItem?.id}
        title={
          summaryView === 'main' ? "Pantry Analytics" :
          summaryView === 'details' ? "Item Details" : "Restock Item"
        }
        subtitle={
          summaryView === 'main' ? "Overview of your supplies and shopping list" :
          summaryView === 'details' ? "Stock levels and history" : "Restock ingredient stock"
        }
      >
        <div className="flex flex-col gap-4">
          {summaryView === 'main' && (
            <PantrySummary 
              items={pantryItems} 
              history={pantryHistory} 
              onRestock={(item) => {
                setSelectedItem(item)
                setSummaryView('edit')
              }}
              onViewDetails={(item) => {
                setSelectedItem(item)
                setSummaryView('details')
              }}
            />
          )}

          {summaryView === 'details' && selectedItem && (
            <PantryDetails 
              item={selectedItem} 
              onRestock={() => setSummaryView('edit')}
            />
          )}


          {summaryView === 'edit' && selectedItem && (
            <PantryForm
              onSuccess={() => setSummaryView('details')}
              initialData={selectedItem}
              isRestock={true}
            />
          )}
        </div>
      </BottomSheet>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) deletePantryItem(itemToDelete)
          setItemToDelete(null)
        }}
        title="Remove item?"
        message="Are you sure you want to remove this item from your pantry? This will delete all its stock history."
      />
    </div>
  )
}
