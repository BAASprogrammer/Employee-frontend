import type { User } from './auth';

// Interface que define las propiedades de la barra lateral
export interface SidebarProps {
  user: User | null;
  employeeCount: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}