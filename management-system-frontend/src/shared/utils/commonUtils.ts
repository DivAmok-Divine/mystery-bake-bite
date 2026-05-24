/**
 * Generates a random alphanumeric string
 */
export const generateId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Ensures a value is within a specific range
 */
export const clamp = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max)
}

/**
 * Formats a phone number for display
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return ''
  const trimmed = phone.trim()
  
  // Extract digits only
  let digits = trimmed.replace(/\D/g, '')
  
  // Strip country code if present
  if (digits.startsWith('233')) {
    digits = digits.slice(3)
  }
  
  // Strip leading zero if present
  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }
  
  // Format as +233 XXX XXX XXX if we have 9 digits
  if (digits.length === 9) {
    const part1 = digits.slice(0, 3)
    const part2 = digits.slice(3, 6)
    const part3 = digits.slice(6, 9)
    return `+233 ${part1} ${part2} ${part3}`
  }
  
  return phone
}

export const isValidGhanaPhone = (phone: string): boolean => {
  if (!phone) return false
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('233')) {
    digits = digits.slice(3)
  }
  return (digits.length === 10 && digits.startsWith('0')) || (digits.length === 9 && !digits.startsWith('0'))
}

/**
 * Toggles a value inside a multi-select filter array.
 * If 'All' is toggled, it resets other filters.
 * If all filters are removed, it defaults back to 'All'.
 */
export const toggleFilterValue = (activeValues: string[], valueToToggle: string): string[] => {
  if (valueToToggle === 'All') {
    return ['All']
  }
  let newValues = activeValues.includes('All') ? [] : [...activeValues]
  if (newValues.includes(valueToToggle)) {
    newValues = newValues.filter(v => v !== valueToToggle)
  } else {
    newValues.push(valueToToggle)
  }
  if (newValues.length === 0) {
    return ['All']
  }
  return newValues
}

/**
 * Sanitizes input strings by:
 * 1. Trimming leading and trailing whitespaces.
 * 2. Stripping any HTML tags, Javascript scripting, or suspicious characters to prevent XSS.
 */
export const sanitizeInput = (val: string | undefined | null): string => {
  if (val === undefined || val === null) return ''
  return val
    .trim()
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip javascript: protocol
    .replace(/onerror/gi, '') // Strip common XSS attributes
    .replace(/onload/gi, '')
    .replace(/onclick/gi, '')
}