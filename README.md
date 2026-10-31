# AterBot ✨ (indomc-lifesteal edition)
Based on [JadeMin/aterbot](https://github.com/JadeMin/aterbot). Keeps your Minecraft server alive 24/7 with an AFK bot — configured here for **indomc-lifesteal.play.hosting**, deploying on **Railway** or **Render**, with a live **uptime dashboard**.

<br/>

# What's inside 🔧
1. The bot connects and performs random movements so you don't get kicked for AFK.
2. `src/web.ts` serves an **uptime dashboard** on the deployed port — shows how long the bot has been online (this session + total), logins, reconnects and process uptime.
3. Connection details can be set through `config.json` or overriden with environment variables for hosting platforms.

<br/>

# Configuration ⚙
Set these in `config.json` (host/port/username/version), or override per-platform:

| Variable       | Purpose                                |
|----------------|----------------------------------------|
| `MC_HOST`      | server address                          |
| `MC_PORT`      | server port                             |
| `MC_USERNAME`  | username the bot joins with             |
| `MC_VERSION`   | `auto` (default) or e.g. `1.21.4`       |

Your server must have **`online-mode: false`** and the whitelist off for the bot to join, and it's recommended to OP the bot and give it creative mode in a sealed room to prevent falls/deaths.

<br/>

# Deploy on Render 🚀
1. Fork/push this repo to your GitHub.
2. In [render.com](https://dashboard.render.com) (or via the Render CLI) create a **Web Service** from the repo. `render.yaml` already defines the type, start command and `MC_*` variables — just click through.
3. Render injects `PORT` automatically, so the dashboard comes up on your service URL.

# Deploy on Railway 🚄
1. Push this repo to GitHub, then create a new project on [Railway](https://railway.app) from that repo — `railway.json` defines the build (`NIXPACKS`) and start command.
2. Add `MC_HOST` / `MC_PORT` / `MC_USERNAME` as Variables (already matching this repo, only the username may need changing).

<br/>

# The Dashboard 🖥
Open the deployed URL (or `http://localhost:5500` locally) and you'll see:

- **Session status** (online / offline / connecting) with a live pulsing dot
- **Time online — this session** (ticking every second)
- **Time online — total** (persisted across reconnects to `.data/uptime.json`)
- **Process running for**, logins, reconnect/drop counts, last login/logout

JSON endpoint: `/api/stats` — handy for external monitors (UptimeRobot, etc.).

<br/>

# FAQ ❓
> #### The bot can't connect (ETIMEDOUT / ECONNREFUSED)
> Free hosts like Play Hosting auto-stop idle servers; the bot retries every `retryDelay` ms until the server accepts connections again. Also check that the port shown in your host's Network tab matches `MC_PORT`/`config.json`.

> #### Unsupported/unknown protocol version error
> Set `MC_VERSION` to your server's exact version, or update the `mineflayer` dependency.

> #### `Invalid move player packet received`
> The bot escaped its room and needs its playerdata wiped (`world/playerdata/<UUID>.dat`) on your host, then keep it sealed in a room.

<br/>

# CAUTION ⚠
Free hosting services may terminate free servers that appear "always-on" via bots. You are responsible for what this causes — this edition is for learning/testing fun.
