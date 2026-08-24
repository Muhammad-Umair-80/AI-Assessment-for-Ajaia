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
