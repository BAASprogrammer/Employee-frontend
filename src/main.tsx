import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Crea un cliente de React Query
const queryClient = new QueryClient({
  // Opciones por defecto para las queries
  defaultOptions: {
    queries: {
      // Tiempo de inactividad antes de considerar una query como stale, stale es un estado en el que los datos no se actualizan automaticamente cuando el usuario navega a otra pantalla y vuelve
      staleTime: 10 * 60 * 1000, // 10 minutos
      // Retry automatico en caso de error
      retry: 1, // 1 reintento
      // Tiempo de espera antes de reintentar
      retryDelay: 1000, // 1 segundo
      // Habilita el refetch al reconectar
      refetchOnReconnect: true,
    },
  },
});

// Renderizado de la aplicación
createRoot(document.getElementById('root')!).render(
  // StrictMode para habilitar chequeos adicionales en desarrollo
  <StrictMode>
    {/* Provider de React Query, se debe usar para que los hooks tengan acceso al cliente de React Query */}
    <QueryClientProvider client={queryClient}>
      {/* Componente principal de la aplicación */}
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
