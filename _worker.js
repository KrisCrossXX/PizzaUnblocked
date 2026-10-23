const GAME_ORIGIN = "https://pizzaunblocked.b-cdn.net";

function withSiteHeaders(response) {
	const headers = new Headers(response.headers);
	headers.delete("X-Frame-Options");
	headers.delete("Content-Security-Policy");
	headers.set("Cross-Origin-Opener-Policy", "same-origin");
	headers.set("Cross-Origin-Embedder-Policy", "credentialless");
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (request.method !== "GET" && request.method !== "HEAD") {
			return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
		}
		if (url.pathname.includes("..")) return new Response("Not found", { status: 404 });

		if (url.pathname.startsWith("/games/")) {
			const headers = new Headers();
			for (const name of ["Range", "If-None-Match", "If-Modified-Since"]) {
				const value = request.headers.get(name);
				if (value) headers.set(name, value);
			}
			const upstream = await fetch(`${GAME_ORIGIN}${url.pathname}${url.search}`, {
				method: request.method,
				headers,
			});
			return withSiteHeaders(upstream);
		}

		return withSiteHeaders(await env.ASSETS.fetch(request));
	},
};
