import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const ROOT_AGENTS_FILE = "AGENTS.md";
const LLMS_FURL_ROOT = "llms-furl";
const LLMS_FURL_AGENTS_FILE = "AGENTS.md";
const LLMS_FURL_STATE_FILE = ".llms-furl.json";
const SECTION_MARKER = "<!-- llms-furl:start -->";
const SECTION_END_MARKER = "<!-- llms-furl:end -->";

type DomainEntry = {
	name: string;
	indexPath: string;
	source?: string;
};

type LlmsFurlState = {
	notices?: {
		tsconfigExclude?: boolean;
		gitignore?: boolean;
	};
	integration?: {
		consent?: "granted" | "denied";
		applied?: boolean;
	};
};

export type IntegrationAction = {
	id: "gitignore" | "tsconfig" | "agents";
	file: string;
	description: string;
};

export type IntegrationResult = {
	id: IntegrationAction["id"];
	file: string;
	applied: boolean;
	message: string;
};

function getRootSectionContent(): string {
	return `${SECTION_MARKER}

## llms-full reference

When working on tasks about a library/framework/runtime/platform, first consult
\`llms-furl/\`, which contains llms-full.txt split into a tree of leaves \u2014 small,
searchable files for quick lookup.

Workflow:
1. Check domains in \`llms-furl/AGENTS.md\`.
2. Search within the relevant domain (e.g. \`rg -n "keyword" llms-furl/bun.sh\`).
3. If needed, navigate with \`index.json\` using \`jq\`.
4. If no relevant info is found, state that and then move on to other sources.

${SECTION_END_MARKER}`;
}

function extractSection(content: string): string | null {
	const startIdx = content.indexOf(SECTION_MARKER);
	const endIdx = content.indexOf(SECTION_END_MARKER);
	if (startIdx === -1 || endIdx === -1) return null;
	return content.slice(startIdx, endIdx + SECTION_END_MARKER.length);
}

async function readLlmsFurlState(llmsFurlRoot: string): Promise<LlmsFurlState> {
	const statePath = join(llmsFurlRoot, LLMS_FURL_STATE_FILE);
	if (!existsSync(statePath)) {
		return {};
	}
	try {
		const raw = await readFile(statePath, "utf-8");
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") {
			return {};
		}
		return parsed as LlmsFurlState;
	} catch {
		return {};
	}
}

async function writeLlmsFurlState(
	llmsFurlRoot: string,
	state: LlmsFurlState,
): Promise<void> {
	const statePath = join(llmsFurlRoot, LLMS_FURL_STATE_FILE);
	await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
}

export async function getIntegrationConsent(
	llmsFurlRoot: string,
): Promise<"granted" | "denied" | null> {
	const state = await readLlmsFurlState(llmsFurlRoot);
	return state.integration?.consent ?? null;
}

export async function setIntegrationConsent(
	llmsFurlRoot: string,
	consent: "granted" | "denied",
	applied: boolean,
): Promise<void> {
	const state = await readLlmsFurlState(llmsFurlRoot);
	state.integration = { consent, applied };
	await writeLlmsFurlState(llmsFurlRoot, state);
}

async function hasTsconfigExclude(cwd: string): Promise<boolean> {
	const tsconfigPath = join(cwd, "tsconfig.json");
	if (!existsSync(tsconfigPath)) {
		return false;
	}
	try {
		const raw = await readFile(tsconfigPath, "utf-8");
		return raw.includes("llms-furl");
	} catch {
		return false;
	}
}

function hasGitignoreLlmsFurl(content: string): boolean {
	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) {
			continue;
		}
		if (
			trimmed === "llms-furl" ||
			trimmed === "llms-furl/" ||
			trimmed.startsWith("llms-furl/")
		) {
			return true;
		}
	}
	return false;
}

async function hasGitignoreEntry(cwd: string): Promise<boolean> {
	const gitignorePath = join(cwd, ".gitignore");
	if (!existsSync(gitignorePath)) {
		return false;
	}
	try {
		const raw = await readFile(gitignorePath, "utf-8");
		return hasGitignoreLlmsFurl(raw);
	} catch {
		return false;
	}
}

async function needsRootAgentsSnippet(cwd: string): Promise<boolean> {
	const agentsPath = join(cwd, ROOT_AGENTS_FILE);
	const newSection = getRootSectionContent();
	if (!existsSync(agentsPath)) {
		return true;
	}
	try {
		const content = await readFile(agentsPath, "utf-8");
		if (!content.includes(SECTION_MARKER)) {
			return true;
		}
		const existingSection = extractSection(content);
		return existingSection !== newSection;
	} catch {
		return true;
	}
}

