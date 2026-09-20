import { useQuery } from '@tanstack/react-query';
import { api, getErrorMessage } from '../api/axiosInstance';
import type { Employee } from '../types/employee';
import type { UseEmployeesResult } from '../types/useEmployees';

export const useEmployees = (): UseEmployeesResult => {
  // Custom hook para manejar la recuperación de datos de la API
  const { data: employees, isLoading, error, isFetching, refetch: fetchEmployees } = useQuery({
    queryKey: ['employees'], // Clave única para identificar la query
    queryFn: ({ signal }) => api.get<Employee[]>('/api/employee', { signal }).then((res) => res.data), // Función que se ejecuta cuando se necesita obtener los datos
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