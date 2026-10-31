import initBot from "./bot.ts";
import initWeb from "./web.ts";

initBot();
initWeb();

// Graceful quit (GitHub Actions timeout sends SIGTERM) — drop the MC connection cleanly
for (const signal of ["SIGTERM", "SIGINT"] as const) {
	process.on(signal, () => {
		console.log(`Received ${signal} — disconnecting AFKBot...`);
		process.exit(0);
	});
}
