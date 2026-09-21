import { useContext } from 'react';
import { AuthContext } from '../context/auth';
import type { AuthContextType } from '../types/auth';

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