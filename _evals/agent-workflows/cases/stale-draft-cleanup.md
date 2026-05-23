# stale-draft-cleanup

## Scenario

draft の `updated_at` が古く、stale になっている。昇格、延長、またはクローズ判断が必要。

## Initial State

- `_docs/draft/<Area>/<slug>/notes.md` が存在する。
- `status: proposed` かつ `updated_at` が30日より古い。
- 対応する intent はまだ存在しない。

## Agent Task

draft の内容を読み、昇格、延長、クローズのどれが妥当か判断する。archive は intent なしで実行しない。

## Expected Documents Touched

- `_docs/draft/<Area>/<slug>/notes.md`
- 昇格する場合は `_docs/plan/<Area>/<slug>/plan.md`
- 設計判断が固まった場合は `_docs/intent/<Area>/<slug>/decision.md`

## Expected TODO.md Behavior

- 継続作業が必要なら Backlog にタスクを追加する。
- 完了した cleanup タスクは `TODO.md` から削除する。

## Expected Validation Outcome

- 延長する場合、`stale_exempt_until` は有効な `YYYY-MM-DD`。
- 空文字の optional stale field を残さない。
- intent なし archive を行わない。

## Failure Modes to Watch

- stale draft を intent なしで archives へ移す。
- `stale_exempt_until: ""` のような空文字フィールドを残す。
- 古い draft を理由なく active にする。
