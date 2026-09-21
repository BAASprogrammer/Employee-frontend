import type { DeviceInput } from './device';

// Interface que define las propiedades del formulario de dispositivos
export interface DeviceFormProps {
  editing: boolean;
  pending: boolean;
  isOffline: boolean;
  initial: DeviceInput;
  onSubmit: (input: DeviceInput) => void;
  onCancel: () => void;
}