---
title: MarkdownのURLをYouTube埋め込みに自動変換する仕組み
date: 2026-05-02
tags: [技術, Next.js, MDX]
summary: remark-gfmとMDXのコンポーネントオーバーライドを使って、Markdownに貼ったYouTubeのURLを自動でサムネイル＋埋め込みプレイヤーに変換する仕組みの解説。
---

このブログはMarkdownにYouTubeのURLをそのまま貼るだけで、サムネイル付きのプレイヤーに自動変換されます。

```
https://www.youtube.com/watch?v=xxxxxxxxxx
```

↓こうなる（サムネをクリックするとその場で再生）

https://www.youtube.com/watch?v=ANZ2qYtKdMA

仕組みを順番に説明します。

## Step 1：remark-gfm が裸URLを `<a>` タグに変換する

Markdownのパーサーは、デフォルトでは `https://...` のような裸のURLをリンクとして認識しません。

`remark-gfm` というプラグインを使うと、GFM（GitHub Flavored Markdown）の仕様に従って裸URLが自動的に `<a>` タグに変換されます。

```js
// next-mdx-remote に渡すオプション
options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
```

これによって、Markdownの `https://youtube.com/watch?v=xxx` は内部的に以下のHTMLと同等になります。

```html
<a href="https://youtube.com/watch?v=xxx">
  https://youtube.com/watch?v=xxx
</a>
```

## Step 2：MDXRemote の `components` で `<a>` をオーバーライドする

`next-mdx-remote` の `<MDXRemote>` は `components` というプロップを受け取ります。ここにHTMLタグ名をキーとしたコンポーネントを渡すと、記事内のそのタグがすべて差し替わります。

```tsx
const mdxComponents = { pre: Pre, h2: H2, h3: H3, a: A };

<MDXRemote source={post.content} components={mdxComponents} />
```

`a: A` と書くことで、記事内のすべての `<a>` タグが自前の `A` コンポーネントを経由するようになります。

## Step 3：`A` コンポーネントが URL を判定して分岐する

```tsx
function A({ href, children }: React.ComponentPropsWithoutRef<"a">) {
  if (href && /youtube\.com\/watch|youtu\.be\//.test(href)) {
    return <YouTubeCard href={href} />;
  }
  return <a href={href}>{children}</a>;
}
```

`href` が YouTube の URL にマッチする場合は `<YouTubeCard>` を返し、それ以外は普通の `<a>` をそのまま返します。

正規表現は `youtube.com/watch` と `youtu.be/` の2パターンに対応しています。

## Step 4：YouTubeCard がサムネ→iframe を切り替える

`YouTubeCard` はクライアントコンポーネントで、`useState` で再生状態を管理します。

```tsx
"use client";

function extractVideoId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

export default function YouTubeCard({ href }: { href: string }) {
  const videoId = extractVideoId(href);
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} />;
  }

  return (
    <button onClick={() => setPlaying(true)}>
      <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} />
      {/* 再生ボタンのオーバーレイ */}
    </button>
  );
}
```

**サムネイル画像のURL** は YouTube が公式に提供しているもので、動画IDさえ分かれば `https://img.youtube.com/vi/{videoId}/hqdefault.jpg` で取得できます。APIキーも不要です。

**iframe の `?autoplay=1`** は、クリックして初めてiframeが生成されるため有効です。最初からiframeを描画してしまうと自動再生ブロックにかかるので、このタイミングでURLに付けるのが正しい使い方です。

## なぜこの方法が便利か

一番のポイントは **Markdownファイルを汚さないこと** です。

JSXを使ったMDXでは `<YouTubeEmbed id="xxx" />` のようにコンポーネントを直接書く方法もよく見かけますが、その場合は記事ごとに書き方を覚える必要があり、URLをそのままコピペするだけでは動きません。

今回の方法はパーサーレベルで変換しているので、書き手はURLを貼るだけでよく、見た目の差分も出ません。

既存の記事も含めてすべてに自動で適用されるのも地味に便利な点です。
