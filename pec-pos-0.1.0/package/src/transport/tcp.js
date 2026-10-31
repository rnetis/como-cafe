'use strict';
const net = require('node:net');

/** LAN transport (ConnectionType.LAN): plain TCP to the POS terminal. */
class TcpTransport {
  constructor({ ip, port, timeout = 30000 }) {
    this.ip = ip; this.port = port; this.timeout = timeout;
  }

  _connect() {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: this.ip, port: this.port });
      socket.setTimeout(this.timeout);
      socket.once('connect', () => { socket.setTimeout(0); resolve(socket); });
      socket.once('timeout', () => { socket.destroy(); reject(new Error(`Connection to ${this.ip}:${this.port} timed out`)); });
      socket.once('error', reject);
    });
  }

  /** True if the terminal accepts a TCP connection. */
  async test() {
    try { (await this._connect()).destroy(); return true; } catch { return false; }
  }

  /** Send one request, resolve with the full reply as decided by isComplete(). */
  async exchange(data, isComplete) {
    const socket = await this._connect();
    return new Promise((resolve, reject) => {
      let buf = Buffer.alloc(0);
      const timer = setTimeout(() => { socket.destroy(); reject(new Error('Timed out waiting for POS response')); }, this.timeout);
      const done = (fn, v) => { clearTimeout(timer); socket.destroy(); fn(v); };
      socket.on('data', (chunk) => {
        buf = Buffer.concat([buf, chunk]);
        if (isComplete(buf)) done(resolve, buf);
      });
      socket.once('error', (e) => done(reject, e));
      socket.once('close', () => (buf.length ? done(resolve, buf) : done(reject, new Error('Connection closed before response'))));
      socket.write(data);
    });
  }
}
module.exports = TcpTransport;
