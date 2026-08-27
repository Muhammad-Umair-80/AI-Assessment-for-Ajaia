# Ajaia Document Editor

A lightweight, collaborative rich-text document editor and management workspace inspired by Google Docs, built specifically for the **Ajaia AI-Native Full Stack Developer Assessment**.

---

## 🌟 Overview

The **Ajaia Document Editor** is a production-ready Web application built with Next.js 14, Tiptap, and Supabase. It provides document creation, editing, file import, mock user switching, and document sharing with access isolation.

---

## ✨ Features

* **Document Creation**: Create new blank documents instantly from the workspace dashboard.
* **Document Rename**: Real-time editable title header with automatic save tracking.
* **Rich-Text Editing**: Powered by Tiptap headless editor supporting:
  * **Paragraphs** & Headings (**H1**, **H2**, **H3**)
  * **Bold**, **Italic**, and **Underline** inline formatting
  * **Bulleted Lists** and **Numbered Lists**
  * **Undo** and **Redo** history
* **Document Persistence**: Structured `JSONB` document AST content persisted in Supabase PostgreSQL.
* **Markdown & TXT Import**: Built-in file import engine converting raw `.txt`, `.md`, and `.markdown` files directly into Tiptap JSON AST nodes and marks.
* **Document Sharing**: Share documents with team collaborators with duplicate share prevention and owner-only sharing privileges.
* **Owned vs. Shared Workspace**: Visual dashboard separation between **My Documents** (owned) and **Shared with Me** (collaborations).
* **Mock User Switching**: Switch seamlessly between seeded review accounts (**Muhammad Umair**, **Uzair**, and **Zubair**) with persistent client context stored in `localStorage`.
* **Access Control**: Strict authorization enforcing owner access, shared user access, and blocking unauthorized users.
* **Responsive UI**: Clean Tailwind CSS design built for desktop, tablet, and mobile screens.
* **Error Handling & UX Polish**: User-friendly error sanitization, double-submission protection, loading skeletons, and real-time save state indicators (`Saved`, `Unsaved changes`, `Saving...`, `Unable to save`).

---

## 🛠️ Tech Stack