function findExcludeArrayRange(
	raw: string,
): { start: number; end: number } | null {
	const matches = raw.matchAll(/"exclude"\s*:/g);
	for (const match of matches) {
		if (match.index === undefined) continue;
		let idx = match.index + match[0].length;
		while (idx < raw.length) {
			const next = raw.slice(idx, idx + 2);
			const char = raw[idx];
			if (!char) {
				break;
			}
			if (/\s/.test(char)) {
				idx += 1;
				continue;
			}
			if (next === "//") {
				const lineEnd = raw.indexOf("\n", idx);
				idx = lineEnd === -1 ? raw.length : lineEnd + 1;
				continue;
			}
			if (next === "/*") {
				const blockEnd = raw.indexOf("*/", idx + 2);
				idx = blockEnd === -1 ? raw.length : blockEnd + 2;
				continue;
			}
			break;
		}
		if (raw[idx] !== "[") continue;
		const start = idx;
		let depth = 0;
		let inString = false;
		let isEscaped = false;
		for (let i = start; i < raw.length; i++) {
			const char = raw[i];
			const pair = raw.slice(i, i + 2);
			if (inString) {
				if (isEscaped) {
					isEscaped = false;
				} else if (char === "\\") {
					isEscaped = true;
				} else if (char === '"') {
					inString = false;
				}
				continue;
			}
			if (pair === "//") {
				const lineEnd = raw.indexOf("\n", i);
				i = lineEnd === -1 ? raw.length : lineEnd;
				continue;
			}
			if (pair === "/*") {
				const blockEnd = raw.indexOf("*/", i + 2);
				if (blockEnd === -1) return null;
				i = blockEnd + 1;
				continue;
			}
			if (char === '"') {
				inString = true;
				continue;
			}
			if (char === "[") {
				depth += 1;
				continue;
			}
			if (char === "]") {
				depth -= 1;
				if (depth === 0) {
					return { start, end: i };
				}
			}
		}
	}
	return null;
}

function getLastLineIndent(text: string): string | null {
	const lines = text.split("\n");
	for (let i = lines.length - 1; i >= 0; i--) {
		const line = lines[i];
		if (line?.trim()) {
			return line.match(/^[ \t]*/)?.[0] ?? "";
		}
	}
	return null;
}

function getLineIndentAt(text: string, index: number): string {
	const lineStart = text.lastIndexOf("\n", index);
	const start = lineStart === -1 ? 0 : lineStart + 1;
	return text.slice(start).match(/^[ \t]*/)?.[0] ?? "";
}

function buildTsconfigExcludeUpdate(raw: string): string | null {
	if (raw.includes("llms-furl")) {
		return null;
	}
	const range = findExcludeArrayRange(raw);
	if (!range) {
		return null;
	}
	const arrayText = raw.slice(range.start + 1, range.end);
	if (arrayText.includes("//") || arrayText.includes("/*")) {
		return null;
	}
	const hasNewline = arrayText.includes("\n");
	if (!hasNewline) {
		const trimmed = arrayText.trim();
		const leading = arrayText.match(/^\s*/)?.[0] ?? "";
		const trailing = arrayText.match(/\s*$/)?.[0] ?? "";
		const suffix =
			trimmed.length === 0 ? "" : trimmed.endsWith(",") ? "" : ", ";
		const newArrayText = `${leading}${trimmed}${suffix}"llms-furl"${trailing}`;
		return raw.slice(0, range.start + 1) + newArrayText + raw.slice(range.end);
	}
	let updatedArrayText = arrayText;
	for (let i = arrayText.length - 1; i >= 0; i--) {
		const char = arrayText[i];
		if (!char) {
			continue;
		}
		if (/\S/.test(char)) {
			const lastChar = char;
			if (lastChar !== "," && lastChar !== "[") {
				updatedArrayText = `${arrayText.slice(0, i + 1)},${arrayText.slice(i + 1)}`;
			}
			break;
		}
	}
	const baseIndent = getLineIndentAt(raw, range.end);
	const itemIndent = getLastLineIndent(updatedArrayText) ?? `${baseIndent}  `;
	const insertion = `\n${itemIndent}"llms-furl"`;
	return (
		raw.slice(0, range.start + 1) +
		updatedArrayText +
		insertion +
		raw.slice(range.end)
	);
}

