// Deno版 TODO.md validator: npm / remote import 依存なし

const TODO_FILE = "TODO.md";
const PRIORITIES = ["P0", "P1", "P2", "P3"];
const SIZES = ["XS", "S", "M", "L", "XL"];
const LARGE_SIZES = ["M", "L", "XL"];
const CATEGORIES = [
  "Feat",
  "Enhance",
  "Bug",
  "Refactor",
  "Perf",
  "Doc",
  "Test",
  "Chore",
];
const REQUIRED_FIELDS = [
  "Title",
  "ID",
  "Priority",
  "Size",
  "Area",
  "Dependencies",
  "Goal",
  "Steps",
  "Description",
  "Plan",
];
const SECTION_NAMES = ["Inbox", "Backlog", "Ready", "In Progress"];
const ID_RE =
  /^([A-Za-z][A-Za-z0-9-]*)-(Feat|Enhance|Bug|Refactor|Perf|Doc|Test|Chore)-([1-9]\d*)$/;
const PLAN_RE =
  /^_docs\/plan\/([A-Za-z][A-Za-z0-9-]*)\/([a-z0-9]+(?:-[a-z0-9]+)*)\/plan\.md$/;

const stripCodeBlocks = (src) => {
  const output = [];
  let inFence = false;
  for (const line of src.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      output.push("");
      continue;
    }
    output.push(inFence ? "" : line);
  }
  return output.join("\n");
};

