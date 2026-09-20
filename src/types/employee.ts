// Interface que define la estructura de un empleado
export interface Employee {
  id?: number | string;
  name: string;
  email: string;
  dni: string;
  department: string;
  position: string;
}