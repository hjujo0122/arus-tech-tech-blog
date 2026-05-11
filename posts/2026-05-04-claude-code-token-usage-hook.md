---
title: Claude Codeのトークン使用量をチャット画面に表示するhookを作った
date: 2026-05-04
tags: [技術, Claude Code, Python]
summary: Claude Codeのhook機能を使って、AIとのやり取りのたびにトークン使用量をプログレスバーで表示する仕組みを作った話。
---

Claude Codeを使っていると「今どのくらいトークンを使ったんだろう」が気になってきました。Claude.aiのサイドバーに使用量が出るんですが、その都度確認しに行くのが面倒。なので、Claudeが返事をするたびに自動で使用量が表示される仕組みを自作しました。

完成するとこんな感じで表示されます。

```
Token Usage
Session  ████████████████████░░░░░  81.0%  (219,000 / 270,000)
Weekly   ███░░░░░░░░░░░░░░░░░░░░░░  11.2%  (313,000 / 2,800,000)
```

`████░░░` の部分がプログレスバーで、どのくらい使ったかが一目でわかります。Sessionが現在のセッション（短期）、Weeklyが週間（長期）の使用量です。

## そもそも「トークン」ってなに？

AIとの会話は、文章を「トークン」という単位に分割して処理されています。トークンは単語より少し小さい単位で、たとえば「私はプログラマーです」という文なら5〜7トークンくらいになります。英語だと1単語＝1トークン程度が目安です。

Claude Proのようなサブスクリプションプランには、「週間に使えるトークンの上限」があります。これを超えるとしばらく使えなくなるので、残量を把握しておくことが大事です。

## Claude Codeのhook機能とは

Claude Codeには、**hook（フック）** という仕組みがあります。

フックとは「特定の出来事が起きたとき、自動で何かを実行する仕掛け」のことです。たとえばドアを開けると自動でライトがつく照明センサー、みたいなイメージです。

Claude Codeのフックでは「Claudeが1回の返答を終えたとき」「ファイルを編集したとき」などのタイミングで、あらかじめ指定したプログラムを自動実行できます。

今回使ったのは **`Stop`フック** ── Claudeが返答し終えるたびに発火します。

## hookの登録方法

フックは `~/.claude/settings.json` というファイルに書くだけで有効になります。このファイルはClaudeの設定ファイルで、ユーザーのホームフォルダ（Windowsなら `C:\Users\ユーザー名\.claude\`）にあります。

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python \"C:\\Users\\ユーザー名\\.claude\\token-usage.py\"",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

`Stop` の下にもう一段 `hooks` がネストしているのはClaude Codeの仕様です。外側のオブジェクトにはフィルター条件（`matcher`）を追加できる構造になっていますが、今回はすべての停止イベントで動かしたいので省略しています。この二重構造は「そういうものだ」と思ってそのまま書けばOKです。

これが「Claudeが返答を終えたら（Stop）、`token-usage.py` というPythonスクリプトを実行してください」という指定です。

### hookスクリプトの入出力の仕組み

フックスクリプトは、Claude Codeと次のようなやり取りをします。

- **受け取るもの（stdin）**: Claude Codeが「どのファイルに会話ログが保存されているか」などの情報をJSON形式で渡してきます
- **返すもの（stdout）**: スクリプトが `{ "systemMessage": "表示したい文字列" }` という形式でJSONを返すと、その文字列がチャット画面に表示されます

stdinやstdoutはプログラム同士がデータを受け渡しする仕組みです。バケツリレーのように「前の工程が渡したものを、次の工程が受け取る」イメージです。

## どうやってトークン数を数えるか

### 会話ログはどこに保存されているか

Claude Codeは、Claudeとのやり取りを `~/.claude/projects/` というフォルダの下に **`.jsonl` ファイル**として自動保存しています。

`.jsonl` は「JSON Lines」の略で、1件のJSONが1行ずつ並んでいる形式のテキストファイルです。普通のメモ帳で開くこともできます（重すぎて開けないこともありますが）。

中身はこんな感じです。

```json
{"timestamp":"2026-05-04T10:23:45.678Z","type":"user","message":{"role":"user","content":"こんにちは"}}
{"timestamp":"2026-05-04T10:23:46.123Z","type":"assistant","message":{"role":"assistant","content":"こんにちは！","usage":{"input_tokens":12345,"output_tokens":678}}}
```

1行目がユーザー（自分）の発言、2行目がClaudeの返答です。各行には `timestamp`（メッセージが送られた時刻）があり、返答の行にはさらに `usage` という項目があります。`input_tokens`（自分が送った文章のトークン数）と `output_tokens`（Claudeが返した文章のトークン数）が記録されています。

### トークン数の足し算

やることはシンプルで、`.jsonl` ファイルを1行ずつ読んで `input_tokens` と `output_tokens` を足し算するだけです。

```python
def parse_jsonl_entry(line: str) -> dict | None:
    try:
        o = json.loads(line)
        return o if 'timestamp' in o else None
    except (json.JSONDecodeError, ValueError):
        return None

