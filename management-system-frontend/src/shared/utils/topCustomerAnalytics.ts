import { useMemo } from 'react'
import type { Order, Customer } from '@backend/lib/db'

export interface TopBuyer {
  customer: Customer
  count: number
}

export const getTopBuyers = (orders: Order[], customers: Customer[], limit: number = 4): TopBuyer[] => {
  const counts: Record<string, number> = {}
  const nameCounts: Record<string, number> = {}
  
  orders.forEach(o => {
    const id = o.customerId?.toString()
    if (id && id !== '0' && id !== 'undefined' && id !== 'null') {
      counts[id] = (counts[id] || 0) + 1
    }
    if (o.customerName) {
      nameCounts[o.customerName] = (nameCounts[o.customerName] || 0) + 1
    }
  })

  return customers
    .map(c => {
      const idCount = c.id ? (counts[c.id.toString()] || 0) : 0
      const nameCount = c.name ? (nameCounts[c.name] || 0) : 0
      return { customer: c, count: Math.max(idCount, nameCount) }
    })
    .filter(tb => tb.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export const useTopBuyers = (orders: Order[], customers: Customer[], limit: number = 4) => {
  return useMemo(() => getTopBuyers(orders, customers, limit), [orders, customers, limit])
}
