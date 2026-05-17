import React, { useState, useMemo } from 'react'
import { useDebounce } from '@shared/hooks/useDebounce'
import { 
  ShoppingBag, Eye, 
  Pencil, Plus, Search, BarChart3,
  AlertTriangle, CheckCircle2, XCircle, Calendar as CalendarIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, isWithinInterval, isSameDay } from 'date-fns'
import { useOrders } from '../api/useOrders'
import { useAuth } from '../../auth/api/AuthContext'
import { BottomSheet } from '@shared/ui/molecules/BottomSheet'
import { OrderForm } from './OrderForm'
import type { Order } from '@backend/lib/db'
import { formatNumber } from '@shared/utils/front-end-calculations/formatters'
import { OrderDetails } from './OrderDetails.tsx'
import { SearchBar } from '@shared/ui/molecules/SearchBar'
import { CategoryFilter, FilterToggle } from '@shared/ui/molecules/CategoryFilter'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'
import { OrderSummary } from './OrderSummary.tsx'
import { EmptyState } from '@shared/ui/molecules/EmptyState'
import { StatusBadge } from '@shared/ui/atoms/StatusBadge'
import { ListSkeleton } from '@shared/ui/atoms/ListSkeleton'
import { toggleFilterValue } from '@shared/utils/front-end-calculations/commonUtils'
import { useNotification } from '@shared/ui/molecules/Notification'

import { DateRangePicker, type DateRange } from '@shared/ui/molecules/calender/DateRangePicker.tsx'

