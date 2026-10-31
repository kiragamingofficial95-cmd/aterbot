// scripts/patch-mineflayer.js
// Patch mineflayer's physics.js to delay the first teleport response.
// Paper 1.21.x (protocol 775) rejects an immediate position_look reply
// with "multiplayer.disconnect.invalid_player_movement", even when idle.
// Delaying the reply by 1.5s (the same trick mineflayer uses after respawn)
// avoids the kick. Runs as a postinstall step so CI installs stay patched.
const FS = require('node:fs');
const PATH = require('node:path');

const target = PATH.join(__dirname, '..', 'node_modules', 'mineflayer', 'lib', 'plugins', 'physics.js');
if (!FS.existsSync(target)) {
	console.log('[patch-mineflayer] physics.js not found, skipping');
	process.exit(0);
}
let src = FS.readFileSync(target, 'utf8');
const original = "    if (respawnTimer > 0 && Date.now() - respawnTimer < 2000) {\n      respawnTimer = 0 // only delay once\n";
const patched = "    if (true) { // patched: always delay teleport response to avoid Paper invalid_player_movement kicks\n      respawnTimer = 0 // only delay once\n";
if (src.includes(patched)) {
	console.log('[patch-mineflayer] already patched');
	process.exit(0);
}
if (!src.includes(original)) {
	console.log('[patch-mineflayer] target snippet not found (mineflayer version changed?), skipping');
	process.exit(0);
}
FS.writeFileSync(target, src.replace(original, patched));
console.log('[patch-mineflayer] patched physics.js');
