// src/lib/storage.ts
import { NotesState } from './types';

export const getLocalNotes = (): NotesState => {
  if (typeof window === 'undefined') return {};
  const notes = localStorage.getItem('tennis-notes');
  return notes ? JSON.parse(notes) : {};
};

export const saveLocalNotes = (notes: NotesState) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tennis-notes', JSON.stringify(notes));
};
