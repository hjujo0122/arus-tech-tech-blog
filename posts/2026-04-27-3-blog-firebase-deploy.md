---
title: Firebase Hostingにデプロイした話
date: 2026-04-27
tags: [Firebase, デプロイ, Next.js, ブログ開発記]
summary: Next.jsのStatic ExportをFirebase Hostingに載せました。firebase loginからdeployまでの手順をご紹介します。
---

[実装が完成](/posts/2026-04-27-25-blog-dev-flow)しましたので、Firebase Hostingにデプロイしました。

## なぜFirebase Hostingか

- 無料枠が広い（月10GBまで転送無料）
- `firebase deploy` 1コマンドで完了する
- Google CDNで配信されるため表示が速い

まぁ有名で安心ですし無料ってのがでかいです。

## やったこと

「残りのFirebase Hostingの設定もやりますか？」とAIに聞かれたので「はい」と答えました。以上です。

Next.jsのStatic Export設定、firebase-toolsのインストール、`firebase.json` や `.firebaserc` の作成、全部AIがやってくれました。自分がやったのは `firebase login` でブラウザが開いたのでGoogleアカウントでログインしたことと、最後に `firebase deploy` を実行したことだけです。

## まとめ：仕様駆動開発 × AIの感想

この連載を通じて感じたのは、一番よかったのは**仕様書がAIへの指示書になる**点でした。

「仕様書の受け入れ条件を満たすように実装して」と渡せば、AIは余計なことをしません。逆に仕様が曖昧なままAIに投げると、AIも迷います。仕様を整理する時間は、そのまま実装時間の節約につながりました。

「コードは書けるけど何を作るか決めるのが苦手」という方にこそ、仕様駆動開発とAIの組み合わせを試してみてほしいです。仕様書を書く作業自体をAIに手伝ってもらうこともできるので、最初のハードルも思ったより低いです。

このブログ自体は30分もかからず作成できました。
もはやこのレベルのブログ作成はあくまでチョロい。
やっぱりラブコメアニメなんですよね。カナン様はあくまでチョロい。楽しく見れておすすめです。
