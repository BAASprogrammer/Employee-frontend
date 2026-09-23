import React, { useCallback, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { User, LoginRequest, LoginResponse } from '../types/auth';
import { AuthContext } from './auth';
import { api, setUnauthorizedRequest } from '../api/axiosInstance';
import { tokenStorage } from '../utils/tokenStorage';
import { readStoredUser, saveStoredUser, clearStoredUser } from '../utils/userStorage';
import { getTokenExpiry } from '../utils/jwt';

// Provee el contexto de autenticación a los componentes hijos
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lee el usuario almacenado en localStorage
  const [user, setUser] = useState<User | null>(readStoredUser);
  // Verifica si el usuario está autenticado
  const isAuthenticated = !!user;

  // Instante de expiración de la sesión (epoch ms), derivado del exp del JWT.
  // Al arrancar con sesión, se recupera del token guardado; en el login se
  // actualiza; en el logout vuelve a null.
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(() => {
    const token = tokenStorage.get();
    return token ? getTokenExpiry(token) : null;
  });

  // Cierra la sesión
  const logout = useCallback(() => {
    // Limpia el estado del usuario
    setUser(null);
    // Remueve el token de localStorage
    tokenStorage.remove();
    // Remueve el usuario de localStorage
    clearStoredUser();
    // Termina el seguimiento de expiración
    setSessionExpiresAt(null);
  }, []);

  // Cualquier 401 de la API cierra la sesión (y el guard redirige al login)
  useEffect(() => {
    // Establece el callback para manejar el error 401
    setUnauthorizedRequest(logout);
    // Limpia el callback al desmontar el componente
    return () => setUnauthorizedRequest(null);
  }, [logout]);

  // Reloj de sesión (solo state, sin Date.now() en el render). `now` se actualiza
  // dentro del callback del intervalo — no durante el render — y se deriva de ahí
  const [now, setNow] = useState(0);

  // Reloj de sesión: cada segundo actualiza el tiempo restante y, cuando vence,
  // cierra la sesión local sin esperar un 401. El backend de todos modos rechaza
  // el token muerto; esto solo acorta la ventana en la que se sigue autoenviando.
  useEffect(() => {
    if (!sessionExpiresAt) return;
    const interval = window.setInterval(() => {
      if (sessionExpiresAt <= Date.now()) {
        logout();
      } else {
        setNow(Date.now());
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [sessionExpiresAt, logout]);

  // Tiempo restante de sesión (null sin sesión o sin exp). Se deriva del estado
  // `now` del reloj, que fuerza un re-render como mínimo una vez por segundo
  const sessionRemainingMs = sessionExpiresAt ? Math.max(0, sessionExpiresAt - now) : null;

  // Inicia sesión mediante una mutación de TanStack Query
  const loginMutation = useMutation({
    mutationKey: ['auth', 'login'],
    // No reintentar: evita esperar dos veces (timeout + retry) sin conexión
    retry: 0,
    mutationFn: async ({ username, password, signal }: LoginRequest & { signal?: AbortSignal }): Promise<User> => {
      // Envía la solicitud POST al backend (transmite la señal de aborto)
      const { data } = await api.post<LoginResponse>('/api/auth/login', { username, password }, { signal });
      // Almacena el token en localStorage
      tokenStorage.set(data.token);
      // Ancla la expiración de la sesión al exp del JWT recién emitido
      setSessionExpiresAt(getTokenExpiry(data.token));
      // Crea el nuevo usuario
      const newUser: User = { username };
      // Almacena el usuario en localStorage
      saveStoredUser(newUser);
      return newUser;
    },
    onSuccess: (newUser) => {
      // Actualiza el estado del usuario
      setUser(newUser);
    },
  });

  // Expone el login manteniendo la firma (con señal opcional para abortar)
  const login = async (username: string, password: string, signal?: AbortSignal): Promise<void> => {
    await loginMutation.mutateAsync({ username, password, signal });
  };

  // Retorna el proveedor del contexto de autenticación
  return (
    // Provee el contexto de autenticación a los componentes hijos
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, sessionRemainingMs }}>
      {/* Renderiza los componentes hijos */}
      {children}
    </AuthContext.Provider>
  );
};