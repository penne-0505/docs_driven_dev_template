---
title: "Intent: Phase-Aware Lifecycle Self-Audit"
status: active
draft_status: n/a
created_at: 2026-07-12
updated_at: 2026-07-12
references:
  - "_docs/plan/Workflow/lifecycle-self-audit/plan.md"
  - "_docs/qa/Workflow/lifecycle-self-audit/test-plan.md"
related_issues: []
related_prs: []
---

# Intent: Phase-Aware Lifecycle Self-Audit

## Context

「過去のバイアスに引っ張られない」「全体最適」「長期的解決」「長期的安定」という原則は重要だが、同じ抽象文を高頻度で注入すると、復唱だけが増え、局所変更でも無制限な再設計を誘発し得る。既存 hook は SessionStart、PreToolUse、Stop を使うため、監査を作業段階へ割り当てられる。

## Decision

- `UserPromptSubmit` では、現在の仮説を既知の証拠と反証候補に照らし、Scope / Intent を再確認する短い context だけを注入する。
- 書き込み系 `PreToolUse` では、根本原因、非局所影響、短期策と恒久策、互換性維持の根拠を確認する context を注入する。
- relevant change の完了時は、`Stop` が検証証跡に加え、反証・影響範囲・長期保守性を複数観点から監査した記述を要求する。
- ターン数カウンターは導入しない。監査頻度を作業段階へ結び付ける。
- agent に推論過程の開示は求めず、判断根拠・検証証跡・残リスクという外部検証可能な結果だけを求める。

## Alternatives

- 4原則を毎プロンプトそのまま注入する案: prompt noise と形式的復唱が増えるため不採用。
- N ターンごとに注入する案: session 再開、compact、並行実行時のターン定義と永続状態が不安定なため不採用。
- Stop だけで監査する案: 実装方針を変えられる段階を過ぎてから問題を検出するため不採用。
- hook が自動的に広域リファクタを選ぶ案: Scope とユーザー権限を越えるため不採用。

## Rationale

監査を開始・実装・完了の境界へ分けることで、短い再確認と具体的な品質 gate を両立できる。状態を持たないため、Codex と Claude Code の共通 script を維持しやすい。

## Consequences / Impact

- 各ユーザープロンプト前に軽量な command hook が1回増える。
- 書き込み系 tool 呼び出しでは追加 context がモデルへ渡るが、既存の block 判定は維持される。
- relevant change の完了報告では、検証だけでなく監査結果または残リスクの明示が必要になる。
- project-local hook の hash が変わるため、利用者は再度 trust review を行う必要がある。

## Quality Implications

- 監査文言が抽象標語へ退行しないこと。
- Scope / Non-Goals を越えた変更を「全体最適」として正当化しないこと。
- hook の存在を QA evidence の代替にしないこと。
- 既存の破壊的操作・secret・archive guard を回帰させないこと。

## Intent-derived Invariants

- INV-001: 毎プロンプトの context は短く、仮説・反証・Scope / Intent の再確認に限定する。
- INV-002: 書き込み前監査は根本原因、非局所影響、短期策と恒久策、互換性根拠を確認し、Scope 拡張を自動承認しない。
- INV-003: relevant change の完了は、検証証跡と複数観点の自己監査または明示的な残リスクなしに通過しない。
- INV-004: 監査 hook は状態を永続化せず、Codex / Claude Code で共通 script と挙動を共有する。
- INV-005: 既存の deletion、sensitive-file、archive、docs closure guard は維持される。

## Enforced in

- INV-001: `scripts/agent-workflow-hook.ts` の `UserPromptSubmit` 出力と unit test。
- INV-002: `scripts/agent-workflow-hook.ts` の書き込み系 `PreToolUse` 出力と unit test。
- INV-003: `scripts/agent-workflow-hook.ts` の `Stop` 判定と unit test。
- INV-004: `.codex/hooks.json`、`.claude/settings.json`、smoke test。
- INV-005: `scripts/test-agent-workflow-hook.ts` の regression checks。

## Rollback / Follow-ups

問題があれば `UserPromptSubmit` の設定と非 blocking audit context を外し、既存の safety / closure 判定へ戻す。永続状態や migration はない。