export const OrderList: React.FC = () => {
  const { notify } = useNotification()
  const { isAdmin } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 150)
  const [isAddingOrder, setIsAddingOrder] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isViewingOrder, setIsViewingOrder] = useState(false)
  const [isEditingOrder, setIsEditingOrder] = useState(false)
  const [isAddingCustomerInOrder, setIsAddingCustomerInOrder] = useState(false)
  const [isShowingSummary, setIsShowingSummary] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isFormDirty, setIsFormDirty] = useState(false)
  
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null)
  const { orders, isLoading, updateOrder } = useOrders()
  const [activeStatuses, setActiveStatuses] = useState<string[]>(['All'])
  const [showDatePresets, setShowDatePresets] = useState(false)
  const [timeView, setTimeView] = useState<'Today' | 'All'>('Today')
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null })
  const [tempDateRange, setTempDateRange] = useState<DateRange>({ start: null, end: null })
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Auto-switch to All when a date range is picked
  React.useEffect(() => {
    if (dateRange.start) {
      setTimeView('All')
    }
  }, [dateRange.start])

  const toggleStatus = (status: string) => {
    setActiveStatuses(toggleFilterValue(activeStatuses, status))
  }

  const baseFilteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.customerName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                          o.items.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      
      let matchesDate = true
      if (timeView === 'Today') {
        const today = new Date()
        matchesDate = isWithinInterval(new Date(o.createdAt), { 
          start: startOfDay(today), 
          end: endOfDay(today) 
        })
      } else if (dateRange.start && dateRange.end) {
        matchesDate = isWithinInterval(new Date(o.createdAt), { 
          start: startOfDay(dateRange.start), 
          end: endOfDay(dateRange.end) 
        })
      } else if (dateRange.start) {
        matchesDate = isSameDay(new Date(o.createdAt), dateRange.start)
      }
      
      return matchesSearch && matchesDate
    })
  }, [orders, debouncedSearchQuery, timeView, dateRange])

  const getStatusCount = (status: string) => {
    if (status === 'All') return baseFilteredOrders.length
    return baseFilteredOrders.filter(o => o.status === status).length
  }

  const displayStatuses = ['All', 'Pending', 'Completed', 'Cancelled']

  const filteredOrders = useMemo(() => {
    return baseFilteredOrders.filter(order => {
      return activeStatuses.includes('All') || activeStatuses.includes(order.status)
    })
  }, [baseFilteredOrders, activeStatuses])


  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsViewingOrder(true)
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsEditingOrder(true)
  }

  const navigateItem = (direction: 'next' | 'prev', list = filteredOrders) => {
    if (!selectedOrder || list.length <= 1) return
    const currentIndex = list.findIndex(o => o.id === selectedOrder.id)
    if (currentIndex === -1) return
    
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (newIndex >= list.length) newIndex = 0
    if (newIndex < 0) newIndex = list.length - 1
    
    setSelectedOrder(list[newIndex])
  }

  const checkIsThisMonth = () => {
    if (!dateRange.start || !dateRange.end) return false
    const now = new Date()
    return dateRange.start.getTime() === startOfMonth(now).getTime() && 
           dateRange.end.getTime() === endOfMonth(now).getTime()
  }

  const checkIsLastMonth = () => {
    if (!dateRange.start || !dateRange.end) return false
    const lastMonth = subMonths(new Date(), 1)
    return dateRange.start.getTime() === startOfMonth(lastMonth).getTime() && 
           dateRange.end.getTime() === endOfMonth(lastMonth).getTime()
  }

  const isAllTime = !dateRange.start && timeView === 'All'
  const isTodayActive = !dateRange.start && timeView === 'Today'
  const isThisMonthActive = checkIsThisMonth()
  const isLastMonthActive = checkIsLastMonth()
  const isCustomRangeActive = !!dateRange.start && !isThisMonthActive && !isLastMonthActive

  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-3 px-3 flex flex-col gap-3 border-b border-brand-chocolate/5">
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
                className=""
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <CategoryFilter 
                      show={orders.length > 0}
                      options={displayStatuses}
                      activeOptions={activeStatuses}
                      onToggle={toggleStatus}
                      getCount={getStatusCount}
                    />
                  </div>
                  <div className="h-10 py-1.5 flex items-center relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDatePresets(!showDatePresets);
                      }}
                      className={`px-3 h-full rounded-md flex items-center justify-center transition-all flex-shrink-0 z-10 ${
                        dateRange.start 
                          ? 'bg-brand-chocolate text-white shadow-md' 
                          : 'bg-brand-chocolate/5 text-brand-chocolate border border-brand-chocolate/10'
                      }`}
                      title="Filter by Date"
                    >
                      <CalendarIcon size={14} />
                    </button>

                    <AnimatePresence>
                      {showDatePresets && (
                        <>
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setShowDatePresets(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-brand-chocolate/10 z-50 overflow-hidden"
                          >
                            <div className="flex flex-col">
                              <button
                                onClick={() => {
                                  setDateRange({ start: null, end: null })
                                  setTimeView('Today')
                                  setShowDatePresets(false)
                                }}
                                className={`px-4 py-3 text-left text-sm font-medium transition-colors border-b border-brand-chocolate/5 ${
                                  isTodayActive ? 'bg-brand-dough/20' : 'hover:bg-brand-chocolate/5'
                                }`}
                              >
                                Today
                              </button>
                              <button
                                onClick={() => {
                                  const now = new Date()
                                  setDateRange({ start: startOfMonth(now), end: endOfMonth(now) })
                                  setTimeView('All')
                                  setShowDatePresets(false)
                                }}
                                className={`px-4 py-3 text-left text-sm font-medium transition-colors border-b border-brand-chocolate/5 ${
                                  isThisMonthActive ? 'bg-brand-dough/20' : 'hover:bg-brand-chocolate/5'
                                }`}
                              >
                                This month
                              </button>
                              <button
                                onClick={() => {
                                  const lastMonth = subMonths(new Date(), 1)
                                  setDateRange({ start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) })
                                  setTimeView('All')
                                  setShowDatePresets(false)
                                }}
                                className={`px-4 py-3 text-left text-sm font-medium transition-colors border-b border-brand-chocolate/5 ${
                                  isLastMonthActive ? 'bg-brand-dough/20' : 'hover:bg-brand-chocolate/5'
                                }`}
                              >
                                Last month
                              </button>
                              <button
                                onClick={() => {
                                  setDateRange({ start: null, end: null })
                                  setTimeView('All')
                                  setShowDatePresets(false)
                                }}
                                className={`px-4 py-3 text-left text-sm font-medium transition-colors border-b border-brand-chocolate/5 ${
                                  isAllTime ? 'bg-brand-dough/20' : 'hover:bg-brand-chocolate/5'
                                }`}
                              >
                                All time
                              </button>
                              <button
                                onClick={() => {
                                  setTempDateRange({ start: null, end: null })
                                  setShowDatePicker(true)
                                  setShowDatePresets(false)
                                }}
                                className={`px-4 py-3 text-left text-sm font-medium transition-colors ${
                                  isCustomRangeActive ? 'bg-brand-dough/20' : 'hover:bg-brand-chocolate/5'
                                }`}
                              >
                                Custom range
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {(dateRange.start || timeView === 'All') && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-brand-chocolate/5 rounded-md border border-brand-chocolate/10">
              <span className="text-[10px] font-bold text-brand-chocolate/60 tracking-wider">
                {timeView === 'All' ? 'All time records' : (
                  dateRange.start ? (
                    `${format(dateRange.start, 'MMM d')} — ${dateRange.end ? format(dateRange.end, 'MMM d') : '...'}`
                  ) : ''
                )}
              </span>
              <button 
                onClick={() => {
                  setDateRange({ start: null, end: null })
                  setTimeView('Today')
                }}
                className="text-[10px] font-bold text-red-500 underline"
              >
                Reset
              </button>
            </div>
          )}

        </div>
      </header>

      {isLoading ? (
        <ListSkeleton count={3} className="h-32" />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Start your first bake bite by tapping the button below."
          actionLabel="+ Add first order"
          onAction={() => setIsAddingOrder(true)}
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description={`We couldn't find anything matching "${searchQuery}"`}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card flex flex-col gap-3 group">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div 
                    onClick={() => handleViewDetails(order)}
                    className="cursor-pointer hover:opacity-80 active:scale-[0.99] transition-all"
                    title="View Order Details"
                  >
                    <h3 className="text-lg leading-tight">{order.customerName}</h3>
                    <p className="text-sm text-brand-chocolate/60 line-clamp-2">{order.items}</p>
                  </div>
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
                <div className="flex flex-col items-end">
                  {isAdmin && (
                    <>
                      <span className="text-xs font-bold text-brand-chocolate/40 leading-none">GH₵</span>
                      <span className="text-xl font-bold text-brand-chocolate leading-tight mt-0.5">
                        {formatNumber(order.amount)}
                      </span>
                    </>
                  )}
                  <StatusBadge 
                    status={order.status} 
                    className="text-[10px] tracking-wider px-2 py-0.5 mt-2" 
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
        onClose={() => {
          setIsAddingOrder(false)
          setIsAddingCustomerInOrder(false)
          setIsFormDirty(false)
        }} 
        onBack={isAddingCustomerInOrder ? () => setIsAddingCustomerInOrder(false) : undefined}
        title={isAddingCustomerInOrder ? "Add New Customer" : "New Order"}
        subtitle={isAddingCustomerInOrder ? "Enter details for your new bite lover" : "Create a new order for your bakery"}
        disableSwipe={true}
        hasUnsavedChanges={isFormDirty}
      >
        <OrderForm 
          onSuccess={() => {
            setIsAddingOrder(false)
            setIsAddingCustomerInOrder(false)
            setIsFormDirty(false)
          }} 
          isAddingNewCustomer={isAddingCustomerInOrder}
          setIsAddingNewCustomer={setIsAddingCustomerInOrder}
          onDirtyChange={setIsFormDirty}
        />
      </BottomSheet>

      {/* View Details */}
      <BottomSheet 
        isOpen={isViewingOrder} 
        onClose={() => {
          setIsViewingOrder(false)
          setSelectedOrder(null)
        }} 
        onSwipeLeft={() => navigateItem('next')}
        onSwipeRight={() => navigateItem('prev')}
        animationKey={selectedOrder?.id}
        title="Order Details"
        subtitle="View full order information"
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
          setIsAddingCustomerInOrder(false)
          setIsFormDirty(false)
        }} 
        onBack={isAddingCustomerInOrder ? () => setIsAddingCustomerInOrder(false) : undefined}
        animationKey={selectedOrder?.id}
        title={isAddingCustomerInOrder ? "Add New Customer" : "Edit Order"}
        subtitle={isAddingCustomerInOrder ? "Enter details for your new bite lover" : "Modify order details"}
        disableSwipe={true}
        hasUnsavedChanges={isFormDirty}
      >
        {selectedOrder && (
          <OrderForm 
            onSuccess={() => {
              setIsEditingOrder(false)
              setSelectedOrder(null)
              setIsAddingCustomerInOrder(false)
              setIsFormDirty(false)
            }} 
            initialData={selectedOrder}
            isAddingNewCustomer={isAddingCustomerInOrder}
            setIsAddingNewCustomer={setIsAddingCustomerInOrder}
            onDirtyChange={setIsFormDirty}
          />
        )}
      </BottomSheet>

      {/* Complete Confirmation */}
      <ConfirmModal 
        isOpen={!!orderToComplete}
        onClose={() => setOrderToComplete(null)}
        onConfirm={async () => {
          if (orderToComplete?.id) {
            try {
              await updateOrder({ id: orderToComplete.id, changes: { status: 'Completed' } })
              notify({
                type: 'update',
                message: `Order ${orderToComplete.orderNumber} successfully completed!`
              })
              // Update selectedOrder if it's the one being completed
              if (selectedOrder?.id === orderToComplete.id) {
                setSelectedOrder({ ...selectedOrder, status: 'Completed' })
              }
            } catch (err: any) {
              notify({
                type: 'error',
                message: err?.message || `Failed to complete order ${orderToComplete.orderNumber}.`
              })
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
        watermarkType="complete"
      />

      {/* Cancel Confirmation */}
      <ConfirmModal 
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirm={async () => {
          if (orderToCancel?.id) {
            try {
              await updateOrder({ id: orderToCancel.id, changes: { status: 'Cancelled' } })
              notify({
                type: 'delete',
                message: `Order ${orderToCancel.orderNumber} successfully cancelled!`
              })
              // Update selectedOrder if it's the one being cancelled
              if (selectedOrder?.id === orderToCancel.id) {
                setSelectedOrder({ ...selectedOrder, status: 'Cancelled' })
              }
            } catch (err: any) {
              notify({
                type: 'error',
                message: err?.message || `Failed to cancel order ${orderToCancel.orderNumber}.`
              })
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
        watermarkType="cancel"
      />
      <BottomSheet 
        isOpen={isShowingSummary} 
        onClose={() => setIsShowingSummary(false)}
        title="Order Analytics"
        subtitle="Quick overview of your bakery's performance"
      >
        <OrderSummary 
          orders={filteredOrders} 
          filterLabel={(() => {
            if (timeView === 'Today') return 'today'
            if (dateRange.start && dateRange.end) {
              if (isThisMonthActive) return 'this month'
              if (isLastMonthActive) return 'last month'
              return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')}`
            }
            if (dateRange.start) return `since ${format(dateRange.start, 'MMM d')}`
            return 'all time'
          })()}
        >
        </OrderSummary>
      </BottomSheet>

      <AnimatePresence>
        {showDatePicker && (
          <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 pb-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-chocolate/40 backdrop-blur-sm" 
              onClick={() => setShowDatePicker(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 w-full max-w-sm"
            >
              <DateRangePicker 
                value={tempDateRange}
                onChange={(range) => {
                  setTempDateRange(range)
                }}
                onClose={() => setShowDatePicker(false)}
                confirmLabel="Ok"
                onConfirm={() => {
                  setDateRange(tempDateRange)
                  setTimeView('All')
                  setShowDatePicker(false)
                }}
              />

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>


  )
}

