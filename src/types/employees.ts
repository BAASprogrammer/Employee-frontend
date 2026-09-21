import type { Employee } from './employee';

// Interface que define el estado de la consulta de empleados
export interface EmployeesResult {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  isFetching: boolean;
  isOffline: boolean;
  fetchEmployees: () => void;
}