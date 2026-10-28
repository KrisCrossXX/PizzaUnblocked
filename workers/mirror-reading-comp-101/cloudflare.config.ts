import { defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "reading-comp-101",
		compatibilityDate: "2026-10-06",
		entrypoint,
	},
});
