import { describe, it, expect } from 'vitest';
import { getDepartmentOptions, getPositionOptions } from './employeeOptions';
import type { Employee } from '../types/employee';
// Crea empleados de prueba con nombre, email, dni, departamento y posición
const employees: Employee[] = [
  { id: 1, name: 'Ana', email: 'ana@correo.com', dni: '1', department: 'IT', position: 'Developer' },
  { id: 2, name: 'Bruno', email: 'bruno@correo.com', dni: '2', department: 'Ventas', position: 'Developer' },
  { id: 3, name: 'Carla', email: 'carla@correo.com', dni: '3', department: 'IT', position: 'Manager' },
];
// Tests para getDepartmentOptions
describe('getDepartmentOptions', () => {
  // Verifica que los departamentos son únicos y ordenados
  it('devuelve departamentos únicos y ordenados', () => {
    expect(getDepartmentOptions(employees)).toEqual(['IT', 'Ventas']);
  });
});
// Tests para getPositionOptions
describe('getPositionOptions', () => {
  // Verifica que los cargos son únicos y ordenados
  it('devuelve cargos únicos y ordenados', () => {
    expect(getPositionOptions(employees)).toEqual(['Developer', 'Manager']);
  });
  // Verifica que devuelve una lista vacía sin empleados
  it('devuelve una lista vacía sin empleados', () => {
    expect(getPositionOptions([])).toEqual([]);
  });
});