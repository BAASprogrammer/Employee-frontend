import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../api/axiosInstance';
import { REPORT_STATUS } from '../types/report';
import type { ReportGenerationResponse, ReportJob } from '../types/report';

// Intervalo inicial de polling del estado del reporte (ms)
export const STATUS_POLLING_MS = 2000;
// Deadline global: si el job no completa en este tiempo, se abandona el polling.
// 20 s deja ~2.5x de holgura sobre el ~8 s que tarda el job real: el backoff
// (2 s hasta la mitad, 4 s después) detecta el Completed con margen de sobra y
// el cap solo resguarda casos donde el job nunca termina.
export const STATUS_MAX_WAIT_MS = 20_000;

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
    // Sin reintentos automáticos: el polling mismo es el reintento, y corta ante error
    retry: false,
    // Programa el siguiente poll; devolver false detiene el polling
    refetchInterval: (query) => {
      const job = query.state.data;

      // Estado terminal: Completed corta el polling
      if (job?.status === REPORT_STATUS.COMPLETED) return false;

      // Sin conexión: sin internet el fetch no falla, se pausa
      // (fetchStatus === 'paused' en vez de un error). No hay nada que
      // consultar hasta volver online, así que también se corta el polling.
      if (query.state.fetchStatus === 'paused') return false;

      // Cualquier error (500, sin internet/red, 404) corta el polling: no se
      // insiste sobre una respuesta que no va a mejorar por sí sola. La UI
      // muestra el error con opción de reintento (nuevo job).
      if (query.state.status === 'error') return false;

      // Deadline global: si el job jamás llega a Completed (sin errores), abandonar
      const createdAt = job?.createdAt ? Date.parse(job.createdAt) : null;

      // Fecha de creación del job (si no existe, se usa la fecha de la query)
      const anchor =
        createdAt !== null && !Number.isNaN(createdAt) ? createdAt : query.state.dataUpdatedAt;
      // Tiempo transcurrido desde la creación del job
      const elapsed = Date.now() - anchor;
      if (elapsed >= STATUS_MAX_WAIT_MS) return false;

      // Aún sin primer dato: seguir consultando
      if (!job) return STATUS_POLLING_MS;

      // Backoff acotado por el deadline: los escalones van en función de
      // STATUS_MAX_WAIT_MS para que nunca se programe un poll que ya no tiene
      // cabida dentro del tope (con 20 s: 2 s hasta la mitad, 4 s después).
      // Si lleva menos de la mitad del deadline, consultar cada 2 segundos
      if (elapsed < STATUS_MAX_WAIT_MS / 2) return STATUS_POLLING_MS;
      // Si ya pasó la mitad, consultar cada 4 segundos
      return STATUS_POLLING_MS * 2;
    },
  });