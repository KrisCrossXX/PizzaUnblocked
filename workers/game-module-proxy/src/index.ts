const GAME_ORIGIN = "https://pizza-tower-9iw.pages.dev";

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

const ITCH_ORIGIN = "https://html-classic.itch.zone";

// Category URLs are the public links; keep each game payload in its own
// /games/<slug>/ directory on the static origin.
const CATEGORY_GAMES: Record<string, string> = {
	"/mods/cheesypizza": "cheesypizza",
	"/mods/cheesychasedown": "cheesychasedown",
	"/mods/laphell": "laphell",
	"/extras/toadlegette": "toadlegette",
	"/extras/beeders": "beeders",
	"/extras/ihv": "ihv",
};

const SHARED_GAME_SCRIPTS = new Set([
	"/js/bsaudio.js",
	"/js/crashlog.js",
	"/js/gamepad.js",
	"/js/gsaves.js",
	"/js/panic.js",
	"/js/saves.js",
	"/js/touch.js",
]);

function gameOriginPath(pathname: string): string | null {
	if (pathname.startsWith("/games/")) return pathname;
	if (SHARED_GAME_SCRIPTS.has(pathname)) return pathname;
	for (const [prefix, slug] of Object.entries(CATEGORY_GAMES)) {
		if (pathname === prefix || pathname.startsWith(prefix + "/")) {
			const suffix = pathname.slice(prefix.length);
			return `/games/${slug}${suffix}`;
		}
	}
	return null;
}

// itch.io injects static.itch.io/htmlgame.js into every HTML5 game page; it
// reads ancestorOrigins/referrer and redirects non-itch parents to the
// embed-hotlink wall. Strip it plus any inline hotlink/beacon scripts so the
// games actually run when embedded here.
function stripItchHotlink(html: string): string {
	return html
		.replace(/<script[^>]*src=["'][^"']*htmlgame\.js[^"']*["'][^>]*>\s*<\/script>/gi, "")
		.replace(/<script[^>]*>(?:(?!<\/script>)[\s\S])*?(?:embed-hotlink|html-callback|sendBeacon)(?:(?!<\/script>)[\s\S])*?<\/script>/gi, "");
}

async function proxyItch(request: Request, url: URL): Promise<Response> {
	// /itch/<id>/<path> and /html/<id>/<path> both map onto itch's /html/ tree
	// so absolute-path asset references keep working same-origin.
	const upstreamPath = url.pathname.startsWith("/itch/")
		? "/html/" + url.pathname.slice(6)
		: url.pathname;
	const headers = new Headers();
	for (const name of ["Range", "If-None-Match", "If-Modified-Since"]) {
		const value = request.headers.get(name);
		if (value) headers.set(name, value);
	}
	const upstream = await fetch(`${ITCH_ORIGIN}${upstreamPath}${url.search}`, {
		method: request.method,
		headers: { ...Object.fromEntries(headers), "User-Agent": "Mozilla/5.0" },
		redirect: "follow",
	});
	const contentType = upstream.headers.get("Content-Type") ?? "";
	const responseHeaders = new Headers();
	for (const name of ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges", "ETag", "Last-Modified"]) {
		const value = upstream.headers.get(name);
		if (value) responseHeaders.set(name, value);
	}
	const extension = url.pathname.split(".").pop()?.toLowerCase() ?? "";
	const mimeType = MIME_TYPES[extension];
	if (mimeType) responseHeaders.set("Content-Type", mimeType);
	responseHeaders.set(
		"Cache-Control",
		upstream.ok ? (contentType.includes("text/html") ? "no-store" : "public, max-age=86400") : "no-store",
	);
	responseHeaders.set("X-Content-Type-Options", "nosniff");
	responseHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
	responseHeaders.set("Access-Control-Allow-Origin", "*");
	// credentialless COEP + COOP lets the framed page become crossOriginIsolated
	// (Godot/SAB games) when the top page sends matching headers.
	responseHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
	responseHeaders.set("Cross-Origin-Embedder-Policy", "credentialless");
	if (upstream.ok && contentType.includes("text/html") && request.method === "GET") {
		const html = stripItchHotlink(await upstream.text());
		responseHeaders.delete("Content-Length");
		return new Response(html, { status: upstream.status, headers: responseHeaders });
	}
	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: responseHeaders,
	});
}

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		if (request.method !== "GET" && request.method !== "HEAD") {
			return new Response("Method not allowed", {
				status: 405,
				headers: { Allow: "GET, HEAD" },
			});
		}
		if (url.pathname.includes("..")) {
			return new Response("Not found", { status: 404 });
		}

		// This worker is deliberately a game-files proxy, never an open proxy.
		if (url.pathname.startsWith("/itch/") || url.pathname.startsWith("/html/")) {
			try {
				return await proxyItch(request, url);
			} catch (error) {
				console.error("Itch proxy failed", url.pathname, error);
				return new Response("Game temporarily unavailable. Please reload.", {
					status: 502,
					headers: { "Cache-Control": "no-store" },
				});
			}
		}
		const upstreamPath = gameOriginPath(url.pathname);
		if (!upstreamPath) {
			return new Response("Not found", { status: 404 });
		}

		const headers = new Headers();
		for (const name of ["Range", "If-None-Match", "If-Modified-Since"]) {
			const value = request.headers.get(name);
			if (value) headers.set(name, value);
		}

		try {
			const upstream = await fetch(`${GAME_ORIGIN}${upstreamPath}${url.search}`, {
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
