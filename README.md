# GitHub Star History Maker ⭐

GitHubリポジトリのスター数の推移を時系列でグラフ化し、複数のリポジトリを比較できるブラウザツールです。

## ✨ 特徴

- **複数リポジトリ比較**: 複数のリポジトリを同時にプロットして比較できます。
- **多彩なグラフ形式**: 折れ線グラフ、棒グラフ、積み上げ棒グラフに対応。
- **柔軟なカスタマイズ**: 
  - リポジトリごとに好きな色を設定可能
  - 表示期間の指定（全期間 or カスタム）
  - X軸・Y軸の表示範囲の手動調整
- **プライバシー配慮**: GitHub Tokenはブラウザの `LocalStorage` にのみ保存され、外部サーバーには送信されません。
- **大規模リポジトリ対応**: 10万スターを超えるようなリポジトリでも、サンプリング取得により概形を表示可能です。

## 🚀 使い方

1. `index.html` をブラウザで開きます。
2. 右上の設定アイコン（歯車）をクリックし、GitHub Token を設定することを推奨します（APIレート制限を回避するため）。
3. 左側の入力欄に `owner/repo` 形式（例: `langchain-ai/langchain`）またはリポジトリのURLを入力し、「Add」ボタンを押します。
4. グラフが表示されます。左側のコントロールパネルやグラフ上のオプションで表示を調整してください。

## 🛠 技術スタック

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (CDN)
- **Charting**: [Chart.js](https://www.chartjs.org/)
- **API**: [GitHub REST API v3](https://docs.github.com/en/rest)

## 📝 開発ドキュメント (SDD)

本プロジェクトは仕様駆動開発 (SDD) に基づいて作成されています。詳細は `spec/` ディレクトリを参照してください。

## ⚖️ ライセンス

MIT License
