'use strict';
/**
 * A codec turns the PCPOS fields into a wire request and a raw reply into a
 * parsed response. In the original tester this logic lives inside PCPOSDLL.dll
 * (PCPOS.Request / Response.GetParsedResp), which was NOT part of the upload,
 * so it is deliberately not guessed here.
 *
 * Interface:
 *   encode(fields)  -> string | Buffer      fields = { amount, currency, ... }
 *   isComplete(buf) -> boolean              true once a full reply has arrived
 *   decode(raw)     -> string               human-readable parsed response
 */
class ProtocolNotImplementedError extends Error {
  constructor() {
    super(
      'PEC wire protocol is not implemented: it lives in PCPOSDLL.dll, which was not provided. ' +
      'Pass your own codec: new PCPOS({ codec }).'
    );
    this.name = 'ProtocolNotImplementedError';
  }
}

const placeholderCodec = {
  encode() { throw new ProtocolNotImplementedError(); },
  isComplete() { throw new ProtocolNotImplementedError(); },
  decode() { throw new ProtocolNotImplementedError(); },
};

module.exports = { placeholderCodec, ProtocolNotImplementedError };
