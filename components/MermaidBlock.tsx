'use client';

import { useEffect, useId, useState } from 'react';

export default function MermaidBlock({ children }: { children: string }) {
  const id = useId().replace(/:/g, '');
  const [svg, setSvg] = useState('');

  useEffect(() => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    import('mermaid').then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: dark ? 'dark' : 'default',
      });
      m.default.render(`mermaid-${id}`, children.trim()).then((result) => {
        setSvg(result.svg);
      });
    });
  }, [children, id]);

  if (!svg) return null;
  return (
    <div
      className="my-6 flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
