import React from 'react';
import { LogOut, X } from 'lucide-react';
import type { SidebarProps } from '../types/sidebar';
import { NAV_ITEMS } from '../constants/navigation';

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  employeeCount,
  activeTab,
  onTabChange,
  onLogout,
  mobileOpen,
  onCloseMobile,
}) => {
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'US';

  const content = (withClose: boolean) => (
    <>
      <div>
        {/* Marca (con botón de cierre en el drawer móvil) */}
        <div className="px-4 py-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 mb-1">
            <div>
              <p className="text-sm font-bold text-white tracking-tight leading-none">Portal de Empleados</p>
            </div>
          </div>
          {withClose && (
            <button
              type="button"
              className="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              onClick={onCloseMobile}
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          )}
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
                onClick={() => onTabChange(id)}
              >
                {/* Barra indicadora */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-300 rounded-r-full" />
                )}
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                <span>{label}</span>
                {/* Badge con conteo en Directorio */}
                {id === 'directorio' && employeeCount > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-blue-500/50 text-blue-100' : 'bg-slate-800 text-slate-400'
                    }`}>
                    {employeeCount}
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
            onClick={onLogout}
          >
            <LogOut size={13} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Sidebar de escritorio */}
      <aside className="hidden md:flex w-56 bg-slate-950 text-white flex-col justify-between shrink-0">
        {content(false)}
      </aside>

      {/* Drawer móvil con hamburguesa */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-950/70"
            onClick={onCloseMobile}
          />
          <aside className="absolute inset-y-0 left-0 w-56 bg-slate-950 text-white flex flex-col justify-between shadow-2xl">
            {content(true)}
          </aside>
        </div>
      )}
    </>
  );
};