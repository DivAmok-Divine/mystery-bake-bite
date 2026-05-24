import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './app/App.tsx'
import './index.css'

import { AuthProvider } from './features/auth/api/AuthContext.tsx'
import { NotificationProvider } from './shared/ui/molecules/Notification.tsx'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
