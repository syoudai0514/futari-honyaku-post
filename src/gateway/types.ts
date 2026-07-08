import type { TranslateRequest, TranslateResult } from "../types";

/**
 * 翻訳呼び出しの唯一の窓口。
 * プロバイダ(Gemini無料枠 / 将来の有料API)やキーの置き場所(端末直 / Workersプロキシ)を
 * この抽象の背後で差し替える。従量課金部分の分離点でもある。
 */
export interface TranslatorGateway {
  translate(req: TranslateRequest): Promise<TranslateResult>;
}

export class TranslateError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = "TranslateError";
  }
}
