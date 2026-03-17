# Post-Mortem: Instant Recording Broken on Windows

**Date:** 2026-03-17
**Severity:** P1 — Instant recording mode is completely non-functional on Windows
**Affected versions:** main branch (post-PR #43 merge), dependabot-remediations branch
**Discovered during:** Manual QA of PR #40
**Not caused by PR #40** — both bugs exist on `main` and were introduced by PR #43

---

## Symptoms

When starting an instant recording on Windows:
1. UI shows "Recording starting" and **never transitions** to the active recording state
2. No stop button appears — the user cannot stop, pause, or interact with the recording
3. The backend is actually recording (D3D capture + MediaFoundation encoding run normally)
4. The log is flooded with `from_pending_file_to_chunks/open: NotFound` errors (~10/sec)
5. The app must be force-killed to recover

---

## Root Causes

### Bug 1: `output.mp4` vs `display.mp4` file path mismatch (PR #43 regression)

PR #43 refactored the instant recording pipeline and renamed the encoder output file from `display.mp4` to `output.mp4`, but did not update all consumers.

**Writes to `output.mp4` (correct, updated by PR #43):**
| File | Line | Context |
|------|------|---------|
| `crates/recording/src/instant_recording.rs` | 382 | Camera-only recording output |
| `crates/recording/src/instant_recording.rs` | 450 | Screen capture recording output |
| `crates/project/src/meta.rs` | 180 | `RecordingMeta::output_path()` |

**Still reads `display.mp4` (broken, not updated):**
| File | Line | Context |
|------|------|---------|
| `apps/desktop/src-tauri/src/recording.rs` | 779 | `InstantMultipartUpload::spawn()` — progressive upload during recording |
| `apps/desktop/src-tauri/src/recording.rs` | 1354 | Screenshot/thumbnail generation after recording stops |
| `apps/desktop/src-tauri/src/upload.rs` | 74 | `upload_video()` multipart upload initiation |
| `apps/desktop/src-tauri/src/upload.rs` | 83, 112 | Upload subpath and completion handler |

**Impact:** The progressive uploader spawns immediately when the recording actor starts and polls for `content/display.mp4` every ~100ms. Since the file never exists (the encoder writes to `content/output.mp4`), the upload spins in an infinite retry loop, flooding logs with ~600 errors/minute. After recording stops, the screenshot/thumbnail path also fails to find the file.

Note: Studio recordings are NOT affected — they use a different directory structure (`content/segments/segment-N/display.mp4`).

### Bug 2: `PostMessage` failure causes UI state transition to be silently dropped

During recording start on Windows, `PostMessage` fails with error `0x80070578` (ERROR_INVALID_WINDOW_HANDLE). This prevents the `CurrentRecordingChanged` event from reaching the frontend.

**Mechanism:**
1. `set_pending_recording()` fires `CurrentRecordingChanged` — the UI shows "Recording starting"
2. Target select overlay windows are closed via `win.close().ok()` — but on Windows, handle destruction is asynchronous
3. Background tasks on overlay windows (`TargetUnderCursor` emission every 50ms, `WindowFocusManager` focus checks every 400ms) continue running against the zombie HWND
4. `set_current_recording()` fires `CurrentRecordingChanged` — Tauri's `.emit()` iterates all registered webview windows including the zombie overlay, and `PostMessageW` fails on the stale handle
5. The error is silently swallowed by `.ok()` at `lib.rs:167`
6. The frontend never receives the Pending → Active transition — the stop button never appears

**Why this is Windows-specific:** On macOS, Cocoa window destruction is more synchronous and handles stale references gracefully. On Windows, `PostMessageW` to a destroyed HWND immediately returns `ERROR_INVALID_WINDOW_HANDLE`.

---

## Evidence (from dev build logs)

```
21:56:23.156  DEBUG  spawning start_recording actor
21:56:23.157  TRACE  creating recording actor
21:56:23.280  DEBUG  Windows MP4 muxer encoder channel buffer size=240
21:56:23.348  TRACE  D3D capturer created successfully
21:56:23.429  INFO   H264 stream added: 1920x1032 @ 30 fps, 3269 kbps
21:56:23.430  INFO   Built pipeline for output ...\content\output.mp4    <-- writes output.mp4
21:56:23.430  DEBUG  Initiating multipart upload (display.mp4)...         <-- looks for display.mp4
21:56:23.430  PostMessage failed; Error code 0x80070578 - Invalid window handle.
21:56:24.036  ERROR  from_pending_file_to_chunks/open: NotFound           <-- starts looping
21:56:24.138  ERROR  from_pending_file_to_chunks/open: NotFound
21:56:24.239  ERROR  from_pending_file_to_chunks/open: NotFound
  ... (continues every ~100ms for the duration of the recording)
```

No `CurrentRecordingChanged` event delivery to frontend is observed after the `PostMessage` failure.

---

## Recommended Fixes

### Fix 1: Rename `display.mp4` → `output.mp4` in all consumers (REQUIRED)

Update the 4 references in `recording.rs` and `upload.rs` to use `output.mp4` to match the encoder output. These are straightforward string changes:

```
recording.rs:779  "content/display.mp4" → "content/output.mp4"
recording.rs:781  "display.mp4"         → "output.mp4"
recording.rs:1354 "content/display.mp4" → "content/output.mp4"
upload.rs:74      "display.mp4"         → "output.mp4"
upload.rs:83      "display.mp4"         → "output.mp4"
upload.rs:112     "display.mp4"         → "output.mp4"
```

### Fix 2: Ensure overlay windows are fully destroyed before emitting state events (RECOMMENDED)

Options (in order of preference):
1. **Await overlay window destruction** before calling `set_current_recording()` — add a brief delay or listen for the `Destroyed` event on overlay windows before proceeding
2. **Abort background tasks** (TargetUnderCursor, WindowFocusManager) synchronously when overlays are closed, rather than waiting for the `Destroyed` event
3. **Filter emit targets** — emit `CurrentRecordingChanged` only to the main/in-progress-recording windows, not to all webview windows

### Fix 3: Don't silently swallow event emission failures (RECOMMENDED)

Change `.ok()` to at minimum log a warning when `CurrentRecordingChanged.emit()` fails, so future PostMessage failures are visible:

```rust
if let Err(e) = CurrentRecordingChanged.emit(&self.handle) {
    tracing::warn!("Failed to emit CurrentRecordingChanged: {e}");
}
```

---

## Impact Assessment

| Impact | Scope |
|--------|-------|
| Instant recording on Windows | **Completely broken** — recording runs but UI is stuck, no way to stop |
| Instant recording on macOS | **Upload broken** (wrong filename) but UI likely works (PostMessage issue is Windows-specific) |
| Studio recording | **Not affected** — uses different file paths |
| Existing recordings | **Not affected** — only impacts new instant recordings |

---

## Timeline

| Date | Event |
|------|-------|
| 2026-03-16 | PR #43 merged to main (introduced both regressions) |
| 2026-03-17 | Discovered during manual QA of PR #40 |
| 2026-03-17 | Post-mortem analysis completed |
