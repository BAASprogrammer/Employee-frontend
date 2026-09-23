import React from 'react';
import { Timer } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Umbral: se avisa a partir de los últimos 5 minutos de sesión
const WARNING_THRESHOLD_MS = 5 * 60 * 1000;

// Formatea los ms restantes como "Xm Ys" (o "menos de Ys" por debajo del minuto)
const formatRemaining = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 1) return `~${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  return `menos de ${seconds}s`;
};

// Aviso proactivo de expiración de sesión. La sesión la cierra el AuthProvider a
// nivel de timer (y el 401 del backend como respaldo); este componente solo
// informa antes de que venza, para que el usuario guarde su trabajo a tiempo.
export const SessionWarning: React.FC = () => {
  const { sessionRemainingMs } = useAuth();

  if (sessionRemainingMs === null || sessionRemainingMs > WARNING_THRESHOLD_MS) return null;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs"
      role="status"
    >
      <Timer size={14} className="shrink-0" />
      <span>
        Tu sesión expira en {formatRemaining(sessionRemainingMs)}. Guarda tus cambios; al vencer se cerrará la sesión.
      </span>
    </div>
  );
};