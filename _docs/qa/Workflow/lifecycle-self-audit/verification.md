---
title: "QA Verification: Lifecycle Self-Audit Hooks"
status: active
draft_status: n/a
qa_status: verified
risk: Medium
created_at: 2026-07-13
updated_at: 2026-07-13
references:
  - "_docs/intent/Workflow/lifecycle-self-audit/decision.md"
  - "_docs/plan/Workflow/lifecycle-self-audit/plan.md"
  - "_docs/qa/Workflow/lifecycle-self-audit/test-plan.md"
related_issues: []
related_prs: []
---

# QA Verification: Lifecycle Self-Audit Hooks

## Summary

Codex / Claude Code の `UserPromptSubmit`、書き込み前 `PreToolUse`、完了時 `Stop` に phase-aware な自己監査を追加し、既存 safety / docs closure guard と共通 script 契約を維持していることを確認した。

## Verification Verdict

Verdict: PASS

## Commands Run

```bash
deno fmt scripts/agent-workflow-hook.ts scripts/test-agent-workflow-hook.ts scripts/test-agent-workflow-smoke.ts
deno run --allow-read --allow-run=git scripts/test-agent-workflow-hook.ts
deno run --allow-read scripts/test-agent-workflow-smoke.ts
./scripts/check-docs.sh
npx markdownlint-cli2 "_docs/**/*.md" "_evals/**/*.md" "README.md" "AGENTS.md" "TODO.md" "QUICKSTART.md" "!_docs/archives/**/*" "!_docs/standards/templates/**/*" --config .markdownlint.jsonc
```

Result:

```text
Hook unit tests: PASS (13 checks)
Agent workflow smoke tests: PASS (10 checks)
Documentation validators and fixtures: PASS
Markdownlint: PASS (44 files, 0 errors)
```

## Automated Test Results

| Command / Test | Result | Notes |
| --- | --- | --- |
| `scripts/test-agent-workflow-hook.ts` | PASS | short prompt context、write/read 分岐、Stop の audit gate、既存 deny を確認 |
| `scripts/test-agent-workflow-smoke.ts` | PASS | Codex / Claude Code の4イベントと共有 script を確認 |
| `./scripts/check-docs.sh` | PASS | formatter、validator fixtures、hook unit / smoke を通過 |
| `npx markdownlint-cli2 ...` | PASS | 44 files、0 errors |

## Manual QA Results

| Checklist Item | Result | Notes |
| --- | --- | --- |
| representative `UserPromptSubmit` JSON | PASS | `hookSpecificOutput.additionalContext` に短い仮説・反証・Scope 確認を返した |
| representative write `PreToolUse` JSON | PASS | root cause、non-local effects、durability、scope boundary を返した |
| representative passing `Stop` JSON | PASS | 検証と3監査観点を含む完了メッセージを block しなかった |
| live project hook injection | PASS | 実ファイル編集時に新しい `PreToolUse` context が実際に注入された |
| chain-of-thought / scope review | PASS | 外部検証可能な判断・テスト・残リスクだけを求め、Scope 拡張を自動承認しない |

## Acceptance Criteria Coverage

| ID | Result | Evidence |
| --- | --- | --- |
| AC-001 | PASS | 両設定の `UserPromptSubmit`、unit / smoke、manual JSON |
| AC-002 | PASS | write tool context と read-only no-context の unit test、live injection |
| AC-003 | PASS | verification のみでは block、複数監査観点があれば通過する unit test |
| AC-004 | PASS | unit / smoke / docs validators / markdownlint |

## Invariant Coverage

| ID | Result | Evidence |
| --- | --- | --- |
| INV-001 | PASS | prompt context の内容と 240 文字未満を unit test で固定 |
| INV-002 | PASS | write-only context、Scope boundary、read-only no-context を unit test で固定 |
| INV-003 | PASS | distinct audit perspective count と Stop allow / block cases を unit test で固定 |
| INV-004 | PASS | 状態ファイルなし、両設定が共有 script を呼ぶ smoke test |
| INV-005 | PASS | deletion、sensitive file、recursive Stop の regression checks |

## Deferred / Not Covered

| ID | Reason | Follow-up |
| --- | --- | --- |
| Claude Code interactive runtime | この環境では Claude Code session を起動していない。公式互換 JSON shape、共有 CLI、設定 smoke は確認済み。 | なし。利用時の `/hooks` trust review で有効化を確認する。 |
| Semantic audit quality | hook は監査語句の存在を検出できるが、agent の判断内容そのものは証明できない。 | QA evidence、diff review、明示的 verification を引き続き使用する。 |
| Hook trust activation | project-local hook の hash 変更後は自動実行されない場合がある。 | 各 agent の `/hooks` で変更内容を確認して再 trust する。 |

## Residual Risks

None

## Follow-up TODOs

- なし。
