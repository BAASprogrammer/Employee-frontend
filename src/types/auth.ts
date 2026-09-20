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
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
