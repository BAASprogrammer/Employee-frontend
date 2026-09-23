import React, { useState } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { useEmployeeOptions } from '../hooks/useEmployeeOptions';
import { useEmployeePagination } from '../hooks/useEmployeePagination';
import { EmployeeTable } from '../components/EmployeeTable';

// Vista del directorio: dueña de sus propios datos (empleados filtrados en el
// backend, opciones de filtro derivadas y paginación en el cliente). Se monta
// solo en el tab Directorio, así el resto de pestañas no disparan estas queries.
export const EmployeesView: React.FC = () => {
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  // Dataset filtrado que se muestra en la tabla
  const { employees, isLoading, error, fetchEmployees, isFetching, isOffline } = useEmployees(
    departmentFilter,
    positionFilter
  );

  // Dataset completo (sin filtros) usado solo para poblar los selects de filtros,
  // para que las opciones no dependan de las colecciones Departments/Positions
  // del backend (que el seed no puebla) ni del subconjunto ya filtrado.
  const { employees: allEmployees } = useEmployees();

  const { departmentOptions, positionOptions } = useEmployeeOptions(allEmployees);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    currentPageEmployees,
    totalPages,
    totalItems,
  } = useEmployeePagination(employees, 15);

  // Cambio de filtros: actualiza el valor y vuelve a la primera página. Al
  // cambiar el departamento se limpia el cargo, porque las posiciones dependen del departamento.
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
    <div className="flex gap-5 flex-1 min-h-0">
      <EmployeeTable
        currentPageEmployees={currentPageEmployees}
        isLoading={isLoading}
        error={error}
        isFetching={isFetching}
        isOffline={isOffline}
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
  );
};