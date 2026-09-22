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

// Mensaje contextual del error del reporte: un 404 del estado del job no es
// "no se encontraron resultados" — el job vive en memoria del backend y, si la
// API se reinició, esa executionId ya no existe.
export function getReportErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return 'El reporte ya no está disponible: Reintenta la generación.';
  }
  return getErrorMessage(error);
}