import { useState, useEffect, useRef } from 'react'
import { Layout } from '@shared/ui/layout/Layout'
import { FeatureRenderer } from './FeatureRenderer.tsx'
import { WelcomeSplashScreen } from '@shared/ui/molecules/WelcomeSplashScreen.tsx'
import { SplashScreen } from '@shared/ui/molecules/SplashScreen.tsx'
import { useAuth } from '../features/auth/api/AuthContext'
import { LoginPage } from '../features/auth/components/LoginPage'
import { ShieldAlert, LogOut } from 'lucide-react'

function App() {
  const { user, hasPermission, logout } = useAuth()
  const [currentFeature, setCurrentFeature] = useState<'orders' | 'customers' | 'recipes' | 'reporting' | 'settings' | 'products' | 'pantry'>('orders')

  const hasAnyPermission = !user || (
    hasPermission('view:orders') ||
    hasPermission('view:products') ||
    hasPermission('view:customers') ||
    hasPermission('view:recipes') ||
    hasPermission('view:pantry') ||
    hasPermission('view:reports') ||
    hasPermission('view:settings')
  )
  const [previousFeature, setPreviousFeature] = useState<'orders' | 'customers' | 'recipes' | 'reporting' | 'settings' | 'products' | 'pantry'>('orders')

  const [isInitialSplashDone, setIsInitialSplashDone] = useState(false)
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(false)
  const previousUserRef = useRef(user)

  // Track active login vs page refresh
  // If user transitions from null to a valid user object, it's an active login!
  useEffect(() => {
    if (!previousUserRef.current && user) {
      setShowWelcomeSplash(true)
    }
    previousUserRef.current = user
  }, [user])

  // Automatically redirect away from unauthorized tabs
  useEffect(() => {
    if (user) {
      const allowedFeatures = (['orders', 'products', 'customers', 'recipes', 'pantry', 'reporting', 'settings'] as const).filter(feat => {
        if (feat === 'reporting') return hasPermission('view:reports');
        return hasPermission(`view:${feat}`);
      });
      
      const isFeatureAllowed = currentFeature === 'reporting'
        ? hasPermission('view:reports')
        : hasPermission(`view:${currentFeature}`);

      if (!isFeatureAllowed && allowedFeatures.length > 0) {
        setCurrentFeature(allowedFeatures[0]);
      }
    }
  }, [user, currentFeature, hasPermission])

  const handleFeatureChange = (newFeature: typeof currentFeature) => {
    if (newFeature === 'settings') {
      if (currentFeature !== 'settings') {
        setPreviousFeature(currentFeature)
        setCurrentFeature('settings')
      } else {
        // If already in settings, go back
        setCurrentFeature(previousFeature)
      }
    } else {
      setPreviousFeature(newFeature)
      setCurrentFeature(newFeature)
    }
  }
  
  return (
    <>
      {!isInitialSplashDone ? (
        <SplashScreen onComplete={() => setIsInitialSplashDone(true)} />
      ) : !user ? (
        <LoginPage />
      ) : showWelcomeSplash ? (
        <WelcomeSplashScreen onComplete={() => setShowWelcomeSplash(false)} />
      ) : !hasAnyPermission ? (
        <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-brand-chocolate/5 flex items-center justify-center text-brand-chocolate mb-6 border border-brand-chocolate/10">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-2xl font-bold font-display text-brand-chocolate leading-tight mb-2">
            Access Pending
          </h1>
          <p className="text-sm text-brand-chocolate/60 max-w-xs leading-relaxed mb-8">
            Hello, <strong className="text-brand-chocolate font-bold">{user?.name}</strong>. Your account does not have any active privileges assigned yet. Please contact an administrator to activate your role.
          </p>
          <button 
            onClick={() => logout()}
            className="w-full max-w-xs py-3.5 bg-brand-chocolate text-white font-bold rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      ) : (
        <Layout currentFeature={currentFeature} onFeatureChange={handleFeatureChange}>
          <FeatureRenderer currentFeature={currentFeature} />
        </Layout>
      )}
    </>
  )
}

export default App
