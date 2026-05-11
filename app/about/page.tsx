import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-14">

      <section className="rounded-2xl border border-dashed border-border p-8 space-y-4">
        <h1 className="text-2xl font-bold">About</h1>
        <div>
          <p className="text-xl font-semibold">あるす</p>
          <p className="mt-1 text-foreground/70">社内SEやってる30代。よわよわエンジニアの美少女オタク。</p>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-subtext w-20 shrink-0">技術</dt>
            <dd>Ruby歴あり。最近はAIでvibe coding中。</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-subtext w-20 shrink-0">このブログ</dt>
            <dd>日記がわりにゆるく書いてます。</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-subtext w-20 shrink-0">Twitter</dt>
            <dd>
              <a
                href="https://twitter.com/snaruse0608"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                @snaruse0608
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-dashed border-border p-8">
        <h2 className="text-xl font-bold mb-6">
          <span className="text-accent mr-1.5">✦</span>キャラクター紹介
        </h2>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <div className="shrink-0">
            <Image
              src="/chika-about.webp"
              alt="知佳"
              width={200}
              height={260}
              className="object-contain [filter:drop-shadow(2px_6px_4px_rgba(122,95,160,0.55))_drop-shadow(0_2px_2px_rgba(122,95,160,0.4))]"
            />
          </div>
          <div className="space-y-3">
            <p className="text-xl font-semibold">知佳（ちか）</p>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-subtext w-20 shrink-0">属性</dt>
                <dd>静かでぼんやりした令嬢・やや小柄</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-subtext w-20 shrink-0">性格</dt>
                <dd>穏やかで反応が少し遅い。ぼーっとしてるけどやるときはちゃんとやる</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

    </div>
  );
}
