#!/usr/bin/env node
'use strict';
// CLI equivalent of the PEC tester window.
//   pec-pos test --lan 192.168.1.10:1362
//   pec-pos send --lan 192.168.1.10:1362 --amount 1000 --params --currency 364 --prcode 000000
//   pec-pos send --serial COM3 --amount 1000
const { PCPOS, ConnectionType, TESTER_DEFAULTS } = require('../src');

const a = process.argv.slice(2);
const cmd = a.shift();
const flag = (n) => {
  const i = a.indexOf(`--${n}`);
  if (i < 0) return undefined;
  const next = a[i + 1];
  return next === undefined || next.startsWith('--') ? true : next;
};

const pos = new PCPOS({ timeout: Number(flag('timeout') || 30000) });
const lan = flag('lan'), serial = flag('serial');
if (lan) {
  const [ip, port] = String(lan).split(':');
  Object.assign(pos, { connectionType: ConnectionType.LAN, ip, port: Number(port || TESTER_DEFAULTS.port) });
} else if (serial) {
  Object.assign(pos, { connectionType: ConnectionType.Serial, comPort: String(serial) });
} else {
  console.error('Specify --lan ip:port or --serial COMx'); process.exit(2);
}

(async () => {
  if (cmd === 'test') {
    const ok = await pos.testConnection();
    console.log(ok ? 'Connection is successful' : 'No Connection');
    process.exit(ok ? 0 : 1);
  }
  if (cmd === 'send') {
    pos.amount = String(flag('amount') || TESTER_DEFAULTS.amount);
    if (flag('params')) {
      pos.currency = String(flag('currency') || TESTER_DEFAULTS.currency);
      pos.prCode = String(flag('prcode') || TESTER_DEFAULTS.prCode);
      const map = [['r1Holder', 'r1'], ['r2Merchant', 'r2'], ['t1Holder', 't1'], ['t2Merchant', 't2'],
                   ['serviceGroup', 'sg'], ['settel', 'settlement'], ['keyValue', 'kv']];
      for (const [field, key] of map) { const v = flag(key); if (v !== undefined) pos[field] = String(v); }
    }
    const { raw, parsed } = await pos.sendTransaction();
    console.log('Raw Request :', pos.request, '\nRaw Response:', raw, '\nResponse    :', parsed);
    return;
  }
  console.error('Usage: pec-pos <test|send> (--lan ip:port | --serial COMx) [--amount N] [--params ...]');
  process.exit(2);
})().catch((e) => { console.error(e.message); process.exit(1); });
