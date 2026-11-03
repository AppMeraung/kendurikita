export type Note = { id: string; title: string; body: string; createdAt: string };

export function addNote(notes: Note[], input: { title: string; body: string }, now: Date, id: string): Note[] {
  const title = input.title.trim();
  if (!title) throw new Error("Note title is required");
  return [{ id, title, body: input.body.trim(), createdAt: now.toISOString() }, ...notes];
}

export const removeNote = (notes: Note[], id: string) => notes.filter((note) => note.id !== id);

export function filterNotes(notes: Note[], query: string) {
  const q = query.trim().toLowerCase();
  return q ? notes.filter((note) => `${note.title} ${note.body}`.toLowerCase().includes(q)) : notes;
}

const isNote = (value: unknown): value is Note =>
  !!value && typeof value === "object" && ["id", "title", "body", "createdAt"].every((key) => typeof (value as Record<string, unknown>)[key] === "string");

export function parseNotes(raw: string | null): Note[] {
  try {
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter(isNote) : [];
  } catch {
    return [];
  }
}
