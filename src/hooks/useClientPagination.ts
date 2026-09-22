import { useState, useMemo } from 'react';
import type { ClientPaginationResult } from '../types/clientPagination';

// Paginación genérica en el cliente: corta cualquier array con `slice` para que
// el DOM nunca renderice la lista completa. Es la estrategia anti-sobrecarga de
// la sección 4.a, reutilizada por el directorio (useEmployeePagination) y por la
// vista de dispositivos.
export const useClientPagination = <T,>(
  items: T[],
  initialPageSize: number = 15
): ClientPaginationResult<T> => {
  // Estado de la paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  // Estado del tamaño de la página
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  // Total de ítems y de páginas
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Página efectiva, clavada dentro del rango válido: si el dataset se achicó
  // (se borró la última fila de la página final o se cambió el pageSize) la
  // página guardada puede quedar fuera de rango, y no conviene mostrar una
  // página vacía sin avisar.
  const page = Math.min(currentPage, totalPages);

  // Ítems de la página actual
  const currentPageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    currentPage: page,
    setCurrentPage,
    pageSize,
    setPageSize,
    currentPageItems,
    totalPages,
    totalItems,
  };
};