def get_entry_tokens(o: dict) -> int:
    tokens = 0
    for usage in [o.get('usage'), (o.get('message') or {}).get('usage')]:
        if usage:
            tokens += usage.get('input_tokens', 0)
            tokens += usage.get('output_tokens', 0)
    return tokens
```

## 「セッション」と「週間」の2種類の集計

Claude.aiの使用量画面には2種類の表示があります。

| 種類 | 意味 | リセットタイミング |
|------|------|----------------|
| **現在のセッション** | 短期の使用量 | 最初のメッセージから5時間後 |
| **週間制限** | 週単位の使用量 | 特定の曜日・時刻にリセット（アカウントによって異なる） |

### セッションの仕組み：「5時間ブロック」

セッションは「最初のメッセージを送った時刻から5時間」が1ブロックです。ローリングウィンドウ（常に直近5時間）ではなく、**最初のメッセージが起点**になります。

たとえば14:30に話しかけ始めたなら、そのセッションは19:30にリセットされます。19:30以降に新しいメッセージを送ると、その時刻を起点とした新しい5時間ブロックが始まります。

スクリプトでは `.jsonl` 内の `timestamp` を使ってブロックの境界を検出します。5時間以上の空白があれば、そこを「セッション切り替わり」と判断します。

```python
block_start = None
block_tokens = 0

for e in sorted(entries, key=lambda e: e['ts']):
    if block_start is None or e['ts'] >= block_start + timedelta(hours=5):
        # 5時間以上あいたら新しいブロック開始
        block_start, block_tokens = e['ts'], e['tokens']
    else:
        block_tokens += e['tokens']
```

### 週間の仕組み：固定曜日リセット（曜日はアカウントによって違う）

最初は「直近7日間（168時間）」で計算していましたが、ズレが生じました。Claude.aiは「直近7日間のローリング集計」ではなく、**特定の曜日・時刻にカウンターがゼロにリセットされる**仕様だからです。

ただしこのリセット曜日は**全員が同じではありません**。アカウントごとに異なり、Anthropicがバックエンドを変更するたびにずれることがあります（木曜→土曜 に移行した、という報告が複数あります）。自分のリセット曜日はClaude.aiのサイドバーで確認できます。

たとえばリセットが土曜10:59なら、今が日曜の午後であれば「前の土曜10:59〜今」の約26時間分だけ集計します。7日前から計算すると前の週のトークンも含まれてしまって数が大きくなりすぎます。

スクリプトではリセット曜日と時刻を定数として設定しておきます。

```python
WEEKLY_RESET_DOW  = 6    # リセット曜日（月=1,...,土=6,日=7）← 自分のアカウントに合わせる
WEEKLY_RESET_HOUR = 10   # リセット時刻（JST）
WEEKLY_RESET_MIN  = 59   # リセット分（JST）
```

```python
JST = timezone(timedelta(hours=9))

