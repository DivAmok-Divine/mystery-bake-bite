import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, X, HardDrive, Cloud, Loader2, Trash2 } from 'lucide-react'
import { isCloudMode, setDbMode, db } from '@backend/lib/db'
import { seedDatabase, clearDatabase } from '@backend/seed/sandbox'
import { useNotification } from '@shared/ui/molecules/Notification'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'

interface DeveloperToolsProps {
  isOpen: boolean
  onClose: () => void
}

export const DeveloperToolsModal: React.FC<DeveloperToolsProps> = ({ isOpen, onClose }) => {
  const { notify } = useNotification()
  const isCloud = isCloudMode()
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [showConfirmSeed, setShowConfirmSeed] = useState(false)
  const [showConfirmMode, setShowConfirmMode] = useState<'local' | 'cloud' | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    const checkData = async () => {
      const count = await db.customers.count()
      setHasData(count > 0)
    }
    checkData()
  }, [])

  const handleToggleMode = (mode: 'local' | 'cloud') => {
    setShowConfirmMode(mode)
  }

  const confirmToggleMode = async () => {
    if (!showConfirmMode) return
    setDbMode(showConfirmMode)
    window.location.reload()
  }

  const handleClearLocalData = async () => {
    setIsSeeding(true)
    try {
      await clearDatabase() // This clears all business data but leaves users/roles
      window.location.reload()
    } catch (e) {
      notify({ type: 'error', message: 'Failed to clear local sandbox data' })
      setIsSeeding(false)
    }
  }

  const handleSeedLocalData = async () => {
    setIsSeeding(true)
    try {
      await seedDatabase()
      window.location.reload()
    } catch (e) {
      notify({ type: 'error', message: 'Failed to seed local sandbox data' })
      setIsSeeding(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-brand-chocolate/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-md shadow-xl z-[101] overflow-hidden border border-brand-chocolate/10"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-brand-cream border-b border-brand-chocolate/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-chocolate/5 flex items-center justify-center">
                  <Database size={16} className="text-brand-chocolate" />
                </div>
                <h3 className="font-bold text-brand-chocolate">Developer Tools</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-chocolate/5 text-brand-chocolate/40 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-brand-chocolate/60 pl-1 tracking-wider">Database Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleToggleMode('local')}
                    disabled={!isCloud}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-md border-2 transition-all ${
                      !isCloud 
                        ? 'border-brand-chocolate bg-brand-chocolate/5 text-brand-chocolate cursor-default' 
                        : 'border-brand-chocolate/10 bg-white text-brand-chocolate/40 hover:border-brand-chocolate/30'
                    }`}
                  >
                    <HardDrive size={24} />
                    <span className="text-sm font-bold">Local (Dexie)</span>
                  </button>
                  <button
                    onClick={() => handleToggleMode('cloud')}
                    disabled={isCloud}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-md border-2 transition-all ${
                      isCloud 
                        ? 'border-brand-chocolate bg-brand-chocolate/5 text-brand-chocolate cursor-default' 
                        : 'border-brand-chocolate/10 bg-white text-brand-chocolate/40 hover:border-brand-chocolate/30'
                    }`}
                  >
                    <Cloud size={24} />
                    <span className="text-sm font-bold">Cloud (Supabase)</span>
                  </button>
                </div>
              </div>

              {!isCloud && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-brand-chocolate/60 pl-1 tracking-wider">Data Operations</label>
                  {hasData ? (
                    <button
                      onClick={() => setShowConfirmClear(true)}
                      disabled={isSeeding}
                      className="flex items-center justify-center gap-2 w-full h-11 px-4 bg-red-50 text-red-600 font-bold rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {isSeeding ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      {isSeeding ? 'Working...' : 'Clear All Local Data'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowConfirmSeed(true)}
                      disabled={isSeeding}
                      className="flex items-center justify-center gap-2 w-full h-11 px-4 bg-brand-chocolate/5 text-brand-chocolate font-bold rounded-md hover:bg-brand-chocolate/10 transition-colors disabled:opacity-50"
                    >
                      {isSeeding ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                      {isSeeding ? 'Working...' : 'Seed Local Data'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          <ConfirmModal
            isOpen={showConfirmSeed}
            onClose={() => setShowConfirmSeed(false)}
            onConfirm={handleSeedLocalData}
            title="Seed Sandbox Data?"
            message="This will fill your local database with 50-200 dummy records per module so you can test the application."
            confirmText="Yes, Seed Data"
            cancelText="Cancel"
            isDestructive={false}
          />

          <ConfirmModal
            isOpen={showConfirmClear}
            onClose={() => setShowConfirmClear(false)}
            onConfirm={handleClearLocalData}
            title="Clear Local Database?"
            message="This will permanently delete all sandbox data from your browser. Your admin user account will be preserved."
            confirmText="Yes, Clear Data"
            cancelText="Cancel"
            watermarkType="delete"
            isDestructive={true}
          />

          <ConfirmModal
            isOpen={showConfirmMode !== null}
            onClose={() => setShowConfirmMode(null)}
            onConfirm={confirmToggleMode}
            title={showConfirmMode === 'cloud' ? "Switch to Cloud Mode?" : "Switch to Local Mode?"}
            message={showConfirmMode === 'cloud' 
              ? "You are about to switch to the live Supabase cloud database. All changes made will affect the real application." 
              : "You are about to switch to the local Dexie Sandbox database. Changes here won't affect the live app, and you can seed it with dummy data."}
            confirmText={showConfirmMode === 'cloud' ? "Yes, Switch to Cloud" : "Yes, Switch to Local"}
            cancelText="Cancel"
            isDestructive={false}
          />
        </div>
      )}
    </AnimatePresence>
  )
}
