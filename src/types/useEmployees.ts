import type { Employee } from './employee';

export interface UseEmployeesResult {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  fetchEmployees: () => void;
}