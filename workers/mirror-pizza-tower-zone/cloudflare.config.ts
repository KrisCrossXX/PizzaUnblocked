import { defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "pizza-tower-zone",
		compatibilityDate: "2026-10-06",
		entrypoint,
	},
});
