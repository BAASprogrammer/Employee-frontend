import type { Employee } from './employee';

export interface UseEmployeePaginationResult {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPageEmployees: Employee[];
  totalPages: number;
  totalItems: number;
}