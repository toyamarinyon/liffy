#!/usr/bin/env bun

import { parseArgs, showHelp } from "./src/cli/args.js";
import { cleanCommand } from "./src/cli/commands/clean.js";
import { listCommand } from "./src/cli/commands/list.js";
import { removeCommand } from "./src/cli/commands/remove.js";
import { splitCommand } from "./src/cli/commands/split.js";

const args = parseArgs(Bun.argv.slice(2));
const debug = Boolean(args.options.debug || args.options.d);

// Handle help/version
if (args.options.help || args.options.h) {
	showHelp();
	process.exit(0);
}

if (args.options.version || args.options.v) {
	console.log("liffy v0.1.0");
	process.exit(0);
}

// Route commands
const command = args.command;

switch (command) {
	case "split":
		await runSplit(args.positionals, debug);
		break;

	case "list":
		await listCommand({
			outputDir: args.positionals[0] || ".",
		});
		break;

	case "remove":
	case "rm":
		await removeCommand({
			files: args.positionals,
		});
		break;

	case "clean":
		await cleanCommand({
			outputDir: args.positionals[0] || ".",
		});
		break;

	case null:
		// No command: check if first positional looks like a file
		if (args.positionals.length > 0) {
			await runSplit(args.positionals, debug);
		} else {
			showHelp();
		}
		break;

	default:
		// Unknown command: treat as input file
		await runSplit([command, ...args.positionals], debug);
		break;
}

async function runSplit(
	positionals: string[],
	debugEnabled: boolean,
): Promise<void> {
	const input = positionals[0];
	const outputDir = positionals[1];

	if (!input) {
		console.error("Error: Input file or URL required");
		showHelp();
		process.exit(1);
	}

	await splitCommand({ input, outputDir, debug: debugEnabled });
}
