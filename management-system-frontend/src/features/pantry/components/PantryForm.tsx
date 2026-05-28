import React, { useState } from 'react'
import { 
  Package, Tag, Hash, 
  AlertCircle, ChevronDown, 
  Plus, Wallet, StickyNote 
} from 'lucide-react'
import { motion } from 'framer-motion'
import { usePantry } from '../api/usePantry'
import { useClickOutside } from '@backend/lib/hooks'
import type { PantryItem } from '@backend/lib/db'
import { determinePantryStatus } from '@shared/utils/pantryAnalytics'
import { formatNumber } from '@shared/utils/formatters'
import { sanitizeInput } from '@shared/utils/commonUtils'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'
import { useNotification } from '@shared/ui/molecules/Notification'
import { QuantityStepper } from '@shared/ui/atoms/QuantityStepper'

interface PantryFormProps {
  onSuccess: () => void
  initialData?: PantryItem
  isRestock?: boolean
  onDirtyChange?: (isDirty: boolean) => void
}


export const PantryForm: React.FC<PantryFormProps> = ({ onSuccess, initialData, isRestock, onDirtyChange }) => {
  const { notify } = useNotification()
  const { pantryItems, addPantryItem, updatePantryItem, updateStock } = usePantry()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfirm, setShowConfirm] = useState(false)
  const isEditing = !!initialData && !isRestock
  
  const [formData, setFormData] = useState({

    name: initialData?.name || '',
    category: initialData?.category || '',
    currentStock: initialData?.currentStock || 0,
    minStock: initialData?.minStock || 5,
    unit: initialData?.unit || 'kg',
    lastPrice: initialData ? formatNumber(initialData.lastPrice || 0) : '0.00',
    notes: initialData?.notes || ''

  })

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false)

  const categoryRef = useClickOutside(() => setIsCategoryDropdownOpen(false))
  const unitRef = useClickOutside(() => setIsUnitDropdownOpen(false))

  const categories = ['Ingredients', 'Packaging', 'Cleaning', 'Toppings', 'Other']
  const units = ['kg', 'g', 'liters', 'ml', 'crates', 'bags', 'pieces', 'boxes']

  const isDuplicate = !initialData && pantryItems.some(i => 
    i.name.toLowerCase().trim() === formData.name.toLowerCase().trim() &&
    i.category === formData.category &&
    i.unit === formData.unit &&
    parseFloat(formData.lastPrice) === i.lastPrice
  )

  const hasChanges = React.useMemo(() => {
    if (!initialData) return true
    return (
      formData.name.trim() !== initialData.name.trim() ||
      formData.category !== initialData.category ||
      Number(formData.currentStock) !== Number(initialData.currentStock) ||
      Number(formData.minStock) !== Number(initialData.minStock) ||
      formData.unit !== initialData.unit ||
      formatNumber(parseFloat(formData.lastPrice)) !== formatNumber(initialData.lastPrice || 0) ||
      (formData.notes || '').trim() !== (initialData.notes || '').trim()
    )
  }, [initialData, formData])

  const isDirty = React.useMemo(() => {
    if (initialData) {
      return hasChanges
    }
    return (
      formData.name.trim() !== '' ||
      formData.category !== '' ||
      formData.currentStock !== 0 ||
      formData.minStock !== 5 ||
      formData.unit !== 'kg' ||
      formData.lastPrice !== '0.00' ||
      formData.notes.trim() !== ''
    )
  }, [initialData, hasChanges, formData])

  React.useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])


  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Item name is required'
    if (!formData.category) newErrors.category = 'Please select a category'
    if (formData.currentStock < 0) newErrors.currentStock = 'Stock cannot be negative'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    const status = determinePantryStatus(formData.currentStock, formData.minStock)

    const itemData = {
      ...formData,
      name: sanitizeInput(formData.name),
      category: sanitizeInput(formData.category),
      unit: sanitizeInput(formData.unit),
      notes: sanitizeInput(formData.notes),
      lastPrice: parseFloat(formData.lastPrice) || 0,
      maxStock: formData.currentStock,
      status,
      updatedAt: new Date(),
      createdAt: initialData?.createdAt || new Date()
    }

    try {
      if (initialData?.id) {
        if (isRestock) {
          // If it is a Restock transaction, update metadata and record stock via updateStock so a Restock history entry is created!
          await updatePantryItem({ 
            id: initialData.id, 
            changes: {
              lastPrice: parseFloat(formData.lastPrice) || 0,
              notes: sanitizeInput(formData.notes),
              maxStock: Math.max(initialData.maxStock || 0, formData.currentStock)
            }
          })
          await updateStock(initialData.id, formData.currentStock, 'Restock')
        } else {
          // Normal Edit
          await updatePantryItem({ id: initialData.id, changes: itemData })
        }
        notify({
          type: 'update',
          title: isRestock ? 'Ingredient Restocked' : 'Ingredient Updated',
          message: isRestock 
            ? `Successfully restocked ${itemData.name}!` 
            : `Ingredient ${itemData.name} successfully updated!`
        })
      } else {
        await addPantryItem(itemData)
        notify({
          type: 'add',
          title: 'Ingredient Added',
          message: `Ingredient ${itemData.name} successfully added!`
        })
      }
      onSuccess()
    } catch (err: any) {
      notify({
        type: 'error',
        message: err?.message || `Failed to save ingredient ${itemData.name}.`
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setShowConfirm(true)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
          <Package size={14} /> Item Name
        </label>
        <input
          type="text"
          placeholder="e.g. Extra Fine Flour"
          disabled={isRestock}
          className={`w-full px-4 h-[46px] bg-brand-cream/10 border ${errors.name ? 'border-red-500 bg-red-50/10' : 'border-brand-chocolate/10'} rounded-md focus:outline-none focus:ring-1 focus:ring-brand-chocolate ${isRestock ? 'opacity-50 cursor-not-allowed' : ''}`}
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value })
            if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
          }}
        />
        {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Category */}
        <div className="flex flex-col gap-2 relative" ref={categoryRef}>
          <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
            <Tag size={14} /> Category
          </label>
          <button
            type="button"
            disabled={isRestock}
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className={`w-full px-4 h-[46px] bg-brand-cream/10 border border-brand-chocolate/10 rounded-md flex items-center justify-between text-sm ${isRestock ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={formData.category ? 'text-brand-chocolate' : 'text-brand-chocolate/40'}>
              {formData.category || 'Select...'}
            </span>
            <ChevronDown size={14} className="opacity-40" />
          </button>
          {errors.category && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.category}</p>}
          
          {isCategoryDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-brand-surface border border-brand-chocolate/10 rounded-md shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-150">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, category: cat })
                    setIsCategoryDropdownOpen(false)
                    if (errors.category) setErrors(prev => ({ ...prev, category: '' }))
                  }}
                  className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-brand-dough/10 border-b border-brand-chocolate/5 last:border-0"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Unit */}
        <div className="flex flex-col gap-2 relative" ref={unitRef}>
          <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
            <Hash size={14} /> Unit
          </label>
          <button
            type="button"
            disabled={isRestock}
            onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
            className={`w-full px-4 h-[46px] bg-brand-cream/10 border border-brand-chocolate/10 rounded-md flex items-center justify-between text-sm ${isRestock ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-brand-chocolate">{formData.unit}</span>
            <ChevronDown size={14} className="opacity-40" />
          </button>
          {isUnitDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-brand-surface border border-brand-chocolate/10 rounded-md shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-150">
              {units.map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, unit: u })
                    setIsUnitDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-brand-dough/10 border-b border-brand-chocolate/5 last:border-0"
                >
                  {u}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Current Stock */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
            <Plus size={14} /> Current Stock ({formData.unit})
          </label>
          <QuantityStepper
            value={formData.currentStock}
            onChange={(qty) => setFormData({ ...formData, currentStock: qty })}
            min={0}
            max={99999}
            disabled={isEditing}
            className={`w-full h-[46px] bg-brand-cream/10 ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>

        {/* Min Stock */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
            <AlertCircle size={14} /> Low Stock Alert at
          </label>
          <QuantityStepper
            value={formData.minStock}
            onChange={(qty) => setFormData({ ...formData, minStock: qty })}
            min={0}
            max={99999}
            disabled={isRestock}
            className={`w-full h-[46px] bg-brand-cream/10 ${isRestock ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>
      </div>

      {/* Last Price */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
          <Wallet size={14} /> Last Purchase Price (GH₵)
        </label>
        <QuantityStepper
          value={parseFloat(formData.lastPrice) || 0}
          onChange={(price) => setFormData({ ...formData, lastPrice: formatNumber(price) })}
          min={0}
          step={1}
          isDecimal={true}
          placeholder="0.00"
          disabled={isEditing}
          className={`w-full h-[46px] bg-brand-cream/10 font-bold text-emerald-600 ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
        />

      </div>

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
          <StickyNote size={14} /> Notes
        </label>
        <textarea
          placeholder="e.g. Preferred brand or vendor..."
          className="w-full p-4 bg-brand-cream/10 border border-brand-chocolate/10 rounded-md focus:outline-none min-h-[80px] resize-none text-sm"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      {isDuplicate && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-md mt-2"
        >
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-amber-900">Smart Merge detected</p>
            <p className="text-[10px] text-amber-700 leading-tight">
              An item with this name, category, and price already exists. Saving will add this stock to the existing record.
            </p>
          </div>
        </motion.div>
      )}

      <div className="sticky bottom-0 bg-transparent pt-2 pb-3 z-10">
        <button 
          type="submit" 
          disabled={!hasChanges}
          className={`btn-primary w-full h-14 text-lg shadow-xl rounded-md transition-all ${isDuplicate ? 'bg-amber-600 hover:bg-amber-700' : ''} ${!hasChanges ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
        >
          {isRestock ? 'Restock' : initialData ? 'Update Pantry Item' : isDuplicate ? 'Merge to Existing Record' : 'Save to Pantry'}
        </button>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title={isRestock ? 'Confirm Restock?' : initialData ? 'Update Item?' : 'Save to Pantry?'}
        message={isRestock
          ? `Restock "${formData.name}" to ${formData.currentStock} ${formData.unit}?`
          : initialData
            ? `Save the updated details for "${formData.name}"?`
            : isDuplicate
              ? `This will merge with the existing "${formData.name}" record.`
              : `Add "${formData.name}" to your pantry?`
        }
        confirmText={isRestock ? 'Yes, Restock' : initialData ? 'Yes, Update' : 'Yes, Save'}
        isDestructive={false}
        watermarkType="update"
      />

    </form>
  )
}
