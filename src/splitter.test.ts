import { describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { detectPattern, split, urlToOutputPath } from "./splitter";

const fixturesDir = join(import.meta.dir, "__fixtures__");

describe("detectPattern", () => {
	it("detects Pattern A (# Title + Source:)", () => {
		const content = readFileSync(join(fixturesDir, "pattern-a.txt"), "utf-8");
		expect(detectPattern(content)).toBe("pattern-a");
	});

	it("detects Pattern B (<page> tags)", () => {
		const content = readFileSync(join(fixturesDir, "pattern-b.txt"), "utf-8");
		expect(detectPattern(content)).toBe("pattern-b");
	});

	it("detects Pattern C (# Title + empty line + URL:)", () => {
		const content = readFileSync(join(fixturesDir, "pattern-c.txt"), "utf-8");
		expect(detectPattern(content)).toBe("pattern-c");
	});
});

describe("urlToOutputPath", () => {
	it("converts URL to output path", () => {
		expect(
			urlToOutputPath("https://axiom.co/docs/ai-engineering/concepts"),
		).toBe("docs/ai-engineering/concepts.md");
	});

	it("handles trailing slashes", () => {
		expect(urlToOutputPath("https://developers.cloudflare.com/agents/")).toBe(
			"agents.md",
		);
	});

	it("handles index pages", () => {
		expect(urlToOutputPath("https://example.com/")).toBe("index.md");
	});

	it("removes .md extension from source", () => {
		expect(
			urlToOutputPath("https://developers.cloudflare.com/404/index.md"),
		).toBe("404/index.md");
	});

	it("handles deeply nested paths", () => {
		expect(
			urlToOutputPath("https://axiom.co/docs/ai-engineering/evaluate/overview"),
		).toBe("docs/ai-engineering/evaluate/overview.md");
	});
});

describe("split - Pattern A", () => {
	const content = readFileSync(join(fixturesDir, "pattern-a.txt"), "utf-8");
	const result = split(content);

	it("detects pattern correctly", () => {
		expect(result.pattern).toBe("pattern-a");
	});

	it("splits into correct number of pages", () => {
		expect(result.pages).toHaveLength(3);
	});

	it("extracts titles correctly", () => {
		expect(result.pages[0]?.title).toBe("Concepts");
		expect(result.pages[1]?.title).toBe("Create");
		expect(result.pages[2]?.title).toBe("Evaluation overview");
	});

	it("extracts URLs correctly", () => {
		expect(result.pages[0]?.url).toBe(
			"https://axiom.co/docs/ai-engineering/concepts",
		);
		expect(result.pages[1]?.url).toBe(
			"https://axiom.co/docs/ai-engineering/create",
		);
		expect(result.pages[2]?.url).toBe(
			"https://axiom.co/docs/ai-engineering/evaluate/overview",
		);
	});

	it("generates correct output paths", () => {
		expect(result.pages[0]?.outputPath).toBe("docs/ai-engineering/concepts.md");
		expect(result.pages[1]?.outputPath).toBe("docs/ai-engineering/create.md");
		expect(result.pages[2]?.outputPath).toBe(
			"docs/ai-engineering/evaluate/overview.md",
		);
	});

	it("does not split on # inside code blocks", () => {
		// The fixture has # comments inside a code block that should NOT trigger splits
		const createPage = result.pages.find((p) => p.title === "Create");
		expect(createPage).toBeDefined();
		expect(createPage!.content).toContain("// # Not a title");
		expect(createPage!.content).toContain("// Source: not a real source");
	});
});

describe("split - Pattern B", () => {
	const content = readFileSync(join(fixturesDir, "pattern-b.txt"), "utf-8");
	const result = split(content);

	it("detects pattern correctly", () => {
		expect(result.pattern).toBe("pattern-b");
	});

	it("splits into correct number of pages", () => {
		expect(result.pages).toHaveLength(3);
	});

	it("extracts titles from frontmatter", () => {
		expect(result.pages[0]?.title).toBe(
			"404 - Page Not Found | Cloudflare Docs",
		);
		expect(result.pages[1]?.title).toBe(
			"1.1.1.1 (DNS Resolver) · Cloudflare 1.1.1.1 docs",
		);
		expect(result.pages[2]?.title).toBe("Agents · Cloudflare Agents docs");
	});

	it("extracts URLs from source_url.html", () => {
		expect(result.pages[0]?.url).toBe("https://developers.cloudflare.com/404/");
		expect(result.pages[1]?.url).toBe(
			"https://developers.cloudflare.com/1.1.1.1/",
		);
		expect(result.pages[2]?.url).toBe(
			"https://developers.cloudflare.com/agents/",
		);
	});

	it("generates correct output paths", () => {
		expect(result.pages[0]?.outputPath).toBe("404.md");
		expect(result.pages[1]?.outputPath).toBe("1.1.1.1.md");
		expect(result.pages[2]?.outputPath).toBe("agents.md");
	});

	it("preserves frontmatter in content", () => {
		expect(result.pages[0]?.content).toContain("---");
		expect(result.pages[0]?.content).toContain("title: 404 - Page Not Found");
	});
});

describe("split - Pattern C", () => {
	const content = readFileSync(join(fixturesDir, "pattern-c.txt"), "utf-8");
	const result = split(content);

	it("detects pattern correctly", () => {
		expect(result.pattern).toBe("pattern-c");
	});

	it("splits into correct number of pages", () => {
		expect(result.pages).toHaveLength(3);
	});

	it("extracts titles correctly", () => {
		expect(result.pages[0]?.title).toBe("Get started with Claude");
		expect(result.pages[1]?.title).toBe("API Reference");
		expect(result.pages[2]?.title).toBe("SDK Overview");
	});

	it("extracts URLs correctly", () => {
		expect(result.pages[0]?.url).toBe(
			"https://platform.claude.com/docs/en/get-started",
		);
		expect(result.pages[1]?.url).toBe(
			"https://platform.claude.com/docs/en/api-reference",
		);
		expect(result.pages[2]?.url).toBe(
			"https://platform.claude.com/docs/en/sdk",
		);
	});

	it("generates correct output paths", () => {
		expect(result.pages[0]?.outputPath).toBe("docs/en/get-started.md");
		expect(result.pages[1]?.outputPath).toBe("docs/en/api-reference.md");
		expect(result.pages[2]?.outputPath).toBe("docs/en/sdk.md");
	});

	it("does not split on # inside code blocks", () => {
		const apiPage = result.pages.find((p) => p.title === "API Reference");
		expect(apiPage).toBeDefined();
		expect(apiPage!.content).toContain("# Example code block");
		expect(apiPage!.content).toContain("# This should not trigger a split");
	});
});

describe("split - Pattern D", () => {
	const content = readFileSync(join(fixturesDir, "pattern-d.txt"), "utf-8");
	const result = split(content);

	it("detects pattern correctly", () => {
		expect(result.pattern).toBe("pattern-d");
	});

	it("splits into correct number of pages", () => {
		expect(result.pages).toHaveLength(3);
	});

	it("extracts titles from metadata", () => {
		expect(result.pages[0]?.title).toBe("Account Management");
		expect(result.pages[1]?.title).toBe("Deployments");
		expect(result.pages[2]?.title).toBe("Projects");
	});

	it("extracts URLs from source field", () => {
		expect(result.pages[0]?.url).toBe("https://vercel.com/docs/accounts");
		expect(result.pages[1]?.url).toBe("https://vercel.com/docs/deployments");
		expect(result.pages[2]?.url).toBe("https://vercel.com/docs/projects");
	});

	it("generates correct output paths", () => {
		expect(result.pages[0]?.outputPath).toBe("docs/accounts.md");
		expect(result.pages[1]?.outputPath).toBe("docs/deployments.md");
		expect(result.pages[2]?.outputPath).toBe("docs/projects.md");
	});

	it("extracts content correctly", () => {
		expect(result.pages[0]?.content).toContain("# Account Management");
		expect(result.pages[1]?.content).toContain("vercel deploy");
	});

	it("emits debug logs for dash-line parsing", () => {
		const debugMessages: string[] = [];
		const debugResult = split(content, (message) => {
			debugMessages.push(message);
		});

		expect(debugResult.pages).toHaveLength(3);
		expect(
			debugMessages.some((message) => message.includes("pattern-d dash lines:")),
		).toBe(true);
		expect(
			debugMessages.some((message) =>
				message.includes("pattern-d first dash line"),
			),
		).toBe(true);
	});
});

describe("edge cases", () => {
	it("handles empty content", () => {
		const result = split("");
		expect(result.pages).toHaveLength(0);
	});

	it("handles content with no valid pages", () => {
		const result = split("Just some random text without any page markers.");
		expect(result.pages).toHaveLength(0);
	});
});
