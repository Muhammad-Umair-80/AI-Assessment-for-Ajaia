# Technical Architecture Documentation: Ajaia Document Editor

This document presents the architectural design, technical decisions, data model, request pipeline, and scope trade-offs of the **Ajaia Document Editor**.

---

## 🏗️ 1. Architecture Overview & Core Philosophy

The application is structured as a full-stack Next.js 14 App Router application backed by Supabase PostgreSQL.

### High-Level Request Pipeline
```
┌─────────────────┐       HTTP JSON       ┌──────────────────────────┐       PostgreSQL       ┌──────────────────┐
│                 │  ──────────────────►  │ Next.js App Router       │  ───────────────────►  │ Supabase         │
│ Browser Client  │                       │ Route Handlers           │                        │ PostgreSQL DB    │
│ (React / Tiptap)│  ◄──────────────────  │ (/api/documents)         │  ◄───────────────────  │ (JSONB & RLS)    │
└─────────────────┘       JSON Response   └──────────────────────────┘       Supabase Client  └──────────────────┘
                                                        │
                                                        ▼
                                         Protected SUPABASE_SERVICE_ROLE_KEY
                                         (Server-Side Execution Only)
```

---

## 💻 2. Frontend Architecture

* **Framework**: Next.js 14 App Router with React 18 and TypeScript.
* **Component Model**:
  * **Dashboard (`app/page.tsx`)**: Client component displaying workspace overview, handling document creation, file imports, and document listing divided into **My Documents** and **Shared with Me**.
  * **Editor (`app/doc/[id]/page.tsx`)**: Dynamic document editing route managing title updates, rich-text state, real-time save state indicators, and owner-only sharing.
  * **User Context (`context/UserContext.tsx`)**: React Context provider managing client-side user switching (`currentUser`, `setCurrentUser`, `availableUsers`) synced to `localStorage`.
* **Styling**: Vanilla Tailwind CSS with custom micro-interactions, responsive flex/grid viewports, keyboard focus rings, and accessible dialog overlays.

---

## 📝 3. Editor Architecture