const normalizeInlineCode = (value) => {
  const trimmed = value.trim();
  if (trimmed.startsWith("`") && trimmed.endsWith("`")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const sectionForLine = (line, current) => {
  const match = line.match(/^##\s+(.+?)\s*$/);
  if (!match) return current;
  const normalized = match[1].replace(/\s*\(.*\)\s*$/, "").trim();
  return normalized;
};

const parseTasks = (src) => {
  const lines = src.split(/\r?\n/);
  const tasks = [];
  let currentSection = null;
  let current = null;
  let currentField = null;

  const flush = () => {
    if (current) tasks.push(current);
    current = null;
    currentField = null;
  };

  for (const line of lines) {
    currentSection = sectionForLine(line, currentSection);
    const field = line.match(/^- \*\*([A-Za-z]+)\*\*:\s*(.*)$/);
    if (field?.[1] === "Title") {
      flush();
      current = {
        section: currentSection ?? "Unknown",
        fields: { Title: field[2].trim() },
      };
      currentField = "Title";
      continue;
    }
    if (!current) continue;
    if (field) {
      current.fields[field[1]] = field[2].trim();
      currentField = field[1];
      continue;
    }
    if (currentField === "Steps" && /^\s+/.test(line)) {
      current.fields.Steps = `${current.fields.Steps ?? ""}\n${line}`.trim();
    }
  }
  flush();
  return tasks;
};

const parseDependencies = (value) => {
  const normalized = normalizeInlineCode(value);
  if (normalized === "[]") return [];
  if (!normalized.startsWith("[") || !normalized.endsWith("]")) return null;
  const inner = normalized.slice(1, -1).trim();
  if (inner === "") return [];
  return inner.split(",").map((item) => item.trim()).filter(Boolean);
};

const fileExists = async (path) => {
  try {
    const stat = await Deno.stat(path);
    return stat.isFile;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return false;
    throw err;
  }
};

const add = (list, message) => list.push(message);

const report = (prefix, messages, logger) => {
  if (!messages.length) return;
  logger(`${prefix}: ${TODO_FILE}`);
  for (const message of messages) logger(`  - ${message}`);
};

const run = async () => {
  const src = await Deno.readTextFile(TODO_FILE);
  const stripped = stripCodeBlocks(src);
  const errors = [];
  const warnings = [];

  const nextMatch = stripped.match(/Next ID No:\s*(\d+)/);
  if (!nextMatch) {
    add(errors, "Next ID No: <number> is required");
  }
  const nextIdNo = nextMatch ? Number(nextMatch[1]) : null;
  if (nextIdNo !== null && (!Number.isInteger(nextIdNo) || nextIdNo <= 0)) {
    add(errors, "Next ID No must be a positive integer");
  }

  for (const section of SECTION_NAMES) {
    if (!new RegExp(`^##\\s+${section}\\b`, "m").test(stripped)) {
      add(errors, `missing required section: ${section}`);
    }
  }
  if (/^##\s+(Done|Archived)\b/m.test(stripped)) {
    add(errors, "TODO.md must not define Done or Archived sections");
  }

  const tasks = parseTasks(stripped);
  const ids = new Set();
  let maxIdNo = 0;

  for (const task of tasks) {
    const label = task.fields.ID ?? task.fields.Title ?? "(unknown task)";
    for (const field of REQUIRED_FIELDS) {
      if (!(field in task.fields) || task.fields[field].trim() === "") {
        add(errors, `${label}: missing required field: ${field}`);
      }
    }

    const title = task.fields.Title ?? "";
    const titleMatch = title.match(/^\[([A-Za-z]+)\]\s+.+$/);
    if (!titleMatch) {
      add(errors, `${label}: Title must match "[Category] Title"`);
    } else if (!CATEGORIES.includes(titleMatch[1])) {
      add(
        errors,
        `${label}: Title category must be one of ${CATEGORIES.join(", ")}`,
      );
    }

    const id = task.fields.ID ?? "";
    const idMatch = id.match(ID_RE);
    if (!idMatch) {
      add(errors, `${label}: ID must match <Area>-<Category>-<Number>`);
    } else {
      const [, idArea, idCategory, idNumberRaw] = idMatch;
      const idNumber = Number(idNumberRaw);
      maxIdNo = Math.max(maxIdNo, idNumber);
      if (ids.has(id)) add(errors, `${label}: duplicate ID`);
      ids.add(id);
      if (nextIdNo !== null && idNumber >= nextIdNo) {
        add(errors, `${label}: ID number must be less than Next ID No`);
      }
      if (task.fields.Area && task.fields.Area !== idArea) {
        add(errors, `${label}: ID Area must match Area field`);
      }
      if (titleMatch && titleMatch[1] !== idCategory) {
        add(errors, `${label}: Title category must match ID category`);
      }
    }

    const priority = task.fields.Priority;
    if (priority && !PRIORITIES.includes(priority)) {
      add(errors, `${label}: Priority must be one of ${PRIORITIES.join(", ")}`);
    }

    const size = task.fields.Size;
    if (size && !SIZES.includes(size)) {
      add(errors, `${label}: Size must be one of ${SIZES.join(", ")}`);
    }

    const deps = parseDependencies(task.fields.Dependencies ?? "");
    if (deps === null) {
      add(errors, `${label}: Dependencies must be [] or [ID, ID, ...]`);
    } else {
      for (const dep of deps) {
        if (!ID_RE.test(dep)) {
          add(errors, `${label}: dependency has invalid ID format: ${dep}`);
        } else if (
          !ids.has(dep) && !tasks.some((other) => other.fields.ID === dep)
        ) {
          add(
            warnings,
            `${label}: dependency is not in current TODO.md: ${dep}`,
          );
        }
      }
    }

    const plan = normalizeInlineCode(task.fields.Plan ?? "");
    if (size && LARGE_SIZES.includes(size) && plan === "None") {
      add(errors, `${label}: Size ${size} requires a Plan path`);
    }
    if (plan !== "" && plan !== "None") {
      const planMatch = plan.match(PLAN_RE);
      if (!planMatch) {
        add(
          errors,
          `${label}: Plan must match _docs/plan/<Area>/<slug>/plan.md`,
        );
      } else {
        const [, planArea] = planMatch;
        if (task.fields.Area && planArea !== task.fields.Area) {
          add(errors, `${label}: Plan Area segment must match Area field`);
        }
        if (!await fileExists(plan)) {
          add(errors, `${label}: Plan file does not exist: ${plan}`);
        }
      }
    }
  }

  if (nextIdNo !== null && maxIdNo > 0 && nextIdNo < maxIdNo + 1) {
    add(errors, "Next ID No must be at least the max existing ID number + 1");
  }

  report("WARN", warnings, console.warn);
  if (errors.length) {
    report("ERROR", errors, console.error);
    Deno.exit(1);
  }
};

run().catch((err) => {
  console.error(err);
  Deno.exit(1);
});
