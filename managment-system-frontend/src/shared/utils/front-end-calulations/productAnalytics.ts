import type { Product } from '@backend/lib/db'

/**
 * Calculates pricing statistics for a list of products
 */
export const calculateProductPricing = (products: Product[]) => {
  const prices = products.map(p => p.price)
  const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
  const max = prices.length > 0 ? Math.max(...prices) : 0
  const min = prices.length > 0 ? Math.min(...prices) : 0

  return { avg, max, min }
}

/**
 * Finds the product with the highest price
 */
export const getTopPricedProduct = (products: Product[]) => {
  if (products.length === 0) return null
  const maxPrice = Math.max(...products.map(p => p.price))
  return products.find(p => p.price === maxPrice) || null
}

/**
 * Analyzes products to find the most popular category (by item count)
 */
export const getPopularProductCategory = (products: Product[]) => {
  const counts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0] || null
}

/**
 * General category counter utility
 */
export const getCategoryCounts = <T extends { category: string }>(items: T[]) => {
  return items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}
