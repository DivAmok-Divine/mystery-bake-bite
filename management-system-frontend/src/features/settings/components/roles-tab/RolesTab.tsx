import React, { useState } from 'react'
import { useAuth } from '../../../auth/api/AuthContext'
import { ADMIN_ROLE_ID } from '@backend/seed/roles'
import {
  Plus, Pencil, Trash2, Check
} from 'lucide-react'
import { BottomSheet } from '@shared/ui/molecules/BottomSheet'
import { useNotification } from '@shared/ui/molecules/Notification'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'
import { SYSTEM_PERMISSIONS } from '@backend/seed/permissions'
import { SearchBar } from '@shared/ui/molecules/SearchBar'
import { useDebounce } from '@shared/hooks/useDebounce'

const PALETTE = ['#3d2314', '#e8c39e', '#cf7a4b', '#607955', '#456a8a', '#8b5b7b']

export const RolesTab: React.FC = () => {
  const { roles, users, createRole, updateRole, deleteRole, isAdmin, hasPermission } = useAuth()
  const { notify } = useNotification()

  // Sheet states
  const [roleSheetOpen, setRoleSheetOpen] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)

  // Role Form States
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [roleColor, setRoleColor] = useState(PALETTE[0])
  const [rolePermissions, setRolePermissions] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Delete states
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null)

  // Confirm Save state
  const [showConfirmSave, setShowConfirmSave] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 150)

  const visibleRoles = isAdmin ? roles : roles.filter(r => r.id !== ADMIN_ROLE_ID)

  const filteredRoles = visibleRoles.filter(r =>
    r.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
  )

  const togglePermission = (key: string) => {
    if (rolePermissions.includes(key)) {
      setRolePermissions(prev => prev.filter(k => k !== key))
    } else {
      setRolePermissions(prev => [...prev, key])
    }
  }

  const handleOpenNewRole = () => {
    setEditingRoleId(null)
    setRoleName('')
    setRoleDescription('')
    setRoleColor(PALETTE[0])
    setRolePermissions([])
    setErrors({})
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
    setRoleDescription(role.description || '')
    setRoleColor(role.color)
    setRolePermissions(role.permissions)
    setErrors({})
    setRoleSheetOpen(true)
  }

  const handleSaveRoleClick = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!roleName.trim()) newErrors.roleName = 'Role name is required'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setShowConfirmSave(true)
  }

  const executeSaveRole = async () => {
    try {
      if (editingRoleId) {
        await updateRole(editingRoleId, roleName, roleColor, roleDescription || undefined, rolePermissions)
        notify({ type: 'update', title: 'Role Updated', message: `Role "${roleName}" saved successfully!` })
      } else {
        await createRole(roleName, roleColor, roleDescription || undefined, rolePermissions)
        notify({ type: 'add', title: 'Role Created', message: `Role "${roleName}" added successfully!` })
      }
      setRoleSheetOpen(false)
    } catch (err) {
      notify({ type: 'error', message: 'Failed to save role.' })
    } finally {
      setShowConfirmSave(false)
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

  const originalRole = editingRoleId ? roles.find(r => r.id === editingRoleId) : null
  const isDirty = originalRole
    ? (roleName !== originalRole.name ||
      roleDescription !== (originalRole.description || '') ||
      roleColor !== originalRole.color ||
      rolePermissions.join(',') !== originalRole.permissions.join(','))
    : (roleName.trim() !== '' || roleDescription.trim() !== '' || rolePermissions.length > 0)

  const isValid = roleName.trim() !== ''
  const canSave = isDirty && isValid

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center px-1">
        <h1 className="text-3xl font-display">Roles</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewRole}
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
          placeholder="Search roles..."
        />
      </div>

      <div className="flex flex-col gap-3">
        {filteredRoles.length === 0 ? (
          <div className="text-center py-8 text-brand-chocolate/50 text-sm font-bold">
            No roles found matching "{searchQuery}"
          </div>
        ) : (
          filteredRoles.map((role) => (
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
                  {role.description && (
                    <p className="text-[10px] text-brand-chocolate/50 font-bold tracking-tighter leading-snug pr-4">
                      {role.description}
                    </p>
                  )}
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
          ))
        )}
      </div>

      {/* --- BOTTOM SHEET: ROLE CREATOR/EDITOR --- */}
      <BottomSheet
        isOpen={roleSheetOpen}
        onClose={() => setRoleSheetOpen(false)}
        title={editingRoleId ? 'Edit Access Role' : 'Create Custom Role'}
        subtitle="Name your role and check what tools they are allowed to use"
      >
        <form onSubmit={handleSaveRoleClick} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-brand-chocolate/40 tracking-widest px-1">Role Name</label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => {
                setRoleName(e.target.value)
                if (errors.roleName) setErrors(prev => ({ ...prev, roleName: '' }))
              }}
              placeholder="e.g. Lead Baker, Assistant"
              className={`w-full px-4 h-14 bg-brand-chocolate/5 rounded-md text-sm text-brand-chocolate focus:outline-none focus:ring-1 focus:ring-brand-chocolate border ${errors.roleName ? 'border-red-500 bg-red-50/50' : 'border-brand-chocolate/10'}`}
            />
            {errors.roleName && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.roleName}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-brand-chocolate/40 tracking-widest px-1">Description (Optional)</label>
            <textarea
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder="What is this role for?"
              className="w-full px-4 py-3 bg-brand-chocolate/5 border border-brand-chocolate/10 rounded-md text-sm text-brand-chocolate focus:outline-none focus:ring-1 focus:ring-brand-chocolate resize-none"
              rows={2}
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

                          const available = SYSTEM_PERMISSIONS.some(p => p.key === key) && hasPermission(key) && (key !== 'delete:orders' || isAdmin)

                          return (
                            <td key={action} className="py-4 text-center">
                              {available ? (
                                <input
                                  type="checkbox"
                                  checked={rolePermissions.includes(key)}
                                  onChange={() => togglePermission(key)}
                                  className="w-4 h-4 rounded text-green-600 border-green-500 focus:ring-green-600 accent-green-600 cursor-pointer bg-white"
                                />
                              ) : (
                                <span className="text-brand-chocolate/20">-</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-transparent pt-2 pb-4 z-10 mt-2">
            <button
              type="submit"
              disabled={!canSave}
              className="w-full h-14 bg-brand-chocolate text-white font-bold rounded-md text-lg shadow-xl active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Save Access Role
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Delete Role Confirm */}
      <ConfirmModal
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleConfirmDeleteRole}
        title="Delete Role"
        message={
          <p>
            Are you sure you want to delete this role? Any staff assigned to it will lose their access until reassigned. <strong style={{ color: 'red' }}>This action cannot be undone.</strong>
          </p>
        }
        confirmText="Yes, Delete Role"
        cancelText="Keep Role"
        isDestructive={true}
      />

      {/* Save Role Confirm */}
      <ConfirmModal
        isOpen={showConfirmSave}
        onClose={() => setShowConfirmSave(false)}
        onConfirm={executeSaveRole}
        title={editingRoleId ? 'Save Changes?' : 'Create Role?'}
        message={editingRoleId
          ? `Update "${roleName}" with the new details?`
          : `Save "${roleName}" as a new role?`
        }
        confirmText={editingRoleId ? 'Yes, Save' : 'Yes, Create'}
        isDestructive={false}
        watermarkType="update"
      />
    </div>
  )
}
