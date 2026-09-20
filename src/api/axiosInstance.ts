import axios, { AxiosError } from "axios";

// Key que almacena el token en localStorage
const TOKEN_KEY = "employee_token";
// Ruta del endpoint de login
const LOGIN_PATH = '/api/auth/login';

// Constante que administra el token en localStorage
export const tokenStore = {
    // Almacena el token en localStorage
    set: (token: string) => {
        localStorage.setItem(TOKEN_KEY, token);
    },
    // Obtiene el token de localStorage
    get: () => {
        return localStorage.getItem(TOKEN_KEY);
    },
    // Remueve el token de localStorage
    remove: () => {
        localStorage.removeItem(TOKEN_KEY);
    }
}
// Maneja el error 401 unauthorized
let unauthorizedRequest: (() => void) | null = null;
// Establece el callback para manejar el error 401 unauthorized
export const setUnauthorizedRequest = (callback: (() => void) | null) => {
    unauthorizedRequest = callback;
}

// Creación de la instancia de axios con la URL base y headers
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Añade el token al header de la petición
api.interceptors.request.use((config) => {
    // Obtiene el token de localStorage
    const token = tokenStore.get();
    // Si existe el token, lo añade al header de la petición
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const isLogin = error.config?.url === LOGIN_PATH;
        if (error.response?.status === 401 && !isLogin) {
            unauthorizedRequest?.(); // tu handler de sesión expirada
        }
        return Promise.reject(error); // se rechaza el error original, no un string
    },
);

// Traduce cualquier error a un mensaje para mostrar en la UI
export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder';
        if (!error.response) return 'Error de conexión';
        switch (error.response.status) {
            case 401:
                return 'Usuario o contraseña incorrectos, o la sesión expiró';
            case 403:
                return 'No tienes permiso para realizar esta acción';
            case 404:
                return 'No se encontraron resultados';
            default:
                return `Ocurrió un error inesperado (${error.response.status})`;
        }
    }
    return 'Ocurrió un error inesperado';
}