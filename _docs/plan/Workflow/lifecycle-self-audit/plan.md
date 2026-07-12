---
title: "Plan: Lifecycle Self-Audit Hooks"
status: active
draft_status: n/a
created_at: 2026-07-12
updated_at: 2026-07-12
references:
  - "_docs/intent/Workflow/lifecycle-self-audit/decision.md"
  - "_docs/qa/Workflow/lifecycle-self-audit/test-plan.md"
related_issues: []
related_prs: []
---

# Plan: Lifecycle Self-Audit Hooks

## Overview

Codex と Claude Code の共通 lifecycle hook に、短い毎プロンプトの再確認と、書き込み前・完了時の具体的な自己監査を追加する。

## Scope

- `.codex/hooks.json` と `.claude/settings.json` に `UserPromptSubmit` を追加する。
- 共通 hook script が `UserPromptSubmit`、書き込み系 `PreToolUse`、relevant change の `Stop` で監査コンテキストを返す。
- unit / smoke tests と README / Quickstart を現在の挙動へ同期する。

## Non-Goals

- session ごとのターン数を永続化し、N ターンごとに実行する仕組みは作らない。
- 「全体最適」を理由に、合意済み Scope / Non-Goals を越えた再設計を agent に要求しない。
- hook だけで品質や安全性を保証したとは扱わない。
- agent の非公開な推論過程や chain-of-thought の出力を要求しない。

## Requirements

- **Functional**: 毎プロンプトでは短い再確認を注入し、書き込み前には根拠・影響範囲・保守性、完了時には独立した複数観点の監査証跡を確認する。
- **Non-Functional**: Codex / Claude Code の共通 script を維持し、状態ファイルや外部依存を増やさず、既存の deletion / secret guard と docs closure を維持する。

## Tasks

1. event 名と出力 helper を拡張する。
2. 書き込み系 `PreToolUse` へ非 blocking の追加コンテキストを返す。
3. `Stop` の closure evidence を、検証に加えて自己監査の観点も確認する形へ更新する。
4. 両 hook 設定、unit / smoke tests、利用文書を同期する。

## QA Plan

- QA document: `_docs/qa/Workflow/lifecycle-self-audit/test-plan.md`
- Risk level: Medium
- Test strategy:
  - Unit: event ごとの出力と既存 block 判定を検証する。
  - Integration: 両設定が同じ共通 script と4イベントを参照することを smoke test する。
  - Manual QA: representative JSON を script へ入力し、Codex / Claude 互換の JSON を確認する。
  - Validator / static check: `./scripts/check-docs.sh` と markdownlint を実行する。

## Deployment / Rollout

project-local hook は変更後に再 trust が必要になる。問題があれば `UserPromptSubmit` 設定を無効化し、既存3イベントへ戻せる。状態移行やデータ migration はない。
