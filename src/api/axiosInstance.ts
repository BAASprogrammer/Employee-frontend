import axios, { AxiosError } from "axios";
import { tokenStorage } from "../utils/tokenStorage";

// Ruta del endpoint de login
const LOGIN_PATH = '/api/auth/login';

// Maneja el error 401 unauthorized
let unAuthorizedRequest: (() => void) | null = null;
// Establece el callback para manejar el error 401 unauthorized
export const setUnauthorizedRequest = (callback: (() => void) | null) => {
    unAuthorizedRequest = callback;
}

// Creación de la instancia de axios con la URL base y headers
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Añade el token al header de la petición
api.interceptors.request.use((config) => {
    // Obtiene el token de localStorage
    const token = tokenStorage.get();
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
            unAuthorizedRequest?.(); // tu handler de sesión expirada
        }
        return Promise.reject(error); // se rechaza el error original, no un string
    },
);