def get_weekly_reset_utc() -> datetime:
    now_jst = datetime.now(JST)
    days_back = (now_jst.isoweekday() - WEEKLY_RESET_DOW) % 7
    reset_jst = now_jst.replace(hour=WEEKLY_RESET_HOUR, minute=WEEKLY_RESET_MIN, second=0, microsecond=0) \
                - timedelta(days=days_back)
    if reset_jst > now_jst:
        reset_jst -= timedelta(days=7)
    return reset_jst.astimezone(timezone.utc)
```

## 上限値はどこから来るのか

ここが一番のくせ者でした。

「使用量が何%か」を表示するには「上限が何トークンか」を知る必要があります。でも**Anthropic（Claudeの開発会社）はこの上限値をAPIで公開していません**。

Anthropicは外部のプログラムがデータを取得するための窓口（API）をいくつか公開しており、その中に「Rate Limits API」という上限値取得用の仕組みがあります。これで取れるかと思ったのですが、返ってくるのは「設定されている上限の数字」だけで「今何%使っているか」の情報は含まれていませんでした。Claude.aiの画面に表示されているパーセンテージはAnthropicの内部システムのデータが使われており、外部のプログラムからは読み取れない仕組みになっています。

### 逆算で求める

なので「Claude.aiのUIが示すパーセンテージ」と「自作スクリプトが数えたトークン数」を組み合わせて上限を逆算しました。

```
Claude.aiの表示: 81% 使用済み
スクリプトが数えたトークン: 219,000トークン

上限 = 219,000 ÷ 0.81 ≈ 270,000トークン
```

この計算で求めた値をスクリプトの定数として書き込んでいます。

```python
SESSION_LIMIT = 270000   # セッション上限（実測逆算）
WEEKLY_LIMIT  = 2800000  # 週間上限（実測逆算）
```

ただし、この逆算には構造上の限界があります。スクリプトはClaudeの返答が**終わった後**に実行されるので、「Claude.aiで%を確認した時点」より少しトークンが増えた状態で計算することになります。この誤差は避けられないため、±3〜5%程度のズレは諦めて「だいたいの残量目安」として割り切って使うのが現実的です。

### キャリブレーションは新しいセッションの序盤で

SESSION_LIMITはプランが変わらない限り固定値です。ただし逆算のタイミングによって計測誤差が生じます。特にやっかいなのが**コンテキスト圧縮**です。

会話が長くなるとClaude Codeは過去のやり取りを自動的に要約・圧縮します。この圧縮処理で使われたトークンは `.jsonl` に通常の会話と異なる形で記録されるため、スクリプトがカウントしそこねることがあります。するとトークン数が実際より少なく見えて、逆算したSESSION_LIMITも小さくなってしまいます。

精度よくキャリブレーションするには、**新しいセッションを始めてコンテキストが少ない序盤（10〜20%あたり）で計測する**のがベストです。

### /clearはトークン節約にもなる

`/clear` で会話をリセットすると、前の会話のコンテキストを次のリクエストに含めなくて済むので、1回のやり取りで消費するトークン数自体が減ります。コンテキスト圧縮も起きにくくなるため、スクリプトの計測精度も上がります。

ただし `/clear` しても5時間セッションのタイマーはリセットされません。Claude.aiの使用量カウンターは引き続き積み上がります。

なお、`.jsonl` ファイルには `cache_creation_input_tokens`（キャッシュ書き込み）や `cache_read_input_tokens`（キャッシュ読み込み）というフィールドもあります。キャッシュ読み込みはセッション内のトークン数の100倍近い量になることもありますが、調べた限りではClaude.aiのパーセント表示はほぼ `input_tokens + output_tokens` をもとに計算されているようで、キャッシュトークンを足してもかえってズレが大きくなりました。

### そもそも .jsonl のトークン数は信頼できるのか

調べていくうちに、さらに根本的な問題が見つかりました。

[gille.ai の調査](https://gille.ai/en/blog/claude-code-jsonl-logs-undercount-tokens/)によると、`.jsonl` の `usage.input_tokens`（トップレベル）は**75%のエントリでプレースホルダー（0や1）のまま更新されない**ことがわかっています。`.jsonl` はストリーミング中に書き込まれ、レスポンス完了後に確定値へ上書きされない設計になっているためです。この調査では実際のAPI請求トークン数と比べて **100倍以上の過小評価**が生じたケースが報告されています。

ただし、Claude Codeは内部的に2つのトークン追跡経路を持っています。

- **`.jsonl`**（ストリーミング中に書き込み → 不正確）
- **ステータスバー用の内部カウンター**（APIレスポンス確定後に集計 → 正確）

このスクリプトは `o.usage`（トップレベル）と `o.message.usage`（ネスト）の両方を読んでいます。`message.usage` が確定値を持つケースがあるため、トップレベルだけを読む他のツールよりは精度が高い可能性があります。とはいえ内部カウンターには直接アクセスできないため、どこまで正確かは検証できていません。

結局のところ、このスクリプトは**「だいたいの残量目安」以上にはなれない**というのが正直なところです。

## 完成したスクリプト全体

ここまで紹介してきた要素を組み合わせた、動くスクリプトの全体です。それぞれの処理を役割ごとに関数に分けています。

| 関数 | 役割 |
|------|------|
| `make_bar` | プログレスバーの文字列を作る |
| `get_weekly_reset_utc` | 直近の週リセット時刻を計算する |
| `parse_jsonl_entry` | 1行のJSONLをパースする |
| `get_entry_tokens` | 1エントリのトークン数を集計する |
| `read_token_entries` | `.jsonl` ファイルを読んでトークンデータを取得する |
| `resolve_session_tokens` | 取得したデータから現在のセッション分を絞り込む |
| `format_usage_message` | 表示する文字列を組み立てる |

```python
import sys
import json
from pathlib import Path
from datetime import datetime, timezone, timedelta

