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
  - llms-full.txt registry: incrementally search with `liffy search`, then `liffy fetch` what you find

## Future Ideas

- [ ] `liffy update` - update existing split files to the latest version
- [ ] `liffy search` - search within split files
- [ ] Custom pattern definitions (user-defined split rules)
- [ ] `.liffyrc` config file
