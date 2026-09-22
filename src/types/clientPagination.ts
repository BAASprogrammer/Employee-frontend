// Interface genérica del estado de la paginación en el cliente (estrategia 4.a)
export interface ClientPaginationResult<T> {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPageItems: T[];
  totalPages: number;
  totalItems: number;
}