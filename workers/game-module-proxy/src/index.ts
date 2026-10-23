const GAME_ORIGIN = "https://pizzaunblocked.b-cdn.net";

const MIME_TYPES: Record<string, string> = {
	css: "text/css; charset=utf-8",
	data: "application/octet-stream",
	def: "text/plain; charset=utf-8",
	gif: "image/gif",
	html: "text/html; charset=utf-8",
	ini: "text/plain; charset=utf-8",
	js: "text/javascript; charset=utf-8",
	json: "application/json; charset=utf-8",
	mjs: "text/javascript; charset=utf-8",
	mp3: "audio/mpeg",
	mp4: "video/mp4",
	ogg: "audio/ogg",
	png: "image/png",
	svg: "image/svg+xml",
	ttf: "font/ttf",
	wav: "audio/wav",
	wasm: "application/wasm",
	webp: "image/webp",
	woff: "font/woff",
	woff2: "font/woff2",
};

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		if (request.method !== "GET" && request.method !== "HEAD") {
			return new Response("Method not allowed", {
				status: 405,
				headers: { Allow: "GET, HEAD" },
			});
		}

		// This worker is deliberately a game-files proxy, never an open proxy.
		if (!url.pathname.startsWith("/games/") || url.pathname.includes("..")) {
			return new Response("Not found", { status: 404 });
		}

		const headers = new Headers();
		for (const name of ["Range", "If-None-Match", "If-Modified-Since"]) {
			const value = request.headers.get(name);
			if (value) headers.set(name, value);
		}

		try {
			const upstream = await fetch(`${GAME_ORIGIN}${url.pathname}${url.search}`, {
				method: request.method,
				headers,
			});
			const responseHeaders = new Headers(upstream.headers);
			const extension = url.pathname.split(".").pop()?.toLowerCase() ?? "";
			const mimeType = MIME_TYPES[extension];
			if (mimeType) responseHeaders.set("Content-Type", mimeType);
			responseHeaders.set("Cache-Control", upstream.ok ? "public, max-age=3600" : "no-store");
			responseHeaders.set("X-Content-Type-Options", "nosniff");
			responseHeaders.set("Cross-Origin-Resource-Policy", "same-origin");
			return new Response(upstream.body, {
				status: upstream.status,
				statusText: upstream.statusText,
				headers: responseHeaders,
			});
		} catch (error) {
			console.error("Game file proxy failed", url.pathname, error);
			return new Response("Game files are temporarily unavailable. Please reload.", {
				status: 502,
				headers: { "Cache-Control": "no-store" },
			});
		}
	},
} satisfies ExportedHandler;
