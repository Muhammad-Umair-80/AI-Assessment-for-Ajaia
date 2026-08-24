# Ajaia Document Editor

A modern, lightweight rich-text document editor and management workspace built for the Ajaia AI Engineering Assessment.

---

## 🌟 Key Features

* **Rich-Text Editor**: Powered by Tiptap with support for Headings (H1, H2, H3), Bold, Italic, Underline, Bullet Lists, Ordered Lists, Paragraphs, and Undo/Redo history.
* **Document Persistence**: Supabase PostgreSQL backend with JSONB structured document content storage and Row-Level Security (RLS).
* **Document Dashboard**: Organized workspace separating **My Documents** (owned) from **Shared with Me** (collaborations).
* **File Import Engine**: Import `.txt`, `.md`, and `.markdown` files directly into editable Tiptap documents using a custom AST parser powered by `marked`.
* **Mock User Switching**: Switch seamlessly between seeded accounts (**Muhammad Umair**, **Uzair**, and **Zubair**) with persistent client context stored in `localStorage`.
* **Document Sharing & Access Control**: Share documents with team members, enforce owner-only sharing privileges, prevent duplicate sharing, and isolate unauthorized document access.
* **Save State Indicators**: Real-time toolbar status badges (`Saved`, `Unsaved changes`, `Saving...`, `Unable to save`).
* **Usability & Accessibility**: Keyboard-accessible dialogs, loading skeletons, responsive layouts, and user-friendly error sanitization.

---

## 🛠️ Technology Stack

* **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
* **Editor**: [Tiptap](https://tiptap.dev/) (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`)
* **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Service-Role server mutations, RLS)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Testing**: [Vitest](https://vitest.dev/)
* **Markdown Parser**: [Marked](https://marked.js.org/) AST Lexer

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
* Node.js v18.0.0 or higher
* npm or yarn

### 2. Clone & Install Dependencies
```bash
git clone <repository-url>
cd ajaia-doc-editor
npm install
```

### 3. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

Fill in your Supabase project credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Database Setup
Run the SQL DDL script provided in `schema.sql` inside your Supabase SQL Editor:
* Creates `users`, `documents`, and `document_shares` tables.
* Configures indexes, updated_at triggers, and RLS policies.
* Seeds default mock users (**Muhammad Umair**, **Uzair**, and **Zubair**).

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run the Vitest test suite:
```bash
npm test
```

Run TypeScript type checking:
```bash
npx tsc --noEmit
```

Run Next.js production build:
```bash
npm run build
```

---

## 🔒 Security & Architecture Overview

* **Server-Only Service Role Mutations**: Document CRUD mutations run through server-side Next.js App Router API endpoints using `SUPABASE_SERVICE_ROLE_KEY`. The service-role key is never exposed to browser clients.
* **Client Environment Isolation**: Browser code strictly consumes public `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
* **Row-Level Security**: RLS remains enabled on all database tables.
