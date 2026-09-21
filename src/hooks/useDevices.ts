import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../api/axiosInstance';
import type { Device, DeviceInput } from '../types/device';
import { useOnlineStatus } from './useOnlineStatus';

const DEVICES_KEY = ['devices'];

// Consulta la lista de dispositivos (GET /api/device)
export const useDevices = () => {
  // Hook personalizado para manejar el estado de red
  const isOnline = useOnlineStatus();
  // Hook personalizado para manejar la recuperación de datos de la API
  const { data: devices, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: DEVICES_KEY,
    queryFn: ({ signal }) =>
      api.get<Device[]>('/api/device', { signal }).then((res) => res.data),
    staleTime: 60_000,
  });

  return {
    devices: error ? [] : (devices ?? []),
    isLoading: devices === undefined && isLoading,
    isFetching,
    isOffline: !isOnline,
    error: error ? getErrorMessage(error) : null,
    refetch,
  };
};

// Invoca POST /api/device para dar de alta un dispositivo
export const useCreateDevice = () => {
  const queryClient = useQueryClient();
  // Retorna la mutación para crear un dispositivo
  return useMutation({
    mutationKey: ['device', 'create'],
    mutationFn: (input: DeviceInput): Promise<Device> =>
      api.post<Device>('/api/device', input).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEVICES_KEY }),
  });
};

// Invoca PUT /api/device/{id} para actualizar un dispositivo
export const useUpdateDevice = () => {
  const queryClient = useQueryClient();
  // Retorna la mutación para actualizar un dispositivo
  return useMutation({
    mutationKey: ['device', 'update'],
    mutationFn: ({ id, input }: { id: string; input: DeviceInput }): Promise<Device> =>
      api.put<Device>(`/api/device/${id}`, input).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEVICES_KEY }),
  });
};

// Invoca DELETE /api/device/{id} para eliminar un dispositivo
export const useDeleteDevice = () => {
  const queryClient = useQueryClient();
  // Retorna la mutación para eliminar un dispositivo
  return useMutation({
    mutationKey: ['device', 'delete'],
    mutationFn: (id: string): Promise<void> => api.delete<void>(`/api/device/${id}`).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEVICES_KEY }),
  });
};