// Lee el "exp" del JWT para no arrancar con un token ya vencido
export function isTokenExpired(token: string): boolean {
  try {
    // Parsea el payload del token
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    // Verifica si el token está expirado
    // payload.exp se multiplica por 1000 porque está en segundos y Date.now() está en milisegundos
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    // Si el token está expirado, retorna true
    return true; // token ilegible: se trata como inválido
  }
}