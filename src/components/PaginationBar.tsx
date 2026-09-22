import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { PaginationBarProps } from '../types/paginationBar';

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel = 'empleados',
  onPageChange,
}) => {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
      <span className="text-xs text-slate-500">
        {totalItems === 0 ? '0' : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, totalItems)}`} de <strong className="text-slate-700">{totalItems}</strong> {itemLabel}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-slate-600"
          title="Primera página"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-slate-600"
          title="Página anterior"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-semibold text-slate-700 px-2">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages}
          className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-slate-600"
          title="Página siguiente"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-slate-600"
          title="Última página"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
};