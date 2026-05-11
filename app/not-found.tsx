import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
      <Image
        src="/chika-404.png"
        alt="知佳"
        width={240}
        height={339}
        className="object-contain drop-shadow-md"
      />
      <p className="mt-6 text-5xl font-bold text-accent">404</p>
      <p className="mt-2 text-lg font-semibold">ページが見つかりません</p>
      <p className="mt-2 text-sm text-subtext">そのページはないみたいです…</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-6 py-2 text-sm text-subtext transition-colors hover:border-accent hover:text-accent"
      >
        ✦ トップへ戻る
      </Link>
    </div>
  );
}
