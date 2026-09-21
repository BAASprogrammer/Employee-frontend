import type { Device, DeviceInput } from './device';

// Interface que define las propiedades de la tabla de dispositivos
export interface DeviceTableProps {
  devices: Device[];
  isLoading: boolean;
  isFetching: boolean;
  isOffline: boolean;
  error: string | null;
  mutationError: string | null;
  mutationPending: boolean;
  onCreate: (input: DeviceInput) => Promise<void>;
  onUpdate: (id: string, input: DeviceInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}