'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/context/UserContext';
import { createNewDocument, fetchOwnedDocuments, fetchSharedDocuments } from '@/lib/api/documents';
import { processImportFile } from '@/lib/fileImport';
import { Document } from '@/lib/types/database';
import { formatErrorMessage } from '@/lib/utils/errorHandling';
import { UserSwitcher } from '@/components/UserSwitcher';
import { ShareModal } from '@/components/ShareModal';

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useCurrentUser();

  const [ownedDocs, setOwnedDocs] = useState<Document[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Document[]>([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Share Modal state
  const [shareDocTarget, setShareDocTarget] = useState<Document | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [owned, shared] = await Promise.all([
        fetchOwnedDocuments(currentUser.id),
        fetchSharedDocuments(currentUser.id),
      ]);

      setOwnedDocs(owned);
      setSharedDocs(shared);
    } catch (err: any) {
      console.error('[Dashboard Load Error]', err);
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser.id]);

  const handleCreateDocument = async () => {
    if (creating || importing) return;

    try {
      setCreating(true);
      setError(null);
      const newDoc = await createNewDocument('Untitled Document', currentUser.id);
      router.push(`/doc/${newDoc.id}`);
    } catch (err: any) {
      console.error('[Create Doc Error]', err);
      setError(formatErrorMessage(err));
      setCreating(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError(null);

      const { title, content } = await processImportFile(file);
      const newDoc = await createNewDocument(title, currentUser.id, content);
      router.push(`/doc/${newDoc.id}`);
    } catch (err: any) {
      console.error('[File Import Error]', err);
      setError(formatErrorMessage(err));
      setImporting(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenShareModal = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareDocTarget(doc);
    setIsShareOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Header with User Switcher */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Ajaia Docs
            </h1>
          </div>

          <UserSwitcher />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Title bar & Global Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Document Workspace</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Viewing workspace for <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.email})
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".txt,.md,.markdown"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Import File"
            />

            {/* Import File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing || creating}
              title="Import .txt, .md, or .markdown file"
              aria-label="Import File"
              className="px-4 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-sm rounded-lg border border-slate-300 shadow-2xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {importing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import File
                </>
              )}
            </button>

            {/* New Document Button */}
            <button
              type="button"
              onClick={handleCreateDocument}
              disabled={creating || importing}
              aria-label="New Document"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {creating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Document
                </>
              )}
            </button>
          </div>
        </div>

        {/* Supported File Formats Indicator Badge */}
        <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 px-4 py-2.5 rounded-lg text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span><strong>Supported Import Formats:</strong> <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-800 font-mono">.txt</code>, <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-800 font-mono">.md</code>, <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-800 font-mono">.markdown</code> (Max 2 MB)</span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start justify-between gap-3 text-amber-800 text-sm">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold">Notice</p>
                <p>{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-amber-600 hover:text-amber-900 font-bold focus:outline-none"
              aria-label="Dismiss error notice"
            >
              ✕
            </button>
          </div>
        )}

        {/* SECTION 1: MY DOCUMENTS */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h3 className="text-xl font-bold text-slate-900">My Documents</h3>
            <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              {ownedDocs.length}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-white rounded-lg border border-slate-200 p-5 animate-pulse flex flex-col justify-between">
                  <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : ownedDocs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md shadow-2xs">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-base font-bold text-slate-800 mb-1">No documents yet</p>
              <p className="text-xs text-slate-500 mb-5">Create a new document or import a file to get started.</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  Import File
                </button>
                <button
                  type="button"
                  onClick={handleCreateDocument}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  + New Document
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {ownedDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => router.push(`/doc/${doc.id}`)}
                  className="group bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {doc.title || 'Untitled Document'}
                      </h4>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                        Owner
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {new Date(doc.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleOpenShareModal(doc, e)}
                      aria-label={`Share ${doc.title}`}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 bg-slate-50 border border-slate-200 rounded-md transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      title="Share document with collaborator"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: SHARED WITH ME */}
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xl font-bold text-slate-900">Shared with Me</h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
              {sharedDocs.length}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="h-32 bg-white rounded-lg border border-slate-200 p-5 animate-pulse flex flex-col justify-between">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              </div>
            </div>
          ) : sharedDocs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md shadow-2xs">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-base font-bold text-slate-800 mb-1">No documents have been shared with you yet</p>
              <p className="text-xs text-slate-500">Documents shared with {currentUser.name} by team members will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {sharedDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => router.push(`/doc/${doc.id}`)}
                  className="group bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {doc.title || 'Untitled Document'}
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        Shared with Me
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Updated {new Date(doc.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Share Modal Dialog */}
      <ShareModal
        document={shareDocTarget}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        onShareSuccess={fetchDashboardData}
      />
    </div>
  );
}
