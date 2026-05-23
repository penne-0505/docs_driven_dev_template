---
name: docs-cleanup
description: Use after post-implementation for Size >= M changes with draft/plan/survey/intent documents.
---

# Documentation Cleanup

This skill focuses on finalizing documentation after large implementations, following the project's documentation protocol and archive rules.

## When to Use

Use this skill for **large changes (Size >= M)** or when documentation was created during implementation:

- Features with draft/plan/intent documents
- Breaking changes with migration documentation
- Architecture decisions recorded in intent/
- Research findings in survey/

For small changes (Size < M), use **post-implementation** alone and skip this skill.

## Documentation Cleanup Workflow

### 1. Review Documentation State

Check what documentation exists:

```
_docs/
├── draft/<Area>/<slug>/notes.md        # May exist from pre-implementation
├── survey/<Area>/<slug>/survey.md      # May exist for research-heavy features
├── plan/<Area>/<slug>/plan.md          # Should exist for Size >= M
├── intent/<Area>/<slug>/decision.md    # Permanent design decision log
├── guide/<Area>/<slug>/usage.md        # Need to create for implemented features
└── reference/<Area>/<slug>/reference.md # Need to create for API docs
```

### 2. Update or Create Guide Documentation

**Location**: `_docs/guide/<Area>/<slug>/usage.md`

Create user-facing documentation:

```markdown
---
title: "Feature X Usage Guide"
status: active
draft_status: n/a
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
references: ["../../intent/Core/feature-x/decision.md"]
related_issues: []
related_prs: []
---

## Overview

What this feature does and when to use it.

## Quick Start

Basic usage examples.

## Configuration

How to configure the feature.

## Best Practices

Project-specific recommendations.

## Troubleshooting

Common issues and solutions.
```

**Key Points**:

- Focus on "how to use" not "how it works"
- Link to reference/ for detailed specs
- Include practical examples

### 3. Update or Create Reference Documentation

**Location**: `_docs/reference/<Area>/<slug>/reference.md`

Create API/technical documentation:

```markdown
---
title: "Feature X API Reference"
status: active
draft_status: n/a
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
references: ["../../guide/Core/feature-x/usage.md"]
related_issues: []
related_prs: []
---

## API Overview

High-level API description.

## Classes/Methods

Detailed specifications:

- Parameters
- Return values
- Exceptions

## Data Models

Schema definitions.

## Examples

Code examples with explanations.
```

**Key Points**:

- Dictionary-style reference
- Only document implemented features
- Link to guide/ for usage examples

### 4. Archive Temporary Documents

**Important**: Follow the strict archive rules:

#### Archive Checklist

- [ ] Corresponding intent document exists and is linked
- [ ] Archive target has valid front-matter
- [ ] Source directory cleanup completed
- [ ] References updated in intent document

#### Archive Process

1. **Verify intent exists**
   - Confirm `_docs/intent/<Area>/<slug>/decision.md` exists
   - Confirm the intent references the temporary document or archive target

2. **Move to archives**

   ```bash
   # Move draft, plan, survey only after the archive checklist passes.
   _docs/draft/<Area>/<slug>/notes.md   → _docs/archives/draft/<Area>/<slug>/notes.md
   _docs/plan/<Area>/<slug>/plan.md     → _docs/archives/plan/<Area>/<slug>/plan.md
   _docs/survey/<Area>/<slug>/survey.md → _docs/archives/survey/<Area>/<slug>/survey.md
   ```

3. **Keep front-matter intact**
   - Preserve all metadata
   - Update `status: superseded` if applicable

4. **Clean up source directories**
   - Move from original locations with `mv` or `git mv`
   - No duplicates allowed

5. **Update references**
   ```markdown
   # In intent document, add:

   references: [
   "../../archives/draft/Core/feature-x/notes.md",
   "../../archives/plan/Core/feature-x/plan.md"
   ]
   ```

#### Forbidden Actions

- ❌ Archive draft/plan/survey without a corresponding intent
- ❌ Keep originals after archiving
- ❌ Archive without updating references
- ❌ Archive intent documents
- ❌ Use `rm` or `git rm` for permanent deletion

### 5. Update TODO.md

- Remove completed tasks from TODO.md
- Add links to created/updated documents
- Note any follow-up documentation debt

### 6. Final Verification

Run documentation checks:

```bash
# If available, run linting
npm run lint:docs

# Verify all links
npm run check-links

# Validate front-matter
npm run validate-frontmatter
```

## Document Type-Specific Cleanup

### Draft Cleanup

- Review content for value
- Either: Archive (if corresponding intent exists) or keep/update for future work
- Update `updated_at` if keeping for future reference

### Plan Cleanup

- Ensure plan matches final implementation
- Mark `status: superseded` if outdated
- Move to archives after the corresponding intent exists and the archive checklist passes

### Intent Cleanup

- Verify all design decisions are recorded
- Add consequences and lessons learned
- Keep active (don't archive intent documents)

### Survey Cleanup

- Archive after research is incorporated
- Link from intent or plan documents
- Mark `status: superseded` when no longer needed

## Lifecycle Summary

```
Implementation Complete
        ↓
   [Create/Update]
   guide/<Area>/<slug>/usage.md
   reference/<Area>/<slug>/reference.md
        ↓
   [Verify Intent]
   Does corresponding intent exist?
        ↓
    Yes      No
     ↓        ↓
   [Archive]  [Keep/Update]
   draft/     draft/plan/
   plan/      until ready
   survey/
        ↓
   [Finalize]
   Update TODO.md
   Run validation
```

## Deliverables

After implementation:

- [ ] Guide document created/updated in `_docs/guide/<Area>/<slug>/usage.md`
- [ ] Reference document created/updated in `_docs/reference/<Area>/<slug>/reference.md`
- [ ] Temporary documents archived (if corresponding intent exists and checklist passes)
- [ ] Source directories cleaned up
- [ ] References cross-linked between documents
- [ ] TODO.md completed entries removed and follow-up tasks added if needed
- [ ] Validation passed (lint, links, front-matter)

## Integration with Post-Implementation

Use both skills together:

1. **post-implementation**: Update TODO.md, communicate changes
2. **docs-cleanup**: Finalize documentation hierarchy and archives

## References

- `_docs/standards/documentation_guidelines.md` - Full documentation guidelines
- `_docs/standards/documentation_operations.md` - Archive rules and lifecycle
- **docs-prep skill** - Pre-implementation documentation
