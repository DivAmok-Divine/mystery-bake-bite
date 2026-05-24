import React, { useState } from 'react'
import { useAuth } from '../../../auth/api/AuthContext'
import { ADMIN_ROLE_ID } from '@backend/seed/roles'
import { ADMIN_USER_ID } from '@backend/seed/users'
import {
  Plus, Pencil, Trash2, Key, Check, X, Info
} from 'lucide-react'
import { BottomSheet } from '@shared/ui/molecules/BottomSheet'
import { useNotification } from '@shared/ui/molecules/Notification'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'
import { DropDown } from '@shared/ui/molecules/DropDown'
import { SYSTEM_PERMISSIONS } from '@backend/seed/permissions'
import { SearchBar } from '@shared/ui/molecules/SearchBar'
import { useDebounce } from '@shared/hooks/useDebounce'

export const UsersTab: React.FC = () => {
  const {
    user: currentUser,
    roles,
    users,
    createUser,
    updateUser,
    deleteUser,
    hasPermission
  } = useAuth()
  const { notify } = useNotification()

  const [userSheetOpen, setUserSheetOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  const [overrideSheetOpen, setOverrideSheetOpen] = useState(false)
  const [overrideUserId, setOverrideUserId] = useState<string | null>(null)

  // User Form States
  const [userName, setUserName] = useState('')
  const [userUsername, setUserUsername] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userRoleId, setUserRoleId] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // User Overrides States
  const [overrideAssigned, setOverrideAssigned] = useState<string[]>([])
  const [overrideRevoked, setOverrideRevoked] = useState<string[]>([])

  // Delete states
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  // Confirm states
  const [showConfirmSaveUser, setShowConfirmSaveUser] = useState(false)
  const [showConfirmSaveOverrides, setShowConfirmSaveOverrides] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 150)

  // Security checks:
  const isSuperAdmin = currentUser?.roleId === ADMIN_ROLE_ID
  const visibleUsers = users.filter(u => isSuperAdmin || u.id !== ADMIN_USER_ID)

  const filteredUsers = visibleUsers.filter(u =>
    u.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
    (u.phone && u.phone.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
  )

  // --- USER CRUD ACTIONS ---
  const handleOpenNewUser = () => {
    setEditingUserId(null)
    setUserName('')
    setUserUsername('')
    setUserEmail('')
    setUserPhone('')
    setUserRoleId('')
    setUserPassword('')
    setErrors({})
    setUserSheetOpen(true)
  }

  const handleOpenEditUser = (userId: string) => {
    if (userId === currentUser?.id) {
      notify({ type: 'error', message: 'You cannot edit your own core role/details from here.' })
      return
    }
    const user = users.find(u => u.id === userId)
    if (!user) return
    setEditingUserId(userId)
    setUserName(user.name)
    setUserUsername(user.username || '')
    setUserEmail(user.email || '')
    setUserPhone(user.phone || '')
    setUserRoleId(user.roleId)
    setUserPassword('')
    setErrors({})
    setUserSheetOpen(true)
  }

  const handleSaveUserClick = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    
    if (!userName.trim()) newErrors.name = 'Full name is required'
    if (!userUsername.trim()) newErrors.username = 'Username is required'
    if (!userEmail.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!userRoleId) newErrors.roleId = 'Please select a role'
    if (!editingUserId && !userPassword.trim()) newErrors.password = 'Password is required'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    setShowConfirmSaveUser(true)
  }

  const executeSaveUser = async () => {
    try {
      if (editingUserId) {
        const userObj = users.find(u => u.id === editingUserId)
        await updateUser(
          editingUserId,
          userName,
          userUsername,
          userEmail,
          userPhone,
          userRoleId,
          userPassword.trim() || userObj?.password || '',
          userObj?.assignedPermissions,
          userObj?.revokedPermissions
        )
        notify({ type: 'update', title: 'User Updated', message: `User "${userName}" updated successfully.` })
      } else {
        await createUser(userName, userUsername, userEmail, userPhone, userRoleId, userPassword)
        notify({ type: 'add', title: 'User Created', message: `User "${userName}" added successfully.` })
      }
      setUserSheetOpen(false)
    } catch (err) {
      notify({ type: 'error', message: 'Failed to save user.' })
    } finally {
      setShowConfirmSaveUser(false)
    }
  }

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return
    const userObj = users.find(u => u.id === userToDelete)

    if (userToDelete === currentUser?.id) {
      notify({ type: 'error', message: 'You cannot delete your own logged-in account!' })
      return
    }
    if (userToDelete === ADMIN_USER_ID) {
      notify({ type: 'error', message: 'The primary Admin account is protected.' })
      return
    }

    try {
      await deleteUser(userToDelete)
      notify({ type: 'delete', title: 'User Deleted', message: `Account "${userObj?.name}" removed.` })
    } catch (err) {
      notify({ type: 'error', message: 'Failed to delete user.' })
    } finally {
      setUserToDelete(null)
    }
  }

  // --- USER OVERRIDES PANEL ---
  const handleOpenOverrides = (userId: string) => {
    if (userId === currentUser?.id) {
      notify({ type: 'error', message: 'You cannot edit overrides for your own account.' })
      return
    }
    const user = users.find(u => u.id === userId)
    if (!user) return
    setOverrideUserId(userId)
    setOverrideAssigned(user.assignedPermissions || [])
    setOverrideRevoked(user.revokedPermissions || [])
    setOverrideSheetOpen(true)
  }

  const handleToggleOverride = (key: string, state: 'allow' | 'block' | 'inherit') => {
    if (state === 'allow') {
      setOverrideAssigned(prev => [...prev.filter(k => k !== key), key])
      setOverrideRevoked(prev => prev.filter(k => k !== key))
    } else if (state === 'block') {
      setOverrideRevoked(prev => [...prev.filter(k => k !== key), key])
      setOverrideAssigned(prev => prev.filter(k => k !== key))
    } else {
      setOverrideAssigned(prev => prev.filter(k => k !== key))
      setOverrideRevoked(prev => prev.filter(k => k !== key))
    }
  }

  const handleSaveOverridesClick = (e: React.FormEvent) => {
    e.preventDefault()
    if (!overrideUserId) return
    setShowConfirmSaveOverrides(true)
  }

  const executeSaveOverrides = async () => {
    if (!overrideUserId) return
    const userObj = users.find(u => u.id === overrideUserId)
    if (!userObj) return

    try {
      await updateUser(
        overrideUserId,
        userObj.name,
        userObj.username,
        userObj.email,
        userObj.phone,
        userObj.roleId,
        userObj.password,
        overrideAssigned,
        overrideRevoked
      )
      notify({ type: 'update', title: 'Overrides Applied', message: 'Explicit overrides updated successfully!' })
      setOverrideSheetOpen(false)
    } catch (err) {
      notify({ type: 'error', message: 'Failed to apply overrides.' })
    } finally {
      setShowConfirmSaveOverrides(false)
    }
  }

  const originalUser = editingUserId ? users.find(u => u.id === editingUserId) : null
  const isUserDirty = originalUser
    ? (userName !== originalUser.name ||
      userUsername !== (originalUser.username || '') ||
      userEmail !== (originalUser.email || '') ||
      userPhone !== (originalUser.phone || '') ||
      userRoleId !== originalUser.roleId ||
      userPassword.trim() !== '')
    : (userName.trim() !== '' || userUsername.trim() !== '' || userEmail.trim() !== '' || userPhone.trim() !== '' || userRoleId !== '' || userPassword.trim() !== '')

  const isUserValid = userName.trim() !== '' && userUsername.trim() !== '' && userEmail.trim() !== '' && userRoleId !== '' && (editingUserId ? true : userPassword.trim() !== '')
  const canSaveUser = isUserDirty && isUserValid

  const originalOverrideUser = overrideUserId ? users.find(u => u.id === overrideUserId) : null
  const isOverrideDirty = originalOverrideUser
    ? (overrideAssigned.join(',') !== (originalOverrideUser.assignedPermissions || []).join(',') ||
      overrideRevoked.join(',') !== (originalOverrideUser.revokedPermissions || []).join(','))
    : false
  const canSaveOverrides = isOverrideDirty

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-[170px] z-20 bg-brand-cream/95 backdrop-blur-md pt-2 pb-3 -mx-1 px-1 flex flex-col gap-3 border-b border-brand-chocolate/5">
        <div className="flex justify-between items-center px-1">
          <h1 className="text-3xl font-display">Users</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNewUser}
              className="w-10 h-10 rounded-md bg-brand-chocolate text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="px-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search staff accounts..."
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-brand-chocolate/50 text-sm font-bold">
            No staff accounts found matching "{searchQuery}"
          </div>
        ) : (
          filteredUsers.map((userObj) => {
            const userRole = roles.find(r => r.id === userObj.roleId)
            const isOwnAccount = currentUser?.id === userObj.id
            const isProtectedAdmin = userObj.id === ADMIN_USER_ID

            return (
              <div key={userObj.id} className="card flex flex-col gap-3 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center text-white shadow font-display text-lg leading-none pt-[2px]"
                      style={{ backgroundColor: userRole?.color || '#3d2314' }}
                    >
                      {userObj.name[0]}
                    </div>
                    <div>
                      <h4 className="text-lg font-display text-brand-chocolate flex items-center gap-1.5 leading-tight">
                        {userObj.name}
                        {isOwnAccount && (
                          <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded bg-green-50 text-green-600 border border-green-200">
                            You
                          </span>
                        )}
                      </h4>
                      <p className="text-xs font-bold text-brand-chocolate/40 mt-0.5">
                        Role: <span style={{ color: userRole?.color }}>{userRole?.name || 'Unknown'}</span>
                        {userObj.username && <span> &bull; @{userObj.username}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Edit controls (Cannot edit self core details, only other users) */}
                  <div className="flex items-center gap-2">
                    {!isOwnAccount && (
                      <button
                        onClick={() => handleOpenEditUser(userObj.id)}
                        className="w-7 h-7 bg-brand-chocolate/5 text-brand-chocolate/40 hover:text-brand-chocolate hover:bg-brand-chocolate/10 rounded-lg flex items-center justify-center transition-all"
                        title="Edit Name/Role"
                      >
                        <Pencil size={13} />
                      </button>
                    )}

                    {!isOwnAccount && !isProtectedAdmin && (
                      <button
                        onClick={() => setUserToDelete(userObj.id)}
                        className="w-7 h-7 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg flex items-center justify-center transition-all"
                        title="Remove account"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct Override Summary & Switch trigger */}
                <div className="pt-2 border-t border-brand-chocolate/5 flex items-center justify-between text-xs">
                  <div className="flex gap-2">
                    {userObj.assignedPermissions && userObj.assignedPermissions.length > 0 && (
                      <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                        +{userObj.assignedPermissions.length} Grants
                      </span>
                    )}
                    {userObj.revokedPermissions && userObj.revokedPermissions.length > 0 && (
                      <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        -{userObj.revokedPermissions.length} Revoked
                      </span>
                    )}
                  </div>

                  {!isOwnAccount ? (
                    <button
                      onClick={() => handleOpenOverrides(userObj.id)}
                      className="text-[10px] font-bold text-brand-chocolate bg-brand-chocolate/5 hover:bg-brand-dough px-3 py-1.5 rounded-md border border-brand-chocolate/10 transition-colors flex items-center gap-1"
                    >
                      <Key size={10} /> Overrides...
                    </button>
                  ) : (
                    <span className="text-[10px] text-brand-chocolate/30 italic pr-1">Own account is immutable</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* --- BOTTOM SHEET: USER CREATOR/EDITOR --- */}
      <BottomSheet
        isOpen={userSheetOpen}
        onClose={() => setUserSheetOpen(false)}
        title={editingUserId ? 'Edit Account' : 'Create Staff Account'}
        subtitle="Provide the staff member name and secure password"
      >
        <form onSubmit={handleSaveUserClick} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-brand-chocolate/40 tracking-widest px-1">Staff Full Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value)
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
              }}
              placeholder="e.g. Kofi, Ama"
              className={`w-full px-4 h-14 bg-brand-chocolate/5 rounded-md text-sm text-brand-chocolate focus:outline-none focus:ring-1 focus:ring-brand-chocolate border ${errors.name ? 'border-red-500 bg-red-50/50' : 'border-brand-chocolate/10'}`}
            />
            {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-brand-chocolate/40 tracking-widest px-1">Username</label>
            <input
              type="text"
              value={userUsername}
              onChange={(e) => {
                setUserUsername(e.target.value)
                if (errors.username) setErrors(prev => ({ ...prev, username: '' }))
              }}
              placeholder="e.g. kofi.baker"
              className={`w-full px-4 h-14 bg-brand-chocolate/5 rounded-md text-sm text-brand-chocolate focus:outline-none focus:ring-1 focus:ring-brand-chocolate border ${errors.username ? 'border-red-500 bg-red-50/50' : 'border-brand-chocolate/10'}`}
            />
            {errors.username && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.username}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-brand-chocolate/40 tracking-widest px-1">Email Address</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => {
                setUserEmail(e.target.value)
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
              }}
              placeholder="e.g. kofi@mysterybakebite.com"
              className={`w-full px-4 h-14 bg-brand-chocolate/5 rounded-md text-sm text-brand-chocolate focus:outline-none focus:ring-1 focus:ring-brand-chocolate border ${errors.email ? 'border-red-500 bg-red-50/50' : 'border-brand-chocolate/10'}`}
            />
            {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.email}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-brand-chocolate/40 tracking-widest px-1">Phone Number</label>
            <input
              type="tel"
              value={userPhone}
              onChange={(e) => {
                setUserPhone(e.target.value)
                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }))
              }}
              placeholder="e.g. 0540000000"
              className={`w-full px-4 h-14 bg-brand-chocolate/5 rounded-md text-sm text-brand-chocolate focus:outline-none focus:ring-1 focus:ring-brand-chocolate border ${errors.phone ? 'border-red-500 bg-red-50/50' : 'border-brand-chocolate/10'}`}
            />
            {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.phone}</p>}
          </div>

          {/* Role selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-brand-chocolate/40 tracking-widest px-1">Role</label>
            <div className={`${errors.roleId ? 'border border-red-500 rounded-lg p-[1px] bg-red-50/50' : ''}`}>
              <DropDown
                value={userRoleId}
                onChange={(val) => {
                  setUserRoleId(val)
                  if (errors.roleId) setErrors(prev => ({ ...prev, roleId: '' }))
                }}
                options={roles.filter(r => isSuperAdmin || r.id !== ADMIN_ROLE_ID).map(r => ({ value: r.id, label: r.name }))}
                placeholder="Select a role"
              />
            </div>
            {errors.roleId && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.roleId}</p>}
          </div>

          {/* Secure passkey */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-brand-chocolate/40 tracking-widest px-1">
              {editingUserId ? 'Reset Password (leave empty to keep current)' : 'Access Password'}
            </label>
            <input
              type="text"
              value={userPassword}
              onChange={(e) => {
                setUserPassword(e.target.value)
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
              }}
              placeholder={editingUserId ? 'Enter new password to reset...' : 'e.g. staff123, 7789'}
              className={`w-full px-4 h-14 bg-brand-chocolate/5 rounded-md text-sm text-brand-chocolate focus:outline-none focus:ring-1 focus:ring-brand-chocolate border ${errors.password ? 'border-red-500 bg-red-50/50' : 'border-brand-chocolate/10'}`}
            />
            {errors.password && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.password}</p>}
          </div>

          <div className="sticky bottom-0 bg-transparent pt-2 pb-4 z-10 mt-2">
            <button
              type="submit"
              disabled={!canSaveUser}
              className="w-full h-14 bg-brand-chocolate text-white font-bold rounded-md text-lg shadow-xl active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Save Staff
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* --- BOTTOM SHEET: EXPLICIT PERMISSION OVERRIDES --- */}
      <BottomSheet
        isOpen={overrideSheetOpen}
        onClose={() => setOverrideSheetOpen(false)}
        title="Direct Access Overrides"
        subtitle={`Set explicit allowed or blocked permissions override rules for ${users.find(u => u.id === overrideUserId)?.name}`}
      >
        <form onSubmit={handleSaveOverridesClick} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 p-3 bg-brand-chocolate/5 rounded-md border border-brand-chocolate/10 text-xs leading-snug w-full">

            {/* Left Side: Legend Items */}
            <div className="flex flex-col gap-3">
              {/* Top Row: Inherited States */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded border border-brand-chocolate/20 bg-white" />
                  <span className="text-[10px] text-brand-chocolate/60 font-bold">Role Denied</span>
                  <div className="relative group/tooltip">
                    <div className="text-brand-chocolate/40 cursor-help transition-all hover:text-brand-chocolate group-hover/tooltip:scale-110">
                      <Info size={12} strokeWidth={2.5} />
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2.5 bg-[#3D261C] text-white text-[10px] rounded-lg shadow-2xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all transform scale-95 group-hover/tooltip:scale-100 z-[120] text-center leading-relaxed">
                      <p className="font-bold mb-1 underline decoration-white/20 underline-offset-2">Role Denied</p>
                      The user does NOT have this permission by default from their role.
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[#3D261C]" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded border border-brand-chocolate/30 bg-brand-chocolate/20 flex items-center justify-center"><Check size={10} className="text-brand-chocolate/70" /></div>
                  <span className="text-[10px] text-brand-chocolate/60 font-bold">Role Granted</span>
                  <div className="relative group/tooltip">
                    <div className="text-brand-chocolate/40 cursor-help transition-all hover:text-brand-chocolate group-hover/tooltip:scale-110">
                      <Info size={12} strokeWidth={2.5} />
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2.5 bg-[#3D261C] text-white text-[10px] rounded-lg shadow-2xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all transform scale-95 group-hover/tooltip:scale-100 z-[120] text-center leading-relaxed">
                      <p className="font-bold mb-1 underline decoration-white/20 underline-offset-2">Role Granted</p>
                      The user ALREADY has this permission by default from their role.
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[#3D261C]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Explicit Overrides */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded border border-green-600 bg-green-500 flex items-center justify-center"><Check size={10} className="text-white" /></div>
                  <span className="text-[10px] text-brand-chocolate/60 font-bold">Special Grant</span>
                  <div className="relative group/tooltip">
                    <div className="text-brand-chocolate/40 cursor-help transition-all hover:text-brand-chocolate group-hover/tooltip:scale-110">
                      <Info size={12} strokeWidth={2.5} />
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2.5 bg-[#3D261C] text-white text-[10px] rounded-lg shadow-2xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all transform scale-95 group-hover/tooltip:scale-100 z-[120] text-center leading-relaxed">
                      <p className="font-bold mb-1 underline decoration-white/20 underline-offset-2">Special Grant</p>
                      You have explicitly ALLOWED this permission, overriding their default role.
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[#3D261C]" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded border border-red-600 bg-red-500 flex items-center justify-center"><X size={10} className="text-white" /></div>
                  <span className="text-[10px] text-brand-chocolate/60 font-bold">Explicit Deny</span>
                  <div className="relative group/tooltip">
                    <div className="text-brand-chocolate/40 cursor-help transition-all hover:text-brand-chocolate group-hover/tooltip:scale-110">
                      <Info size={12} strokeWidth={2.5} />
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2.5 bg-[#3D261C] text-white text-[10px] rounded-lg shadow-2xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all transform scale-95 group-hover/tooltip:scale-100 z-[120] text-center leading-relaxed">
                      <p className="font-bold mb-1 underline decoration-white/20 underline-offset-2">Explicit Deny</p>
                      You have explicitly BLOCKED this permission, overriding their default role.
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[#3D261C]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Instructions */}
            <div className="flex-1 flex items-center justify-end border-l border-brand-chocolate/10 pl-2 ml-2 overflow-hidden">
              <p className="text-[9px] text-brand-chocolate/50 italic font-medium leading-tight text-right line-clamp-2">
                Tap below to explicitly grant or deny access.
              </p>
            </div>
          </div>

          {/* Override controls grid */}
          <div className="bg-brand-chocolate/5 p-1 rounded-md border border-brand-chocolate/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-chocolate/10 text-[10px] text-brand-chocolate/50 font-bold tracking-wider">
                    <th className="py-3 pl-4 text-left w-[36%]">Module</th>
                    <th className="py-3 text-center w-[16%]">View</th>
                    <th className="py-3 text-center w-[16%]">Create</th>
                    <th className="py-3 text-center w-[16%]">Edit</th>
                    <th className="py-3 text-center w-[16%]">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { resource: 'orders', name: 'Orders' },
                    { resource: 'products', name: 'Products' },
                    { resource: 'customers', name: 'Customers' },
                    { resource: 'recipes', name: 'Recipes' },
                    { resource: 'pantry', name: 'Pantry' },
                    { resource: 'reports', name: 'Reports' },
                    { resource: 'settings', name: 'Settings' },
                    { resource: 'users', name: 'Users' },
                    { resource: 'roles', name: 'Roles' }
                  ].map((mod, idx, arr) => (
                    <tr
                      key={mod.resource}
                      className={`hover:bg-white/40 transition-colors ${idx !== arr.length - 1 ? 'border-b border-brand-chocolate/5' : ''}`}
                    >
                      <td className="py-4 pl-4 text-xs font-bold text-brand-chocolate">{mod.name}</td>
                      {['view', 'create', 'edit', 'delete'].map(action => {
                        const key = `${action}:${mod.resource}`

                        const available = SYSTEM_PERMISSIONS.some(p => p.key === key) && hasPermission(key) && (key !== 'delete:orders' || isSuperAdmin)

                        if (!available) {
                          return <td key={action} className="py-4 text-center"><span className="text-brand-chocolate/20">-</span></td>
                        }

                        const isAllowed = overrideAssigned.includes(key)
                        const isBlocked = overrideRevoked.includes(key)

                        const userObj = users.find(u => u.id === overrideUserId)
                        const roleObj = roles.find(r => r.id === userObj?.roleId)
                        const roleHasIt = roleObj?.permissions.includes('*') || roleObj?.permissions.includes(key)

                        let visualState = 'inherit_denied'
                        if (isAllowed) visualState = 'explicit_grant'
                        else if (isBlocked) visualState = 'explicit_deny'
                        else if (roleHasIt) visualState = 'inherit_grant'

                        let bgClass = 'bg-white'
                        let borderClass = 'border-brand-chocolate/20'
                        let icon = null

                        if (visualState === 'inherit_grant') {
                          bgClass = 'bg-brand-chocolate/20'
                          borderClass = 'border-brand-chocolate/30'
                          icon = <Check size={12} className="text-brand-chocolate/70" />
                        } else if (visualState === 'explicit_grant') {
                          bgClass = 'bg-green-500'
                          borderClass = 'border-green-600'
                          icon = <Check size={12} className="text-white" />
                        } else if (visualState === 'explicit_deny') {
                          bgClass = 'bg-red-500'
                          borderClass = 'border-red-600'
                          icon = <X size={12} className="text-white" />
                        }

                        const handleCycleClick = () => {
                          if (visualState === 'inherit_denied') handleToggleOverride(key, 'allow')
                          else if (visualState === 'inherit_grant') handleToggleOverride(key, 'block')
                          else if (visualState === 'explicit_grant') handleToggleOverride(key, 'inherit')
                          else if (visualState === 'explicit_deny') handleToggleOverride(key, 'inherit')
                        }

                        return (
                          <td key={action} className="py-4 px-1 text-center">
                            <button
                              type="button"
                              onClick={handleCycleClick}
                              className={`w-[18px] h-[18px] mx-auto rounded border flex items-center justify-center cursor-pointer transition-colors ${bgClass} ${borderClass}`}
                            >
                              {icon}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sticky bottom-0 bg-transparent pt-2 pb-4 z-10 mt-2">
            <button
              type="submit"
              disabled={!canSaveOverrides}
              className="w-full h-14 bg-brand-chocolate text-white font-bold rounded-md text-lg shadow-xl active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Apply Overrides
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Delete User Confirm */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDeleteUser}
        title="Delete Staff Account"
        message={
          <p>
            Are you sure you want to permanently delete this staff account? <strong>This action cannot be undone.</strong>
          </p>
        }
        confirmText="Yes, Delete Staff"
        cancelText="Keep Staff"
        isDestructive={true}
      />

      {/* Save User Confirm */}
      <ConfirmModal
        isOpen={showConfirmSaveUser}
        onClose={() => setShowConfirmSaveUser(false)}
        onConfirm={executeSaveUser}
        title={editingUserId ? 'Save Changes?' : 'Create Staff?'}
        message={editingUserId
          ? `Update "${userName}" with the new details?`
          : `Save "${userName}" as a new staff member?`
        }
        confirmText={editingUserId ? 'Yes, Save' : 'Yes, Add'}
        isDestructive={false}
        watermarkType="update"
      />

      {/* Save Overrides Confirm */}
      <ConfirmModal
        isOpen={showConfirmSaveOverrides}
        onClose={() => setShowConfirmSaveOverrides(false)}
        onConfirm={executeSaveOverrides}
        title="Apply Overrides?"
        message="Apply these custom permission overrides to this user?"
        confirmText="Yes, Apply"
        isDestructive={false}
        watermarkType="update"
      />
    </div>
  )
}
