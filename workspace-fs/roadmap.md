# Roadmap

## v0.1 (Current)

- [x] Split algorithm (Pattern A/B/C support)
- [x] CLI implementation (split, list, remove, clean)
- [x] URL fetch support
- [ ] npm publish

## v0.2

- [ ] API server
  - Acts as a gateway
  - Caching (avoid re-fetching the same URL)
  - Telemetry (usage stats, popular docs, etc.)
  - llms-full.txt registry: incrementally search with `llms-furl search`, then `llms-furl fetch` what you find

## Future Ideas

- [ ] `llms-furl update` - update existing split files to the latest version
- [ ] `llms-furl search` - search within split files
- [ ] Custom pattern definitions (user-defined split rules)
- [ ] `.llms-furlrc` config file
