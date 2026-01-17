import { describe, expect, it } from "bun:test";
import { extractLlmsTxtLinks } from "./llms-txt";

describe("extractLlmsTxtLinks", () => {
	it("extracts links from list items and plain URLs", () => {
		const content = `
# Example Docs

- https://example.com/docs/intro.md
- [Guide](https://example.com/docs/guide.md)
- /docs/api.md
- https://example.com/docs/api.md

https://example.com/docs/root.md

\`\`\`
- https://example.com/ignore.md
\`\`\`
`;

		const urls = extractLlmsTxtLinks(content, "https://example.com/llms.txt");

		expect(urls).toEqual([
			"https://example.com/docs/intro.md",
			"https://example.com/docs/guide.md",
			"https://example.com/docs/api.md",
			"https://example.com/docs/root.md",
		]);
	});

	it("resolves relative links against the base URL", () => {
		const content = `
- ./getting-started.md
- ../reference.md
`;
		const urls = extractLlmsTxtLinks(
			content,
			"https://example.com/docs/llms.txt",
		);

		expect(urls).toEqual([
			"https://example.com/docs/getting-started.md",
			"https://example.com/reference.md",
		]);
	});

	it("ignores non-list lines with URLs", () => {
		const content = `
See https://example.com/docs/ignore.md for details.
- https://example.com/docs/keep.md
`;
		const urls = extractLlmsTxtLinks(content, "https://example.com/llms.txt");

		expect(urls).toEqual(["https://example.com/docs/keep.md"]);
	});
});
