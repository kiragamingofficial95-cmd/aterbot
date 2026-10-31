import HTTP from 'node:http';
import { getStats } from "./state.ts";
import CONFIG from "../config.json" assert {type: 'json'};

const PORT = +(process.env.PORT || 5500);

const fmt = (ms: number): string => {
	if (!ms || ms < 0) return "0s";
	const s = Math.floor(ms / 1000),
		d = Math.floor(s / 86400),
		h = Math.floor(s % 86400 / 3600),
		m = Math.floor(s % 3600 / 60),
		sec = s % 60;
	return (d? `${d}d `: "") + (h? `${h}h `: "") + (m? `${m}m `: "") + `${sec}s`;
};

const JSON_HEADERS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } as const;

const dashboard = (stats: any): string => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${CONFIG.client.username} — Uptime Dashboard</title>
<style>
	:root { color-scheme: dark; --bg:#0f1117; --card:#171b26; --text:#e6e9f0; --dim:#8b93a7; --accent:#4f8cff; --online:#2ea86b; --offline:#e05656; }
	* { box-sizing: border-box; }
	body { margin:0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background:var(--bg); color:var(--text); display:flex; justify-content:center; padding:24px; }
	.wrap { width:100%; max-width:560px; }
	h1 { font-size:20px; margin:0 0 4px; }
	.sub { color:var(--dim); font-size:13px; margin-bottom:20px; }
	.card { background:var(--card); border:1px solid #232936; border-radius:14px; padding:20px; margin-bottom:14px; }
	.big { font-size:34px; font-weight:700; font-variant-numeric: tabular-nums; letter-spacing:.5px; }
	.label { color:var(--dim); font-size:12px; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
	.grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
	.badge { display:inline-flex; align-items:center; gap:7px; font-size:13px; font-weight:600; padding:5px 12px; border-radius:999px; }
	.badge::before { content:""; width:8px; height:8px; border-radius:50%; background:var(--b); box-shadow:0 0 8px var(--b); }
	.online { --b:var(--online); background:#123527; color:#7fe0ae; }
	.offline { --b:var(--offline); background:#392026; color:#ff9b9b; }
	.connecting { --b:#f0b429; background:#3a3012; color:#ffd57a; }
	.kv { display:flex; justify-content:space-between; font-size:13.5px; padding:7px 0; border-bottom:1px solid #232936; }
	.kv:last-child { border-bottom:0; }
	.kv span:first-child { color:var(--dim); }
	a.powered { color:var(--dim); font-size:11px; text-decoration:none; }
</style>
</head>
<body>
<div class="wrap">
	<h1>AterBot Dashboard</h1>
	<div class="sub">AFK bot for <span id="server">${CONFIG.client.host}${CONFIG.client.port ? ":" + CONFIG.client.port : ""}</span></div>

	<div class="card" style="text-align:center">
		<div class="label">Session status</div>
		<div id="badge" class="badge offline">…</div>
		<div class="label" style="margin-top:18px">Time online — this session</div>
		<div class="big" id="session">…</div>
	</div>

	<div class="grid">
		<div class="card">
			<div class="label">Time online — total</div>
			<div class="big" id="total" style="font-size:22px">…</div>
		</div>
		<div class="card">
			<div class="label">Process running for</div>
			<div class="big" id="proc" style="font-size:22px">…</div>
		</div>
	</div>

	<div class="card">
		<div class="kv"><span>Bot username</span><span>${CONFIG.client.username}</span></div>
		<div class="kv"><span>Successful logins (this run)</span><span id="logins">0</span></div>
		<div class="kv"><span>Reconnects / drops (this run)</span><span id="reconnects">0</span></div>
		<div class="kv"><span>Last login</span><span id="lastLogin">—</span></div>
		<div class="kv"><span>Last logout</span><span id="lastLogout">—</span></div>
	</div>
</div>
<script>
	const tick = async () => {
		try {
			const s = await (await fetch("/api/stats")).json();
			const badge = document.getElementById("badge");
			badge.className = "badge " + s.status;
			badge.textContent = s.status.toUpperCase();
			const fmt = ms => {
				if (!ms || ms < 0) return "0s";
				const sec = Math.floor(ms/1000), d=Math.floor(sec/86400), h=Math.floor(sec%86400/3600), m=Math.floor(sec%3600/60), s2=sec%60;
				return (d?d+"d ":"")+(h?h+"h ":"")+(m?m+"m ":"")+s2+"s";
			};
			document.getElementById("session").textContent = fmt(s.sessionOnlineMs);
			document.getElementById("total").textContent = fmt(s.totalOnlineMs);
			document.getElementById("proc").textContent = fmt(s.processUptimeMs);
			document.getElementById("logins").textContent = s.logins;
			document.getElementById("reconnects").textContent = s.reconnects;
			document.getElementById("lastLogin").textContent = s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleTimeString() : "—";
			document.getElementById("lastLogout").textContent = s.lastLogoutAt ? new Date(s.lastLogoutAt).toLocaleTimeString() : "—";
		} catch {}
		setTimeout(tick, 1000);
	};
	tick();
</script>
</body>
</html>`;

const server = HTTP.createServer((request, response) => {
	const url = (request.url || "/").split("?")[0];

	if (url === "/api/stats") {
		const raw = getStats() as any;
		// session-specific figures for the live timer
		const sessionOnlineMs = raw.thisSessionStart ? Date.now() - raw.thisSessionStart : 0;
		response.writeHead(200, JSON_HEADERS);
		response.end(JSON.stringify({
			status: raw.status,
			sessionOnlineMs,
			totalOnlineMs: raw.totalOnlineNowMs ?? raw.totalOnlineFromPastRunsMs + sessionOnlineMs,
			processUptimeMs: raw.processUptimeMs,
			logins: raw.logins,
			reconnects: raw.reconnects,
			lastLoginAt: raw.lastLoginAt,
			lastLogoutAt: raw.lastLogoutAt
		}));
		return;
	}

	response.writeHead(200, {
		"Content-Type": "text/html",
		"Cache-Control": "no-store"
	} as const);
	response.end(dashboard(getStats()));
});



export default (): void => {
	server.listen(PORT, () => console.log(`Dashboard ready on http://localhost:${PORT}`));
};
