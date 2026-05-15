import React, { useState } from 'react'
import { useCustomers } from '../api/useCustomers.ts'
import { User, Phone, Mail, MapPin, AlertCircle } from 'lucide-react'
import { type Customer } from '@backend/lib/db'
import { isValidGhanaPhone, formatPhone } from '@shared/utils/front-end-calculations/commonUtils'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'

interface CustomerFormProps {
  onSuccess: () => void
  initialData?: Customer
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ onSuccess, initialData }) => {
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

  const handleSave = () => {
    if (initialData?.id) {
      updateCustomer({
        id: initialData.id,
        changes: formData
      })
    } else {
      addCustomer({
        ...formData,
        totalOrders: 0,
        status: 'Inactive',
        createdAt: new Date()
      })
    }
    onSuccess()
  }

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
          className={`w-full p-4 bg-brand-cream/10 border ${errors.name ? 'border-red-500 bg-red-50/10' : 'border-brand-chocolate/10'} rounded-md focus:outline-none focus:ring-1 ${errors.name ? 'focus:ring-red-500' : 'focus:ring-feature-customers'}`}
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
        <div className={`flex items-center gap-3 w-full px-4 h-14 bg-brand-cream/10 border ${errors.phone ? 'border-red-500 bg-red-50/10' : 'border-brand-chocolate/10'} rounded-md focus-within:ring-1 ${errors.phone ? 'focus-within:ring-red-500' : 'focus-within:ring-feature-customers'}`}>
          <span className="text-sm text-brand-chocolate/40 border-r border-brand-chocolate/10 pr-3">+233</span>
          <input
            type="tel"
            placeholder="eg. 055 452 0532"
            className="flex-1 bg-transparent border-none p-0 focus:outline-none text-brand-chocolate placeholder:text-brand-chocolate/20"
            value={formData.phone.replace('+233 ', '')}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10) // Only numbers, max 10
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
          className="w-full p-4 bg-brand-cream/10 border border-brand-chocolate/10 rounded-md focus:outline-none focus:ring-1 focus:ring-feature-customers"
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

      <div className="sticky bottom-0 bg-transparent pt-4 pb-2 z-10 border-t border-brand-chocolate/5">
        <button 
          type="submit" 
          disabled={!!initialData && JSON.stringify(formData) === JSON.stringify({
            name: initialData?.name || '',
            phone: initialData?.phone || '',
            email: initialData?.email || '',
            address: initialData?.address || ''
          })}
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
      />
    </form>
  )
}
