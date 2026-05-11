import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <ul className="space-y-6">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/posts/${post.slug}`} className="group block">
              <article className="relative rounded-2xl border border-dashed border-border bg-card-bg p-6 pl-8 transition-all hover:border-accent hover:shadow-[0_4px_24px_rgba(122,95,160,0.18)]">
                <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-accent/50" />
                <time className="text-sm text-subtext">{post.date}</time>
                <h2 className="mt-1 text-xl font-semibold group-hover:text-accent transition-colors">
                  <span className="text-accent mr-1.5">✦</span>{post.title}
                </h2>
                <p className="mt-2 text-foreground/70">{post.summary}</p>
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
              </article>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
