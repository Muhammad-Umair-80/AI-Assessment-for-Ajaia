import { JSONContent } from '@tiptap/react';
import { marked, Token, Tokens } from 'marked';

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.markdown'];

/**
 * Recursively convert marked inline AST tokens into Tiptap text nodes with marks.
 */
function convertInlineTokens(tokens?: Token[]): JSONContent[] {
  if (!tokens || tokens.length === 0) return [];

  const resultNodes: JSONContent[] = [];

  for (const token of tokens) {
    if (token.type === 'text') {
      const textToken = token as Tokens.Text;
      if (textToken.tokens && textToken.tokens.length > 0) {
        resultNodes.push(...convertInlineTokens(textToken.tokens));
      } else if (textToken.text) {
        resultNodes.push({
          type: 'text',
          text: textToken.text,
        });
      }
    } else if (token.type === 'strong') {
      const strongToken = token as Tokens.Strong;
      const innerContent = convertInlineTokens(strongToken.tokens);
      if (innerContent.length > 0) {
        for (const node of innerContent) {
          resultNodes.push({
            ...node,
            marks: [...(node.marks || []), { type: 'bold' }],
          });
        }
      } else if (strongToken.text) {
        resultNodes.push({
          type: 'text',
          text: strongToken.text,
          marks: [{ type: 'bold' }],
        });
      }
    } else if (token.type === 'em') {
      const emToken = token as Tokens.Em;
      const innerContent = convertInlineTokens(emToken.tokens);
      if (innerContent.length > 0) {
        for (const node of innerContent) {
          resultNodes.push({
            ...node,
            marks: [...(node.marks || []), { type: 'italic' }],
          });
        }
      } else if (emToken.text) {
        resultNodes.push({
          type: 'text',
          text: emToken.text,
          marks: [{ type: 'italic' }],
        });
      }
    } else if (token.type === 'codespan') {
      const codeToken = token as Tokens.Codespan;
      resultNodes.push({
        type: 'text',
        text: codeToken.text,
      });
    } else if ('text' in token && typeof token.text === 'string' && token.text) {
      resultNodes.push({
        type: 'text',
        text: token.text,
      });
    }
  }

  return resultNodes;
}

/**
 * Convert plain text into Tiptap JSON content.
 */
export function parseTextFile(rawText: string): JSONContent {
  const lines = rawText.split(/\r?\n/);
  const contentNodes: JSONContent[] = [];

  for (const line of lines) {
    if (line.trim().length > 0) {
      contentNodes.push({
        type: 'paragraph',
        content: [{ type: 'text', text: line }],
      });
    }
  }

  if (contentNodes.length === 0) {
    contentNodes.push({
      type: 'paragraph',
    });
  }

  return {
    type: 'doc',
    content: contentNodes,
  };
}

/**
 * Convert Markdown text into structured Tiptap JSON content.
 * Parses Headings (h1, h2, h3), Paragraphs, Bold, Italic, Bullet lists, and Ordered lists into Tiptap AST nodes.
 */
export function parseMarkdownFile(rawText: string): JSONContent {
  const tokens = marked.lexer(rawText);
  const contentNodes: JSONContent[] = [];

  for (const token of tokens) {
    if (token.type === 'heading') {
      const headingToken = token as Tokens.Heading;
      const level = Math.min(Math.max(headingToken.depth, 1), 3);
      const content = convertInlineTokens(headingToken.tokens);

      contentNodes.push({
        type: 'heading',
        attrs: { level },
        ...(content.length > 0 ? { content } : {}),
      });
    } else if (token.type === 'paragraph') {
      const paragraphToken = token as Tokens.Paragraph;
      const content = convertInlineTokens(paragraphToken.tokens);

      contentNodes.push({
        type: 'paragraph',
        ...(content.length > 0 ? { content } : {}),
      });
    } else if (token.type === 'list') {
      const listToken = token as Tokens.List;
      const isOrdered = listToken.ordered;
      const listType = isOrdered ? 'orderedList' : 'bulletList';

      const listItems: JSONContent[] = [];

      for (const item of listToken.items) {
        const itemTokens = item.tokens || [];
        const inlineContent: JSONContent[] = [];

        for (const subToken of itemTokens) {
          if (subToken.type === 'text' || subToken.type === 'paragraph') {
            const textOrPara = subToken as Tokens.Text | Tokens.Paragraph;
            if (textOrPara.tokens) {
              inlineContent.push(...convertInlineTokens(textOrPara.tokens));
            } else if (textOrPara.text) {
              inlineContent.push({ type: 'text', text: textOrPara.text });
            }
          } else {
            inlineContent.push(...convertInlineTokens([subToken]));
          }
        }

        listItems.push({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              ...(inlineContent.length > 0 ? { content: inlineContent } : {}),
            },
          ],
        });
      }

      if (listItems.length > 0) {
        contentNodes.push({
          type: listType,
          content: listItems,
        });
      }
    }
  }

  if (contentNodes.length === 0) {
    contentNodes.push({
      type: 'paragraph',
    });
  }

  return {
    type: 'doc',
    content: contentNodes,
  };
}

/**
 * Validates and processes a file object into a document title and Tiptap JSON content.
 */
export async function processImportFile(file: File): Promise<{ title: string; content: JSONContent }> {
  if (!file) {
    throw new Error('No file selected.');
  }

  if (file.size === 0) {
    throw new Error('File is empty.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File exceeds the maximum size limit of 2 MB.');
  }

  const nameParts = file.name.split('.');
  const ext = nameParts.length > 1 ? '.' + nameParts.pop()?.toLowerCase() : '';

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file type "${ext || file.name}". Supported formats: .txt, .md, .markdown`);
  }

  const title = nameParts.join('.').trim() || 'Imported Document';
  const rawText = await file.text();

  if (process.env.NODE_ENV === 'development') {
    console.log('[Import Diagnostics] 1. Raw file text:\n', rawText);
  }

  if (!rawText || rawText.trim().length === 0) {
    throw new Error('File content is empty.');
  }

  const isMarkdown = ext === '.md' || ext === '.markdown';
  const content = isMarkdown ? parseMarkdownFile(rawText) : parseTextFile(rawText);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Import Diagnostics] 2. Parsed Tiptap JSON:\n', JSON.stringify(content, null, 2));
  }

  return {
    title,
    content,
  };
}
