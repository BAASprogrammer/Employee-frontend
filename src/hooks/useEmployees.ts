import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { api, getErrorMessage } from '../api/axiosInstance';
import type { Employee } from '../types/employee';
import type { UseEmployeesResult } from '../types/useEmployees';

export const useEmployees = (): UseEmployeesResult => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // AbortController para cancelar la petición si el componente se desmonta
    const controller = new AbortController();
    // Loading en true
    setIsLoading(true);
    // Error en null
    setError(null);

    // GET /api/employee SIN page/pageSize
    api.get<Employee[]>('/api/employee', {
      signal: controller.signal,
    })
      //Setear todos los empleados, sin paginación
      .then(({ data }) => setEmployees(data))
      //Si hay un error, setear los empleados a un array vacío y mostrar el error
      .catch((err) => {
        // Petición cancelada: no es un error
        if (axios.isCancel(err)) return;
        setEmployees([]);
        // Traduce cualquier error a un mensaje para mostrar en la UI
        setError(getErrorMessage(err));
      })
      //Siempre ejecutar finally
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    // Cleanup: aborta la petición si el componente se desmonta
    return () => controller.abort();
  }, [reloadKey]);

  // Función para recargar los empleados
  const fetchEmployees = useCallback(() => setReloadKey((key) => key + 1), []);

  // Retorna los empleados, el estado de loading, el error y la función para recargar los empleados
  return { employees, isLoading, error, fetchEmployees };
};