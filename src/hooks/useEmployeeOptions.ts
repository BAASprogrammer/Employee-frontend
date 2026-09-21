import { useMemo } from 'react';
import type { Employee } from '../types/employee';
import type { UseEmployeeOptionsResult } from '../types/useEmployeeOptions';
import { getDepartmentOptions, getPositionOptions } from '../utils/employeeOptions';

// Hook que deriva las opciones únicas de departamento y cargo desde el dataset
// completo de empleados (no desde las colecciones Departments/Positions de la API,
// que el seed del backend no puebla).
export const useEmployeeOptions = (employees: Employee[]): UseEmployeeOptionsResult => {
  const departmentOptions = useMemo(() => getDepartmentOptions(employees), [employees]);
  const positionOptions = useMemo(() => getPositionOptions(employees), [employees]);

  return { departmentOptions, positionOptions };
};