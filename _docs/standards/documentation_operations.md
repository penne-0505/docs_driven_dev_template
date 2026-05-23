# ドキュメント運用標準

## 目的
- `_docs/draft/` と `_docs/plan/` を中心に、ドキュメント種別ごとの役割と運用境界を明確化する。
- 昇格・更新・廃止フローを標準化し、全メンバーが同じ基準で扱えるようにする。
- Front-matter と Markdown テンプレートを連携させ、ドキュメント品質と可観測性を高める。
- 一時ドキュメント（`draft`/`plan`/`survey`）から `intent` への昇格条件、および `_docs/archives/` への移送条件を厳格に定義し、履歴整理と追跡を容易にする。

## 適用範囲
- 対象: `_docs/draft/`, `_docs/plan/`, `_docs/survey/`, およびそれらと連携する `intent/`, `guide/`, `reference/`, `archives/`。
- 適用範囲: ドキュメント作成・更新・保守・自動化。
- 非対象: アプリケーションコードや API の実装規約（別 standards を参照）。

## ディレクトリの役割

| パス | 目的 | 主な利用者 | 備考 |
| --- | --- | --- | --- |
| `_docs/draft/<Area>/<slug>/notes.md` | アイデア、検討メモ、仮説、代替案等の一時保管 | 設計者・実装者・調査担当 | `updated_at` 基準で stale 管理。決定事項はここに残さない。 |
| `_docs/survey/<Area>/<slug>/survey.md` | 調査・検証レポート | 調査担当・意思決定者 | plan/intent から根拠として参照。 |
| `_docs/plan/<Area>/<slug>/plan.md` | 合意済み仕様・実施計画の単一参照点 | 施策オーナー・実装担当 | `Size >= M` の TODO で必須。 |
| `_docs/intent/<Area>/<slug>/decision.md` | 設計判断・意思決定ログ | 設計判断を参照する開発者 | 恒久記録。archive しない。 |
| `_docs/guide/<Area>/<slug>/usage.md` / `_docs/reference/<Area>/<slug>/reference.md` | 実装済み機能の運用ガイド・リファレンス | 全メンバー | plan の結果を反映。議論や検討は含めない。 |
| `_docs/archives/{draft,plan,survey}/<Area>/<slug>/...` | intent 作成済み一時ドキュメントの保管庫 | 後から経緯を参照する開発者 | front-matter を保持したまま履歴保存。 |

`<Area>` は `TODO.md` の `Area` と一致させる。`<slug>` は機能・変更単位の kebab-case 名にする。

## ライフサイクルと昇格ルール

1. **標準フロー**: `draft/survey → plan → intent → (guide/reference)`
   - 大規模な変更（`Size >= M`）や、設計判断が必要な機能追加に適用。
   - `draft` / `survey` / `plan` は、対応する `intent` が存在し、archive checklist を満たす場合のみ archives へ移送する。

2. **軽量フロー (Fast Track)**: `TODO定義(Steps) → intent (事後) → (guide/reference)`
   - 小規模な修正（`Size < M`）に適用。
   - `TODO.md` 上でタスク定義と手順（Steps）が明確である場合、`draft` および `plan` の作成を省略できる。
   - ただし、実装完了後、必要に応じて `guide/reference` の更新や、重要な判断があれば `intent` の作成を行うこと（事後ドキュメント化）。

3. **draft 運用**
   - 進行状況は Front-matter の `draft_status` で管理。
   - 意思決定前の仮説や代替案は `## Hypothesis`, `## Options` セクションに記述。
   - `updated_at` から一定期間（既定30日）更新がない場合、昇格 / クローズ / 延長のいずれかを行う。

4. **plan 運用**
   - 合意済み仕様のみ。抽象的な検討や議論は `intent/` へ移す。
   - plan は intent に昇華するための原典として扱う。
   - intent 作成後、archive checklist を満たす場合のみ、対応する plan 原本は `_docs/archives/plan/<Area>/<slug>/plan.md` へ移送する。
   - 破壊的変更や方針転換時は `updated_at` を更新し、必要に応じて `status` を `proposed` に戻す。
   - 非推奨になった計画は `status: superseded` とし、後継 plan を本文内で明記。

5. **昇格ゲート (draft → plan)**
   - `## Scope` / `## Non-Goals` が網羅的に記載されている。
   - 影響範囲（API, データ, 移行, セキュリティ, パフォーマンス, i18n/a11y）が洗い出されている。
   - `## Test Plan`の方針が定義済み。
   - リスク分析と `## Rollback` 戦略が用意されている。
   - 関連 Issue / PR が front-matter で紐付いている。(存在する場合)

