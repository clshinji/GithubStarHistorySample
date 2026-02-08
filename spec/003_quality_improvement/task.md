# タスクリスト - 品質向上と不具合修正

- [x] **1. SDD準備**
  - [x] requirements.md の作成
  - [x] design.md の作成
  - [x] task.md の作成

- [x] **2. 描画・UIの不具合修正**
  - [x] Logic: 棒グラフ・積み上げ棒グラフの表示バグ修正
  - [x] Logic: ツールチップの座標ズレと設定の修正
  - [x] Logic: Log scale 時のY軸オートスケール実装

- [x] **3. データ取得ロジックの抜本的改善**
  - [x] Logic: GitHub API 限界点（422）を特定する二分探索の導入
  - [x] Logic: Promise.all によるチャンク単位の並列Fetch実装
  - [x] Test: LangChain (12万スター) での滑らかな描画確認

- [x] **4. ダークモード対応**
  - [x] UI: Tailwind CSS による配色切り替え (dark:クラス)
  - [x] Logic: システム設定の検知とグラフ色の自動調整

- [ ] **5. 最終検証と成果物の検査**
  - [ ] フィードバック項目の全クリア確認
  - [ ] バックログの更新
