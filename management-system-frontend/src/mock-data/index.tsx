import { useState, useEffect } from 'react'
import { Database, Trash2, Loader2, HardDrive } from 'lucide-react'
import { ConfirmModal } from '../shared/ui/molecules/ConfirmModal'
import { db, isCloudMode } from '../../../backend/lib/db'
import { useNotification } from '../shared/ui/molecules/Notification'
import { clearDatabase, seedDatabase } from '@backend/seed/sandbox/index'

export * from '@backend/seed/sandbox/index'

export const useDeveloperTools = () => {
  const { notify } = useNotification()
  const [showSeedConfirm, setShowSeedConfirm] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [hasData, setHasData] = useState(false)
  const [dbMode, setDbModeState] = useState<'local' | 'cloud'>(isCloudMode() ? 'cloud' : 'local')

  useEffect(() => {
    const checkData = async () => {
      try {
        const count = await db.customers.count()
        setHasData(count > 0)
      } catch (err) {
        console.error('Error checking local database status:', err)
      }
    }
    checkData()
  }, [dbMode])

  const toggleDbMode = () => {
    const next = dbMode === 'local' ? 'cloud' : 'local'
    localStorage.setItem('mbb_db_mode', next)
    setDbModeState(next)
    
    notify({
      type: next === 'cloud' ? 'info' : 'update',
      title: 'Database Mode Switched',
      message: next === 'cloud' 
        ? 'Connected to ☁️ Supabase Cloud (Real Production Data)!'
        : 'Switched to 💾 Dexie Local Mode (Sandbox Testing Mode)!'
    })

    // Brief premium delay for beautiful notification visibility before hot reload
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  const handleSeed = async () => {
    setIsSeeding(true)
    try {
      await seedDatabase()
      notify({
        type: 'add',
        title: 'Database Seeded',
        message: 'Successfully seeded local browser database with mock test data!'
      })
      window.location.reload()
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Seeding Failed',
        message: err.message || 'Check local storage connection!'
      })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleClear = async () => {
    setIsSeeding(true)
    try {
      await clearDatabase()
      notify({
        type: 'delete',
        title: 'Local Data Cleared',
        message: 'Successfully cleared all local browser database records!'
      })
      window.location.reload()
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Clear Failed',
        message: err.message || 'Check local storage connection!'
      })
    } finally {
      setIsSeeding(false)
    }
  }

  const developerToolsSection = {
    title: 'System & Database Tools',
    items: [
      { 
        label: 'Database Connection', 
        value: dbMode === 'cloud' 
          ? '☁️ Supabase Cloud (Real Production Data)' 
          : '💾 Dexie Local Mode (Sandbox Testing Mode)', 
        icon: dbMode === 'cloud' ? Database : HardDrive, 
        action: toggleDbMode,
        actionLabel: dbMode === 'cloud' ? 'Switch to Local' : 'Switch to Cloud',
        disabled: isSeeding
      },
      // Show seed/clear actions ONLY when in Sandbox Local Mode to prevent any cloud mutation errors!
      ...(dbMode === 'local' ? [{ 
        label: hasData ? 'Clear Sandbox Data' : 'Seed Sandbox Data', 
        value: hasData ? 'Clear browser Cache (IndexedDB)' : 'Pre-fill with 50-200 local test records', 
        icon: isSeeding ? Loader2 : (hasData ? Trash2 : Database), 
        action: () => hasData ? setShowClearConfirm(true) : setShowSeedConfirm(true),
        actionLabel: isSeeding ? 'Working...' : (hasData ? 'Clear Sandbox' : 'Seed sandbox'),
        disabled: isSeeding
      }] : [])
    ]
  }

  const DeveloperToolsModal = (
    <>
      <ConfirmModal
        isOpen={showSeedConfirm}
        onClose={() => setShowSeedConfirm(false)}
        onConfirm={handleSeed}
        title="Seed Sandbox Test Data?"
        message="This will fill your LOCAL browser storage with 50-200 offline test records for sandbox trial."
        confirmText="Yes, Seed Sandbox"
        isDestructive={false}
      />
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClear}
        title="Clear Sandbox Database?"
        message="This will PERMANENTLY erase all mock/sandbox records from your local browser. Your cloud Supabase data remains completely unaffected."
        confirmText="Yes, Clear Sandbox"
        isDestructive={true}
      />
    </>
  )

  return { developerToolsSection, DeveloperToolsModal }
}
