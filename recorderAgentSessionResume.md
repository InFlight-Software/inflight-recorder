# Recorder Agent Session Resume

**Last updated:** 2026-03-12
**Branch:** `dependabot-remediations-03-10-2026`
**PR:** https://github.com/inflightsoftware/inflight-recorder/pull/40

## What Was Done

### Commit 1: `beba7c134` — Remediate Dependabot and CodeQL security alerts
- Fixed SSRF, XSS, insecure randomness, tainted format strings, cleartext logging in `apps/web/` code
- Fixed incomplete regex escape in `apps/desktop/src/routes/(window-chrome)/new-main/TargetCard.tsx`
- Replaced `println!` with `tracing` in `apps/desktop/src-tauri/src/lib.rs`
- Added `permissions: contents: read` to `.github/workflows/ci.yml` and `validate-migration-journal.yml`
- Bumped various dependency versions in package.json files
- Added pnpm overrides for ~42 transitive dependencies

### Commit 2: `77f8406f8` — Remove unused web apps and packages, keep desktop only
- **Deleted apps:** `web`, `discord-bot`, `storybook`, `cli`, `web-cluster`
- **Deleted packages:** `database`, `web-backend`, `web-api-contract-effect`, `web-domain`, `ui`, `env`, `utils`, `local-docker`, `s3`
- Removed `@inflight/database` and `@inflight/utils` from `apps/desktop/package.json` (never imported)
- Fixed shell injection in `apps/desktop/scripts/prodBeforeBundle.js` (exec -> execFile)
- Fixed shell injection in `scripts/symbolicate-macos-crash.js` (exec -> execFile)
- Removed `apps/cli` from `Cargo.toml` workspace members
- Simplified `tsconfig.json`, `turbo.json`, `package.json`, `pnpm-workspace.yaml`
- Removed web-only CI workflow `docker-build-web.yml` and `validate-migration-journal.yml`
- Removed `pnpm web exec next typegen` from `ci.yml`
- This single removal eliminated ~130 Dependabot alerts and all npm-related CodeQL alerts

### Commit 3: `5971083ee` — Fix remaining diff DoS vulnerability
- Added pnpm override: `"diff@>=8": ">=8.0.3"`

### Commit 4: `9708ce28e` — Fix CI: expose desktop output from changes job
- The `build-desktop` CI job was always SKIPPED because the `changes` job defined a `desktop` path filter but never exposed it in the job `outputs` block
- Added `desktop: ${{ steps.filter.outputs.desktop }}` to the outputs
- This triggered Build Desktop (macOS + Windows) for the first time on this PR

## Alert Status After Changes

| Category | Before | After |
|----------|--------|-------|
| Dependabot alerts | 136 open | 1 remaining |
| CodeQL alerts | 38 open | 0 |
| npm packages | ~2500 | ~1500 |

### Remaining unfixable alert
**lru v0.12.5** (LOW severity) — pinned by `glyphon 0.9.0 -> cosmic-text -> rustybuzz -> ttf-parser`. Fix requires `glyphon 0.10` which requires `wgpu 28` (breaking major version bump across the entire rendering pipeline). The vulnerability is a theoretical Stacked Borrows violation in `IterMut`, not practically exploitable.

### Rust Dependabot alerts that resolved themselves
- `time` (MEDIUM): Already at patched version 0.3.47
- `bytes` (MEDIUM): Already at patched version 1.11.1
- `glib` (MEDIUM): Linux-only crate, not compiled on Windows/macOS targets

## Local Verification Results (Windows)

All passed:
- `pnpm install` — pass
- `pnpm typecheck` — pass (only pre-existing `debug.tsx` error from main)
- `cargo build --no-default-features` (1001 crates) — compiled in ~2 min, zero errors
- `cargo run --no-default-features` — binary launches and stays running
- Vite/SolidStart dev server on `localhost:3002` — starts successfully
- `pnpm dev:desktop` full Tauri dev flow — setup, prepare, Vite, Rust all succeed

**IMPORTANT:** `LIBCLANG_PATH` must be set for Rust compilation:
```bash
export LIBCLANG_PATH="C:/Program Files/LLVM/bin"
```
This is a pre-existing environment issue, not related to our changes.

## CI Status (as of last push)

| Check | Status |
|-------|--------|
| CodeQL (actions, JS/TS, Rust) | PASS |
| Detect Changes | PASS |
| Lint (Biome) | PASS |
| Verify Tauri plugin versions | PASS |
| Build Desktop (macOS + Windows) | PENDING (first time running — was always skipped before) |
| Clippy (macOS) | PENDING |
| Typecheck | FAIL — pre-existing on main |
| Format (Biome) | FAIL — pre-existing on main |
| Format (Cargo) | FAIL — pre-existing on main |

## What Needs To Happen Next

### Immediate
1. **Check Build Desktop CI results** — `gh pr checks 40 --repo inflightsoftware/inflight-recorder`
   - If they passed, update the PR test plan checkboxes
   - If they failed, investigate — could be pre-existing or could need fixes
2. **Check Clippy CI results** — same command above

### Before Merge
3. **Manual QA** — recording, editing, and export functionality on the desktop app
4. **Decision on pre-existing CI failures** — the 4 failures (Typecheck, Format Biome, Format Cargo, Clippy) all exist on main already. They're not blocking but should be cleaned up separately.

### After Merge
5. **Close superseded Dependabot PRs** — PRs #36 (storybook), #39 (dompurify), #42 (hono) are for packages that no longer exist in the codebase after our removal. They should be closed.
6. **Dismiss/close resolved Dependabot alerts** on GitHub — most will auto-close when the branch merges, but verify.
7. **Consider fixing pre-existing CI failures** in a separate PR on main.

## Key Constraints (DO NOT FORGET)

- **NEVER push to upstream CapSoftware/Cap** — this is a fork. PRs go to `inflightsoftware/inflight-recorder`
- **No breaking changes** — production SaaS for a multimillion dollar company
- **No code comments** — per CLAUDE.md, code must be self-explanatory
- **Git identity:** `asegal-inflight` / `alex@inflight.co`

## Useful Commands

```bash
# Check PR status
gh pr checks 40 --repo inflightsoftware/inflight-recorder

# View PR
gh pr view 40 --repo inflightsoftware/inflight-recorder

# Run desktop dev (requires LIBCLANG_PATH)
LIBCLANG_PATH="C:/Program Files/LLVM/bin" pnpm dev:desktop

# Check remaining Dependabot alerts
gh api repos/inflightsoftware/inflight-recorder/dependabot/alerts --jq '[.[] | select(.state == "open")] | length'

# Check CodeQL alerts
gh api repos/inflightsoftware/inflight-recorder/code-scanning/alerts --jq '[.[] | select(.state == "open")] | length'
```

## File Location
This file is at the repo root and is NOT committed. Add to `.gitignore` if needed, or just don't stage it.
