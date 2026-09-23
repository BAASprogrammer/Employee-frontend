// Límites de longitud del schema de dispositivos. Reflejan los DataAnnotations
// del backend ([StringLength]) — es parte del contrato: pasarlos, el backend
// rebota la petición con un 400 de validación.
export const DEVICE_NAME_MAX_LENGTH = 100;
export const DEVICE_LOCATION_MAX_LENGTH = 150;
export const DEVICE_TIMEZONE_MAX_LENGTH = 64;