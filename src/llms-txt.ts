const LIST_ITEM_REGEX = /^([-*+]|\d+\.)\s+/;

function stripTrailingPunctuation(value: string): string {
	return value.replace(/[)\].,;:!?]+$/g, "");
}

function normalizeUrl(raw: string, baseUrl?: string): string | null {
	let cleaned = raw.trim();
	if (!cleaned) {
		return null;
	}
	cleaned = cleaned.replace(/^<|>$/g, "");
	cleaned = stripTrailingPunctuation(cleaned);

	const hasScheme =
		cleaned.startsWith("http://") || cleaned.startsWith("https://");
	if (!hasScheme && !baseUrl) {
		return null;
	}

	try {
		const resolved = baseUrl ? new URL(cleaned, baseUrl) : new URL(cleaned);
		return resolved.toString();
	} catch {
		return null;
	}
}

function extractCandidates(text: string): string[] {
	const candidates: string[] = [];

	const markdownLinkRegex = /\[[^\]]*]\(([^)]+)\)/g;
	let match = markdownLinkRegex.exec(text);
	while (match !== null) {
		const raw = match[1];
		if (raw) {
			const firstToken = raw.trim().split(/\s+/)[0];
			if (firstToken) {
				candidates.push(firstToken);
			}
		}
		match = markdownLinkRegex.exec(text);
	}

	const urlRegex = /https?:\/\/[^\s)]+/g;
	match = urlRegex.exec(text);
	while (match !== null) {
		if (match[0]) {
			candidates.push(match[0]);
		}
		match = urlRegex.exec(text);
	}

	return candidates;
}

export function extractLlmsTxtLinks(
	content: string,
	baseUrl?: string,
): string[] {
	const urls: string[] = [];
	const seen = new Set<string>();
	let inCodeBlock = false;

	for (const rawLine of content.split(/\r?\n/)) {
		const trimmed = rawLine.trim();
		if (!trimmed) {
			continue;
		}

		if (trimmed.startsWith("```")) {
			inCodeBlock = !inCodeBlock;
			continue;
		}
		if (inCodeBlock) {
			continue;
		}

		const isPlainUrlLine = /^https?:\/\//.test(trimmed);
		const isListItem = LIST_ITEM_REGEX.test(trimmed);
		if (!isPlainUrlLine && !isListItem) {
			continue;
		}

		const lineText = isListItem
			? trimmed.replace(LIST_ITEM_REGEX, "")
			: trimmed;
		const candidates = extractCandidates(lineText);

		if (candidates.length === 0 && isListItem) {
			const token = lineText.split(/\s+/)[0];
			if (
				token &&
				(token.startsWith("/") ||
					token.startsWith("./") ||
					token.startsWith("../"))
			) {
				candidates.push(token);
			}
		}

		for (const candidate of candidates) {
			const normalized = normalizeUrl(candidate, baseUrl);
			if (!normalized || seen.has(normalized)) {
				continue;
			}
			seen.add(normalized);
			urls.push(normalized);
		}
	}

	return urls;
}
