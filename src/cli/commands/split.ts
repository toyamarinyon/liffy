import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import {
	applyIntegrationActions,
	ensureLlmsFurlAgents,
	getIntegrationActions,
	getIntegrationConsent,
	resolveLlmsFurlRoot,
	setIntegrationConsent,
} from "../../agents.js";
import { buildIndexJson } from "../../index-json.js";
import { extractLlmsTxtLinks } from "../../llms-txt.js";
import { type Page, split, urlToOutputPath } from "../../splitter.js";

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

type DebugLogger = (message: string) => void;

function isUrl(input: string): boolean {
	return input.startsWith("http://") || input.startsWith("https://");
}

function urlToOutputDir(url: string): string {
	const parsed = new URL(url);
	return join("llms-furl", parsed.host);
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

async function promptYesNo(prompt: string): Promise<boolean> {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	try {
		while (true) {
			const answer = await rl.question(prompt);
			const normalized = answer.trim().toLowerCase();
			if (normalized === "y" || normalized === "yes") {
				return true;
			}
			if (normalized === "n" || normalized === "no") {
				return false;
			}
			console.log("Please enter 'y' or 'n'.");
		}
	} finally {
		rl.close();
	}
}

function isLabelLine(line: string): boolean {
	return line === "Example snippet:" || line === "Run:";
}

function isCodeLine(line: string): boolean {
	const trimmed = line.trim();
	if (!trimmed) {
		return false;
	}
	return (
		trimmed === "{" ||
		trimmed === "}" ||
		trimmed.startsWith('"') ||
		trimmed.startsWith("echo ")
	);
}

function printSection(title: string, lines: string[]): void {
	if (lines.length === 0) {
		return;
	}
	const headerColor = title === "hint" ? ANSI.yellow : ANSI.cyan;
	console.log("");
	console.log(style(title, ANSI.bold, headerColor));
	for (const line of lines) {
		if (!line) {
			console.log("");
			continue;
		}
		if (isLabelLine(line)) {
			console.log(`  ${style(line, ANSI.bold, ANSI.dim)}`);
			continue;
		}
		if (isCodeLine(line)) {
			console.log(`    ${style(line.trim(), ANSI.dim)}`);
			continue;
		}
		console.log(`  ${line}`);
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

async function fetchContent(url: string, log = true): Promise<string> {
	if (log) {
		console.log(`\nFetching ${url}...`);
	}

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	return response.text();
}

function shouldPrefixHost(urls: string[]): boolean {
	const hosts = new Set<string>();
	for (const url of urls) {
		try {
			hosts.add(new URL(url).host);
		} catch {}
	}
	return hosts.size > 1;
}

function outputPathForUrl(url: string, includeHostPrefix: boolean): string {
	const basePath = urlToOutputPath(url);
	if (!includeHostPrefix) {
		return basePath;
	}
	try {
		const host = new URL(url).host;
		return `${host}/${basePath}`;
	} catch {
		return basePath;
	}
}

interface FetchFailure {
	url: string;
	status: string;
}

interface FetchLinkedPagesResult {
	pages: Page[];
	failures: FetchFailure[];
}

async function fetchLinkedPages(
	urls: string[],
	includeHostPrefix: boolean,
	debug?: DebugLogger,
): Promise<FetchLinkedPagesResult> {
	const results: Array<Page | null> = new Array(urls.length).fill(null);
	const failures: FetchFailure[] = [];
	const seenPaths = new Set<string>();
	let cursor = 0;
	let debugSamples = 0;

	const worker = async (): Promise<void> => {
		while (true) {
			const index = cursor;
			cursor += 1;
			if (index >= urls.length) {
				return;
			}
			const url = urls[index];
			if (!url) {
				continue;
			}

			try {
				const content = await fetchContent(url, false);
				const outputPath = outputPathForUrl(url, includeHostPrefix);
				if (seenPaths.has(outputPath)) {
					console.warn(
						`Warning: duplicate output path "${outputPath}" for ${url} (skipping)`,
					);
					continue;
				}
				seenPaths.add(outputPath);

				results[index] = {
					title: url,
					url,
					content,
					outputPath,
				};

				if (debug && debugSamples < 3) {
					debug(`llms.txt link ${index + 1}: ${url} -> ${outputPath}`);
					debugSamples += 1;
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				const statusMatch = message.match(/^HTTP (\d+)/);
				const status = statusMatch ? statusMatch[1] : "ERR";
				failures.push({ url, status });
			}
		}
	};

	const concurrency = Math.min(6, urls.length);
	const workers = Array.from({ length: concurrency }, () => worker());
	await Promise.all(workers);

	return {
		pages: results.filter((page): page is Page => page !== null),
		failures,
	};
}

export async function splitCommand(options: SplitOptions): Promise<void> {
	const { input } = options;
	const inputIsUrl = isUrl(input);

	const outputDir = inputIsUrl
		? (options.outputDir ?? urlToOutputDir(input))
		: (options.outputDir ?? ".");
	const outputDisplay = formatPath(outputDir);
	const hintLines: string[] = [];

	const llmsFurlRoot = resolveLlmsFurlRoot(outputDir);

	// Integration actions (before download)
	if (llmsFurlRoot) {
		try {
			const agentsUpdated = await ensureLlmsFurlAgents(llmsFurlRoot);
			void agentsUpdated;
			const { actions, manualHints } = await getIntegrationActions();
			const isInteractive = Boolean(
				process.stdout.isTTY && process.stdin.isTTY,
			);
			const consent = await getIntegrationConsent(llmsFurlRoot);
			if (actions.length > 0 && isInteractive && consent !== "denied") {
				console.log("");
				console.log(
					"llms-furl can update the following files for better integration:",
				);
				for (const action of actions) {
					console.log(`  • ${action.file} - ${action.description}`);
				}
				const allowed = await promptYesNo(
					"Allow llms-furl to modify these files? (y/n): ",
				);
				if (allowed) {
					const results = await applyIntegrationActions(actions);
					const applied = results.some((result) => result.applied);
					await setIntegrationConsent(llmsFurlRoot, "granted", applied);
					console.log(
						formatOk(
							`Permission granted - saved to ${formatPath(
								join(llmsFurlRoot, ".llms-furl.json"),
							)}`,
						),
					);
					for (const result of results) {
						if (result.applied) {
							console.log(formatOk(result.message));
						} else {
							console.warn(`Warning: ${result.message}`);
						}
					}
				} else {
					await setIntegrationConsent(llmsFurlRoot, "denied", false);
					console.log("Skipping integration updates.");
				}
				if (manualHints.length > 0) {
					if (hintLines.length > 0) {
						hintLines.push("");
					}
					hintLines.push(...manualHints);
				}
			} else {
				if (actions.length > 0) {
					hintLines.push(
						"llms-furl can update the following files for better integration:",
					);
					for (const action of actions) {
						hintLines.push(`• ${action.file} - ${action.description}`);
					}
				}
				if (manualHints.length > 0) {
					if (hintLines.length > 0) {
						hintLines.push("");
					}
					hintLines.push(...manualHints);
				}
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.warn(`Warning: integration updates failed (${message})`);
		}
	}

	// Fetch content
	let content: string;
	if (inputIsUrl) {
		content = await fetchContent(input);
	} else {
		try {
			content = await readFile(input, "utf-8");
		} catch (error) {
			const err = error as NodeJS.ErrnoException;
			if (err?.code === "ENOENT") {
				console.error(`Error: File not found: ${input}`);
				process.exit(1);
			}
			throw error;
		}
	}
	const debug =
		options.debug === true
			? (message: string) => {
					console.log(`[debug] ${message}`);
				}
			: undefined;

	const result = split(content, debug);
	let detectedLabel: string = result.pattern;
	let pages = result.pages;
	let llmsTxtLinks: string[] | null = null;
	let fetchFailures: FetchFailure[] = [];

	if (pages.length === 0) {
		const baseUrl = inputIsUrl ? input : undefined;
		const links = extractLlmsTxtLinks(content, baseUrl);
		if (links.length > 0) {
			llmsTxtLinks = links;
			detectedLabel = "llms-txt";
			console.log(`\nFetching ${links.length} linked pages...`);
			const includeHostPrefix = shouldPrefixHost(links);
			if (debug) {
				debug(
					`llms.txt links: ${links.length} (host prefix: ${
						includeHostPrefix ? "on" : "off"
					})`,
				);
			}
			const fetchResult = await fetchLinkedPages(links, includeHostPrefix, debug);
			pages = fetchResult.pages;
			fetchFailures = fetchResult.failures;
		}
	}

	const adjusted =
		inputIsUrl === true ? maybeFlattenOutputPaths(pages) : { pages };

	if (adjusted.pages.length === 0) {
		const hint = options.debug ? "" : " (try --debug)";
		console.error(`Error: No pages found in input file${hint}`);
		process.exit(1);
	}

	const logLines: string[] = [];
	if (options.debug) {
		logLines.push(`  -> Detected: ${detectedLabel}`);
		if (llmsTxtLinks) {
			logLines.push(`  -> Links: ${llmsTxtLinks.length}`);
		}
	}
	if (llmsTxtLinks) {
		logLines.push(`  -> Fetched: ${adjusted.pages.length}`);
		if (fetchFailures.length > 0) {
			logLines.push(`  -> Failed: ${fetchFailures.length}`);
			for (const failure of fetchFailures) {
				logLines.push(`     - ${failure.status} ${failure.url}`);
			}
		}
	} else {
		logLines.push(`  -> Pages: ${adjusted.pages.length}`);
	}
	if (options.debug && adjusted.flattenedRoot) {
		logLines.push(`     (flattened from "${adjusted.flattenedRoot}/")`);
	}

	// Write output files
	for (const page of adjusted.pages) {
		const outputPath = join(outputDir, page.outputPath);
		const dir = dirname(outputPath);

		await mkdir(dir, { recursive: true });
		await writeFile(outputPath, page.content, "utf-8");
	}

	const indexContent = buildIndexJson(
		adjusted.pages.map((page) => page.outputPath),
		input,
		inputIsUrl ? new URL(input).host : undefined,
	);
	const indexPath = join(outputDir, "index.json");
	await writeFile(indexPath, indexContent, "utf-8");

	logLines.push(`  ${formatOk(`Saved to ${outputDisplay}`)}`);
	if (options.debug) {
		logLines.push(`  -> Index: ${formatPath(indexPath)}`);
	}

	for (const line of logLines) {
		console.log(line);
	}
	printSection("hint", hintLines);
}
