import type { Order } from '@backend/lib/db'

/**
 * Calculates total gross revenue from a list of orders
 */
export const calculateTotalRevenue = (orders: Order[]): number => {
  return orders.reduce((sum, order) => sum + (order.amount || 0), 0)
}

/**
 * Counts orders by their status (Pending, Completed, Cancelled)
 */
export const calculateStatusCounts = (orders: Order[]) => {
  return {
    Pending: orders.filter(o => o.status === 'Pending').length,
    Completed: orders.filter(o => o.status === 'Completed').length,
    Cancelled: orders.filter(o => o.status === 'Cancelled').length,
  }
}

/**
 * Analyzes order items to find most popular products
 */
export const getPopularProducts = (orders: Order[], limit: number = 4) => {
  const allItems = orders.flatMap(o => o.items.split(',').map(i => i.trim()))
  
  const productCounts = allItems.reduce((acc, item) => {
    if (item) acc[item] = (acc[item] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
}

/**
 * Calculates average value of orders
 */
export const calculateAverageOrderValue = (orders: Order[]): number => {
  if (orders.length === 0) return 0
  return calculateTotalRevenue(orders) / orders.length
}

/**
 * Calculates the completion rate percentage
 */
export const calculateCompletionRate = (orders: Order[]): number => {
  if (orders.length === 0) return 0
  const completed = orders.filter(o => o.status === 'Completed').length
  return (completed / orders.length) * 100
}

/**
 * Calculates the grand total of an order based on items and their quantities
 */
export const calculateOrderTotal = (items: { price: number, quantity: number }[]): number => {
  return items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
}

export interface ParsedOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

/**
 * Parses order items description string (e.g., "2x Croissant, 1x Bagel") 
 * back into a structured array of OrderItems using active product lists.
 */
export const parseOrderItemsDescription = (
  itemsStr: string,
  products: { id?: string; name: string; price: number }[]
): ParsedOrderItem[] => {
  if (!itemsStr || !products.length) return []
  const parsedItems: ParsedOrderItem[] = []
  const parts = itemsStr.split(', ')

  parts.forEach(p => {
    const match = p.match(/(\d+)x (.+)/)
    if (match) {
      const qty = parseInt(match[1], 10)
      const name = match[2]
      const prod = products.find(pr => pr.name === name)
      if (prod) {
        parsedItems.push({
          productId: prod.id!,
          name: prod.name,
          quantity: qty,
          price: prod.price
        })
      }
    }
  })

  return parsedItems
}
