import { describe, it, expect } from 'vitest';
import {
  parseTextFile,
  parseMarkdownFile,
  processImportFile,
} from '../lib/fileImport';

describe('Phase 4.1 Markdown & File Import AST Parser', () => {
  it('1. # Heading → heading level 1', () => {
    const json = parseMarkdownFile('# Ajaia Notes');
    expect(json.type).toBe('doc');
    expect(json.content).toHaveLength(1);
    expect(json.content?.[0]).toEqual({
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Ajaia Notes' }],
    });
  });

  it('2. ## Heading → heading level 2', () => {
    const json = parseMarkdownFile('## Features');
    expect(json.type).toBe('doc');
    expect(json.content).toHaveLength(1);
    expect(json.content?.[0]).toEqual({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Features' }],
    });
  });

  it('3. **bold** → strong mark', () => {
    const json = parseMarkdownFile('This is **important**.');
    expect(json.type).toBe('doc');
    const paragraph = json.content?.[0];
    expect(paragraph?.type).toBe('paragraph');

    const textNodes = paragraph?.content;
    expect(textNodes).toHaveLength(3);
    expect(textNodes?.[0]).toEqual({ type: 'text', text: 'This is ' });
    expect(textNodes?.[1]).toEqual({
      type: 'text',
      text: 'important',
      marks: [{ type: 'bold' }],
    });
    expect(textNodes?.[2]).toEqual({ type: 'text', text: '.' });
  });

  it('4. *italic* → italic mark', () => {
    const json = parseMarkdownFile('This is *italic*.');
    expect(json.type).toBe('doc');
    const paragraph = json.content?.[0];
    expect(paragraph?.type).toBe('paragraph');

    const textNodes = paragraph?.content;
    expect(textNodes).toHaveLength(3);
    expect(textNodes?.[0]).toEqual({ type: 'text', text: 'This is ' });
    expect(textNodes?.[1]).toEqual({
      type: 'text',
      text: 'italic',
      marks: [{ type: 'italic' }],
    });
    expect(textNodes?.[2]).toEqual({ type: 'text', text: '.' });
  });

  it('5. - item → bullet list', () => {
    const json = parseMarkdownFile('- Document editing\n- File import');
    expect(json.type).toBe('doc');
    expect(json.content).toHaveLength(1);

    const bulletList = json.content?.[0];
    expect(bulletList?.type).toBe('bulletList');
    expect(bulletList?.content).toHaveLength(2);
    expect(bulletList?.content?.[0]).toEqual({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Document editing' }],
        },
      ],
    });
  });

  it('6. 1. item → ordered list', () => {
    const json = parseMarkdownFile('1. Create\n2. Edit\n3. Save');
    expect(json.type).toBe('doc');
    expect(json.content).toHaveLength(1);

    const orderedList = json.content?.[0];
    expect(orderedList?.type).toBe('orderedList');
    expect(orderedList?.content).toHaveLength(3);
    expect(orderedList?.content?.[0]).toEqual({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Create' }],
        },
      ],
    });
  });

  it('7. Normal paragraphs', () => {
    const json = parseMarkdownFile('Standard plain paragraph line.');
    expect(json.type).toBe('doc');
    expect(json.content?.[0]).toEqual({
      type: 'paragraph',
      content: [{ type: 'text', text: 'Standard plain paragraph line.' }],
    });
  });

  it('8. Multiple blocks preserve their exact order (test.md structure)', () => {
    const testMd = `# Ajaia Notes
This is **important**.
## Features
- Document editing
- File import
- Persistence
1. Create
2. Edit
3. Save`;

    const json = parseMarkdownFile(testMd);
    expect(json.type).toBe('doc');
    expect(json.content).toHaveLength(5);

    // 1. Heading 1
    expect(json.content?.[0]?.type).toBe('heading');
    expect(json.content?.[0]?.attrs?.level).toBe(1);

    // 2. Paragraph with bold mark
    expect(json.content?.[1]?.type).toBe('paragraph');
    expect(json.content?.[1]?.content?.[1]?.marks).toEqual([{ type: 'bold' }]);

    // 3. Heading 2
    expect(json.content?.[2]?.type).toBe('heading');
    expect(json.content?.[2]?.attrs?.level).toBe(2);

    // 4. Bullet List
    expect(json.content?.[3]?.type).toBe('bulletList');
    expect(json.content?.[3]?.content).toHaveLength(3);

    // 5. Ordered List
    expect(json.content?.[4]?.type).toBe('orderedList');
    expect(json.content?.[4]?.content).toHaveLength(3);
  });

  it('9. Unsupported extension is rejected', async () => {
    const mockFile = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
    await expect(processImportFile(mockFile)).rejects.toThrow(
      'Unsupported file type ".pdf". Supported formats: .txt, .md, .markdown'
    );
  });

  it('10. Empty file is rejected', async () => {
    const emptyFile = new File([''], 'notes.txt', { type: 'text/plain' });
    await expect(processImportFile(emptyFile)).rejects.toThrow('File is empty.');
  });
});
