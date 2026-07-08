import { describe, expect, it } from "vitest";
import { parseTranslateResult } from "../gateway/gemini";
import { TranslateError } from "../gateway/types";
import { buildUserPrompt } from "../prompt";

describe("翻訳結果のパースと分岐", () => {
  it("translated: 本文とchanged_noteを受け取る", () => {
    const r = parseTranslateResult(
      JSON.stringify({ status: "translated", body: "翻訳文", changed_note: "人格攻撃を外しました" }),
    );
    expect(r.status).toBe("translated");
    expect(r.body).toBe("翻訳文");
    expect(r.changedNote).toBe("人格攻撃を外しました");
  });

  it("needs_more: 送り手向けメッセージが返る(配達されない)", () => {
    const r = parseTranslateResult(
      JSON.stringify({ status: "needs_more", message: "お願いが見つけられませんでした" }),
    );
    expect(r.status).toBe("needs_more");
    expect(r.body).toBeUndefined();
  });

  it("safety_refused: 安全応答が返る", () => {
    const r = parseTranslateResult(
      JSON.stringify({ status: "safety_refused", message: "翻訳して届けることができません" }),
    );
    expect(r.status).toBe("safety_refused");
  });

  it("不正なstatusはTranslateError", () => {
    expect(() => parseTranslateResult(JSON.stringify({ status: "hacked" }))).toThrow(TranslateError);
  });

  it("translatedなのにbodyがなければTranslateError", () => {
    expect(() => parseTranslateResult(JSON.stringify({ status: "translated" }))).toThrow(TranslateError);
  });

  it("JSONでない出力はTranslateError", () => {
    expect(() => parseTranslateResult("ごめんなさい、翻訳できません")).toThrow(TranslateError);
  });
});

describe("ユーザープロンプトの組み立て", () => {
  it("種類・文体サンプル・原文を含む", () => {
    const p = buildUserPrompt({ raw: "原文テキスト", kind: "complaint", styleSample: "だよね〜" });
    expect(p).toContain("種類: complaint");
    expect(p).toContain("だよね〜");
    expect(p).toContain("原文テキスト");
  });

  it("調整時は調整指示と直前の翻訳文を含む", () => {
    const p = buildUserPrompt({
      raw: "原文",
      kind: "complaint",
      adjustment: "softer",
      previousBody: "前回の翻訳",
    });
    expect(p).toContain("調整指示: softer");
    expect(p).toContain("前回の翻訳");
  });
});
