// Key que almacena el token en localStorage
const TOKEN_KEY = "employee_token";

// Constante que administra el token en localStorage
export const tokenStorage = {
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