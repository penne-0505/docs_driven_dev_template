// Deno版バリデータ: npm / remote import 依存なしで front-matter と stale ロジックを検証

import { loadScope, makeInScope } from "./scope.ts";

type YamlValue = string | number | boolean | YamlValue[];
type FrontMatter = Record<string, YamlValue>;

type FrontMatterParseResult = {
  attrs: FrontMatter | null;
  error: string | null;
};

type FileReport = {
  file: string;
  messages: string[];
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const STALE_DAYS = 30;
const RISKS = ["Low", "Medium", "High", "Critical"] as const;
const QA_STATUS_VALUES = [
  "planned",
  "in-progress",
  "verified",
  "partial",
  "failed",
  "blocked",
] as const;
const REQUIRED_KEYS = [
  "title",
  "status",
  "draft_status",
  "created_at",
  "updated_at",
  "references",
  "related_issues",
  "related_prs",
] as const;
const REQUIRED_SCALARS = [
  "title",
  "status",
  "draft_status",
  "created_at",
  "updated_at",
] as const;
const STATUS_VALUES = ["proposed", "active", "superseded", "obsolete"] as const;
const DRAFT_STATUS_VALUES = ["idea", "exploring", "paused", "n/a"] as const;

const isStringArray = (val: unknown): val is string[] =>
  Array.isArray(val) && val.every((v) => typeof v === "string");
const isIntegerArray = (val: unknown): val is number[] =>
  Array.isArray(val) && val.every((v) => Number.isInteger(v));
const isNonNegativeInt = (val: unknown): val is number =>
  typeof val === "number" && Number.isInteger(val) && val >= 0;

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== "string" || !DATE_RE.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return d;
};

const diffDays = (from: Date, to: Date): number =>
  Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
const normalizePath = (path: string): string => path.replaceAll("\\", "/");
const isInArchives = (path: string): boolean =>
  normalizePath(path).split("/").includes("archives");
const isDraftPath = (path: string): boolean =>
  normalizePath(path).split("/").includes("draft");
const isQaPath = (path: string): boolean =>
  normalizePath(path).split("/").includes("qa");
const isInStandards = (path: string): boolean =>
  normalizePath(path).split("/").includes("standards");

const walkMarkdown = async function* (dir: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      yield* walkMarkdown(path);
    } else if (entry.isFile && entry.name.endsWith(".md")) {
      yield path;
    }
  }
};

const stripInlineComment = (value: string): string => {
  let quote: string | null = null;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if ((ch === '"' || ch === "'") && value[i - 1] !== "\\") {
      quote = quote === ch ? null : quote ?? ch;
    }
    if (ch === "#" && quote === null) {
      return value.slice(0, i).trim();
    }
  }
  return value.trim();
};

const splitInlineArray = (value: string): string[] => {
  const items: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (const ch of value) {
    if ((ch === '"' || ch === "'") && current.at(-1) !== "\\") {
      quote = quote === ch ? null : quote ?? ch;
    }
    if (ch === "," && quote === null) {
      items.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim() !== "") items.push(current.trim());
  return items;
};

const parseScalar = (raw: string): YamlValue => {
  const value = stripInlineComment(raw);
  if (value === "") return "";
  if (value === "[]") return [];
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (inner === "") return [];
    return splitInlineArray(inner).map(parseScalar);
  }
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  if (/^-?\d+$/.test(value)) return Number(value);
  return value;
};

const parseFrontMatter = (src: string): FrontMatterParseResult => {
  const lines = src.split(/\r?\n/);
  if (lines[0] !== "---") {
    return { attrs: null, error: "missing front matter" };
  }

  const end = lines.findIndex((line, index) => index > 0 && line === "---");
  if (end === -1) {
    return { attrs: null, error: "front matter is not closed" };
  }

  const attrs: FrontMatter = {};
  for (let i = 1; i < end; i += 1) {
    const line = lines[i];
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;

    const match = line.match(/^([A-Za-z0-9_]+):(?:\s*(.*))?$/);
    if (!match) {
      return { attrs: null, error: `unsupported front matter line: ${line}` };
    }

    const [, key, rest = ""] = match;
    if (rest.trim() !== "") {
      attrs[key] = parseScalar(rest);
      continue;
    }

    const values: YamlValue[] = [];
    let cursor = i + 1;
    while (cursor < end) {
      const item = lines[cursor].match(/^\s+-\s+(.*)$/);
      if (!item) break;
      values.push(parseScalar(item[1]));
      cursor += 1;
    }
    if (values.length > 0) {
      attrs[key] = values;
      i = cursor - 1;
    } else {
      attrs[key] = "";
    }
  }

  return { attrs, error: null };
};

const loadFrontMatter = async (
  file: string,
): Promise<FrontMatterParseResult> => {
  const src = await Deno.readTextFile(file);
  return parseFrontMatter(src);
};

const optionalValue = (value: YamlValue): YamlValue | undefined =>
  value === "" ? undefined : value;

const todayDate = (): Date | null =>
  parseDate(new Date().toISOString().slice(0, 10));

const report = (
  prefix: string,
  file: string,
  messages: string[],
  logger: (message: string) => void,
): void => {
  logger(`${prefix}: ${file}`);
  for (const msg of messages) logger(`  - ${msg}`);
};