# ---- 上限設定（プランに合わせて変更） ----
SESSION_LIMIT     = 270000   # セッション上限（実測逆算）
WEEKLY_LIMIT      = 2800000  # 週間上限（実測逆算）
WEEKLY_RESET_DOW  = 6        # リセット曜日（月=1,...,土=6,日=7）← Claude.aiのサイドバーで確認
WEEKLY_RESET_HOUR = 10       # 週リセット時刻（JST）
WEEKLY_RESET_MIN  = 59       # 週リセット分（JST）

JST = timezone(timedelta(hours=9))


def make_bar(used: int, total: int, width: int = 25) -> str:
    """プログレスバーの文字列を作る。

    Args:
        used: 使用量
        total: 上限
        width: バー幅

    Returns:
        "████░░░ 27.0%" 形式の文字列
    """
    ratio = min(1.0, used / total) if total > 0 else 0.0
    filled = round(ratio * width)
    bar = '█' * filled + '░' * (width - filled)
    return f"{bar} {round(ratio * 100, 1)}%"


def get_weekly_reset_utc() -> datetime:
    """直近の週リセット時刻を返す。

    Returns:
        直近の週リセット時刻（UTC）
    """
    now_jst = datetime.now(JST)
    days_back = (now_jst.isoweekday() - WEEKLY_RESET_DOW) % 7
    reset_jst = now_jst.replace(hour=WEEKLY_RESET_HOUR, minute=WEEKLY_RESET_MIN, second=0, microsecond=0) \
                - timedelta(days=days_back)
    if reset_jst > now_jst:
        reset_jst -= timedelta(days=7)
    return reset_jst.astimezone(timezone.utc)


