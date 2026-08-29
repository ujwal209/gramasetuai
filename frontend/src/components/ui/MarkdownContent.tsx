'use client';

import React from 'react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  if (!content) return null;

  // Split into structural blocks / lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-2 my-3 pl-1">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                <span className="font-mono text-muted-foreground select-none shrink-0">—</span>
                <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }} />
              </li>
            ))}
          </ul>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Heading 3: ###
    if (trimmed.startsWith('### ')) {
      flushList();
      const text = trimmed.replace(/^###\s+/, '');
      elements.push(
        <h4
          key={index}
          className="text-base sm:text-lg font-black text-foreground tracking-tight pt-3 pb-1 border-b border-border/60 first:pt-0"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(text) }}
        />
      );
      return;
    }

    // Heading 2: ##
    if (trimmed.startsWith('## ')) {
      flushList();
      const text = trimmed.replace(/^##\s+/, '');
      elements.push(
        <h3
          key={index}
          className="text-lg sm:text-xl font-black text-foreground tracking-tight pt-4 pb-1 border-b border-border first:pt-0"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(text) }}
        />
      );
      return;
    }

    // Heading 1: #
    if (trimmed.startsWith('# ')) {
      flushList();
      const text = trimmed.replace(/^#\s+/, '');
      elements.push(
        <h2
          key={index}
          className="text-xl sm:text-2xl font-black text-foreground tracking-tight pt-4 pb-2 border-b border-border first:pt-0"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(text) }}
        />
      );
      return;
    }

    // Blockquote: >
    if (trimmed.startsWith('> ')) {
      flushList();
      const text = trimmed.replace(/^>\s+/, '');
      elements.push(
        <div
          key={index}
          className="my-3 p-3.5 sm:p-4 rounded-xl bg-muted/40 border-l-3 border-foreground text-xs sm:text-sm text-foreground font-medium leading-relaxed"
        >
          <div dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(text) }} />
        </div>
      );
      return;
    }

    // Unordered List: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.replace(/^[-*]\s+/, '');
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      return;
    }

    // Paragraph
    flushList();
    elements.push(
      <p
        key={index}
        className="text-xs sm:text-sm text-foreground/90 leading-relaxed my-2"
        dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(trimmed) }}
      />
    );
  });

  flushList();

  return (
    <div className={`space-y-1 text-left ${className}`}>
      {elements}
    </div>
  );
}

/**
 * Parses inline formatting like **bold**, *italic*, `code`, and [links](url)
 */
function renderInlineMarkdown(text: string): string {
  let html = text;

  // Escape basic HTML to prevent injection
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="font-bold text-foreground">$1</strong>');

  // Italic: *text* or _text_
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-foreground/80">$1</em>');

  // Inline code: `text`
  html = html.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted border border-border text-xs font-mono font-bold">$1</code>');

  return html;
}
