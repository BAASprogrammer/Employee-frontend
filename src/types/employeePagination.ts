import type { Employee } from './employee';

// Interface que define el estado de la paginación de empleados
export interface EmployeePaginationResult {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPageEmployees: Employee[];
  totalPages: number;
  totalItems: number;
}