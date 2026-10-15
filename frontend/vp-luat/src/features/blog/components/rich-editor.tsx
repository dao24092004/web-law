'use client';

import { useEffect, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Unlink,
} from 'lucide-react';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  storageKey?: string;
  onUploadImage?: (file: File) => Promise<string>;
  minHeight?: number;
  readOnly?: boolean;
}

interface ToolbarButtonProps {
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ isActive, disabled, onClick, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      className={`rich-editor__btn${isActive ? ' rich-editor__btn--active' : ''}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="rich-editor__divider" aria-hidden="true" />;
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', previousUrl ?? 'https://');

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url, target: '_blank', rel: 'noopener noreferrer' })
      .run();
  };

  const addImageFromUrl = () => {
    const url = window.prompt('URL hình ảnh', 'https://');
    if (!url) return;
    editor.chain().focus().setImage({ src: url, alt: '' }).run();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    event.target.value = '';
  };

  return (
    <div className="rich-editor__toolbar" role="toolbar" aria-label="Định dạng văn bản">
      <ToolbarButton
        title="Bold (Ctrl+B)"
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Italic (Ctrl+I)"
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={15} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Heading 1"
        isActive={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        isActive={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        isActive={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={15} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Bullet list"
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Ordered list"
        isActive={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Blockquote"
        isActive={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Code block"
        isActive={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Inline code"
        isActive={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={15} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Link"
        isActive={editor.isActive('link')}
        onClick={setLink}
      >
        <LinkIcon size={15} />
      </ToolbarButton>
      {editor.isActive('link') && (
        <ToolbarButton
          title="Bỏ link"
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Unlink size={15} />
        </ToolbarButton>
      )}
      <ToolbarButton title="Thêm ảnh từ URL" onClick={addImageFromUrl}>
        <ImageIcon size={15} />
      </ToolbarButton>
      <label
        className="rich-editor__btn"
        title="Tải ảnh lên"
        aria-label="Tải ảnh lên"
      >
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        <span style={{ fontSize: 11, fontWeight: 700 }}>Upload</span>
      </label>

      <ToolbarDivider />

      <ToolbarButton
        title="Undo (Ctrl+Z)"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Redo (Ctrl+Y)"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo size={15} />
      </ToolbarButton>
    </div>
  );
}

export function RichEditor({
  value,
  onChange,
  placeholder = 'Bắt đầu viết nội dung...',
  storageKey = 'blog-draft',
  minHeight = 280,
  readOnly = false,
}: RichEditorProps) {
  const lastValueRef = useRef(value);
  const draftSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: 'noopener noreferrer',
            target: '_blank',
            class: 'rich-editor__link',
          },
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: 'rich-editor__image' },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastValueRef.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === lastValueRef.current) return;
    if (value === editor.getHTML()) return;
    lastValueRef.current = value;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    if (!editor || readOnly) return;
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!editor.isEmpty && editor.getHTML() !== value) {
        try {
          window.sessionStorage.setItem(storageKey, editor.getHTML());
        } catch {
          // ignore storage errors
        }
        e.preventDefault();
        e.returnValue = '';
      }
    };

    draftSaveTimerRef.current = setInterval(() => {
      if (!editor.isEmpty) {
        try {
          window.sessionStorage.setItem(storageKey, editor.getHTML());
        } catch {
          // ignore storage errors
        }
      }
    }, 30000);

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (draftSaveTimerRef.current) {
        clearInterval(draftSaveTimerRef.current);
        draftSaveTimerRef.current = null;
      }
    };
  }, [editor, storageKey, value, readOnly]);

  if (!editor) {
    return (
      <div
        className="rich-editor rich-editor--loading"
        style={{ minHeight }}
        aria-busy="true"
        aria-label="Đang tải trình soạn thảo"
      />
    );
  }

  return (
    <div className="rich-editor" data-readonly={readOnly}>
      {!readOnly && <Toolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="rich-editor__content"
        style={{ minHeight }}
      />
      <div className="rich-editor__footer">
        <span className="rich-editor__word-count">
          {editor.getText().length} ký tự
        </span>
      </div>
    </div>
  );
}

export function loadDraft(storageKey = 'blog-draft'): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function clearDraft(storageKey = 'blog-draft'): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}
