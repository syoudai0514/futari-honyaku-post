import { useEffect, useMemo, useState } from "react";
import { MAX_ADJUSTMENTS_PER_DIRECTION, useAppStore } from "../store";
import type { View } from "../App";
import {
  ADJUSTMENT_LABELS,
  KIND_LABELS,
  type Adjustment,
  type MessageKind,
} from "../types";
import { DirectGeminiGateway } from "../gateway/gemini";
import { TranslateError } from "../gateway/types";

type Step = "write" | "kind" | "translating" | "review" | "blocked";

const WAIT_MESSAGES = ["言葉を選んでいます…", "気持ちの芯を探しています…", "伝わる形にしています…"];

export default function Compose({ navigate }: { navigate: (v: View) => void }) {
  const { draft, settings, setRaw, setKind, setTranslation, countAdjustment, approveAndSend, discardDraft } =
    useAppStore();
  const [step, setStep] = useState<Step>("write");
  const [editedBody, setEditedBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [waitIndex, setWaitIndex] = useState(0);

  const gateway = useMemo(
    () => new DirectGeminiGateway(settings.apiKey, settings.model),
    [settings.apiKey, settings.model],
  );

  // 書きかけがあるままタブを閉じようとしたら1回だけ警告(原文は保存されないため)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useAppStore.getState().draft.raw.trim()) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    if (step !== "translating") return;
    const t = setInterval(() => setWaitIndex((i) => (i + 1) % WAIT_MESSAGES.length), 1800);
    return () => clearInterval(t);
  }, [step]);

  async function runTranslate(kind: MessageKind, adjustment?: Adjustment) {
    setError(null);
    setStep("translating");
    try {
      const result = await gateway.translate({
        raw: useAppStore.getState().draft.raw,
        kind,
        styleSample: settings.styleSample || undefined,
        adjustment,
        previousBody: adjustment ? useAppStore.getState().draft.translation?.body : undefined,
      });
      setTranslation(result);
      if (result.status === "translated") {
        setEditedBody(result.body ?? "");
        setStep("review");
      } else {
        setStep("blocked");
      }
    } catch (e) {
      setError(e instanceof TranslateError ? e.message : "翻訳に失敗しました。もう一度お試しください。");
      setStep(adjustment ? "review" : "kind");
    }
  }

  function quit() {
    discardDraft();
    navigate({ name: "home" });
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-10 pt-6">
      <header className="flex items-center justify-between">
        <button onClick={quit} className="text-sm text-ink-soft">
          やめる
        </button>
        <span className="text-sm font-bold text-ink-soft">
          {step === "write" && "書き殴りボックス"}
          {step === "kind" && "どんな気持ち?"}
          {step === "translating" && "翻訳中"}
          {step === "review" && "とどける前の確認"}
          {step === "blocked" && "翻訳ポストより"}
        </span>
        <span className="w-10" />
      </header>

      {step === "write" && (
        <div className="mt-5 flex flex-1 flex-col">
          <div className="rounded-2xl bg-card p-4 text-xs leading-relaxed text-ink-soft shadow-sm">
            ここには<b className="text-ink">何を書いてもいい</b>。この文章はそのままでは相手に届かず、送信後に消えます。
            音声で書くなら、キーボードのマイクが楽です。
          </div>
          <textarea
            value={draft.raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="思っていることを、そのまま。"
            autoFocus
            className="mt-4 min-h-64 flex-1 resize-none rounded-2xl border border-line bg-card p-4 text-[15px] leading-relaxed outline-none focus:border-accent-soft"
          />
          <button
            onClick={() => setStep("kind")}
            disabled={!draft.raw.trim()}
            className="mt-4 w-full rounded-full bg-accent py-3.5 font-bold text-white active:opacity-80 disabled:opacity-40"
          >
            書けた
          </button>
        </div>
      )}

      {step === "kind" && (
        <div className="mt-8">
          <p className="text-sm text-ink-soft">これはどんなメッセージ?(相手には表示されません)</p>
          {error && <p className="mt-3 rounded-xl bg-accent-soft/20 p-3 text-sm text-accent">{error}</p>}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(Object.keys(KIND_LABELS) as MessageKind[]).map((k) => (
              <button
                key={k}
                onClick={() => {
                  setKind(k);
                  void runTranslate(k);
                }}
                className="rounded-2xl bg-card py-6 font-bold shadow-sm active:opacity-70"
              >
                {KIND_LABELS[k]}
              </button>
            ))}
          </div>
          <button onClick={() => setStep("write")} className="mt-6 w-full py-2 text-sm text-ink-soft underline">
            書き直す
          </button>
        </div>
      )}

      {step === "translating" && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="size-10 animate-spin rounded-full border-4 border-line border-t-accent" />
          <p className="mt-6 text-sm text-ink-soft">{WAIT_MESSAGES[waitIndex]}</p>
        </div>
      )}

      {step === "review" && (
        <div className="mt-5 flex flex-1 flex-col">
          <p className="text-xs leading-relaxed text-ink-soft">
            これは<b className="text-ink">あなたの言葉として届きます</b>。直したいところは、そのまま書き換えられます。
          </p>
          {error && <p className="mt-3 rounded-xl bg-accent-soft/20 p-3 text-sm text-accent">{error}</p>}
          <textarea
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            rows={8}
            className="mt-3 w-full resize-none rounded-2xl border border-line bg-card p-4 text-[15px] leading-relaxed outline-none focus:border-accent-soft"
          />
          <div className="mt-3 flex gap-2">
            {(Object.keys(ADJUSTMENT_LABELS) as Adjustment[]).map((a) => {
              const used = draft.adjustCounts[a];
              const left = MAX_ADJUSTMENTS_PER_DIRECTION - used;
              return (
                <button
                  key={a}
                  disabled={left <= 0 || !draft.kind}
                  onClick={() => {
                    countAdjustment(a);
                    void runTranslate(draft.kind!, a);
                  }}
                  className="flex-1 rounded-full border border-line bg-card py-2 text-xs text-ink-soft active:opacity-70 disabled:opacity-35"
                >
                  {ADJUSTMENT_LABELS[a]}
                  {left < MAX_ADJUSTMENTS_PER_DIRECTION && ` (あと${left})`}
                </button>
              );
            })}
          </div>
          {draft.translation?.changedNote && (
            <div className="mt-3">
              <button onClick={() => setShowNote(!showNote)} className="text-xs text-ink-soft underline">
                {showNote ? "とじる" : "どう変わった?"}
              </button>
              {showNote && (
                <p className="mt-2 rounded-xl bg-card p-3 text-xs leading-relaxed text-ink-soft shadow-sm">
                  {draft.translation.changedNote}
                </p>
              )}
            </div>
          )}
          <div className="mt-auto pt-5">
            <p className="text-center text-xs text-ink-soft">このまま送っていいですか?</p>
            <button
              onClick={() => {
                approveAndSend(editedBody.trim());
                navigate({ name: "home" });
              }}
              disabled={!editedBody.trim()}
              className="mt-2 w-full rounded-full bg-accent py-3.5 font-bold text-white active:opacity-80 disabled:opacity-40"
            >
              承認して送る
            </button>
            <p className="mt-2 text-center text-[11px] text-ink-soft">送信すると、書き殴った原文は消えます</p>
          </div>
        </div>
      )}

      {step === "blocked" && draft.translation && (
        <div className="mt-10">
          <div className="rounded-2xl bg-card p-5 text-sm leading-relaxed shadow-sm">
            {draft.translation.message}
          </div>
          {draft.translation.status === "safety_refused" && (
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              つらい状態がつづくときは、ひとりで抱えずに専門の相談窓口へ。
              <a
                href="https://www.mhlw.go.jp/mamorouyokokoro/"
                target="_blank"
                rel="noreferrer"
                className="text-accent underline"
              >
                厚生労働省 まもろうよ こころ
              </a>
            </p>
          )}
          <button
            onClick={() => setStep("write")}
            className="mt-8 w-full rounded-full bg-accent py-3.5 font-bold text-white active:opacity-80"
          >
            書き直す
          </button>
          <button onClick={quit} className="mt-3 w-full py-2 text-sm text-ink-soft underline">
            今日はやめておく
          </button>
        </div>
      )}
    </div>
  );
}
