// src/app/api/notes/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Note } from '@/lib/types';

export async function GET(_request: Request) {  // Add underscore to indicate unused param
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return new NextResponse('Error fetching notes', { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const notes = await request.json();
    
    const { error } = await supabase
      .from('notes')
      .upsert(notes.map((note: Note) => ({  // Use Note type instead of any
        ...note,
        user_id: session.user.id
      })));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return new NextResponse('Error saving notes', { status: 500 });
  }
}