import type { Employee } from './employee';

// Interface que define el resultado del hook useEmployees
export interface UseEmployeesResult {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  isFetching: boolean;
  fetchEmployees: () => void;
}