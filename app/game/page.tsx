import StopGame from "@/components/StopGame";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "5秒ゲーム",
};

export default function GamePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <StopGame />
    </div>
  );
}
