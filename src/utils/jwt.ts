// Devuelve el instante de expiración del JWT en epoch ms (null si no tiene exp)
export function getTokenExpiry(token: string): number | null {
  try {
    // Parsea el payload del token
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    // payload.exp viene en segundos y acá se devuelve en milisegundos
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null; // token ilegible
  }
}

// Lee el "exp" del JWT para no arrancar con un token ya vencido
export function isTokenExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);
  return expiry === null || expiry <= Date.now();
}