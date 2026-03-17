# Cap Contributor Guide

## Introduction

### What is Cap?

Cap is an open source and privacy focused alternative to Loom. It's a video messaging tool that allows you to record, edit and share videos in seconds.

The development of Cap is still in its early stages, so please bare with us as we build out this guide.

### What is this guide?

This guide is for anyone who wants to contribute to Cap. It's a work in progress, and will be updated regularly.

### How can I contribute?

There are many ways to contribute to Cap. You can:

- [Report a bug](https://github.com/CapSoftware/cap/issues/new)
- [Suggest a feature (via Discord)](https://discord.com/invite/y8gdQ3WRN3)
- Submit a PR

## Runing Cap

### Development Requirements

Before anything else, make sure you have the following installed:

- Node Version 20+
- Rust 1.88.0+
- pnpm 8.10.5+

### General Setup

Run `pnpm install`, then run `pnpm cap-setup` to install native dependencies such as FFmpeg.

On Windows, llvm, clang, and VCPKG must be installed.
On MacOS, cmake must be installed.
`pnpm cap-setup` does not yet install these dependencies for you.

Run `pnpm env-setup` to generate a `.env` file configured for your environment.

To run the desktop app, use `pnpm dev` or `pnpm dev:desktop`.

### `@inflight/desktop` (desktop app)

When running `@inflight/desktop` from a terminal on macOS,
you will need to grant permissions (screen recording, microphone, etc.) to the terminal, not the Cap app.
For example, if you run `pnpm dev:desktop` in the macOS `Terminal.app`,
you will need to grant permissions to it instead of `Cap - Development.app`.

#### Where are my recordings stored?

You can find your recordings at `~/Library/Application Support/so.cap.desktop.dev/recordings` on macOS,
and `%programfiles%/so.cap.desktop.dev/recordings` on Windows.
