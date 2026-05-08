# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Additional guidance for non-Claude coding agents lives in `AGENTS.md`; keep the two in sync when changing conventions. `CONTRIBUTING.md` is inherited from upstream Cap and contains stale paths (`so.cap.desktop.dev`, upstream issue URLs) — treat this file as authoritative for the fork.

## Project Overview

Inflight Recorder is a desktop screen recording tool (fork of Cap, the open source Loom alternative). It's a Turborepo monorepo with a Tauri v2 desktop app (Rust + SolidStart).

**Application:**
- `apps/desktop` — Tauri v2 desktop app with SolidStart (recording, editing)
  - Frontend: `src/` (SolidStart routes, components, stores)
  - Backend: `src-tauri/src/` (Rust IPC commands, events, platform-specific code)

**Shared Packages:**
- `packages/ui-solid` — SolidJS components for desktop (Kobalte + TailwindCSS)
- `packages/web-api-contract` — ts-rest API contracts for desktop license/API communication
- `packages/config` — Shared TypeScript and Vite configuration
- `packages/tsconfig` — Base TypeScript configuration

**Rust Crates** (`crates/*`):
- `recording` — Core recording functionality
- `media`, `audio`, `video-decode` — Media processing pipeline
- `rendering`, `rendering-skia` — Video rendering and effects
- `camera-*` — Platform camera: `camera-avfoundation` (macOS), `camera-directshow`/`camera-mediafoundation`/`camera-windows` (Windows), `camera-ffmpeg` (cross-platform fallback)
- `scap-*` — Screen capture: `scap-screencapturekit` (macOS), `scap-direct3d` (Windows), `scap-cpal` (audio), `scap-ffmpeg`, `scap-targets`
- `enc-*` — Encoding: `enc-ffmpeg`, `enc-avfoundation` (macOS), `enc-mediafoundation` (Windows), `enc-gif`
- `export`, `editor`, `project` — Export and editing functionality
- `cursor-capture`, `cursor-info` — Cursor handling
- `gpu-converters`, `frame-converter` — GPU/frame processing
- `flags` — Feature flag system (`cap-flags`)
- `api` — API client
- `timestamp`, `utils`, `fail` — Shared utilities
- `mediafoundation-ffmpeg`, `mediafoundation-utils`, `ffmpeg-hw-device`, `media-info`, `cpal-ffmpeg` — Platform glue between FFmpeg and Windows Media Foundation / CPAL
- `cap-test` — Shared test utilities
- `workspace-hack` — Cargo dependency unification via `cargo hakari`. **Do not edit by hand** — regenerate with `cargo hakari generate` and `cargo hakari manage-deps` if the dependency graph changes (requires `cargo install cargo-hakari`)

## Key Commands

### Initial Setup
```bash
pnpm install              # Install dependencies
pnpm env-setup            # Generate .env file (interactive)
pnpm cap-setup            # Install native dependencies (FFmpeg, etc.)
```

**Platform prerequisites** (not installed by `cap-setup`):
- **Windows**: LLVM, clang, and VCPKG must be installed manually
- **macOS**: cmake must be installed manually

### Development
```bash
pnpm dev                  # Start desktop app (via Turbo)
pnpm dev:desktop          # Start desktop app directly (runs cap-setup → preparescript → tauri dev)
pnpm with-env -- <cmd>    # Run any command with .env loaded
```

In `apps/desktop`:
```bash
pnpm localdev             # Frontend-only dev via Vinxi on port 3002 (no Tauri/Rust, for UI work)
```

### Build & Quality
```bash
pnpm build                # Build all via Turbo
pnpm tauri:build          # Build desktop release
pnpm lint                 # Lint with Biome
pnpm format               # Format + auto-fix with Biome (runs `biome check --write`; ALWAYS run before completing work)
pnpm typecheck            # TypeScript check
cargo fmt                 # Format Rust code (ALWAYS run before completing work)
cargo build -p <crate>    # Build specific Rust crate
cargo test -p <crate>     # Test specific Rust crate
```

### Testing
```bash
cd apps/desktop && pnpm test              # Run desktop vitest tests
cargo test -p <crate>                     # Run Rust tests for specific crate
cargo test -p <crate> -- --nocapture      # Run with stdout visible
```

### Utilities
```bash
pnpm doctor                               # Validate dev environment (Node, pnpm, Rust, LLVM, .env)
pnpm clean                                # Remove node_modules, .next, .output, .turbo, dist
pnpm check-tauri-versions                 # Verify Tauri plugin version consistency
```

## CI Pipeline

CI runs on all PRs and pushes to `main`. Key checks:
- **Always run**: Typecheck, Biome format, Cargo format, Biome lint (non-blocking)
- **On Rust changes**: Clippy (macOS only — Windows Clippy is disabled in CI due to FFmpeg native dep limitations)
- **On desktop changes**: Desktop build (macOS + Windows)
- **On lockfile changes**: Tauri plugin version consistency check

Change detection (`dorny/paths-filter`) skips irrelevant jobs. Concurrency groups cancel superseded runs on the same branch.

