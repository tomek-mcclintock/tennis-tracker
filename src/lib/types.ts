// src/lib/types.ts

export type NoteCategory = 'currentFocus' | 'toWorkOn' | 'mastered';

export interface Note {
  id: string;
  text: string;
  date: string;
  category: NoteCategory;
  shot_type: string;
  shot_category: string;
  user_id: string;
}

export interface NotesGroup {
  currentFocus: Note[];
  toWorkOn: Note[];
  mastered: Note[];
}

export interface NotesState {
  [key: string]: NotesGroup;
}