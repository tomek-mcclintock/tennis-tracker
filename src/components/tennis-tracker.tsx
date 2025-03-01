"use client"

import React, { useState, useEffect } from 'react';
import { useAuth, SignOutButton } from '@clerk/nextjs';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, X, Check, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NotesState, Note, NoteCategory } from '@/lib/types';

const SHOT_STRUCTURE = {
  forehand: {
    name: 'Forehand',
    types: ['Baseline', 'Approach', 'Volley', 'Dropshot']
  },
  backhand: {
    name: 'Backhand',
    types: ['Baseline', 'Approach', 'Volley', 'Dropshot']
  },
  serve: {
    name: 'Serve',
    types: ['Flat', 'Slice', 'Kick', 'Second']
  }
} as const;

const TennisTracker = () => {
  const { isSignedIn, userId } = useAuth();
  const [activeShot, setActiveShot] = useState('forehand');
  const [activeShotType, setActiveShotType] = useState('Baseline');
  const [notes, setNotes] = useState<NotesState>({});
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true);
      try {
        if (isSignedIn && userId) {
          const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
  
          if (error) {
            console.error('Error fetching notes:', error);
            return;
          }
  
          const transformedNotes: NotesState = {};
          data.forEach((note: Note) => {
            const key = `${note.shot_category}-${note.shot_type}`;
            if (!transformedNotes[key]) {
              transformedNotes[key] = {
                currentFocus: [],
                toWorkOn: [],
                mastered: []
              };
            }
            transformedNotes[key][note.category].push(note);
          });
  
          setNotes(transformedNotes);
        } else {
          const localNotes = localStorage.getItem('tennis-notes');
          if (localNotes) {
            setNotes(JSON.parse(localNotes));
          }
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadNotes();
  }, [isSignedIn, userId]);
  


  const saveNotes = async (newNotes: NotesState) => {
    if (isSignedIn && userId) {
      setNotes(newNotes);
    } else {
      localStorage.setItem('tennis-notes', JSON.stringify(newNotes));
      setNotes(newNotes);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
  
    const key = `${activeShot}-${activeShotType}`;
    const noteData = {
      text: newNote,
      date: new Date().toISOString(),
      category: 'toWorkOn' as const,
      shot_category: activeShot,
      shot_type: activeShotType,
      user_id: userId || 'local' // Provide a default value for local storage
    };
  
    if (isSignedIn && userId) {
      try {
        const { data, error } = await supabase
          .from('notes')
          .insert([noteData])
          .select();
  
        if (error) {
          console.error('Error saving note:', error);
          return;
        }
  
        const updatedNotes = { ...notes };
        if (!updatedNotes[key]) {
          updatedNotes[key] = {
            currentFocus: [],
            toWorkOn: [],
            mastered: []
          };
        }
        if (data && data[0]) {
          updatedNotes[key].toWorkOn.push(data[0]);
        }
        await saveNotes(updatedNotes);
        setNewNote('');
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
      const localNoteData: Note = {  // Explicitly type as Note
        id: crypto.randomUUID(),
        text: newNote,
        date: new Date().toISOString(),
        category: 'toWorkOn',
        shot_category: activeShot,
        shot_type: activeShotType,
        user_id: 'local'  // Use a constant string for local storage
      };
  
      const updatedNotes = { ...notes };
      if (!updatedNotes[key]) {
        updatedNotes[key] = {
          currentFocus: [],
          toWorkOn: [],
          mastered: []
        };
      }
      updatedNotes[key].toWorkOn.push(localNoteData);
      await saveNotes(updatedNotes);
      setNewNote('');
    }
  };
  

  const moveNote = async (noteId: string, from: NoteCategory, to: NoteCategory) => {
    const key = `${activeShot}-${activeShotType}`;
    
    if (!notes[key]) {
      return;
    }

    const noteToMove = notes[key][from].find(n => n.id === noteId);
    
    if (!noteToMove) return;

    if (isSignedIn && userId) {
      const { error } = await supabase
        .from('notes')
        .update({ category: to })
        .eq('id', noteId);

      if (error) {
        console.error('Error moving note:', error);
        return;
      }
    }

    const updatedNotes = { ...notes };
    updatedNotes[key][from] = updatedNotes[key][from].filter(n => n.id !== noteId);
    updatedNotes[key][to] = [...updatedNotes[key][to], { ...noteToMove, category: to }];
    
    await saveNotes(updatedNotes);
  };

  const deleteNote = async (noteId: string, category: NoteCategory) => {
    const key = `${activeShot}-${activeShotType}`;
    
    if (!notes[key]) {
      return;
    }

    if (isSignedIn && userId) {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        console.error('Error deleting note:', error);
        return;
      }
    }

    const updatedNotes = { ...notes };
    updatedNotes[key][category] = updatedNotes[key][category].filter(n => n.id !== noteId);
    await saveNotes(updatedNotes);
  };

  const saveEdit = async (noteId: string, category: NoteCategory) => {
    const key = `${activeShot}-${activeShotType}`;
    
    if (!notes[key]) {
      return;
    }

    const updatedNotes = { ...notes };
    const noteIndex = updatedNotes[key][category].findIndex(n => n.id === noteId);
    
    if (noteIndex === -1) return;

    if (isSignedIn && userId) {
      const { error } = await supabase
        .from('notes')
        .update({ text: editText })
        .eq('id', noteId);

      if (error) {
        console.error('Error updating note:', error);
        return;
      }
    }

    updatedNotes[key][category][noteIndex] = {
      ...updatedNotes[key][category][noteIndex],
      text: editText
    };
    
    await saveNotes(updatedNotes);
    setEditingNote(null);
    setEditText('');
  };

  const renderNote = (note: Note, category: NoteCategory) => (
    <Card key={note.id} className="mb-3 overflow-hidden">
      <CardContent className="p-0">
        {editingNote === note.id ? (
          <div className="p-3 space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditingNote(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => saveEdit(note.id, category)}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setEditingNote(note.id);
                  setEditText(note.text);
                }}
                className="h-7 w-7 p-0"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => deleteNote(note.id, category)}
                className="h-7 w-7 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              {category === 'toWorkOn' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => moveNote(note.id, 'toWorkOn', 'currentFocus')}
                  className="h-7 px-2 text-xs"
                >
                  Focus <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
              {category === 'currentFocus' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => moveNote(note.id, 'currentFocus', 'mastered')}
                  className="h-7 px-2 text-xs"
                >
                  Master <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
              {category === 'mastered' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => moveNote(note.id, 'mastered', 'toWorkOn')}
                  className="h-7 px-2 text-xs"
                >
                  Revise <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
            <div className="p-3 pr-24"> {/* Add right padding to prevent text from going under buttons */}
              <p className="text-sm leading-relaxed">{note.text}</p>
              <span className="text-xs text-muted-foreground mt-1 block">
                {new Date(note.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {isSignedIn && (
        <div className="container max-w-2xl mx-auto px-4 py-4 flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <SignOutButton />
          </Button>
        </div>
      )}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-4">
          <Tabs value={activeShot} onValueChange={setActiveShot} className="w-full">
            <TabsList className="w-full h-auto flex mb-2 bg-muted/50 p-1 gap-1">
              {Object.entries(SHOT_STRUCTURE).map(([key, { name }]) => (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="flex-1 py-2"
                >
                  {name}
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(SHOT_STRUCTURE).map(([key, { types }]) => (
              <TabsContent key={key} value={key}>
                <Tabs value={activeShotType} onValueChange={setActiveShotType} className="w-full">
                  <TabsList className="w-full h-auto flex mb-2 bg-muted/50 p-1 gap-1">
                    {types.map(type => (
                      <TabsTrigger 
                        key={type} 
                        value={type}
                        className="flex-1 py-2"
                      >
                        {type}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </TabsContent>
            ))}
          </Tabs>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <Textarea
                  placeholder="Add a new note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="mb-2 min-h-[100px]"
                />
                <Button 
                  onClick={addNote}
                  className="w-full"
                >
                  Add Note
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {(['currentFocus', 'toWorkOn', 'mastered'] as const).map(category => (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3 px-1">
                    {category === 'currentFocus' ? 'Current Focus' : 
                     category === 'toWorkOn' ? 'To Work On' : 
                     'Mastered'}
                  </h3>
                  <div>
                    {notes[`${activeShot}-${activeShotType}`]?.[category]?.map(note => 
                      renderNote(note, category)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { TennisTracker };