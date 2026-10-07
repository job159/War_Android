// Live smoke test of the online room layer against the real public MQTT brokers (Node 22+).
//   node tools/net-test.mjs
import { createRoom, joinRoom, BROKERS } from '../game/src/net/room.js';

const VERSION = 'test-1';
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);

const host = await createRoom({ version: VERSION, name: 'Host', onStatus: (s) => log('host:', s) });
log('room code', host.code, 'on', host.broker);
const got = [];
host.on('message', (m) => got.push(m));
const guest = await joinRoom(host.code, { version: VERSION, name: 'Guest', onStatus: (s) => log('guest:', s) });
log('guest joined; peer =', guest.peer && guest.peer.name);
const gotG = [];
guest.on('message', (m) => gotG.push(m));
for (let i = 0; i < 20; i++) guest.send('in', { cmd: { type: 'answer', ok: true, i } });
for (let i = 0; i < 10; i++) host.send('ev', { list: [{ id: i, k: 'dmg', v: i * 10 }] });
host.send('snap', { t: 1 }, { reliable: false });
await new Promise((r) => setTimeout(r, 4000));
const inOrder = got.filter((m) => m.type === 'in').map((m) => m.data.cmd.i);
log('host received', inOrder.length, 'inputs, in order:', inOrder.every((v, i) => v === i));
log('guest received', gotG.filter((m) => m.type === 'ev').length, 'event batches,', gotG.filter((m) => m.type === 'snap').length, 'snapshots; rtt', guest.rtt, 'ms');
await guest.close();
await host.close();
log('done; brokers:', BROKERS.join(', '));
process.exit(inOrder.length === 20 ? 0 : 1);
