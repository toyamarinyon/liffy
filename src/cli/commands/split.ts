import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import {
	ensureLiffyAgents,
	ensureRootAgentsSnippet,
	getRootAgentsSnippet,
	maybeGetFirstRunHints,
	resolveLiffyRoot,
} from "../../agents.js";
import { buildIndexJson } from "../../index-json.js";
import { type Page, split } from "../../splitter.js";

const ANSI = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	green: "\x1b[32m",
	cyan: "\x1b[36m",
	yellow: "\x1b[33m",
};

const useColor = Boolean(process.stdout.isTTY && !process.env.NO_COLOR);

function style(text: string, ...codes: string[]): string {
	if (!useColor || codes.length === 0) {
		return text;
	}
	return `${codes.join("")}${text}${ANSI.reset}`;
}

export interface SplitOptions {
	input: string;
	outputDir?: string;
	debug?: boolean;
}

function isUrl(input: string): boolean {
	return input.startsWith("http://") || input.startsWith("https://");
}

function urlToOutputDir(url: string): string {
	const parsed = new URL(url);
	return join("liffy", parsed.host);
}

function formatPath(targetPath: string): string {
	const resolved = resolve(process.cwd(), targetPath);
	const rel = relative(process.cwd(), resolved);
	if (!rel.startsWith("..") && rel !== "") {
		return rel;
	}
	return targetPath;
}

function okMark(): string {
	return style("✓", ANSI.green, ANSI.bold);
}

function formatOk(message: string): string {
	return `${okMark()} ${message}`;
}

function printSection(title: string, lines: string[]): void {
	if (lines.length === 0) {
		return;
	}
	const headerColor = title === "hint" ? ANSI.yellow : ANSI.cyan;
	const header = `${style(title, ANSI.bold, headerColor)} ${style(
		"--------------------",
		ANSI.dim,
	)}`;
	console.log("");
	console.log(header);
	console.log("");
	for (const line of lines) {
		console.log(`    ${line}`);
	}
}

function maybeFlattenOutputPaths(pages: Page[]): {
	pages: Page[];
	flattenedRoot?: string;
} {
	let rootDir: string | null = null;
	for (const page of pages) {
		const parts = page.outputPath.split("/").filter(Boolean);
		if (parts.length < 2) {
			return { pages };
		}
		const top = parts[0];
		if (!top) {
			return { pages };
		}
		if (rootDir === null) {
			rootDir = top;
			continue;
		}
		if (rootDir !== top) {
			return { pages };
		}
	}

	if (!rootDir) {
		return { pages };
	}

	const flattenedPages = pages.map((page) => {
		const parts = page.outputPath.split("/").filter(Boolean);
		const newPath = parts.slice(1).join("/");
		return { ...page, outputPath: newPath };
	});

	const seen = new Set<string>();
	for (const page of flattenedPages) {
		if (seen.has(page.outputPath)) {
			return { pages };
		}
		seen.add(page.outputPath);
	}

	return { pages: flattenedPages, flattenedRoot: rootDir };
}

async function fetchContent(url: string): Promise<string> {
	console.log(`\nFetching ${url}...`);

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	return response.text();
}

export async function splitCommand(options: SplitOptions): Promise<void> {
	const { input } = options;
	const inputIsUrl = isUrl(input);

	let content: string;
	let outputDir: string;

	if (inputIsUrl) {
		content = await fetchContent(input);
		outputDir = options.outputDir ?? urlToOutputDir(input);
	} else {
		const file = Bun.file(input);
		if (!(await file.exists())) {
			console.error(`Error: File not found: ${input}`);
			process.exit(1);
		}
		content = await file.text();
		outputDir = options.outputDir ?? ".";
	}
	const debug =
		options.debug === true
			? (message: string) => {
					console.log(`[debug] ${message}`);
				}
			: undefined;

	const result = split(content, debug);
	const adjusted =
		inputIsUrl === true
			? maybeFlattenOutputPaths(result.pages)
			: { pages: result.pages };

	if (adjusted.pages.length === 0) {
		const hint = options.debug ? "" : " (try --debug)";
		console.error(`Error: No pages found in input file${hint}`);
		process.exit(1);
	}

	const outputDisplay = formatPath(outputDir);
	const logLines: string[] = [];
	const infoLines: string[] = [];
	const hintLines: string[] = [];
	if (options.debug) {
		logLines.push(`  -> Detected: ${result.pattern}`);
	}
	let pagesLine = `  -> Pages: ${adjusted.pages.length}`;
	if (options.debug && adjusted.flattenedRoot) {
		pagesLine += ` (flattened from "${adjusted.flattenedRoot}/")`;
	}
	logLines.push(pagesLine);

	// Write output files
	let written = 0;
	for (const page of adjusted.pages) {
		const outputPath = join(outputDir, page.outputPath);
		const dir = dirname(outputPath);

		await mkdir(dir, { recursive: true });
		await writeFile(outputPath, page.content, "utf-8");
		written++;
	}

	const indexContent = buildIndexJson(
		adjusted.pages.map((page) => page.outputPath),
		input,
		inputIsUrl ? new URL(input).host : undefined,
	);
	const indexPath = join(outputDir, "index.json");
	await writeFile(indexPath, indexContent, "utf-8");

	const liffyRoot = resolveLiffyRoot(outputDir);
	logLines.push(`  ${formatOk(`Saved to ${outputDisplay}`)}`);
	if (options.debug) {
		logLines.push(`  -> Index: ${formatPath(indexPath)}`);
	}
	if (liffyRoot) {
		try {
			const agentsUpdated = await ensureLiffyAgents(liffyRoot);
			void agentsUpdated;

			const rootUpdated = await ensureRootAgentsSnippet();
			if (rootUpdated) {
				infoLines.push(
					formatOk(
						`Updated ${formatPath("AGENTS.md")} (added liffy section)`,
					),
				);
				infoLines.push("");
				infoLines.push(...getRootAgentsSnippet().split("\n"));
			}

			const hints = await maybeGetFirstRunHints(liffyRoot);
			if (hints.length > 0) {
				hintLines.push(...hints);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.warn(`Warning: failed to update AGENTS.md (${message})`);
		}
	}

	for (const line of logLines) {
		console.log(line);
	}
	printSection("info", infoLines);
	printSection("hint", hintLines);
}
