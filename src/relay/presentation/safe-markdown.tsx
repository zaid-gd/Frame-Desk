import type { ReactNode } from "react";

function visibleText(value: string) {
  return value.replace(/<[^>]*>/g, "");
}

function inlineMarkdown(value: string): ReactNode[] {
  return visibleText(value).split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part,
  );
}

/** Renders a small safe Markdown subset as React text nodes; raw HTML never enters the DOM. */
export function SafeMarkdown({ source }: { source: string }) {
  return <div>{source.split(/\n{2,}/).map((block, index) => {
    const text = block.trim();
    if (!text) return null;
    if (text.startsWith("# ")) return <h1 key={index}>{inlineMarkdown(text.slice(2))}</h1>;
    if (text.startsWith("## ")) return <h2 key={index}>{inlineMarkdown(text.slice(3))}</h2>;
    return <p key={index}>{inlineMarkdown(text.replace(/\n/g, " "))}</p>;
  })}</div>;
}
