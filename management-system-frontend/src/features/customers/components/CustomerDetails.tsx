import React from 'react'
import { User, Phone, Mail, Plus, Info } from 'lucide-react'
import type { Customer } from '@backend/lib/db'
import { getStatusTextClass } from '@shared/ui/atoms/StatusBadge'
import { formatPhone } from '@shared/utils/commonUtils'

interface CustomerDetailsProps {
  customer?: Customer
  isLoading?: boolean
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customer, isLoading }) => {
  if (isLoading || !customer) {
    return (
      <div className="flex flex-col gap-4 pb-6 animate-pulse">
        <div className="flex flex-col items-center gap-1 pt-2">
          {/* Avatar Pulse */}
          <div className="w-20 h-20 rounded-md bg-brand-chocolate/10 flex items-center justify-center" />
          {/* Name Pulse */}
          <div className="h-7 w-48 bg-brand-chocolate/10 rounded-md mt-2" />
          {/* Created Date Pulse */}
          <div className="h-4 w-36 bg-brand-chocolate/10 rounded-md mt-1" />
          {/* Status Pulse */}
          <div className="h-4 w-16 bg-brand-chocolate/10 rounded-md mt-1" />
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Phone block skeleton */}
          <div className="p-4 rounded-md flex items-center gap-4 border border-brand-chocolate/5 bg-brand-cream/10">
            <div className="w-10 h-10 rounded-md bg-brand-chocolate/10 shrink-0" />
            <div className="flex-1 flex flex-col gap-1">
              <div className="h-3 w-20 bg-brand-chocolate/10 rounded" />
              <div className="h-5 w-32 bg-brand-chocolate/10 rounded" />
            </div>
          </div>
          {/* Email block skeleton */}
          <div className="p-4 rounded-md flex items-center gap-4 border border-brand-chocolate/5 bg-brand-cream/10">
            <div className="w-10 h-10 rounded-md bg-brand-chocolate/10 shrink-0" />
            <div className="flex-1 flex flex-col gap-1">
              <div className="h-3 w-24 bg-brand-chocolate/10 rounded" />
              <div className="h-5 w-40 bg-brand-chocolate/10 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex flex-col items-center gap-1 pt-2">
        <div className="w-20 h-20 rounded-md bg-brand-dough/20 flex items-center justify-center text-brand-chocolate">
          <User size={40} />
        </div>
        <h2 className="text-2xl font-display leading-tight">{customer.name}</h2>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-brand-chocolate/40 text-sm">
            <Plus size={14} />
            <span>Customer since {new Date(customer.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 relative group/tooltip">
            <p className={`text-sm font-bold ${getStatusTextClass(customer.status)}`}>
              {customer.status}
            </p>
            <div className="text-brand-chocolate/40 cursor-help transition-all hover:text-brand-chocolate group-hover/tooltip:scale-110">
              <Info size={13} strokeWidth={2.5} />
            </div>
            {/* Tooltip Popup */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-[#3D261C] text-white text-[10px] rounded-lg shadow-2xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all transform scale-95 group-hover/tooltip:scale-100 z-50 text-center leading-relaxed">
              <p className="font-bold mb-1 underline decoration-white/20 underline-offset-2">
                {customer.status} Customer
              </p>
              {customer.status === 'Active' 
                ? "This customer has placed at least one order within the last 30 days." 
                : "This customer hasn't placed an order in more than 30 days."
              }
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#3D261C]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <a 
          href={`tel:${formatPhone(customer.phone).replace(/\s+/g, '')}`}
          className="card-glass p-4 rounded-md flex items-center gap-4 border border-brand-chocolate/5 hover:bg-brand-dough/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-md bg-brand-cream flex items-center justify-center text-brand-chocolate">
            <Phone size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-chocolate/40 ">Phone Number</p>
            <p className="font-bold">{formatPhone(customer.phone)}</p>
          </div>
        </a>

        {customer.email && (
          <a 
            href={`mailto:${customer.email}`}
            className="card-glass p-4 rounded-md flex items-center gap-4 border border-brand-chocolate/5 hover:bg-brand-dough/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-md bg-brand-cream flex items-center justify-center text-brand-chocolate">
              <Mail size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-brand-chocolate/40 ">Email Address</p>
              <p className="font-bold truncate">{customer.email}</p>
            </div>
          </a>
        )}
      </div>
    </div>
  )
}
