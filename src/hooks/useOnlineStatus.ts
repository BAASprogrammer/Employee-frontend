import { useEffect, useState } from 'react';
import { onlineManager } from '@tanstack/react-query';

// Estado de red global. Sin internet TanStack no falla sino que pausa las
// peticiones (fetchStatus 'paused'); este hook expone el flag para que la UI
// muestre un aviso explícito
export const useOnlineStatus = (): boolean => {
  // Hook personalizado para manejar el estado de red
  const [isOnline, setIsOnline] = useState<boolean>(onlineManager.isOnline());
  useEffect(() => onlineManager.subscribe(setIsOnline), []);
  return isOnline;
};