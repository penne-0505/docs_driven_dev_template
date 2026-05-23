---
name: post-implementation
description: Use after code changes are complete and before final response or PR summary.
---

# Post-Implementation

This skill focuses on the closure phase: update documentation, remove completed TODO entries from TODO.md, and communicate the changes so the team and codebase stay synchronized.

## Closure Flow

1. **Verify completion.** Confirm the work matches the original plan and acceptance criteria.
2. **Update TODO.md.** Remove completed tasks from TODO.md after confirming their Goal. Add follow-up tasks if needed.
3. **Update documentation.** Revise relevant docs (READMEs, API docs, design docs) to reflect changes. Update timestamps and authors.
4. **Summarize changes.** Prepare a clear summary of what was done, why, and any breaking changes or migrations needed.
5. **Communicate.** Share the summary with the team, link to PRs/commits, and note any follow-up work.

## Documentation Update Strategy

- Update docs that describe the changed functionality.
- Remove outdated information or mark as deprecated.
- Add examples if new features were introduced.
- Update diagrams, schemas, or data flow descriptions.
- Keep a changelog entry for significant changes.

## TODO.md Cleanup

- Remove fully completed items from TODO.md.
- Keep completion history in PRs, commits, CHANGELOG, intent, guide, or reference documents.
- Do not create or use Done / Archived sections in TODO.md.
- Add new TODOs for discovered issues or technical debt.
- Update priorities and assignments for remaining items.

## Change Communication

Include in your summary:

- What was implemented (features, fixes, refactors).
- Files/modules touched.
- Breaking changes or migrations required.
- Performance impacts or considerations.
- Known issues or limitations.
- Follow-up work or debt items.

## Deliverables After Implementation

- Updated TODO.md with completed items removed and follow-up tasks added if needed.
- Updated documentation reflecting the current state.
- Written summary of changes.
- Communication to stakeholders (PR description, Slack message, etc.).

## When to Use

Apply this skill whenever you finish implementation work—features, bug fixes, refactors, or documentation updates—to ensure proper closure and team alignment.

### Check for Existing Documentation

Before proceeding, check if documentation was created during implementation:

**Look for these directories:**

- `_docs/draft/<Area>/<slug>/notes.md`
- `_docs/plan/<Area>/<slug>/plan.md`
- `_docs/intent/<Area>/<slug>/decision.md`
- `_docs/survey/<Area>/<slug>/survey.md`
- `_docs/guide/<Area>/<slug>/usage.md` (may need creation/updates)
- `_docs/reference/<Area>/<slug>/reference.md` (may need creation/updates)

### Branching Logic

**If NO documentation exists:**

- Update TODO.md with completion status
- Summarize changes for communication
- Skip documentation-specific cleanup

**If documentation EXISTS:**

1. Update existing documents to reflect final implementation
2. Create guide/ and reference/ if they don't exist (recommended for public APIs)
3. Archive temporary documents (draft/plan/survey) only after the corresponding intent exists and the archive checklist passes
4. See the **docs-cleanup skill** for the full documentation workflow
