import { subDays } from 'date-fns'
import type { Customer, Order } from '@backend/lib/db'

/**
 * Determines a customer's status based on their order history
 */
export const determineCustomerStatus = (orders: Order[]): 'Active' | 'Inactive' => {
  const thirtyDaysAgo = subDays(new Date(), 30)
  const hasRecentOrder = orders.some(o => new Date(o.createdAt) >= thirtyDaysAgo)
  return hasRecentOrder ? 'Active' : 'Inactive'
}

/**
 * Calculates total orders across all customers
 */
export const calculateTotalCustomerOrders = (customers: Customer[]): number => {
  return customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)
}

/**
 * Calculates customer status distribution (Active vs Inactive)
 */
export const getCustomerStatusCounts = (customers: Customer[]) => {
  return {
    active: customers.filter(c => c.status === 'Active').length,
    inactive: customers.filter(c => c.status === 'Inactive').length,
  }
}

/**
 * Finds the most recently added customer
 */
export const getNewestCustomer = (customers: Customer[]) => {
  if (customers.length === 0) return null
  return [...customers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null
}

/**
 * Calculates the percentage of active customers
 */
export const calculateCustomerRetentionRate = (customers: Customer[]): number => {
  if (customers.length === 0) return 0
  const activeCount = customers.filter(c => c.status === 'Active').length
  return (activeCount / customers.length) * 100
}
/**
 * Calculates the average number of orders per customer
 */
export const calculateAverageCustomerOrders = (customers: Customer[]): number => {
  if (customers.length === 0) return 0
  return calculateTotalCustomerOrders(customers) / customers.length
}

/**
 * Finds the customer with the most orders
 */
export const findTopCustomer = (customers: Customer[]): Customer | null => {
  if (customers.length === 0) return null
  return [...customers].sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))[0] || null
}

/**
 * Filter customers that have orders in a specific list
 */
export const getCustomersInPeriod = (customers: Customer[], orders: Order[]) => {
  const customerIdsInPeriod = new Set(orders.map(o => String(o.customerId)))
  const customerNamesInPeriod = new Set(orders.map(o => o.customerName))

  return customers.filter(c => 
    (c.id && customerIdsInPeriod.has(String(c.id))) || 
    customerNamesInPeriod.has(c.name)
  )
}

/**
 * Calculates total orders for a specific customer
 */
export const calculateCustomerOrdersCount = (orders: Order[], customerId: string | number): number => {
  return orders.filter((o) => String(o.customerId) === String(customerId)).length
}
