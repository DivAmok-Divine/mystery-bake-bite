import React from 'react'
import { Package, FileText } from 'lucide-react'
import type { Product } from '@backend/lib/db'
import { formatCurrency } from '@shared/utils/formatters'

interface ProductDetailsProps {
  product?: Product
  isLoading?: boolean
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ product, isLoading }) => {
  if (isLoading || !product) {
    return (
      <div className="flex flex-col gap-3 pb-6 animate-pulse">
        {/* Product Image pulse */}
        <div className="w-full aspect-square max-h-72 bg-brand-chocolate/10 rounded-lg relative" />
        
        {/* Name & price pulses */}
        <div className="flex flex-col gap-2 px-1">
          <div className="h-8 w-48 bg-brand-chocolate/10 rounded-md" />
          <div className="h-6 w-24 bg-brand-chocolate/10 rounded-md" />
        </div>

        {/* Description pulse */}
        <div className="flex flex-col gap-2 px-1">
          <div className="h-4 w-28 bg-brand-chocolate/10 rounded" />
          <div className="h-20 w-full bg-brand-chocolate/10 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 pb-6">
      {/* Product Image */}
      <div className="w-full aspect-square max-h-72 bg-brand-cream/20 rounded-lg overflow-hidden relative flex items-center justify-center">
        {(product.images && product.images.length > 0) ? (
          <div 
            className="flex overflow-x-auto w-full h-full snap-x snap-mandatory hide-scrollbar"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {product.images.map((img, idx) => (
              <img key={idx} src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover shrink-0 snap-center" />
            ))}
          </div>
        ) : product.image ? (
          <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Package size={64} strokeWidth={1} className="text-brand-chocolate/20" />
        )}
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-md text-[10px] font-bold  px-3 py-1.5 rounded-md border border-brand-chocolate/10 text-brand-chocolate shadow-sm">
            {product.category}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-3xl font-display text-brand-chocolate leading-tight">{product.name}</h2>
        <p className="text-xl font-bold text-brand-chocolate/60">{formatCurrency(product.price)}</p>
      </div>

      {product.description && (
        <div className="flex flex-col gap-2 px-1">
          <h3 className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2">
            <FileText size={14} /> Description
          </h3>
          <div className="bg-brand-cream/10 p-4 rounded-lg border border-brand-chocolate/5">
            <p className="text-sm text-brand-chocolate/80 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

