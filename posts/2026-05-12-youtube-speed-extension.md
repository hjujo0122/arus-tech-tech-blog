---
title: YouTubeの再生速度をキーボードで変えるChrome拡張を作った
date: 2026-05-12
tags: [技術, 自作ツール]
summary: YouTubeの速度変更メニューを何回もクリックするのが面倒で、ファイル2つだけのChrome拡張を作った話。
---

YouTubeの再生速度を変えるとき、毎回「設定ボタン → 再生速度 → 数値を選ぶ」と3回クリックしないといけません。動画をよく見る人にとってはかなり面倒です。ファイルを2つ作るだけで解決しました。

## 完成形

YouTubeを開くと画面右上に速度が薄く表示されます。

- **`[` キー** を押すと 0.25 倍ずつ遅くなる
- **`]` キー** を押すと 0.25 倍ずつ速くなる
- **右上の表示をクリック**すると 0.5x → 0.75x → 1x → 1.25x → … → 3x とプリセットを順番に切り替えられる

速度が変わった瞬間だけ数字がはっきり表示されて、1秒ほどで薄くなります。普段は邪魔にならず、操作したときだけわかる見た目にしました。

---

## Chrome拡張とは

Chrome拡張（クローム拡張）とは、ブラウザに追加できる小さなプログラムのことです。YouTubeやGoogleなど特定のサイトを開いたときに自動でJavaScriptを実行させる機能があります。

App StoreやChrome ウェブストアからインストールするのが一般的ですが、自分でファイルを用意してローカルで読み込む方法もあります。審査もなく、即使えます。

---

## ファイル構成

必要なのは2つだけです。

```
youtube-speed/
  manifest.json   ← 「これはChrome拡張です」という設定ファイル
  content.js      ← YouTubeで実行するスクリプト
```

### manifest.json

Chrome拡張の「自己紹介書」のようなファイルです。名前・バージョン・どのサイトで動かすか、を書きます。

```json
{
  "manifest_version": 3,
  "name": "YouTube Speed",
  "version": "1.0",
  "content_scripts": [
    {
      "matches": ["*://*.youtube.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

`matches` に `*://*.youtube.com/*` と書くことで「YouTubeのページを開いたときだけ動かす」という指定になります。

### content.js

実際に動くスクリプトです。大きく3つのことをやっています。

**① 動画要素を取得して速度をセットする**

YouTubeの動画は `<video>` というHTML要素として存在しています。JavaScriptからは `document.querySelector('video')` で取得でき、`.playbackRate` というプロパティに数値を入れると速度が変わります。

```js
function setSpeed(speed) {
  const video = document.querySelector('video');
  if (!video) return;
  video.playbackRate = Math.max(0.25, Math.min(16, Math.round(speed * 100) / 100));
  flash(video.playbackRate);
}
```

`Math.max` と `Math.min` で 0.25〜16 の範囲に収まるようにしています。

**② 右上にフローティング表示を作る**

JavaScriptでHTMLの要素を動的に作り、画面に貼り付けています。`position: fixed` というスタイルを使うと、スクロールしても同じ場所に固定されます。

```js
function createOverlay() {
  overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '72px',
    right: '24px',
    background: 'rgba(0,0,0,0.82)',
    color: '#fff',
    // ...
  });
  document.body.appendChild(overlay);
}
```

**③ キーボードイベントを受け取る**

`[` か `]` を押したときに速度を変えます。`capture: true` オプションをつけることで、YouTubeが同じキーに別の処理を割り当てていても、こちらが先に受け取れます。

```js
document.addEventListener('keydown', (e) => {
  // テキスト入力中は反応しない
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const video = document.querySelector('video');
  if (!video) return;

  if (e.key === ']') {
    e.stopPropagation();
    setSpeed(video.playbackRate + 0.25);
  } else if (e.key === '[') {
    e.stopPropagation();
    setSpeed(video.playbackRate - 0.25);
  }
}, true); // ← true が capture: true の指定
```

コメント欄に文字を入力しているときはキーを拾わないようにもしています。
まぁコメントをしたことないのですが。

---

## インストール方法

1. 上記2ファイルを同じフォルダに置く
2. Chromeのアドレスバーに `chrome://extensions` と入力して開く
3. 右上の「**デベロッパーモード**」をオンにする
4. 「**パッケージ化されていない拡張機能を読み込む**」をクリックしてフォルダを選択

以上で完了です。YouTubeを開くと即座に動きます。

---

## 完成コード全体

```js
(function () {
  const PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
  let overlay = null;
  let hideTimer = null;

  function getVideo() {
    return document.querySelector('video');
  }

  function clamp(val) {
    return Math.max(0.25, Math.min(16, Math.round(val * 100) / 100));
  }

  function setSpeed(speed) {
    const video = getVideo();
    if (!video) return;
    video.playbackRate = clamp(speed);
    flash(video.playbackRate);
  }

  function flash(speed) {
    if (!overlay) createOverlay();
    overlay.textContent = speed + 'x';
    overlay.style.opacity = '1';
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      overlay.style.opacity = '0.25';
    }, 1200);
  }

  function createOverlay() {
    overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '72px',
      right: '24px',
      background: 'rgba(0,0,0,0.82)',
      color: '#fff',
      padding: '6px 14px',
      borderRadius: '6px',
      fontSize: '17px',
      fontWeight: 'bold',
      fontFamily: 'monospace',
      zIndex: '2147483647',
      cursor: 'pointer',
      opacity: '0.25',
      transition: 'opacity 0.3s',
      userSelect: 'none',
    });
    overlay.title = 'クリックでプリセット切替 / [ ] キーで±0.25';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', () => {
      const video = getVideo();
      if (!video) return;
      const cur = video.playbackRate;
      const idx = PRESETS.indexOf(cur);
      const next = idx === -1 ? 1 : PRESETS[(idx + 1) % PRESETS.length];
      setSpeed(next);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.target.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const video = getVideo();
    if (!video) return;

    if (e.key === ']') {
      e.stopPropagation();
      setSpeed(video.playbackRate + 0.25);
    } else if (e.key === '[') {
      e.stopPropagation();
      setSpeed(video.playbackRate - 0.25);
    }
  }, true);

  const observer = new MutationObserver(() => {
    const video = getVideo();
    if (video && !overlay) flash(video.playbackRate);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
```

ファイル2つ・コード全体で70行ほどです。Tampermonkeyのような追加ツールは不要で、Chromeの標準機能だけで動きます。
