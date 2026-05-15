import type { PantryItem, PantryHistory } from '@backend/lib/db'
import { isWithinInterval, startOfMonth, endOfMonth } from 'date-fns'

/**
 * Calculates the total estimated value of all items currently in the pantry
 */
export const calculatePantryValue = (items: PantryItem[]): number => {
  return (items || []).reduce((acc, item) => acc + ((item.currentStock || 0) * (item.lastPrice || 0)), 0)
}

/**
 * Calculates total spend on restocks for the current month
 */
export const calculateMonthlySpend = (history: PantryHistory[]): number => {
  const monthStart = startOfMonth(new Date())
  const monthEnd = endOfMonth(new Date())
  
  return (history || [])
    .filter(h => h.type === 'Restock' && isWithinInterval(new Date(h.createdAt), { start: monthStart, end: monthEnd }))
    .reduce((acc, h) => acc + (h.totalValue || 0), 0)
}

/**
 * Calculates the total cost value of ingredients used in the current month
 */
export const calculateMonthlyUsage = (history: PantryHistory[]): number => {
  const monthStart = startOfMonth(new Date())
  const monthEnd = endOfMonth(new Date())
  
  return (history || [])
    .filter(h => h.type === 'Usage' && isWithinInterval(new Date(h.createdAt), { start: monthStart, end: monthEnd }))
    .reduce((acc, h) => acc + (h.totalValue || 0), 0)
}

/**
 * Groups pantry items by their stock status (Low, Out of Stock)
 */
export const getPantryStockHealth = (items: PantryItem[]) => {
  return {
    lowStock: items.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock'),
    outOfStock: items.filter(i => i.status === 'Out of Stock')
  }
}

/**
 * Calculates stock level progress percentage (0-100)
 * Uses 5x minStock as the 100% threshold for visual bars
 */
export const calculateStockProgress = (current: number, min: number): number => {
  const baseline = Math.max(1, (min || 1) * 5)
  return Math.min(100, ((current || 0) / baseline) * 100)
}

/**
 * Calculates a new stock quantity ensuring it doesn't go below zero
 */
export const getAdjustedStock = (current: number, delta: number): number => {
  return Math.max(0, current + delta)
}
/**
 * Determines pantry item status based on current stock and threshold
 */
export const determinePantryStatus = (current: number, min: number): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
  if ((current || 0) <= 0) return 'Out of Stock'
  if ((current || 0) <= (min || 0)) return 'Low Stock'
  return 'In Stock'
}

/**
 * Calculates stock counts by category
 */
export const getPantryCategoryCounts = (items: PantryItem[]): Record<string, number> => {
  return items.reduce((acc, item) => {
    if (item && item.category) {
      acc[item.category] = (acc[item.category] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)
}

/**
 * Finds the category with the most items
 */
export const getTopPantryCategory = (items: PantryItem[]): [string, number] | null => {
  const counts = getPantryCategoryCounts(items)
  const entries = Object.entries(counts)
  if (entries.length === 0) return null
  return entries.sort((a, b) => b[1] - a[1])[0] || null
}
