'use client';

import React from 'react';
import { Editor } from '@tiptap/react';

interface ToolbarProps {
  editor: Editor | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const btnClass = (isActive = false, isDisabled = false) =>
    `px-2.5 py-1.5 text-xs font-semibold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center select-none ${
      isDisabled
        ? 'opacity-40 cursor-not-allowed text-slate-400'
        : isActive
        ? 'bg-blue-100 text-blue-800 border border-blue-200'
        : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900 active:bg-slate-300'
    }`;

  return (
    <div
      role="toolbar"
      aria-label="Text Formatting"
      className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 rounded-t-lg select-none"
    >
      {/* Bold */}
      <button
        type="button"
        title="Bold (Ctrl+B)"
        aria-label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
      >
        <span className="font-bold">B</span>
      </button>

      {/* Italic */}
      <button
        type="button"
        title="Italic (Ctrl+I)"
        aria-label="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
      >
        <span className="italic font-serif">I</span>
      </button>

      {/* Underline */}
      <button
        type="button"
        title="Underline (Ctrl+U)"
        aria-label="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive('underline'))}
      >
        <span className="underline">U</span>
      </button>

      <div className="w-[1px] h-4 bg-slate-300 mx-1" />

      {/* Paragraph */}
      <button
        type="button"
        title="Paragraph"
        aria-label="Paragraph"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={btnClass(editor.isActive('paragraph') && !editor.isActive('heading'))}
      >
        <span>Paragraph</span>
      </button>

      {/* Heading 1 */}
      <button
        type="button"
        title="Heading 1"
        aria-label="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnClass(editor.isActive('heading', { level: 1 }))}
      >
        <span className="font-bold">H1</span>
      </button>

      {/* Heading 2 */}
      <button
        type="button"
        title="Heading 2"
        aria-label="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive('heading', { level: 2 }))}
      >
        <span className="font-bold">H2</span>
      </button>

      <div className="w-[1px] h-4 bg-slate-300 mx-1" />

      {/* Bullet List */}
      <button
        type="button"
        title="Bullet List"
        aria-label="Bullet List"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
      >
        <span>• List</span>
      </button>

      {/* Numbered List */}
      <button
        type="button"
        title="Numbered List"
        aria-label="Numbered List"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive('orderedList'))}
      >
        <span>1. List</span>
      </button>

      <div className="w-[1px] h-4 bg-slate-300 mx-1" />

      {/* Undo */}
      <button
        type="button"
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className={btnClass(false, !editor.can().chain().focus().undo().run())}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>

      {/* Redo */}
      <button
        type="button"
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className={btnClass(false, !editor.can().chain().focus().redo().run())}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
        </svg>
      </button>
    </div>
  );
};
