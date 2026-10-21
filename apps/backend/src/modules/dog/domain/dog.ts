export type Dog = {
  id: string;
  name: string;
  breed?: string | null;
  color: number;
  ownerId: string;
  isArchived: boolean;
  disciplines?: string[];
  createdAt: Date;
  updatedAt: Date;
};
