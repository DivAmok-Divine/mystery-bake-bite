import React from 'react'
import { User, Phone, Mail, Plus } from 'lucide-react'
import type { Customer } from '@backend/lib/db'
import { getStatusTextClass } from '@shared/ui/atoms/StatusBadge'

interface CustomerDetailsProps {
  customer: Customer
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customer }) => {
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
          <p className={`text-sm font-bold mt-0.5 ${getStatusTextClass(customer.status)}`}>
            {customer.status}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <a 
          href={`tel:${customer.phone}`}
          className="card-glass p-4 rounded-md flex items-center gap-4 border border-brand-chocolate/5 hover:bg-brand-dough/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-md bg-brand-cream flex items-center justify-center text-brand-chocolate">
            <Phone size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-chocolate/40 ">Phone Number</p>
            <p className="font-bold">{customer.phone}</p>
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
