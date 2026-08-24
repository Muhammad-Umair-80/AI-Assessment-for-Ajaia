import { NextRequest, NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/db/documents';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const serverClient = getSupabaseServerClient();
    const document = await getDocument(documentId, userId, serverClient);

    if (process.env.NODE_ENV === 'development') {
      console.log('[API Server Diagnostics] 6. JSON returned by GET document API:', document);
    }

    return NextResponse.json({ document });
  } catch (error: any) {
    const status = error?.message?.includes('Access denied') ? 403 : error?.message?.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: error?.message || 'Failed to fetch document' }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const body = await request.json();
    const { userId, title, content } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const serverClient = getSupabaseServerClient();
    const document = await updateDocument(documentId, userId, { title, content }, serverClient);
    return NextResponse.json({ document });
  } catch (error: any) {
    const status = error?.message?.includes('Access denied') ? 403 : 500;
    return NextResponse.json({ error: error?.message || 'Failed to update document' }, { status });
  }
}
