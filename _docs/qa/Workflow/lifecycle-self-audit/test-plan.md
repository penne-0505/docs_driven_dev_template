---
title: "QA Test Plan: Lifecycle Self-Audit Hooks"
status: active
draft_status: n/a
qa_status: planned
risk: Medium
created_at: 2026-07-12
updated_at: 2026-07-13
references:
  - "_docs/intent/Workflow/lifecycle-self-audit/decision.md"
  - "_docs/plan/Workflow/lifecycle-self-audit/plan.md"
related_issues: []
related_prs: []
---

# QA Test Plan: Lifecycle Self-Audit Hooks

## Source of Intent

- TODO: `Workflow-Enhance-9`
- Plan: `_docs/plan/Workflow/lifecycle-self-audit/plan.md`
- Intent: `_docs/intent/Workflow/lifecycle-self-audit/decision.md`

## Quality Goal

抽象的な品質標語を反復するのではなく、Codex と Claude Code が作業段階に応じて反証・全体影響・恒久性を確認し、既存 guard を維持できること。

## Acceptance Criteria

- AC-001: 両 agent の `UserPromptSubmit` が短い自己監査 context を毎プロンプト注入する。
- AC-002: 書き込み系 `PreToolUse` が具体的な実装前監査 context を返す。
- AC-003: relevant change の `Stop` が検証と複数観点の監査証跡を要求する。
- AC-004: unit / smoke / docs validator が共通挙動と誤作動防止を検証する。

## Intent-derived Invariants

- INV-001: 毎プロンプト context は仮説・反証・Scope / Intent の短い再確認に限定する。
- INV-002: 書き込み前監査は Scope 拡張を自動承認せず、根本原因・非局所影響・恒久性・互換性根拠を確認する。
- INV-003: relevant change の完了は検証証跡と複数観点の監査または残リスクを必要とする。
- INV-004: 状態を永続化せず、Codex / Claude Code で共通 script を使う。
- INV-005: 既存 safety / docs closure guard を維持する。

## Risk Assessment

- Risk level: Medium
- Risk rationale: agent workflow と完了判定へ影響する。
- Regression risk: Stop の過剰 block、PreToolUse の既存 deny 消失、片方の agent 設定だけが更新される可能性がある。
- Data safety risk: 永続状態と migration を導入しないため低い。
- Security / privacy risk: prompt や transcript を保存・外送しない。
- UX risk: 毎プロンプト hook の遅延と prompt noise。
- Agent misbehavior risk: 抽象文の復唱、Scope 外の過剰改修、監査語の記載だけで gate を回避する可能性がある。

## Test Strategy

- Unit: exported analyzer の event output と既存 block 判定を直接検証する。
- Integration: JSON 設定と共有 script の対応を smoke test する。
- Manual QA: representative hook input を CLI へ与え、JSON shape と context を確認する。
- Validator / static check: `./scripts/check-docs.sh`、Deno formatter、markdownlint。
- Diff review: intent の Non-Goals と実装範囲、権限、状態非保持を確認する。

## Test Matrix

| ID | Source | Requirement / Invariant | Test Type | Command / File | Expected Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| AC-001 / INV-001 | TODO / intent | 両 agent が短い毎プロンプト context を共有する | unit + smoke | `scripts/test-agent-workflow-{hook,smoke}.mjs` | `UserPromptSubmit` と context 内容が PASS | verified |
| AC-002 / INV-002 | TODO / intent | 書き込み前に具体的監査を行い Scope を越えない | unit | `scripts/test-agent-workflow-hook.mjs` | write tool は context、read tool は追加なし | verified |
| AC-003 / INV-003 | TODO / intent | 完了時に検証と複数観点の監査を要求する | unit | `scripts/test-agent-workflow-hook.mjs` | evidence 不足は block、充足時は allow | verified |
| AC-004 / INV-004 | TODO / intent | 共通 script、状態非保持、設定同期 | smoke + diff review | `scripts/test-agent-workflow-smoke.mjs` | 両設定の4イベントと同じ command が PASS | verified |
| INV-005 | intent | 既存 safety / closure guard を維持する | regression | `scripts/test-agent-workflow-hook.mjs` | deletion / secret / recursive Stop checks が PASS | verified |
| AC-004 | TODO | docs 契約が構造的に妥当 | validator | `./scripts/check-docs.sh` | 全 validator が exit 0 | verified |

## Manual QA Checklist

- [x] `UserPromptSubmit` 入力が `additionalContext` を返す。
- [x] 書き込み系 `PreToolUse` は deny せず audit context を返し、破壊的操作は従来どおり deny する。
- [x] `Stop` は質問・変更なし・再帰呼び出しを不必要に block しない。
- [x] context が chain-of-thought の開示や Scope 外変更を要求していない。

## Regression Checklist

- [x] `rm` / `git rm` / apply_patch deletion が block される。
- [x] sensitive file の読み書き guard が維持される。
- [x] archive 境界と docs closure が維持される。
- [x] Codex / Claude Code の設定が同じ共有 script を呼ぶ。

## Out of Scope

- N ターンごとのカウンター、外部ログ、prompt 保存、モデル内部推論の取得。

## Open Questions

- なし。ユーザー合意済みの phase-aware 構成で進める。
