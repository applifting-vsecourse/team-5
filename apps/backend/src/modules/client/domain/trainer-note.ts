export type TrainerNoteDog = {
  id: string;
  name: string;
  color: number;
};

export type TrainerNote = {
  id: string;
  trainerId: string;
  clientId: string;
  dogId: string | null;
  dog: TrainerNoteDog | null;
  date: Date;
  title: string;
  text: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTrainerNoteData = {
  date?: string;
  dogId?: string | null;
  title: string;
  text: string;
  isPinned?: boolean;
};

export type UpdateTrainerNoteData = {
  date?: string;
  dogId?: string | null;
  title?: string;
  text?: string;
  isPinned?: boolean;
};
