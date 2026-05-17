import React, { lazy, Suspense } from 'react'

/**
 * Lazy load main feature list views to optimize bundle chunking and improve initial load time.
 * Dynamic imports compile to separate JS bundles loaded on demand when switching tabs.
 */
const OrderList = lazy(() => import('../features/orders/components/OrderList.tsx').then(m => ({ default: m.OrderList })))
const ProductList = lazy(() => import('../features/products/components/ProductList.tsx').then(m => ({ default: m.ProductList })))
const CustomerList = lazy(() => import('../features/customers/components/CustomerList.tsx').then(m => ({ default: m.CustomerList })))
const RecipeList = lazy(() => import('../features/recipes/components/RecipeList.tsx').then(m => ({ default: m.RecipeList })))
const ReportingDashboard = lazy(() => import('../features/reporting/components/ReportingDashboard.tsx').then(m => ({ default: m.ReportingDashboard })))
const SettingsPage = lazy(() => import('../features/settings/components/settings/SettingsPage.tsx').then(m => ({ default: m.SettingsPage })))
const PantryList = lazy(() => import('../features/pantry/components/PantryList.tsx').then(m => ({ default: m.PantryList })))

interface FeatureRendererProps {
  currentFeature: 'orders' | 'customers' | 'recipes' | 'reporting' | 'settings' | 'products' | 'pantry'
}

/**
 * A high-fidelity Layout Skeleton fallback.
 * It is dynamically aware of the active feature and renders matching mock shapes 
 * (titles, search bars, action buttons, filter tabs, grids) at exact pixel alignments.
 * This completely prevents visual jumps or popping when React Suspense fetches chunks.
 */
