export interface Admin {
  userId: number;
  name: string;
  role: 'super-admin' | 'admin';
  cities: string[];
}