def parse_jsonl_entry(line: str) -> dict | None:
    """JSONL の1行をパースする。

    Args:
        line: JSONL の1行

    Returns:
        パース済みオブジェクト。無効行の場合は None
    """
    try:
        o = json.loads(line)
        return o if 'timestamp' in o else None
    except (json.JSONDecodeError, ValueError):
        return None


def get_entry_tokens(o: dict) -> int:
    """エントリの input + output トークン合計を返す。

    Args:
        o: パース済みエントリ

    Returns:
        input_tokens + output_tokens の合計
    """
    usage = (o.get('message') or {}).get('usage') or o.get('usage')
    if not usage:
        return 0
    return usage.get('input_tokens', 0) + usage.get('output_tokens', 0)


def read_token_entries(weekly_cutoff: datetime, session_look: datetime) -> dict:
    """.jsonl ファイルを走査してトークンデータを収集する。

    Args:
        weekly_cutoff: 週間集計の開始時刻（UTC）
        session_look: セッション走査の開始時刻（UTC）

    Returns:
        session_entries（タイムスタンプ付きエントリのリスト）と
        weekly_tokens（週間トークン合計）を含む辞書
    """
    session_entries = []
    weekly_tokens = 0

    projects_dir = Path.home() / '.claude' / 'projects'
    if not projects_dir.exists():
        return {'session_entries': session_entries, 'weekly_tokens': weekly_tokens}

    for jsonl_file in projects_dir.rglob('*.jsonl'):
        lwt = datetime.fromtimestamp(jsonl_file.stat().st_mtime, tz=timezone.utc)
        for_weekly  = lwt > weekly_cutoff
        for_session = lwt > session_look
        if not for_weekly and not for_session:
            continue

        try:
            with open(jsonl_file, encoding='utf-8', errors='replace') as f:
                for line in f:
                    o = parse_jsonl_entry(line)
                    if o is None:
                        continue

                    ts     = datetime.fromisoformat(o['timestamp'].replace('Z', '+00:00'))
                    tokens = get_entry_tokens(o)
                    if tokens == 0:
                        continue

                    if for_weekly  and ts >= weekly_cutoff: weekly_tokens += tokens
                    if for_session and ts >= session_look:  session_entries.append({'ts': ts, 'tokens': tokens})
        except OSError:
            continue

    return {'session_entries': session_entries, 'weekly_tokens': weekly_tokens}


def resolve_session_tokens(entries: list, now: datetime) -> int:
    """現在のセッションのトークン数を算出する。

    Args:
        entries: タイムスタンプ付きエントリのリスト
        now: 現在時刻（UTC）

    Returns:
        現セッションのトークン数。セッション外の場合は 0
    """
    if not entries:
        return 0

    block_start = None
    block_tokens = 0
    for e in sorted(entries, key=lambda e: e['ts']):
        if block_start is None or e['ts'] >= block_start + timedelta(hours=5):
            block_start, block_tokens = e['ts'], e['tokens']
        else:
            block_tokens += e['tokens']

    return block_tokens if block_start and now < block_start + timedelta(hours=5) else 0


def format_usage_message(session_tokens: int, weekly_tokens: int) -> str:
    """チャット画面に表示する使用量メッセージを組み立てる。

    Args:
        session_tokens: セッションの使用トークン数
        weekly_tokens: 週間の使用トークン数

    Returns:
        プログレスバー付きの複数行文字列
    """
    return (
        f"Token Usage\n"
        f"Session  {make_bar(session_tokens, SESSION_LIMIT)}  ({session_tokens:,} / {SESSION_LIMIT:,})\n"
        f"Weekly   {make_bar(weekly_tokens,  WEEKLY_LIMIT)}  ({weekly_tokens:,} / {WEEKLY_LIMIT:,})"
    )


def main():
    try:
        _payload = json.loads(sys.stdin.read())

        now           = datetime.now(timezone.utc)
        weekly_cutoff = get_weekly_reset_utc()
        session_look  = now - timedelta(hours=10)

        data           = read_token_entries(weekly_cutoff, session_look)
        session_tokens = resolve_session_tokens(data['session_entries'], now)
        msg            = format_usage_message(session_tokens, data['weekly_tokens'])

        print(json.dumps({'systemMessage': msg}))
    except Exception:
        pass


