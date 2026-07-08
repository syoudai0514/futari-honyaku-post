import { useState } from "react";
import { useAppStore } from "../store";
import type { View } from "../App";

export default function SettingsScreen({ navigate }: { navigate: (v: View) => void }) {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [form, setForm] = useState({
    displayName: settings.displayName,
    styleSample: settings.styleSample,
    apiKey: settings.apiKey,
    model: settings.model,
  });
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-10 pt-6">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate({ name: "home" })} className="text-sm text-ink-soft">
          ← もどる
        </button>
        <span className="text-sm font-bold text-ink-soft">設定</span>
        <span className="w-12" />
      </header>

      <main className="mt-6 space-y-5">
        <div>
          <label className="text-sm font-bold">名前</label>
          <input
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className="mt-2 w-full rounded-xl border border-line bg-card px-4 py-3"
          />
        </div>
        <div>
          <label className="text-sm font-bold">文体サンプル(普段のLINE風の一文)</label>
          <textarea
            value={form.styleSample}
            onChange={(e) => setForm({ ...form, styleSample: e.target.value })}
            rows={3}
            className="mt-2 w-full rounded-xl border border-line bg-card px-4 py-3"
          />
          <p className="mt-1 text-[11px] text-ink-soft">翻訳文をあなたの口調に寄せるために使います</p>
        </div>
        <div>
          <label className="text-sm font-bold">Gemini APIキー(無料)</label>
          <input
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            placeholder="AIza..."
            className="mt-2 w-full rounded-xl border border-line bg-card px-4 py-3 font-mono text-sm"
          />
          <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline"
            >
              Google AI Studio
            </a>
            で無料で作成できます。キーはこの端末にのみ保存されます。
          </p>
        </div>
        <div>
          <label className="text-sm font-bold">モデル</label>
          <input
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            className="mt-2 w-full rounded-xl border border-line bg-card px-4 py-3 font-mono text-sm"
          />
          <p className="mt-1 text-[11px] text-ink-soft">通常は変更不要(無料枠対象のFlash系モデル)</p>
        </div>

        <button
          onClick={() => {
            updateSettings({
              displayName: form.displayName.trim(),
              styleSample: form.styleSample.trim(),
              apiKey: form.apiKey.trim(),
              model: form.model.trim() || settings.model,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          }}
          className="w-full rounded-full bg-accent py-3.5 font-bold text-white active:opacity-80"
        >
          {saved ? "保存しました" : "保存する"}
        </button>

        <div className="rounded-2xl bg-card p-4 text-xs leading-relaxed text-ink-soft shadow-sm">
          <b className="text-ink">データの扱い</b>
          <p className="mt-1">
            書き殴った原文は、翻訳のためGoogleのAI(Gemini)にのみ送信され、送信後にこの端末からも消えます。無料版のAIのため、送信内容がGoogleのサービス改善に使われることがあります。当アプリのサーバーには保存されません。
          </p>
          <b className="mt-3 block text-ink">このアプリの範囲</b>
          <p className="mt-1">
            このアプリは日常の行き違いのためのものです。身体的・精神的な暴力や、深刻な関係の危機は、カウンセリングなど専門支援の領域です(
            <a
              href="https://www.mhlw.go.jp/mamorouyokokoro/"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline"
            >
              相談窓口
            </a>
            )。
          </p>
        </div>
      </main>
    </div>
  );
}
