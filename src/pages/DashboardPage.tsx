import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '../hooks/useEmployees';
import { useEmployeePagination } from '../hooks/useEmployeePagination';
import { getInitials, getAvatarColor } from '../constants/avatar';
import { NAV_ITEMS } from '../constants/navigation';
import {
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  MailIcon,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('directorio');

  // Custom hook para manejar la recuperación de datos de la API
  const { employees, isLoading, error, fetchEmployees } = useEmployees();

  // Custom hook para manejar la paginación
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

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'US';

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* ────────── Sidebar ────────── */}
      <aside className="w-56 bg-slate-950 text-white flex flex-col justify-between shrink-0">
        <div>
          {/* Marca */}
          <div className="px-4 py-5">
            <div className="flex items-center gap-2.5 mb-1">
              <div>
                <p className="text-sm font-bold text-white tracking-tight leading-none">Portal de Empleados</p>
              </div>
            </div>
          </div>

          {/* Divisor */}
          <div className="mx-4 border-t border-slate-800 mb-3" />

          {/* Etiqueta de sección */}
          <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Menú</p>

          {/* Navegación */}
          <nav className="flex flex-col gap-0.5 px-2">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer w-full text-left group relative ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-700/40'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                    }`}
                  onClick={() => setActiveTab(id)}
                >
                  {/* Barra indicadora */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-300 rounded-r-full" />
                  )}
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span>{label}</span>
                  {/* Badge con conteo en Directorio */}
                  {id === 'directorio' && employees.length > 0 && (
                    <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-blue-500/50 text-blue-100' : 'bg-slate-800 text-slate-400'
                      }`}>
                      {employees.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer de usuario */}
        <div className="p-3">
          <div className="bg-slate-900 rounded-xl p-3 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-md">
                {initials}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-slate-100 truncate">{user?.username || 'Usuario'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] text-slate-500">Conectado</p>
                </div>
              </div>
            </div>
            <button
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-all cursor-pointer border border-slate-800 hover:border-red-500/20"
              onClick={handleLogout}
            >
              <LogOut size={13} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

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
            <section className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-w-0 overflow-hidden">
              {/* Controles del encabezado de la tabla */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Directorio de Empleados</h3>
                  <p className="text-[11px] text-slate-400">
                    Paginación activa · {totalItems} coincidencias
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchEmployees}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg text-xs font-medium transition-all cursor-pointer"
                  >
                    <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                    <span>Actualizar</span>
                  </button>

                  <span className="text-xs text-slate-500">Por página:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 cursor-pointer"
                  >
                    {[10, 15, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
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
              <div
                className="flex-1 overflow-y-auto"
              >
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
                  // Renderiza una fila por cada empleado
                  currentPageEmployees.map((emp) => {
                    const nombre = emp.name || 'Sin Nombre';
                    const email = emp.email || '—';
                    const departamento = emp.department || 'General';
                    const cargo = emp.position || 'Empleado';
                    const avatarColor = getAvatarColor(nombre);
                    const avatarInitials = getInitials(nombre);

                    return (
                      <div
                        key={emp.id || emp.email || nombre}
                        className="grid grid-cols-[2fr_2.5fr_1.5fr_1.5fr] gap-3 items-center px-5 border-b border-slate-100 hover:bg-blue-50/40 transition-colors"
                      >
                        {/* Empleado */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full ${avatarColor} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}>
                            {avatarInitials}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-900 truncate" title={nombre}>
                              {nombre}
                            </span>
                          </div>
                        </div>

                        {/* Email */}
                        <span className="text-xs text-slate-500 truncate" title={email}>{email}</span>

                        {/* Departamento */}
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-current/20">
                            <span className="w-1.5 h-1.5 rounded-full" />
                            {departamento}
                          </span>
                        </div>

                        {/* Cargo */}
                        <span className="text-xs text-slate-600 truncate font-medium" title={cargo}>{cargo}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Barra de pafginación */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
                <span className="text-xs text-slate-500">
                  {totalItems === 0 ? '0' : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, totalItems)}`} de <strong className="text-slate-700">{totalItems}</strong> empleados
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-slate-600"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs font-semibold text-slate-700 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-slate-600"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
