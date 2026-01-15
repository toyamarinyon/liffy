import { rm, stat } from "node:fs/promises";

export interface CleanOptions {
  outputDir: string;
}

export async function cleanCommand(options: CleanOptions): Promise<void> {
  const { outputDir } = options;

  try {
    const dirStat = await stat(outputDir);
    if (!dirStat.isDirectory()) {
      console.error(`Error: Not a directory: ${outputDir}`);
      process.exit(1);
    }
  } catch {
    console.log("Nothing to clean");
    return;
  }

  await rm(outputDir, { recursive: true, force: true });
  console.log(`Removed: ${outputDir}`);
}
