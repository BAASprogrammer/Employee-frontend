import React, { useState } from 'react';
import { AlertCircle, Loader2, WifiOff, X } from 'lucide-react';
import type { DeviceFormProps } from '../types/deviceForm';
import type { DeviceInput } from '../types/device';

// Formulario inline de alta/edición de dispositivos. Maneja su propio estado y
// la validación en el cliente (los requeridos del schema de la API). El padre
// lo remonta (con `key`) para que cada apertura arranque desde `initial`.
export const DeviceForm: React.FC<DeviceFormProps> = ({
  editing,
  pending,
  isOffline,
  initial,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<DeviceInput>(initial);
  const [formError, setFormError] = useState<string | null>(null);

  // Corta el envío offline: la mutation quedaría pausada en silencio (spinner
  // sin mensaje). Mejor avisar y dejar el formulario listo para reintentar.
  const handleSubmit = () => {
    if (isOffline) {
      setFormError('Sin conexión: no se pudo guardar. Intenta de nuevo cuando vuelvas.');
      return;
    }
    const input: DeviceInput = {
      name: form.name.trim(),
      location: form.location.trim(),
      timezone: form.timezone.trim(),
    };
    if (input.name.length < 2) {
      setFormError('El nombre debe tener al menos 2 caracteres');
      return;
    }
    if (!input.location) {
      setFormError('Indica la ubicación del dispositivo');
      return;
    }
    if (!input.timezone) {
      setFormError('Indica la zona horaria del dispositivo');
      return;
    }
    setFormError(null);
    onSubmit(input);
  };

  return (
    <div className="mx-5 mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-700">
          {editing ? 'Editar dispositivo' : 'Nuevo dispositivo'}
        </p>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer disabled:opacity-40"
          aria-label="Cerrar formulario"
        >
          <X size={15} />
        </button>
      </div>

      {isOffline && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs flex items-center gap-2">
          <WifiOff size={14} className="shrink-0" />
          <span>
            Sin conexión: no se puede {editing ? 'actualizar' : 'crear'} el dispositivo hasta recuperar la conexión.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500">
          Nombre
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Escáner Hall Central"
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500">
          Ubicación
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Ej: Oficina 3"
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500">
          Zona horaria
          <input
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            placeholder="Ej: America/Argentina/Buenos_Aires"
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-400"
          />
        </label>
      </div>

      {formError && (
        <p className="text-[11px] text-amber-700 flex items-center gap-1">
          <AlertCircle size={12} className="shrink-0" />
          {formError}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={pending || isOffline}
          className="flex items-center justify-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {pending && <Loader2 size={13} className="animate-spin" />}
          <span>{editing ? 'Guardar cambios' : 'Crear dispositivo'}</span>
        </button>
        <button
          onClick={onCancel}
          disabled={pending}
          className="px-4 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-40"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};