import type { Device, DeviceInput } from './device';

// Interface que define las propiedades de la tabla de dispositivos. Sigue el
// mismo patrón desacoplado de EmployeeTable: recibe el slice de la página
// actual junto con los datos de la paginación en el cliente (estrategia 4.a).
export interface DeviceTableProps {
  currentPageDevices: Device[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
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