import axios from 'axios';

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