// @ts-check

import * as fs from "node:fs/promises";
import { group, intro, log, outro, text } from "@clack/prompts";

async function main() {
	intro("Welcome to the Inflight Recorder env setup CLI!");

	const file = await fs
		.readFile("./target/env-profiles/default.json", "utf8")
		.catch(() => null);
	let allEnvs = file ? JSON.parse(file) : {};

	const envs = {
		NODE_ENV: "development",
		RUST_BACKTRACE: "1",
	};

	const values = await group(
		{
			VITE_SERVER_URL: () =>
				text({
					message: "VITE_SERVER_URL",
					placeholder: "https://www.inflight.co",
					defaultValue: "https://www.inflight.co",
				}),
			VITE_VERCEL_AUTOMATION_BYPASS_SECRET: () =>
				text({
					message:
						"VITE_VERCEL_AUTOMATION_BYPASS_SECRET - skip if you're not an Inflight team member",
					placeholder: allEnvs.VITE_VERCEL_AUTOMATION_BYPASS_SECRET,
					defaultValue: allEnvs.VITE_VERCEL_AUTOMATION_BYPASS_SECRET,
				}),
		},
		{ onCancel: () => process.exit(0) },
	);

	for (const [key, value] of Object.entries(values)) {
		if (value === undefined || value === "undefined") continue;
		envs[key] = value;
	}

	await fs.writeFile(
		".env",
		Object.entries(envs)
			.map(([key, value]) => `${key}=${value}`)
			.join("\n"),
	);

	log.info(`Written ${Object.keys(envs).length} envs`);

	allEnvs = { ...allEnvs, ...envs };
	await fs.mkdir("./target/env-profiles", { recursive: true });
	await fs.writeFile(
		"./target/env-profiles/default.json",
		JSON.stringify(allEnvs, null, 4),
	);

	outro("Run 'pnpm dev:desktop' to start the desktop app");
}

await main();
