import { useState } from "react";
import { useAppStore } from "../store";

/**
 * オンボーディング:
 * 1. 共同利用の合意(通訳を挟む約束)
 * 2. 名前と文体サンプル登録
 * 3. 無料Geminiキーの設定(データ利用の正直な明示を含む)
 */
export default function Onboarding() {
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [styleSample, setStyleSample] = useState("");
  const [apiKey, setApiKey] = useState("");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      {step === 0 && (
        <section>
          <h1 className="text-2xl font-bold">ふたりの翻訳ポスト</h1>
          <p className="mt-4 leading-relaxed text-ink-soft">
            このアプリは、ふたりのあいだに「通訳」を挟む約束です。
          </p>
          <ul className="mt-4 space-y-3 rounded-2xl bg-card p-5 text-sm leading-relaxed shadow-sm">
            <li>・ここに書いた言葉は、そのままでは相手に届きません。AIが本質(事実・気持ち・お願い)を保ったまま、届く言葉に翻訳します。</li>
            <li>・届く言葉は、AIが下書きし、<b>本人が確認して承認したもの</b>です。あなたの言葉として届きます。</li>
            <li>・不満も感謝も連絡も、同じポストから同じ形で届きます。</li>
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            このアプリは日常の行き違いのためのものです。身体的・精神的な暴力や、深刻な関係の危機は、カウンセリングなど専門支援の領域です。
          </p>
          <button
            onClick={() => setStep(1)}
            className="mt-8 w-full rounded-full bg-accent py-3.5 font-bold text-white active:opacity-80"
          >
            この約束で使いはじめる
          </button>
        </section>
      )}

      {step === 1 && (
        <section>
          <h2 className="text-xl font-bold">あなたのことば</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            翻訳文が「自分の言葉」に感じられるように、普段の言い回しをひとつ教えてください。
          </p>
          <label className="mt-6 block text-sm font-bold">名前(相手に表示されます)</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="例: ようこ"
            className="mt-2 w-full rounded-xl border border-line bg-card px-4 py-3"
          />
          <label className="mt-5 block text-sm font-bold">普段のLINE風の一文</label>
          <textarea
            value={styleSample}
            onChange={(e) => setStyleSample(e.target.value)}
            placeholder="例: 今日ちょっと遅くなるかも〜。ごはん先食べてて!"
            rows={3}
            className="mt-2 w-full rounded-xl border border-line bg-card px-4 py-3"
          />
          <button
            onClick={() => setStep(2)}
            disabled={!displayName.trim()}
            className="mt-8 w-full rounded-full bg-accent py-3.5 font-bold text-white active:opacity-80 disabled:opacity-40"
          >
            次へ
          </button>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="text-xl font-bold">翻訳AIの設定(無料)</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            翻訳にはGoogleの無料AI(Gemini)を使います。
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline"
            >
              Google AI Studio
            </a>
            で無料のAPIキーを作成して、貼り付けてください。
          </p>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            className="mt-4 w-full rounded-xl border border-line bg-card px-4 py-3 font-mono text-sm"
          />
          <div className="mt-4 rounded-2xl bg-card p-4 text-xs leading-relaxed text-ink-soft shadow-sm">
            <b className="text-ink">だいじな正直ばなし</b>
            <p className="mt-1">
              書き殴った原文は、翻訳のためGoogleのAIにのみ送信されます。無料版のAIのため、送信内容がGoogleのサービス改善に使われることがあります。当アプリのサーバーには保存されません。実名や住所など、特定につながる情報は書かないのがおすすめです。
            </p>
          </div>
          <button
            onClick={() => {
              updateSettings({
                onboarded: true,
                displayName: displayName.trim(),
                styleSample: styleSample.trim(),
                apiKey: apiKey.trim(),
              });
            }}
            disabled={!apiKey.trim()}
            className="mt-8 w-full rounded-full bg-accent py-3.5 font-bold text-white active:opacity-80 disabled:opacity-40"
          >
            はじめる
          </button>
          <button
            onClick={() =>
              updateSettings({
                onboarded: true,
                displayName: displayName.trim(),
                styleSample: styleSample.trim(),
              })
            }
            className="mt-3 w-full py-2 text-sm text-ink-soft underline"
          >
            あとで設定する
          </button>
        </section>
      )}
    </div>
  );
}
