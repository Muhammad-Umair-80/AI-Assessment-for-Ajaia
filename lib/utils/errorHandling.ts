/**
 * Converts raw technical or database error messages into clean, user-friendly UI strings.
 */
export function formatErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const rawMessage = typeof error === 'string' ? error : error?.message || String(error);

  if (rawMessage.includes('row-level security policy') || rawMessage.includes('RLS')) {
    return 'Unable to perform operation. Please check your account permissions.';
  }

  if (rawMessage.includes('Access denied') || rawMessage.includes('permission')) {
    return "You don't have permission to access this document.";
  }

  if (rawMessage.includes('already shared')) {
    return 'This document is already shared with this user.';
  }

  if (rawMessage.includes('Unsupported file type')) {
    return 'Unsupported file type. Please choose a .txt, .md, or .markdown file.';
  }

  if (rawMessage.includes('File is empty')) {
    return 'The selected file is empty.';
  }

  if (rawMessage.includes('exceeds the maximum size limit')) {
    return 'The file exceeds the maximum allowed size limit of 2 MB.';
  }

  if (rawMessage.includes('with yourself')) {
    return 'You cannot share a document with yourself.';
  }

  if (rawMessage.includes('not found') || rawMessage.includes('Document not found')) {
    return 'The requested document could not be found.';
  }

  return rawMessage;
}
