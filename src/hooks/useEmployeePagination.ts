import { useState, useMemo } from 'react';
import type { Employee } from '../types/employee';
import type { UseEmployeePaginationResult } from '../types/useEmployeePagination';

// Hook para la paginación de empleados
export const useEmployeePagination = (
  employees: Employee[],
  initialPageSize: number = 10
): UseEmployeePaginationResult => {
  // Estado de la paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  // Estado del tamaño de la página
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  // Total de empleados
  const totalItems = employees.length;
  // Total de páginas
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Empleados por página
  const currentPageEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return employees.slice(start, start + pageSize);
  }, [employees, currentPage, pageSize]);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    currentPageEmployees,
    totalPages,
    totalItems,
  };
};