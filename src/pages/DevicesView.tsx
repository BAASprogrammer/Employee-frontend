import React from 'react';
import { useDevices, useCreateDevice, useUpdateDevice, useDeleteDevice } from '../hooks/useDevices';
import { useClientPagination } from '../hooks/useClientPagination';
import { DeviceTable } from '../components/DeviceTable';
import { getErrorMessage } from '../utils/errors';
import type { DeviceInput } from '../types/device';

// Vista de dispositivos: dueña de sus propios datos (listado, paginación en el
// cliente y las mutations de alta/edición/borrado). Se monta solo en el tab
// Dispositivos, así el resto de pestañas no disparan estas queries.
export const DevicesView: React.FC = () => {
  const {
    devices,
    isLoading: devicesLoading,
    isFetching: devicesFetching,
    isOffline: devicesOffline,
    error: devicesError,
    refetch: refetchDevices,
  } = useDevices();
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();
  const mutationError = createDevice.error || updateDevice.error || deleteDevice.error;
  const mutationPending = createDevice.isPending || updateDevice.isPending || deleteDevice.isPending;

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    currentPageItems: currentPageDevices,
    totalPages,
    totalItems,
  } = useClientPagination(devices, 15);

  const handleCreateDevice = (input: DeviceInput): Promise<void> =>
    createDevice.mutateAsync(input).then(() => undefined);
  const handleUpdateDevice = (id: string, input: DeviceInput): Promise<void> =>
    updateDevice.mutateAsync({ id, input }).then(() => undefined);
  const handleDeleteDevice = (id: string): Promise<void> =>
    deleteDevice.mutateAsync(id).then(() => undefined);

  return (
    <div className="flex flex-1 min-h-0">
      <DeviceTable
        currentPageDevices={currentPageDevices}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        isLoading={devicesLoading}
        isFetching={devicesFetching}
        isOffline={devicesOffline}
        error={devicesError}
        mutationError={mutationError ? getErrorMessage(mutationError) : null}
        mutationPending={mutationPending}
        onCreate={handleCreateDevice}
        onUpdate={handleUpdateDevice}
        onDelete={handleDeleteDevice}
        onRefresh={refetchDevices}
      />
    </div>
  );
};