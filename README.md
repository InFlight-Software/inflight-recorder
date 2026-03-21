<p align="center">
  <p align="center">
   <img width="150" height="150" src="https://github.com/CapSoftware/Cap/blob/main/apps/desktop/src-tauri/icons/Square310x310Logo.png" alt="Logo">
  </p>
	<h1 align="center"><b>Inflight Recorder</b></h1>
	<p align="center">
		The screen recorder for designers. Fork of <a href="https://github.com/CapSoftware/Cap">Cap</a>, the open source Loom alternative.
    <br />
    <br />
    <b>Desktop app for </b> macOS & Windows
    <br />
  </p>
</p>
<br/>

Inflight Recorder is a desktop screen recording tool built on [Cap](https://github.com/CapSoftware/Cap). It allows you to record, edit and share videos in seconds.

# Monorepo Architecture

A Turborepo monorepo using Rust, TypeScript, Tauri v2, SolidStart, and TailwindCSS.

### Apps:

- `desktop`: A [Tauri v2](https://tauri.app) (Rust) app, using [SolidStart](https://start.solidjs.com) on the frontend.

### Packages:

- `ui-solid`: [SolidJS](https://www.solidjs.com/) shared component library (Kobalte + TailwindCSS).
- `web-api-contract`: [ts-rest](https://ts-rest.com/) API contracts for desktop license/API communication.
- `tsconfig`: Shared `tsconfig` configurations.
- `config`: Shared TypeScript and Vite configuration.

### Rust Crates (`crates/*`):

Core recording, media processing, rendering, camera, screen capture, and encoding crates. See [CLAUDE.md](CLAUDE.md) for detailed crate descriptions.

### License:
Portions of this software are licensed as follows:

- All code residing in the `cap-camera*` and `scap-*` families of crates is licensed under the MIT License (see [licenses/LICENSE-MIT](https://github.com/CapSoftware/Cap/blob/main/licenses/LICENSE-MIT)).
- All third party components are licensed under the original license provided by the owner of the applicable component
- All other content not mentioned above is available under the AGPLv3 license as defined in [LICENSE](https://github.com/CapSoftware/Cap/blob/main/LICENSE)

# Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and development guide.
