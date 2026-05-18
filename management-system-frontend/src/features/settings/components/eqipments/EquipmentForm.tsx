import React, { useState} from 'react'
import { useEquipment } from '../../api/equipments-api/useEquipment'
import { 
  Wrench, Tag, Activity, Calendar as CalendarIcon, 
  Wallet, Hash, StickyNote, AlertCircle,
  ChevronDown
} from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@shared/ui/molecules/calender/DateCalendar'
import { useClickOutside } from '@backend/lib/hooks'
import { formatNumber } from '@shared/utils/formatters'
import type { Equipment } from '@backend/lib/db'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'
import { useNotification } from '@shared/ui/molecules/Notification'
import { sanitizeInput } from '@shared/utils/commonUtils'
import { QuantityStepper } from '@shared/ui/atoms/QuantityStepper'


interface EquipmentFormProps {
  onSuccess: () => void
  initialData?: Equipment
  onDirtyChange?: (isDirty: boolean) => void
}

export const EquipmentForm: React.FC<EquipmentFormProps> = ({ onSuccess, initialData, onDirtyChange }) => {
  const { notify } = useNotification()
  const { addEquipment, updateEquipment } = useEquipment()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfirm, setShowConfirm] = useState(false)
  const safeIsoString = (val: any) => {
    if (!val) return ''
    const d = new Date(val)
    return isNaN(d.getTime()) ? '' : d.toISOString()
  }

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    status: initialData?.status || '',
    purchaseDate: safeIsoString(initialData?.purchaseDate),
    lastMaintained: safeIsoString(initialData?.lastMaintained),
    price: initialData ? formatNumber(initialData.price || 0) : '0.00',
    serialNumber: initialData?.serialNumber || '',
    notes: initialData?.notes || '',
    createdAt: initialData?.createdAt ? new Date(initialData.createdAt).toISOString() : new Date().toISOString()
  })

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [isPurchaseCalendarOpen, setIsPurchaseCalendarOpen] = useState(false)
  const [isMaintainedCalendarOpen, setIsMaintainedCalendarOpen] = useState(false)

  const categoryRef = useClickOutside(() => setIsCategoryDropdownOpen(false))
  const statusRef = useClickOutside(() => setIsStatusDropdownOpen(false))


  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Equipment name is required'
    if (!formData.category.trim()) newErrors.category = 'Category is required'
    if (!formData.status) newErrors.status = 'Status is required'
    if (!formData.purchaseDate) newErrors.purchaseDate = 'Purchase date is required'
    
    const parsedPrice = parseFloat(formData.price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      newErrors.price = 'Price is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    const equipmentData = {
      name: sanitizeInput(formData.name),
      category: sanitizeInput(formData.category),
      status: formData.status as any,
      purchaseDate: new Date(formData.purchaseDate),
      ...(formData.lastMaintained ? { lastMaintained: new Date(formData.lastMaintained) } : {}),
      price: parseFloat(formData.price),
      serialNumber: sanitizeInput(formData.serialNumber),
      notes: sanitizeInput(formData.notes),
      createdAt: new Date(formData.createdAt)
    }

    try {
      if (initialData?.id) {
        await updateEquipment({ id: initialData.id, changes: equipmentData })
        notify({
          type: 'update',
          title: 'Equipment Updated',
          message: `Equipment ${formData.name} successfully updated!`
        })
      } else {
        await addEquipment(equipmentData)
        notify({
          type: 'add',
          title: 'Equipment Added',
          message: `Equipment ${formData.name} successfully added!`
        })
      }
      onSuccess()
    } catch (err: any) {
      notify({
        type: 'error',
        message: err?.message || `Failed to save equipment ${formData.name}.`
      })
    }
  }

  const hasChanges = React.useMemo(() => {
    if (!initialData) return true
    
    const initialPrice = initialData ? formatNumber(initialData.price || 0) : '0.00'
    const initialPurchaseDate = safeIsoString(initialData?.purchaseDate)
    const initialLastMaintained = safeIsoString(initialData?.lastMaintained)

    return (
      formData.name.trim() !== (initialData.name || '').trim() ||
      formData.category !== (initialData.category || '') ||
      formData.status !== (initialData.status || '') ||
      formData.purchaseDate !== initialPurchaseDate ||
      formData.lastMaintained !== initialLastMaintained ||
      formData.price !== initialPrice ||
      (formData.serialNumber || '').trim() !== (initialData.serialNumber || '').trim() ||
      (formData.notes || '').trim() !== (initialData.notes || '').trim()
    )
  }, [initialData, formData])

  const isDirty = React.useMemo(() => {
    if (initialData) {
      return hasChanges
    }
    return (
      formData.name.trim() !== '' ||
      formData.category.trim() !== '' ||
      formData.status !== '' ||
      formData.price !== '0.00' ||
      formData.serialNumber.trim() !== '' ||
      formData.notes.trim() !== ''
    )
  }, [initialData, hasChanges, formData])

  React.useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setShowConfirm(true)
  }

  const categories = ['Baking', 'Cooling', 'Prep', 'Cleaning', 'Storage', 'Display']
  const statuses = ['Operational', 'Maintenance', 'Broken']

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
            <Wrench size={14} /> Equipment name
          </label>
          <input
            type="text"
            placeholder="e.g. Industrial Oven"
            className={`w-full p-4 h-14 bg-brand-cream/10 border ${errors.name ? 'border-red-500 bg-red-50/10' : 'border-brand-chocolate/10'} rounded-md focus:outline-none focus:ring-1 focus:ring-brand-chocolate`}
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value })
              if (errors.name) setErrors({ ...errors, name: '' })
            }}
          />
          {errors.name && (
            <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
              <AlertCircle size={10} /> {errors.name}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 relative">
          {/* Category Dropdown */}
          <div className="flex flex-col gap-2 relative" ref={categoryRef}>
            <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
              <Tag size={14} /> Category
            </label>
            <button
              type="button"
              onClick={() => {
                setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                setIsStatusDropdownOpen(false)
              }}
              className={`w-full px-4 h-14 bg-brand-cream/10 border ${errors.category ? 'border-red-500' : 'border-brand-chocolate/10'} rounded-md flex items-center justify-between text-sm`}
            >
              <span className={formData.category ? 'text-brand-chocolate' : 'text-brand-chocolate/40'}>
                {formData.category || 'Select...'}
              </span>
              <ChevronDown size={14} className="opacity-40" />
            </button>
            {isCategoryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-brand-surface border border-brand-chocolate/10 rounded-md shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-150">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { 
                      setFormData({ ...formData, category: cat })
                      setIsCategoryDropdownOpen(false)
                      if (errors.category) setErrors({ ...errors, category: '' })
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-brand-dough/10 border-b border-brand-chocolate/5 last:border-0"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
            {errors.category && (
              <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                <AlertCircle size={10} /> {errors.category}
              </p>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="flex flex-col gap-2 relative" ref={statusRef}>
            <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
              <Activity size={14} /> Current status
            </label>
            <button
              type="button"
              onClick={() => {
                setIsStatusDropdownOpen(!isStatusDropdownOpen)
                setIsCategoryDropdownOpen(false)
              }}
              className={`w-full px-4 h-14 bg-brand-cream/10 border ${errors.status ? 'border-red-500' : 'border-brand-chocolate/10'} rounded-md flex items-center justify-between text-sm`}
            >
              <span className={formData.status ? 'text-brand-chocolate' : 'text-brand-chocolate/30'}>
                {formData.status || 'Select status...'}
              </span>
              <ChevronDown size={14} className="opacity-40" />
            </button>
            {isStatusDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-brand-surface border border-brand-chocolate/10 rounded-md shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-150">
                {statuses.map(stat => (
                  <button
                    key={stat}
                    type="button"
                    onClick={() => { 
                      setFormData({ ...formData, status: stat as any })
                      setIsStatusDropdownOpen(false)
                      if (errors.status) setErrors({ ...errors, status: '' })
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-brand-dough/10 border-b border-brand-chocolate/5 last:border-0"
                  >
                    {stat}
                  </button>
                ))}
              </div>
            )}
            {errors.status && (
              <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                <AlertCircle size={10} /> {errors.status}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Purchase Date Calendar Trigger */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
              <CalendarIcon size={14} /> Purchase date
            </label>
            <button
              type="button"
              onClick={() => {
                setIsPurchaseCalendarOpen(true)
                setIsCategoryDropdownOpen(false)
                setIsStatusDropdownOpen(false)
              }}
              className={`w-full px-4 h-14 bg-brand-cream/10 border ${errors.purchaseDate ? 'border-red-500' : 'border-brand-chocolate/10'} rounded-md flex items-center justify-between text-sm`}
            >
              <span className={formData.purchaseDate ? 'text-brand-chocolate' : 'text-brand-chocolate/30'}>
                {formData.purchaseDate ? format(new Date(formData.purchaseDate), 'MMM d, yyyy') : 'Pick date'}
              </span>
              <ChevronDown size={14} className="opacity-40" />
            </button>
            {errors.purchaseDate && (
              <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                <AlertCircle size={10} /> {errors.purchaseDate}
              </p>
            )}
          </div>

          {/* Maintenance Date Calendar Trigger */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
              <CalendarIcon size={14} /> Last maintained
            </label>
            <button
              type="button"
              onClick={() => {
                setIsMaintainedCalendarOpen(true)
                setIsCategoryDropdownOpen(false)
                setIsStatusDropdownOpen(false)
              }}
              className={`w-full px-4 h-14 bg-brand-cream/10 border ${errors.lastMaintained ? 'border-red-500' : 'border-brand-chocolate/10'} rounded-md flex items-center justify-between text-sm`}
            >
              <span className={formData.lastMaintained ? 'text-brand-chocolate' : 'text-brand-chocolate/30'}>
                {formData.lastMaintained ? format(new Date(formData.lastMaintained), 'MMM d, yyyy') : 'Pick date'}
              </span>
              <ChevronDown size={14} className="opacity-40" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Price */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
              <Wallet size={14} /> Price (GH₵)
            </label>
            <QuantityStepper
              value={parseFloat(formData.price) || 0}
              onChange={(price) => {
                setFormData({ ...formData, price: formatNumber(price) })
                if (errors.price && price > 0) setErrors(prev => ({ ...prev, price: '' }))
              }}
              min={0}
              step={1}
              isDecimal={true}
              placeholder="0.00"
              className={`w-full h-14 bg-brand-cream/10 font-bold ${errors.price ? 'border-red-500 text-red-500' : 'text-brand-chocolate'}`}
            />
            {errors.price && (
              <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
                <AlertCircle size={10} /> {errors.price}
              </p>
            )}
          </div>

          {/* Serial Number */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
              <Hash size={14} /> Serial / Model
            </label>
            <input
              type="text"
              placeholder="Optional..."
              className="w-full p-4 h-14 bg-brand-cream/10 border border-brand-chocolate/10 rounded-md focus:outline-none"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-brand-chocolate/40 flex items-center gap-2">
            <StickyNote size={14} /> Notes
          </label>
          <textarea
            placeholder="Any special instructions..."
            className="w-full p-4 bg-brand-cream/10 border border-brand-chocolate/10 rounded-md focus:outline-none min-h-[100px] resize-none"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div className="sticky bottom-0 bg-transparent pt-2 pb-3 z-10">
          <button 
            type="submit" 
            disabled={!!initialData && !hasChanges}
            className="btn-primary w-full h-14 text-lg shadow-xl rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {initialData ? 'Update Equipment' : 'Save Equipment'}
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title={initialData ? 'Update Equipment?' : 'Save Equipment?'}
        message={initialData
          ? `Save the updated details for "${formData.name}"?`
          : `Add "${formData.name}" to your equipment list?`
        }
        confirmText={initialData ? 'Yes, Update' : 'Yes, Save'}
        isDestructive={false}
        watermarkType="update"
      />

      {/* Calendars */}
      {isPurchaseCalendarOpen && (
        <Calendar
          title="Purchase Date"
          value={formData.purchaseDate}
          onChange={(iso) => {
            setFormData({ ...formData, purchaseDate: iso })
            if (errors.purchaseDate) setErrors({ ...errors, purchaseDate: '' })
          }}
          onClose={() => setIsPurchaseCalendarOpen(false)}
        />
      )}
      {isMaintainedCalendarOpen && (
        <Calendar
          title="Last Maintained"
          value={formData.lastMaintained}
          onChange={(iso) => setFormData({ ...formData, lastMaintained: iso })}
          onClose={() => setIsMaintainedCalendarOpen(false)}
        />
      )}
    </div>
  )
}
