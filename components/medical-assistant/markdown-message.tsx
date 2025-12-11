// components/medical-assistant/markdown-message.tsx
"use client";

import React from 'react';

interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  // Procesar el markdown manualmente para mejor control
  const processMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];
    let isInList = false;
    let sectionIndex = 0;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${sectionIndex++}`} className="space-y-2 my-3 ml-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                  isUser ? 'bg-primary-foreground/60' : 'bg-primary/70'
                }`}></span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
        isInList = false;
      }
    };

    lines.forEach((line, idx) => {
      // Headers (##, ###)
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h4 key={`h4-${idx}`} className={`font-semibold text-base mt-4 mb-2 ${
            isUser ? 'text-primary-foreground' : 'text-foreground'
          }`}>
            {line.replace('### ', '')}
          </h4>
        );
      } else if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${idx}`} className={`font-bold text-lg mt-5 mb-3 ${
            isUser ? 'text-primary-foreground' : 'text-foreground'
          }`}>
            {line.replace('## ', '')}
          </h3>
        );
      }
      // Bold text (**text**)
      else if (line.match(/\*\*.*?\*\*/)) {
        flushList();
        const parts = line.split(/(\*\*.*?\*\*)/);
        elements.push(
          <p key={`p-${idx}`} className="leading-relaxed my-2">
            {parts.map((part, partIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={partIdx} className={`font-semibold ${
                    isUser ? 'text-primary-foreground' : 'text-foreground'
                  }`}>
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={partIdx}>{part}</span>;
            })}
          </p>
        );
      }
      // List items (* or - at start)
      else if (line.trim().match(/^[*\-]\s+/)) {
        isInList = true;
        listItems.push(line.trim().replace(/^[*\-]\s+/, ''));
      }
      // Empty lines
      else if (line.trim() === '') {
        flushList();
        if (elements.length > 0 && idx < lines.length - 1) {
          elements.push(<div key={`space-${idx}`} className="h-2" />);
        }
      }
      // Regular text
      else if (line.trim()) {
        flushList();
        elements.push(
          <p key={`text-${idx}`} className="leading-relaxed my-2">
            {line}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className={`text-sm sm:text-base ${
      isUser ? 'text-primary-foreground' : 'text-foreground'
    }`}>
      {processMarkdown(content)}
    </div>
  );
}