async function listDomains(llmsFurlRoot: string): Promise<DomainEntry[]> {
	if (!existsSync(llmsFurlRoot)) {
		return [];
	}

	const entries = await readdir(llmsFurlRoot, { withFileTypes: true });
	const domains: DomainEntry[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const indexPath = join(llmsFurlRoot, entry.name, "index.json");
		if (!existsSync(indexPath)) continue;

		let name = entry.name;
		let source: string | undefined;
		try {
			const raw = await readFile(indexPath, "utf-8");
			const parsed = JSON.parse(raw) as { name?: string; source?: string };
			if (typeof parsed.name === "string" && parsed.name.trim()) {
				name = parsed.name.trim();
			}
			if (typeof parsed.source === "string" && parsed.source.trim()) {
				source = parsed.source.trim();
			}
		} catch {
			// Ignore invalid index.json and fall back to directory name.
		}

		domains.push({
			name,
			indexPath: `${LLMS_FURL_ROOT}/${entry.name}/index.json`,
			source,
		});
	}

	return domains.sort((a, b) => a.name.localeCompare(b.name, "en"));
}

function renderLlmsFurlAgents(domains: DomainEntry[]): string {
	const lines: string[] = [
		"# llms-furl/AGENTS.md",
		"",
		"`llms-furl/` contains split leaves for LLM context. Each domain lives in",
		"`llms-furl/<domain>/` and has an `index.json` you can navigate.",
		"",
		"## Quick usage",
		"",
		'- `rg -n "routing" llms-furl/nextjs.org`',
		"- `jq -r '.. | .path? // empty' llms-furl/nextjs.org/index.json`",
		"",
		"## Domains",
		"",
	];

	if (domains.length === 0) {
		lines.push("- (none yet)");
	} else {
		for (const domain of domains) {
			const parts = [`- ${domain.name} (index: \`${domain.indexPath}\`)`];
			if (domain.source) {
				parts.push(`source: ${domain.source}`);
			}
			lines.push(parts.join(", "));
		}
	}

	lines.push(
		"",
		"Generated by llms-furl. Manual edits may be overwritten.",
		"",
	);
	return lines.join("\n");
}

export function resolveLlmsFurlRoot(
	outputDir: string,
	cwd: string = process.cwd(),
): string | null {
	const llmsFurlRoot = resolve(cwd, LLMS_FURL_ROOT);
	const resolvedOutput = resolve(cwd, outputDir);
	const rel = relative(llmsFurlRoot, resolvedOutput);
	if (rel === "" || !rel.startsWith("..")) {
		return llmsFurlRoot;
	}
	return null;
}

async function ensureRootAgentsSnippet(
	cwd: string = process.cwd(),
): Promise<boolean> {
	const agentsPath = join(cwd, ROOT_AGENTS_FILE);
	const newSection = getRootSectionContent();

	if (existsSync(agentsPath)) {
		const content = await readFile(agentsPath, "utf-8");
		if (content.includes(SECTION_MARKER)) {
			const existingSection = extractSection(content);
			if (existingSection === newSection) {
				return false;
			}
			const startIdx = content.indexOf(SECTION_MARKER);
			const endIdx = content.indexOf(SECTION_END_MARKER);
			const before = content.slice(0, startIdx);
			const after = content.slice(endIdx + SECTION_END_MARKER.length);
			await writeFile(agentsPath, before + newSection + after, "utf-8");
			return true;
		}

		let newContent = content;
		if (newContent.length > 0 && !newContent.endsWith("\n")) {
			newContent += "\n";
		}
		newContent += `\n${newSection}`;
		await writeFile(agentsPath, newContent, "utf-8");
		return true;
	}

	const content = `# AGENTS.md

Instructions for AI coding agents working with this codebase.

${newSection}
`;
	await writeFile(agentsPath, content, "utf-8");
	return true;
}

export async function ensureLlmsFurlAgents(
	llmsFurlRoot: string,
): Promise<boolean> {
	await mkdir(llmsFurlRoot, { recursive: true });
	const agentsPath = join(llmsFurlRoot, LLMS_FURL_AGENTS_FILE);
	const domains = await listDomains(llmsFurlRoot);
	const content = renderLlmsFurlAgents(domains);

	if (existsSync(agentsPath)) {
		const existing = await readFile(agentsPath, "utf-8");
		if (existing === content) {
			return false;
		}
	}

	await writeFile(agentsPath, content, "utf-8");
	return true;
}

