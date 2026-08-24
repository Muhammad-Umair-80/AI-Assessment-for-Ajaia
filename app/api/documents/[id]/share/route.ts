import { NextRequest, NextResponse } from 'next/server';
import { shareDocument } from '@/lib/db/documents';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const body = await request.json();
    const { ownerId, targetUserId } = body;

    if (!ownerId || !targetUserId) {
      return NextResponse.json(
        { error: 'Missing ownerId or targetUserId parameter' },
        { status: 400 }
      );
    }

    const serverClient = getSupabaseServerClient();
    const share = await shareDocument(documentId, ownerId, targetUserId, serverClient);

    return NextResponse.json({ share }, { status: 201 });
  } catch (error: any) {
    const message = error?.message || 'Failed to share document.';
    const isDuplicate = message.includes('already shared');
    const isSelfShare = message.includes('with yourself');
    const isNonOwner = message.includes('only the document owner');

    const status = isDuplicate ? 409 : isSelfShare || isNonOwner ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
