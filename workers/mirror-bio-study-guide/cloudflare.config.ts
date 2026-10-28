import { defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "bio-study-guide",
		compatibilityDate: "2026-10-06",
		entrypoint,
	},
});
