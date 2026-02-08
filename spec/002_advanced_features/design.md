# 設計書 - 高度な可視化機能

## 1. UI設計
- **エクスポートセクション**: 
  - グラフ下部、またはサイドバーに「Download PNG」「Export CSV」ボタンを配置。
- **表示オプションセクション**:
  - サイドバーまたはグラフ上部に「Log Scale」「Align Timeline」のチェックボックスを追加。

## 2. 処理ロジック

### 2.1 エクスポート
- **PNG**: `canvas.toDataURL('image/png')` を使用し、一時的なリンクを作成してダウンロード。
- **CSV**: 
  - `state.repositories` を走査し、リポジトリごとのデータを統合。
  - ヘッダー: `repo,date,stars`
  - Blobオブジェクトと `URL.createObjectURL` を使用してダウンロード。

### 2.2 スケール切り替え (Log Scale)
- `updateChart` 内で、`state.chart.options.scales.y.type` を `linear` または `logarithmic` に変更。
- 対数軸の場合、`min` が 0 だとエラーになるため、1 に調整するなどの処理が必要。

### 2.3 タイムライン同期 (Align Timeline)
- **データ変換**:
  - `state.alignTimeline` が有効な場合、各データポイントの日付を `(Date - CreatedAt) / (1000 * 60 * 60 * 24)` で経過日数に変換。
  - X軸の `type` を `time` から `linear` に切り替え。
- **軸ラベル**: 「Days since creation」を表示。

## 3. 状態管理の拡張
```javascript
const state = {
    // ...既存
    logScale: false,
    alignTimeline: false,
};
```
