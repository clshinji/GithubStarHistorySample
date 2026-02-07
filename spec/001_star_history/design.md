# 設計書 - GitHub Star History メーカー

## 1. 画面構成
単一ページ（SPA風）の構成とする。
- **ヘッダー**: サイトタイトル、設定（GitHub Token）ボタン。
- **入力エリア**:
  - リポジトリURL入力フィールド + 追加ボタン。
  - 追加済みリポジトリのリスト（色変更、削除ボタン付き）。
  - 期間指定トグル（全期間 / 指定期間）＋ 日付入力。
- **グラフ表示エリア**:
  - グラフ描画キャンバス（Chart.js）。
  - グラフ種類切り替え（折れ線、積み上げ棒、棒）。
  - 軸範囲の調整スライダー/入力。
- **設定モーダル**:
  - GitHub Token 入力欄。
  - Token取得ガイド（手順説明とGitHubへのリンク）。
- **フッター**: 作者情報、ライセンス。

## 2. 技術選定
- **HTML/CSS**: UIの構築。CSSフレームワーク（Tailwind CSS CDN版）を使用して迅速にスタイリングする。
- **JavaScript (Vanilla JS)**: ロジックの実装。
- **Chart.js**: グラフ描画。
- **GitHub API v3**:
  - `GET /repos/{owner}/{repo}`: リポジトリの基本情報（作成日、スター総数）を取得。
  - `GET /repos/{owner}/{repo}/stargazers`: スター履歴の取得。
    - `Accept: application/vnd.github.v3.star+json` ヘッダーを使用してスター日時を取得する。

## 3. データ取得戦略
- GitHub API の `stargazers` エンドポイントは1ページあたり最大100件まで取得可能。
- 数万スターあるリポジトリの全件を取得すると API レート制限に即座に達するため、サンプリングを行う。
  - 総スター数を基に、約30〜50ポイント程度のデータを均等にサンプリングして取得する。
  - 最後のページ（最新のスター）は必ず取得する。

## 4. データ構造
- **リポジトリデータ**:
  ```javascript
  {
    fullName: "owner/repo",
    color: "#ff0000",
    starHistory: [ { date: "2023-01-01", count: 100 }, ... ]
  }
  ```
- **設定データ**:
  - `github_token`: LocalStorage に保存。

## 5. GitHub Token 取得ガイドの内容
1.  GitHub の [Fine-grained personal access tokens](https://github.com/settings/tokens?type=beta) または [Classic tokens](https://github.com/settings/tokens) ページに移動。
2.  「Generate new token」をクリック。
3.  Token 名を入力（例: `Star History Tool`）。
4.  **権限設定**: 公開リポジトリのスター履歴取得には **権限のチェックは不要**（すべてOFFでOK）。
5.  生成されたトークンをコピーして、本ツールの設定欄に貼り付け。
6.  注意点: トークンはブラウザ内にのみ保存され、安全であることを明記。
