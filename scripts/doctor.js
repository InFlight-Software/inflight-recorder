// @ts-check

import { execFile as execFileCb } from "node:child_process";
import * as fs from "node:fs/promises";
import { promisify } from "node:util";

const execFile = promisify(execFileCb);

const isWindows = process.platform === "win32";
const isMac = process.platform === "darwin";

let issues = 0;

function pass(msg) {
	console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
}

function fail(msg, fix) {
	issues++;
	console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
	if (fix) console.log(`    → ${fix}`);
}

async function getVersion(cmd, args) {
	try {
		const { stdout } = await execFile(cmd, args, {
			shell: isWindows,
		});
		return stdout.trim();
	} catch {
		return null;
	}
}

async function fileExists(p) {
	return fs
		.access(p)
		.then(() => true)
		.catch(() => false);
}

console.log("\nChecking prerequisites...\n");

const nodeVersion = process.version.replace("v", "");
const nodeMajor = Number.parseInt(nodeVersion.split(".")[0], 10);
if (nodeMajor >= 20) {
	pass(`Node.js ${nodeVersion} (requires 20+)`);
} else {
	fail(
		`Node.js ${nodeVersion} is too old (requires 20+)`,
		"Install Node.js 20+ from https://nodejs.org",
	);
}

const pnpmVersion = await getVersion("pnpm", ["--version"]);
if (pnpmVersion) {
	pass(`pnpm ${pnpmVersion}`);
} else {
	fail("pnpm not found", "Install with: npm install -g pnpm");
}

const rustcOut = await getVersion("rustc", ["--version"]);
if (rustcOut) {
	pass(`${rustcOut}`);
} else {
	fail("Rust not found", "Install from https://rustup.rs");
}

const cargoOut = await getVersion("cargo", ["--version"]);
if (cargoOut) {
	pass(`${cargoOut}`);
} else {
	fail("cargo not found", "Install from https://rustup.rs");
}

if (isWindows) {
	let foundLlvm = false;

	const vsLlvmPaths = [
		"C:/Program Files/Microsoft Visual Studio/2022/Community/VC/Tools/LLVM/x64/bin/libclang.dll",
		"C:/Program Files/Microsoft Visual Studio/2022/Professional/VC/Tools/LLVM/x64/bin/libclang.dll",
		"C:/Program Files/Microsoft Visual Studio/2022/Enterprise/VC/Tools/LLVM/x64/bin/libclang.dll",
	];

	for (const p of vsLlvmPaths) {
		if (await fileExists(p)) {
			pass(`LLVM/Clang (Visual Studio: ${p})`);
			foundLlvm = true;
			break;
		}
	}

	if (
		!foundLlvm &&
		(await fileExists("C:/Program Files/LLVM/bin/libclang.dll"))
	) {
		pass("LLVM/Clang (standalone: C:/Program Files/LLVM/bin)");
		foundLlvm = true;
	}

	if (!foundLlvm) {
		fail(
			"LLVM/Clang not found",
			"Install via Visual Studio > Individual Components > 'C++ Clang tools for Windows'\n    → Or download from https://releases.llvm.org",
		);
	}
}

if (isMac) {
	const cmakeOut = await getVersion("cmake", ["--version"]);
	if (cmakeOut) {
		pass(`cmake found`);
	} else {
		fail("cmake not found", "Install with: brew install cmake");
	}
}

if (await fileExists(".env")) {
	const envContent = await fs.readFile(".env", "utf8");
	const hasServerUrl = envContent.includes("VITE_SERVER_URL");
	if (hasServerUrl) {
		pass(".env file configured");
	} else {
		fail(".env file exists but missing VITE_SERVER_URL", "Run: pnpm env-setup");
	}
} else {
	fail(".env file not found", "Run: pnpm env-setup");
}

if (await fileExists("node_modules")) {
	pass("node_modules installed");
} else {
	fail("node_modules not found", "Run: pnpm install");
}

if (await fileExists(".cargo/config.toml")) {
	pass(".cargo/config.toml exists (native deps configured)");
} else {
	fail(
		".cargo/config.toml not found",
		"Run: pnpm cap-setup (or pnpm dev:desktop which runs it automatically)",
	);
}

console.log("");
if (issues === 0) {
	console.log(
		"\x1b[32mAll checks passed!\x1b[0m Run 'pnpm dev:desktop' to start.\n",
	);
} else {
	console.log(
		`\x1b[31m${issues} issue${issues > 1 ? "s" : ""} found.\x1b[0m Fix the above and re-run 'pnpm doctor'.\n`,
	);
	process.exit(1);
}
