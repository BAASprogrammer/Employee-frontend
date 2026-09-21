import React, { useState } from 'react';
import {
  AlertCircle, MonitorSmartphone, Pencil, Plus, RefreshCw, Trash2, WifiOff,
} from 'lucide-react';
import type { Device, DeviceInput } from '../types/device';
import type { DeviceTableProps } from '../types/deviceTable';
import { DeviceForm } from './DeviceForm';
import { ConfirmModal } from './ConfirmModal';

// Valores iniciales del formulario al dar de alta
const EMPTY_FORM: DeviceInput = { name: '', location: '', timezone: '' };

// Tabla de dispositivos con alta, edición y borrado vía la API.
// El formulario (DeviceForm) y el modal de confirmación (ConfirmModal) viven
// en sus propios archivos; acá queda la tabla, el estado de apertura y el cableado.
export const DeviceTable: React.FC<DeviceTableProps> = ({
  devices,
  isLoading,
  isFetching,
  isOffline,
  error,
  mutationError,
  mutationPending,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
}) => {
  // Estado del formulario: abierto y dispositivo en edición (null = alta nueva)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  // Dispositivo pendiente de confirmar borrado en el modal
  const [pendingDelete, setPendingDelete] = useState<Device | null>(null);

  const openCreate = () => {
    setEditingDevice(null);
    setIsFormOpen(true);
  };

  const openEdit = (device: Device) => {
    setEditingDevice(device);
    setIsFormOpen(true);
  };

  // No se cierra mientras una mutation está en vuelo
  const closeForm = () => {
    if (mutationPending) return;
    setIsFormOpen(false);
    setEditingDevice(null);
  };

  // Guarda el alta (POST) o la edición (PUT); al fallar la mutation, el
  // formulario queda abierto para reintentar.
  const handleFormSubmit = async (input: DeviceInput) => {
    if (editingDevice?.id) {
      await onUpdate(editingDevice.id, input);
    } else {
      await onCreate(input);
    }
    closeForm();
  };

  const handleDelete = (device: Device) => {
    if (!device.id) return;
    setPendingDelete(device);
  };

  // Confirma el borrado en el modal: al fallar se mantiene abierto para reintentar
  const handleConfirmDelete = async () => {
    if (!pendingDelete?.id) return;
    await onDelete(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <section className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-w-0 overflow-hidden">
      {/* Encabezado */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0 gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Dispositivos</h3>
          <p className="text-[11px] text-slate-400">
            {devices.length === 0 ? 'Sin dispositivos registrados' : `${devices.length} dispositivos registrados`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openCreate}
            disabled={mutationPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus size={13} />
            <span>Nuevo dispositivo</span>
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg text-xs font-medium transition-all cursor-pointer"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Formulario inline de alta/edición */}
      {isFormOpen && (
        <DeviceForm
          key={editingDevice?.id ?? 'new'}
          editing={!!editingDevice}
          pending={mutationPending}
          isOffline={isOffline}
          initial={
            editingDevice
              ? { name: editingDevice.name, location: editingDevice.location, timezone: editingDevice.timezone }
              : EMPTY_FORM
          }
          onSubmit={(input) => void handleFormSubmit(input)}
          onCancel={closeForm}
        />
      )}

      {/* Error de la query */}
      {error && !isOffline && (
        <div className="mx-5 mt-3 p-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Error de las mutations de alta/edición */}
      {mutationError && (
        <div className="mx-5 mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{mutationError}</span>
        </div>
      )}

      {/* Banner de desconexión (mismo criterio que el directorio) */}
      {isOffline && !isLoading && (
        <div className="mx-5 mt-3 p-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs flex items-center gap-2">
          <WifiOff size={14} className="shrink-0" />
          <span>
            {devices.length > 0
              ? 'Sin conexión: mostrando resultados guardados del último contacto con el servidor.'
              : 'Sin conexión: no se pudieron cargar los dispositivos.'}
          </span>
        </div>
      )}

      {/* Encabezados de columna */}
      <div className="grid grid-cols-[1.4fr_1.4fr_1.4fr_5rem] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mt-3">
        <div>Nombre</div>
        <div>Ubicación</div>
        <div>Zona horaria</div>
        <div className="text-right">Acciones</div>
      </div>

      {/* Filas */}
      <div className="flex-1 overflow-y-auto relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
            <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Cargando dispositivos...</span>
          </div>
        ) : devices.length === 0 ? (
          isOffline ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
              <WifiOff size={36} className="text-slate-200" />
              <p className="text-sm font-medium">Sin conexión: sin datos guardados</p>
              <p className="text-xs text-slate-400">La lista se cargará al volver la conexión.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
              <MonitorSmartphone size={36} className="text-slate-200" />
              <p className="text-sm font-medium">No hay dispositivos registrados</p>
              <p className="text-xs text-slate-400">Usá "Nuevo dispositivo" para dar de alta el primero.</p>
            </div>
          )
        ) : (
          devices.map((device) => (
            <div
              key={device.id ?? device.name}
              className="grid grid-cols-[1.4fr_1.4fr_1.4fr_5rem] gap-3 px-5 py-3 border-b border-slate-100 text-xs text-slate-700 items-center hover:bg-slate-50/60"
            >
              <div className="font-semibold text-slate-800 flex items-center gap-2 min-w-0">
                <MonitorSmartphone size={14} className="text-blue-600 shrink-0" />
                <span className="truncate">{device.name}</span>
              </div>
              <div className="truncate">{device.location}</div>
              <div className="truncate text-slate-500">{device.timezone}</div>
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => openEdit(device)}
                  disabled={mutationPending}
                  className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-40"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(device)}
                  disabled={mutationPending}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Overlay de refetch */}
        {isFetching && !isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-500">Actualizando...</span>
          </div>
        )}
      </div>

      {/* Modal de confirmación de borrado */}
      {pendingDelete && (
        <ConfirmModal
          title="Eliminar dispositivo"
          description="Esta acción no se puede deshacer."
          message={
            <>
              ¿Eliminar el dispositivo <strong className="text-slate-800">"{pendingDelete.name}"</strong>?
            </>
          }
          confirmLabel="Eliminar"
          icon={<Trash2 size={16} />}
          pending={mutationPending}
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </section>
  );
};