import React, { useState } from 'react'
import { useAuth } from '../../../auth/api/AuthContext'
import { ADMIN_USER_ID } from '@backend/seed/users'
import { ADMIN_ROLE_ID } from '@backend/seed/roles'
import { ArrowLeft, Shield, User } from 'lucide-react'
import { RolesTab } from '../roles-tab/RolesTab'
import { UsersTab } from '../users-tab/UsersTab'

interface RolePermissionManagerProps {
  onBack: () => void
}

export const RolePermissionManager: React.FC<RolePermissionManagerProps> = ({ onBack }) => {
  const { user: currentUser, roles, users, hasPermission } = useAuth()
  const canViewRoles = hasPermission('view:roles')
  const canViewUsers = hasPermission('view:users')

  const [activeTab, setActiveTab] = useState<'roles' | 'users'>(canViewRoles ? 'roles' : 'users')

  // Calculate visible users for the tab counter
  const isSuperAdmin = currentUser?.roleId === ADMIN_ROLE_ID
  const visibleUsers = users.filter(u => isSuperAdmin || u.id !== ADMIN_USER_ID)
  const visibleRoles = isSuperAdmin ? roles : roles.filter(r => r.id !== ADMIN_ROLE_ID)

  return (
    <div className="flex flex-col gap-2 select-none">
      {/* Header */}
      <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-1 pb-1 -mx-3 px-3 flex flex-col gap-1 border-b border-brand-chocolate/5">
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
        <div className="flex bg-brand-chocolate/5 p-1 rounded-md border border-brand-chocolate/5">
          {canViewRoles && (
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex-1 py-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'roles' ? 'bg-brand-chocolate text-white shadow-md' : 'text-brand-chocolate/60'
                }`}
            >
              <Shield size={14} />
              Roles ({visibleRoles.length})
            </button>
          )}
          {canViewUsers && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'users' ? 'bg-brand-chocolate text-white shadow-md' : 'text-brand-chocolate/60'
                }`}
            >
              <User size={14} />
              Staff ({visibleUsers.length})
            </button>
          )}
        </div>
      </header>

      {/* Main List Sections */}
      <div className="flex flex-col gap-4">
        {activeTab === 'roles' && canViewRoles && <RolesTab />}
        {activeTab === 'users' && canViewUsers && <UsersTab />}
      </div>
    </div>
  )
}