const run = async (): Promise<void> => {
  const errors: FileReport[] = [];
  const warnings: FileReport[] = [];
  const inScope = makeInScope(await loadScope());

  for await (const file of walkMarkdown("_docs")) {
    if (isInArchives(file)) continue;
    if (isInStandards(file)) continue;
    if (!inScope(file)) continue;

    const { attrs: data, error } = await loadFrontMatter(file);
    const fileErrors: string[] = [];
    const fileWarnings: string[] = [];
    if (error || !data) {
      errors.push({ file, messages: [error ?? "missing front matter"] });
      continue;
    }

    for (const key of REQUIRED_KEYS) {
      if (!(key in data)) {
        fileErrors.push(`missing required field: ${key}`);
      }
    }
    for (const key of REQUIRED_SCALARS) {
      if (
        key in data &&
        (typeof data[key] !== "string" || data[key].trim() === "")
      ) {
        fileErrors.push(`required field must be a non-empty string: ${key}`);
      }
    }

    const status = data.status;
    const draftStatus = data.draft_status;
    if (
      "status" in data &&
      typeof status === "string" &&
      !(STATUS_VALUES as readonly string[]).includes(status)
    ) {
      fileErrors.push(`status must be one of ${STATUS_VALUES.join(", ")}`);
    }
    if (
      "draft_status" in data &&
      typeof draftStatus === "string" &&
      !(DRAFT_STATUS_VALUES as readonly string[]).includes(draftStatus)
    ) {
      fileErrors.push(
        `draft_status must be one of ${DRAFT_STATUS_VALUES.join(", ")}`,
      );
    }

    const createdAt = parseDate(data.created_at);
    const updatedAt = parseDate(data.updated_at);
    if (!createdAt) fileErrors.push("created_at must be YYYY-MM-DD");
    if (!updatedAt) fileErrors.push("updated_at must be YYYY-MM-DD");

    if (!isStringArray(data.references)) {
      fileErrors.push("references must be an array of strings (can be empty)");
    }
    if (!isIntegerArray(data.related_issues)) {
      fileErrors.push(
        "related_issues must be an array of integers (can be empty)",
      );
    }

    if (isQaPath(file)) {
      if (!("qa_status" in data)) {
        fileErrors.push("missing required QA field: qa_status");
      } else if (
        typeof data.qa_status === "string" &&
        !(QA_STATUS_VALUES as readonly string[]).includes(data.qa_status)
      ) {
        fileErrors.push(
          `qa_status must be one of ${QA_STATUS_VALUES.join(", ")}`,
        );
      }

      if (!("risk" in data)) {
        fileErrors.push("missing required QA field: risk");
      } else if (
        typeof data.risk === "string" &&
        !(RISKS as readonly string[]).includes(data.risk)
      ) {
        fileErrors.push(`risk must be one of ${RISKS.join(", ")}`);
      }
    }
    if (!isIntegerArray(data.related_prs)) {
      fileErrors.push(
        "related_prs must be an array of integers (can be empty)",
      );
    }

    const staleExemptUntilRaw = optionalValue(data.stale_exempt_until);
    const staleExemptReason = optionalValue(data.stale_exempt_reason);
    const staleExtensions = optionalValue(data.stale_extensions);

    if (staleExemptUntilRaw !== undefined) {
      const parsed = parseDate(staleExemptUntilRaw);
      if (!parsed) {
        fileErrors.push("stale_exempt_until must be YYYY-MM-DD when provided");
      } else if (updatedAt && parsed < updatedAt) {
        fileErrors.push(
          "stale_exempt_until must not be earlier than updated_at",
        );
      }
    }
    if (
      staleExemptReason !== undefined &&
      typeof staleExemptReason !== "string"
    ) {
      fileErrors.push("stale_exempt_reason must be a string when provided");
    }
    if (staleExtensions !== undefined && !isNonNegativeInt(staleExtensions)) {
      fileErrors.push(
        "stale_extensions must be a non-negative integer when provided",
      );
    }

    if (
      isDraftPath(file) &&
      status === "proposed" &&
      updatedAt
    ) {
      const today = todayDate();
      if (!today) continue;
      const daysSinceUpdate = diffDays(updatedAt, today);
      if (daysSinceUpdate > STALE_DAYS) {
        const parsedExempt = staleExemptUntilRaw
          ? parseDate(staleExemptUntilRaw)
          : null;
        if (!parsedExempt || parsedExempt < today) {
          fileErrors.push(
            `draft is stale (${daysSinceUpdate} days since updated_at) without valid stale_exempt_until`,
          );
        }
        if (
          staleExemptUntilRaw &&
          (typeof staleExemptReason !== "string" ||
            staleExemptReason.trim() === "")
        ) {
          fileErrors.push(
            "stale_exempt_reason is required when stale_exempt_until is set",
          );
        }
      } else if (staleExemptUntilRaw) {
        fileWarnings.push(
          "stale_exempt_until is set but draft is not stale yet (<=30 days)",
        );
      }
    }

    if (isDraftPath(file) && status && status !== "proposed") {
      fileWarnings.push(
        `draft has status "${status}" (consider elevating to plan/intent or align status)`,
      );
    }

    for (const key of Object.keys(data)) {
      if (
        !(REQUIRED_KEYS as readonly string[]).includes(key) &&
        !(isQaPath(file) && ["qa_status", "risk"].includes(key)) &&
        !key.startsWith("stale_exempt") &&
        key !== "stale_extensions"
      ) {
        fileWarnings.push(`unknown field: ${key}`);
      }
    }

    if (fileErrors.length) errors.push({ file, messages: fileErrors });
    if (fileWarnings.length) warnings.push({ file, messages: fileWarnings });
  }

  for (const { file, messages } of warnings) {
    report("WARN", file, messages, console.warn);
  }

  if (errors.length) {
    for (const { file, messages } of errors) {
      report("ERROR", file, messages, console.error);
    }
    Deno.exit(1);
  }
};

run().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  Deno.exit(1);
});
