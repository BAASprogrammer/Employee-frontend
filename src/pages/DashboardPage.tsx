import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '../hooks/useEmployees';
import { useEmployeeOptions } from '../hooks/useEmployeeOptions';
import { useEmployeePagination } from '../hooks/useEmployeePagination';
import { useClientPagination } from '../hooks/useClientPagination';
import { useDevices, useCreateDevice, useUpdateDevice, useDeleteDevice } from '../hooks/useDevices';
import { Sidebar } from '../components/Sidebar';
import { EmployeeTable } from '../components/EmployeeTable';
import { DeviceTable } from '../components/DeviceTable';
import { ReportCard } from '../components/ReportCard';
import { SessionWarning } from '../components/SessionWarning';
import { getErrorMessage } from '../utils/errors';
import type { DeviceInput } from '../types/device';

// Key que conserva la pestaña activa en localStorage para mantenerla al recargar
const TAB_KEY = 'employee_frontend_tab';

// Lee la pestaña activa guardada (con respaldo por si hay datos inválidos)
function readActiveTab(): string {
  const saved = localStorage.getItem(TAB_KEY);
  return saved ?? 'directorio';
}

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Lazy init: arranca en la pestaña que quedó guardada tras la última sesión
  const [activeTab, setActiveTab] = useState<string>(readActiveTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  // Custom hook para manejar la recuperación de datos de la API, filtrando en el backend
  const { employees, isLoading, error, fetchEmployees, isFetching, isOffline } = useEmployees(
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

  // Dispositivos: listado + mutations de creación/actualización/eliminación
  const {
    devices,
    isLoading: devicesLoading,
    isFetching: devicesFetching,
    isOffline: devicesOffline,
    error: devicesError,
    refetch: refetchDevices,
  } = useDevices();
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();
  const mutationError = createDevice.error || updateDevice.error || deleteDevice.error;
  const mutationPending = createDevice.isPending || updateDevice.isPending || deleteDevice.isPending;

  // Paginación en el cliente para dispositivos: la misma estrategia
  // anti-sobrecarga de la sección 4.a que se usa en el directorio (slice).
  const {
    currentPage: deviceCurrentPage,
    setCurrentPage: setDeviceCurrentPage,
    pageSize: devicePageSize,
    setPageSize: setDevicePageSize,
    currentPageItems: currentPageDevices,
    totalPages: deviceTotalPages,
    totalItems: deviceTotalItems,
  } = useClientPagination(devices, 15);

  const handleCreateDevice = (input: DeviceInput): Promise<void> =>
    createDevice.mutateAsync(input).then(() => undefined);
  const handleUpdateDevice = (id: string, input: DeviceInput): Promise<void> =>
    updateDevice.mutateAsync({ id, input }).then(() => undefined);
  const handleDeleteDevice = (id: string): Promise<void> =>
    deleteDevice.mutateAsync(id).then(() => undefined);

  // Manejo del cierre de sesión
  const handleLogout = () => {
    logout();
    // replace: el dashboard sale del historial y el botón "atrás" no puede
    // volver a una página autenticada después del logout
    navigate('/login', { replace: true });
  };

  // Cambio de pestaña (cierra el menú móvil al navegar)
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem(TAB_KEY, tab);
    setMobileMenuOpen(false);
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
    <>
      {/* Aviso proactivo de expiración de sesión (solo si quedan <5 min) */}
      <SessionWarning />
      <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        user={user}
        employeeCount={employees.length}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Barra superior */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 gap-4">
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              {activeTab === 'reporte' ? 'Reporte de Empleados' : activeTab === 'dispositivos' ? 'Dispositivos' : 'Dashboard de Empleados'}
            </h1>
            <p className="text-[11px] text-slate-400">
              {activeTab === 'reporte'
                ? 'Generación asíncrona de reportes con polling'
                : activeTab === 'dispositivos'
                  ? `${devices.length} dispositivos registrados · paginación activa`
                  : `${employees.length} registros cargados · paginación activa`}
            </p>
          </div>

          {/* Botón hamburguesa (solo móvil) */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
        </header>

        <div className="p-6 flex-1 flex flex-col gap-6 min-h-0">

          {activeTab === 'dispositivos' ? (
            /* Vista de dispositivos: lista + alta/edición/borrado vía la API */
            <div className="flex flex-1 min-h-0">
              <DeviceTable
                currentPageDevices={currentPageDevices}
                currentPage={deviceCurrentPage}
                totalPages={deviceTotalPages}
                totalItems={deviceTotalItems}
                pageSize={devicePageSize}
                onPageChange={setDeviceCurrentPage}
                onPageSizeChange={setDevicePageSize}
                isLoading={devicesLoading}
                isFetching={devicesFetching}
                isOffline={devicesOffline}
                error={devicesError}
                mutationError={mutationError ? getErrorMessage(mutationError) : null}
                mutationPending={mutationPending}
                onCreate={handleCreateDevice}
                onUpdate={handleUpdateDevice}
                onDelete={handleDeleteDevice}
                onRefresh={refetchDevices}
              />
            </div>
          ) : activeTab === 'reporte' ? (
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
          )}
        </div>
      </main>
      </div>
    </>
  );
};