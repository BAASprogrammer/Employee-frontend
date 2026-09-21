// Interface que define la estructura de un dispositivo (schema de la API)
export interface Device {
  id?: string | null;
  name: string;
  location: string;
  timezone: string;
}

// Payload de creación/actualización: el id lo maneja la URL, no el body
export type DeviceInput = Pick<Device, 'name' | 'location' | 'timezone'>;