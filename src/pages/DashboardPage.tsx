import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '../hooks/useEmployees';
import { Sidebar } from '../components/Sidebar';
import { ReportCard } from '../components/ReportCard';
import { SessionWarning } from '../components/SessionWarning';
import { EmployeesView } from './EmployeesView';
import { DevicesView } from './DevicesView';

// Key que conserva la pestaña activa en localStorage para mantenerla al recargar
const TAB_KEY = 'employee_frontend_tab';

// Lee la pestaña activa guardada (con respaldo por si hay datos inválidos)
function readActiveTab(): string {
  const saved = localStorage.getItem(TAB_KEY);
  return saved ?? 'directorio';
}

// Cascarón del dashboard: navegación (tabs + drawer móvil + logout) y aviso de
// sesión. El dato por pestaña vive en sus vistas (EmployeesView, DevicesView),
// que se montan solo cuando el tab está activo y así no disparan queries ajenas.
export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Lazy init: arranca en la pestaña que quedó guardada tras la última sesión
  const [activeTab, setActiveTab] = useState<string>(readActiveTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Solo para el badge de la sidebar: mantiene el conteo vivo con un solo
  // request; comparte query key con EmployeesView, así React Query lo deduplica.
  const { employees } = useEmployees();

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

  // Subtítulo estático de la barra: los totales viven en cada tabla
  const subtitle =
    activeTab === 'reporte'
      ? 'Generación asíncrona de reportes con polling'
      : activeTab === 'dispositivos'
        ? 'Alta, edición y borrado con paginación activa'
        : 'Directorio · filtros y paginación activa';

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
              <p className="text-[11px] text-slate-400">{subtitle}</p>
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
              <DevicesView />
            ) : activeTab === 'reporte' ? (
              /* Vista del reporte con polling */
              <div className="flex justify-center items-start pt-4">
                <ReportCard />
              </div>
            ) : (
              /* Vista del directorio con filtros */
              <EmployeesView />
            )}
          </div>
        </main>
      </div>
    </>
  );
};