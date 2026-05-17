import React, { useState, useEffect, useMemo } from 'react'
import { useOrders } from '../api/useOrders'
import { useCustomers } from '../../customers/api/useCustomers'
import { useProducts } from '../../products/api/useProducts'
import { 
  Calendar as CalendarIcon, User, 
  StickyNote, Search, Plus, 
  Minus, ChevronDown, Wallet, ShoppingCart, Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { CustomerForm } from '../../customers/components/CustomerForm'
import { Calendar } from '@shared/ui/molecules/DateCalendar'
import { SearchBar } from '@shared/ui/molecules/SearchBar'
import { useClickOutside } from '@backend/lib/hooks'
import { useTopBuyers } from '@shared/utils/front-end-calculations/topCustomerAnalytics'
import { calculateOrderTotal } from '@shared/utils/front-end-calculations/orderAnalytics'
import { formatCurrency, formatNumber } from '@shared/utils/front-end-calculations/formatters'
import { generateId, clamp } from '@shared/utils/front-end-calculations/commonUtils'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'


import { db, type Order } from '@backend/lib/db'

interface OrderFormProps {
  onSuccess: () => void
  initialData?: Order
  isAddingNewCustomer: boolean
  setIsAddingNewCustomer: (val: boolean) => void
}

interface OrderItem {
  productId: number
  name: string
  quantity: number
  price: number
}

export const OrderForm: React.FC<OrderFormProps> = ({ 
  onSuccess, 
  initialData, 
  isAddingNewCustomer, 
  setIsAddingNewCustomer 
}) => {
  const { orders, addOrder, updateOrder } = useOrders()
  const { customers } = useCustomers()
  const { products } = useProducts()
  
  const [customerSearch, setCustomerSearch] = useState(initialData?.customerName || '')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfirm, setShowConfirm] = useState(false)
  
  const customerDropdownRef = useClickOutside(() => setIsDropdownOpen(false))
  const productDropdownRef = useClickOutside(() => setIsProductDropdownOpen(false))

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
  }, [customers, customerSearch])

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
  }, [products, productSearch])

  
  // Try to parse initial items if editing
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>(() => {
    if (!initialData || !products.length) return []
    // This is a basic parser for "1x Name, 2x Other"
    const items: OrderItem[] = []
    const parts = initialData.items.split(', ')
    parts.forEach(p => {
      const match = p.match(/(\d+)x (.+)/)
      if (match) {
        const qty = parseInt(match[1])
        const name = match[2]
        const prod = products.find(pr => pr.name === name)
        if (prod) {
          items.push({
            productId: prod.id!,
            name: prod.name,
            quantity: qty,
            price: prod.price
          })
        }
      }
    })
    return items
  })

  const [formData, setFormData] = useState({
    customerId: initialData?.customerId.toString() || '',
    customerName: initialData?.customerName || '',
    items: initialData?.items || '',
    amount: initialData ? formatNumber(initialData.amount) : '0.00',
    deadline: initialData?.deadline.toISOString() || '',
    notes: initialData?.notes || ''
  })

  // Update selectedItems when products load if editing
  useEffect(() => {
    if (initialData && products.length > 0 && selectedItems.length === 0) {
      const items: OrderItem[] = []
      const parts = initialData.items.split(', ')
      parts.forEach(p => {
        const match = p.match(/(\d+)x (.+)/)
        if (match) {
          const qty = parseInt(match[1])
          const name = match[2]
          const prod = products.find(pr => pr.name === name)
          if (prod) {
            items.push({
              productId: prod.id!,
              name: prod.name,
              quantity: qty,
              price: prod.price
            })
          }
        }
      })
      if (items.length > 0) setSelectedItems(items)
    }
  }, [products, initialData])

  // Auto-calculate amount when items change
  useEffect(() => {
    const validItems = selectedItems.filter(item => item.quantity > 0)
    const total = calculateOrderTotal(validItems)
    const itemsDescription = validItems.map(item => `${item.quantity}x ${item.name}`).join(', ')
    
    setFormData(prev => ({ 
      ...prev, 
      amount: formatNumber(total),
      items: itemsDescription
    }))

    if (validItems.length > 0 && errors.items) {
      setErrors(prev => ({ ...prev, items: '' }))
    }
  }, [selectedItems, errors.items])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.customerId) newErrors.customerId = 'Please select a customer'
    
    const validItems = selectedItems.filter(item => item.quantity > 0)
    if (validItems.length === 0) {
      newErrors.items = 'Please add at least one item with a quantity'
    }
    
    if (!formData.deadline) newErrors.deadline = 'Please set a deadline'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSelectCustomer = (id: string, name: string) => {
    setFormData({ ...formData, customerId: id, customerName: name })
    setCustomerSearch(name)
    setIsDropdownOpen(false)
    setErrors(prev => ({ ...prev, customerId: '' }))
  }

  const handleAddItem = (product: typeof products[0]) => {
    const existing = selectedItems.find(item => item.productId === product.id)
    if (existing) {
      handleUpdateQuantity(product.id!, existing.quantity + 1)
    } else {
      setSelectedItems([...selectedItems, {
        productId: product.id!,
        name: product.name,
        quantity: 1,
        price: product.price
      }])
    }
    setIsProductDropdownOpen(false)
    if (errors.items) setErrors({ ...errors, items: '' })
  }

  const handleUpdateQuantity = (productId: number, newQty: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.productId === productId ? { ...item, quantity: clamp(newQty, 0, 99) } : item
    ))
  }

  const handleRemoveItem = (productId: number) => {
    setSelectedItems(selectedItems.filter(item => item.productId !== productId))
  }

  const generateOrderNumber = () => {
    return `#MBB-${generateId(5)}`
  }

  const handleSave = async () => {
    if (initialData) {
      updateOrder({
        id: initialData.id!,
        changes: {
          ...formData,
          orderNumber: initialData.orderNumber,
          customerId: Number(formData.customerId),
          amount: parseFloat(formData.amount),
          deadline: new Date(formData.deadline)
        }
      })
    } else {
      // Guaranteed unique order number check
      let uniqueOrderNumber = generateOrderNumber()
      let isUnique = false
      let attempts = 0
      
      while (!isUnique && attempts < 10) {
        const existing = await db.orders.where('orderNumber').equals(uniqueOrderNumber).count()
        if (existing === 0) {
          isUnique = true
        } else {
          uniqueOrderNumber = generateOrderNumber()
          attempts++
        }
      }

      addOrder({
        ...formData,
        orderNumber: uniqueOrderNumber,
        customerId: Number(formData.customerId),
        amount: parseFloat(formData.amount),
        deadline: new Date(formData.deadline),
        status: 'Pending',
        createdAt: new Date()
      })
    }
    onSuccess()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setShowConfirm(true)
  }

  const topBuyers = useTopBuyers(orders, customers, 4)

  if (isAddingNewCustomer) {
    return (
      <div className="flex flex-col gap-4">
        <CustomerForm 
          onSuccess={() => setIsAddingNewCustomer(false)} 
          initialData={{ name: customerSearch } as any}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Customer Search */}
      <div className="flex flex-col gap-2 relative border-brand-chocolate/10 border-b pb-4" ref={customerDropdownRef}>
        <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2">
          <User size={14} /> Customer
        </label>
        <SearchBar 
          value={customerSearch} 
          onChange={(val) => {
            setCustomerSearch(val)
            setIsDropdownOpen(true)
          }} 
          placeholder="Search customers..." 
          onFocus={() => {
            setIsDropdownOpen(true)
            setIsProductDropdownOpen(false)
          }}
        />
        
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-brand-surface border border-brand-chocolate/10 rounded-md shadow-2xl z-50 overflow-y-auto max-h-[220px] no-scrollbar">
            {!customerSearch ? (
              <div className="p-1">
                {topBuyers.length > 0 ? (
                  <>
                    <p className="text-[10px] font-bold text-brand-chocolate/30 px-3 py-2 tracking-widest">Top Buyers</p>
                    {topBuyers.map(tb => (
                      <button
                        key={tb.customer.id}
                        type="button"
                        onClick={() => handleSelectCustomer(tb.customer.id!.toString(), tb.customer.name)}
                        className="w-full text-left px-3 py-2.5 hover:bg-brand-chocolate/5 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-brand-chocolate">{tb.customer.name}</span>
                          <span className="text-[10px] text-brand-chocolate/40">{tb.customer.phone}</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-feature-orders/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus size={12} className="text-feature-orders" />
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-brand-chocolate/40">Search to find a customer</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-1">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(customer => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleSelectCustomer(customer.id!.toString(), customer.name)}
                        className="w-full text-left px-3 py-2.5 hover:bg-brand-chocolate/5 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-brand-chocolate">{customer.name}</span>
                          <span className="text-[10px] text-brand-chocolate/40">{customer.phone}</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-feature-orders/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus size={12} className="text-feature-orders" />
                        </div>
                      </button>
                    ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-brand-chocolate/40 mb-3">No customer found for "{customerSearch}"</p>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCustomer(true)}
                      className="btn-primary w-full text-xs py-2 rounded-md"
                    >
                      <Plus size={14} /> Add "{customerSearch}"
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {errors.customerId && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.customerId}</p>}
      </div>

      {/* Order Items Builder */}
      <div className="flex flex-col gap-3" ref={productDropdownRef}>
        <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2 justify-between">
          <span className="flex items-center gap-2"><ShoppingCart size={14} /> Order Items</span>
          <button 
            type="button" 
            onClick={() => {
              setIsProductDropdownOpen(!isProductDropdownOpen)
              setIsDropdownOpen(false)
            }}
            className="text-brand-chocolate font-bold flex items-center gap-1 hover:opacity-60 transition-opacity"
          >
            <Plus size={14} /> Add Bite
          </button>
        </label>

        {/* Product Selection Dropdown */}
        {isProductDropdownOpen && (
          <div className="bg-brand-dough/5 border border-brand-chocolate/10 rounded-md p-2 flex flex-col gap-2 animate-in slide-in-from-top-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-chocolate" size={14} />
              <input
                type="text"
                placeholder="search product..."
                className="w-full pl-10 pr-4 py-2.5 bg-brand-surface border border-brand-chocolate/10 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-dough shadow-sm"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[200px] overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
              <p className="text-[10px] font-bold text-brand-chocolate/40 px-2 pt-1 pb-1 ">Select a product</p>
              {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddItem(p)}
                    className="flex items-center justify-between p-3 bg-brand-surface border border-brand-chocolate/5 rounded hover:bg-brand-dough/10 transition-colors group"
                  >
                    <span className="text-xs font-bold text-brand-chocolate">{p.name}</span>
                    <span className="text-[10px] font-medium text-brand-chocolate/40 group-hover:text-brand-chocolate">{formatCurrency(p.price)}</span>
                  </button>
                ))}
              {filteredProducts.length === 0 && (
                <p className="text-[10px] text-center py-6 text-brand-chocolate/40 font-medium italic">No products found</p>
              )}
            </div>
          </div>
        )}

        {/* Selected Items List */}
        <div className="flex flex-col gap-2">
          {selectedItems.length === 0 ? (
            <div 
            onClick={() => setIsProductDropdownOpen(true)}
            className="py-8 border-2 border-dashed border-brand-chocolate/10 rounded-md flex flex-col items-center justify-center text-brand-chocolate/30 cursor-pointer active:bg-brand-chocolate/5 transition-colors"
          >
            <Plus size={22} strokeWidth={1.5} className="mb-1 text-brand-chocolate/20" />
            <ShoppingCart size={20} strokeWidth={1} />
            <p className="text-[10px] font-bold mt-2">No items added yet</p>
            <p className="text-[9px] mt-0.5 text-brand-chocolate/20">Tap to add a product</p>
          </div>
          ) : (
            selectedItems.map(item => (
              <div key={item.productId} className="flex items-center justify-between p-3 bg-brand-cream/10 border border-brand-chocolate/5 rounded-md group">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-brand-chocolate">{item.name}</span>
                  <span className="text-[10px] text-brand-chocolate/40">{formatCurrency(item.price)} / each</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-brand-surface border border-brand-chocolate/10 rounded-md p-0.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 0}
                      className="w-6 h-6 flex items-center justify-center text-brand-chocolate hover:bg-brand-dough/10 rounded transition-colors disabled:opacity-20"
                    >
                      <Minus size={12} />
                    </button>
                    <input 
                      type="number" 
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 0)}
                      className="w-8 text-center text-xs font-bold text-brand-chocolate bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center bg-brand-chocolate text-white rounded transition-transform active:scale-90"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.productId)}
                    className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
          {errors.items && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.items}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-brand-chocolate/10 border-t pt-4">
        {/* Amount (Auto-calculated) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2">
            <Wallet size={14} /> Total Amount
          </label>
          <div className="flex items-center px-4 h-14 bg-brand-chocolate/5 border border-brand-chocolate/10 rounded-md">
            <span className="text-sm font-bold text-brand-chocolate">{formatCurrency(parseFloat(formData.amount) || 0)}</span>
          </div>
        </div>

        {/* Custom Deadline Trigger */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2">
            <CalendarIcon size={14} /> Deadline
          </label>
          <button
            type="button"
            onClick={() => {
              setIsCalendarOpen(true)
              setIsDropdownOpen(false)
              setIsProductDropdownOpen(false)
            }}
            className={`w-full px-3 h-14 text-xs font-medium flex items-center justify-between bg-brand-cream/10 border ${errors.deadline ? 'border-red-500' : 'border-brand-chocolate/10'} rounded-md focus:outline-none`}
          >
            {formData.deadline ? format(new Date(formData.deadline), 'MMM d, yyyy') : 'Pick date'}
            <ChevronDown size={14} className="opacity-40" />
          </button>
        </div>
      </div>

      {/* Calendar */}
      {isCalendarOpen && (
        <Calendar
          title="Select Deadline"
          value={formData.deadline}
          onChange={(iso) => {
            setFormData({ ...formData, deadline: iso })
            if (errors.deadline) setErrors({ ...errors, deadline: '' })
          }}
          onClose={() => setIsCalendarOpen(false)}
        />
      )}

      <div className="flex flex-col gap-2 border-brand-chocolate/10 border-t pt-4">
        <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2">
          <StickyNote size={14} /> Notes (Optional)
        </label>
        <input
          type="text"
          placeholder="Special requests, packaging, etc."
          className="w-full p-4 h-14 bg-brand-cream/10 border border-brand-chocolate/10 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-dough"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="sticky bottom-0 bg-transparent pt-4 pb-2 z-10 border-t border-brand-chocolate/5 mt-4">
        <button 
          type="submit" 
          disabled={!!initialData && 
            formData.customerId === initialData.customerId.toString() &&
            formData.deadline === initialData.deadline.toISOString() &&
            formData.notes === initialData.notes &&
            formData.items === initialData.items
          }
          className="btn-primary w-full h-14 text-lg shadow-xl rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {initialData ? 'Update Order' : 'Create Order'}
        </button>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title={initialData ? 'Update Order?' : 'Create Order?'}
        message={initialData 
          ? `Are you sure you want to save the changes to ${formData.customerName}'s order?`
          : `This will create a new order for ${formData.customerName}. Continue?`
        }
        confirmText={initialData ? 'Yes, Update' : 'Yes, Create'}
        isDestructive={false}
      />
    </form>
  )
}
