// Importa la interface Employee del módulo employee
import type { Employee } from '../types/employee';

// Función que obtiene las opciones únicas de departamento para los filtros
export function getDepartmentOptions(employees: Employee[]): string[] {
  // Crea un set con los departamentos únicos
  const set = new Set(employees.map(emp => emp.department || 'General'));
  // Convierte el set a un array y lo ordena
  return Array.from(set).sort();
}

// Función que obtiene las opciones únicas de cargo para los filtros
export function getPositionOptions(employees: Employee[]): string[] {
  // Crea un set con los cargos únicos
  const set = new Set(employees.map(emp => emp.position || 'Empleado'));
  // Convierte el set a un array y lo ordena
  return Array.from(set).sort();
}