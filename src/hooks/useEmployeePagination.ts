import type { Employee } from '../types/employee';
import type { EmployeePaginationResult } from '../types/employeePagination';
import { useClientPagination } from './useClientPagination';

// Hook de paginación de empleados: reutiliza la paginación genérica en el
// cliente con la misma estrategia anti-sobrecarga (slice, sección 4.a).
export const useEmployeePagination = (
  employees: Employee[],
  initialPageSize: number = 10
): EmployeePaginationResult => {
  const { currentPageItems, ...rest } = useClientPagination(employees, initialPageSize);
  return { ...rest, currentPageEmployees: currentPageItems };
};