const PageSkeleton: React.FC<{ feature: string }> = ({ feature }) => {
  
  // Render mock headers matching the layout of each target page perfectly
  const renderHeader = () => {
    switch (feature) {
      case 'products': // Our Bite List Header layout
        return (
          <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-3 px-3 flex flex-col gap-3 border-b border-brand-chocolate/5 animate-pulse">
            <div className="flex items-center justify-between">
              {/* Mock Title */}
              <div className="h-9 w-36 bg-brand-chocolate/10 rounded-md" />
              {/* Mock Actions: Summary & Add Button */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-md bg-brand-chocolate/10" />
                <div className="w-10 h-10 rounded-md bg-brand-chocolate/10" />
              </div>
            </div>
            {/* Mock Search Bar & Filters */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-[46px] bg-brand-chocolate/10 rounded-md" />
              <div className="w-11 h-11 bg-brand-chocolate/10 rounded-md shrink-0" />
              <div className="w-11 h-11 bg-brand-chocolate/10 rounded-md shrink-0" />
            </div>
            {/* Mock Category Filters */}
            <div className="flex gap-2 overflow-hidden py-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 w-20 bg-brand-chocolate/10 rounded-full shrink-0" />
              ))}
            </div>
          </header>
        )
      case 'orders': // Orders List Header layout
        return (
          <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-3 px-3 flex flex-col gap-3 border-b border-brand-chocolate/5 animate-pulse">
            <div className="flex items-center justify-between">
              {/* Mock Title */}
              <div className="h-9 w-32 bg-brand-chocolate/10 rounded-md" />
              {/* Mock Add Order Button */}
              <div className="w-10 h-10 rounded-md bg-brand-chocolate/10" />
            </div>
            {/* Mock Search Bar & Date Picker Filter */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-[46px] bg-brand-chocolate/10 rounded-md" />
              <div className="w-24 h-11 bg-brand-chocolate/10 rounded-md shrink-0" />
            </div>
          </header>
        )
      case 'customers': // Customers List Header layout
        return (
          <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-3 px-3 flex flex-col gap-3 border-b border-brand-chocolate/5 animate-pulse">
            <div className="flex items-center justify-between">
              {/* Mock Title */}
              <div className="h-9 w-40 bg-brand-chocolate/10 rounded-md" />
              {/* Mock Add Customer Button */}
              <div className="w-10 h-10 rounded-md bg-brand-chocolate/10" />
            </div>
            {/* Mock Search Bar & Filter Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-[46px] bg-brand-chocolate/10 rounded-md" />
              <div className="w-11 h-11 bg-brand-chocolate/10 rounded-md shrink-0" />
            </div>
          </header>
        )
      case 'recipes': // Secret Recipes List Header layout
        return (
          <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-3 px-3 flex flex-col gap-3 border-b border-brand-chocolate/5 animate-pulse">
            <div className="flex items-center justify-between">
              {/* Mock Title */}
              <div className="h-9 w-44 bg-brand-chocolate/10 rounded-md" />
              {/* Mock Add Recipe Button */}
              <div className="w-10 h-10 rounded-md bg-brand-chocolate/10" />
            </div>
            {/* Mock Search Bar */}
            <div className="h-[46px] bg-brand-chocolate/10 rounded-md w-full animate-pulse" />
          </header>
        )
      case 'pantry': // Pantry List Header layout
        return (
          <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-3 px-3 flex flex-col gap-3 border-b border-brand-chocolate/5 animate-pulse">
            <div className="flex items-center justify-between">
              {/* Mock Title */}
              <div className="h-9 w-32 bg-brand-chocolate/10 rounded-md" />
              {/* Mock Actions */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-md bg-brand-chocolate/10" />
                <div className="w-10 h-10 rounded-md bg-brand-chocolate/10" />
              </div>
            </div>
            {/* Mock Search Bar, History, and Filter Toggles */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-[46px] bg-brand-chocolate/10 rounded-md" />
              <div className="w-11 h-11 bg-brand-chocolate/10 rounded-md shrink-0" />
              <div className="w-11 h-11 bg-brand-chocolate/10 rounded-md shrink-0" />
            </div>
          </header>
        )
      case 'reporting': // Analytics Reporting Header layout
        return (
          <header className="sticky top-16 z-30 bg-brand-cream/95 pt-4 pb-2 -mx-3 px-3 flex flex-col gap-3 border-b border-brand-chocolate/5 animate-pulse">
            <div className="h-9 w-48 bg-brand-chocolate/10 rounded-md" />
          </header>
        )
      case 'settings': // Settings Header layout
        return (
          <header className="sticky top-16 z-30 bg-brand-cream/95 pt-4 pb-2 -mx-3 px-3 flex flex-col gap-3 border-b border-brand-chocolate/5 animate-pulse">
            <div className="h-9 w-28 bg-brand-chocolate/10 rounded-md" />
          </header>
        )
      default:
        return null
    }
  }

  // Render mock data body matching each feature list page exactly
  const renderContent = () => {
    switch (feature) {
      case 'products':
        return (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square glass-skeleton rounded-md" />
            ))}
          </div>
        )
      case 'orders':
        return (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 glass-skeleton rounded-md" />
            ))}
          </div>
        )
      case 'customers':
        return (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 glass-skeleton rounded-md" />
            ))}
          </div>
        )
      case 'recipes':
        return (
          <div className="flex flex-col gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-40 glass-skeleton rounded-md" />
            ))}
          </div>
        )
      case 'pantry':
        return (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 glass-skeleton rounded-md" />
            ))}
          </div>
        )
      case 'reporting':
        return (
          <div className="flex flex-col gap-6 animate-pulse pt-4">
            {/* Mock Top Analytics Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-brand-chocolate/10 rounded-md animate-pulse" />
              ))}
            </div>
            {/* Mock Main Dashboard Charts Panel */}
            <div className="h-64 bg-brand-chocolate/10 rounded-md w-full animate-pulse" />
          </div>
        )
      case 'settings':
        return (
          <div className="flex flex-col gap-4 animate-pulse pt-4">
            {/* Mock Sub-Tabs (General, Equipment, Categories) */}
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 w-24 bg-brand-chocolate/10 rounded-md animate-pulse" />
              ))}
            </div>
            {/* Mock Active Setting Settings Panel Body */}
            <div className="h-48 bg-brand-chocolate/10 rounded-md w-full animate-pulse" />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {renderHeader()}
      {renderContent()}
    </div>
  )
}

/**
 * Main feature display router.
 * Wraps dynamic lazy-loaded lists inside a Suspense boundary with a layout-matching loader.
 */
export const FeatureRenderer: React.FC<FeatureRendererProps> = ({ currentFeature }) => {
  const renderFeature = () => {
    switch (currentFeature) {
      case 'orders':
        return <OrderList />
      case 'products':
        return <ProductList />
      case 'customers':
        return <CustomerList />
      case 'recipes':
        return <RecipeList />
      case 'reporting':
        return <ReportingDashboard />
      case 'settings':
        return <SettingsPage />
      case 'pantry':
        return <PantryList />
      default:
        return null
    }
  }

  return (
    <Suspense fallback={<PageSkeleton feature={currentFeature} />}>
      {renderFeature()}
    </Suspense>
  )
}
