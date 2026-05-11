import sharp from "sharp";
import { readdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const POSTS_DIR = "./public/posts";
const MAX_WIDTH = 700;
const QUALITY = 80;
const CONVERT_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif"]);

async function findImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findImages(full));
    } else if (CONVERT_EXTS.has(path.extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

const images = await findImages(POSTS_DIR);

if (images.length === 0) {
  process.exit(0);
}

for (const src of images) {
  const dest = path.join(path.dirname(src), path.basename(src, path.extname(src)) + ".webp");
  if (!existsSync(dest)) {
    const meta = await sharp(src).metadata();
    await sharp(src)
      .resize(Math.min(meta.width, MAX_WIDTH))
      .webp({ quality: QUALITY })
      .toFile(dest);
    console.log(`[optimize-images] ${path.relative(POSTS_DIR, src)} → webp`);
  }
  await unlink(src);
}
console.log("[optimize-images] 完了");
