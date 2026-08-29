'use client';

import React from 'react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = '';

  let tableRows: string[] = [];
  let inTable = false;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`} className="space-y-2 my-3 pl-1">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-800 leading-relaxed">
                <span className="text-emerald-700 font-bold select-none shrink-0">•</span>
                <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }} />
              </li>
            ))}
          </ul>
        );
      } else if (currentList.type === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="space-y-2 my-3 pl-1">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-800 leading-relaxed">
                <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded select-none shrink-0">
                  {idx + 1}
                </span>
                <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }} />
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const parsedRows = tableRows
        .map((r) =>
          r
            .trim()
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((cell) => cell.trim())
        )
        .filter((r) => r.length > 0 && !r.every((c) => /^[-:]+$/.test(c)));

      if (parsedRows.length > 0) {
        const headerRow = parsedRows[0];
        const bodyRows = parsedRows.slice(1);

        elements.push(
          <div key={`table-${elements.length}`} className="my-4 overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {headerRow.map((cell, cIdx) => (
                    <th
                      key={cIdx}
                      className="px-3.5 py-2.5 font-bold text-slate-900 border-r last:border-r-0 border-slate-200"
                      dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(cell) }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/50 transition">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-3.5 py-2 text-slate-700 border-r last:border-r-0 border-slate-100 leading-normal"
                        dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(cell) }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableRows = [];
      inTable = false;
    }
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const trimmed = line.trim();

    // Code Block Toggle
    if (trimmed.startsWith('```')) {
      flushList();
      flushTable();
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${index}`} className="my-3 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-xs shadow-xs">
            {codeBlockLang && (
              <div className="px-3.5 py-1.5 bg-slate-950 border-b border-slate-800 text-[10px] font-mono text-slate-400 font-bold uppercase">
                {codeBlockLang}
              </div>
            )}
            <pre className="p-4 text-emerald-400 font-mono overflow-x-auto leading-relaxed">
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockLines = [];
        codeBlockLang = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockLang = trimmed.replace(/^```/, '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Markdown Table Row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      tableRows.push(trimmed);
      inTable = true;
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (!trimmed) {
      flushList();
      flushTable();
      continue;
    }

    // Horizontal Rule: --- or ***
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList();
      flushTable();
      elements.push(<hr key={index} className="my-5 border-t border-slate-200" />);
      continue;
    }

    // Heading 4: ####
    if (trimmed.startsWith('#### ')) {
      flushList();
      flushTable();
      const text = trimmed.replace(/^####\s+/, '');
      elements.push(
        <h5
          key={index}
          className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight pt-3 pb-1"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(text) }}
        />
      );
      continue;
    }

    // Heading 3: ###
    if (trimmed.startsWith('### ')) {
      flushList();
      flushTable();
      const text = trimmed.replace(/^###\s+/, '');
      elements.push(
        <h4
          key={index}
          className="text-xs sm:text-sm font-black text-slate-900 tracking-tight pt-4 pb-1 border-b border-slate-100 first:pt-0"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(text) }}
        />
      );
      continue;
    }

    // Heading 2: ##
    if (trimmed.startsWith('## ')) {
      flushList();
      flushTable();
      const text = trimmed.replace(/^##\s+/, '');
      elements.push(
        <h3
          key={index}
          className="text-sm sm:text-base font-black text-slate-900 tracking-tight pt-5 pb-1 border-b border-slate-200 first:pt-0"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(text) }}
        />
      );
      continue;
    }

    // Heading 1: #
    if (trimmed.startsWith('# ')) {
      flushList();
      flushTable();
      const text = trimmed.replace(/^#\s+/, '');
      elements.push(
        <h2
          key={index}
          className="text-base sm:text-lg font-black text-slate-900 tracking-tight pt-6 pb-2 border-b border-slate-200 first:pt-0"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(text) }}
        />
      );
      continue;
    }

    // Unordered List item: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushTable();
      const itemText = trimmed.replace(/^[-*]\s+/, '');
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    // Ordered List item: 1. or 2.
    if (/^\d+\.\s+/.test(trimmed)) {
      flushTable();
      const itemText = trimmed.replace(/^\d+\.\s+/, '');
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList();
      flushTable();
      const text = trimmed.replace(/^>\s+/, '');
      elements.push(
        <blockquote
          key={index}
          className="border-l-4 border-emerald-600 bg-emerald-50/50 p-3.5 rounded-r-2xl my-3 text-xs sm:text-sm text-slate-800 font-medium italic"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(text) }}
        />
      );
      continue;
    }

    // LaTeX Display Math Block: $$ ... $$
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
      flushList();
      flushTable();
      const mathExpr = trimmed.slice(2, -2).trim();
      elements.push(
        <div
          key={index}
          className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono text-xs sm:text-sm font-semibold text-emerald-950 overflow-x-auto"
        >
          {mathExpr}
        </div>
      );
      continue;
    }

    // Regular Paragraph
    flushList();
    flushTable();
    elements.push(
      <p
        key={index}
        className="text-xs sm:text-sm text-slate-800 leading-relaxed my-2 font-normal"
        dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(trimmed) }}
      />
    );
  }

  flushList();
  flushTable();

  return (
    <div className={`space-y-1 text-left leading-relaxed text-slate-800 ${className}`}>
      {elements}
    </div>
  );
}

function renderInlineMarkdown(text: string): string {
  if (!text) return '';

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Markdown Links: [text](url)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-700 font-bold hover:underline inline-flex items-center gap-0.5">$1<span class="text-[10px]">↗</span></a>'
  );

  // LaTeX Inline Math: $math$ or \(math\)
  html = html.replace(
    /\$([^\$]+)\$/g,
    '<span class="font-mono text-xs px-1 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold">$1</span>'
  );

  // Bold + Italic: ***text***
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold text-slate-900"><em>$1</em></strong>');

  // Bold: **text**
  html = html.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-bold text-slate-900">$1</strong>'
  );

  // Italic: *text* or _text_
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>');

  // Inline Code: `code`
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded font-mono text-[11px] bg-slate-100 border border-slate-200 text-emerald-800 font-bold">$1</code>'
  );

  return html;
}
