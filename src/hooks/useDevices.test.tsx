import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDevices, useCreateDevice, useUpdateDevice, useDeleteDevice } from './useDevices';
import type { Device, DeviceInput } from '../types/device';

// vi.mock reemplaza el módulo real de axios por un objeto de mentira: los hooks
// de useDevices importan { api } de ../api/axiosInstance y acá obtienen estos
// mocks, nunca la red de verdad. vi.hoisted crea las fns antes del factory de
// vi.mock (hoisting), igual que en el test de integración de la tabla.
const { apiGet, apiPost, apiPut, apiDelete } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock('../api/axiosInstance', () => ({
  api: { get: apiGet, post: apiPost, put: apiPut, delete: apiDelete },
}));

const INITIAL: Device = {
  id: 'd1',
  name: 'Impresora Matriz',
  location: 'Piso 1',
  timezone: 'America/Argentina/Buenos_Aires',
};

const CREATED_INPUT: DeviceInput = {
  name: 'Monitor Recepción',
  location: 'Planta Baja',
  timezone: 'America/Argentina/Buenos_Aires',
};
const CREATED: Device = { id: 'd2', ...CREATED_INPUT };

const UPDATED_INPUT: DeviceInput = {
  name: 'Impresora Láser',
  location: 'Piso 2',
  timezone: 'America/Argentina/Buenos_Aires',
};
const UPDATED: Device = { id: 'd1', ...UPDATED_INPUT };

// Harness que cables los hooks reales con React Query, como hace DashboardPage.
// La tabla (DeviceTable) es presentacional y recibe los callbacks por props, por
// eso el flujo que vale la pena poner a prueba es HOOK -> API mockeada -> caché
// (invalidación tras cada mutation).
const DeviceHarness: React.FC = () => {
  const { devices, isLoading } = useDevices();
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();

  return (
    <div>
      {isLoading && <span role="status">cargando</span>}
      <ul>
        {devices.map((d) => (
          <li key={d.id ?? d.name}>{d.name}</li>
        ))}
      </ul>
      <button onClick={() => createDevice.mutateAsync(CREATED_INPUT)}>crear</button>
      <button onClick={() => updateDevice.mutateAsync({ id: 'd1', input: UPDATED_INPUT })}>editar</button>
      <button onClick={() => deleteDevice.mutateAsync('d1')}>borrar</button>
    </div>
  );
};
// Render de dispositivos
const renderDevices = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <DeviceHarness />
    </QueryClientProvider>
  );
};
// Antes de cada test se resetean los mocks de la API
beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  apiPut.mockReset();
  apiDelete.mockReset();
});
// Describe de los test de useDevices
describe('useDevices (integración)', () => {
  // Verifica que la funcion de cargar dispositivos se ejecute correctamente
  it('carga la lista desde GET /api/device', async () => {
    apiGet.mockResolvedValue({ data: [INITIAL] });
    renderDevices();

    expect(await screen.findByText('Impresora Matriz')).toBeTruthy();
    expect(apiGet).toHaveBeenCalledWith('/api/device', expect.anything());
  });
  // Verifica que la funcion de crear dispositivos se ejecute correctamente
  it('crear dispara POST y la invalidación refresca la lista', async () => {
    // Primer GET: lista vacía. Tras la invalidación del POST: ya trae el nuevo.
    apiGet
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValue({ data: [CREATED] });
    apiPost.mockResolvedValue({ data: CREATED });
    renderDevices();

    fireEvent.click(screen.getByText('crear'));

    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/api/device', CREATED_INPUT));
    // La tabla (vía caché invalidada) muestra el dispositivo recién creado
    expect(await screen.findByText('Monitor Recepción')).toBeTruthy();
  });
  // Verifica que la funcion de editar dispositivos se ejecute correctamente
  it('editar dispara PUT con id e input y refresca la lista', async () => {
    apiGet
      .mockResolvedValueOnce({ data: [INITIAL] })
      .mockResolvedValue({ data: [UPDATED] });
    apiPut.mockResolvedValue({ data: UPDATED });
    renderDevices();
    await screen.findByText('Impresora Matriz');

    fireEvent.click(screen.getByText('editar'));

    await waitFor(() => expect(apiPut).toHaveBeenCalledWith('/api/device/d1', UPDATED_INPUT));
    expect(await screen.findByText('Impresora Láser')).toBeTruthy();
    expect(screen.queryByText('Impresora Matriz')).toBeNull();
  });
  // Verifica que la funcion de borrar dispositivos se ejecute correctamente
  it('borrar dispara DELETE y la invalidación remueve el dispositivo', async () => {
    apiGet
      .mockResolvedValueOnce({ data: [INITIAL] })
      .mockResolvedValue({ data: [] });
    apiDelete.mockResolvedValue({ data: undefined });
    renderDevices();
    await screen.findByText('Impresora Matriz');

    fireEvent.click(screen.getByText('borrar'));

    await waitFor(() => expect(apiDelete).toHaveBeenCalledWith('/api/device/d1'));
    await waitFor(() => expect(screen.queryByText('Impresora Matriz')).toBeNull());
  });
});