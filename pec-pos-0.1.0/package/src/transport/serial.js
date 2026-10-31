'use strict';

/** Serial transport (ConnectionType.Serial). Needs the optional `serialport` package. */
class SerialTransport {
  constructor({ comPort, baudRate = 9600, timeout = 30000 }) {
    // baudRate is an assumption: the tester has no baud field, the DLL decides.
    this.comPort = comPort; this.baudRate = baudRate; this.timeout = timeout;
  }

  _open() {
    let SerialPort;
    try { ({ SerialPort } = require('serialport')); }
    catch { throw new Error('Serial mode needs the "serialport" package: npm i serialport'); }
    return new Promise((resolve, reject) => {
      const port = new SerialPort({ path: this.comPort, baudRate: this.baudRate, autoOpen: false });
      port.open((err) => (err ? reject(err) : resolve(port)));
    });
  }

  async test() {
    try { const p = await this._open(); await new Promise((r) => p.close(() => r())); return true; }
    catch { return false; }
  }

  async exchange(data, isComplete) {
    const port = await this._open();
    return new Promise((resolve, reject) => {
      let buf = Buffer.alloc(0);
      const timer = setTimeout(() => finish(reject, new Error('Timed out waiting for POS response')), this.timeout);
      const finish = (fn, v) => { clearTimeout(timer); port.close(() => fn(v)); };
      port.on('data', (chunk) => {
        buf = Buffer.concat([buf, chunk]);
        if (isComplete(buf)) finish(resolve, buf);
      });
      port.once('error', (e) => finish(reject, e));
      port.write(data);
    });
  }
}
module.exports = SerialTransport;
