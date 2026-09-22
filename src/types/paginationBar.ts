// Interface que define las propiedades de la barra de paginación
export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
}