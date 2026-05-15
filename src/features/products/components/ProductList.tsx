import React, { useState } from 'react'
import { useProducts } from '../api/useProducts'
import { useCategories } from '../api/useCategories'
import { 
  Plus, 
  Trash2, Eye, Pencil,
  LayoutGrid, List, Search, BarChart3
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomSheet } from '../../../shared/ui/molecules/BottomSheet'
import { ProductForm } from './ProductForm'
import { ProductDetails } from './ProductDetails'
import { ConfirmModal } from '../../../shared/ui/molecules/ConfirmModal'
import type { Product } from '../../../shared/lib/db'


import { SearchBar } from '../../../shared/ui/molecules/SearchBar'
import { CategoryFilter, FilterToggle } from '../../../shared/ui/molecules/CategoryFilter'
import { ProductSummary } from './ProductSummary'

export const ProductList: React.FC = () => {
  const { products, isLoading, deleteProduct } = useProducts()
  const { categories } = useCategories()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [activeTabs, setActiveTabs] = useState<string[]>(['All'])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isViewingProduct, setIsViewingProduct] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)
  const [isShowingSummary, setIsShowingSummary] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isNavigatingFromSummary, setIsNavigatingFromSummary] = useState(false)


  const handleView = (product: Product) => {
    setSelectedProduct(product)
    setIsViewingProduct(true)
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setIsEditingProduct(true)
  }

  const toggleTab = (cat: string) => {
    if (cat === 'All') {
      setActiveTabs(['All'])
      return
    }

    let newTabs = activeTabs.includes('All') ? [] : [...activeTabs]
    
    if (newTabs.includes(cat)) {
      newTabs = newTabs.filter(t => t !== cat)
    } else {
      newTabs.push(cat)
    }

    if (newTabs.length === 0) {
      newTabs = ['All']
    }
    
    setActiveTabs(newTabs)
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTabs.includes('All') || activeTabs.includes(p.category)
    return matchesSearch && matchesTab
  })

  // Get count for each category
  const getCategoryCount = (category: string) => {
    const baseItems = products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (category === 'All') return baseItems.length
    return baseItems.filter(p => p.category === category).length
  }

  // Dynamic category tabs
  const displayCategories = ['All', ...categories.map(c => c.name)]

  const navigateItem = (direction: 'next' | 'prev', list = filteredProducts) => {
    if (!selectedProduct || list.length <= 1) return
    const currentIndex = list.findIndex(p => p.id === selectedProduct.id)
    if (currentIndex === -1) return
    
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (newIndex >= list.length) newIndex = 0
    if (newIndex < 0) newIndex = list.length - 1
    
    setSelectedProduct(list[newIndex])
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-3 px-3 flex flex-col gap-3 border-b border-brand-chocolate/5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display">Our Bites</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShowingSummary(true)}
              className="w-10 h-10 rounded-md bg-brand-chocolate/5 text-brand-chocolate flex items-center justify-center border border-brand-chocolate/10 active:scale-90 transition-transform"
            >
              <BarChart3 size={20} />
            </button>
            <button 
              onClick={() => setIsAddFormOpen(true)}
              className="w-10 h-10 bg-brand-chocolate text-white rounded-md flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search bites..."
              />
            </div>
            <div className="flex items-center gap-1.5 h-[46px]">
              <button 
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="w-11 h-full bg-brand-chocolate/5 text-brand-chocolate/60 rounded-md flex items-center justify-center shrink-0 active:scale-90 transition-transform border border-brand-chocolate/5"
                title={viewMode === 'grid' ? "Switch to List View" : "Switch to Grid View"}
              >
                {viewMode === 'grid' ? <List size={16} /> : <LayoutGrid size={16} />}
              </button>
              <FilterToggle 
                isOpen={showFilters} 
                onClick={() => setShowFilters(!showFilters)} 
              />
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex-1 min-w-0">
                  <CategoryFilter 
                    options={displayCategories}
                    activeOptions={activeTabs}
                    onToggle={toggleTab}
                    getCount={getCategoryCount}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square glass-skeleton" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
          <img src="/logo-clean.png" alt="No products" className="w-32 h-32 opacity-20 mb-4" />
          <p className="text-sm font-medium">No bites found yet</p>
          <p className="text-xs mt-1">Tap the + button to add your first creation</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-10">
          <div className="w-20 h-20 bg-brand-chocolate/5 rounded-full flex items-center justify-center text-brand-chocolate/20 mb-4">
            <Search size={40} strokeWidth={1.5} />
          </div>
          <p className="text-brand-chocolate font-display text-xl">No bites found</p>
          <p className="text-brand-chocolate/40 text-sm mt-2">
            We couldn't find any products matching "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "flex flex-col gap-3"}>
          {filteredProducts.map((product) => (
            viewMode === 'grid' ? (
              <div key={product.id} className="group flex flex-col gap-3">
                <div className="aspect-square bg-brand-cream/20 flex items-center justify-center relative overflow-hidden rounded-lg group-hover:bg-brand-dough/10 transition-colors">
                  {(product.images?.[0] || product.image) ? (
                    <img src={product.images?.[0] || product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <img src="/logo-clean.png" alt="Default" className="w-28 h-28 opacity-10 group-hover:opacity-20" />
                  )}
                  
                  {/* Dark gradient overlay for text readability if there's an image */}
                  {(product.images?.[0] || product.image) && <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />}

                  <div className="absolute top-2 left-2 z-20">
                    <span className="bg-white text-[10px] font-bold px-2 py-1 rounded-md border border-brand-chocolate/10 text-brand-chocolate shadow-sm">
                      {product.category}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-20">
                    <button 
                      onClick={() => handleView(product)}
                      className="w-7 h-7 bg-white text-brand-chocolate/80 active:text-brand-chocolate rounded-md flex items-center justify-center shadow-md active:scale-90"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      onClick={() => handleEdit(product)}
                      className="w-7 h-7 bg-white text-brand-chocolate/80 active:text-brand-chocolate rounded-md flex items-center justify-center shadow-md active:scale-90"
                    >
                      <Pencil size={13} />
                    </button>
                    <button 
                      onClick={() => product.id && setProductToDelete(product.id)}
                      className="w-7 h-7 bg-white text-red-500 rounded-md flex items-center justify-center shadow-md active:scale-90"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="px-1">
                  <h3 className="text-sm font-bold text-brand-chocolate line-clamp-1">{product.name}</h3>
                  <p className="text-xs font-medium text-brand-chocolate/60 mt-0.5">GH₵ {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            ) : (
              <div key={product.id} className="group card flex items-center gap-4 p-3 active:scale-[0.98] transition-transform">
                <div className="w-16 h-16 bg-brand-cream/20 rounded-md overflow-hidden shrink-0 relative flex items-center justify-center">
                  {(product.images?.[0] || product.image) ? (
                    <img src={product.images?.[0] || product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <img src="/logo-clean.png" alt="Default" className="w-12 h-12 opacity-10 grayscale" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-brand-dough">{product.category}</span>
                  <h3 className="text-sm font-bold text-brand-chocolate line-clamp-1 leading-tight">{product.name}</h3>
                  <p className="text-xs font-medium text-brand-chocolate/60">GH₵ {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleView(product)}
                    className="w-8 h-8 rounded-md bg-brand-chocolate/5 text-brand-chocolate/40 hover:text-brand-chocolate transition-colors flex items-center justify-center"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    onClick={() => handleEdit(product)}
                    className="w-8 h-8 rounded-md bg-brand-chocolate/5 text-brand-chocolate/40 hover:text-brand-chocolate transition-colors flex items-center justify-center"
                  >
                    <Pencil size={15} />
                  </button>
                  <button 
                    onClick={() => product.id && setProductToDelete(product.id)}
                    className="w-8 h-8 rounded-md bg-red-50 text-red-400 hover:text-red-600 transition-colors flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      <BottomSheet
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        title="Add New Bite"
        subtitle="Create a new product for your menu"
      >
        <ProductForm onSuccess={() => setIsAddFormOpen(false)} />
      </BottomSheet>

      {/* View Details */}
      <BottomSheet 
        isOpen={isViewingProduct} 
        onClose={() => {
          setIsViewingProduct(false)
          setSelectedProduct(null)
          setIsNavigatingFromSummary(false)
        }} 
        onBack={isNavigatingFromSummary ? () => {
          setIsViewingProduct(false)
          setSelectedProduct(null)
          setIsNavigatingFromSummary(false)
          setIsShowingSummary(true)
        } : undefined}
        onSwipeLeft={() => navigateItem('next')}
        onSwipeRight={() => navigateItem('prev')}
        animationKey={selectedProduct?.id}
        title="Bite Details"
        subtitle="View full product information"
      >
        {selectedProduct && (
          <ProductDetails product={selectedProduct} />
        )}
      </BottomSheet>

      {/* Edit Product */}
      <BottomSheet 
        isOpen={isEditingProduct} 
        onClose={() => {
          setIsEditingProduct(false)
          setSelectedProduct(null)
        }} 
        onSwipeLeft={() => navigateItem('next')}
        onSwipeRight={() => navigateItem('prev')}
        animationKey={selectedProduct?.id}
        title="Edit Bite"
        subtitle="Modify product details and pricing"
      >

        {selectedProduct && (
          <ProductForm 
            onSuccess={() => {
              setIsEditingProduct(false)
              setSelectedProduct(null)
            }} 
            initialData={selectedProduct}
          />
        )}
      </BottomSheet>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={productToDelete !== null}
        onClose={() => setProductToDelete(null)}
        onConfirm={() => {
          if (productToDelete) deleteProduct(productToDelete)
        }}
        title="Delete Bite?"
        message={
          <>
            Are you sure you want to permanently delete this bite from your menu?{' '}
            <span className="text-red-500">This action cannot be undone.</span>
          </>
        }
      />
      <BottomSheet
        isOpen={isShowingSummary}
        onClose={() => setIsShowingSummary(false)}
        title="Bites Analytics"
        subtitle="Quick overview of your product catalogue"
      >
        <ProductSummary
          products={products}
          categories={categories.map(c => c.name)}
          onViewProduct={(product) => {
            setIsNavigatingFromSummary(true)
            setIsShowingSummary(false)
            handleView(product)
          }}
        />
      </BottomSheet>
    </div>
  )
}
