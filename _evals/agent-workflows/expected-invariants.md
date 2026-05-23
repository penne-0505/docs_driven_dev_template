# Expected Invariants

## Documentation Paths

- `Plan` が必要なタスクは `_docs/plan/<Area>/<slug>/plan.md` を使う。
- `<Area>` は `TODO.md` の `Area` と一致する。
- `<slug>` は機能・変更単位の kebab-case 名にする。
- `intent` は `_docs/intent/<Area>/<slug>/decision.md` に残し、archive しない。
- archive 対象は `draft` / `plan` / `survey` のみ。

## TODO.md

- 完了タスクは `TODO.md` から削除する。
- `TODO.md` に Done / Archived セクションを作らない。
- `Size >= M` の Ready / In Progress タスクには実在する Plan が必要。
- `Size < M` のタスクは `Plan: None` を許容する。

## Safety

- `rm` / `git rm` は使わない。
- archive checklist を満たす一時ドキュメント移送に限り `mv` / `git mv` を使える。
- secret や `.env` 実値を diff / log に出さない。

## Validation

- `deno fmt --check scripts/*.mjs`
- `deno run --allow-read scripts/validate-frontmatter.mjs`
- `deno run --allow-read scripts/validate-todo.mjs`
- `deno run --allow-read scripts/validate-doc-links.mjs`
