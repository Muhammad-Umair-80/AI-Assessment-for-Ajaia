# Technical Architecture Documentation: Ajaia Document Editor

This document details the architectural design, technical decisions, data persistence model, real-time collaboration topology, security posture, and production deployment configuration of the **Ajaia Document Editor**.

---

## 🏗️ 1. System Overview

The **Ajaia Document Editor** is a hybrid real-time collaborative document workspace. It combines:
1. **Next.js 14 App Router** for server-side API endpoints, static assets, and client interface rendering.
2. **Supabase PostgreSQL** for structured JSON document AST storage, share metadata, and access isolation.
3. **Yjs CRDTs + Tiptap 3** for conflict-free local document state management.
4. **Yjs WebSocket Provider (`y-websocket`) + Node Collaboration Server (`@y/websocket-server`)** for live, real-time multi-browser document synchronization.

### High-Level System Topology

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 Browser Client                                  │
│  ┌───────────────────────┐   ┌──────────────────────────┐   ┌────────────────┐  │
│  │ React 18 UI / Toolbar │   │  Tiptap Editor Engine    │   │ Yjs Y.Doc AST  │  │
│  └───────────────────────┘   └──────────────────────────┘   └────────────────┘  │
└───────────────────────────┬──────────────────────────────────────────┬──────────┘
                            │ HTTP JSON API                            │ WSS / WS
                            ▼                                          ▼
┌─────────────────────────────────────────┐      ┌────────────────────────────────┐
│ Next.js 14 App Router (Vercel Serverless)│      │ External Yjs WebSocket Server  │
│  - /api/documents                       │      │ (Node.js Process)              │
│  - Protected SUPABASE_SERVICE_ROLE_KEY  │      │ - Room: ajaia-document-[id]    │
└────────────────────┬────────────────────┘      └────────────────────────────────┘
                     │ PostgreSQL SQL Client
                     ▼
┌─────────────────────────────────────────┐
│ Supabase PostgreSQL DB                   │
│  - users, documents, document_shares    │
└─────────────────────────────────────────┘
```

---

## 💻 2. Frontend Architecture

* **Framework**: Next.js 14 App Router with React 18 and TypeScript.
* **Core Views**:
  * **Dashboard (`app/page.tsx`)**: Renders workspace document listings (**My Documents** vs. **Shared with Me**), document creation modal, and Markdown/TXT file import dropzone.
  * **Editor Surface (`app/doc/[id]/page.tsx`)**: Renders header controls, live title input, save status indicator, share modal, and `TiptapEditor`.
* **Editor Component (`components/editor/TiptapEditor.tsx`)**:
  * Instantiates a stable `Y.Doc` instance via `useState(() => new Y.Doc())`.
  * Manages `WebsocketProvider` lifecycle and connection state (`Connecting...`, `Connected`, `Disconnected`, `Error`).
  * Destroys `provider` and `ydoc` cleanly on component unmount.
* **Toolbar Component (`components/editor/Toolbar.tsx`)**: Decoupled, accessible formatting toolbar rendering active format buttons and dynamic collaboration status badge.

---

## 🗄️ 3. Supabase Persistence

The database persistence layer runs on Supabase PostgreSQL:

### Database Schema
1. **`users`**:
   - `id` (`uuid`, Primary Key): Seeded user identifier.
   - `name` (`text`): User full name.
   - `email` (`text`, Unique): User email address.
2. **`documents`**:
   - `id` (`uuid`, Primary Key): Document UUID.
   - `title` (`text`): Document title.
   - `owner_id` (`uuid`, Foreign Key → `users.id`): Owner identifier.
   - `content` (`jsonb`): Tiptap AST JSON document content.
   - `created_at` / `updated_at` (`timestamptz`): Audit timestamps.
3. **`document_shares`**:
   - `id` (`uuid`, Primary Key): Share record identifier.
   - `document_id` (`uuid`, Foreign Key → `documents.id`): Document reference.
   - `user_id` (`uuid`, Foreign Key → `users.id`): Shared collaborator reference.
   - Unique constraint `(document_id, user_id)` prevents duplicate shares.

### Server-Side API Security Model
All database operations route through server-side Next.js Route Handlers (`/api/documents`). Server handlers authenticate mutations using `SUPABASE_SERVICE_ROLE_KEY`, enforcing access rules (owner access, shared collaborator access, self-share prevention) before execution. The service role key is strictly server-only and is **never** exposed to client browser bundles.

---

## 🤝 4. Tiptap + Yjs Collaboration Integration

* **Conflict-Free Replicated Data Type (CRDT)**: `Y.Doc` serves as the underlying document state model, allowing concurrent typing and formatting edits from multiple clients to resolve deterministically without data loss.
* **Tiptap Binding**: `@tiptap/extension-collaboration` binds Tiptap ProseMirror document nodes directly to `ydoc.getXmlFragment('default')`.
* **History Management**: Tiptap's built-in `undoRedo` plugin is disabled (`StarterKit.configure({ undoRedo: false })`) so undo and redo operations map cleanly to Yjs's `UndoManager`.

---

## 🌐 5. WebSocket Architecture

* **Provider**: Client components use `y-websocket` (`WebsocketProvider`) to establish a persistent WebSocket connection to the collaboration server.
* **URL Configuration**: Environment variable `NEXT_PUBLIC_YJS_WS_URL` sets the target WebSocket server endpoint (default `ws://localhost:1234` for local dev; `wss://...` in production).
* **Decoupled Topology**: The WebSocket server runs as an independent Node.js process. This decoupling is necessary because serverless deployment platforms (such as Vercel) terminate long-lived WebSocket connections.

