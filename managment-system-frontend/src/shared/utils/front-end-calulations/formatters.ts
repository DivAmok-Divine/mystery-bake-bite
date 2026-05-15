/**
 * Formats a number as Ghana Cedi (GH₵)
 */
export const formatCurrency = (amount: number): string => {
  return `GH₵ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Formats a number to a fixed decimal string (default 2)
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals)
}

/**
 * Calculates a percentage and ensures it's between 0 and 100
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0
  return Math.min(100, Math.max(0, (value / total) * 100))
}

/**
 * Formats a number as a percentage string
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`
}

