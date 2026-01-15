import { stat, unlink } from "node:fs/promises";

export interface RemoveOptions {
	files: string[];
}

export async function removeCommand(options: RemoveOptions): Promise<void> {
	const { files } = options;

	if (files.length === 0) {
		console.error("Error: No files specified");
		process.exit(1);
	}

	let removed = 0;
	let errors = 0;

	for (const file of files) {
		try {
			const fileStat = await stat(file);
			if (!fileStat.isFile()) {
				console.error(`Skipping: Not a file: ${file}`);
				errors++;
				continue;
			}

			await unlink(file);
			console.log(`Removed: ${file}`);
			removed++;
		} catch {
			console.error(`Error: Could not remove: ${file}`);
			errors++;
		}
	}

	console.log(
		`\nRemoved ${removed} files${errors > 0 ? `, ${errors} errors` : ""}`,
	);
}
