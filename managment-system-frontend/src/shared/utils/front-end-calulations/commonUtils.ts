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
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `+233 ${digits}`
  }
  return phone
}

/**
 * Validates a Ghanaian phone number format
 */
export const isValidGhanaPhone = (phone: string): boolean => {
  const digits = phone.replace('+233 ', '').replace(/\D/g, '')
  return digits.length === 10 && digits.startsWith('0')
}

