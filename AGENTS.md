# Repository Guidelines

## Project Structure & Modules
- Turborepo monorepo (desktop-only):
  - `apps/desktop` — Tauri v2 desktop app (Rust backend + SolidStart frontend).
  - `packages/ui-solid` — SolidJS component library (Kobalte + TailwindCSS).
  - `packages/web-api-contract` — ts-rest API contracts for license/API communication.
  - `packages/config` — Shared TypeScript and Vite configuration.
  - `packages/tsconfig` — Base TypeScript configuration.
  - `crates/*` — Rust crates for recording, media, rendering, camera, encoding, export.

## Build, Test, Develop
- Install: `pnpm install`; setup: `pnpm env-setup` then `pnpm cap-setup`.
- Dev: `pnpm dev:desktop` for the desktop app. `pnpm dev` also works (via Turbo).
- Build: `pnpm build` (Turbo). Desktop release: `pnpm tauri:build`.
- Quality: `pnpm lint`, `pnpm format`, `pnpm typecheck`. Rust: `cargo build -p <crate>`, `cargo test -p <crate>`, `cargo fmt`.

## Coding Style & Naming
- TypeScript: Biome formats/lints (`pnpm format`). Tabs for indentation, double quotes.
- Rust: `rustfmt` + workspace clippy lints.
- Naming: files kebab-case (`user-menu.tsx`); components PascalCase; Rust modules snake_case, crates kebab-case.
- Runtime: Node 20, pnpm 10.x, Rust 1.88+.
- **NO COMMENTS**: Never add comments to code (`//`, `/* */`, `///`, `//!`, `#`, etc.). Code must be self-explanatory through naming, types, and structure. This applies to all languages.

## Testing
- TS/JS: Vitest (desktop). Name tests `*.test.ts(x)` near sources.
- Rust: `cargo test` per crate; tests in `src` or `tests`.
- Prefer unit tests for logic and light smoke tests for flows; no strict coverage yet.

## Commits & PRs
- Conventional style: `feat:`, `fix:`, `chore:`, `improve:`, `refactor:`, `docs:` (e.g., `fix: hide watermark for pro users`).
- PRs: clear description, linked issues, screenshots/GIFs for UI, env/migration notes. Keep scope tight and update docs when behavior changes.

## Agent-Specific Practices
- Do not start extra servers; assume the developer already has the environment running.
- Never edit auto-generated files: `**/tauri.ts`, `**/queries.ts`, `apps/desktop/src-tauri/gen/**`, `packages/ui-solid/src/auto-imports.d.ts`.
- Prefer existing scripts and Turbo filters over ad-hoc commands; clear `.turbo` only when necessary.
- Keep secrets out of VCS; configure via `.env` from `pnpm env-setup`.
- macOS note: desktop permissions (screen/mic) apply to the terminal running `pnpm dev:desktop`.
- **CRITICAL: NO CODE COMMENTS**: Never add any form of comments to generated or edited code. Code must be self-explanatory.

## Code Formatting
- Always format code before completing work: run `pnpm format` for TypeScript/JavaScript and `cargo fmt` for Rust.
- Run these commands regularly during development and always at the end of a coding session.
