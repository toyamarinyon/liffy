import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { split } from "../../splitter.js";

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
	let path = parsed.pathname;

	// Remove the filename (e.g., llms-full.txt)
	path = dirname(path);

	// Remove leading slash
	path = path.replace(/^\//, "");

	return join("liffy", parsed.host, path);
}

async function fetchContent(url: string): Promise<string> {
	console.log(`Fetching ${url}...`);

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	return response.text();
}

export async function splitCommand(options: SplitOptions): Promise<void> {
	const { input } = options;

	let content: string;
	let outputDir: string;

	if (isUrl(input)) {
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

	if (result.pages.length === 0) {
		const hint = options.debug ? "" : " (try --debug)";
		console.error(`Error: No pages found in input file${hint}`);
		process.exit(1);
	}

	console.log(`Detected format: ${result.pattern}`);
	console.log(`Found ${result.pages.length} pages`);

	// Write output files
	let written = 0;
	for (const page of result.pages) {
		const outputPath = join(outputDir, page.outputPath);
		const dir = dirname(outputPath);

		await mkdir(dir, { recursive: true });
		await writeFile(outputPath, page.content, "utf-8");
		written++;
	}

	console.log(`Written ${written} files to ${outputDir}`);
}
