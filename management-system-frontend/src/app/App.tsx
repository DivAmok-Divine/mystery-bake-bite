import { useState, useEffect, useRef } from 'react'
import { Layout } from '@shared/ui/layout/Layout'
import { FeatureRenderer } from './FeatureRenderer.tsx'
import { WelcomeSplashScreen } from '@shared/ui/molecules/WelcomeSplashScreen.tsx'
import { SplashScreen } from '@shared/ui/molecules/SplashScreen.tsx'
import { useAuth } from '../features/auth/api/AuthContext'
import { LoginPage } from '../features/auth/components/LoginPage'

function App() {
  const { user } = useAuth()
  const [currentFeature, setCurrentFeature] = useState<'orders' | 'customers' | 'recipes' | 'reporting' | 'settings' | 'products' | 'pantry'>('orders')
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
      ) : (
        <Layout currentFeature={currentFeature} onFeatureChange={handleFeatureChange}>
          <FeatureRenderer currentFeature={currentFeature} />
        </Layout>
      )}
    </>
  )
}

export default App
