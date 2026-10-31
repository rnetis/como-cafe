/**
 * PEC POS reply framing.
 *
 * The PEC wire format prefixes a message with four ASCII decimal digits holding
 * the length of **everything that follows the prefix** — the `RQ…` body only,
 * not the whole frame. `pec-pcpos` builds replies that way
 * (`const totalLen = body.length; const prefix = padNum(totalLen, 4)` in
 * `message.ts`) and the reference reader walks them that way
 * (`transports/stream.ts`: read four prefix bytes, then `expectedLen` body
 * bytes). So a full reply is `4 + declared` bytes: treating the prefix as the
 * total frame length stops four bytes early and hands the parser a truncated
 * reply (empty response code / serial number).
 *
 * A reply that does not start with four digits, or that declares a zero /
 * non-numeric length, is not framed at all: it is taken as-is rather than
 * waited on, so a terminal that answers in plain text cannot hang the register
 * for the whole timeout.
 */

/** Width of the ASCII decimal length prefix. */
const PEC_PREFIX_LEN = 4;

/**
 * Body length declared by the four-byte ASCII prefix, or `null` when the reply
 * is not framed (too short, non-digit prefix, or a non-positive declaration).
 */
export function pecDeclaredLength(buf: Buffer | Uint8Array): number | null {
  if (buf.length < PEC_PREFIX_LEN) return null;
  let head = "";
  for (let i = 0; i < PEC_PREFIX_LEN; i += 1) head += String.fromCharCode(buf[i]!);
  if (!/^\d{4}$/.test(head)) return null;
  const declared = Number(head);
  return Number.isInteger(declared) && declared > 0 ? declared : null;
}

/**
 * True once a full PEC reply has arrived: four prefix bytes plus the body the
 * prefix declares. A reply that is not framed (or is still shorter than the
 * prefix) follows the rule above — wait for the prefix only.
 */
export function pecReplyComplete(buf: Buffer | Uint8Array): boolean {
  // Not even the length prefix yet: keep waiting.
  if (buf.length < PEC_PREFIX_LEN) return false;
  const declared = pecDeclaredLength(buf);
  // Unframed reply — there is no length to wait for, hand the bytes on.
  if (declared === null) return true;
  // The prefix itself is not part of the declared length.
  return buf.length >= declared + PEC_PREFIX_LEN;
}
