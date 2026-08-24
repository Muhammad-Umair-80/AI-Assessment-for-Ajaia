'use client';

import React, { useEffect, useState } from 'react';
import { useCurrentUser } from '@/context/UserContext';
import { shareDocumentWithUser } from '@/lib/api/documents';
import { SeedUser } from '@/lib/constants/users';
import { Document } from '@/lib/types/database';
import { formatErrorMessage } from '@/lib/utils/errorHandling';

interface ShareModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onShareSuccess?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  document,
  isOpen,
  onClose,
  onShareSuccess,
}) => {
  const { currentUser, availableUsers } = useCurrentUser();

  // Exclude current owner from target selection
  const targetUsers = availableUsers.filter((u) => u.id !== currentUser.id);

  const [selectedUserId, setSelectedUserId] = useState<string>(targetUsers[0]?.id || '');
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync default selected user when targetUsers change
  useEffect(() => {
    if (targetUsers.length > 0 && (!selectedUserId || selectedUserId === currentUser.id)) {
      setSelectedUserId(targetUsers[0].id);
    }
  }, [currentUser.id, availableUsers]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !sharing) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, sharing]);

  if (!isOpen || !document) return null;

  const handleShare = async () => {
    if (!selectedUserId) {
      setError('Please select a user to share with.');
      return;
    }

    try {
      setSharing(true);
      setError(null);
      setSuccess(null);

      const targetUser = availableUsers.find((u) => u.id === selectedUserId);
      await shareDocumentWithUser(document.id, currentUser.id, selectedUserId);

      setSuccess(`Document successfully shared with ${targetUser?.name || 'user'}.`);

      if (onShareSuccess) {
        onShareSuccess();
      }

      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('[Share Error]', err);
      setError(formatErrorMessage(err));
    } finally {
      setSharing(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <h3 id="share-modal-title" className="text-lg font-bold text-slate-900">
              Share Document
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* Target Document Info */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Document Title
          </p>
          <p className="text-base font-bold text-slate-900 truncate">
            {document.title || 'Untitled Document'}
          </p>
        </div>

        {/* User Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Select Collaborator
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {targetUsers.map((user: SeedUser) => (
              <label
                key={user.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedUserId === user.id
                    ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="targetUser"
                    value={user.id}
                    checked={selectedUserId === user.id}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-lg flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={sharing}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {sharing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sharing...
              </>
            ) : (
              'Share'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
