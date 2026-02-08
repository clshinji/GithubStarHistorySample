# 設計書 - 品質向上と不具合修正

## 1. データ取得ロジックの改善

### 1.1 二分探索サンプリング (Smart Sampling)
GitHub API の限界点（422エラーが返るページ）を二分探索で見つけ出す。
1. `minPage = 1`, `maxPage = totalStars / 100`
2. 中間地点のページを Fetch してみる。
3. 成功すれば `minPage` を上げ、失敗すれば `maxPage` を下げる。
4. この「成功限界ページ」までの範囲で、均等に 30〜50 点をサンプリングする。

### 1.2 並列Fetch
`for...of` で一つずつリクエストしていた箇所を、`Promise.all` に変更する。ただし、一度に大量のリクエストを送ると API に拒否される可能性があるため、チャンク（例: 5件ずつ）に分けて並列実行する。

## 2. 描画・UI修正

### 2.1 棒グラフの修正
- `script.js` の `updateChart` 内で、データセットの `backgroundColor` を確実に設定する。
- 棒グラフの場合、ポイント（点）ではなく「棒」として描画されるよう、Chart.js の `bar` 固有のオプションを調整。

### 2.2 Log scale オートスケール
- 各リポジトリの最小スター数を取得。
- `Math.floor(Math.log10(minStars))` を用いて、10のべき乗（10, 100, 1000...）を算出。
- その値を Y軸の `min` に設定する。

### 2.3 ダークモード
- `index.html` の `body` に `bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100` などのクラスを追加。
- `script.js` でテーマを検出し、Chart.js のグローバル設定（`Chart.defaults.color` 等）を上書きする。

## 3. 状態管理の追加
```javascript
const state = {
    // ...
    theme: 'light', // 'light' or 'dark'
};
```
