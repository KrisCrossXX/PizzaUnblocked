import { defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "pizza-tower-live",
		compatibilityDate: "2026-10-06",
		entrypoint,
	},
});