## Commit Conventions

Use conventional commit style: `feat:`, `fix:`, `chore:`, `improve:`, `refactor:`, `docs:` (e.g., `fix: hide watermark for pro users`).

## Critical Rules

### Fork — PR Target
This repo is a fork of `CapSoftware/Cap`. **PRs must target `inflightsoftware/inflight-recorder`, never the upstream.** Use `gh pr create --repo inflightsoftware/inflight-recorder`.

### Auto-generated Files (NEVER EDIT)
- `**/tauri.ts` — IPC bindings (exported via `specta_typescript` in debug builds only; restart dev server to regenerate)
- `**/queries.ts` — Query bindings
- `apps/desktop/src-tauri/gen/**` — Tauri generated files
- `packages/ui-solid/src/auto-imports.d.ts` — Auto-import type definitions

### NO CODE COMMENTS
**CRITICAL**: Never add explanatory comments (`//`, `/* */`, `#`, etc.) to code in any language. Code must be self-explanatory through clear naming, type annotations, and structure.

**Narrow exception — Rust doc-comments on public crate APIs:** `///` and `//!` doc-comments on public items in `crates/*` are permitted (and already widespread) when they document the API contract. Do not use them as a loophole for inline explanation.

This rule applies to all new files and edits.

### Server Management
Do not start additional dev servers unless asked. Assume the developer already has the environment running.

### Desktop Permissions (macOS)
When running from terminal, grant screen/mic permissions to the terminal app, not the Inflight app.

## Architecture Patterns

### Technology Stack
- **Package Manager**: pnpm 10.30.3
- **Node**: 20+
- **Rust**: 1.88+ (edition 2024)
- **Build**: Turborepo (monorepo), Vinxi (frontend bundler, wraps Vite)
- **Desktop**: Tauri 2.5, SolidStart 1.1, SolidJS 1.9
- **UI**: `@inflight/ui-solid` (SolidJS + Kobalte + TailwindCSS)
- **Concurrency**: kameo (actor framework for camera/mic feeds)
- **Testing**: Vitest (for TypeScript/JavaScript), Cargo test (for Rust)
- **Linting/Formatting**: Biome (TS/JS), rustfmt (Rust)

### Forked Dependencies

Several Rust crates use custom forks (from CapSoftware GitHub org) pinned to specific revisions in root `Cargo.toml` and `[patch.crates-io]`. Key forks: `cpal`, `ffmpeg-next`, `nokhwa`, `cidre`, `posthog-rs`, `reqwest`, `glyphon`. When upgrading these, check the fork repos for relevant changes — standard crates.io versions may lack required patches.

### Security Overrides (pnpm)

Transitive JavaScript dependency CVEs are patched via `pnpm.overrides` in the root `package.json` rather than waiting for upstream bumps. When adding an override, keep the range expression narrow (pin to the vulnerable major) so unrelated majors aren't forced. Regenerate `pnpm-lock.yaml` after edits, then verify the Dependabot alert closes on next scan. See `SECURITY.md` for the full vulnerability-handling policy.

### Desktop Architecture
The desktop app follows a clear separation:
- **Frontend** (`apps/desktop/src/`):
  - SolidStart routes in `routes/`
  - Shared components in `components/`
  - State management stores in `store/` (minimal usage)
  - Auto-generated Tauri IPC bindings in `utils/tauri.ts`
- **Backend** (`apps/desktop/src-tauri/src/`):
  - Each module handles specific functionality — e.g., `recording.rs`, `camera.rs`, `audio.rs`, `export.rs`, `editor_window.rs`, `upload.rs`, `captions.rs`, `hotkeys.rs`, `tray.rs`, `permissions.rs`, `deeplink_actions.rs`, `presets.rs`, `general_settings.rs`, `recording_settings.rs`
  - Platform-specific code lives under `src-tauri/src/platform/`
  - Commands are exposed via `#[tauri::command]` and automatically typed via specta
  - Events are defined with `#[derive(tauri_specta::Event)]` and emitted to frontend

### Rust Backend State (`lib.rs`)

The central `App` struct in `lib.rs` holds all mutable application state (recording state, camera/mic feeds, server URLs). It is wrapped in `Arc<RwLock<App>>` and accessed in commands via:

```rust
pub type MutableState<'a, T> = State<'a, Arc<RwLock<T>>>;
```

Commands that read state use `state.read().await`; commands that mutate use `state.write().await`. **Deadlock risk**: never hold a write lock across an `.await` that might also acquire the lock. Keep lock scopes minimal — acquire, read/write, drop before awaiting.

### Actor Model (kameo)

Camera and microphone feeds use the **kameo** actor framework. Actors are spawned with `::spawn()` and communicated with via `.ask()` (request/response) and `.tell()` (fire-and-forget). Key actors:
- `MicrophoneFeed` — microphone input management
- `CameraFeed` — camera input management

### Command & Event Registration

