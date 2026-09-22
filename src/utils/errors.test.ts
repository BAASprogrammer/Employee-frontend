import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { getErrorMessage, getReportErrorMessage } from './errors';

const makeHttpError = (status: number): AxiosError =>
  new AxiosError(
    'Request failed',
    undefined,
    {} as AxiosError['config'],
    undefined,
    { status, statusText: '', data: {}, headers: {}, config: {} as NonNullable<AxiosError['config']> },
  );

// Error de red: axios lanza sin response (no hubo respuesta del servidor)
const makeNetworkError = (): AxiosError =>
  new AxiosError('Network Error', undefined, {} as AxiosError['config']);

// Timeout: axios marca el code ECONNABORTED en lugar de un status http
const makeTimeoutError = (): AxiosError =>
  new AxiosError('timeout of 5000ms exceeded', 'ECONNABORTED', {} as AxiosError['config']);

describe('getErrorMessage', () => {
  // Verifica que los errores HTTP se mapeen a mensajes legibles
  it('mapea los códigos HTTP a mensajes legibles', () => {
    expect(getErrorMessage(makeHttpError(401))).toBe('Usuario o contraseña incorrectos, o la sesión expiró');
    expect(getErrorMessage(makeHttpError(403))).toBe('No tienes permiso para realizar esta acción');
    expect(getErrorMessage(makeHttpError(404))).toBe('No se encontraron resultados');
  });
  // Verifica que los errores HTTP no contemplados se muestren con su status
  it('muestra el status para errores HTTP no contemplados', () => {
    expect(getErrorMessage(makeHttpError(500))).toBe('Ocurrió un error inesperado (500)');
    expect(getErrorMessage(makeHttpError(503))).toBe('Ocurrió un error inesperado (503)');
  });
  // Verifica que el timeout se distinga del fallo de red
  it('distingue timeout (ECONNABORTED) de fallo de red sin respuesta', () => {
    expect(getErrorMessage(makeTimeoutError())).toBe('El servidor tardó demasiado en responder');
    expect(getErrorMessage(makeNetworkError())).toBe('Error de conexión');
  });
  // Verifica que los errores que no son de axios se muestren con el mensaje genérico
  it('responde con el mensaje genérico ante errores que no son de axios', () => {
    expect(getErrorMessage(new Error('cualquiera'))).toBe('Ocurrió un error inesperado');
    expect(getErrorMessage(null)).toBe('Ocurrió un error inesperado');
  });
});

describe('getReportErrorMessage', () => {
  // Verifica que el 404 del job tenga semántica propia: no es "no se encontraron resultados"
  it('un 404 del job tiene semántica propia: no es "no se encontraron resultados"', () => {
    // En el reporte, 404 = el job en memoria ya no existe (ej. la API se reinició)
    expect(getReportErrorMessage(makeHttpError(404))).toBe('El reporte ya no está disponible: Reintenta la generación.');
  });
  // Verifica que cualquier otro error del reporte cae en el mapeo genérico
  it('cualquier otro error del reporte cae en el mapeo genérico', () => {
    expect(getReportErrorMessage(makeHttpError(500))).toBe('Ocurrió un error inesperado (500)');
    expect(getReportErrorMessage(makeNetworkError())).toBe('Error de conexión');
  });
});