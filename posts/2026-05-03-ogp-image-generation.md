---
title: OGP画像を記事ごとに自動生成した話
date: 2026-05-03
tags: [技術, Next.js, OGP]
summary: next/ogのImageResponseを使って、ビルド時に記事タイトル入りのOGP画像を自動生成する仕組みの解説。Static Exportとの組み合わせで詰まったポイントも含めて。
---

SNSでリンクをシェアしたときに出るカード画像（OGP画像）を、記事ごとに自動生成する仕組みを入れました。

生成される画像はこんな感じです。

![生成されたOGP画像のサンプル](/posts/2026-05-03-ogp-image-generation/ogp-sample.webp)

実装前は全記事で同じ画像（サイトのデフォルト画像）が使われていましたが、記事ごとにタイトルが入った画像が生成されるようになりました。

## いつ・どうやって生成されるのか

OGP画像はSNSにシェアされたタイミングではなく、**ビルド時（`npm run build`）に生成**されます。

流れはこうです。

1. 記事の Markdown ファイルを追加する
2. `npm run build` を実行する
3. Next.js が記事ページのHTMLと一緒に、記事ごとのOGP画像（PNG）も生成する
4. Firebase にデプロイする
5. SNSでシェアされると、生成済みのOGP画像が表示される

つまり、記事を書くたびに自動でOGP画像も作られるので、画像を手作りする必要がありません。仕組みを一度入れてしまえば、以後は何もしなくてOKです。

## 使うもの

Next.js には `next/og` という組み込みのパッケージがあり、JSXを使って画像を生成できます。内部的には [satori](https://github.com/vercel/satori) と resvg を使っており、HTMLとCSSのサブセットをPNGに変換してくれます。

```tsx
import { ImageResponse } from 'next/og'

export default function Image() {
  return new ImageResponse(
    <div style={{ fontSize: 64, background: 'white' }}>
      Hello World
    </div>
  )
}
```

## ファイルの置き場所

Next.js の App Router では、`opengraph-image.tsx` というファイルを route フォルダに置くだけで自動的にOGP画像として認識されます。

```
app/
  posts/
    [slug]/
      page.tsx
      opengraph-image.tsx  ← これを追加
```

動的ルートの場合、各スラッグに対して画像が生成されます。

## Static Export との組み合わせで詰まった点

このブログは `output: 'export'` の Static Export を使っているので、いくつか追加の設定が必要でした。

**1. `dynamic = "force-static"` が必要**

```ts
export const dynamic = 'force-static'
```

これがないとビルド時に以下のエラーが出ます。

```
Error: export const dynamic = "force-static"/export const revalidate
not configured on route "/posts/[slug]/opengraph-image"
```

**2. `generateStaticParams` も必要**

ページの `page.tsx` に `generateStaticParams` を書いていても、`opengraph-image.tsx` は別ファイルとして扱われるので、こちらにも書く必要がありました。

```ts
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}
```

## フォントの扱い

日本語タイトルを画像に入れるにはフォントの指定が必要です。satori はデフォルトでは日本語グリフを持っていないため、何も指定しないと文字が豆腐（□）になります。

`ImageResponse` の第2引数に `fonts` オプションでフォントデータを渡します。

```ts
return new ImageResponse(jsx, {
  ...size,
  fonts: [
    { name: 'Noto Sans JP', data: fontData, weight: 700, style: 'normal' },
  ],
})
```

フォントファイル（woff形式）は `public/fonts/` に置いて、`fs.readFileSync` で読み込んでいます。

```ts
function loadFont(filename: string): ArrayBuffer {
  const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', filename))
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}
```

## キャラクター画像の読み込み

`next/image` の `<Image>` コンポーネントは `ImageResponse` の中では使えません。代わりに `<img>` タグを使いますが、ファイルパスは直接指定できないので base64 に変換して data URL として渡します。

```ts
const chikaPath = path.join(process.cwd(), 'public', 'chika-header.png')
const chikaBase64 = `data:image/png;base64,${fs.readFileSync(chikaPath).toString('base64')}`

// JSX内
<img src={chikaBase64} width={180} height={240} style={{ objectFit: 'contain' }} alt="" />
```

## 完成したコード

```tsx
import { ImageResponse } from 'next/og'
import { getAllPosts, getPostBySlug } from '@/lib/posts'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-static'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

function loadFont(filename: string): ArrayBuffer {
  const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', filename))
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  const chikaPath = path.join(process.cwd(), 'public', 'chika-header.png')
  const chikaBase64 = `data:image/png;base64,${fs.readFileSync(chikaPath).toString('base64')}`

  const fontJP = loadFont('NotoSansJP-Bold-JP.woff')
  const fontLatin = loadFont('NotoSansJP-Bold-Latin.woff')

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#e6ddf8' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '60px 70px', gap: '40px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ fontSize: 26, color: '#9e8ab8', fontFamily: 'Noto Sans JP' }}>
              あるすのてくてくブログ
            </div>
            <div style={{ fontSize: 54, fontWeight: 700, color: '#2a2236', lineHeight: 1.4, fontFamily: 'Noto Sans JP' }}>
              {post?.title ?? ''}
            </div>
          </div>
          <img src={chikaBase64} width={180} height={240} style={{ objectFit: 'contain', alignSelf: 'flex-end' }} alt="" />
        </div>
        <div style={{ height: 12, background: '#7a5fa0' }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Noto Sans JP', data: fontLatin, weight: 700, style: 'normal' },
        { name: 'Noto Sans JP', data: fontJP, weight: 700, style: 'normal' },
      ],
    }
  )
}
```

