import type { User } from '../types/auth';
import { tokenStorage } from './tokenStorage';
import { isTokenExpired } from './jwt';

// Constante que almacena el usuario en localStorage
const USER_KEY = 'employee_frontend_user';

// Lee el usuario almacenado en localStorage
export function readStoredUser(): User | null {
  // Obtiene el token de localStorage
  const token = tokenStorage.get();
  // Obtiene el usuario de localStorage
  const savedUser = localStorage.getItem(USER_KEY);
  // Si no existe el token o el usuario, o el token está expirado
  if (!token || !savedUser || isTokenExpired(token)) {
    // Remueve el token y el usuario de localStorage
    tokenStorage.remove();
    localStorage.removeItem(USER_KEY);
    return null;
  }
  // Retorna el usuario parseado
  return JSON.parse(savedUser) as User;
}

// Almacena el usuario en localStorage
export function saveStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Remueve el usuario de localStorage
export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}