"use client";
import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "running" | "result";

const TARGET = 5000;

function getRating(diff: number): { label: string; mark: string } {
  if (diff <= 30)  return { label: "ぴったり！！！", mark: "⚡⚡⚡" };
  if (diff <= 100) return { label: "すごい！",       mark: "✦✦✦" };
  if (diff <= 300) return { label: "惜しい！",       mark: "✦✦"  };
  if (diff <= 700) return { label: "もう少し！",     mark: "✦"   };
  return             { label: "またチャレンジ！",   mark: "…"   };
}

export default function StopGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const phaseRef = useRef<Phase>("idle");

  const start = () => {
    startRef.current = Date.now();
    phaseRef.current = "running";
    setPhase("running");
  };

  const stop = () => {
    setElapsed(Date.now() - startRef.current);
    phaseRef.current = "result";
    setPhase("result");
  };

  const reset = () => {
    setElapsed(0);
    phaseRef.current = "idle";
    setPhase("idle");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      e.preventDefault();
      if (phaseRef.current === "idle") start();
      else if (phaseRef.current === "running") stop();
      else if (phaseRef.current === "result") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  const diff = Math.abs(elapsed - TARGET);
  const sign = elapsed >= TARGET ? "+" : "-";
  const { label, mark } = getRating(diff);

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-border bg-card-bg px-8 py-12 text-center">
      {phase === "idle" && (
        <>
          <p className="text-5xl">⏱</p>
          <div>
            <h2 className="text-2xl font-bold">5秒ぴったりでとめろ！</h2>
            <p className="mt-2 text-sm text-subtext">タイマーは表示されません。感覚で勝負。</p>
            <p className="mt-1 text-xs text-subtext/60">スペースキーでも操作できます</p>
          </div>
          <button
            onClick={start}
            className="rounded-full border border-dashed border-accent px-10 py-3 text-accent transition-colors hover:bg-accent hover:text-white"
          >
            スタート
          </button>
        </>
      )}

      {phase === "running" && (
        <>
          <p className="text-sm text-subtext">計測中… 5秒後にストップ！</p>
          <button
            onClick={stop}
            className="animate-pulse rounded-full bg-accent px-14 py-5 text-xl font-bold text-white transition-opacity hover:opacity-80"
          >
            ストップ！
          </button>
        </>
      )}

      {phase === "result" && (
        <>
          <p className="text-3xl tracking-widest text-accent">{mark}</p>
          <p className="text-2xl font-bold">{label}</p>
          <p className="font-mono text-5xl font-bold text-accent">
            {(elapsed / 1000).toFixed(3)}
            <span className="text-xl font-normal">秒</span>
          </p>
          <p className="text-sm text-subtext">
            5.000秒まで {sign}{(diff / 1000).toFixed(3)}秒
          </p>
          <button
            onClick={reset}
            className="rounded-full border border-dashed border-border px-8 py-2.5 text-sm text-subtext transition-colors hover:border-accent hover:text-accent"
          >
            もういちど
          </button>
        </>
      )}
    </div>
  );
}
