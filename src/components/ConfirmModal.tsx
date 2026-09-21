import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { ConfirmModalProps } from '../types/confirmModal';

// Modal de confirmación de acciones destructivas, reutilizable.
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  description,
  message,
  confirmLabel = 'Confirmar',
  icon,
  pending = false,
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
      className="absolute inset-0 bg-slate-950/50"
      onClick={() => !pending && onCancel()}
    />
    <div className="relative bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-sm mx-4 p-5 flex flex-col gap-4">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
          {icon ?? <AlertCircle size={16} />}
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          {description && <p className="text-[11px] text-slate-500">{description}</p>}
        </div>
      </div>

      <p className="text-xs text-slate-600 text-center">{message}</p>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onCancel}
          disabled={pending}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={pending}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-300 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {pending && <Loader2 size={13} className="animate-spin" />}
          <span>{confirmLabel}</span>
        </button>
      </div>
    </div>
  </div>
);