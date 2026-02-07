export interface Sala {
  id: string;
  nombre: string;
  capacidad: number;
  ubicacion: string;
  disponible: boolean;
  image?: string;
}

export interface Reserva {
  id: string;
  salaId: string;
  usuario: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  proposito: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'usuario' | 'admin';
}