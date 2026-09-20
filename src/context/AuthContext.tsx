import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User, AuthContextType, LoginRequest, LoginResponse } from '../types/auth';
import { api, tokenStore, setUnauthorizedRequest } from '../api/axiosInstance';

// Constante que almacena el usuario en localStorage
const USER_KEY = 'employee_frontend_user';
// Crea el contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lee el "exp" del JWT para no arrancar con un token ya vencido
function isTokenExpired(token: string): boolean {
  try {
    // Parsea el payload del token
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    // Verifica si el token está expirado
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    // Si el token está expirado, retorna true
    return true; // token ilegible: se trata como inválido
  }
}

// Lee el usuario almacenado en localStorage
function readStoredUser(): User | null {
  // Obtiene el token de localStorage
  const token = tokenStore.get();
  // Obtiene el usuario de localStorage
  const savedUser = localStorage.getItem(USER_KEY);
  // Si no existe el token o el usuario, o el token está expirado
  if (!token || !savedUser || isTokenExpired(token)) {
    // Remueve el token y el usuario de localStorage
    tokenStore.remove();
    localStorage.removeItem(USER_KEY);
    return null;
  }
  // Retorna el usuario parseado
  return JSON.parse(savedUser) as User;
}

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
    tokenStore.remove();
    // Remueve el usuario de localStorage
    localStorage.removeItem(USER_KEY);
  }, []);

  // Cualquier 401 de la API cierra la sesión (y el guard redirige al login)
  useEffect(() => {
    // Establece el callback para manejar el error 401
    setUnauthorizedRequest(logout);
    // Limpia el callback al desmontar el componente
    return () => setUnauthorizedRequest(null);
  }, [logout]);

  // Inicia sesión
  const login = async (username: string, password: string): Promise<void> => {
    // Crea el cuerpo de la solicitud
    const body: LoginRequest = { username, password };
    // Envía la solicitud POST al backend
    const { data } = await api.post<LoginResponse>('/api/auth/login', body);
    // Crea el nuevo usuario
    const newUser: User = { username };
    // Almacena el token y el usuario en localStorage
    tokenStore.set(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    // Actualiza el estado del usuario
    setUser(newUser);
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