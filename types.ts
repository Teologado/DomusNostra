export interface Space {
  id: string;
  name: string;
  capacity: number;
  features: string[];
  image: string;
  description: string;
}

export interface Reservation {
  id: string;
  full_name: string;
  space_id: string;
  space_name: string;
  reason: string;
  date: string; // ISO String YYYY-MM-DD
  time: string;
  duration: string;
  created_at: number;
  status: 'pending' | 'confirmed' | 'rejected';
  user_email?: string;
}

export type UserRole = 'user' | 'admin' | 'moderator';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface AppConfig {
  id: number;
  app_name: string;
  primary_color: string;
  icon_url: string;
}