import { defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "homework-help-2026",
		compatibilityDate: "2026-10-06",
		entrypoint,
	},
});
