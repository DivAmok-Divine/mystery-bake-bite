import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Key, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../../auth/api/AuthContext'
import { hashPassword } from '@backend/seed/users'
import { useNotification } from '@shared/ui/molecules/Notification'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser, logout } = useAuth()
  const { notify } = useNotification()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Clear state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setCurrentPassword('')
      setNewPassword('')
      setError('')
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirm(false)
    }
  }, [isOpen])

  if (!isOpen || !user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedCurrent = currentPassword.trim()
    const trimmedNew = newPassword.trim()
    
    // 1. Check if current password matches
    const hashedCurrentPassword = hashPassword(trimmedCurrent)
    if (hashedCurrentPassword !== user.password) {
      setError('Incorrect current password')
      return
    }

    // 2. Validate new password length
    if (trimmedNew.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    // 3. Validation rule: cant use old password
    const hashedNewPassword = hashPassword(trimmedNew)
    if (hashedNewPassword === user.password) {
      setError('Cannot use your current password as the new one')
      return
    }

    // Show the confirmation modal instead of updating directly
    setShowConfirm(true)
  }

  const handleConfirmedUpdate = async () => {
    setIsSubmitting(true)
    setShowConfirm(false)

    try {
      if (updateUser) {
        await updateUser(
          user.id, 
          user.name, 
          user.username || '', 
          user.email || '', 
          user.phone || '', 
          user.roleId, 
          newPassword.trim(), 
          user.assignedPermissions, 
          user.revokedPermissions
        )
        notify({ type: 'update', message: 'Password updated successfully!' })
        onClose()
        // Log the user out after updating the password
        if (logout) logout()
      }
    } catch (err) {
      notify({ type: 'error', message: 'Failed to update password.' })
      setIsSubmitting(false)
    }
  }

  const isFormFilled = currentPassword.trim().length > 0 && newPassword.trim().length > 0;
  const isButtonDisabled = isSubmitting || !isFormFilled;

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
                  <Key size={16} className="text-brand-chocolate" />
                </div>
                <h3 className="font-bold text-brand-chocolate">Change Password</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-chocolate/5 text-brand-chocolate/40 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-brand-chocolate/60 pl-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 bg-brand-chocolate/5 border border-brand-chocolate/10 rounded-md text-sm text-brand-chocolate placeholder-brand-chocolate/30 focus:outline-none focus:border-brand-chocolate focus:ring-0"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-chocolate/40 hover:text-brand-chocolate transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-brand-chocolate/60 pl-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 bg-brand-chocolate/5 border border-brand-chocolate/10 rounded-md text-sm text-brand-chocolate placeholder-brand-chocolate/30 focus:outline-none focus:border-brand-chocolate focus:ring-0"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-chocolate/40 hover:text-brand-chocolate transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs font-medium text-red-500 bg-red-50 px-3 py-2 rounded-md border border-red-100 flex items-center">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-bold text-brand-chocolate/60 hover:bg-brand-chocolate/5 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isButtonDisabled}
                  className="px-4 py-2 text-sm font-bold text-white bg-brand-chocolate rounded-md transition-colors hover:bg-brand-chocolate/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </motion.div>

          <ConfirmModal
            isOpen={showConfirm}
            onClose={() => setShowConfirm(false)}
            onConfirm={handleConfirmedUpdate}
            title="Update Password?"
            message="Changing your password will immediately log you out of your current session. You will need to log back in with your new password. Continue?"
            confirmText="Yes, Update & Logout"
            cancelText="Cancel"
            watermarkType="update"
            isDestructive={false}
          />
        </div>
      )}
    </AnimatePresence>
  )
}
