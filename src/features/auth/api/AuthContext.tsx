import React, { createContext, useContext, useState, type ReactNode } from 'react';

type Role = 'admin' | 'staff';

interface User {
  id: string;
  name: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({ id: '1', name: 'Owner', role: 'admin' });
  const [isLoading] = useState(false); 

  const login = (role: Role) => {
    setUser({ id: '1', name: role === 'admin' ? 'Owner' : 'Staff Member', role });
  };

  const logout = () => setUser(null);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout }}>
      {isLoading ? <div className="h-screen flex items-center justify-center">Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
