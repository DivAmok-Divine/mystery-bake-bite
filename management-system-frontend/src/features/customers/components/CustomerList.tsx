import React, { useState } from 'react'
import { Plus, User, Phone, Mail, Pencil, Trash2, Search, BarChart3, CheckCircle2, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCustomers } from '../api/useCustomers'
import { BottomSheet } from '@shared/ui/molecules/BottomSheet'
import { CustomerForm } from './CustomerForm'
import { CustomerDetails } from './CustomerDetails'
import { SearchBar } from '@shared/ui/molecules/SearchBar'
import { CategoryFilter, FilterToggle } from '@shared/ui/molecules/CategoryFilter'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'
import { CustomerSummary } from './CustomerSummary'
import { EmptyState } from '@shared/ui/molecules/EmptyState'
import type { Customer } from '@backend/lib/db'


export const CustomerList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const [isViewingCustomer, setIsViewingCustomer] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null)
  const [isShowingSummary, setIsShowingSummary] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isNavigatingFromSummary, setIsNavigatingFromSummary] = useState(false)

  const { customers, isLoading, deleteCustomer } = useCustomers()
  const [activeStatuses, setActiveStatuses] = useState<string[]>(['All'])

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

    if (newStatuses.length === 0) {
      newStatuses = ['All']
    }
    
    setActiveStatuses(newStatuses)
  }

  const getStatusCount = (status: string) => {
    const baseItems = customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    )
    if (status === 'All') return baseItems.length
    return baseItems.filter(c => c.status === status).length
  }

  const displayStatuses = ['All', 'Active', 'Inactive']

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone.includes(searchQuery)
    const matchesStatus = activeStatuses.includes('All') || activeStatuses.includes(customer.status)
    return matchesSearch && matchesStatus
  })

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsEditingCustomer(true)
  }

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsViewingCustomer(true)
  }

  const navigateItem = (direction: 'next' | 'prev', list = filteredCustomers) => {
    if (!selectedCustomer || list.length <= 1) return
    const currentIndex = list.findIndex(c => c.id === selectedCustomer.id)
    if (currentIndex === -1) return
    
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (newIndex >= list.length) newIndex = 0
    if (newIndex < 0) newIndex = list.length - 1
    
    setSelectedCustomer(list[newIndex])
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-3 px-3 flex flex-col gap-3 border-b border-brand-chocolate/5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display">Customers</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsShowingSummary(true)}
              className="w-10 h-10 rounded-md bg-brand-chocolate/5 text-brand-chocolate flex items-center justify-center border border-brand-chocolate/10 active:scale-90 transition-transform"
            >
              <BarChart3 size={20} />
            </button>
            <button 
              onClick={() => setIsAddingCustomer(true)}
              className="w-10 h-10 rounded-md bg-brand-chocolate text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
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
                placeholder="Search customers..."
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
                className="overflow-hidden"
              >
                <CategoryFilter 
                  show={customers.length > 0}
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
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 glass-skeleton" />)}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={User}
          title="No customers yet"
          description="Build your list of bite lovers by tapping the button below."
          actionLabel="+ Add first customer"
          onAction={() => setIsAddingCustomer(true)}
        />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description={`We couldn't find any customers matching "${searchQuery}"`}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="card flex items-center gap-4 group transition-colors relative overflow-hidden">
              {/* Status Watermark */}
              <div className="absolute top-1 left-1 opacity-[0.05] pointer-events-none">
                {customer.status === 'Active' ? (
                  <CheckCircle2 size={36} className="text-emerald-600" />
                ) : (
                  <XCircle size={36} className="text-rose-600" />
                )}
              </div>
              <div className="w-12 h-12 rounded-md bg-brand-dough/20 flex items-center justify-center text-brand-chocolate shrink-0">
                <User size={24} />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <button 
                  onClick={() => handleView(customer)}
                  className="text-left w-full block group/name mb-0.5"
                >
                  <h3 className="font-bold truncate group-hover/name:text-brand-chocolate transition-colors">{customer.name}</h3>
                </button>
                <div className="flex items-center gap-3 text-[10px] text-brand-chocolate/40 mt-1">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Phone size={10} className="shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail size={10} className="shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons arranged vertically - pushed to the right */}
              <div className="flex flex-col gap-1 border-l border-brand-chocolate/5 pl-2 -mr-1">
                <button 
                  onClick={() => handleEdit(customer)}
                  className="w-6 h-6 text-brand-chocolate/40 hover:text-brand-chocolate transition-colors flex items-center justify-center"
                >
                  <Pencil size={12} />
                </button>
                <button 
                  onClick={() => customer.id && setCustomerToDelete(customer.id)}
                  className="w-6 h-6 text-red-400/60 hover:text-red-600 transition-colors flex items-center justify-center"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Customer */}
      <BottomSheet 
        isOpen={isAddingCustomer} 
        onClose={() => setIsAddingCustomer(false)} 
        title="Add Customer"
        subtitle="Add a new customer to your database"
      >
        <CustomerForm onSuccess={() => setIsAddingCustomer(false)} />
      </BottomSheet>

      <BottomSheet 
        isOpen={isViewingCustomer} 
        onClose={() => {
          setIsViewingCustomer(false)
          setSelectedCustomer(null)
          setIsNavigatingFromSummary(false)
        }} 
        onBack={isNavigatingFromSummary ? () => {
          setIsViewingCustomer(false)
          setSelectedCustomer(null)
          setIsNavigatingFromSummary(false)
          setIsShowingSummary(true)
        } : undefined}
        onSwipeLeft={() => navigateItem('next')}
        onSwipeRight={() => navigateItem('prev')}
        animationKey={selectedCustomer?.id}
        title="Customer Profile"
        subtitle="View customer information and history"
      >
        {selectedCustomer && <CustomerDetails customer={selectedCustomer} />}
      </BottomSheet>

      <BottomSheet 
        isOpen={isEditingCustomer} 
        onClose={() => {
          setIsEditingCustomer(false)
          setSelectedCustomer(null)
        }} 
        onSwipeLeft={() => navigateItem('next')}
        onSwipeRight={() => navigateItem('prev')}
        animationKey={selectedCustomer?.id}
        title="Edit Customer"
        subtitle="Modify customer contact details"
      >

        {selectedCustomer && (
          <CustomerForm 
            onSuccess={() => {
              setIsEditingCustomer(false)
              setSelectedCustomer(null)
            }} 
            initialData={selectedCustomer}
          />
        )}
      </BottomSheet>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={customerToDelete !== null}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={() => {
          if (customerToDelete) deleteCustomer(customerToDelete)
        }}
        title="Delete Customer?"
        message="Are you sure you want to remove this customer? All their order history will remain, but you won't be able to select them for new orders."
      />
      <BottomSheet 
        isOpen={isShowingSummary} 
        onClose={() => setIsShowingSummary(false)}
        title="Customer Analytics"
        subtitle="Quick overview of your customer base"
      >
        <CustomerSummary 
          customers={customers} 
          onViewCustomer={(customer) => {
            setIsNavigatingFromSummary(true)
            setIsShowingSummary(false)
            handleView(customer)
          }}
        />
      </BottomSheet>
    </div>
  )
}
