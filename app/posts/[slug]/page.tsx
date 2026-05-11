import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import MermaidBlock from "@/components/MermaidBlock";
import ScrollProgress from "@/components/ScrollProgress";
import YouTubeCard from "@/components/YouTubeCard";
import AmazonCard from "@/components/AmazonCard";
import CopyArticleButton from "@/components/CopyArticleButton";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

const SITE_URL = "https://arus-tech-tech.web.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const url = `${SITE_URL}/posts/${slug}`;
  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      url,
      publishedTime: post.date,
      locale: "ja_JP",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
    },
  };
}

// ---- TOC utilities ----

type Heading = { level: 2 | 3; text: string; id: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w　-鿿＀-￯-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractHeadings(content: string): Heading[] {
  return content.split("\n").flatMap((line) => {
    const m = line.match(/^(#{2,3})\s+(.+)/);
    if (!m) return [];
    const level = m[1].length as 2 | 3;
    const text = m[2].trim();
    return [{ level, text, id: slugify(text) }];
  });
}

function nodeText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (React.isValidElement(node))
    return nodeText((node.props as { children?: React.ReactNode }).children);
  return "";
}

function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length === 0) return null;
  return (
    <nav className="mb-8 rounded-2xl border border-dashed border-border bg-card-bg p-5">
      <p className="mb-3 text-sm font-semibold text-accent">✦ 目次</p>
      <ol className="space-y-1.5 text-sm">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-4 text-subtext" : "text-foreground/80"}>
            <a href={`#${h.id}`} className="transition-colors hover:text-accent">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ---- MDX components ----

function Pre({ children }: React.ComponentPropsWithoutRef<"pre">) {
  const child = React.Children.toArray(children)[0] as React.ReactElement<{
    className?: string;
    children?: React.ReactNode;
  }>;
  if (child?.props?.className === "language-mermaid") {
    return <MermaidBlock>{String(child.props.children ?? "")}</MermaidBlock>;
  }
  return <pre>{children}</pre>;
}

function H2({ children }: { children?: React.ReactNode }) {
  return <h2 id={slugify(nodeText(children))}>{children}</h2>;
}

function H3({ children }: { children?: React.ReactNode }) {
  return <h3 id={slugify(nodeText(children))}>{children}</h3>;
}

function A({ href, children }: React.ComponentPropsWithoutRef<"a">) {
  if (href && /youtube\.com\/watch|youtu\.be\//.test(href)) {
    return <YouTubeCard href={href} />;
  }
  if (href && /amzn\.to|amazon\.co\.jp|amazon\.com/.test(href)) {
    return <AmazonCard href={href}>{children}</AmazonCard>;
  }
  return <a href={href}>{children}</a>;
}

const mdxComponents = { pre: Pre, h2: H2, h3: H3, a: A, CopyArticleButton };

// ---- Page ----

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const headings = extractHeadings(post.content);

  const allPosts = getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = allPosts[currentIndex + 1] ?? null; // 一つ古い
  const nextPost = allPosts[currentIndex - 1] ?? null; // 一つ新しい
  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    url: `${SITE_URL}/posts/${post.slug}`,
  };

  return (
    <>
    <ScrollProgress />
    <div className="mx-auto max-w-2xl px-4 pt-12 pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-4 py-1.5 text-sm text-subtext transition-colors hover:border-accent hover:text-accent"
      >
        ✦ 一覧へ戻る
      </Link>

      <article className="mt-8">
        <header className="mb-8">
          <time className="text-sm text-subtext">{post.date}</time>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {post.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-tag-bg px-3 py-0.5 text-xs text-tag-text"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <TableOfContents headings={headings} />

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <MDXRemote
            source={post.content}
            components={mdxComponents}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </div>

        <div className="mt-10 border-t border-dashed border-border pt-6">
          <div className="grid grid-cols-2 gap-3">
            {prevPost ? (
              <Link href={`/posts/${prevPost.slug}`} className="group rounded-xl border border-dashed border-border bg-card-bg p-4 transition-colors hover:border-accent">
                <span className="text-xs text-subtext">← 前の記事</span>
                <p className="mt-1 line-clamp-2 text-sm font-medium transition-colors group-hover:text-accent">{prevPost.title}</p>
              </Link>
            ) : <div />}
            {nextPost ? (
              <Link href={`/posts/${nextPost.slug}`} className="group rounded-xl border border-dashed border-border bg-card-bg p-4 text-right transition-colors hover:border-accent">
                <span className="text-xs text-subtext">次の記事 →</span>
                <p className="mt-1 line-clamp-2 text-sm font-medium transition-colors group-hover:text-accent">{nextPost.title}</p>
              </Link>
            ) : <div />}
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold text-accent">✦ 関連記事</p>
            <ul className="space-y-2">
              {relatedPosts.map((p) => (
                <li key={p.slug}>
                  <Link href={`/posts/${p.slug}`} className="text-sm text-foreground/80 transition-colors hover:text-accent">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 flex justify-end border-t border-dashed border-border pt-6">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`${SITE_URL}/posts/${post.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-4 py-1.5 text-sm text-subtext transition-colors hover:border-accent hover:text-accent"
          >
            𝕏 でシェア
          </a>
        </div>
      </article>
    </div>
    </>
  );
}
