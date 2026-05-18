import { useState } from 'react'
import { Layout } from '@shared/ui/layout/Layout'
import { FeatureRenderer } from './FeatureRenderer.tsx'
import { SplashScreen } from '@shared/ui/molecules/SplashScreen'

function App() {
  const [currentFeature, setCurrentFeature] = useState<'orders' | 'customers' | 'recipes' | 'reporting' | 'settings' | 'products' | 'pantry'>('orders')
  const [previousFeature, setPreviousFeature] = useState<'orders' | 'customers' | 'recipes' | 'reporting' | 'settings' | 'products' | 'pantry'>('orders')

  const [isSplashDone, setIsSplashDone] = useState(false)

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
      <SplashScreen onComplete={() => setIsSplashDone(true)} />
      {isSplashDone && (
        <Layout currentFeature={currentFeature} onFeatureChange={handleFeatureChange}>
          <FeatureRenderer currentFeature={currentFeature} />
        </Layout>
      )}
    </>
  )
}

export default App
