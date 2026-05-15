import React from 'react'
import { OrderList } from '../features/orders/components/OrderList.tsx'
import { ProductList } from '../features/products/components/ProductList.tsx'
import { CustomerList } from '../features/customers/components/CustomerList.tsx'
import { RecipeList } from '../features/recipes/components/RecipeList.tsx'
import { ReportingDashboard } from '../features/reporting/components/ReportingDashboard.tsx'
import { SettingsPage } from '../features/settings/components/settings/SettingsPage.tsx'
import { PantryList } from '../features/pantry/components/PantryList.tsx'

interface FeatureRendererProps {
  currentFeature: 'orders' | 'customers' | 'recipes' | 'reporting' | 'settings' | 'products' | 'pantry'
}

export const FeatureRenderer: React.FC<FeatureRendererProps> = ({ currentFeature }) => {
  switch (currentFeature) {
    case 'orders':
      return <OrderList />
    case 'products':
      return <ProductList />
    case 'customers':
      return <CustomerList />
    case 'recipes':
      return <RecipeList />
    case 'reporting':
      return <ReportingDashboard />
    case 'settings':
      return <SettingsPage />
    case 'pantry':
      return <PantryList />
    default:
      return null
  }
}

