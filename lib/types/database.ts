export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export type DocumentContent = {
  type: string;
  content?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export interface Document {
  id: string;
  title: string;
  content: DocumentContent;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentShare {
  id: string;
  document_id: string;
  user_id: string;
  created_at: string;
}

export interface DocumentWithShareDetails extends Document {
  owner?: User;
  shared_with?: User[];
}
