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
