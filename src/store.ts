import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  buildDeliveryPayload,
  type Adjustment,
  type LocalSentMessage,
  type MessageKind,
  type Reaction,
  type ReceivedMessage,
  type TranslateResult,
} from "./types";

export interface Settings {
  onboarded: boolean;
  displayName: string;
  styleSample: string;
  apiKey: string;
  model: string;
}

interface DraftState {
  /** 書き殴りの原文。メモリ上にのみ存在し、永続化されない(下記partialize参照)。 */
  raw: string;
  kind: MessageKind | null;
  translation: TranslateResult | null;
  adjustCounts: Record<Adjustment, number>;
}

interface AppState {
  settings: Settings;
  inbox: ReceivedMessage[];
  sent: LocalSentMessage[];
  draft: DraftState;

  updateSettings: (patch: Partial<Settings>) => void;
  setRaw: (raw: string) => void;
  setKind: (kind: MessageKind | null) => void;
  setTranslation: (result: TranslateResult | null) => void;
  countAdjustment: (a: Adjustment) => void;
  /** 承認して送信。原文と翻訳の一時状態はここで必ず破棄される。 */
  approveAndSend: (finalBody: string) => void;
  /** 送信せずやめる。原文を破棄する。 */
  discardDraft: () => void;
  setReaction: (id: string, reaction: Reaction) => void;
}

const EMPTY_DRAFT: DraftState = {
  raw: "",
  kind: null,
  translation: null,
  adjustCounts: { softer: 0, clearer: 0, shorter: 0 },
};

export const MAX_ADJUSTMENTS_PER_DIRECTION = 2;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: {
        onboarded: false,
        displayName: "",
        styleSample: "",
        apiKey: "",
        model: "gemini-flash-latest",
      },
      inbox: [],
      sent: [],
      draft: { ...EMPTY_DRAFT },

      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      setRaw: (raw) => set({ draft: { ...get().draft, raw } }),
      setKind: (kind) => set({ draft: { ...get().draft, kind } }),
      setTranslation: (translation) => set({ draft: { ...get().draft, translation } }),
      countAdjustment: (a) => {
        const counts = { ...get().draft.adjustCounts };
        counts[a] += 1;
        set({ draft: { ...get().draft, adjustCounts: counts } });
      },

      approveAndSend: (finalBody) => {
        const { draft, settings } = get();
        const kind = draft.kind ?? "contact";
        const now = new Date().toISOString();
        const payload = buildDeliveryPayload({
          id: crypto.randomUUID(),
          pairId: "solo", // フェーズ2でペアリング導入
          senderId: settings.displayName || "me",
          body: finalBody,
          sentAt: now,
        });
        const sentRecord: LocalSentMessage = { ...payload, kind, status: "delivered" };
        // フェーズ1は1台内ループ: 自分の受信箱に配達する。
        // 受信箱に入るのはDeliveryPayload由来の情報のみ(kind・原文は入らない)。
        const received: ReceivedMessage = {
          id: payload.id,
          senderId: payload.senderId,
          body: payload.body,
          sentAt: payload.sentAt,
        };
        set({
          sent: [sentRecord, ...get().sent],
          inbox: [received, ...get().inbox],
          draft: { ...EMPTY_DRAFT }, // 原文はここで破棄される
        });
      },

      discardDraft: () => set({ draft: { ...EMPTY_DRAFT } }),

      setReaction: (id, reaction) =>
        set({
          inbox: get().inbox.map((m) => (m.id === id ? { ...m, reaction } : m)),
        }),
    }),
    {
      name: "futari-post",
      storage: createJSONStorage(() => localStorage),
      // 原文(draft)は絶対に永続化しない。「送信後に消えます」の技術的保証。
      partialize: (state) => ({
        settings: state.settings,
        inbox: state.inbox,
        sent: state.sent,
      }),
    },
  ),
);
