import { defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "the-pizza-tower",
		compatibilityDate: "2026-10-06",
		entrypoint,
	},
});
