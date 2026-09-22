import React from 'react';
import type { EmployeeRowProps } from '../types/employeeRow';
import { getInitials, getAvatarColor } from '../utils/avatar';

export const EmployeeRow: React.FC<EmployeeRowProps> = ({ employee }) => {
  const nombre = employee.name || 'Sin Nombre';
  const email = employee.email || '—';
  const departamento = employee.department || 'General';
  const cargo = employee.position || 'Empleado';
  const avatarColor = getAvatarColor(nombre);
  const avatarInitials = getInitials(nombre);

  return (
    <div
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
};