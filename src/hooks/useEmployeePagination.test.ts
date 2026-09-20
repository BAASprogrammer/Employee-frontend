import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useEmployeePagination } from './useEmployeePagination';
import type { Employee } from '../types/employee';
// Genera un empleado de prueba con el id, nombre, email, dni, departamento y posición
const makeEmployee = (i: number): Employee => ({
  id: i,
  name: `Empleado ${i}`,
  email: `empleado${i}@correo.com`,
  dni: `${1000 + i}`,
  department: 'IT',
  position: 'Developer',
});

// Genera una lista de empleados de prueba
const employees: Employee[] = Array.from({ length: 45 }, (_, i) => makeEmployee(i));
// Tests para useEmployeePagination
describe('useEmployeePagination', () => {
  it('muestra los primeros pageSize empleados en la página 1', () => {
    const { result } = renderHook(() => useEmployeePagination(employees, 15));
    // Verificar que la página actual es la 1, total de empleados es 45, total de páginas es 3 y la primera página tiene 15 empleados
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalItems).toBe(45);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.currentPageEmployees).toHaveLength(15);
    expect(result.current.currentPageEmployees[0].name).toBe('Empleado 0');
  });
  // Verifica que la página cambia y muestra el slice correspondiente
  it('cambia de página y muestra el slice correspondiente', () => {
    const { result } = renderHook(() => useEmployeePagination(employees, 15));
    // Cambia a la página 2
    act(() => result.current.setCurrentPage(2));
    // Verificar que la página es la 2 y la página 2 tiene 15 empleados
    expect(result.current.currentPage).toBe(2);
    expect(result.current.currentPageEmployees).toHaveLength(15);
    expect(result.current.currentPageEmployees[0].name).toBe('Empleado 15');
  });
  // Verifica que la última página trae los empleados restantes
  it('la última página trae los empleados restantes', () => {
    const { result } = renderHook(() => useEmployeePagination(employees, 15));
    // Cambia a la página 3
    act(() => result.current.setCurrentPage(3));
    // Verifica que la página es la 3 y la página 3 tiene 15 empleados
    expect(result.current.currentPageEmployees).toHaveLength(15);
    expect(result.current.currentPageEmployees[14].name).toBe('Empleado 44');
  });
  // Verifica que el total de páginas cambia según el pageSize elegido
  it('usa el total de páginas según el pageSize elegido', () => {
    const { result } = renderHook(() => useEmployeePagination(employees, 15));
    // Cambia el tamaño de la página a 10
    act(() => result.current.setPageSize(10));
    // Verificar que el total de páginas es 5 y la página 1 tiene 10 empleados
    expect(result.current.totalPages).toBe(5);
    expect(result.current.currentPageEmployees).toHaveLength(10);
  });
  // Verifica que no hay errores cuando la lista está vacía
  it('no rompe con una lista vacía (totalPages = 1)', () => {
    const { result } = renderHook(() => useEmployeePagination([], 15));
    // Verificar que el total de empleados es 0, total de páginas es 1 y la primera página tiene 0 empleados
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.currentPageEmployees).toHaveLength(0);
  });
});