export async function getIntegrationActions(
	cwd: string = process.cwd(),
): Promise<{ actions: IntegrationAction[]; manualHints: string[] }> {
	const actions: IntegrationAction[] = [];
	const manualHints: string[] = [];

	const gitignorePath = join(cwd, ".gitignore");
	if (existsSync(gitignorePath)) {
		const hasIgnore = await hasGitignoreEntry(cwd);
		if (!hasIgnore) {
			actions.push({
				id: "gitignore",
				file: ".gitignore",
				description: "add llms-furl/ to ignore list",
			});
		}
	}

	const tsconfigPath = join(cwd, "tsconfig.json");
	if (existsSync(tsconfigPath)) {
		const hasExclude = await hasTsconfigExclude(cwd);
		if (!hasExclude) {
			try {
				const raw = await readFile(tsconfigPath, "utf-8");
				const updated = buildTsconfigExcludeUpdate(raw);
				if (updated) {
					actions.push({
						id: "tsconfig",
						file: "tsconfig.json",
						description: "exclude llms-furl/ from compilation",
					});
				} else {
					manualHints.push(
						'Update tsconfig.json exclude to include "llms-furl"',
					);
					manualHints.push("Example snippet:");
					manualHints.push("{");
					manualHints.push('  "exclude": ["llms-furl", "node_modules"]');
					manualHints.push("}");
				}
			} catch {
				manualHints.push('Update tsconfig.json exclude to include "llms-furl"');
				manualHints.push("Example snippet:");
				manualHints.push("{");
				manualHints.push('  "exclude": ["llms-furl", "node_modules"]');
				manualHints.push("}");
			}
		}
	}

	const needsAgents = await needsRootAgentsSnippet(cwd);
	if (needsAgents) {
		actions.push({
			id: "agents",
			file: "AGENTS.md",
			description: "add llms-furl section",
		});
	}

	return { actions, manualHints };
}

export async function applyIntegrationActions(
	actions: IntegrationAction[],
	cwd: string = process.cwd(),
): Promise<IntegrationResult[]> {
	const results: IntegrationResult[] = [];
	for (const action of actions) {
		if (action.id === "gitignore") {
			const gitignorePath = join(cwd, ".gitignore");
			if (!existsSync(gitignorePath)) {
				results.push({
					id: action.id,
					file: action.file,
					applied: false,
					message: "Skipped .gitignore (not found)",
				});
				continue;
			}
			const raw = await readFile(gitignorePath, "utf-8");
			if (hasGitignoreLlmsFurl(raw)) {
				results.push({
					id: action.id,
					file: action.file,
					applied: false,
					message: "Skipped .gitignore (already ignored)",
				});
				continue;
			}
			let next = raw;
			if (next.length > 0 && !next.endsWith("\n")) {
				next += "\n";
			}
			next += "llms-furl/\n";
			await writeFile(gitignorePath, next, "utf-8");
			results.push({
				id: action.id,
				file: action.file,
				applied: true,
				message: "Added llms-furl/ to .gitignore",
			});
			continue;
		}
		if (action.id === "tsconfig") {
			const tsconfigPath = join(cwd, "tsconfig.json");
			if (!existsSync(tsconfigPath)) {
				results.push({
					id: action.id,
					file: action.file,
					applied: false,
					message: "Skipped tsconfig.json (not found)",
				});
				continue;
			}
			const raw = await readFile(tsconfigPath, "utf-8");
			const updated = buildTsconfigExcludeUpdate(raw);
			if (!updated) {
				results.push({
					id: action.id,
					file: action.file,
					applied: false,
					message: "Skipped tsconfig.json (manual update recommended)",
				});
				continue;
			}
			await writeFile(tsconfigPath, updated, "utf-8");
			results.push({
				id: action.id,
				file: action.file,
				applied: true,
				message: 'Updated tsconfig.json exclude to include "llms-furl"',
			});
			continue;
		}
		if (action.id === "agents") {
			const updated = await ensureRootAgentsSnippet(cwd);
			results.push({
				id: action.id,
				file: action.file,
				applied: updated,
				message: updated
					? "Updated AGENTS.md (added llms-furl section)"
					: "AGENTS.md already up to date",
			});
		}
	}
	return results;
}
