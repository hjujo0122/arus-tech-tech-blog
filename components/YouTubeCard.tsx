"use client";

import { useState } from "react";

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function YouTubeCard({ href }: { href: string }) {
  const videoId = extractVideoId(href);
  const [playing, setPlaying] = useState(false);

  if (!videoId) return <a href={href}>{href}</a>;

  if (playing) {
    return (
      <span className="block my-4 overflow-hidden rounded-xl aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
          style={{ aspectRatio: "16/9", width: "100%", display: "block" }}
        />
      </span>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="group relative block w-full my-4 overflow-hidden rounded-xl bg-black"
      aria-label="YouTube動画を再生"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        className="w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
        style={{ aspectRatio: "16/9" }}
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-xl group-hover:scale-110 transition-transform">
          <svg viewBox="0 0 24 24" fill="white" className="h-6 w-6 ml-1">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
