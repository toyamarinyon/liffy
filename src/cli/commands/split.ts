import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { split } from "../../splitter.js";

export interface SplitOptions {
  input: string;
  outputDir: string;
}

export async function splitCommand(options: SplitOptions): Promise<void> {
  const { input, outputDir } = options;

  // Read input file
  const file = Bun.file(input);
  if (!(await file.exists())) {
    console.error(`Error: File not found: ${input}`);
    process.exit(1);
  }

  const content = await file.text();
  const result = split(content);

  if (result.pages.length === 0) {
    console.error("Error: No pages found in input file");
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
