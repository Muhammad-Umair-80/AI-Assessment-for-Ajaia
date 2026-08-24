import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOwnedDocuments,
  getSharedDocuments,
  getDocument,
  createDocument,
  updateDocument,
  shareDocument,
  getDocumentShares,
} from '../lib/db/documents';
import * as clientModule from '../lib/supabase/client';
import * as serverModule from '../lib/supabase/server';

// Seed User IDs
const USER_ALEX = '00000000-0000-0000-0000-000000000001';
const USER_SAM = '00000000-0000-0000-0000-000000000002';
const USER_THIRD = '00000000-0000-0000-0000-000000000003';

describe('Phase 2 Document Persistence Layer & Business Rules', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    };
    vi.spyOn(clientModule, 'getSupabaseClient').mockReturnValue(mockSupabase);
    vi.spyOn(serverModule, 'getSupabaseServerClient').mockReturnValue(mockSupabase);
  });

  it('1. Owner can access their document', async () => {
    const docData = {
      id: 'doc-1',
      title: 'Alex Doc',
      owner_id: USER_ALEX,
      content: { type: 'doc', content: [] },
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: docData, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const doc = await getDocument('doc-1', USER_ALEX);
    expect(doc).toEqual(docData);
  });

  it('2. Shared user can access a shared document', async () => {
    const docData = {
      id: 'doc-1',
      title: 'Shared Doc',
      owner_id: USER_ALEX,
      content: { type: 'doc', content: [] },
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: docData, error: null }),
            }),
          }),
        };
      }
      if (table === 'document_shares') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: 'share-1' }, error: null }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const doc = await getDocument('doc-1', USER_SAM);
    expect(doc).toEqual(docData);
  });

  it('3. Unrelated user cannot access the document', async () => {
    const docData = {
      id: 'doc-1',
      title: 'Private Doc',
      owner_id: USER_ALEX,
      content: { type: 'doc', content: [] },
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: docData, error: null }),
            }),
          }),
        };
      }
      if (table === 'document_shares') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    await expect(getDocument('doc-1', USER_THIRD)).rejects.toThrow(
      'Access denied: You do not have permission to view this document.'
    );
  });

  it('4. Non-owner cannot share a document', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { owner_id: USER_ALEX }, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    await expect(shareDocument('doc-1', USER_SAM, USER_THIRD)).rejects.toThrow(
      'Only the document owner can share this document.'
    );
  });

  it('5. Owner cannot share with themselves', async () => {
    await expect(shareDocument('doc-1', USER_ALEX, USER_ALEX)).rejects.toThrow(
      'Cannot share a document with yourself.'
    );
  });

  it('6. Duplicate shares are rejected', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { owner_id: USER_ALEX }, error: null }),
            }),
          }),
        };
      }
      if (table === 'document_shares') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: 'existing-share' }, error: null }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    await expect(shareDocument('doc-1', USER_ALEX, USER_SAM)).rejects.toThrow(
      'Document is already shared with this user.'
    );
  });

  it('7. createDocument stores structured Tiptap-compatible JSON content', async () => {
    const tiptapContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Hello World' }],
        },
      ],
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          insert: (rows: any[]) => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: 'doc-new',
                  title: rows[0].title,
                  owner_id: rows[0].owner_id,
                  content: rows[0].content,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const newDoc = await createDocument('My Tiptap Doc', USER_ALEX, tiptapContent);
    expect(newDoc.title).toBe('My Tiptap Doc');
    expect(newDoc.content).toEqual(tiptapContent);
  });

  it('8. updateDocument preserves structured JSON content', async () => {
    const originalDoc = {
      id: 'doc-1',
      title: 'Original Title',
      owner_id: USER_ALEX,
      content: { type: 'doc', content: [] },
    };

    const updatedContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Updated paragraph content' }],
        },
      ],
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: originalDoc, error: null }),
            }),
          }),
          update: (updateData: any) => ({
            eq: () => ({
              select: () => ({
                single: async () => ({
                  data: { ...originalDoc, ...updateData },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const updated = await updateDocument('doc-1', USER_ALEX, {
      title: 'New Title',
      content: updatedContent,
    });

    expect(updated.title).toBe('New Title');
    expect(updated.content).toEqual(updatedContent);
  });

  it('9. getOwnedDocuments returns only documents owned by the requested user', async () => {
    const ownedDocs = [
      { id: 'doc-1', title: 'Alex Doc 1', owner_id: USER_ALEX },
      { id: 'doc-2', title: 'Alex Doc 2', owner_id: USER_ALEX },
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: () => ({
            eq: (col: string, val: string) => {
              expect(col).toBe('owner_id');
              expect(val).toBe(USER_ALEX);
              return {
                order: async () => ({ data: ownedDocs, error: null }),
              };
            },
          }),
        };
      }
      return {};
    });

    const docs = await getOwnedDocuments(USER_ALEX);
    expect(docs).toHaveLength(2);
    expect(docs).toEqual(ownedDocs);
  });

  it('10. getSharedDocuments returns only documents shared with the requested user', async () => {
    const sharedDocs = [{ id: 'doc-3', title: 'Shared with Sam', owner_id: USER_ALEX }];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'document_shares') {
        return {
          select: () => ({
            eq: (col: string, val: string) => {
              expect(col).toBe('user_id');
              expect(val).toBe(USER_SAM);
              return Promise.resolve({ data: [{ document_id: 'doc-3' }], error: null });
            },
          }),
        };
      }
      if (table === 'documents') {
        return {
          select: () => ({
            in: (col: string, ids: string[]) => {
              expect(col).toBe('id');
              expect(ids).toEqual(['doc-3']);
              return {
                order: async () => ({ data: sharedDocs, error: null }),
              };
            },
          }),
        };
      }
      return {};
    });

    const docs = await getSharedDocuments(USER_SAM);
    expect(docs).toHaveLength(1);
    expect(docs).toEqual(sharedDocs);
  });
});
