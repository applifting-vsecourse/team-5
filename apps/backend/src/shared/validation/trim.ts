import { Transform } from 'class-transformer';

// Trims a string before validation, so "   " fails @IsNotEmpty() instead of
// being stored as an empty title. Needs ValidationPipe({ transform: true }).
export const Trim = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
