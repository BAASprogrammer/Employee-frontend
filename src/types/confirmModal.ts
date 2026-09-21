import type { ReactNode } from 'react';

// Interface que define las propiedades del modal de confirmación
export interface ConfirmModalProps {
  title: string;
  description?: string;
  message: ReactNode;
  confirmLabel?: string;
  icon?: ReactNode;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}