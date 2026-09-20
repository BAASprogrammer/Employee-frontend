import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '../hooks/useEmployees';
import { useEmployeePagination } from '../hooks/useEmployeePagination';
import { getDepartmentOptions, getPositionOptions } from '../utils/employeeOptions';
import { Sidebar } from '../components/Sidebar';
import { EmployeeTable } from '../components/EmployeeTable';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('directorio');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  // Custom hook para manejar la recuperación de datos de la API
  const { employees, isLoading, error, fetchEmployees, isFetching } = useEmployees();

  // Empleados filtrados por departamento y cargo
  const filteredEmployees = useMemo(() => employees.filter((emp) =>
    (!departmentFilter || emp.department === departmentFilter) &&
    (!positionFilter || emp.position === positionFilter)
  ), [employees, departmentFilter, positionFilter]);

  // Custom hook para manejar la paginación
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    currentPageEmployees,
    totalPages,
    totalItems,
  } = useEmployeePagination(filteredEmployees, 15);

  // Manejo del cierre de sesión
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Manejo de filtros: actualiza el valor y vuelve a la primera página
  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
    setCurrentPage(1);
  };
  const handlePositionFilterChange = (value: string) => {
    setPositionFilter(value);
    setCurrentPage(1);
  };

  // Opciones únicas de los filtros (derivadas de los empleados)
  const departmentOptions = useMemo(() => getDepartmentOptions(employees), [employees]);
  const positionOptions = useMemo(() => getPositionOptions(employees), [employees]);

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
            <h1 className="text-sm font-bold text-slate-900 leading-tight">Dashboard de Empleados</h1>
            <p className="text-[11px] text-slate-400">{employees.length} registros cargados · paginación activa</p>
          </div>
        </header>

        <div className="p-6 flex-1 flex flex-col gap-6">

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
        </div>
      </main>
    </div>
  );
};