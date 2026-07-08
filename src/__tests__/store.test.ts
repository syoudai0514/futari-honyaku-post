import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../store";

const RAW = "はぁ??また流しに皿置きっぱなし。ほんとありえない(これは原文)";

function resetStore() {
  localStorage.clear();
  useAppStore.setState({
    settings: { onboarded: true, displayName: "テスト", styleSample: "", apiKey: "", model: "m" },
    inbox: [],
    sent: [],
    draft: { raw: "", kind: null, translation: null, adjustCounts: { softer: 0, clearer: 0, shorter: 0 } },
  });
}

describe("原文の非残存", () => {
  beforeEach(resetStore);

  it("承認送信後、原文と翻訳の一時状態は破棄される", () => {
    const s = useAppStore.getState();
    s.setRaw(RAW);
    s.setKind("complaint");
    s.setTranslation({ status: "translated", body: "翻訳済み" });
    useAppStore.getState().approveAndSend("翻訳済み本文です");

    const after = useAppStore.getState().draft;
    expect(after.raw).toBe("");
    expect(after.kind).toBeNull();
    expect(after.translation).toBeNull();
  });

  it("原文はlocalStorage(永続化)に一切書かれない", () => {
    useAppStore.getState().setRaw(RAW);
    // persistのpartializeによりdraftは保存対象外
    const persisted = localStorage.getItem("futari-post") ?? "";
    expect(persisted).not.toContain("原文");
    expect(persisted).not.toContain("皿");
    expect(JSON.parse(persisted || "{}")?.state?.draft).toBeUndefined();
  });

  it("受信箱のメッセージに種類(kind)と原文は存在しない", () => {
    const s = useAppStore.getState();
    s.setRaw(RAW);
    s.setKind("complaint");
    useAppStore.getState().approveAndSend("翻訳済み本文です");

    const received = useAppStore.getState().inbox[0];
    expect(received.body).toBe("翻訳済み本文です");
    expect("kind" in received).toBe(false);
    expect(JSON.stringify(received)).not.toContain("原文");

    // 送り手ローカルの記録にはkindが残る(自分の履歴管理用)
    expect(useAppStore.getState().sent[0].kind).toBe("complaint");
  });
});

describe("リアクションと調整カウント", () => {
  beforeEach(resetStore);

  it("受信メッセージにリアクションを付けられる", () => {
    const s = useAppStore.getState();
    s.setRaw("ありがとう");
    s.setKind("gratitude");
    useAppStore.getState().approveAndSend("ありがとう");
    const id = useAppStore.getState().inbox[0].id;
    useAppStore.getState().setReaction(id, "thanks");
    expect(useAppStore.getState().inbox[0].reaction).toBe("thanks");
  });

  it("調整回数は方向ごとにカウントされる", () => {
    useAppStore.getState().countAdjustment("softer");
    useAppStore.getState().countAdjustment("softer");
    useAppStore.getState().countAdjustment("shorter");
    const counts = useAppStore.getState().draft.adjustCounts;
    expect(counts).toEqual({ softer: 2, clearer: 0, shorter: 1 });
  });
});
