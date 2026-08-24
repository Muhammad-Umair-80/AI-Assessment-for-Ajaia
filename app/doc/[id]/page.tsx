'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { JSONContent } from '@tiptap/react';
import { useCurrentUser } from '@/context/UserContext';
import { fetchDocument, saveDocument } from '@/lib/api/documents';
import { Document } from '@/lib/types/database';
import { formatErrorMessage } from '@/lib/utils/errorHandling';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { UserSwitcher } from '@/components/UserSwitcher';
import { ShareModal } from '@/components/ShareModal';

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.id as string;
  const { currentUser } = useCurrentUser();

  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<JSONContent | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Share Modal state
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (!documentId) return;

    async function loadDoc() {
      try {
        setLoading(true);
        setLoadError(null);
        const doc = await fetchDocument(documentId, currentUser.id);

        if (process.env.NODE_ENV === 'development') {
          console.log('[Editor Diagnostics] 7. JSON passed to TiptapEditor as initialContent:', doc.content);
        }

        setDocument(doc);
        setTitle(doc.title);
        setContent(doc.content);
        setSaveStatus('idle');
      } catch (err: any) {
        console.error('[Document Load Error]', err);
        setLoadError(formatErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    loadDoc();
  }, [documentId, currentUser.id]);

  const handleSave = async () => {
    if (!document || !content || saveStatus === 'saving') return;

    try {
      setSaveStatus('saving');
      setSaveError(null);

      const updated = await saveDocument(document.id, currentUser.id, {
        title,
        content,
      });

      setDocument(updated);
      setSaveStatus('saved');
    } catch (err: any) {
      console.error('[Save Error]', err);
      setSaveError(formatErrorMessage(err));
      setSaveStatus('error');
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (saveStatus !== 'unsaved') {
      setSaveStatus('unsaved');
    }
  };

  const handleEditorChange = (newContent: JSONContent) => {
    setContent(newContent);
    if (saveStatus !== 'unsaved') {
      setSaveStatus('unsaved');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-slate-600 font-medium bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-2xs">
          <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading document...</span>
        </div>
      </div>
    );
  }

  if (loadError || !document) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded px-1"
            >
              ← Dashboard
            </Link>
            <UserSwitcher />
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white p-8 rounded-xl border border-slate-200 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied or Not Found</h2>
            <p className="text-sm text-slate-600 mb-6">{loadError || "You don't have permission to access this document."}</p>
            <Link
              href="/"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors inline-block focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              ← Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = document.owner_id === currentUser.id;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Editor Top Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <Link
              href="/"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              title="Back to Dashboard"
              aria-label="Back to Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>

            {/* Editable Title Input */}
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Document"
              aria-label="Document Title"
              className="text-base sm:text-lg font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded px-2 py-1 transition-all outline-none truncate flex-1 max-w-xs sm:max-w-md"
            />
          </div>

          {/* Action Controls & User Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Share Button (Only for Document Owner) */}
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                aria-label="Share document"
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
                title="Share document with collaborator"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="hidden sm:inline">Share</span>
              </button>
            )}

            {/* Save Status Badge */}
            {saveStatus === 'saved' && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}

            {saveStatus === 'unsaved' && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <span className="hidden sm:inline">Unsaved changes</span>
                <span className="sm:hidden">Unsaved</span>
              </span>
            )}

            {saveStatus === 'error' && (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                Unable to save
              </span>
            )}

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              aria-label="Save document changes"
              className="px-3.5 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {saveStatus === 'saving' ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                'Save'
              )}
            </button>

            <UserSwitcher />
          </div>
        </div>
      </header>

      {/* Save Error Banner */}
      {saveError && (
        <div className="max-w-4xl mx-auto mt-4 px-4 w-full">
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg flex items-center justify-between">
            <span>{saveError}</span>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="text-red-500 hover:text-red-800 font-bold focus:outline-none"
              aria-label="Dismiss save error message"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Editor Container Surface */}
      <main className="flex-1 py-6 sm:py-8 px-3 sm:px-6">
        <TiptapEditor
          key={document.id}
          initialContent={document.content}
          onChange={handleEditorChange}
        />
      </main>

      {/* Share Modal Dialog */}
      {isOwner && (
        <ShareModal
          document={document}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  );
}
