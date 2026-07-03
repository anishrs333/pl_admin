import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } })

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster position="top-right" toastOptions={{
      duration: 3000,
      style: { fontFamily: 'Inter, sans-serif', fontSize: '13px', borderRadius: '10px' }
    }} />
  </QueryClientProvider>
)
