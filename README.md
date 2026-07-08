# ふたりの翻訳ポスト

夫婦向けメッセージPWA。感情のまま書き殴った言葉を、AIが本質(事実・気持ち・お願い)を保ったまま相手に届く言葉に翻訳し、送り手の承認を経て配達する。

## ステータス

**フェーズ1(1台内MVP)実装済み。** 書き殴り→種類選択→翻訳→調整(各2回)→承認→自分の受信箱に配達、のループが1台で動く。翻訳AIは**Google Gemini APIの無料枠**(各自の無料キーを端末ローカル保存)。

- 📄 [フェーズ0 デザインドキュメント](docs/phase0-design.md)(翻訳プロンプト全文・サンプル10組・安全分岐・画面遷移図)
- ✅ [フェーズ1 夫婦テストチェックリスト](docs/phase1-test-checklist.md)

## 2大原則

1. **受信側に「元の荒れ度」を一切漏らさない** — 全メッセージ統一フォーマット。原文は翻訳後に破棄し、配達ペイロードのスキーマに原文・種類フィールドを存在させない(`src/types.ts` / テストで担保)
2. **届く言葉は「AIの言葉」でなく「本人の言葉」** — 翻訳文は送り手が確認・編集・承認して初めて送信される。自動送信は実装しない

## 動かし方

```bash
npm install
npm run dev      # 開発サーバー
npm test         # Vitest(原文非残存・ペイロード遮断・翻訳分岐)
npm run build    # 型チェック+本番ビルド(GitHub Pages向け相対パス)
```

初回起動時のオンボーディングで、[Google AI Studio](https://aistudio.google.com/apikey) の無料APIキーを設定する(キーは端末のlocalStorageにのみ保存)。

## 構成

- Vite + React + TypeScript + Tailwind CSS v4 + Zustand(原文はpersist対象外=メモリのみ)
- 翻訳は `TranslatorGateway` 抽象(`src/gateway/`)を必ず通る。フェーズ1は `DirectGeminiGateway`(端末→Gemini直)。プロバイダ・有料化の差し替え点
- PWA: manifest + service worker(iPhone Safari「ホーム画面に追加」対応)
- フェーズ2以降: ペアリングと配達リレー(Cloudflare Workers)、リアクション同期、Web Push

## 注意(無料AIのデータ利用)

Gemini無料枠では送信内容がGoogleのサービス改善に利用されることがある。アプリ内(オンボーディング・設定)に明示済み。本気運用時はGemini有料枠への切替を推奨。
