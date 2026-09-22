import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useClientPagination } from './useClientPagination';

// Tests de la paginación genérica en el cliente (estrategia 4.a)
describe('useClientPagination', () => {
  const items = Array.from({ length: 45 }, (_, i) => i);

  it('muestra los primeros pageSize ítems en la página 1', () => {
    const { result } = renderHook(() => useClientPagination(items, 15));
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalItems).toBe(45);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.currentPageItems).toHaveLength(15);
    expect(result.current.currentPageItems[0]).toBe(0);
  });

  it('cambia de página y muestra el slice correspondiente', () => {
    const { result } = renderHook(() => useClientPagination(items, 15));
    act(() => result.current.setCurrentPage(2));
    expect(result.current.currentPage).toBe(2);
    expect(result.current.currentPageItems).toHaveLength(15);
    expect(result.current.currentPageItems[0]).toBe(15);
  });

  it('retrocede a la última página válida si se achica el dataset', () => {
    const { result, rerender } = renderHook(
      ({ list }) => useClientPagination(list, 15),
      { initialProps: { list: items } }
    );
    // Página 3 (la última de 45 ítems)
    act(() => result.current.setCurrentPage(3));
    // El dataset se achica a 20 ítems (equivalente a borrar registros)
    act(() => rerender({ list: Array.from({ length: 20 }, (_, i) => i) }));
    // Debería quedar en la página 2 con los 5 ítems restantes
    expect(result.current.currentPage).toBe(2);
    expect(result.current.currentPageItems).toHaveLength(5);
    expect(result.current.totalPages).toBe(2);
  });

  it('no rompe con una lista vacía (totalPages = 1)', () => {
    const { result } = renderHook(() => useClientPagination([], 15));
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.currentPageItems).toHaveLength(0);
  });
});