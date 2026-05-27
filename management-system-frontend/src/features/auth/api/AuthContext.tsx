import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db, supabase, isCloudMode, generateUUID, type Role, type User } from '@backend/lib/db';
import { ADMIN_ROLE_ID, SEEDED_ROLES } from '@backend/seed/roles';
import { ADMIN_USER_ID, hashPassword, SEEDED_USERS } from '@backend/seed/users';

interface AuthContextType {
  user: User | null;
  roles: Role[];
  users: User[];
  isAdmin: boolean;
  isLoading: boolean;
  login: (nameOrRole: string, password?: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  
  // Role CRUD operations
  createRole: (name: string, color: string, description: string | undefined, permissions: string[]) => Promise<void>;
  updateRole: (id: string, name: string, color: string, description: string | undefined, permissions: string[]) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  
  // User CRUD operations
  createUser: (name: string, username: string, email: string, phone: string, roleId: string, password?: string, assignedPermissions?: string[], revokedPermissions?: string[]) => Promise<void>;
  updateUser: (id: string, name: string, username: string, email: string, phone: string, roleId: string, password?: string, assignedPermissions?: string[], revokedPermissions?: string[]) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('mbb_user')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        return null
      }
    }
    return null
  });
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load and seed dynamic roles and users from database
  useEffect(() => {
    const seedAndLoad = async () => {
      try {
        const cloud = isCloudMode()
        if (cloud) {
          // Fetch from Supabase
          const { data: rolesData, error: rolesError } = await supabase.from('roles').select('*')
          if (rolesError) throw rolesError
          
          let fetchedRoles = rolesData || []
          if (fetchedRoles.length === 0) {
            // Seed Roles to Supabase
            const rolesToInsert = SEEDED_ROLES.map(role => ({
              id: role.id,
              name: role.name,
              color: role.color,
              description: role.description,
              permissions: role.permissions,
              created_at: new Date(role.createdAt).toISOString()
            }))
            const { error: insertRolesErr } = await supabase.from('roles').insert(rolesToInsert)
            if (insertRolesErr) throw insertRolesErr
            
            // Re-fetch
            const { data: refetchedRoles, error: refetchRolesError } = await supabase.from('roles').select('*')
            if (refetchRolesError) throw refetchRolesError
            fetchedRoles = refetchedRoles || []
          }

          const { data: usersData, error: usersError } = await supabase.from('users').select('*')
          if (usersError) throw usersError

          let fetchedUsers = usersData || []
          if (fetchedUsers.length === 0) {
            // Seed Users to Supabase
            const usersToInsert = SEEDED_USERS.map(user => ({
              id: user.id,
              name: user.name,
              username: user.username,
              email: user.email,
              phone: user.phone,
              role_id: user.roleId,
              password: user.password,
              assigned_permissions: user.assignedPermissions || [],
              revoked_permissions: user.revokedPermissions || [],
              created_at: new Date(user.createdAt).toISOString()
            }))
            const { error: insertUsersErr } = await supabase.from('users').insert(usersToInsert)
            if (insertUsersErr) throw insertUsersErr

            // Re-fetch
            const { data: refetchedUsers, error: refetchUsersError } = await supabase.from('users').select('*')
            if (refetchUsersError) throw refetchUsersError
            fetchedUsers = refetchedUsers || []
          }

          // Map to frontend interface types
          const mappedRoles: Role[] = fetchedRoles.map((r: any) => ({
            id: r.id,
            name: r.name,
            color: r.color,
            description: r.description,
            permissions: r.permissions || [],
            createdAt: new Date(r.created_at)
          }))

          const mappedUsers: User[] = fetchedUsers.map((u: any) => ({
            id: u.id,
            name: u.name,
            username: u.username,
            email: u.email,
            phone: u.phone,
            roleId: u.role_id,
            password: u.password,
            assignedPermissions: u.assigned_permissions || [],
            revokedPermissions: u.revoked_permissions || [],
            createdAt: new Date(u.created_at)
          }))

          setRoles(mappedRoles)
          setUsers(mappedUsers)
        } else {
          // Local mode (Dexie IndexedDB)
          let dbRoles = await db.roles.toArray()
          let dbUsers = await db.users.toArray()

          if (dbRoles.length === 0) {
            for (const role of SEEDED_ROLES) {
              await db.roles.put(role)
            }
            dbRoles = [...SEEDED_ROLES]
          }

          if (dbUsers.length === 0) {
            for (const user of SEEDED_USERS) {
              await db.users.put(user)
            }
            dbUsers = [...SEEDED_USERS]
          }

          setRoles(dbRoles)
          setUsers(dbUsers)
        }
      } catch (err) {
        console.error('Error seeding/loading authentication database:', err)
        // Fallback: If outer seeding completely fails, clear and force seed
        try {
          await db.users.clear()
          await db.roles.clear()
          for (const role of SEEDED_ROLES) {
            await db.roles.put(role)
          }
          for (const user of SEEDED_USERS) {
            await db.users.put(user)
          }
          const finalRoles = await db.roles.toArray()
          const finalUsers = await db.users.toArray()
          setRoles(finalRoles)
          setUsers(finalUsers)
        } catch (fallbackErr) {
          console.error('🔴 Critical Fallback Auth Seeding failed:', fallbackErr)
        }
      } finally {
        setIsLoading(false)
      }
    }

    seedAndLoad()
  }, [])

  // Keep active user session in sync with database updates
  useEffect(() => {
    if (user && users.length > 0) {
      const freshUser = users.find(u => u.id === user.id)
      if (freshUser) {
        if (JSON.stringify(user) !== JSON.stringify(freshUser)) {
          setUser(freshUser)
          localStorage.setItem('mbb_user', JSON.stringify(freshUser))
        }
      } else {
        setUser(null)
        localStorage.removeItem('mbb_user')
      }
    }
  }, [users])

  const login = async (nameOrRole: string, password?: string): Promise<boolean> => {
    const rawName = nameOrRole.trim()
    const lowerName = rawName.toLowerCase()
    const targetUser = users.find(u => 
      (u.username && u.username.toLowerCase() === lowerName) || 
      (u.email && u.email.toLowerCase() === lowerName)
    )

    if (!targetUser) return false

    if (!isCloudMode() && targetUser.roleId !== ADMIN_ROLE_ID) {
      throw new Error('Local sandbox mode is restricted to administrators only.')
    }

    const hashedInput = password ? hashPassword(password) : ''
    if (targetUser.password && targetUser.password !== hashedInput) {
      return false
    }

    setUser(targetUser)
    localStorage.setItem('mbb_user', JSON.stringify(targetUser))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('mbb_user')
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false

    // 1. Direct explicit user overrides: Revokes take priority
    if (user.revokedPermissions?.includes(permission)) {
      return false
    }

    // 2. Direct explicit user overrides: Grants next
    if (user.assignedPermissions?.includes(permission)) {
      return true
    }

    // 3. Inherited role permissions
    const userRole = roles.find(r => r.id === user.roleId)
    if (!userRole) return false

    // Wildcard matches everything
    if (userRole.permissions.includes('*')) {
      return true
    }

    return userRole.permissions.includes(permission)
  }

  const isAdmin = user?.roleId === ADMIN_ROLE_ID || (user ? hasPermission('*') : false);

  // Role CRUD operations
  const createRole = async (name: string, color: string, description: string | undefined, permissions: string[]) => {
    const newRole: Role = {
      id: generateUUID(),
      name,
      color,
      description,
      permissions,
      createdAt: new Date()
    }
    
    if (isCloudMode()) {
      const { error } = await supabase.from('roles').insert([{
        id: newRole.id,
        name: newRole.name,
        color: newRole.color,
        description: newRole.description,
        permissions: newRole.permissions,
        created_at: newRole.createdAt.toISOString()
      }])
      if (error) throw error
    } else {
      await db.roles.add(newRole)
    }

    setRoles(prev => [...prev, newRole])
  }

  const updateRole = async (id: string, name: string, color: string, description: string | undefined, permissions: string[]) => {
    if (id === ADMIN_ROLE_ID) return // Immutable protection
    
    if (isCloudMode()) {
      const { error } = await supabase.from('roles').update({
        name,
        color,
        description,
        permissions
      }).eq('id', id)
      if (error) throw error
    } else {
      await db.roles.update(id, { name, color, description, permissions })
    }

    setRoles(prev => prev.map(r => r.id === id ? { ...r, name, color, description, permissions } : r))
  }

  const deleteRole = async (id: string) => {
    if (id === ADMIN_ROLE_ID) return // Protected defaults

    if (isCloudMode()) {
      const { error } = await supabase.from('roles').delete().eq('id', id)
      if (error) throw error
    } else {
      await db.roles.delete(id)
    }

    setRoles(prev => prev.filter(r => r.id !== id))
  }

  // User CRUD operations
  const createUser = async (name: string, username: string, email: string, phone: string, roleId: string, password?: string, assignedPermissions?: string[], revokedPermissions?: string[]) => {
    const newUser: User = {
      id: generateUUID(),
      name,
      username,
      email,
      phone,
      roleId,
      password: password ? hashPassword(password) : undefined,
      assignedPermissions: assignedPermissions || [],
      revokedPermissions: revokedPermissions || [],
      createdAt: new Date()
    }

    if (isCloudMode()) {
      const { error } = await supabase.from('users').insert([{
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        role_id: newUser.roleId,
        password: newUser.password || '',
        assigned_permissions: newUser.assignedPermissions,
        revoked_permissions: newUser.revokedPermissions,
        created_at: newUser.createdAt.toISOString()
      }])
      if (error) throw error
    } else {
      await db.users.add(newUser)
    }

    setUsers(prev => [...prev, newUser])
  }

  const updateUser = async (id: string, name: string, username: string, email: string, phone: string, roleId: string, password?: string, assignedPermissions?: string[], revokedPermissions?: string[]) => {
    const isAlreadyHashed = password && password.length === 64 && /^[0-9a-fA-F]+$/.test(password);
    const hashedPassword = password ? (isAlreadyHashed ? password : hashPassword(password)) : undefined;
    const updates: Partial<User> = { 
      name,
      username,
      email,
      phone,
      roleId, 
      assignedPermissions: assignedPermissions || [], 
      revokedPermissions: revokedPermissions || [] 
    }
    if (hashedPassword !== undefined) {
      updates.password = hashedPassword;
    }

    if (isCloudMode()) {
      const dbUpdates: any = {
        name,
        username,
        email,
        phone,
        role_id: roleId,
        assigned_permissions: assignedPermissions || [],
        revoked_permissions: revokedPermissions || []
      }
      if (hashedPassword !== undefined) {
        dbUpdates.password = hashedPassword
      }
      const { error } = await supabase.from('users').update(dbUpdates).eq('id', id)
      if (error) throw error
    } else {
      const dexieUpdates: any = {
        name,
        username,
        email,
        phone,
        roleId,
        assignedPermissions: assignedPermissions || [],
        revokedPermissions: revokedPermissions || []
      }
      if (hashedPassword !== undefined) {
        dexieUpdates.password = hashedPassword
      }
      await db.users.update(id, dexieUpdates)
    }

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))

    if (user?.id === id) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser as User)
      localStorage.setItem('mbb_user', JSON.stringify(updatedUser))
    }
  }

  const deleteUser = async (id: string) => {
    if (id === ADMIN_USER_ID || user?.id === id) return // Immutable or logged-in protection

    if (isCloudMode()) {
      const { error } = await supabase.from('users').delete().eq('id', id)
      if (error) throw error
    } else {
      await db.users.delete(id)
    }

    setUsers(prev => prev.filter(u => u.id !== id))
  }

  // Cross-tab logout (same browser)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mbb_user' && !e.newValue) {
        setUser(null)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Cross-device logout (periodic password hash verification)
  useEffect(() => {
    if (!user) return
    
    const verifySession = async () => {
      try {
        if (isCloudMode()) {
          const { data } = await supabase.from('users').select('password').eq('id', user.id).single()
          if (data && data.password !== user.password) {
            setUser(null)
            localStorage.removeItem('mbb_user')
          }
        } else {
          const dbUser = await db.users.get(user.id)
          if (dbUser && dbUser.password !== user.password) {
            setUser(null)
            localStorage.removeItem('mbb_user')
          }
        }
      } catch (err) {
        // Silent catch for network drops
      }
    }

    // Check every 15 seconds to ensure fast invalidation
    const intervalId = setInterval(verifySession, 15000) 
    return () => clearInterval(intervalId)
  }, [user])

  return (
    <AuthContext.Provider value={{ 
      user, 
      roles, 
      users, 
      isAdmin, 
      isLoading,
      login, 
      logout, 
      hasPermission,
      createRole,
      updateRole,
      deleteRole,
      createUser,
      updateUser,
      deleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
