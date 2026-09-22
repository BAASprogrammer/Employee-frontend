import { describe, expect, it } from 'vitest';
import { getNextPollInterval, STATUS_MAX_WAIT_MS, STATUS_POLLING_MS } from './report';

const HALF = STATUS_MAX_WAIT_MS / 2;
const BACKOFF = STATUS_POLLING_MS * 2;

describe('getNextPollInterval (polling del reporte, 4.b)', () => {
  // Verifica que el polling se ejecute cada 2s cuando el job lleva menos de la mitad del deadline
  it('consulta cada 2s cuando el job lleva menos de la mitad del deadline', () => {
    expect(getNextPollInterval(0)).toBe(STATUS_POLLING_MS);
    expect(getNextPollInterval(HALF - 1)).toBe(STATUS_POLLING_MS);
  });

  // Verifica que el backoff se aplique una vez pasada la mitad del deadline
  it('aplica backoff de 4s una vez pasada la mitad del deadline', () => {
    expect(getNextPollInterval(HALF)).toBe(BACKOFF);
    // Un poll de 4s que entra justo en el tope (10000 + 4000) se programa
    expect(getNextPollInterval(STATUS_MAX_WAIT_MS - BACKOFF)).toBe(BACKOFF);
  });

  // Verifica que el polling se detenga al alcanzar el deadline
  it('corta el polling al alcanzar el deadline (job que nunca completa)', () => {
    expect(getNextPollInterval(STATUS_MAX_WAIT_MS)).toBe(false);
    expect(getNextPollInterval(STATUS_MAX_WAIT_MS + 60_000)).toBe(false);
  });

  // Verifica que el backoff no exceda el tiempo restante del tope
  it('el backoff nunca programa un poll que excede el tiempo restante del tope', () => {
    // No queda margen para un poll de 4s: el deadline prevalece sobre el escalón
    expect(getNextPollInterval(STATUS_MAX_WAIT_MS - BACKOFF + 1)).toBe(false);
  });
});