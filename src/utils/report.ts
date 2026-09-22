// Intervalo inicial de polling del estado del reporte (ms)
export const STATUS_POLLING_MS = 2000;
// Deadline global: si el job no completa en este tiempo, se abandona el polling.
// 20 s deja ~2.5x de holgura sobre el ~8 s que tarda el job real, y el cap solo
// resguarda los casos donde el job nunca termina.
export const STATUS_MAX_WAIT_MS = 20_000;

// Decide el intervalo del próximo poll en función del tiempo transcurrido desde
// la creación del job. Devuelve false para detener el polling (deadline cumplido
// o sin margen para la próxima consulta).
// Backoff acotado por el deadline: 2 s hasta la mitad, 4 s después.
export function getNextPollInterval(elapsedMs: number): number | false {
  if (elapsedMs >= STATUS_MAX_WAIT_MS) return false; // Si el tiempo transcurrido es mayor o igual al deadline, se detiene el polling
  if (elapsedMs < STATUS_MAX_WAIT_MS / 2) return STATUS_POLLING_MS; // Si el tiempo transcurrido es menor a la mitad del deadline, se consulta cada 2 segundos
  if (elapsedMs + STATUS_POLLING_MS * 2 > STATUS_MAX_WAIT_MS) return false; // Si el tiempo transcurrido más el doble del intervalo de polling excede el deadline, se detiene el polling
  return STATUS_POLLING_MS * 2; // Si el tiempo transcurrido es mayor o igual a la mitad del deadline, se consulta cada 4 segundos
}