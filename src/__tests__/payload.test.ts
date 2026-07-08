import { describe, expect, it } from "vitest";
import { DELIVERY_ALLOWED_KEYS, buildDeliveryPayload } from "../types";

describe("DeliveryPayload(スキーマレベルの漏洩防止)", () => {
  it("許可された5キーのみで構成される", () => {
    const p = buildDeliveryPayload({
      id: "1",
      pairId: "pair",
      senderId: "me",
      body: "翻訳済み本文",
      sentAt: "2026-07-08T00:00:00.000Z",
    });
    expect(Object.keys(p).sort()).toEqual([...DELIVERY_ALLOWED_KEYS].sort());
  });

  it("原文(raw)や種類(kind)を混ぜて渡しても配達ペイロードに残らない", () => {
    const dirty = {
      id: "1",
      pairId: "pair",
      senderId: "me",
      body: "翻訳済み本文",
      sentAt: "2026-07-08T00:00:00.000Z",
      raw: "クソが!!絶対に漏れてはいけない原文",
      kind: "complaint",
    };
    const p = buildDeliveryPayload(dirty as never);
    expect(JSON.stringify(p)).not.toContain("原文");
    expect("raw" in p).toBe(false);
    expect("kind" in p).toBe(false);
  });
});
