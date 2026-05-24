import React from 'react'
import { ShoppingBag, Users, BookOpen, BarChart3, Menu, Package, X, ShoppingCart } from 'lucide-react'
import { useAuth } from '../../../features/auth/api/AuthContext'

interface LayoutProps {
  children: React.ReactNode
  currentFeature: 'orders' | 'customers' | 'recipes' | 'reporting' | 'settings' | 'products' | 'pantry'
  onFeatureChange: (feature: 'orders' | 'customers' | 'recipes' | 'reporting' | 'settings' | 'products' | 'pantry') => void
}

export const Layout: React.FC<LayoutProps> = ({ children, currentFeature, onFeatureChange }) => {
  const { hasPermission } = useAuth()
  
  const navItems = [
    ...(hasPermission('view:orders') ? [{ id: 'orders' as const, icon: ShoppingBag, label: 'Orders' }] : []),
    ...(hasPermission('view:products') ? [{ id: 'products' as const, icon: Package, label: 'Bite' }] : []),
    ...(hasPermission('view:customers') ? [{ id: 'customers' as const, icon: Users, label: 'Customers' }] : []),
    ...(hasPermission('view:recipes') ? [{ id: 'recipes' as const, icon: BookOpen, label: 'Recipes' }] : []),
    ...(hasPermission('view:pantry') ? [{ id: 'pantry' as const, icon: ShoppingCart, label: 'Pantry' }] : []),
    ...(hasPermission('view:reports') ? [{ id: 'reporting' as const, icon: BarChart3, label: 'Reports' }] : []),
  ]

  const touchStart = React.useRef<{ x: number, y: number } | null>(null)
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return

    const distanceX = e.changedTouches[0].clientX - touchStart.current.x
    const distanceY = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null

    // Check if swipe is horizontal and meets minimum distance
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > minSwipeDistance) {
      const currentIndex = navItems.findIndex(item => item.id === currentFeature)
      if (currentIndex === -1) return

      if (distanceX < 0 && currentIndex < navItems.length - 1) {
        onFeatureChange(navItems[currentIndex + 1].id)
      } else if (distanceX > 0 && currentIndex > 0) {
        onFeatureChange(navItems[currentIndex - 1].id)
      }
    }
  }

  return (
    <div 
      className={`mobile-container flex flex-col ${currentFeature !== 'settings' ? 'pb-16' : ''}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Brand Header */}
      <header className="h-16 flex items-stretch justify-between bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-brand-chocolate/5">
        <div className="flex items-center gap-3 pl-2 pr-6">
          <img src="/logo-clean.png" alt="MBB Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-lg font-bold leading-none font-display">Mystery Bake Bite</h1>
            <p className="text-xs text-brand-chocolate/50  font-bold whitespace-nowrap">Unveiling the uniqueness of a recipe</p>
          </div>
        </div>
        {hasPermission('view:settings') && (
          <button 
            onClick={() => onFeatureChange('settings')}
            className={`w-20 flex items-center justify-center transition-all ${
              currentFeature === 'settings' ? "bg-brand-chocolate text-white" : "text-brand-chocolate hover:bg-brand-chocolate/5"
            }`}
          >
            {currentFeature === 'settings' ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </header>

      <main className="flex-1 p-3 pt-0">
        {children}
      </main>

      {/* Bottom Navigation */}
      {currentFeature !== 'settings' && (
        <nav className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-brand-chocolate/10 px-4 py-3 flex items-center z-50 ${
          navItems.length <= 2 ? 'justify-center gap-20' : navItems.length === 3 ? 'justify-center gap-12' : 'justify-around'
        }`}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentFeature === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onFeatureChange(item.id)}
                className={`flex flex-col items-center gap-1 w-16 transition-colors ${
                  isActive ? "text-brand-chocolate" : "text-brand-chocolate/30"
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}
