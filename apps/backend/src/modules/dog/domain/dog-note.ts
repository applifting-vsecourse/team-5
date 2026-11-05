import { DogNote as PrismaDogNote } from '@/generated/prisma/client';

export type DogNote = PrismaDogNote;

export type CreateDogNoteData = {
  date?: string;
  title: string;
  text: string;
};

export type UpdateDogNoteData = {
  date?: string;
  title?: string;
  text?: string;
};
