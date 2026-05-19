import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db, generateUUID, type Role, type User } from '@backend/lib/db';
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
  createRole: (name: string, color: string, permissions: string[]) => Promise<void>;
  updateRole: (id: string, name: string, color: string, permissions: string[]) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  
  // User CRUD operations
  createUser: (name: string, roleId: string, password?: string, assignedPermissions?: string[], revokedPermissions?: string[]) => Promise<void>;
  updateUser: (id: string, name: string, roleId: string, password?: string, assignedPermissions?: string[], revokedPermissions?: string[]) => Promise<void>;
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

  // Load and seed dynamic roles and users from IndexedDB
  useEffect(() => {
    const seedAndLoad = async () => {
      try {
        let dbRoles = await db.roles.toArray()
        let dbUsers = await db.users.toArray()

        if (dbRoles.length === 0) {
          // Seed Roles
          for (const role of SEEDED_ROLES) {
            await db.roles.put(role)
          }
          dbRoles = [...SEEDED_ROLES]
        }

        if (dbUsers.length === 0) {
          // Seed Users
          for (const user of SEEDED_USERS) {
            await db.users.put(user)
          }
          dbUsers = [...SEEDED_USERS]
        } else {
          dbUsers = await db.users.toArray()
        }

        setRoles(dbRoles)
        setUsers(dbUsers)
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

  const login = async (nameOrRole: string, password?: string): Promise<boolean> => {
    const formattedName = nameOrRole.toLowerCase().trim()
    const targetUser = users.find(u => u.name.toLowerCase() === formattedName)

    if (!targetUser) return false

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
  const createRole = async (name: string, color: string, permissions: string[]) => {
    const newRole: Role = {
      id: generateUUID(),
      name,
      color,
      permissions,
      createdAt: new Date()
    }
    await db.roles.add(newRole)
    setRoles(prev => [...prev, newRole])
  }

  const updateRole = async (id: string, name: string, color: string, permissions: string[]) => {
    if (id === ADMIN_ROLE_ID) return // Immutable protection
    await db.roles.update(id, { name, color, permissions })
    setRoles(prev => prev.map(r => r.id === id ? { ...r, name, color, permissions } : r))
  }

  const deleteRole = async (id: string) => {
    if (id === ADMIN_ROLE_ID) return // Protected defaults
    await db.roles.delete(id)
    setRoles(prev => prev.filter(r => r.id !== id))
  }

  // User CRUD operations
  const createUser = async (name: string, roleId: string, password?: string, assignedPermissions?: string[], revokedPermissions?: string[]) => {
    const newUser: User = {
      id: generateUUID(),
      name,
      roleId,
      password: password ? hashPassword(password) : undefined,
      assignedPermissions: assignedPermissions || [],
      revokedPermissions: revokedPermissions || [],
      createdAt: new Date()
    }
    await db.users.add(newUser)
    setUsers(prev => [...prev, newUser])
  }

  const updateUser = async (id: string, name: string, roleId: string, password?: string, assignedPermissions?: string[], revokedPermissions?: string[]) => {
    const isAlreadyHashed = password && password.length === 64 && /^[0-9a-fA-F]+$/.test(password);
    const hashedPassword = password ? (isAlreadyHashed ? password : hashPassword(password)) : undefined;
    const updates = { 
      name, 
      roleId, 
      password: hashedPassword, 
      assignedPermissions: assignedPermissions || [], 
      revokedPermissions: revokedPermissions || [] 
    }
    await db.users.update(id, updates)
    
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))

    if (user?.id === id) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem('mbb_user', JSON.stringify(updatedUser))
    }
  }

  const deleteUser = async (id: string) => {
    if (id === ADMIN_USER_ID || user?.id === id) return // Immutable or logged-in protection
    await db.users.delete(id)
    setUsers(prev => prev.filter(u => u.id !== id))
  }

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