## 一時ドキュメントのアーカイブルール
- `draft`、`plan`、`survey` は「開発過程専用の一時ドキュメント」であり、対応する `intent` を作成していない状態でのアーカイブを禁止する。
- `intent` は恒久的な設計判断ログであり、archive 対象にしない。
- archive 対象は `draft` / `plan` / `survey` のみとする。
- 一時ドキュメントの移行フロー:
  1. 一時ドキュメントを `intent` テンプレートへ再構成する。
  2. `intent` を `_docs/intent/<Area>/<slug>/decision.md` に作成し、一時ドキュメントと相互参照する。
  3. アーカイブ移送時は、元ディレクトリから原本を取り除き、`_docs/archives/{draft,plan,survey}/<Area>/<slug>/...` へ同じ front-matter を保持したまま移す。
- 違反例:
  - 対応する `intent` を作成しないまま `_docs/archives/` へ移動する。
  - `intent` を `_docs/archives/` へ移動する。
  - アーカイブ後も元ディレクトリに原本を残す。
- アーカイブ実施時は、対応する `intent` の存在、移動後ディレクトリのクリーンアップ、相互リンク更新を確認する。

## 破壊的操作と archive 移送
- `rm` / `git rm` による恒久削除は禁止する。不要に見えるファイルでも、削除はユーザーに提案して実行を待つ。
- archive checklist を満たす一時ドキュメントの移送に限り、`mv` / `git mv` を許可する。
- archive 移送は削除ではなく、履歴保持のための移動として扱う。
- archive 実行前に、対応する `intent` が存在し、対象一時ドキュメントへの参照または相互リンクがあることを確認する。

## TODO.md 完了処理
- 完了タスクは `TODO.md` から削除する。
- 完了履歴は PR、commit、CHANGELOG、intent、guide、reference に残す。
- `TODO.md` に Done / Archived セクションを作らない。
- follow-up が必要な場合は、新しい ID を採番して Backlog に追加する。

## アーカイブ実行チェックリスト
1. 対応する `_docs/intent/<Area>/<slug>/decision.md` が作成済みであることを確認する。
2. アーカイブ対象ドキュメントと `intent` が `references` または本文リンクで関連付けられていることを確認する。
3. アーカイブ対象ドキュメントの front-matter を保持したまま `_docs/archives/{draft,plan,survey}/<Area>/<slug>/...` へ移す。
4. 移行元ディレクトリのクリーンアップを差分で確認し、同じ一時ドキュメントが live path に残っていないことを確認する。
5. アーカイブ対象と関連する `intent` を `references` フィールドに追記し、相互リンクを更新する。
6. 必要に応じて `CHANGELOG.md` や関連 Issue へ作業ログを残す。

## 必須フィールド一覧（全ドキュメント共通）
全てのドキュメントは以下の8つの必須フィールドを持つ（draft は後述の任意フィールドを追加してもよい）。

| フィールド | 説明 |
| --- | --- |
| `title` | 文書タイトル（英語推奨） |
| `status` | `proposed` \| `active` \| `superseded` |
| `draft_status` | `idea` \| `exploring` \| `paused` \| `n/a` |
| `created_at` | `YYYY-MM-DD` |
| `updated_at` | `YYYY-MM-DD` |
| `references` | 関連リンク配列（`[]` 許容） |
| `related_issues` | 関連Issueの番号配列 (ない場合は空配列 `[]`) |
| `related_prs` | 関連PRの番号配列 (ない場合は空配列 `[]`) |

任意フィールド（draft の stale 管理向け）:
- `stale_exempt_until: YYYY-MM-DD`
- `stale_exempt_reason: <string>`
- `stale_extensions: <number>`（延長ごとに+1）

## ドキュメント構造とテンプレート

Front-matterを簡素化する代わりに、ドキュメント種別ごとに推奨されるMarkdownの見出し構造（テンプレート）を定義する。
執筆者は以下の構造に従って本文を記述することで、必要な情報の網羅性を担保する。

### 共通セクション（全ドキュメント推奨）

注: **担当者名（Owners）の記述は不要。**

### Plan ドキュメントの構造例

計画書には、以前Front-matterで管理していたスコープや要件定義を本文として記述する。

```markdown
## Overview
概要を記述。

## Scope
- 実装する機能範囲
- 変更の影響範囲

## Non-Goals
- 今回のスコープに含まれないもの

## Requirements
- **Functional**: 機能要件
- **Non-Functional**: 非機能要件

## Tasks
- 実装タスク一覧

## Test Plan
- テスト戦略、観点

## Deployment / Rollout
- デプロイ手順、ロールバック方針
````

### Draft ドキュメントの構造例

```markdown
## Hypothesis
- 検証したい仮説

## Options / Alternatives
- 検討中の選択肢
- トレードオフの比較
```

**ただし、draft はあくまでメモ置き場であるため、必須セクションは特に定めない。plan ドキュメント昇格直前など、趣旨が一致する場合のみセクション名を踏襲すること。**

## コンプライアンス
  - ドキュメントに秘密情報・個人情報を含めない。環境値は `.env.example` を参照。
  - CI ログ出力にはマスク設定を適用し、機密情報が残らないようにする。
  - 公開資料として扱える品質を前提に、OSS 化を想定した文言に統一する。
  - intent 作成後のみアーカイブできるルールを遵守する。
