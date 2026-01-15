import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

export interface ListOptions {
  outputDir: string;
}

async function* walkDir(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(fullPath);
    } else if (entry.name.endsWith(".md")) {
      yield fullPath;
    }
  }
}

export async function listCommand(options: ListOptions): Promise<void> {
  const { outputDir } = options;

  try {
    const dirStat = await stat(outputDir);
    if (!dirStat.isDirectory()) {
      console.error(`Error: Not a directory: ${outputDir}`);
      process.exit(1);
    }
  } catch {
    console.error(`Error: Directory not found: ${outputDir}`);
    process.exit(1);
  }

  const files: string[] = [];
  for await (const file of walkDir(outputDir)) {
    files.push(file);
  }

  if (files.length === 0) {
    console.log("No markdown files found");
    return;
  }

  files.sort();
  for (const file of files) {
    console.log(file);
  }

  console.log(`\nTotal: ${files.length} files`);
}
