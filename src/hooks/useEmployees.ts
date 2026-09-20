import { useQuery } from '@tanstack/react-query';
import { api, getErrorMessage } from '../api/axiosInstance';
import type { Employee } from '../types/employee';
import type { UseEmployeesResult } from '../types/useEmployees';

export const useEmployees = (
  departmentName: string = '',
  positionName: string = ''
): UseEmployeesResult => {
  // Custom hook para manejar la recuperación de datos de la API.
  // Los filtros se resuelven en el backend vía query params (departmentName/positionName),
  // sin usar la variante paginada (page/pageSize) que exige el enunciado.
  const { data: employees, isLoading, error, isFetching, refetch: fetchEmployees } = useQuery({
    queryKey: ['employees', departmentName, positionName], // Clave que incluye los filtros activos
    queryFn: ({ signal }) =>
      api
        .get<Employee[]>('/api/employee', {
          signal, // Señal de cancelación
          params: {
            ...(departmentName ? { departmentName } : {}),
            ...(positionName ? { positionName } : {}),
          },
        })
        .then((res) => res.data), // Función que se ejecuta cuando se necesita obtener los datos
    staleTime: 60_000 // 1 minuto: evita refetch innecesario
  });

  // Retorna el resultado de la query: los empleados, el estado de loading, el error y la función para recargar los empleados
  return {
    employees: error ? [] : (employees ?? []), // si la query falla al recargar, descarta los datos cacheados y muestra vacío
    isLoading: employees === undefined && isLoading,
    error: error ? getErrorMessage(error) : null,
    fetchEmployees: () => fetchEmployees(),
    isFetching
  };
};