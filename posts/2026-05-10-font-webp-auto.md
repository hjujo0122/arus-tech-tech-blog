---
title: 画像をビルド時に自動WebP変換するようにした
date: 2026-05-10
tags: [技術, ブログ開発記, パフォーマンス]
summary: 記事に画像を追加するたびに手動でWebP変換していたのを、ビルド時に自動で変換されるようにした話。
---

前回、記事の画像をWebPに変換してサイズを大幅に削減しました。ただ、変換作業は手動でやっていたので、新しい記事を書くたびに同じことをしなければいけない状態でした。面倒なので自動化しました。

## どう動くか

`public/posts/` フォルダ以下のjpg・png・gifファイルを自動で探してWebPに変換し、元ファイルを削除します。すでにWebPになっているファイルはスキップするので、何度ビルドしても安全です。

今後は画像ファイルをフォルダに置いてビルドするだけで、変換のことを考えなくてよくなりました。

## 仕組み

スクリプトのポイントは2つです。

**① フォルダを再帰的にスキャンして画像を探す**

```js
const CONVERT_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif"]);

async function findImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findImages(full)); // サブフォルダも処理
    } else if (CONVERT_EXTS.has(path.extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
}
```

**② WebP版がなければ変換し、元ファイルを削除する**

```js
for (const src of images) {
  const dest = src.replace(/\.[^.]+$/, ".webp"); // 拡張子を .webp に変えたパス
  if (!existsSync(dest)) {
    // まだ変換されていなければ変換
    await sharp(src).resize(700).webp({ quality: 80 }).toFile(dest);
  }
  await unlink(src); // 元ファイルを削除
}
```

**③ ビルドの直前に自動実行する**

npmには `prebuild` という仕組みがあり、`build` スクリプトを実行する直前に自動で呼ばれます。ここにスクリプトを登録しました。

```json
"scripts": {
  "prebuild": "node optimize-images.mjs",
  "build": "next build"
}
```

これで `npm run build` を実行するだけで画像変換からビルドまで一気に流れます。
