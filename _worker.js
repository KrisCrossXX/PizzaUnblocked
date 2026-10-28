const GAME_ORIGIN = "https://cdn.jsdelivr.net/gh/KrisCrossXX";
const gameRepo = (n) => `${GAME_ORIGIN}/pizza-games-${n}@main`;

// jsDelivr serves .html as text/plain and unknown exts as octet-stream —
// extension wins for types browsers actually need
const MIME_FIX = { html: "text/html", mjs: "text/javascript", js: "text/javascript", wasm: "application/wasm", json: "application/json", css: "text/css", svg: "image/svg+xml", map: "application/json" };

function withSiteHeaders(response, pathname) {
	const headers = new Headers(response.headers);
	headers.delete("X-Frame-Options");
	headers.delete("Content-Security-Policy");
	headers.set("Cross-Origin-Opener-Policy", "same-origin");
	headers.set("Cross-Origin-Embedder-Policy", "credentialless");
	const ext = (pathname?.match(/\.([a-z0-9]{1,10})$/i) || [])[1]?.toLowerCase();
	if (MIME_FIX[ext]) {
		headers.set("content-type", MIME_FIX[ext]);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

async function getChunkEntry(env, url) {
	try {
		const manifestResponse = await env.ASSETS.fetch(new Request(new URL('/chunks.json', url.origin)));
		if (!manifestResponse.ok) return null;
		const manifest = await manifestResponse.json();
		const key = decodeURIComponent(url.pathname).replace(/^\/+/, '');
		return manifest[key] ? { key, info: manifest[key] } : null;
	} catch { return null; }
}

let gamesManifestPromise = null;
async function getGamesManifest(env, url) {
	try {
		gamesManifestPromise ??= env.ASSETS.fetch(new Request(new URL('/games-manifest.json', url.origin)))
			.then(r => r.ok ? r.json() : {});
		return await gamesManifestPromise;
	} catch {
		gamesManifestPromise = null;
		return {};
	}
}

// jsDelivr caches 403s from first-touch package indexing on fresh repos — purge+retry once
async function jdFetch(url, init) {
	let res = await fetch(url, init);
	if (res.status === 403) {
		await fetch(url.replace("cdn.jsdelivr.net", "purge.jsdelivr.net")).catch(() => {});
		res = await fetch(url, init);
	}
	return res;
}

// stitches <key>.part.NNN parts from jsDelivr — same layout as the git shards
function serveGameChunks(request, url, key, info) {
	const repo = gameRepo(info.r);
	const headers = new Headers({
		'Content-Type': info.m || 'application/octet-stream',
		'Content-Length': String(info.s),
		'Cache-Control': 'public, max-age=86400',
	});
	if (request.method === 'HEAD') return withSiteHeaders(new Response(null, { headers }), url.pathname);
	let partIndex = 0, reader = null;
	const stream = new ReadableStream({
		async pull(controller) {
			try {
				for (;;) {
					if (!reader) {
						if (partIndex >= info.p) { controller.close(); return; }
						const enc = key.split('/').map(encodeURIComponent).join('/');
						const partUrl = `${repo}/${enc}.part.${String(partIndex).padStart(3, '0')}`;
						const part = await jdFetch(partUrl, { cf: { cacheEverything: true } });
						if (!part.ok || !part.body) throw new Error('Missing chunk ' + partUrl);
						reader = part.body.getReader();
					}
					const item = await reader.read();
					if (item.done) { reader = null; partIndex++; continue; }
					controller.enqueue(item.value);
					return;
				}
			} catch (error) { controller.error(error); }
		},
		cancel() { reader?.cancel(); },
	});
	return withSiteHeaders(new Response(stream, { headers }), url.pathname);
}

async function serveChunkedAsset(request, env, url, key, info) {
	const headers = new Headers({
		'Content-Type': info.mime || 'application/octet-stream',
		'Content-Length': String(info.size),
		'Cache-Control': 'public, max-age=86400',
	});
	if (request.method === 'HEAD') return withSiteHeaders(new Response(null, { headers }), url.pathname);
	let partIndex = 0, reader = null;
	const stream = new ReadableStream({
		async pull(controller) {
			try {
				for (;;) {
					if (!reader) {
						if (partIndex >= info.parts) { controller.close(); return; }
						const name = key + '.part.' + String(partIndex).padStart(3, '0');
						const partUrl = new URL('/' + name.split('/').map(encodeURIComponent).join('/'), url.origin);
						const part = await env.ASSETS.fetch(new Request(partUrl));
						if (!part.ok || !part.body) throw new Error('Missing chunk ' + name);
						reader = part.body.getReader();
					}
					const item = await reader.read();
					if (item.done) { reader = null; partIndex++; continue; }
					controller.enqueue(item.value);
					return;
				}
			} catch (error) { controller.error(error); }
		},
		cancel() { reader?.cancel(); },
	});
	return withSiteHeaders(new Response(stream, { headers }), url.pathname);
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname === "/api/beta-testers") {
			// Configure DISCORD_BOT_TOKEN as a secret plus DISCORD_GUILD_ID and
			// DISCORD_BETA_ROLE_ID as vars; the bot needs Discord's Server Members intent.
			if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
			if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_GUILD_ID || !env.DISCORD_BETA_ROLE_ID) {
				return Response.json({ error: "Discord beta role is not configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
			}
			const cache = caches.default;
			const cacheKey = new Request(new URL("/api/beta-testers", url.origin));
			const cached = await cache.match(cacheKey);
			if (cached) return cached;
			const members = [];
			let after = "";
			for (let page = 0; page < 100; page++) {
				const endpoint = new URL(`https://discord.com/api/v10/guilds/${encodeURIComponent(env.DISCORD_GUILD_ID)}/members`);
				endpoint.searchParams.set("limit", "1000");
				if (after) endpoint.searchParams.set("after", after);
				const response = await fetch(endpoint, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
				if (!response.ok) return Response.json({ error: "Could not load Discord beta testers" }, { status: 502, headers: { "Cache-Control": "no-store" } });
				const batch = await response.json();
				if (!Array.isArray(batch)) return Response.json({ error: "Discord returned an invalid member list" }, { status: 502 });
				for (const member of batch) {
					if (!member.roles?.includes(env.DISCORD_BETA_ROLE_ID) || !member.user) continue;
					const user = member.user;
					const avatar = user.avatar
						? `https://cdn.discordapp.com/avatars/${encodeURIComponent(user.id)}/${encodeURIComponent(user.avatar)}.webp?size=128`
						: `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;
					members.push({ name: member.nick || user.global_name || user.username, avatar });
				}
				if (batch.length < 1000) break;
				after = batch[batch.length - 1]?.user?.id || "";
				if (!after) break;
			}
			const result = Response.json({ members }, { headers: { "Cache-Control": "public, max-age=600" } });
			await cache.put(cacheKey, result.clone());
			return result;
		}
		if (request.method !== "GET" && request.method !== "HEAD") {
			return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
		}
		if (url.pathname.includes("..")) return new Response("Not found", { status: 404 });

		if (url.pathname.startsWith("/games/")) {
			const manifest = await getGamesManifest(env, url);
			let key = decodeURIComponent(url.pathname).replace(/^\/+/, '');
			let info = manifest[key];
			// launch URLs are bare dirs (games/elm/) — resolve to index.html
			if (!info && (key.endsWith('/') || !/\.[a-z0-9]{1,10}$/i.test(key))) {
				const dirKey = key.replace(/\/?$/, '/index.html');
				if (manifest[dirKey]) { key = dirKey; info = manifest[dirKey]; }
			}
			if (!info) return new Response("Not found", { status: 404 });
			if (info.p) return serveGameChunks(request, url, key, info);
			const headers = new Headers();
			for (const name of ["Range", "If-None-Match", "If-Modified-Since"]) {
				const value = request.headers.get(name);
				if (value) headers.set(name, value);
			}
			const upstream = await jdFetch(`${gameRepo(info.r)}/${key.split('/').map(encodeURIComponent).join('/')}${url.search}`, {
				method: request.method,
				headers,
				cf: { cacheEverything: true },
			});
			return withSiteHeaders(upstream, key);
		}

		const chunked = await getChunkEntry(env, url);
		if (chunked) return serveChunkedAsset(request, env, url, chunked.key, chunked.info);
		return withSiteHeaders(await env.ASSETS.fetch(request), url.pathname);
	},
};
