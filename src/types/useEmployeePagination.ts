import type { Employee } from './employee';

// Interface que define el resultado del hook useEmployeePagination
export interface UseEmployeePaginationResult {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPageEmployees: Employee[];
  totalPages: number;
  totalItems: number;
}