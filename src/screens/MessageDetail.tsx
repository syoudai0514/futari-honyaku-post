import { useAppStore } from "../store";
import type { View } from "../App";
import { REACTION_LABELS, type Reaction } from "../types";

/**
 * 受信メッセージの表示。
 * 全メッセージ統一フォーマット: 本文+「ふたりの翻訳ポストより」のみ。
 * 種類・文字数・調整回数など、元入力を推測させる情報は存在しない。
 */
export default function MessageDetail({ id, navigate }: { id: string; navigate: (v: View) => void }) {
  const message = useAppStore((s) => s.inbox.find((m) => m.id === id));
  const setReaction = useAppStore((s) => s.setReaction);

  if (!message) {
    navigate({ name: "home" });
    return null;
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-10 pt-6">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate({ name: "home" })} className="text-sm text-ink-soft">
          ← もどる
        </button>
      </header>

      <main className="mt-6">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold">{message.senderId}</span>
            <span className="text-[11px] text-ink-soft">
              {new Date(message.sentAt).toLocaleString("ja-JP")}
            </span>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{message.body}</p>
          <p className="mt-6 text-right text-[11px] text-ink-soft">— ふたりの翻訳ポストより</p>
        </div>

        <p className="mt-6 text-xs text-ink-soft">いま返せなくても、ひとことだけ:</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(Object.keys(REACTION_LABELS) as Reaction[]).map((r) => (
            <button
              key={r}
              onClick={() => setReaction(message.id, r)}
              className={`rounded-full border py-2.5 text-sm active:opacity-70 ${
                message.reaction === r
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-card text-ink"
              }`}
            >
              {REACTION_LABELS[r]}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate({ name: "compose" })}
          className="mt-8 w-full rounded-full bg-accent py-3.5 font-bold text-white active:opacity-80"
        >
          ポストから返事を書く
        </button>
      </main>
    </div>
  );
}