* **Editor Engine**: Headless [Tiptap Editor](https://tiptap.dev/) (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`).
* **Content Representation**: Formatted content is managed as a structured **Tiptap JSON AST** (`JSONContent`) containing `type`, `attrs`, `content` nodes, and inline `marks` (`bold`, `italic`).
* **Toolbar Component (`components/editor/Toolbar.tsx`)**: Decoupled, accessible toolbar rendering formatting buttons (`Bold`, `Italic`, `Underline`, `H1`, `H2`, `H3`, `Bullet List`, `Ordered List`, `Undo`, `Redo`) with active states (`is-active`) and disabled states.

---

## 🔌 4. API Architecture

All database mutations and access checks execute via Next.js Server-Side App Router API Route Handlers under `/api/documents`:

* `GET /api/documents?userId=...&type=owned|shared`: Fetches documents owned by or shared with a specific user.
* `POST /api/documents`: Creates a new document with optional JSON content.
* `GET /api/documents/[id]?userId=...`: Fetches a single document after validating access rights.
* `PUT /api/documents/[id]`: Updates document title or JSON content.
* `POST /api/documents/[id]/share`: Shares an owned document with a target collaborator.

---

## 🗄️ 5. Database Architecture

The database is built on Supabase PostgreSQL with three primary tables:

### 1. `users`
* `id` (`uuid`, Primary Key): Seeded user identifier.
* `name` (`text`): User full name.
* `email` (`text`, Unique): User email address.

### 2. `documents`
* `id` (`uuid`, Primary Key): Document identifier.
* `title` (`text`): Document title.
* `owner_id` (`uuid`, Foreign Key → `users.id`): Document owner.
* `content` (`jsonb`): Tiptap AST JSON content document tree.
* `created_at` / `updated_at` (`timestamptz`): Audit timestamps automatically updated via PostgreSQL trigger.

### 3. `document_shares`
* `id` (`uuid`, Primary Key): Share record identifier.
* `document_id` (`uuid`, Foreign Key → `documents.id`): Document reference.
* `user_id` (`uuid`, Foreign Key → `users.id`): Shared collaborator reference.
* `created_at` (`timestamptz`): Share creation timestamp.
* Unique Constraint: `(document_id, user_id)` prevents duplicate sharing.

---

## 🔐 6. Server-Side Persistence & Security Model

### Why Server-Side Persistence Was Used
During initial development, row-level security (RLS) blocked direct browser inserts because the client anon key was unauthenticated.

Rather than weakening database security with permissive `USING (true) WITH CHECK (true)` policies, the architecture was designed to route all mutations through Next.js server-side Route Handlers:
1. Client components call server API endpoints (`/api/documents`).
2. Server API routes initialize a server-only Supabase client using `SUPABASE_SERVICE_ROLE_KEY`.
3. Server-side code enforces business rules (ownership verification, self-sharing prevention, duplicate share checks, access authorization) before performing database operations.
4. `SUPABASE_SERVICE_ROLE_KEY` remains strictly protected on the server and is **never** exposed to browser bundles.

---

## 🤝 7. Sharing & Access Control Model

Business logic rules enforced in [`lib/db/documents.ts`](file:///c:/DATA/program/AI%20Assessment%20for%20Ajaia/lib/db/documents.ts):
1. **Owner Access**: Document owner (`doc.owner_id === userId`) has full read/write access.
2. **Shared Access**: Collaborators with a matching record in `document_shares` (`document_id`, `userId`) have read/write access.
3. **Access Isolation**: Requests from unrelated users without owner or share records return `403 Access Denied`.
4. **Owner-Only Sharing**: Only the document owner (`doc.owner_id === ownerId`) can invite collaborators.
5. **Self-Sharing Rejection**: Requests sharing a document with oneself are rejected.
6. **Duplicate Share Rejection**: Duplicate shares to an existing collaborator are caught and rejected with a friendly message.

---

## 📄 8. File Import Pipeline

The file import engine ([`lib/fileImport.ts`](file:///c:/DATA/program/AI%20Assessment%20for%20Ajaia/lib/fileImport.ts)) converts imported files into native Tiptap AST JSON:
1. **File Reading**: File contents are read in the browser using `file.text()`.
2. **Validation**: Rejects unsupported file extensions (allows only `.txt`, `.md`, `.markdown`) and files exceeding 2 MB.
3. **Markdown AST Token Parsing**: Utilizes `marked.lexer()` AST parser to recursively map Markdown tokens into structured Tiptap nodes:
   * `# Heading 1` → `{ type: 'heading', attrs: { level: 1 }, content: [...] }`
   * `## Heading 2` → `{ type: 'heading', attrs: { level: 2 }, content: [...] }`
   * `### Heading 3` → `{ type: 'heading', attrs: { level: 3 }, content: [...] }`
   * `**bold**` → `{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] }`
   * `*italic*` → `{ type: 'text', text: 'italic', marks: [{ type: 'italic' }] }`
   * `- item` → `{ type: 'bulletList', content: [{ type: 'listItem', content: [...] }] }`
   * `1. item` → `{ type: 'orderedList', content: [{ type: 'listItem', content: [...] }] }`
4. **Persistence**: Creates a new document with the parsed AST JSON and navigates to the editor.

---

## ⚠️ 9. Error Handling Strategy

* **Sanitization Utility ([`lib/utils/errorHandling.ts`](file:///c:/DATA/program/AI%20Assessment%20for%20Ajaia/lib/utils/errorHandling.ts))**: Converts technical database errors into clean UI strings:
  * RLS policy exceptions → `"Unable to perform operation. Please check your account permissions."`
  * Access denial → `"You don't have permission to access this document."`
  * Duplicate share → `"This document is already shared with this user."`
* **Development Diagnostics**: Retains detailed diagnostic logging in development mode without exposing raw stack traces or database connection strings to end-users.

---

## 🧪 10. Testing Strategy

* **Framework**: Vitest.
* **Coverage**:
  * `__tests__/documents.test.ts`: Tests document creation, access verification, sharing authorization, self-share prevention, and duplicate share rejection.
  * `__tests__/fileImport.test.ts`: Tests Markdown AST parsing, inline text marks, list conversions, invalid extension rejections, and empty file handling.
* **Results**: 20/20 unit tests passing cleanly.

---

## ⚖️ 11. Scope Decisions & Trade-Offs

### Prioritized Features
* Full working document lifecycle (Create → Edit → Save → Refresh → Reopen).
* Headless rich-text editor with formatting toolbar.
* Supabase PostgreSQL persistence layer.
* AST Markdown & TXT file import pipeline.
* Document sharing & access isolation model.
* Seeded mock user switching.
* Production deployability.

### Deprioritized Features (Intentional Time-Box Decisions)
* **Real Authentication**: Used seeded mock users with client state switching to focus time on core editor and persistence engineering within the assessment time-box.
* **Real-Time Collaboration**: Multi-user WebSockets/Yjs collaboration deprioritized in favor of robust single-user editing and document sharing.
* **Comments & Version History**: Deprioritized to ensure maximum polish on baseline document workflows.
