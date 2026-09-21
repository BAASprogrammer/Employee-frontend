import React, { useEffect, useState } from 'react';
import { onlineManager } from '@tanstack/react-query';
import { FileText, FileCheck2, Loader2, AlertCircle, RefreshCw, Timer, WifiOff } from 'lucide-react';
import { useCreateReport, useReportStatus, STATUS_MAX_WAIT_MS } from '../hooks/useReport';
import { REPORT_STATUS } from '../types/report';
import { getErrorMessage } from '../api/axiosInstance';

// Tarjeta del reporte: genera el job y muestra el progreso hasta Completed
export const ReportCard: React.FC = () => {
  // Id de ejecución del job (null = sin generar todavía)
  const [executionId, setExecutionId] = useState<string | null>(null);
  // Marca que el usuario pidió una nueva generación pero aún no hay executionId:
  // oculta el resultado del reporte anterior aunque la query conserve datos en caché
  const [generating, setGenerating] = useState(false);
  // Marca si el job superó el deadline global sin completarse
  const [timedOut, setTimedOut] = useState(false);
  // Estado de red global: sin internet las queries y mutations se pausan, no fallan
  const [isOnline, setIsOnline] = useState<boolean>(onlineManager.isOnline());

  useEffect(() => onlineManager.subscribe(setIsOnline), []);

  // Mutación: dispara POST /api/report/generate
  const { mutate: generate, isPending, error: generateError } = useCreateReport();

  // Query: pollea GET /api/report/{executionId}/status hasta Completed (o timeout / 404)
  const { data: job, isLoading, error } = useReportStatus(executionId);

  // Inicia la generación del reporte (reinicia el estado de timeout)
  const handleGenerate = () => {
    setGenerating(true);
    setTimedOut(false);
    setExecutionId(null);
    generate(undefined, {
      onSuccess: (response) => {
        setGenerating(false);
        setExecutionId(response.executionId);
      }
    });
  };

  // Si el job sigue Processing y supera el deadline, cambia a estado "tiempo agotado".
  // El polling ya se detuvo solo (STATUS_MAX_WAIT_MS en useReport); acá solo se refleja en la UI.
  useEffect(() => {
    if (!executionId || job?.status === REPORT_STATUS.COMPLETED) return;
    const createdAt = job?.createdAt ? Date.parse(job.createdAt) : null;
    const anchor = createdAt !== null && !Number.isNaN(createdAt) ? createdAt : Date.now();
    const timer = window.setTimeout(
      () => setTimedOut(true),
      Math.max(0, anchor + STATUS_MAX_WAIT_MS - Date.now())
    );
    return () => window.clearTimeout(timer);
  }, [executionId, job?.createdAt, job?.status]);

  // Sin job y con error (404, 500, sin internet): el polling ya se detuvo en useReport
  const jobFailed = !!error;
  // Sin conexión: las peticiones no fallan sino que se pausan (networkMode 'online')
  const isOffline = !isOnline;
  // Job en procesamiento (incluye la primera consulta de estado en vuelo).
  // Si hay error u offline, el seguimiento se cortó: se muestra el problema, no el spinner.
  const isProcessing =
    ((job?.status === REPORT_STATUS.PROCESSING && !isOffline) || isLoading) && !timedOut && !error;

  return (
    <section className="w-80 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 self-start">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText size={16} className="text-blue-600" />
          Reporte del directorio
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">
          Genera un reporte asíncrono con los totales del directorio (~8s de procesamiento).
        </p>
      </div>

      {/* Error de la generación del job (POST) */}
      {!executionId && generateError && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{getErrorMessage(generateError)}</span>
        </div>
      )}

      {/* Estado: no generado → botón de acción */}
      {!executionId && !jobFailed && (
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? (
            isOffline ? (
              <>
                <WifiOff size={15} />
                <span>Sin conexión: reintentando al volver</span>
              </>
            ) : (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Generando...</span>
              </>
            )
          ) : (
            <>
              <FileText size={15} />
              <span>Generar reporte</span>
            </>
          )}
        </button>
      )}

      {/* Estado: Processing → indicador de progreso */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-slate-400">
          <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Procesando reporte...</span>
          <span className="text-[11px] text-slate-400 animate-pulse">Consultando estado del job</span>
        </div>
      )}

      {/* Estado: timeout → el job nunca completó a tiempo (sin errores) */}
      {timedOut && !error && job?.status !== REPORT_STATUS.COMPLETED && (
        <div className="flex flex-col gap-3">
          <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs flex items-center gap-2">
            <Timer size={14} className="shrink-0" />
            <span>
              El reporte tardó más de {(STATUS_MAX_WAIT_MS / 1000)}s y se canceló el seguimiento. Reintenta la generación.
            </span>
          </div>
          <button
            onClick={handleGenerate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw size={15} />
            <span>Reintentar generación</span>
          </button>
        </div>
      )}

      {/* Estado: sin conexión → polling pausado (no es un error); solo si hay job
          en seguimiento y todavía no completó (si ya completó no hay nada que pausar) */}
      {isOffline && !timedOut && executionId && job?.status !== REPORT_STATUS.COMPLETED && (
        <div className="flex flex-col gap-3">
          <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs flex items-center gap-2">
            <WifiOff size={14} className="shrink-0" />
            <span>Sin conexión: se pausó el seguimiento del reporte. Reintenta la generación cuando vuelvas.</span>
          </div>
          <button
            onClick={handleGenerate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw size={15} />
            <span>Reintentar generación</span>
          </button>
        </div>
      )}

      {/* Estado: error (404 / red) → aviso y reintento */}
      {jobFailed && (
        <div className="flex flex-col gap-3">
          <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{getErrorMessage(error)}</span>
          </div>
          <button
            onClick={handleGenerate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw size={15} />
            <span>Reintentar generación</span>
          </button>
        </div>
      )}

      {/* Estado: Completed → resultado. Se oculta si el usuario ya pidió una nueva
          generación (aunque la query aún conserve el job anterior en caché u offline). */}
      {job?.status === REPORT_STATUS.COMPLETED && !generating && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold">
            <FileCheck2 size={15} />
            <span>Reporte completado</span>
          </div>

          {job.result ? (
            <dl className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-lg py-2.5">
                <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Empleados</dt>
                <dd className="text-lg font-bold text-slate-800">{job.result.totalEmployees}</dd>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg py-2.5">
                <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Deptos.</dt>
                <dd className="text-lg font-bold text-slate-800">{job.result.departments}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-slate-400">El reporte no devolvió resultados.</p>
          )}

          <button
            onClick={handleGenerate}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Generar otro reporte</span>
          </button>
        </div>
      )}
    </section>
  );
};