---

## 🚪 6. Document Room Naming Model

* **Deterministic Scoping**: Every document maps strictly to room `ajaia-document-${documentId}`.
* **Isolation Guarantee**: Clients editing Document A join `ajaia-document-doc-a`, while clients editing Document B join `ajaia-document-doc-b`. Documents never leak edits or awareness state across room boundaries.

---

## 👤 7. Mock-User Model & Local Storage Context

* **Seeded Reviewers**: Accounts (**Muhammad Umair**, **Uzair**, **Zubair**) allow instant assessment review without auth friction.
* **Client Context (`context/UserContext.tsx`)**: React Context manages current user identity, persisting selection in `localStorage`.
* **Access Control**: Switching active user dynamically updates API permissions, dashboard document filtering (**My Documents** vs. **Shared with Me**), and document access validation.

---

## ⚠️ 8. Error Handling & UX Resilience

* **Error Sanitization ([`lib/utils/errorHandling.ts`](file:///c:/DATA/program/AI%20Assessment%20for%20Ajaia/lib/utils/errorHandling.ts))**: Translates technical database errors into clear user-facing messages.
* **Status Badge Feedback**: The editor toolbar displays live real-time status:
  - **Connecting...**: Amber badge during initial connection.
  - **Connected**: Emerald badge during active WebSocket session.
  - **Disconnected**: Slate badge when server disconnects.
  - **Error**: Red badge on socket failure.
* **Hydration Protection**: `handleEditorChange` checks deep JSON equality against `document.content` to ensure initial Yjs document hydration does not trigger spurious "Unsaved changes" flags.

---

## 🚀 9. Deployment Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │               Vercel Platform                │
                               │  - Next.js 14 App Router Static & API Routes │
                               │  - NEXT_PUBLIC_YJS_WS_URL=wss://yjs-server...│
                               └──────────────────────┬───────────────────────┘
                                                      │
┌─────────────────────────┐                           │ HTTP JSON API
│ Browser Clients (A & B) ├───────────────────────────┤
└────────────┬────────────┘                           ▼
             │ WSS Connection          ┌──────────────────────────────────────────────┐
             └────────────────────────►│ Dedicated Node.js Host (Railway/Render/Fly)  │
                                       │  - @y/websocket-server Process               │
                                       │  - Port 1234 / WSS Endpoint                  │
                                       └──────────────────────────────────────────────┘
```

1. **Next.js Frontend & API Routes**: Deployed to Vercel.
2. **Yjs WebSocket Server**: Deployed as a standing Node.js service on a persistent host (e.g. Railway, Render, Fly.io).
3. **Database**: Managed Supabase PostgreSQL instance.

---

## ⚠️ 10. Known Limitations

- **Infrastructure Requirement**: Real-time WebSocket synchronization requires running `@y/websocket-server` outside of Vercel serverless environment.
- **Mock Authentication**: User switching uses client-side localStorage rather than secure JWT/OAuth sessions.
- **Persistence Boundary**: Yjs real-time state is held in-memory across connected WebSocket clients; Supabase PostgreSQL persistence occurs on-demand via the explicit **Save** button.
- **Scope Target**: Designed as a clean, production-ready portfolio demonstration of CRDT real-time collaboration.

---

## 🔮 11. Future Production Improvements

1. **Yjs Binary Persistence**: Store Yjs binary updates directly in Supabase PostgreSQL (e.g. `bytea` update logs) to resume collaborative sessions without full JSON AST re-parsing.
2. **Awareness & Cursors**: Add `y-protocols/awareness` to render live collaborator cursor positions and selection highlights with user names and avatar colors.
3. **Production Authentication**: Replace mock user context with Supabase Auth (OAuth 2.0 / Magic Links / JWT).
4. **Auto-Saving Debounce**: Integrate debounced background saves alongside explicit manual saves.
