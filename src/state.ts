/**
 * Shared runtime state between the bot and the web dashboard.
 * Tracks connect/disconnect events so the dashboard can show
 * how long the bot has been online (current session + total).
 */
import FS from 'node:fs';
import PATH from 'node:path';

const DATA_FILE = PATH.resolve(process.cwd(), process.env.DATA_DIR || ".data", "uptime.json");

export type Stats = {
	/** the most recent login (ms epoch), null while offline */
	thisSessionStart: number | null,
	/** accumulated online ms across sessions since the process started (only counted for THIS process run) */
	totalOnlineThisRun: number,
	/** how many times the bot successfully logged in during this process run */
	logins: number,
	/** how many times the bot was disconnected/reconnected */
	reconnects: number,
	/** how much time in ms this process has been running monotonic-ish */
	processStartedAt: number,
	/** accumulated minutes persisted from previous runs (approximate) */
	totalOnlineFromPastRunsMs: number,
	lastLoginAt: number | null,
	lastLogoutAt: number | null,
	status: "connecting" | "online" | "offline",
};

const stats: Stats = {
	thisSessionStart: null,
	totalOnlineThisRun: 0,
	logins: 0,
	reconnects: 0,
	processStartedAt: Date.now(),
	totalOnlineFromPastRunsMs: 0,
	lastLoginAt: null,
	lastLogoutAt: null,
	status: "connecting"
};

/* ---- optional persistence between restarts ---- */
const load = (): void => {
	try {
		if (FS.existsSync(DATA_FILE)) {
			const raw = JSON.parse(FS.readFileSync(DATA_FILE, "utf8"));
			stats.totalOnlineFromPastRunsMs = +raw.totalOnlineFromPastRunsMs || 0;
		}
	} catch {
		/* ignore unreadable data; start fresh */
	}
};
const save = (): void => {
	try {
		FS.mkdirSync(PATH.dirname(DATA_FILE), { recursive: true });
		FS.writeFileSync(DATA_FILE, JSON.stringify({
			totalOnlineFromPastRunsMs: stats.totalOnlineFromPastRunsMs
		}, null, "\t"));
	} catch {
		/* read-only filesystem (e.g. some hosts); keep in memory */
	}
};
load();

/** called when the bot successfully joins the server */
export const onLogin = (): void => {
	stats.thisSessionStart = Date.now();
	stats.lastLoginAt = Date.now();
	stats.logins++;
	stats.status = "online";
};

/** called when the bot disconnects; folds the session into the totals */
export const onLogout = (): void => {
	if (stats.thisSessionStart) {
		stats.totalOnlineThisRun += Date.now() - stats.thisSessionStart;
		// persist in ~1 minute buckets so frequent reconnects don't thrash disk
		stats.totalOnlineFromPastRunsMs = Math.round((stats.totalOnlineFromPastRunsMs + stats.totalOnlineThisRun) / 60000) * 60000;
		save();
		stats.totalOnlineThisRun = 0;
	}
	stats.thisSessionStart = null;
	stats.lastLogoutAt = Date.now();
	stats.status = "offline";
};

export const setStatus = (s: Stats["status"]): void => {
	if (!stats.thisSessionStart) stats.status = s;
};

export const markReconnect = (): void => {
	stats.reconnects++;
};

export const getStats = (): Stats => {
	const onlineNow = stats.thisSessionStart
		? stats.totalOnlineThisRun + Date.now() - stats.thisSessionStart
		: stats.totalOnlineThisRun;
	return {
		...stats,
		totalOnlineNowMs: stats.totalOnlineFromPastRunsMs + onlineNow,
		processUptimeMs: Date.now() - stats.processStartedAt
	} as any;
};
