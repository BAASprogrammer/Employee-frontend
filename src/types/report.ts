// Enumerador numérico del estado del job (0 = Processing, 1 = Completed)
export const REPORT_STATUS = {
  PROCESSING: 0,
  COMPLETED: 1,
} as const;

// Tipo del estado del job basado en el valor numérico que devuelve la API
export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

// Interface que define la respuesta de generar el reporte
export interface ReportGenerationResponse {
  executionId: string;
}

// Interface que define el resultado del reporte al completarse
export interface ReportResult {
  totalEmployees: number;
  departments: number;
}

// Interface que define el job de reporte devuelto por GET /status
export interface ReportJob {
  id: string;
  status: ReportStatus;
  createdAt?: string;
  completedAt?: string | null;
  result?: ReportResult | null;
}