// Interface que define la estructura de un usuario
export interface User {
  username: string;
}

// Interface que define el estado de autenticación
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Interface que define la solicitud de inicio de sesión
export interface LoginRequest {
  username: string;
  password: string;
}

// Interface que define la respuesta de inicio de sesión
export interface LoginResponse {
  token: string;
}

// Interface que define el contexto de autenticación
export interface AuthContextType extends AuthState {
  login: (username: string, password: string, signal?: AbortSignal) => Promise<void>;
  logout: () => void;
  // Tiempo restante de sesión en ms (null sin sesión o sin exp): lo expone el
  // provider para que la UI avise de la expiración antes de que venza
  sessionRemainingMs: number | null;
}
