export interface ClientDog {
  id: string;
  name: string;
  color: number;
  breed?: string | null;
  disciplines?: string[];
  photoUrl?: string | null;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  dogs: ClientDog[];
  createdAt: Date;
}

export interface Invitation {
  id: string;
  code: string;
  trainerId: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}
