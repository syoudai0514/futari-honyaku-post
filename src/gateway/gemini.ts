import type { TranslateRequest, TranslateResult, TranslateStatus } from "../types";
import { SYSTEM_PROMPT, buildUserPrompt } from "../prompt";
import { TranslateError, type TranslatorGateway } from "./types";

/** 無料枠対象のFlash系モデル。改廃が激しいため設定画面から変更できる。 */
export const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * 案B: 端末からGemini APIを直接呼ぶゲートウェイ。
 * キーは端末のローカルにのみ保存され、当アプリのサーバーには送られない。
 */
export class DirectGeminiGateway implements TranslatorGateway {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_GEMINI_MODEL,
  ) {}

  async translate(req: TranslateRequest): Promise<TranslateResult> {
    if (!this.apiKey) {
      throw new TranslateError("APIキーが設定されていません。設定画面から登録してください。");
    }
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/${encodeURIComponent(this.model)}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: buildUserPrompt(req) }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      });
    } catch {
      throw new TranslateError("通信できませんでした。電波の良いところでもう一度試してください。", true);
    }

    if (res.status === 429) {
      throw new TranslateError(
        "無料枠の上限に少しの間かかりました。1分ほど待ってからもう一度試してください。",
        true,
      );
    }
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new TranslateError("APIキーが正しくないようです。設定画面で確認してください。");
    }
    if (!res.ok) {
      throw new TranslateError("翻訳サービス側で問題が起きました。少し待って再度お試しください。", true);
    }

    const data = await res.json();
    const text: unknown = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      throw new TranslateError("翻訳結果を受け取れませんでした。もう一度試してください。", true);
    }
    return parseTranslateResult(text);
  }
}

/** モデル出力(JSON文字列)を検証してTranslateResultにする */
export function parseTranslateResult(text: string): TranslateResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new TranslateError("翻訳結果の形式が崩れていました。もう一度試してください。", true);
  }
  const obj = parsed as Record<string, unknown>;
  const status = obj.status;
  if (status !== "translated" && status !== "needs_more" && status !== "safety_refused") {
    throw new TranslateError("翻訳結果の形式が崩れていました。もう一度試してください。", true);
  }
  if (status === "translated" && typeof obj.body !== "string") {
    throw new TranslateError("翻訳結果の形式が崩れていました。もう一度試してください。", true);
  }
  return {
    status: status as TranslateStatus,
    body: typeof obj.body === "string" ? obj.body : undefined,
    message: typeof obj.message === "string" ? obj.message : undefined,
    changedNote: typeof obj.changed_note === "string" ? obj.changed_note : undefined,
  };
}
