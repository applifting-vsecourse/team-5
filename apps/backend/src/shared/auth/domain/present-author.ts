export type Author = { id: string; name: string };

export function presentAuthor(author: Author | null): {
  id: string | null;
  name: string;
} {
  return author ?? { id: null, name: 'smazaný uživatel' };
}
