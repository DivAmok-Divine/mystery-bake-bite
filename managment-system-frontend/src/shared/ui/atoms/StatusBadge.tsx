import React from 'react'

export type StatusType = 'Pending' | 'Completed' | 'Cancelled' | 'Active' | 'Inactive' | 'Operational' | 'Maintenance' | 'Broken'

export const getStatusTextClass = (status: string) => {
  switch (status) {
    case 'Completed':
    case 'Active':
    case 'Operational':
    case 'In Stock':
      return 'text-emerald-600'
    case 'Cancelled':
    case 'Inactive':
    case 'Broken':
    case 'Out of Stock':
      return 'text-red-500/60'
    case 'Pending':
    case 'Maintenance':
    case 'Low Stock':
      return 'text-amber-700'

    default:
      return 'text-gray-600'
  }
}

export const getStatusBgClass = (status: string) => {
  switch (status) {
    case 'Pending':
    case 'Maintenance':
    case 'Low Stock':
      return 'bg-amber-100'
    case 'Completed':
    case 'Active':
    case 'Operational':
    case 'In Stock':
      return 'bg-emerald-100'
    case 'Cancelled':
    case 'Inactive':
    case 'Broken':
    case 'Out of Stock':
      return 'bg-red-100'

    default:
      return 'bg-gray-100'
  }
}

interface StatusBadgeProps {
  status: StatusType | string
  className?: string
  variant?: 'badge' | 'text'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "", variant = 'badge' }) => {
  const colorClass = getStatusTextClass(status)
  const bgClass = variant === 'badge' ? getStatusBgClass(status) : ''

  return (
    <div className={`inline-flex items-center rounded-md font-bold ${colorClass} ${bgClass} ${className}`}>
      {status}
    </div>
  )
}
