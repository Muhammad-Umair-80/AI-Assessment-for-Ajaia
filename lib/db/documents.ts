import { getSupabaseClient } from '../supabase/client';
import { Document, DocumentContent, DocumentShare } from '../types/database';

const DEFAULT_DOC_CONTENT: DocumentContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

/**
 * Fetch all documents owned by a specific user.
 */
export async function getOwnedDocuments(userId: string): Promise<Document[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch owned documents: ${error.message}`);
  }
  return data || [];
}

/**
 * Fetch all documents shared with a specific user.
 */
export async function getSharedDocuments(userId: string): Promise<Document[]> {
  const supabase = getSupabaseClient();

  // First fetch share records for the user
  const { data: shares, error: shareError } = await supabase
    .from('document_shares')
    .select('document_id')
    .eq('user_id', userId);

  if (shareError) {
    throw new Error(`Failed to fetch shared document IDs: ${shareError.message}`);
  }

  if (!shares || shares.length === 0) {
    return [];
  }

  const docIds = shares.map((s) => s.document_id);

  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('*')
    .in('id', docIds)
    .order('updated_at', { ascending: false });

  if (docError) {
    throw new Error(`Failed to fetch shared documents: ${docError.message}`);
  }

  return documents || [];
}

/**
 * Fetch a single document by ID with permission checks.
 */
export async function getDocument(documentId: string, userId: string): Promise<Document> {
  const supabase = getSupabaseClient();

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error || !doc) {
    throw new Error('Document not found');
  }

  // Permission check: Owner access
  if (doc.owner_id === userId) {
    return doc;
  }

  // Permission check: Explicit share access
  const { data: share } = await supabase
    .from('document_shares')
    .select('id')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!share) {
    throw new Error('Access denied: You do not have permission to view this document.');
  }

  return doc;
}

/**
 * Create a new document.
 */
export async function createDocument(
  title: string,
  ownerId: string,
  content: DocumentContent = DEFAULT_DOC_CONTENT
): Promise<Document> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('documents')
    .insert([
      {
        title: title.trim() || 'Untitled Document',
        owner_id: ownerId,
        content,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create document: ${error.message}`);
  }

  return data;
}

/**
 * Update a document's title and/or content.
 */
export async function updateDocument(
  documentId: string,
  userId: string,
  updates: { title?: string; content?: DocumentContent }
): Promise<Document> {
  // Ensure user has access first
  const existingDoc = await getDocument(documentId, userId);

  const supabase = getSupabaseClient();
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) {
    updateData.title = updates.title.trim() || 'Untitled Document';
  }
  if (updates.content !== undefined) {
    updateData.content = updates.content;
  }

  const { data, error } = await supabase
    .from('documents')
    .update(updateData)
    .eq('id', existingDoc.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update document: ${error.message}`);
  }

  return data;
}

/**
 * Share a document with another user.
 */
export async function shareDocument(
  documentId: string,
  ownerId: string,
  targetUserId: string
): Promise<DocumentShare> {
  if (ownerId === targetUserId) {
    throw new Error('Cannot share a document with yourself.');
  }

  const supabase = getSupabaseClient();

  // Rule: Only document owner can create a share
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('owner_id')
    .eq('id', documentId)
    .single();

  if (docError || !doc) {
    throw new Error('Document not found.');
  }

  if (doc.owner_id !== ownerId) {
    throw new Error('Only the document owner can share this document.');
  }

  // Rule: Duplicate shares must be rejected
  const { data: existingShare } = await supabase
    .from('document_shares')
    .select('id')
    .eq('document_id', documentId)
    .eq('user_id', targetUserId)
    .maybeSingle();

  if (existingShare) {
    throw new Error('Document is already shared with this user.');
  }

  const { data: newShare, error: shareError } = await supabase
    .from('document_shares')
    .insert([
      {
        document_id: documentId,
        user_id: targetUserId,
      },
    ])
    .select()
    .single();

  if (shareError) {
    throw new Error(`Failed to share document: ${shareError.message}`);
  }

  return newShare;
}

/**
 * Get all user shares for a specific document.
 */
export async function getDocumentShares(documentId: string): Promise<DocumentShare[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('document_shares')
    .select('*')
    .eq('document_id', documentId);

  if (error) {
    throw new Error(`Failed to fetch document shares: ${error.message}`);
  }

  return data || [];
}
