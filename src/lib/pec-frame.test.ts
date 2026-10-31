import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pecDeclaredLength, pecReplyComplete } from "./pec-frame.ts";

/**
 * A PEC reply is `[4-digit body length]` + `[RQ + 3-digit body length + tags]`.
 * The prefix counts the body only, so a full frame is `4 + declared` bytes.
 *
 * Minimal reply carrying just the success response code `00`:
 *   "0012" + "RQ007" + "RC002" + "00"  → 4 + 12 = 16 bytes
 */
const MINIMAL_REPLY = "0012RQ007RC00200";

/** The same shape but declaring 13 body bytes: complete only once 17 bytes
 *  have arrived (the missing byte is exactly what the old `total` rule
 *  dropped, cutting the frame four bytes early). */
const THIRTEEN_BODY_REPLY = "0013RQ008RC00200";

describe("pecReplyComplete", () => {
  it("accepts a complete 16-byte minimal reply", () => {
    const reply = Buffer.from(MINIMAL_REPLY, "ascii");
    assert.equal(reply.length, 16);
    assert.equal(pecDeclaredLength(reply), 12);
    assert.equal(pecReplyComplete(reply), true);
  });

  it("waits while only the length prefix has arrived", () => {
    const header = Buffer.from("0013", "ascii");
    assert.equal(header.length, 4);
    assert.equal(pecReplyComplete(header), false);
  });

  it("waits when the reply is split before the declared body is complete", () => {
    const split = Buffer.from("0013RQ008RC00", "ascii");
    assert.equal(split.length, 13);
    assert.equal(pecReplyComplete(split), false);
  });

  it("waits one byte short of the declared frame, then completes it", () => {
    // 16 bytes but the prefix declares 13 body bytes, so the frame is 17.
    const short = Buffer.from(THIRTEEN_BODY_REPLY, "ascii");
    assert.equal(short.length, 16);
    assert.equal(pecReplyComplete(short), false);

    const full = Buffer.from(THIRTEEN_BODY_REPLY + "0", "ascii");
    assert.equal(full.length, 17);
    assert.equal(pecReplyComplete(full), true);
  });

  it("treats a non-digit prefix as an unframed reply and does not wait", () => {
    const plainText = Buffer.from("PONG from the terminal", "ascii");
    assert.equal(pecDeclaredLength(plainText), null);
    assert.equal(pecReplyComplete(plainText), true);
  });

  it("treats a zero-length declaration as an unframed reply", () => {
    const empty = Buffer.from("0000RQ007RC00200", "ascii");
    assert.equal(pecDeclaredLength(empty), null);
    assert.equal(pecReplyComplete(empty), true);
  });

  it("waits for the four prefix bytes even before they are digits", () => {
    const partial = Buffer.from("PON", "ascii");
    assert.equal(pecReplyComplete(partial), false);
  });

  it("accepts a Uint8Array as well as a Buffer", () => {
    const reply = new Uint8Array(Buffer.from(MINIMAL_REPLY, "ascii"));
    assert.equal(pecReplyComplete(reply), true);
    assert.equal(pecReplyComplete(reply.subarray(0, 13)), false);
  });
});
