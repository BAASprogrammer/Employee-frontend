import React from 'react';
import { Users, RefreshCw, AlertCircle, MailIcon } from 'lucide-react';
import type { EmployeeTableProps } from '../types/employeeTable';
import { EmployeeRow } from './EmployeeRow';
import { PaginationBar } from './PaginationBar';

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  currentPageEmployees,
  isLoading,
  error,
  isFetching,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  departmentOptions,
  positionOptions,
  departmentFilter,
  positionFilter,
  onPageSizeChange,
  onRefresh,
  onPageChange,
  onDepartmentFilterChange,
  onPositionFilterChange,
}) => {
  return (
    <section className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-w-0 overflow-hidden">
      {/* Controles del encabezado de la tabla */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Directorio de Empleados</h3>
          <p className="text-[11px] text-slate-400">
            Paginación activa · {totalItems} coincidencias
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-slate-500">Departamento:</label>
          <select
            value={departmentFilter}
            onChange={(e) => onDepartmentFilterChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 cursor-pointer"
          >
            <option value="">Todos</option>
            {departmentOptions.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>

          <label className="text-xs text-slate-500">Cargo:</label>
          <select
            value={positionFilter}
            onChange={(e) => onPositionFilterChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 cursor-pointer"
          >
            <option value="">Todos</option>
            {positionOptions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg text-xs font-medium transition-all cursor-pointer"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          <span className="text-xs text-slate-500">Por página:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 cursor-pointer"
          >
            {[10, 15, 25, 50, 75, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-3 p-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Encabezados de columna */}
      <div className="grid grid-cols-[2fr_2.5fr_1.5fr_1.5fr] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
        <div>Empleado</div>
        <div className="flex items-center gap-1"><MailIcon size={10} /> Email</div>
        <div>Departamento</div>
        <div>Cargo</div>
      </div>

      {/* Filas de la tabla */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
            <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Cargando directorio...</span>
          </div>
        ) : currentPageEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
            <Users size={36} className="text-slate-200" />
            <p className="text-sm font-medium">No se encontraron empleados</p>
          </div>
        ) : (
          currentPageEmployees.map((emp) => (
            <EmployeeRow key={emp.id || emp.email || emp.name} employee={emp} />
          ))
        )}
      </div>

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </section>
  );
};