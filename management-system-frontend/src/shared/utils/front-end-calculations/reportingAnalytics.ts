import { isSameDay, isWithinInterval, format, subDays } from 'date-fns'
import type { Order, Customer } from '@backend/lib/db'

export type TimeView = 'Today' | 'All'
export interface DateRange {
  start: Date | null
  end: Date | null
}

/**
 * Filter orders based on a timeframe
 */
export const filterOrdersByTimeframe = (orders: Order[], timeView: TimeView, dateRange: DateRange) => {
  const now = new Date()
  return orders.filter(order => {
    const orderDate = new Date(order.createdAt)
    
    if (timeView === 'Today') {
      return isSameDay(orderDate, now)
    }

    if (dateRange.start && dateRange.end) {
      return isWithinInterval(orderDate, { 
        start: dateRange.start, 
        end: new Date(new Date(dateRange.end).setHours(23, 59, 59)) 
      })
    } else if (dateRange.start) {
      return isSameDay(orderDate, dateRange.start)
    }
    
    return true
  })
}

/**
 * Filter customers based on a timeframe (by their creation date)
 */
export const filterCustomersByTimeframe = (customers: Customer[], timeView: TimeView, dateRange: DateRange) => {
  const now = new Date()
  return customers.filter(customer => {
    const customerDate = new Date(customer.createdAt)
    
    if (timeView === 'Today') {
      return isSameDay(customerDate, now)
    }

    if (dateRange.start && dateRange.end) {
      return isWithinInterval(customerDate, { 
        start: dateRange.start, 
        end: new Date(new Date(dateRange.end).setHours(23, 59, 59)) 
      })
    } else if (dateRange.start) {
      return isSameDay(customerDate, dateRange.start)
    }
    
    return true
  })
}

/**
 * Calculate activity pulse (order counts over the last 7 days)
 */
export const calculateActivityPulse = (orders: Order[]) => {
  const now = new Date()
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i)
    const count = orders.filter(o => {
      const orderDate = new Date(o.createdAt)
      return isSameDay(orderDate, d)
    }).length
    return { day: format(d, 'EEEEE'), count }
  })
  
  const maxCount = Math.max(...last7Days.map(d => d.count), 1)
  
  return { last7Days, maxCount }
}
