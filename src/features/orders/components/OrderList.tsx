import React, { useState } from 'react'
import { 
  ShoppingBag, Eye, 
  Pencil, Plus, Search, BarChart3,
  AlertTriangle, CheckCircle2, XCircle 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { useOrders } from '../api/useOrders'
import { useAuth } from '../../auth/api/AuthContext'
import { BottomSheet } from '../../../shared/ui/molecules/BottomSheet'
import { OrderForm } from './OrderForm'
import type { Order } from '../../../shared/lib/db'
import { OrderDetails } from './OrderDetails.tsx'
import { SearchBar } from '../../../shared/ui/molecules/SearchBar'
import { CategoryFilter, FilterToggle } from '../../../shared/ui/molecules/CategoryFilter'
import { ConfirmModal } from '../../../shared/ui/molecules/ConfirmModal'
import { OrderSummary } from './OrderSummary.tsx'
import { StatusBadge } from '../../../shared/ui/atoms/StatusBadge'

export const OrderList: React.FC = () => {
  const { isAdmin } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingOrder, setIsAddingOrder] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isViewingOrder, setIsViewingOrder] = useState(false)
  const [isEditingOrder, setIsEditingOrder] = useState(false)
  const [isShowingSummary, setIsShowingSummary] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null)
  const { orders, isLoading, updateOrder } = useOrders()
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
    const baseItems = orders.filter(o => 
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (status === 'All') return baseItems.length
    return baseItems.filter(o => o.status === status).length
  }

  const displayStatuses = ['All', 'Pending', 'Completed', 'Cancelled']

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = activeStatuses.includes('All') || activeStatuses.includes(order.status)
    return matchesSearch && matchesStatus
  })

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsViewingOrder(true)
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsEditingOrder(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-6 px-6 flex flex-col gap-3 border-b border-brand-chocolate/5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display">Orders</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsShowingSummary(true)}
              className="w-10 h-10 rounded-md bg-brand-chocolate/5 text-brand-chocolate flex items-center justify-center border border-brand-chocolate/10 active:scale-90 transition-transform"
            >
              <BarChart3 size={20} />
            </button>
            <button 
              onClick={() => setIsAddingOrder(true)}
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
                placeholder="Search orders..."
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
                  show={orders.length > 0}
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
          {[1, 2, 3].map(i => <div key={i} className="h-32 glass-skeleton" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-10">
          <div className="w-20 h-20 bg-brand-chocolate/5 rounded-full flex items-center justify-center text-brand-chocolate/20 mb-4">
            <ShoppingBag size={40} strokeWidth={1.5} />
          </div>
          <p className="text-brand-chocolate font-display text-xl">No orders yet</p>
          <p className="text-brand-chocolate/40 text-sm mt-2">
            Start your first bake bite by tapping the + button above.
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-10">
          <div className="w-20 h-20 bg-brand-chocolate/5 rounded-full flex items-center justify-center text-brand-chocolate/20 mb-4">
            <Search size={40} strokeWidth={1.5} />
          </div>
          <p className="text-brand-chocolate font-display text-xl">No results found</p>
          <p className="text-brand-chocolate/40 text-sm mt-2">
            We couldn't find anything matching "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card flex flex-col gap-3 group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg leading-tight">{order.customerName}</h3>
                  <p className="text-sm text-brand-chocolate/60 line-clamp-2">{order.items}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button 
                      onClick={() => handleViewDetails(order)}
                      className="text-brand-chocolate/40 hover:text-brand-chocolate transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    {order.status === 'Pending' && (
                      <>
                        <button 
                          onClick={() => handleEditOrder(order)}
                          className="text-brand-chocolate/40 hover:text-brand-chocolate transition-colors"
                          title="Edit Order"
                        >
                          <Pencil size={15} />
                        </button>
                        <div className="w-px h-3 bg-brand-chocolate/10 mx-1" />
                        <button 
                          onClick={() => setOrderToComplete(order)}
                          className="text-[10px] text-emerald-600 font-bold underline whitespace-nowrap"
                        >
                          Mark Done
                        </button>
                        <button 
                          onClick={() => setOrderToCancel(order)}
                          className="text-[10px] text-red-500 font-bold underline whitespace-nowrap"
                        >
                          Cancel Order
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {isAdmin && <span className="font-bold text-lg text-brand-chocolate">GH₵ {order.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                  <StatusBadge 
                    status={order.status} 
                    className="text-[10px] tracking-wider px-2 py-0.5 mt-1" 
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4 pt-2 border-t border-brand-chocolate/5 text-xs text-brand-chocolate/50">
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const now = new Date()
                    const deadline = new Date(order.deadline)
                    const isPassed = deadline < now
                    const isSoon = deadline >= now && deadline < new Date(now.getTime() + 24 * 60 * 60 * 1000)
                    
                    if (order.status === 'Completed') return <CheckCircle2 size={14} className="text-emerald-500" />
                    if (isPassed) return <XCircle size={14} className="text-rose-500" />
                    if (isSoon) return <AlertTriangle size={14} className="text-amber-500" />
                    return <CheckCircle2 size={14} className="text-emerald-500/40" />
                  })()}
                  <span className={(() => {
                    const now = new Date()
                    const deadline = new Date(order.deadline)
                    const isPassed = deadline < now
                    const isSoon = deadline >= now && deadline < new Date(now.getTime() + 24 * 60 * 60 * 1000)
                    if (order.status === 'Completed') return ''
                    if (isPassed) return 'text-rose-600 font-bold'
                    if (isSoon) return 'text-amber-600 font-bold'
                    return ''
                  })()}>
                    {format(new Date(order.deadline), 'MMM d, h:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  <span>{order.orderNumber}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Order */}
      <BottomSheet 
        isOpen={isAddingOrder} 
        onClose={() => setIsAddingOrder(false)} 
        title="New Order"
      >
        <OrderForm onSuccess={() => setIsAddingOrder(false)} />
      </BottomSheet>

      {/* View Details */}
      <BottomSheet 
        isOpen={isViewingOrder} 
        onClose={() => {
          setIsViewingOrder(false)
          setSelectedOrder(null)
        }} 
        title="Order Details"
      >
        {selectedOrder && (
          <OrderDetails 
            order={selectedOrder} 
            onCancel={() => {
              setOrderToCancel(selectedOrder)
            }}
            onComplete={() => {
              setOrderToComplete(selectedOrder)
            }}
          />
        )}
      </BottomSheet>

      {/* Edit Order */}
      <BottomSheet 
        isOpen={isEditingOrder} 
        onClose={() => {
          setIsEditingOrder(false)
          setSelectedOrder(null)
        }} 
        title="Edit Order"
      >
        {selectedOrder && (
          <OrderForm 
            onSuccess={() => {
              setIsEditingOrder(false)
              setSelectedOrder(null)
            }} 
            initialData={selectedOrder}
          />
        )}
      </BottomSheet>

      {/* Complete Confirmation */}
      <ConfirmModal 
        isOpen={!!orderToComplete}
        onClose={() => setOrderToComplete(null)}
        onConfirm={() => {
          if (orderToComplete?.id) {
            updateOrder({ id: orderToComplete.id, changes: { status: 'Completed' } })
            // Update selectedOrder if it's the one being completed
            if (selectedOrder?.id === orderToComplete.id) {
              setSelectedOrder({ ...selectedOrder, status: 'Completed' })
            }
            setOrderToComplete(null)
          }
        }}
        title="Complete Order"
        message={
          <>
            Are you sure you want to mark the order for <span className="font-bold text-brand-chocolate">{orderToComplete?.customerName}</span> as completed?
          </>
        }
        confirmText="Yes, Mark as Done"
        isDestructive={false}
      />

      {/* Cancel Confirmation */}
      <ConfirmModal 
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirm={() => {
          if (orderToCancel?.id) {
            updateOrder({ id: orderToCancel.id, changes: { status: 'Cancelled' } })
            // Update selectedOrder if it's the one being cancelled
            if (selectedOrder?.id === orderToCancel.id) {
              setSelectedOrder({ ...selectedOrder, status: 'Cancelled' })
            }
            setOrderToCancel(null)
          }
        }}
        title="Cancel Order"
        message={
          <>
            Are you sure you want to cancel the order for <span className="font-bold text-brand-chocolate">{orderToCancel?.customerName}</span>? 
            This action cannot be undone.
          </>
        }
        confirmText="Yes, Cancel Order"
        isDestructive={true}
      />
      <BottomSheet 
        isOpen={isShowingSummary} 
        onClose={() => setIsShowingSummary(false)}
        title="Order Analytics"
        subtitle="Quick overview of your bakery's performance"
      >
        <OrderSummary orders={orders} />
      </BottomSheet>
    </div>
  )
}
