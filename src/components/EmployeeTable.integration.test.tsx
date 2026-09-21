import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmployeeTable } from './EmployeeTable';
import { useEmployees } from '../hooks/useEmployees';
import { useEmployeePagination } from '../hooks/useEmployeePagination';
import type { Employee } from '../types/employee';

// vi.mock reemplaza el módulo real de axios por un objeto de mentira: cuando
// useEmployees importe { api, getErrorMessage } de ../api/axiosInstance, lo que
// obtiene es esto, nunca la red de verdad.
//
// vi.hoisted es OBLIGATORIO: vi.mock se ejecuta antes que el resto del archivo
// (hoisting). Si apiGet se definiera después con `const`, el factory no la
// encontraría todavía y lanzaría ReferenceError. vi.hoisted la crea primero.
const { apiGet } = vi.hoisted(() => ({ apiGet: vi.fn() }));

vi.mock('../api/axiosInstance', () => ({
  // El código real hace .then((res) => res.data), por eso get devuelve { data }.
  api: { get: apiGet },
  // useEmployees llama a getErrorMessage(error) para mostrar el banner;
  // esta versión convierte el error en su message para que el test lo lea.
  getErrorMessage: (e: unknown) => (e as Error).message,
}));

// Genera n empleados con nombres UNICOS y deterministicos (Empleado 1, 2, ...).
// El test habla de "Empleado 1" y "Empleado 16" por nombre, y 45 registros dan
// exactamente 3 páginas de 15, la misma historia que el test unitario.
const makeEmployees = (n: number): Employee[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    name: `Empleado ${i + 1}`,
    email: `empleado${i + 1}@correo.com`,
    dni: `${1000 + i}`,
    department: 'IT',
    position: 'Developer',
  }));

// Esto es lo que hace al test de INTEGRACION y no de componente: la tabla no
// recibe datos congelados. El flujo entero circula como en producción:
// useEmployees (con axios mockeado) -> useEmployeePagination -> EmployeeTable.
const TableHarness: React.FC = () => {
  const { employees, isLoading, error, isFetching, isOffline, fetchEmployees } = useEmployees();
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    currentPageEmployees,
    totalPages,
    totalItems,
  } = useEmployeePagination(employees, 15);

  return (
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
      departmentOptions={[]}
      positionOptions={[]}
      departmentFilter=""
      positionFilter=""
      onPageSizeChange={setPageSize}
      onRefresh={fetchEmployees}
      onPageChange={setCurrentPage}
      onDepartmentFilterChange={() => { }}
      onPositionFilterChange={() => { }}
    />
  );
};

// useEmployees es un hook de useQuery y requiere un QueryClientProvider por
// arriba, igual que la app real. Se crea un client NUEVO por test (no hereda
// cache entre tests) y con retry:false: si una peticion falla, la query no
// hace los 3 reintentos por defecto y el test de error termina rapido.
const renderTable = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TableHarness />
    </QueryClientProvider>
  );
};

// Entre test y test, apiGet se limpia: si no, heredaría el comportamiento
// (mockResolvedValue/mockRejectedValue) del test anterior.
beforeEach(() => {
  apiGet.mockReset();
});
// Tests
describe('EmployeeTable (integración)', () => {
  it('carga de la API y muestra las primeras 15 filas', async () => {
    // Promesa ya resuelta: el GET /api/employee "devuelve" 45 empleados.
    apiGet.mockResolvedValue({ data: makeEmployees(45) });
    renderTable();

    // findByText espera asyncronamente: el primer render esta en "Cargando...",
    // hay que dejar que la query resuelva y re-renderice antes de afirmar.
    expect(await screen.findByText('Empleado 1')).toBeTruthy();

    // La pagina 1 muestra exactamente el slice de 15 filas, no las 45.
    expect(screen.getAllByText(/^Empleado \d+$/)).toHaveLength(15);
    // queryBy devuelve null si no existe: la fila 16 NO esta en el DOM.
    expect(screen.queryByText('Empleado 16')).toBeNull();

    // El paginador recorre el total real (45), no el slice: el strong muestra "45".
    // OJO: getByText matchea nodos de texto directos; "45" está dentro del <strong>,
    // por eso la regex "de 45 empleados" sobre el span padre no habría matcheado.
    expect(screen.getByText('45')).toBeTruthy();
  });

  it('pagina en el cliente: siguiente página muestra el slice siguiente', async () => {
    apiGet.mockResolvedValue({ data: makeEmployees(45) });
    renderTable();

    // Primero esperar que la pagina 1 termine de renderizar.
    await screen.findByText('Empleado 1');

    // fireEvent.click dispara el evento como un usuario: el boton de la pagina
    // siguiente se localiza por su atributo title ("Página siguiente").
    fireEvent.click(screen.getByTitle('Página siguiente'));

    // El slice se recalculó: ahora se ven las filas 16-30.
    expect(await screen.findByText('Empleado 16')).toBeTruthy();
    // Y la fila 1 dejo de estar en el DOM.
    expect(screen.queryByText('Empleado 1')).toBeNull();
  });

  it('muestra el estado vacío cuando la API devuelve []', async () => {
    apiGet.mockResolvedValue({ data: [] });
    renderTable();

    // Misma cadena, con 0 empleados: el hook devuelve [], el paginador da
    // totalPages = 1, y la tabla cae en el branch de "No se encontraron empleados".
    expect(await screen.findByText('No se encontraron empleados')).toBeTruthy();
  });

  it('muestra el banner de error cuando la petición falla', async () => {
    // Promesa RECHAZADA: la query entra en estado error, useEmployees devuelve
    // error = getErrorMessage(error) = "Error de red", y la tabla muestra el banner.
    apiGet.mockRejectedValue(new Error('Error de red'));
    renderTable();

    expect(await screen.findByText('Error de red')).toBeTruthy();
  });
});