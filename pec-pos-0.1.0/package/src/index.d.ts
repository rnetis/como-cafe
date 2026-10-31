import { EventEmitter } from 'node:events';
export declare const ConnectionType: { readonly LAN: 0; readonly Serial: 1 };
export interface Codec {
  encode(fields: Record<string, string>): string | Buffer;
  isComplete(buf: Buffer): boolean;
  decode(raw: string): string;
}
export interface PCPOSOptions {
  amount?: string; currency?: string; prCode?: string;
  r1Holder?: string; r2Merchant?: string; t1Holder?: string; t2Merchant?: string;
  serviceGroup?: string; settel?: string; keyValue?: string;
  connectionType?: 0 | 1; ip?: string; port?: number; comPort?: string;
  codec?: Codec; timeout?: number; baudRate?: number;
}
export declare class PCPOS extends EventEmitter {
  constructor(opts?: PCPOSOptions);
  request: string; rawResponse: string; lastParsed: string;
  testConnection(): Promise<boolean>;
  sendTransaction(): Promise<{ raw: string; parsed: string }>;
  on(event: 'response', cb: (raw: string, parsed: string) => void): this;
}
export declare class ProtocolNotImplementedError extends Error {}
export declare const TESTER_DEFAULTS: Record<string, unknown>;
export declare const EXTRA_FIELDS: string[];
