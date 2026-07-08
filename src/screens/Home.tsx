import { useAppStore } from "../store";
import type { View } from "../App";
import { REACTION_LABELS } from "../types";

export default function Home({ navigate }: { navigate: (v: View) => void }) {
  const inbox = useAppStore((s) => s.inbox);

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-28 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold">ふたりの翻訳ポスト</h1>
        <button
          onClick={() => navigate({ name: "settings" })}
          aria-label="設定"
          className="rounded-full px-3 py-1.5 text-sm text-ink-soft"
        >
          設定
        </button>
      </header>

      <p className="mt-1 text-xs text-ink-soft">
        フェーズ1: ひとりで試すモード(送ったメッセージが自分に届きます)
      </p>

      <main className="mt-5 flex-1 space-y-3">
        {inbox.length === 0 && (
          <div className="rounded-2xl bg-card p-6 text-center text-sm leading-relaxed text-ink-soft shadow-sm">
            まだメッセージはありません。
            <br />
            右下のポストから、最初のひとことを送ってみてください。
          </div>
        )}
        {inbox.map((m) => (
          <button
            key={m.id}
            onClick={() => navigate({ name: "detail", id: m.id })}
            className="block w-full rounded-2xl bg-card p-4 text-left shadow-sm active:opacity-70"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold">{m.senderId}</span>
              <span className="text-[11px] text-ink-soft">
                {new Date(m.sentAt).toLocaleString("ja-JP", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed">{m.body}</p>
            {m.reaction && (
              <span className="mt-2 inline-block rounded-full bg-paper px-2.5 py-0.5 text-[11px] text-accent">
                {REACTION_LABELS[m.reaction]}
              </span>
            )}
          </button>
        ))}
      </main>

      <button
        onClick={() => navigate({ name: "compose" })}
        className="fixed bottom-8 left-1/2 w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 rounded-full bg-accent py-4 text-center font-bold text-white shadow-lg active:opacity-80"
      >
        ✉️ ポストに書く
      </button>
    </div>
  );
}
