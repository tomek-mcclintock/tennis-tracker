export interface Note {
    id: string;
    text: string;
    date: string;
    category: 'currentFocus' | 'toWorkOn' | 'mastered';
    shot_type: string;
    shot_category: string;
    user_id: string;
  }
  
  export interface NotesState {
    [key: string]: {
      currentFocus: Note[];
      toWorkOn: Note[];
      mastered: Note[];
    };
  }