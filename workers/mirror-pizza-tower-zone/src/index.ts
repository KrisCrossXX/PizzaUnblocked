// site mirror — proxies the whole Pizza Unblocked tree to Bunny CDN.
// Any non-file path falls back to index.html so deep links work.
const ORIGIN = "https://pizza-tower-9iw.pages.dev";

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
	unx: "application/octet-stream",
	wasm: "application/wasm",
	wav: "audio/wav",
	webp: "image/webp",
	woff: "font/woff",
	woff2: "font/woff2",
	win: "application/octet-stream",
	pck: "application/octet-stream",
	part: "application/octet-stream",
};

async function upstream(pathname: string, search: string, request: Request): Promise<Response> {
	const headers = new Headers();
	for (const name of ["Range", "If-None-Match", "If-Modified-Since"]) {
		const v = request.headers.get(name);
		if (v) headers.set(name, v);
	}
	// game payloads go through the game proxy so this worker stays within
	// the per-request limits on the free plan.
	const host = ORIGIN;
	const res = await fetch(`${host}${pathname}${search}`, { method: request.method, headers });
	const rh = new Headers(res.headers);
	const ext = pathname.split(".").pop()?.toLowerCase() ?? "";
	if (MIME_TYPES[ext]) rh.set("Content-Type", MIME_TYPES[ext]);
	rh.set("Cache-Control", res.ok ? "public, max-age=3600" : "no-store");
	rh.set("X-Content-Type-Options", "nosniff");
	rh.delete("Content-Security-Policy");
	rh.delete("X-Frame-Options");
	rh.set("Cross-Origin-Opener-Policy", "same-origin");
	rh.set("Cross-Origin-Embedder-Policy", "credentialless");
	return new Response(res.body, { status: res.status, statusText: res.statusText, headers: rh });
}

export default {
	async fetch(request: Request): Promise<Response> {
		if (request.method !== "GET" && request.method !== "HEAD") {
			return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
		}
		const url = new URL(request.url);
		if (url.pathname.includes("..")) return new Response("Not found", { status: 404 });
		try {
			let res = await upstream(url.pathname, url.search, request);
			// SPA fallback: bare paths (no extension) get index.html
			if (res.status === 404 && !/\.[a-z0-9]+$/i.test(url.pathname)) {
				res = await upstream("/index.html", "", request);
			}
			return res;
		} catch (e) {
			console.error("mirror fetch failed", url.pathname, e);
			return new Response("mirror temporarily unavailable — reload to retry", {
				status: 502, headers: { "Cache-Control": "no-store" },
			});
		}
	},
} satisfies ExportedHandler;
