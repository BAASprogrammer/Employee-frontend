import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { User, AuthContextType, LoginRequest, LoginResponse } from '../types/auth';
import { api, tokenStorage, setUnauthorizedRequest } from '../api/axiosInstance';
import { readStoredUser, saveStoredUser, clearStoredUser } from '../utils/userStorage';

// Crea el contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provee el contexto de autenticación a los componentes hijos
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lee el usuario almacenado en localStorage
  const [user, setUser] = useState<User | null>(readStoredUser);
  // Verifica si el usuario está autenticado
  const isAuthenticated = !!user;

  // Cierra la sesión
  const logout = useCallback(() => {
    // Limpia el estado del usuario
    setUser(null);
    // Remueve el token de localStorage
    tokenStorage.remove();
    // Remueve el usuario de localStorage
    clearStoredUser();
  }, []);

  // Cualquier 401 de la API cierra la sesión (y el guard redirige al login)
  useEffect(() => {
    // Establece el callback para manejar el error 401
    setUnauthorizedRequest(logout);
    // Limpia el callback al desmontar el componente
    return () => setUnauthorizedRequest(null);
  }, [logout]);

  // Inicia sesión mediante una mutación de TanStack Query
  const loginMutation = useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: async (body: LoginRequest): Promise<User> => {
      // Envía la solicitud POST al backend
      const { data } = await api.post<LoginResponse>('/api/auth/login', body);
      // Almacena el token en localStorage
      tokenStorage.set(data.token);
      // Crea el nuevo usuario
      const newUser: User = { username: body.username };
      // Almacena el usuario en localStorage
      saveStoredUser(newUser);
      return newUser;
    },
    onSuccess: (newUser) => {
      // Actualiza el estado del usuario
      setUser(newUser);
    },
  });

  // Expone el login manteniendo la misma firma
  const login = async (username: string, password: string): Promise<void> => {
    await loginMutation.mutateAsync({ username, password });
  };

  // Retorna el proveedor del contexto de autenticación
  return (
    // Provee el contexto de autenticación a los componentes hijos
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {/* Renderiza los componentes hijos */}
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para acceder al contexto de autenticación
export const useAuth = (): AuthContextType => {
  // Obtiene el contexto de autenticación
  const context = useContext(AuthContext);
  // Si no existe el contexto, lanza un error
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  // Retorna el contexto de autenticación
  return context;
};