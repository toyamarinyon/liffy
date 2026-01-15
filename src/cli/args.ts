/**
 * Minimal CLI argument parser
 * Usage: parseArgs(Bun.argv.slice(2))
 */

export interface ParsedArgs {
  command: string | null;
  positionals: string[];
  options: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const options: Record<string, string | boolean> = {};
  let command: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;

    if (arg.startsWith("--")) {
      // --key=value or --key value or --flag
      const eqIndex = arg.indexOf("=");
      if (eqIndex !== -1) {
        const key = arg.slice(2, eqIndex);
        const value = arg.slice(eqIndex + 1);
        options[key] = value;
      } else {
        const key = arg.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith("-")) {
          options[key] = next;
          i++;
        } else {
          options[key] = true;
        }
      }
    } else if (arg.startsWith("-") && arg.length === 2) {
      // -k value or -f (flag)
      const key = arg.slice(1);
      const next = argv[i + 1];
      if (next && !next.startsWith("-")) {
        options[key] = next;
        i++;
      } else {
        options[key] = true;
      }
    } else {
      // Positional argument
      if (command === null && !arg.includes("/") && !arg.includes(".")) {
        // First non-option without path chars is likely a command
        command = arg;
      } else {
        positionals.push(arg);
      }
    }
  }

  return { command, positionals, options };
}

export function showHelp(): void {
  console.log(`liffy - Split llms-full.txt into individual markdown files

Usage:
  liffy <input> [output-dir]       Split input file (default: current dir)
  liffy split <input> [output-dir] Same as above
  liffy list [output-dir]          List split files
  liffy remove <files...>          Remove specific files
  liffy clean [output-dir]         Remove all split files

Options:
  --help, -h     Show this help
  --version, -v  Show version
`);
}
