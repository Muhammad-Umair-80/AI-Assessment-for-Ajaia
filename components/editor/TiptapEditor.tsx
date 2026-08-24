'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Toolbar } from './Toolbar';

export interface TiptapEditorProps {
  initialContent?: JSONContent | Record<string, unknown>;
  onChange?: (content: JSONContent) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
}

const DEFAULT_JSON_CONTENT: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
    },
  ],
};

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  initialContent,
  onChange,
  editable = true,
  className = '',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: initialContent || DEFAULT_JSON_CONTENT,
    editable,
    onUpdate: ({ editor: updatedEditor }) => {
      if (onChange) {
        onChange(updatedEditor.getJSON());
      }
    },
    editorProps: {
      attributes: {
        class:
          'w-full min-h-[400px] p-6 md:p-8 bg-white focus:outline-none rounded-b-lg text-slate-800 text-base leading-relaxed',
      },
    },
  });

  // Synchronize editable prop if changed dynamically
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  return (
    <div
      className={`flex flex-col w-full max-w-4xl mx-auto bg-white rounded-lg border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all ${className}`}
    >
      {editable && <Toolbar editor={editor} />}
      <div className="w-full relative">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;