All Tauri commands are registered in `lib.rs` via `tauri_specta::collect_commands![...]`; events via `collect_events![...]` (grep for these macros — they live near the bottom of `lib.rs`). New commands/events **must** be added to these lists or they won't be accessible from the frontend.

### Desktop IPC (Tauri + specta)
Commands and events are type-safe via specta. The `tauri.ts` file is auto-generated in debug builds only.

Rust command:
```rust
#[tauri::command]
#[specta::specta]
async fn start_recording(app: AppHandle, options: RecordingOptions) -> Result<(), String> { ... }
```

Rust event emit:
```rust
#[derive(Serialize, Type, tauri_specta::Event, Debug, Clone)]
pub struct UploadProgress { progress: f64, message: String }

UploadProgress { progress: 0.5, message: "Uploading...".to_string() }
  .emit(&app).ok();
```

Frontend usage (auto-generated bindings):
```typescript
import { events, commands } from "~/utils/tauri";

await commands.startRecording({ ... });

await events.uploadProgress.listen((event) => {
  setProgress(event.payload.progress);
});
```

### Platform-Conditional Compilation

Extensive use of `#[cfg(target_os = "...")]` throughout the Rust backend. Platform-specific crates are paired:
- **macOS**: `camera-avfoundation`, `scap-screencapturekit`, `enc-avfoundation`
- **Windows**: `camera-mediafoundation`/`camera-directshow`/`camera-windows`, `scap-direct3d`, `enc-mediafoundation`
- **Cross-platform**: `camera-ffmpeg`, `enc-ffmpeg`, `scap-ffmpeg`

## Conventions

### Naming
- **Files**: kebab-case (`user-menu.tsx`, `recording-settings.rs`)
- **Directories**: kebab-case
- **Components**: PascalCase
- **Rust modules**: snake_case
- **Rust crates**: kebab-case

### Code Style
- **TypeScript/JavaScript**:
  - Indentation: Tabs (configured in Biome)
  - Quotes: Double quotes (configured in Biome)
  - Strict TypeScript; avoid `any`
  - Import organization: Auto-organized by Biome
- **Rust**:
  - Follow workspace lints defined in root `Cargo.toml`
  - Rust lints: `unused_must_use = "deny"`, `deprecated = "allow"` (deprecation warnings suppressed at workspace level)
  - Clippy denies: `dbg_macro`, `let_underscore_future`, `unchecked_time_subtraction`, `collapsible_if`, `clone_on_copy`, `redundant_closure`, `ptr_arg`, `len_zero`, `let_unit_value`, `unnecessary_lazy_evaluations`, `needless_range_loop`, `manual_clamp`
  - Use `rustfmt` for formatting

## Common Workflows

### Adding a new Tauri command
1. Define command in appropriate module in `apps/desktop/src-tauri/src/`
2. Add `#[tauri::command]` and `#[specta::specta]` attributes
3. Add to `collect_commands![...]` in `lib.rs` (e.g., `module_name::command_name`)
4. Restart dev server to regenerate `tauri.ts` bindings
5. Import and use from `~/utils/tauri` in frontend

### Adding a new Tauri event
1. Define event struct with `#[derive(Serialize, Type, tauri_specta::Event, Debug, Clone)]`
2. Add to `collect_events![...]` in `lib.rs`
3. Emit via `.emit(&app)` in Rust code
4. Restart dev server to regenerate `tauri.ts` bindings
5. Listen via `events.yourEvent.listen()` in frontend

### Working with Rust crates
1. Make changes to crate code in `crates/<crate-name>/`
2. Test with `cargo test -p <crate-name>`
3. Format with `cargo fmt`
4. Build desktop app to verify integration: `pnpm dev:desktop`

## Troubleshooting

- **Turbo cache issues**: `pnpm clean` or `rm -rf .turbo`
- **IPC binding errors**: Restart dev server to regenerate `tauri.ts`
- **Node version**: Must be 20+
- **Clean rebuild**: `pnpm clean` removes all build artifacts and node_modules
- **Format on save not working**: Run `pnpm format` and `cargo fmt` manually before commits
- **Recording storage**: macOS: `~/Library/Application Support/co.inflight.desktop.dev/recordings`, Windows: `%APPDATA%/co.inflight.desktop.dev/recordings`
- **App identifier**: `co.inflight.desktop.dev` (dev), deep link scheme: `inflight-desktop://`
- **Windows Clippy**: `cargo clippy` may fail locally on Windows due to FFmpeg native-dep limitations. CI runs Clippy on macOS only — defer to CI rather than fighting the Windows toolchain.
- **`pnpm clean`**: Uses Unix `find`/`xargs`. On Windows, run from a bash-compatible shell (Git Bash, WSL, or the harness's `bash`) — PowerShell will not execute it.
- **Biome version mismatch**: CI pins Biome to `2.2.0` (matching `biome.json` schema). A local version mismatch will cause CI format checks to fail — keep `@biomejs/biome` in root `devDependencies` aligned with CI.
- **Environment validation**: Run `pnpm doctor` to check Node, pnpm, Rust, LLVM, and `.env` prerequisites before debugging setup issues.
