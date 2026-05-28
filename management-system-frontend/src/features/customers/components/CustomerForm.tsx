import React, { useState } from 'react'
import { useCustomers } from '../api/useCustomers.ts'
import { User, Phone, Mail, MapPin, AlertCircle } from 'lucide-react'
import type { Customer } from '@backend/lib/db'
import { isValidGhanaPhone, formatPhone, sanitizeInput } from '@shared/utils/commonUtils.ts'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'
import { useNotification } from '@shared/ui/molecules/Notification'

interface CustomerFormProps {
  onSuccess: () => void
  initialData?: Customer
  onDirtyChange?: (isDirty: boolean) => void
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ onSuccess, initialData, onDirtyChange }) => {
  const { notify } = useNotification()
  const { addCustomer, updateCustomer } = useCustomers()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '+233 ',
    email: initialData?.email || '',
    address: initialData?.address || ''
  })

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!isValidGhanaPhone(formData.phone)) {
      newErrors.phone = 'Must be 10 digits starting with 0'
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    const sanitizedData = {
      name: sanitizeInput(formData.name),
      phone: sanitizeInput(formData.phone),
      email: sanitizeInput(formData.email),
      address: sanitizeInput(formData.address)
    }

    try {
      if (initialData?.id) {
        await updateCustomer({
          id: initialData.id,
          changes: sanitizedData
        })
        notify({
          type: 'update',
          title: 'Customer Updated',
          message: `Customer ${sanitizedData.name} successfully updated!`
        })
      } else {
        await addCustomer({
          ...sanitizedData,
          totalOrders: 0,
          status: 'Inactive',
          createdAt: new Date()
        })
        notify({
          type: 'add',
          title: 'Customer Created',
          message: `Customer ${sanitizedData.name} successfully added!`
        })
      }
      onSuccess()
    } catch (err: any) {
      notify({
        type: 'error',
        message: err?.message || `Failed to save customer ${formData.name}.`
      })
    }
  }

  const hasChanges = React.useMemo(() => {
    if (!initialData) return true
    return (
      formData.name.trim() !== (initialData.name || '').trim() ||
      formData.phone.trim() !== (initialData.phone || '').trim() ||
      formData.email.trim() !== (initialData.email || '').trim() ||
      formData.address.trim() !== (initialData.address || '').trim()
    )
  }, [initialData, formData])

  const isDirty = React.useMemo(() => {
    if (initialData) {
      return hasChanges
    }
    return (
      formData.name.trim() !== '' ||
      formData.phone.replace('+233', '').trim() !== '' ||
      formData.email.trim() !== '' ||
      formData.address.trim() !== ''
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

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2">
          <User size={14} /> Full Name
        </label>
        <input
          type="text"
          placeholder="Enter customer name"
          className={`w-full px-4 h-[46px] bg-brand-cream/10 border ${errors.name ? 'border-red-500 bg-red-50/10' : 'border-brand-chocolate/10'} rounded-md focus:outline-none focus:ring-1 ${errors.name ? 'focus:ring-red-500' : 'focus:ring-feature-customers'}`}
          value={formData.name}
          onChange={(e) => {
            const value = e.target.value.replace(/[0-9]/g, '') // Strip numbers
            setFormData({ ...formData, name: value })
            if (errors.name) setErrors({ ...errors, name: '' })
          }}
        />
        {errors.name && (
          <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
            <AlertCircle size={10} /> {errors.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2">
          <Phone size={14} /> Phone Number
        </label>
        <div className={`flex items-center gap-3 w-full px-4 h-[46px] bg-brand-cream/10 border ${errors.phone ? 'border-red-500 bg-red-50/10' : 'border-brand-chocolate/10'} rounded-md focus-within:ring-1 ${errors.phone ? 'focus-within:ring-red-500' : 'focus-within:ring-feature-customers'}`}>
          <span className="text-sm text-brand-chocolate/40 border-r border-brand-chocolate/10 pr-3">+233</span>
          <input
            type="tel"
            placeholder="eg. 055 452 0532"
            className="flex-1 bg-transparent border-none p-0 focus:outline-none text-brand-chocolate placeholder:text-brand-chocolate/20"
            value={formData.phone.replace('+233 ', '')}
            onChange={(e) => {
              let val = e.target.value.replace(/[^0-9]/g, '')
              const maxDigits = val.startsWith('0') ? 10 : 9
              val = val.slice(0, maxDigits)
              
              setFormData({ ...formData, phone: val ? formatPhone(val) : '' })
              if (errors.phone) setErrors({ ...errors, phone: '' })
            }}
          />
        </div>
        {errors.phone && (
          <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
            <AlertCircle size={10} /> {errors.phone}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2">
          <Mail size={14} /> Email Address (Optional)
        </label>
        <input
          type="email"
          placeholder="customer@email.com"
          className="w-full px-4 h-[46px] bg-brand-cream/10 border border-brand-chocolate/10 rounded-md focus:outline-none focus:ring-1 focus:ring-feature-customers"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold  text-brand-chocolate/40 flex items-center gap-2">
          <MapPin size={14} /> Delivery Address
        </label>
        <textarea
          rows={2}
          placeholder="Street, Hse No, Accra/City"
          className={`w-full p-4 bg-brand-cream/10 border ${errors.address ? 'border-red-500 bg-red-50/10' : 'border-brand-chocolate/10'} rounded-md focus:outline-none focus:ring-1 ${errors.address ? 'focus:ring-red-500' : 'focus:ring-feature-customers'}`}
          value={formData.address}
          onChange={(e) => {
            setFormData({ ...formData, address: e.target.value })
            if (errors.address) setErrors({ ...errors, address: '' })
          }}
        />
        {errors.address && (
          <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
            <AlertCircle size={10} /> {errors.address}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 bg-transparent pt-2 pb-3 z-10">
        <button 
          type="submit" 
          disabled={!!initialData && !hasChanges}
          className="btn-primary w-full bg-feature-customers hover:bg-feature-customers/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {initialData?.id ? 'Update Customer' : 'Add Customer'}
        </button>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title={initialData?.id ? 'Update Customer?' : 'Add Customer?'}
        message={initialData?.id
          ? `Save the updated details for ${formData.name}?`
          : `Add ${formData.name} as a new customer?`
        }
        confirmText={initialData?.id ? 'Yes, Update' : 'Yes, Add'}
        isDestructive={false}
        watermarkType="update"
      />
    </form>
  )
}
