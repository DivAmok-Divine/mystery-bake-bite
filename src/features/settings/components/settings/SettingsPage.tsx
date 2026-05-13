import React, { useState } from 'react'
import { useAuth } from '../../../auth/api/AuthContext.tsx'
import { User, Shield, Moon, LogOut, Info, ChevronRight, Wrench } from 'lucide-react'
import { useDeveloperTools } from '../../../../mock-data/index.tsx'
import { EquipmentList } from '../eqipments/EquipmentList.tsx'

interface SettingsItem {
  label: string
  value: string | undefined
  icon: any
  action?: () => void
  actionLabel?: string
  disabled?: boolean
}

interface SettingsSection {
  title: string
  items: SettingsItem[]
}

export const SettingsPage: React.FC = () => {
  const { user, isAdmin, login, logout } = useAuth()
  const [showEquipment, setShowEquipment] = useState(false)
  const { developerToolsSection, DeveloperToolsModal } = useDeveloperTools()

  if (showEquipment) {
    return <EquipmentList onBack={() => setShowEquipment(false)} />
  }

  const sections: SettingsSection[] = [
    {
      title: 'Account',
      items: [
        { 
          label: 'User Role', 
          value: isAdmin ? 'Owner (Admin)' : 'Staff Member', 
          icon: Shield, 
          action: () => login(isAdmin ? 'staff' : 'admin'),
          actionLabel: isAdmin ? 'Switch to Staff' : 'Switch to Admin'
        },
        { label: 'Name', value: user?.name, icon: User },
        { 
          label: 'Equipments', 
          value: 'Manage ovens, mixers & more', 
          icon: Wrench,
          action: () => setShowEquipment(true)
        },
        { label: 'Slogan', value: 'Unveiling the uniqueness of a recipe', icon: ChevronRight },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Dark Mode', value: 'System', icon: Moon, action: () => alert('Theme switching coming soon!') },
      ]
    },
    developerToolsSection as SettingsSection,
    {
      title: 'Business Information',
      items: [
        { label: 'App Version', value: 'v1.0.0', icon: Info },
      ]
    }
  ]


  return (
    <div className="flex flex-col gap-2">
      <header className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur-md pt-4 pb-2 -mx-6 px-6 flex flex-col gap-0 border-b border-brand-chocolate/5">
        <h1 className="text-3xl font-display">Settings</h1>
        <p className="text-brand-chocolate/40 text-sm">Manage your business preferences</p>
      </header>

      <div className="flex flex-col gap-4">
        {sections.map((section, i) => (
          <div key={i} className="flex flex-col gap-3">
            <h3 className="text-sm font-bold  text-brand-chocolate/50 px-1">
              {section.title}
            </h3>
            <div className="flex flex-col gap-2">
              {section.items.map((item, j) => (
                <div 
                  key={j} 
                  onClick={!item.disabled ? item.action : undefined}
                  className={`card flex items-center justify-between group active:bg-brand-cream/10 transition-colors ${item.action && !item.disabled ? 'cursor-pointer' : 'opacity-70 grayscale-[0.5]'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-brand-chocolate/5 flex items-center justify-center text-brand-chocolate">
                      <item.icon size={18} className={item.disabled ? 'animate-spin' : ''} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-brand-chocolate/40">{item.value}</p>
                    </div>
                  </div>
                  {/* Dynamic Action Button: Triggers the specific logic for this setting (e.g., Switch Role, Open Equipment, Seed Data) */}
                  {item.action && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!item.disabled) item.action();
                      }}
                      disabled={item.disabled}
                      className={`text-[10px] font-bold text-brand-chocolate bg-brand-dough px-3 py-1.5 rounded-md transition-colors ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-dough/80'}`}
                    >
                      {item.actionLabel || 'Change'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main Logout Button */}
      <div className="flex flex-col mt-4">
        <button 
          onClick={logout}
          className="flex items-center justify-center gap-2 p-4 border-2 border-red-100 text-red-600 font-bold rounded-md active:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          Logout from System
        </button>

        <div className="text-center mt-2 pb-2">
          <p className="text-xs font-bold text-brand-chocolate/60">
            Designed By DivAmok Corp. ltd
          </p>
          <p className="text-xs text-brand-chocolate/40">
            © {new Date().getFullYear()} all rights reserved
          </p>
        </div>
      </div>

      {DeveloperToolsModal}
    </div>
  )
}