if __name__ == '__main__':
    main()
```

地味な仕組みですが、使用量が画面に出るようになると「この会話ちょっとトークン使いすぎたな」という感覚が自然と身についてきます。残量を意識することで、必要以上に長い指示を送らないようにする癖もついてきました。

もし同じようなことをやりたい方がいれば参考にしてみてください。上限値（`SESSION_LIMIT` と `WEEKLY_LIMIT`）はプランや時期によって変わるので、Claude.aiのUI表示とスクリプトの出力を見比べながら自分の環境に合わせて調整してみてください。

---

## 参考にしたもの

このhookを作るにあたって、以下を参考にしました。

**既存ツールの紹介記事**

- [Claude Code の使用量を確認したい！ - Zenn](https://zenn.dev/rescuenow/articles/0e0b501374eacb)

  ccusage（CLI型）とClaude Code Usage Monitor（リアルタイムダッシュボード型）を紹介している記事。どちらもトークン使用量を `.jsonl` ファイルから集計するアプローチで、今回の実装の出発点になりました。

**トークンカウントの精度に関する調査**

- [Claude Code's JSONL Logs Undercount Tokens by 100x — Here's Why - gille.ai](https://gille.ai/en/blog/claude-code-jsonl-logs-undercount-tokens/)

  `.jsonl` の `usage.input_tokens` がストリーミング中のプレースホルダーのまま更新されず、実際のAPI請求と100倍以上の乖離が生じることを実測した記事。Claude Codeが内部に2つのトークン追跡経路を持つことも解説されています。

**上限値の挙動に関するGitHub Issues**

トークンカウントの精度を上げるために調べた過程で見つけた、Claude Codeの公式リポジトリのissueです。

- [Cache read tokens consume 99.93% of usage quota - Issue #24147](https://github.com/anthropics/claude-code/issues/24147)

  キャッシュ読み込みトークン（`cache_read_input_tokens`）がクォータにカウントされるかどうかを議論したissue。このissueでは「1:1のフルウェイトでカウントされている」と主張されており、理屈としてはそうであってほしい（カウントされないなら使い放題になってしまう）のですが、実際に自分の環境で調べてみたところ、`cache_read_input_tokens` の値が `input_tokens + output_tokens` の**約100倍**という量になっていました。これをフルウェイトで足すと逆算されるSESSION_LIMITが3,200万トークンになってしまい、明らかにおかしい。`cache_creation_input_tokens` だけ足してみても140万になって合わない。結果的に `input_tokens + output_tokens` だけで計算したときが一番Claude.aiの表示と近い値になりました。キャッシュトークンが何らかの重み（0.1倍など）でカウントされている可能性もありますが、Anthropicが計算式を公開していないため正確なところは不明です。

- [Cache TTL silently regressed from 1h to 5m - Issue #46829](https://github.com/anthropics/claude-code/issues/46829)

  2026年3〜4月頃にキャッシュの有効期限が1時間→5分に短縮されたことを報告したissue。この変更により、同じ会話でも消費トークン数が増えました。

- [Widespread abnormal usage limit drain - Issue #41930](https://github.com/anthropics/claude-code/issues/41930)

  平日ピーク時間帯（日本時間14〜20時頃）にセッション消費が速くなる現象を報告したissue。issueはクローズされていますが、Anthropicの公式見解は「仕様どおり」というもので、現在も同じ挙動が続いています。

- [Weekly usage reset anchor drifts - Issue #55150](https://github.com/anthropics/claude-code/issues/55150)

  週次リセット曜日がアカウントによって異なり、Anthropicのバックエンド移行のたびにずれることを報告したissue。リセット曜日を設定可能にした理由です。