* **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
* **Rich-Text Editor**: [Tiptap](https://tiptap.dev/) (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`)
* **Database & Storage**: [Supabase](https://supabase.com/) (PostgreSQL, JSONB document storage, Row-Level Security)
* **Backend API**: Next.js Server-Side Route Handlers (`/api/documents`)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Testing**: [Vitest](https://vitest.dev/)
* **Version Control & Hosting**: GitHub, Vercel

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚡ Real-Time Collaboration

This project implements real-time collaborative editing using Yjs CRDTs and WebSocket synchronization:

- **Yjs CRDT State**: `Y.Doc` serves as the authoritative, conflict-free collaborative document state model.
- **Tiptap Collaboration**: `@tiptap/extension-collaboration` binds the Tiptap editor instance directly to `Y.Doc`.
- **WebSocket Provider**: `y-websocket` (`WebsocketProvider`) connects the local `Y.Doc` instance to the WebSocket server configured via `NEXT_PUBLIC_YJS_WS_URL`.
- **Isolated Collaboration Rooms**: Every document maps deterministically to its own room (`ajaia-document-${documentId}`). Documents never leak state into other rooms.
- **Supabase Persistence Layer**: Existing Supabase PostgreSQL persistence handles saving document AST state on demand via Save button action.
- **Decoupled Architecture**: The collaboration server runs independently from the Next.js App Router application.

### Production Collaboration Topology

```
Browser Client (React / Tiptap)
  │
  ├───────────────────────► Vercel (Next.js Application Frontend & REST APIs)
  │
  └─(WebSocket / WSS)─────► External Yjs WebSocket Server (Node.js Process)
                              │
                              └── Shared Document Rooms (ajaia-document-[id])
```

> [!IMPORTANT]
> **Vercel Serverless Architecture Note**: Serverless environments like Vercel Functions execute short-lived HTTP invocations and cannot maintain persistent, long-lived WebSocket connections required by Yjs real-time CRDT synchronization. Therefore, the Yjs WebSocket collaboration server MUST run on a dedicated Node-compatible WebSocket host.

### How to Test Real-Time Synchronization Across Two Browsers (Local Dev)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the Local Collaboration Server**:
   ```bash
   npm run collaboration
   ```
   *(Starts `y-websocket-server` listening locally on `ws://localhost:1234`)*

3. **Start the Next.js Application**:
   ```bash
   npm run dev
   ```

4. **Open Two Browser Sessions**:
   - Open Browser Session 1: [http://localhost:3000](http://localhost:3000)
   - Open Browser Session 2 (e.g., Incognito / Private Window or another browser): [http://localhost:3000](http://localhost:3000)

5. **Open the Same Document**:
   - Open the same document in both windows.
   - Verify status indicator shows **Connected**.
   - Type text, format headings, bold, or lists in Window 1 and watch updates synchronize in real time to Window 2!

### Deploying the Collaboration Server to Production

To deploy real-time collaboration for a live deployment (e.g. Vercel):

1. **Host the Yjs Server**: Deploy `@y/websocket-server` or `y-websocket-server` on any Node-compatible persistent hosting platform, such as:
   - [Railway](https://railway.app/)
   - [Render](https://render.com/)
   - [Fly.io](https://fly.io/)
   - Dedicated VPS (DigitalOcean / EC2)

2. **Configure Environment Variable**:
   Set `NEXT_PUBLIC_YJS_WS_URL` in your Vercel project environment settings to point to your secure public WebSocket endpoint:
   ```env
   NEXT_PUBLIC_YJS_WS_URL=wss://your-yjs-server.up.railway.app
   ```

### ⚠️ Current Collaboration Limitations

- **Infrastructure Decoupling**: The collaboration server runs as a separate Node.js process independently from Next.js serverless routes.
- **Mock User Model**: Users switch via client-side UI buttons for assessment reviewing purposes rather than full OAuth/JWT authentication.
- **Persistence Boundary**: Real-time Yjs state is held in-memory across connected WebSocket clients; document AST persistence in Supabase PostgreSQL remains on-demand via the explicit **Save** action.
- **Room Scoping**: Collaboration rooms are deterministically derived from document UUIDs (`ajaia-document-${documentId}`).
- **Demonstration Target**: Designed as a lightweight, clean demonstration of CRDT state synchronization, Tiptap integration, and WebSocket state handling.

---

## 🔐 Environment Variables

Create a `.env.local` file in the project root based on `.env.local.example`:

```env
# Public Supabase URL (Safe for Browser & Server)
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co

# Public Supabase Anon API Key (Safe for Browser & Server)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Server-Only Supabase Service Role Key (STRICTLY REQUIRED FOR SERVER-SIDE DB MUTATIONS)
# WARNING: NEVER expose this key to browser client components or prepend NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

> [!IMPORTANT]
> `SUPABASE_SERVICE_ROLE_KEY` is a server-only secret required for Next.js App Router API Route Handlers. It must **never** be exposed to client components or prepended with `NEXT_PUBLIC_`.

---

## 🗄️ Database Setup

Run the SQL script [`schema.sql`](file:///c:/DATA/program/AI%20Assessment%20for%20Ajaia/schema.sql) in your Supabase SQL Editor to initialize:
1. `users`, `documents`, and `document_shares` tables.
2. Row-Level Security (RLS) policies and `updated_at` triggers.
3. Seed users (**Muhammad Umair**, **Uzair**, **Zubair**).

---

## 🧪 Testing & Verification

Run the Vitest test suite (20 automated unit tests):
```bash
npm test
```

Run TypeScript type check:
```bash
npx tsc --noEmit
```

Run Next.js production build:
```bash
npm run build
```

---

## 📁 Supported File Types for Import

* **Formats**: `.txt`, `.md`, `.markdown`
* **Maximum File Size**: 2 MB

---

## 🔗 Demo & Links

* **LIVE DEMO**:
  [PASTE VERCEL URL HERE]
* **GitHub Repository**:
  [PASTE GITHUB URL HERE]
