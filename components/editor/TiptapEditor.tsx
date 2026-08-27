'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Toolbar, CollaborationStatus } from './Toolbar';

export interface TiptapEditorProps {
  documentId?: string;
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
  documentId,
  initialContent,
  onChange,
  editable = true,
  className = '',
}) => {
  // Stable Y.Doc instance per editor component instance
  const [ydoc] = useState(() => new Y.Doc());
  const [collaborationStatus, setCollaborationStatus] = useState<CollaborationStatus>('Connecting...');

  // Deterministic room name per document ID
  const roomName = documentId ? `ajaia-document-${documentId}` : 'ajaia-document-default';
  const wsUrl = process.env.NEXT_PUBLIC_YJS_WS_URL || 'ws://localhost:1234';

  // Manage WebsocketProvider lifecycle
  useEffect(() => {
    const provider = new WebsocketProvider(wsUrl, roomName, ydoc);

    const handleStatus = (event: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      if (event.status === 'connected') {
        setCollaborationStatus('Connected');
      } else if (event.status === 'connecting') {
        setCollaborationStatus('Connecting...');
      } else {
        setCollaborationStatus('Disconnected');
      }
    };

    const handleConnectionError = () => {
      setCollaborationStatus('Error');
    };

    provider.on('status', handleStatus);
    provider.on('connection-error', handleConnectionError);

    return () => {
      provider.off('status', handleStatus);
      provider.off('connection-error', handleConnectionError);
      provider.disconnect();
      provider.destroy();
    };
  }, [wsUrl, roomName, ydoc]);

  // Destroy Y.Doc on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      ydoc.destroy();
    };
  }, [ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false, // Collaboration extension manages undo/redo via Yjs
      }),
      Underline,
      Collaboration.configure({
        document: ydoc,
      }),
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
      {editable && <Toolbar editor={editor} collaborationStatus={collaborationStatus} />}
      <div className="w-full relative">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;
