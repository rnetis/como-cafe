# pec-pos

Node.js port of the **PEC PC-POS tester** (`PEC_Tester_2022.exe`): same fields, same LAN/serial flow, plus a CLI.

> **Status:** the API surface, LAN (TCP) and serial transports, events, CLI and tests are done.
> The **wire protocol is not**: it lives in `PCPOSDLL.dll`, which was not available. Until a codec is supplied,
> `sendTransaction()` throws `ProtocolNotImplementedError` rather than guessing.

```js
const { PCPOS, ConnectionType } = require('pec-pos');

const pos = new PCPOS({ ip: '192.168.1.10', port: 1362, amount: '1000', codec /* from PCPOSDLL port */ });
pos.on('response', (raw, parsed) => console.log(raw, parsed));

if (await pos.testConnection()) {
  const { raw, parsed } = await pos.sendTransaction();
  console.log(pos.request);
}
```

Serial: `new PCPOS({ connectionType: ConnectionType.Serial, comPort: 'COM3', baudRate: 9600 })` and `npm i serialport`
(baud rate is an assumption; the tester has no such field).

CLI: `pec-pos test --lan 192.168.1.10:1362` · `pec-pos send --lan ip:port --amount 1000 --params --currency 364`

Codec interface: `encode(fields) -> string|Buffer`, `isComplete(buf) -> boolean`, `decode(raw) -> string`. See `DECOMPILED.md`.
