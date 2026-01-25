import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const normalizeLLMText = (text) => {
  if (!text) return '';
  let t = text;

  // Normalize Windows line endings
  t = t.replace(/\r\n/g, '\n');

  // Replace big star or asterisk art lines with a horizontal rule
  t = t.replace(/^\s*[\*☆★]{4,}\s*$/gm, '\n\n---\n\n');

  // Convert leading *, •, -, + bullets to a unified markdown '- '
  t = t.replace(/^\s*[•\-\+\*]\s+/gm, '- ');

  // Fix triple/quad bold markers into markdown bold
  t = t.replace(/\*{3,}([^*]+)\*{3,}/g, '**$1**');

  // Remove stray double asterisks at edges or alone on a line
  t = t.replace(/(^|\s)\*\*(?=\s|$)/g, '$1');
  t = t.replace(/^\*\*\s*$/gm, '');

  // Remove lone asterisks at line ends
  t = t.replace(/\s*\*+\s*$/gm, '');

  // Normalize numbered lists like `1)` to `1.`
  t = t.replace(/^(\s*)(\d+)\)\s+/gm, '$1$2. ');

  // Ensure spacing after headings like `##Title` -> `## Title`
  t = t.replace(/^(#{1,6})([^#\s])/gm, '$1 $2');

  // Add blank line after headings if immediately followed by text
  t = t.replace(/^(#{1,6}[^\n]+)\n(\S)/gm, '$1\n\n$2');

  return t.trim();
};

export default function MarkdownRenderer({ content }) {
  const cleaned = React.useMemo(() => normalizeLLMText(content), [content]);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => (
          <h1 className="text-base font-semibold mb-2" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-base font-semibold mt-2 mb-1" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc pl-5 space-y-1" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal pl-5 space-y-1" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="marker:text-white/70" {...props} />
        ),
        code: ({ inline, className, children, ...props }) => (
          <code
            className={`rounded bg-black/30 px-1.5 py-0.5 ${className || ''}`}
            {...props}
          >
            {children}
          </code>
        ),
        p: ({ node, ...props }) => (
          <p className="mb-2 last:mb-0" {...props} />
        ),
        hr: () => <div className="my-3 h-px bg-white/20" />,
      }}
    >
      {cleaned}
    </ReactMarkdown>
  );
}
