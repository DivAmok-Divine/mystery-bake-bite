import React from 'react'
import { ShoppingBag, Users, BookOpen, BarChart3, Menu, Package, X } from 'lucide-react'
import { useAuth } from '../../../features/auth/api/AuthContext'

interface LayoutProps {
  children: React.ReactNode
  currentFeature: 'orders' | 'customers' | 'recipes' | 'reporting' | 'settings' | 'products'
  onFeatureChange: (feature: 'orders' | 'customers' | 'recipes' | 'reporting' | 'settings' | 'products') => void
}

export const Layout: React.FC<LayoutProps> = ({ children, currentFeature, onFeatureChange }) => {
  const { isAdmin } = useAuth()
  
  const navItems = [
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'customers', icon: Users, label: 'Customers' },
    { id: 'recipes', icon: BookOpen, label: 'Recipes' },
    ...(isAdmin ? [{ id: 'reporting' as const, icon: BarChart3, label: 'Reports' }] : []),
  ] as const

  return (
    <div className="mobile-container flex flex-col pb-16">
      {/* Brand Header */}
      <header className="h-16 flex items-stretch justify-between bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-brand-chocolate/5">
        <div className="flex items-center gap-3 pl-2 pr-6">
          <img src="/logo-clean.png" alt="MBB Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-lg font-bold leading-none font-display">Mystery Bake Bites</h1>
            <p className="text-xs text-brand-chocolate/50  font-bold whitespace-nowrap">Unveiling the uniqueness of a recipe</p>
          </div>
        </div>
        <button 
          onClick={() => onFeatureChange('settings')}
          className={`w-20 flex items-center justify-center transition-all ${
            currentFeature === 'settings' ? "bg-brand-chocolate text-white" : "text-brand-chocolate hover:bg-brand-chocolate/5"
          }`}
        >
          {currentFeature === 'settings' ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <main className="flex-1 p-6 pt-2">
        {children}
      </main>

      {/* Bottom Navigation */}
      {currentFeature !== 'settings' && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-brand-chocolate/10 px-6 py-3 flex justify-between items-center z-50">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentFeature === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onFeatureChange(item.id)}
                className={`flex flex-col items-center gap-1 transition-colors ${
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
