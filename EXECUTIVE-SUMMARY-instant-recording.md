# Instant Recording Issue — Executive Summary

**For:** Kyle (CEO), Veer (Engineering)
**From:** Alex
**Date:** 2026-03-17
**Priority:** P1

---

## TL;DR

Instant recording mode is broken on Windows (and partially on macOS). Two bugs were introduced by PR #43's merge to main — they are **not** caused by the security remediation PR (#40).

1. **File path mismatch:** PR #43 renamed the encoder output from `display.mp4` to `output.mp4` but didn't update the upload and screenshot code. The progressive uploader polls for a file that doesn't exist, spinning in an infinite error loop.

2. **Windows PostMessage failure:** Target select overlay windows are closed asynchronously during recording start. Background tasks on those windows create stale window handles, causing Tauri's event emission to fail silently. The frontend never learns the recording started, so the UI is stuck on "Recording starting" with no stop button. The app has to be force-killed.

Studio recording mode is unaffected.

## What Needs to Happen

**Immediate fix (4 files, ~10 lines changed):** Rename `display.mp4` → `output.mp4` in `recording.rs` (lines 779, 781, 1354) and `upload.rs` (lines 74, 83, 112). This fixes the upload loop on both platforms.

**Follow-up fix:** Ensure overlay window background tasks are aborted synchronously when recording starts, so PostMessage doesn't hit stale handles on Windows. This fixes the UI freeze.

Both fixes should land on `main` before our security PR (#40) merges, since #40 is based on main and these bugs exist there.

## Full Details

See `POSTMORTEM-instant-recording-windows.md` in the repo for the complete post-mortem with log evidence, code references, and recommended fixes.
