import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './AppRoutes';
import { AuthContext } from '../context/auth';
import type { AuthContextType } from '../types/auth';

// Mock de la capa HTTP: DashboardPage monta las queries de empleados y
// dispositivos al entrar, acá alimentamos con listas vacías (sin red real)
const { apiGet } = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock('../api/axiosInstance', () => ({
  api: { get: apiGet },
}));

// Wrapper que combina rutas, contexto real de autenticación y React Query,
// como lo hace App desde main.tsx
const renderApp = (initialEntry: string, authenticated: boolean) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const authValue: AuthContextType = {
    user: authenticated ? { username: 'admin' } : null,
    isAuthenticated: authenticated,
    login: vi.fn(),
    logout: vi.fn(),
    sessionRemainingMs: null,
  };

  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthContext.Provider value={authValue}>
        <QueryClientProvider client={client}>
          <AppRoutes />
        </QueryClientProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

// Antes de cada prueba se resetea el mock de la API
beforeEach(() => {
  apiGet.mockReset();
  apiGet.mockResolvedValue({ data: [] });
});

describe('AppRoutes (guards de rutas)', () => {
  // Sin sesión, /dashboard redirige al login
  it('redirige a /login cuando un usuario anónimo entra a /dashboard', async () => {
    renderApp('/dashboard', false);

    expect(await screen.findByRole('heading', { name: 'Iniciar Sesión' })).toBeTruthy();
  });

  // Sin sesión, una ruta desconocida también cae en /login
  it('redirige a /login cuando un usuario anónimo entra a una ruta desconocida', async () => {
    renderApp('/no-existe', false);

    expect(await screen.findByRole('heading', { name: 'Iniciar Sesión' })).toBeTruthy();
  });

  // Con sesión, /login (PublicRoute) devuelve al dashboard
  it('redirige a /dashboard cuando un usuario con sesión entra a /login', async () => {
    renderApp('/login', true);

    expect(await screen.findByText('Dashboard de Empleados')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Iniciar Sesión' })).toBeNull();
  });

  // Con sesión, /dashboard permanece accesible
  it('permite el acceso a /dashboard con sesión activa', async () => {
    renderApp('/dashboard', true);

    expect(await screen.findByText('Dashboard de Empleados')).toBeTruthy();
  });
});