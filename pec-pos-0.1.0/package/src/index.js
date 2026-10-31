'use strict';
const { EventEmitter } = require('node:events');
const TcpTransport = require('./transport/tcp');
const SerialTransport = require('./transport/serial');
const { placeholderCodec, ProtocolNotImplementedError } = require('./codec');
const TESTER_DEFAULTS = require('./defaults');

/** Mirrors PCPOSDLL's ConnectionType enum as used by the tester: 0 = LAN, 1 = Serial. */
const ConnectionType = Object.freeze({ LAN: 0, Serial: 1 });

// Fields the tester only sets when "Additional Parameters" is ticked.
const EXTRA_FIELDS = ['currency', 'prCode', 'r1Holder', 'r2Merchant', 't1Holder', 't2Merchant', 'serviceGroup', 'settel', 'keyValue'];

/**
 * Node port of the PCPOS class used by PEC_Tester_2022 (PCPOSTest.MainForm).
 *
 * Original member -> this class
 *   Amount, Currency, PrCode, R1Holder, R2Merchant, T1Holder, T2Merchant,
 *   ServiceGroup, Settel, KeyValue      -> same names, camelCased
 *   ConnectionType, Ip, Port, ComPort   -> connectionType, ip, port, comPort
 *   send_transaction() + GetResponse    -> sendTransaction() (Promise) + 'response' event
 *   Request / Response.GetParsedResp    -> request / lastParsed
 *   TestConnection()                    -> testConnection() (Promise<boolean>)
 */
class PCPOS extends EventEmitter {
  constructor(opts = {}) {
    super();
    const { codec = placeholderCodec, timeout = 30000, baudRate = 9600, ...fields } = opts;
    this.codec = codec; this.timeout = timeout; this.baudRate = baudRate;
    this.connectionType = ConnectionType.LAN;
    this.ip = undefined; this.port = undefined; this.comPort = undefined;
    this.amount = undefined;
    for (const f of EXTRA_FIELDS) this[f] = undefined;
    Object.assign(this, fields);
    this.request = ''; this.rawResponse = ''; this.lastParsed = '';
  }

  // The original property is spelled "Settel"; expose the correct spelling too.
  get settlement() { return this.settel; }
  set settlement(v) { this.settel = v; }

  _transport() {
    if (this.connectionType === ConnectionType.LAN) {
      if (!this.ip || !this.port) throw new Error('ip and port are required for LAN');
      return new TcpTransport({ ip: this.ip, port: Number(this.port), timeout: this.timeout });
    }
    if (!this.comPort) throw new Error('comPort is required for serial');
    return new SerialTransport({ comPort: this.comPort, baudRate: this.baudRate, timeout: this.timeout });
  }

  _fields() {
    const out = { amount: this.amount };
    for (const f of EXTRA_FIELDS) if (this[f] !== undefined) out[f] = this[f];
    return out;
  }

  /** Resolves true when the terminal can be reached (TCP connect / serial open). */
  async testConnection() { return this._transport().test(); }

  /** Send the transaction. Emits 'response'(raw) and resolves { raw, parsed }. */
  async sendTransaction() {
    if (this.amount === undefined || this.amount === '') throw new Error('amount is required');
    const req = this.codec.encode(this._fields());
    this.request = Buffer.isBuffer(req) ? req.toString('latin1') : String(req);
    const buf = await this._transport().exchange(Buffer.from(req), (b) => this.codec.isComplete(b));
    this.rawResponse = buf.toString('latin1');
    this.lastParsed = this.codec.decode(this.rawResponse);
    this.emit('response', this.rawResponse, this.lastParsed);
    return { raw: this.rawResponse, parsed: this.lastParsed };
  }
}
PCPOS.prototype.send_transaction = PCPOS.prototype.sendTransaction;
PCPOS.prototype.TestConnection = PCPOS.prototype.testConnection;

module.exports = { PCPOS, ConnectionType, TESTER_DEFAULTS, ProtocolNotImplementedError, EXTRA_FIELDS };
