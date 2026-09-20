import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '../hooks/useEmployees';
import { useEmployeeOptions } from '../hooks/useEmployeeOptions';
import { useEmployeePagination } from '../hooks/useEmployeePagination';
import { Sidebar } from '../components/Sidebar';
import { EmployeeTable } from '../components/EmployeeTable';
import { ReportCard } from '../components/ReportCard';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('directorio');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  // Custom hook para manejar la recuperación de datos de la API, filtrando en el backend
  const { employees, isLoading, error, fetchEmployees, isFetching } = useEmployees(
    departmentFilter,
    positionFilter
  );

  // Dataset completo (sin filtros) usado solo para poblar los selects de filtros,
  // para que las opciones no dependan de las colecciones Departments/Positions del
  // backend (que el seed no puebla) ni del subconjunto ya filtrado.
  const { employees: allEmployees } = useEmployees();

  // Opciones de departamentos/cargos derivadas de la lista completa de empleados
  const { departmentOptions, positionOptions } = useEmployeeOptions(allEmployees);

  // Custom hook para manejar la paginación en el cliente (sin page/pageSize)
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    currentPageEmployees,
    totalPages,
    totalItems,
  } = useEmployeePagination(employees, 15);

  // Manejo del cierre de sesión
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Manejo de filtros: actualiza el valor y vuelve a la primera página.
  // Al cambiar el departamento se limpia el cargo, porque las posiciones dependen del departamento.
  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
    setPositionFilter('');
    setCurrentPage(1);
  };
  const handlePositionFilterChange = (value: string) => {
    setPositionFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        user={user}
        employeeCount={employees.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Barra superior */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 gap-4">
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              {activeTab === 'reporte' ? 'Reporte de Empleados' : 'Dashboard de Empleados'}
            </h1>
            <p className="text-[11px] text-slate-400">
              {activeTab === 'reporte'
                ? 'Generación asíncrona de reportes con polling'
                : `${employees.length} registros cargados · paginación activa`}
            </p>
          </div>
        </header>

        <div className="p-6 flex-1 flex flex-col gap-6 min-h-0">

          {activeTab === 'reporte' ? (
            /* Vista del reporte con polling */
            <div className="flex justify-center items-start pt-4">
              <ReportCard />
            </div>
          ) : (
            <div className="flex gap-5 flex-1 min-h-0">

              {/* Tabla de empleados */}
              <EmployeeTable
                currentPageEmployees={currentPageEmployees}
                isLoading={isLoading}
                error={error}
                isFetching={isFetching}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                departmentOptions={departmentOptions}
                positionOptions={positionOptions}
                departmentFilter={departmentFilter}
                positionFilter={positionFilter}
                onPageSizeChange={setPageSize}
                onRefresh={fetchEmployees}
                onPageChange={setCurrentPage}
                onDepartmentFilterChange={handleDepartmentFilterChange}
                onPositionFilterChange={handlePositionFilterChange}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};