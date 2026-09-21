import type { Employee } from './employee';

// Interface que define las propiedades de la tabla de empleados
export interface EmployeeTableProps {
  currentPageEmployees: Employee[];
  isLoading: boolean;
  isFetching: boolean;
  isOffline: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  departmentOptions: string[];
  positionOptions: string[];
  departmentFilter: string;
  positionFilter: string;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onDepartmentFilterChange: (value: string) => void;
  onPositionFilterChange: (value: string) => void;
}