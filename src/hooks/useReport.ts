import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '../api/axiosInstance';
import { REPORT_STATUS } from '../types/report';
import type { ReportGenerationResponse, ReportJob } from '../types/report';

// Intervalo inicial de polling del estado del reporte (ms)
export const STATUS_POLLING_MS = 2000;
// Deadline global: si el job no completa en este tiempo, se abandona el polling
export const STATUS_MAX_WAIT_MS = 60_000;

// Extrae el status HTTP de un error de axios (undefined si no aplica)
const getHttpStatus = (error: unknown): number | undefined =>
  isAxiosError(error) ? error.response?.status : undefined;

// Dispara la generación del reporte (POST /api/report/generate)
export const useCreateReport = () =>
  useMutation({
    //  Key para identificar la mutación
    mutationKey: ['report', 'generate'],
    // Evita reintentos automáticos
    retry: 0,
    // Función que realiza la petición POST al backend
    mutationFn: (): Promise<ReportGenerationResponse> =>
      api.post<ReportGenerationResponse>('/api/report/generate').then((response) => response.data),
  });

// Consulta el estado del job con polling hasta Completed (o timeout / error permanente)
export const useReportStatus = (executionId: string | null) =>
  useQuery({
    // Key para identificar la query
    queryKey: ['report-status', executionId],
    // Función que realiza la petición GET al backend (transmite la señal de aborto de TanStack)
    queryFn: ({ signal }): Promise<ReportJob> =>
      api.get<ReportJob>(`/api/report/${executionId}/status`, { signal }).then((response) => response.data),
    // Habilita la query cuando el executionId no es null
    enabled: !!executionId,
    // Sin reintentos automáticos: el propio polling continúa pese a errores transitorios
    retry: false,
    // Programa el siguiente poll; devolver false detiene el polling
    refetchInterval: (query) => {
      const job = query.state.data;

      // Estado terminal: Completed corta el polling
      if (job?.status === REPORT_STATUS.COMPLETED) return false;

      // Deadline global: si el job jamás llega a Completed, abandonar el polling
      const createdAt = job?.createdAt ? Date.parse(job.createdAt) : null;
      const anchor =
        createdAt !== null && !Number.isNaN(createdAt) ? createdAt : query.state.dataUpdatedAt;
      const elapsed = Date.now() - anchor;
      if (job && elapsed >= STATUS_MAX_WAIT_MS) return false;

      // Error permanente (404: el job ya no existe en memoria) corta el polling;
      // los errores transitorios (red, 5xx) no lo cortan: se reintenta en el próximo poll
      if (query.state.status === 'error') {
        return getHttpStatus(query.state.error) === 404 ? false : STATUS_POLLING_MS;
      }

      // Aún sin primer dato: seguir consultando
      if (!job) return STATUS_POLLING_MS;

      // Backoff progresivo según cuánto lleva el job procesando
      if (elapsed < 10_000) return STATUS_POLLING_MS;
      if (elapsed < 30_000) return STATUS_POLLING_MS * 2;
      return STATUS_POLLING_MS * 4;
    },
  });