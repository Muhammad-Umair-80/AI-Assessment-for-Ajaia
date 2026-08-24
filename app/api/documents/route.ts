import { NextRequest, NextResponse } from 'next/server';
import { createDocument, getOwnedDocuments, getSharedDocuments } from '@/lib/db/documents';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'owned';

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const serverClient = getSupabaseServerClient();

    if (type === 'shared') {
      const documents = await getSharedDocuments(userId, serverClient);
      return NextResponse.json({ documents });
    }

    const documents = await getOwnedDocuments(userId, serverClient);
    return NextResponse.json({ documents });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, ownerId, content } = body;

    if (process.env.NODE_ENV === 'development') {
      console.log('[API Server Diagnostics] 4. JSON received by POST /api/documents:', body);
    }

    if (!ownerId) {
      return NextResponse.json({ error: 'Missing ownerId parameter' }, { status: 400 });
    }

    const serverClient = getSupabaseServerClient();
    const document = await createDocument(title || 'Untitled Document', ownerId, content, serverClient);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create document' }, { status: 500 });
  }
}
