"use client";

import { useState } from "react";

export default function CopyArticleButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const prose = document.querySelector("article .prose");
    if (!prose) return;
    await navigator.clipboard.writeText((prose as HTMLElement).innerText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-4 py-1.5 text-sm text-subtext transition-colors hover:border-accent hover:text-accent"
    >
      {copied ? "✓ コピーしました" : "記事を全文コピー"}
    </button>
  );
}
