// Array de colores para los avatares
export const AVATAR_COLORS = [
  'bg-blue-600', 'bg-indigo-600', 'bg-violet-600', 'bg-pink-600',
  'bg-rose-600', 'bg-amber-600', 'bg-emerald-600', 'bg-teal-600',
];

// Obtiene las iniciales del nombre
export const getInitials = (name: string): string => {
  // Divide el nombre en partes, elimina los espacios en blanco y toma las iniciales del primer y último nombre
  const parts = name.trim().split(' ').filter(Boolean);
  // Si el nombre tiene dos o más partes, toma las iniciales del primer y último nombre
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  // Si el nombre tiene menos de dos partes, toma las dos primeras letras del nombre
  return name.slice(0, 2).toUpperCase();
};

// Obtiene el color del avatar
export const getAvatarColor = (name: string): string => {
  // Calcula el hash del nombre
  let hash = 0;
  // Itera sobre el nombre y calcula el hash
  // hash << 5 es un desplazamiento de bits a la izquierda, lo que equivale a multiplicar por 32
  // luego se resta el hash original, esta operacion se repite para cada caracter del nombre
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  // Retorna el color del avatar, Math.abs(hash) % AVATAR_COLORS.length calcula el residuo de la división
  // del valor absoluto del hash por el número de colores, asegurando que el resultado sea un índice válido
  // para el array de colores
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};