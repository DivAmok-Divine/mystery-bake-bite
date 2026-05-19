import React, { useState } from 'react'
import { useAuth } from '../../../auth/api/AuthContext'
import { ADMIN_ROLE_ID } from '@backend/seed/roles'
import { ADMIN_USER_ID } from '@backend/seed/users'
import { 
  ArrowLeft, Shield, User, Plus, Pencil, Trash2, 
  Key, Check, ShieldAlert
} from 'lucide-react'
import { BottomSheet } from '@shared/ui/molecules/BottomSheet'
import { useNotification } from '@shared/ui/molecules/Notification'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'
import { SYSTEM_PERMISSIONS } from '@backend/seed/permissions'

const PALETTE = ['#3d2314', '#e8c39e', '#cf7a4b', '#607955', '#456a8a', '#8b5b7b']

interface RolePermissionManagerProps {
  onBack: () => void
}

export const RolePermissionManager: React.FC<RolePermissionManagerProps> = ({ onBack }) => {
  const { 
    user: currentUser,
    roles, 
    users, 
    createRole, 
    updateRole, 
    deleteRole,
    createUser, 
    updateUser, 
    deleteUser 
  } = useAuth()
  
  const { notify } = useNotification()
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles')
  
  // Sheet states
  const [roleSheetOpen, setRoleSheetOpen] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  
  const [userSheetOpen, setUserSheetOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  
  const [overrideSheetOpen, setOverrideSheetOpen] = useState(false)
  const [overrideUserId, setOverrideUserId] = useState<string | null>(null)

  // Role Form States
  const [roleName, setRoleName] = useState('')
  const [roleColor, setRoleColor] = useState(PALETTE[0])
  const [rolePermissions, setRolePermissions] = useState<string[]>([])

  // User Form States
  const [userName, setUserName] = useState('')
  const [userRoleId, setUserRoleId] = useState('')
  const [userPassword, setUserPassword] = useState('')

  // User Overrides States
  const [overrideAssigned, setOverrideAssigned] = useState<string[]>([])
  const [overrideRevoked, setOverrideRevoked] = useState<string[]>([])

  // Delete states
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  // Security checks:
  // Non-admins can never see the root Admin user or modify their role
  const isSuperAdmin = currentUser?.roleId === ADMIN_ROLE_ID
  const visibleUsers = users.filter(u => isSuperAdmin || u.id !== ADMIN_USER_ID)

  const togglePermission = (key: string) => {
    if (rolePermissions.includes(key)) {
      setRolePermissions(prev => prev.filter(k => k !== key))
    } else {
      setRolePermissions(prev => [...prev, key])
    }
  }

  // --- ROLE CRUD ACTIONS ---
  const handleOpenNewRole = () => {
    setEditingRoleId(null)
    setRoleName('')
    setRoleColor(PALETTE[0])
    setRolePermissions([])
    setRoleSheetOpen(true)
  }

  const handleOpenEditRole = (roleId: string) => {
    if (roleId === ADMIN_ROLE_ID) {
      notify({ type: 'error', message: 'The Admin role is immutable and cannot be edited.' })
      return
    }
    const role = roles.find(r => r.id === roleId)
    if (!role) return
    setEditingRoleId(roleId)
    setRoleName(role.name)
    setRoleColor(role.color)
    setRolePermissions(role.permissions)
    setRoleSheetOpen(true)
  }

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName.trim()) {
      notify({ type: 'error', message: 'Please enter a role name.' })
      return
    }

    try {
      if (editingRoleId) {
        await updateRole(editingRoleId, roleName, roleColor, rolePermissions)
        notify({ type: 'update', title: 'Role Updated', message: `Role "${roleName}" saved successfully!` })
      } else {
        await createRole(roleName, roleColor, rolePermissions)
        notify({ type: 'add', title: 'Role Created', message: `Role "${roleName}" added successfully!` })
      }
      setRoleSheetOpen(false)
    } catch (err) {
      notify({ type: 'error', message: 'Failed to save role.' })
    }
  }

  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return
    const roleObj = roles.find(r => r.id === roleToDelete)
    if (roleToDelete === ADMIN_ROLE_ID) {
      notify({ type: 'error', message: 'Core roles cannot be deleted.' })
      return
    }

    // Referential integrity protection: Prevent deleting roles that have active user assignments
    const assignedUsers = users.filter(u => u.roleId === roleToDelete)
    if (assignedUsers.length > 0) {
      notify({ 
        type: 'error', 
        title: 'Role in use',
        message: `Cannot delete role. It is currently assigned to ${assignedUsers.length} active user(s).` 
      })
      setRoleToDelete(null)
      return
    }

    try {
      await deleteRole(roleToDelete)
      notify({ type: 'delete', title: 'Role Deleted', message: `Role "${roleObj?.name}" removed.` })
    } catch (err) {
      notify({ type: 'error', message: 'Failed to delete role.' })
    } finally {
      setRoleToDelete(null)
    }
  }

  // --- USER CRUD ACTIONS ---
  const handleOpenNewUser = () => {
    setEditingUserId(null)
    setUserName('')
    setUserRoleId(roles.length > 1 ? roles[1].id : (roles[0]?.id || ''))
    setUserPassword('')
    setUserSheetOpen(true)
  }

  const handleOpenEditUser = (userId: string) => {
    // Prohibits editing own details to prevent locking yourself out!
    if (userId === currentUser?.id) {
      notify({ type: 'error', message: 'You cannot edit your own core role/details from here.' })
      return
    }
    const user = users.find(u => u.id === userId)
    if (!user) return
    setEditingUserId(userId)
    setUserName(user.name)
    setUserRoleId(user.roleId)
    setUserPassword(user.password || '')
    setUserSheetOpen(true)
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName.trim()) {
      notify({ type: 'error', message: 'Please enter a name.' })
      return
    }
    if (!userPassword.trim()) {
      notify({ type: 'error', message: 'Please enter a password.' })
      return
    }

    try {
      if (editingUserId) {
        const userObj = users.find(u => u.id === editingUserId)
        await updateUser(
          editingUserId, 
          userName, 
          userRoleId, 
          userPassword, 
          userObj?.assignedPermissions, 
          userObj?.revokedPermissions
        )
        notify({ type: 'update', title: 'User Updated', message: `User "${userName}" updated successfully.` })
      } else {
        await createUser(userName, userRoleId, userPassword)
        notify({ type: 'add', title: 'User Created', message: `User "${userName}" added successfully.` })
      }
      setUserSheetOpen(false)
    } catch (err) {
      notify({ type: 'error', message: 'Failed to save user.' })
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

  const handleSaveOverrides = async () => {
    if (!overrideUserId) return
    const userObj = users.find(u => u.id === overrideUserId)
    if (!userObj) return

    try {
      await updateUser(
        overrideUserId,
        userObj.name,
        userObj.roleId,
        userObj.password,
        overrideAssigned,
        overrideRevoked
      )
      notify({ type: 'update', title: 'Overrides Applied', message: 'Explicit overrides updated successfully!' })
      setOverrideSheetOpen(false)
    } catch (err) {
      notify({ type: 'error', message: 'Failed to apply overrides.' })
    }
  }

  return (
    <div className="flex flex-col gap-4 select-none">
      {/* Header */}
      <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-3 px-3 flex flex-col gap-3 border-b border-brand-chocolate/5">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-chocolate/5 text-brand-chocolate hover:bg-brand-chocolate/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-display leading-tight">Access Control</h1>
            <p className="text-brand-chocolate/40 text-xs font-bold tracking-wider">Roles & Overrides Manager</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-brand-chocolate/5 p-1 rounded-xl border border-brand-chocolate/5 mt-1">
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'roles' ? 'bg-brand-chocolate text-white shadow-md' : 'text-brand-chocolate/60'
            }`}
          >
            <Shield size={14} />
            Roles ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'users' ? 'bg-brand-chocolate text-white shadow-md' : 'text-brand-chocolate/60'
            }`}
          >
            <User size={14} />
            Team Members ({visibleUsers.length})
          </button>
        </div>
      </header>

      {/* Main List Sections */}
      <div className="flex flex-col gap-4">
        {activeTab === 'roles' ? (
          /* ROLES LIST */
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-brand-chocolate/50 tracking-widest">Active Roles</h3>
              <button
                onClick={handleOpenNewRole}
                className="text-xs font-bold text-brand-chocolate flex items-center gap-1 hover:opacity-80"
              >
                <Plus size={14} /> Add Role
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {roles.map((role) => (
                <div key={role.id} className="card flex flex-col gap-3 relative overflow-hidden group">
                  {/* Color strip decorator */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-2.5" 
                    style={{ backgroundColor: role.color }}
                  />
                  
                  <div className="flex items-start justify-between pl-2">
                    <div>
                      <h4 className="text-lg font-display text-brand-chocolate flex items-center gap-2">
                        {role.name}
                        {role.id === 'admin' && (
                          <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded bg-brand-chocolate text-white scale-90">
                            Core
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-brand-chocolate/30 font-bold tracking-tighter">
                        Role ID: {role.id}
                      </p>
                    </div>

                    {/* Actions (Disable Admin edits) */}
                    {role.id !== ADMIN_ROLE_ID && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditRole(role.id)}
                          className="w-7 h-7 bg-brand-chocolate/5 text-brand-chocolate/40 hover:text-brand-chocolate hover:bg-brand-chocolate/10 rounded-lg flex items-center justify-center transition-all"
                          title="Edit Role permissions"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setRoleToDelete(role.id)}
                          className="w-7 h-7 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg flex items-center justify-center transition-all"
                          title="Delete Role"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Permissions pills */}
                  <div className="flex flex-wrap gap-1.5 pl-2 mt-1">
                    {role.permissions.includes('*') ? (
                      <span className="text-[10px] font-bold text-brand-chocolate bg-brand-chocolate/5 border border-brand-chocolate/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                        👑 Full System Access (*)
                      </span>
                    ) : role.permissions.length === 0 ? (
                      <span className="text-[10px] font-bold text-brand-chocolate/30 italic">No permissions assigned</span>
                    ) : (
                      role.permissions.map(p => (
                        <span 
                          key={p} 
                          className="text-[9px] font-bold text-brand-chocolate/60 bg-brand-chocolate/5 border border-brand-chocolate/5 px-2 py-0.5 rounded"
                        >
                          {SYSTEM_PERMISSIONS.find(sp => sp.key === p)?.title || p}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* USERS/TEAM LIST */
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-brand-chocolate/50 tracking-widest">Active Staff Accounts</h3>
              <button
                onClick={handleOpenNewUser}
                className="text-xs font-bold text-brand-chocolate flex items-center gap-1 hover:opacity-80"
              >
                <Plus size={14} /> Add Member
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {visibleUsers.map((userObj) => {
                const userRole = roles.find(r => r.id === userObj.roleId)
                const isOwnAccount = currentUser?.id === userObj.id
                const isProtectedAdmin = userObj.id === ADMIN_USER_ID
                
                return (
                  <div key={userObj.id} className="card flex flex-col gap-3 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow font-display text-lg"
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
                          className="text-[10px] font-bold text-brand-chocolate bg-brand-chocolate/5 hover:bg-brand-dough px-3 py-1.5 rounded-lg border border-brand-chocolate/10 transition-colors flex items-center gap-1"
                        >
                          <Key size={10} /> Overrides...
                        </button>
                      ) : (
                        <span className="text-[10px] text-brand-chocolate/30 italic pr-1">Own account is immutable</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* --- BOTTOM SHEET: ROLE CREATOR/EDITOR --- */}
      <BottomSheet
        isOpen={roleSheetOpen}
        onClose={() => setRoleSheetOpen(false)}
        title={editingRoleId ? 'Edit Access Role' : 'Create Custom Role'}
        subtitle="Name your role and check what tools they are allowed to use"
      >
        <form onSubmit={handleSaveRole} className="flex flex-col gap-4 pb-6">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-brand-chocolate/40 tracking-widest px-1">Role Name</label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Lead Baker, Assistant"
              className="w-full px-4 py-3 bg-brand-chocolate/5 border border-brand-chocolate/10 rounded-xl text-sm font-bold text-brand-chocolate focus:outline-none focus:ring-2 focus:ring-brand-chocolate/20"
            />
          </div>

          {/* Color picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-chocolate/40 tracking-widest px-1">Thematic Color</label>
            <div className="flex gap-3">
              {PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setRoleColor(c)}
                  className="w-8 h-8 rounded-full border border-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
                  style={{ backgroundColor: c }}
                >
                  {roleColor === c && <Check size={14} className="text-white invert" />}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions grid */}
          <div className="flex flex-col gap-2 mt-1">
            <label className="text-[10px] font-bold text-brand-chocolate/40 tracking-widest px-1">Permissions Gated</label>
            <div className="flex flex-col gap-2 bg-brand-chocolate/5 p-3 rounded-xl border border-brand-chocolate/5 max-h-[45vh] overflow-y-auto">
              {SYSTEM_PERMISSIONS.map(sp => (
                <label 
                  key={sp.key} 
                  className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer active:bg-brand-cream/10 transition-colors ${
                    rolePermissions.includes(sp.key) ? 'border-brand-chocolate bg-white' : 'border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={rolePermissions.includes(sp.key)}
                    onChange={() => togglePermission(sp.key)}
                    className="w-4 h-4 rounded text-brand-chocolate border-brand-chocolate/30 mt-0.5 focus:ring-brand-chocolate cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-brand-chocolate">{sp.title}</p>
                    <p className="text-[10px] text-brand-chocolate/40 leading-snug mt-0.5">{sp.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-3 bg-brand-chocolate text-white font-bold rounded-xl text-sm shadow-xl"
          >
            Save Access Role
          </button>
        </form>
      </BottomSheet>

      {/* --- BOTTOM SHEET: USER CREATOR/EDITOR --- */}
      <BottomSheet
        isOpen={userSheetOpen}
        onClose={() => setUserSheetOpen(false)}
        title={editingUserId ? 'Edit Account' : 'Create Team Account'}
        subtitle="Provide the staff member name and secure password"
      >
        <form onSubmit={handleSaveUser} className="flex flex-col gap-4 pb-6">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-brand-chocolate/40 tracking-widest px-1">Staff Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Kofi, Ama"
              className="w-full px-4 py-3 bg-brand-chocolate/5 border border-brand-chocolate/10 rounded-xl text-sm font-bold text-brand-chocolate focus:outline-none focus:ring-2 focus:ring-brand-chocolate/20"
            />
          </div>

          {/* Role selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-brand-chocolate/40 tracking-widest px-1">Inherited Role</label>
            <select
              value={userRoleId}
              onChange={(e) => setUserRoleId(e.target.value)}
              className="w-full px-4 py-3 bg-brand-chocolate/5 border border-brand-chocolate/10 rounded-xl text-sm font-bold text-brand-chocolate focus:outline-none focus:ring-2 focus:ring-brand-chocolate/20 appearance-none cursor-pointer"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Secure passkey */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-brand-chocolate/40 tracking-widest px-1">Access Password</label>
            <input
              type="text"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="e.g. staff123, 7789"
              className="w-full px-4 py-3 bg-brand-chocolate/5 border border-brand-chocolate/10 rounded-xl text-sm font-bold text-brand-chocolate focus:outline-none focus:ring-2 focus:ring-brand-chocolate/20"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-3 bg-brand-chocolate text-white font-bold rounded-xl text-sm shadow-xl"
          >
            Save Team Member
          </button>
        </form>
      </BottomSheet>

      {/* --- BOTTOM SHEET: EXPLICIT PERMISSION OVERRIDES --- */}
      <BottomSheet
        isOpen={overrideSheetOpen}
        onClose={() => setOverrideSheetOpen(false)}
        title="Direct Access Overrides"
        subtitle={`Set explicit allowed or blocked permissions override rules for ${users.find(u => u.id === overrideUserId)?.name}`}
      >
        <div className="flex flex-col gap-4 pb-6">
          <div className="flex items-start gap-3 p-3 bg-brand-chocolate/5 rounded-xl border border-brand-chocolate/10 text-xs leading-snug">
            <ShieldAlert size={18} className="text-brand-dough flex-shrink-0 mt-0.5" />
            <p className="text-brand-chocolate/60">
              Direct overrides take <strong>absolute priority</strong> over their inherited role settings. Allowed grants (green) give access, while Revoked blocks (red) prevent it.
            </p>
          </div>

          {/* Override controls grid */}
          <div className="flex flex-col gap-2.5 max-h-[50vh] overflow-y-auto px-1">
            {SYSTEM_PERMISSIONS.map(sp => {
              const isAllowed = overrideAssigned.includes(sp.key)
              const isBlocked = overrideRevoked.includes(sp.key)
              const isInherit = !isAllowed && !isBlocked
              
              // Resolve active status under inherited role to display hint
              const userObj = users.find(u => u.id === overrideUserId)
              const roleObj = roles.find(r => r.id === userObj?.roleId)
              const roleHasIt = roleObj?.permissions.includes('*') || roleObj?.permissions.includes(sp.key)

              return (
                <div key={sp.key} className="flex flex-col gap-1.5 p-3 bg-white border border-brand-chocolate/10 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-brand-chocolate">{sp.title}</span>
                      <p className="text-[10px] text-brand-chocolate/40 mt-0.5">{sp.desc}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 bg-brand-chocolate/5 p-0.5 rounded-lg border border-brand-chocolate/5 mt-1.5">
                    <button
                      onClick={() => handleToggleOverride(sp.key, 'inherit')}
                      className={`py-1.5 rounded text-[10px] font-bold transition-all ${
                        isInherit 
                          ? 'bg-white text-brand-chocolate shadow-sm border border-brand-chocolate/10' 
                          : 'text-brand-chocolate/40 hover:text-brand-chocolate'
                      }`}
                    >
                      Inherit ({roleHasIt ? 'Allowed' : 'Blocked'})
                    </button>
                    <button
                      onClick={() => handleToggleOverride(sp.key, 'allow')}
                      className={`py-1.5 rounded text-[10px] font-bold transition-all ${
                        isAllowed 
                          ? 'bg-green-600 text-white shadow-sm' 
                          : 'text-green-600/60 hover:text-green-600'
                      }`}
                    >
                      Grant Override
                    </button>
                    <button
                      onClick={() => handleToggleOverride(sp.key, 'block')}
                      className={`py-1.5 rounded text-[10px] font-bold transition-all ${
                        isBlocked 
                          ? 'bg-red-500 text-white shadow-sm' 
                          : 'text-red-500/60 hover:text-red-500'
                      }`}
                    >
                      Revoke Override
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={handleSaveOverrides}
            className="w-full mt-4 py-3.5 bg-brand-chocolate text-white font-bold rounded-xl text-sm shadow-xl active:scale-[0.98] transition-transform"
          >
            Apply Overrides
          </button>
        </div>
      </BottomSheet>

      {/* --- CONFIRMATION MODALS --- */}
      <ConfirmModal
        isOpen={roleToDelete !== null}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleConfirmDeleteRole}
        title="Delete Access Role?"
        message="Are you sure you want to permanently delete this role? Any team members holding this role will lose their custom inherited permissions!"
      />

      <ConfirmModal
        isOpen={userToDelete !== null}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDeleteUser}
        title="Remove Staff Account?"
        message="Are you sure you want to delete this staff member's account? They will lose access to the bakery suite instantly!"
      />
    </div>
  )
}
