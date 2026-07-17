// Lightweight smoke checks for agent workflow activation surfaces.

const read = (path) => Deno.readTextFile(path);

const assert = (condition, message) => {
  if (!condition) {
    console.error(`FAIL ${message}`);
    Deno.exit(1);
  }
  console.log(`PASS ${message}`);
};

const json = async (path) => JSON.parse(await read(path));

const contains = (text, ...needles) =>
  needles.every((needle) => text.includes(needle));

const codexHooks = await json(".codex/hooks.json");
const claudeSettings = await json(".claude/settings.json");
const agentHook = await read("scripts/agent-workflow-hook.mjs");
const agentsInventory = await read(".agents/skills/docs-inventory/SKILL.md");
const claudeInventory = await read(".claude/skills/docs-inventory/SKILL.md");
const agentsCleanup = await read(".agents/skills/docs-cleanup/SKILL.md");
const claudeCleanup = await read(".claude/skills/docs-cleanup/SKILL.md");
const agentsGuide = await read("AGENTS.md");
const intentTemplate = await read("_docs/standards/templates/intent.md");
const qaTemplate = await read("_docs/standards/templates/qa-test-plan.md");
const qualityStandard = await read("_docs/standards/quality_assurance.md");
const whyFirstSkills = [
  "implementation-prep",
  "docs-prep",
  "qa-prep",
  "test-maintenance",
  "qa-review",
  "post-implementation",
];

const hookEvents = (config) => Object.keys(config.hooks ?? {});

assert(
  ["SessionStart", "UserPromptSubmit", "PreToolUse", "Stop"].every((event) =>
    hookEvents(codexHooks).includes(event)
  ),
  "Codex hooks include SessionStart, UserPromptSubmit, PreToolUse, and Stop",
);

assert(
  ["SessionStart", "UserPromptSubmit", "PreToolUse", "Stop"].every((event) =>
    hookEvents(claudeSettings).includes(event)
  ),
  "Claude hooks include SessionStart, UserPromptSubmit, PreToolUse, and Stop",
);

assert(
  JSON.stringify(codexHooks).includes("scripts/agent-workflow-hook.mjs") &&
    JSON.stringify(claudeSettings).includes("scripts/agent-workflow-hook.mjs"),
  "hook configs call the shared workflow hook script",
);

assert(
  contains(agentHook, "docs-inventory", "docs-cleanup", "qa-review"),
  "workflow hook reminds agents about inventory, cleanup, and QA review",
);

assert(
  contains(
    agentHook,
    "plausible counterevidence",
    "non-local effects",
    "long-term maintainability",
    "silently expanding scope",
  ),
  "AC-001 AC-002 self-audit covers evidence, system impact, durability, and scope",
);

assert(
  agentsInventory === claudeInventory,
  "docs-inventory skill is synced across .agents and .claude",
);

assert(
  agentsCleanup === claudeCleanup,
  "docs-cleanup skill is synced across .agents and .claude",
);

for (const skill of whyFirstSkills) {
  assert(
    await read(`.agents/skills/${skill}/SKILL.md`) ===
      await read(`.claude/skills/${skill}/SKILL.md`),
    `${skill} skill is synced across .agents and .claude`,
  );
}

assert(
  contains(agentsInventory, "read-only", "stale documentation audit"),
  "docs-inventory remains a read-only stale-doc audit entrypoint",
);

assert(
  contains(agentsCleanup, "Archive Checklist", "Do not archive"),
  "docs-cleanup keeps archive boundary guidance",
);

assert(
  contains(
    agentsGuide,
    "docs-inventory",
    "qa-review",
    "// intent: DEC-00X",
    "// intent-invariant: INV-00X",
  ),
  "AGENTS.md exposes workflow entrypoints and targeted intent anchors",
);

assert(
  contains(
    intentTemplate,
    "intent_schema: 2",
    "### DEC-001:",
    "**Why**:",
    "**Change freedom**:",
  ),
  "intent template requires why-first DEC records",
);

assert(
  contains(
    qaTemplate,
    "qa_schema: 2",
    "## Decision Review Scope",
    "## Intent-derived Invariants",
    "None",
  ),
  "QA template reviews DEC records and permits zero invariants",
);

assert(
  contains(
    qualityStandard,
    "INV が 0 件でも正常",
    "exact 値を固定するテスト",
  ),
  "quality standard keeps invariants optional and rejects accidental value locks",
);
