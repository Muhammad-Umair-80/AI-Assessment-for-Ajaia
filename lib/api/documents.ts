import { Document, DocumentContent, DocumentShare } from '../types/database';

export async function fetchOwnedDocuments(userId: string): Promise<Document[]> {
  const res = await fetch(`/api/documents?userId=${encodeURIComponent(userId)}&type=owned`, {
    cache: 'no-store',
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch owned documents.');
  }

  return data.documents || [];
}

export async function fetchSharedDocuments(userId: string): Promise<Document[]> {
  const res = await fetch(`/api/documents?userId=${encodeURIComponent(userId)}&type=shared`, {
    cache: 'no-store',
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch shared documents.');
  }

  return data.documents || [];
}

export async function fetchDocument(documentId: string, userId: string): Promise<Document> {
  const res = await fetch(`/api/documents/${encodeURIComponent(documentId)}?userId=${encodeURIComponent(userId)}`, {
    cache: 'no-store',
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch document.');
  }

  return data.document;
}

export async function createNewDocument(
  title: string,
  ownerId: string,
  content?: DocumentContent
): Promise<Document> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[API Client Diagnostics] 3. Payload sent to POST /api/documents:', { title, ownerId, content });
  }

  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      ownerId,
      content,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to create document.');
  }

  return data.document;
}

export async function saveDocument(
  documentId: string,
  userId: string,
  updates: { title?: string; content?: DocumentContent }
): Promise<Document> {
  const res = await fetch(`/api/documents/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      ...updates,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to save document.');
  }

  return data.document;
}

export async function shareDocumentWithUser(
  documentId: string,
  ownerId: string,
  targetUserId: string
): Promise<DocumentShare> {
  const res = await fetch(`/api/documents/${encodeURIComponent(documentId)}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ownerId,
      targetUserId,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to share document.');
  }

  return data.share;
}
