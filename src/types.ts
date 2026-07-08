// メッセージの種類。翻訳の方向付けにのみ使い、受信側・サーバーには決して渡さない。
export type MessageKind = "complaint" | "gratitude" | "contact" | "reconcile";

export const KIND_LABELS: Record<MessageKind, string> = {
  complaint: "不満・お願い",
  gratitude: "感謝",
  contact: "連絡・相談",
  reconcile: "仲直りしたい",
};

/**
 * 配達ペイロード: サーバー・相手の端末に渡る唯一の形。
 * 原文(raw)と種類(kind)のフィールドは【存在しない】。
 * スキーマレベルで元入力の漏洩を不可能にするのが2大原則の要。
 */
export interface DeliveryPayload {
  id: string;
  pairId: string;
  senderId: string;
  body: string; // 翻訳済み本文のみ
  sentAt: string; // ISO8601
}

export const DELIVERY_ALLOWED_KEYS = ["id", "pairId", "senderId", "body", "sentAt"] as const;

/**
 * 配達ペイロードを組み立てる唯一の入口。
 * 許可キー以外を含むオブジェクトを渡してもここで必ず落とされる。
 */
export function buildDeliveryPayload(input: {
  id: string;
  pairId: string;
  senderId: string;
  body: string;
  sentAt: string;
}): DeliveryPayload {
  const payload: DeliveryPayload = {
    id: input.id,
    pairId: input.pairId,
    senderId: input.senderId,
    body: input.body,
    sentAt: input.sentAt,
  };
  for (const key of Object.keys(payload)) {
    if (!(DELIVERY_ALLOWED_KEYS as readonly string[]).includes(key)) {
      throw new Error(`DeliveryPayloadに許可されていないキー: ${key}`);
    }
  }
  return payload;
}

export type DeliveryStatus = "cooldown" | "pending" | "delivered" | "read";

/** 送り手の端末ローカルにのみ保存される送信記録。kindは端末から出ない。 */
export interface LocalSentMessage extends DeliveryPayload {
  kind: MessageKind;
  status: DeliveryStatus;
}

export type Reaction = "read" | "thanks" | "need_time" | "talk_tonight";

export const REACTION_LABELS: Record<Reaction, string> = {
  read: "読んだよ",
  thanks: "ありがとう",
  need_time: "少し時間ちょうだい",
  talk_tonight: "今夜話そう",
};

/** 受信側ローカルの表現。種類・元入力に関する情報は一切含まれない。 */
export interface ReceivedMessage {
  id: string;
  senderId: string;
  body: string;
  sentAt: string;
  reaction?: Reaction;
}

// ---- 翻訳 ----

export type TranslateStatus = "translated" | "needs_more" | "safety_refused";

export interface TranslateResult {
  status: TranslateStatus;
  /** status === "translated" のときの翻訳文 */
  body?: string;
  /** needs_more / safety_refused のときの送り手への表示文 */
  message?: string;
  /** 任意表示用の「どう変わったか」 */
  changedNote?: string;
}

export type Adjustment = "softer" | "clearer" | "shorter";

export const ADJUSTMENT_LABELS: Record<Adjustment, string> = {
  softer: "もっと柔らかく",
  clearer: "もっとはっきり",
  shorter: "短く",
};

export interface TranslateRequest {
  raw: string;
  kind: MessageKind;
  styleSample?: string;
  /** 再生成時のみ: 直前の翻訳文と調整方向 */
  adjustment?: Adjustment;
  previousBody?: string;
}
