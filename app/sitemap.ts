import type { MetadataRoute } from "next";

export const dynamic = "force-static";
import { getAllPosts } from "@/lib/posts";

const SITE_URL = "https://arus-tech-tech.web.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  return [
    { url: SITE_URL, lastModified: new Date() },
    { url: `${SITE_URL}/about`, lastModified: new Date() },
    ...posts,
  ];
}
