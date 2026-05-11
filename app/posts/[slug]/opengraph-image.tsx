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

type Props = { params: Promise<{ slug: string }> }

function loadFont(filename: string): ArrayBuffer {
  const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', filename))
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

export default async function Image({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  const chikaPath = path.join(process.cwd(), 'public', 'chika-header.png')
  const chikaBase64 = `data:image/png;base64,${fs.readFileSync(chikaPath).toString('base64')}`

  const fontJP = loadFont('NotoSansJP-Bold-JP.woff')
  const fontLatin = loadFont('NotoSansJP-Bold-Latin.woff')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#e6ddf8',
        }}
      >
        {/* メインエリア */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            padding: '60px 70px',
            gap: '40px',
          }}
        >
          {/* テキスト */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <div style={{ fontSize: 26, color: '#9e8ab8', fontFamily: 'Noto Sans JP' }}>
              あるすのてくてくブログ
            </div>
            <div
              style={{
                fontSize: 54,
                fontWeight: 700,
                color: '#2a2236',
                lineHeight: 1.4,
                fontFamily: 'Noto Sans JP',
              }}
            >
              {post?.title ?? ''}
            </div>
          </div>

          {/* 知佳ちゃん */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={chikaBase64}
            width={180}
            height={240}
            style={{ objectFit: 'contain', alignSelf: 'flex-end' }}
            alt=""
          />
        </div>

        {/* アクセントバー */}
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
