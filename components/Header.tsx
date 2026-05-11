"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-2xl px-4 py-2 flex items-end justify-between">
        <Link href="/" className="flex items-end gap-3 group" onClick={() => setOpen(false)}>
          <Image
            src="/chika-header.webp"
            alt="知佳"
            width={40}
            height={52}
            className="object-contain"
          />
          <span className="text-lg font-bold tracking-tight pb-2 transition-colors group-hover:text-accent whitespace-nowrap">
            あるすのてくてくブログ
          </span>
        </Link>

        {/* デスクトップナビ */}
        <nav className="hidden sm:flex items-end gap-4 pb-2">
          <Link href="/about" className="text-sm text-subtext hover:text-accent transition-colors">
            About
          </Link>
          <Link href="/game" className="text-sm text-subtext hover:text-accent transition-colors">
            ⚡ Game
          </Link>
        </nav>

        {/* ハンバーガーボタン（モバイルのみ） */}
        <button
          className="sm:hidden pb-2 text-subtext hover:text-accent transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label="メニューを開く"
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* オーバーレイ */}
      <div
        className={`sm:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />

      {/* 右からスライドするドロワー */}
      <nav
        className={`sm:hidden fixed top-0 right-0 h-full w-56 z-50 bg-background border-l border-border shadow-lg flex flex-col pt-16 px-6 gap-6 transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <Link href="/" className="text-base text-subtext hover:text-accent transition-colors" onClick={() => setOpen(false)}>
          記事一覧
        </Link>
        <Link href="/about" className="text-base text-subtext hover:text-accent transition-colors" onClick={() => setOpen(false)}>
          About
        </Link>
        <Link href="/game" className="text-base text-subtext hover:text-accent transition-colors" onClick={() => setOpen(false)}>
          ⚡ Game
        </Link>
      </nav>
    </header>
  );
}
