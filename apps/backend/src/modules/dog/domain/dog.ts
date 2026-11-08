export type Dog = {
  id: string;
  name: string;
  breed?: string | null;
  birthDate?: string | null;
  weightKg?: number | null;
  trainers?: { id: string; name: string }[];
  color: number;
  photoUrl?: string | null;
  ownerId: string;
  isArchived: boolean;
  disciplines?: string[];
  createdAt: Date;
  updatedAt: Date;
};
