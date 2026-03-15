'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  onUploadImage?: (file: File) => Promise<string>;
  /** compact=true shows only comment-relevant tools (B/I/Quote/Image) */
  compact?: boolean;
}

// ── Inline URL popover ─────────────────────────────────────────────────────
function InlinePopover({
  label,
  placeholder,
  defaultValue,
  onConfirm,
  onClose,
}: {
  label: string;
  placeholder: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(defaultValue || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onConfirm(value); }
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-800">
      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
        <button
          type="button"
          onClick={() => onConfirm(value)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2,8 6,12 14,4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="3" x2="13" y2="13" /><line x1="13" y1="3" x2="3" y2="13" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Icon set ───────────────────────────────────────────────────────────────
const Icons = {
  Bold:        () => <span className="text-[13px] font-black leading-none select-none">B</span>,
  Italic:      () => <span className="text-[13px] italic font-semibold leading-none select-none font-serif">I</span>,
  Strike:      () => <span className="text-[13px] font-semibold leading-none select-none line-through">S</span>,
  BulletList:  () => (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="3" cy="4.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="11.5" r="1" fill="currentColor" stroke="none" />
      <line x1="6" y1="4.5" x2="14" y2="4.5" />
      <line x1="6" y1="8" x2="14" y2="8" />
      <line x1="6" y1="11.5" x2="14" y2="11.5" />
    </svg>
  ),
  OrderedList: () => <span className="text-[11px] font-bold leading-none select-none">1.</span>,
  Quote: () => (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M6 4C4.343 4 3 5.343 3 7v2c0 1.657 1.343 3 3 3h.5L5 15h2l2-4V7c0-1.657-1.343-3-3-3zm8 0c-1.657 0-3 1.343-3 3v2c0 1.657 1.343 3 3 3h.5L13 15h2l2-4V7c0-1.657-1.343-3-3-3z" />
    </svg>
  ),
  Code: () => (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5,4 1,8 5,12" />
      <polyline points="11,4 15,8 11,12" />
    </svg>
  ),
  CodeBlock: () => (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="14" height="12" rx="2" />
      <line x1="1" y1="6" x2="15" y2="6" />
      <polyline points="4,9.5 6,8 4,6.5" />
      <line x1="7.5" y1="9.5" x2="11" y2="9.5" />
    </svg>
  ),
  Link: () => (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101" transform="translate(0,-2)" />
      <path d="M6.172 9.828a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" transform="translate(0,-2)" />
    </svg>
  ),
  Image: () => (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <circle cx="7" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <path d="M2 14l4-4 3 3 3-3 6 6" />
    </svg>
  ),
  Undo: () => (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7H11a3 3 0 0 1 0 6H8" />
      <polyline points="6,4 3,7 6,10" />
    </svg>
  ),
  Redo: () => (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 7H5a3 3 0 0 0 0 6H8" />
      <polyline points="10,4 13,7 10,10" />
    </svg>
  ),
  Spinner: () => (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
  ),
};

// ── Toolbar separator ──────────────────────────────────────────────────────
const Sep = () => <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-600" />;

// ── Toolbar button factory ─────────────────────────────────────────────────
const makeBtn = (active: boolean, disabled = false) =>
  [
    'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
    active
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200',
    disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
  ].join(' ');

// ── Main component ─────────────────────────────────────────────────────────
export default function RichTextEditor({
  content,
  onChange,
  placeholder = '写下你的内容...',
  className = '',
  onUploadImage,
  compact = false,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [popover, setPopover] = useState<'link' | 'image-url' | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: true, allowBase64: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: `focus:outline-none p-4 text-gray-900 dark:text-gray-100 ${className}`,
        'data-placeholder': placeholder,
      },
    },
    immediatelyRender: false,
  });

  // Sync external content changes
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (!content) {
      if (current !== '' && current !== '<p></p>') editor.commands.clearContent(true);
      return;
    }
    if (content !== current) editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  // Close popover on outside click
  useEffect(() => {
    if (!popover) return;
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) setPopover(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popover]);

  if (!editor) return null;

  const handleLinkConfirm = (url: string) => {
    setPopover(null);
    if (!url) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    let finalUrl = url.trim();
    if (finalUrl && !/^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(finalUrl)) finalUrl = `https://${finalUrl}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
  };

  const handleImageUrlConfirm = (url: string) => {
    setPopover(null);
    if (url.trim()) editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const handleUploadClick = () => {
    if (onUploadImage) fileInputRef.current?.click();
    else setPopover(popover === 'image-url' ? null : 'image-url');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUploadImage) return;
    try {
      setIsUploading(true);
      const url = await onUploadImage(file);
      if (url) editor.chain().focus().setImage({ src: url }).run();
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-900/30">
      {/* ── Toolbar ── */}
      <div
        ref={toolbarRef}
        className="relative flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-gray-50/80 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900/40"
      >
        {/* Group: text style */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().toggleBold()}
          className={makeBtn(editor.isActive('bold'), !editor.can().toggleBold())} title="粗体 (Ctrl+B)">
          <Icons.Bold />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().toggleItalic()}
          className={makeBtn(editor.isActive('italic'), !editor.can().toggleItalic())} title="斜体 (Ctrl+I)">
          <Icons.Italic />
        </button>

        {!compact && (
          <>
            <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().toggleStrike()}
              className={makeBtn(editor.isActive('strike'), !editor.can().toggleStrike())} title="删除线">
              <Icons.Strike />
            </button>

            <Sep />

            {/* Group: headings */}
            {([1, 2, 3] as const).map((level) => (
              <button key={level} type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
                className={`${makeBtn(editor.isActive('heading', { level }))} w-auto px-1.5 text-[11px] font-bold`}
                title={`标题 ${level}`}>
                H{level}
              </button>
            ))}

            <Sep />

            {/* Group: lists */}
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={makeBtn(editor.isActive('bulletList'))} title="无序列表">
              <Icons.BulletList />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={makeBtn(editor.isActive('orderedList'))} title="有序列表">
              <Icons.OrderedList />
            </button>

            <Sep />

            {/* Group: blocks */}
            <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={makeBtn(editor.isActive('blockquote'))} title="引用">
              <Icons.Quote />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={!editor.can().toggleCode()}
              className={makeBtn(editor.isActive('code'), !editor.can().toggleCode())} title="行内代码">
              <Icons.Code />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={makeBtn(editor.isActive('codeBlock'))} title="代码块">
              <Icons.CodeBlock />
            </button>

            <Sep />

            {/* Group: media */}
            <button type="button"
              onClick={() => setPopover(popover === 'link' ? null : 'link')}
              className={makeBtn(editor.isActive('link') || popover === 'link')} title="插入链接">
              <Icons.Link />
            </button>
          </>
        )}

        {compact && <Sep />}

        {!compact && (
          <button type="button" onClick={handleUploadClick} disabled={isUploading}
            className={makeBtn(popover === 'image-url', isUploading)} title={isUploading ? '上传中...' : '插入图片'}>
            {isUploading ? <Icons.Spinner /> : <Icons.Image />}
          </button>
        )}

        {compact && (
          <>
            <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={makeBtn(editor.isActive('blockquote'))} title="引用">
              <Icons.Quote />
            </button>
            <button type="button" onClick={handleUploadClick} disabled={isUploading}
              className={makeBtn(popover === 'image-url', isUploading)} title={isUploading ? '上传中...' : '插入图片'}>
              {isUploading ? <Icons.Spinner /> : <Icons.Image />}
            </button>
          </>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {!compact && (
          <>
            <Sep />
            {/* Group: history */}
            <button type="button" onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className={makeBtn(false, !editor.can().undo())} title="撤销 (Ctrl+Z)">
              <Icons.Undo />
            </button>
            <button type="button" onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className={makeBtn(false, !editor.can().redo())} title="重做 (Ctrl+Y)">
              <Icons.Redo />
            </button>
          </>
        )}

        {/* Popovers */}
        {popover === 'link' && (
          <InlinePopover label="插入链接" placeholder="https://example.com"
            defaultValue={editor.getAttributes('link').href || ''}
            onConfirm={handleLinkConfirm} onClose={() => setPopover(null)} />
        )}
        {popover === 'image-url' && (
          <InlinePopover label="插入图片链接" placeholder="https://example.com/image.png"
            onConfirm={handleImageUrlConfirm} onClose={() => setPopover(null)} />
        )}
      </div>

      {/* ── Editor content ── */}
      <EditorContent editor={editor} className="min-h-[120px] max-w-none" />
    </div>
  );
}
