import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportCard } from './ReportCard';
import { REPORT_STATUS } from '../types/report';
import type { ReportJob } from '../types/report';

// Mock de la capa HTTP: useReport importa { api } de ../api/axiosInstance, acá la
// reemplazamos por funciones de mentira. El polling es real (STATUS_POLLING_MS,
// 2 s): por eso los asserts después del primer poll usan timeouts amplios.
const { apiGet, apiPost } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock('../api/axiosInstance', () => ({
  api: { get: apiGet, post: apiPost },
}));

// AxiosError de mentira: axios.isAxiosError solo mira isAxiosError === true, y
// getErrorMessage/getReportErrorMessage leen code/response.status
const makeAxiosError = (status: number) =>
  Object.assign(new Error('Request failed with status code ' + status), {
    isAxiosError: true,
    response: { status, data: {} },
  });

// Job que aún se está procesando, con createdAt controlado (para matar el flujo
// de timeout hay que pasarla ~20 s o más al pasado)
const processingJob = (createdAt: string): ReportJob => ({
  id: '1',
  status: REPORT_STATUS.PROCESSING,
  createdAt,
});

const completedJob = (): ReportJob => ({
  id: '1',
  status: REPORT_STATUS.COMPLETED,
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  result: { totalEmployees: 42, departments: 3 },
});

// Renderiza la tarjeta con React Query (retry desactivado; el polling mismo es
// el reintento y ante cualquier error corta
const renderReport = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ReportCard />
    </QueryClientProvider>
  );
};

// Antes de cada prueba se resetean los mocks de la API
beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
});

describe('ReportCard (integración)', () => {
  // Verifica que el flujo generar -> polling -> Completed funcione de punta a punta
  it('genera el job y pollea hasta mostrar el reporte completado', async () => {
    // POST devuelve el executionId; el primer poll está procesando, el segundo (2 s
    // después) ya devolvió Completed con resultado
    apiPost.mockResolvedValue({ data: { executionId: 'e-1' } });
    apiGet
      .mockResolvedValueOnce({ data: processingJob(new Date().toISOString()) })
      .mockResolvedValue({ data: completedJob() });
    renderReport();

    fireEvent.click(screen.getByText('Generar reporte'));

    // Primer pero no último estado: el job está en Processing
    expect(await screen.findByText('Procesando reporte...', {}, { timeout: 3000 })).toBeTruthy();

    // Tras el segundo poll (2 s), llega el resultado
    expect(await screen.findByText('Reporte completado', {}, { timeout: 7000 })).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    // La generación se disparó contra el endpoint correcto
    expect(apiPost).toHaveBeenCalledWith('/api/report/generate');
  });

  // El POST que falla muestra el aviso general de error y permite reintentar
  it('muestra el error si el POST de generación falla y permite reintentar', async () => {
    apiPost.mockRejectedValueOnce(makeAxiosError(500)).mockResolvedValue({ data: { executionId: 'e-2' } });
    apiGet.mockResolvedValue({ data: completedJob() });
    renderReport();

    fireEvent.click(screen.getByText('Generar reporte'));

    // 500 -> mensaje global de getErrorMessage, sin reporte en seguimiento
    expect(await screen.findByText(/Ocurrió un error inesperado \(500\)/)).toBeTruthy();

    // Reintento: ahora el POST responde y el polling completa
    fireEvent.click(screen.getByText('Generar reporte'));
    expect(await screen.findByText('Reporte completado', {}, { timeout: 7000 })).toBeTruthy();
  });

  // El 404 del estado del job NO es "no se encontraron resultados": el job vive
  // en memoria del backend y tiene mensaje propio
  it('muestra el mensaje específico cuando el estado del job responde 404', async () => {
    apiPost.mockResolvedValue({ data: { executionId: 'e-3' } });
    apiGet.mockRejectedValueOnce(makeAxiosError(404));
    renderReport();

    fireEvent.click(screen.getByText('Generar reporte'));

    expect(await screen.findByText('El reporte ya no está disponible: Reintenta la generación.')).toBeTruthy();
    expect(apiGet).toHaveBeenCalledWith('/api/report/e-3/status', expect.anything());
  });

  // Deadline global: job viejo en Processing -> timeout sin esperar los 20 s
  // reales (el createdAt ya pasó el límite, el timer cae a ~0 ms)
  it('detecta el timeout si el job nunca completa antes del deadline', async () => {
    apiPost.mockResolvedValue({ data: { executionId: 'e-4' } });
    apiGet.mockResolvedValue({
      data: processingJob(new Date(Date.now() - 25_000).toISOString()),
    });
    renderReport();

    fireEvent.click(screen.getByText('Generar reporte'));

    expect(await screen.findByText(/El reporte tardó más de 20s/)).toBeTruthy();
    expect(screen.getByText('Reintentar generación')).toBeTruthy();
  });
});