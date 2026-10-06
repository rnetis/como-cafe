# COMO Desk

A single-desk café operating app for COMO coffee, Bandar Abbas: point of sale,
tickets, inventory (cellar), books (sales / expenses / drawer), guests
(loyalty), SMS campaigns, and house settings. Persian-first RTL UI with an
English toggle.

## Stack

- TanStack Start (React 19, Vite, Nitro) — deployed to Vercel
- Tailwind v4, Radix primitives, zustand for state
- `src/lib/sms.functions.ts` — a server function proxying SMS.ir
  (`X-API-KEY`) so the browser never hits the API directly

## Commands

```sh
npm run dev         # dev server on 0.0.0.0:8080
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # node:test suites (scripts + lib)
npm run build       # production build + db migrations
```

## Desktop app

COMO Desk also ships as a Tauri desktop app for Windows, macOS (Intel and
Apple Silicon), and Linux. The desktop bundle keeps the books on that computer
and can serve the register to phones and tablets on the café's local network.

To run the desktop shell locally, install the [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)
for your operating system, then run:

```sh
npm run tauri:dev
```

To create a native release bundle for your current operating system:

```sh
npm run tauri -- build
```

Pushing a version tag such as `v1.0.0` builds and publishes installers for all
supported desktop platforms through GitHub Actions. The installers are
unsigned; Windows and macOS may show their standard first-run security prompts.

## Where the data lives

The books run **fully client-side**: zustand persisted to `localStorage`
under `como-desk-v1`. Nothing is synced or shared — one device, one desk.

Durability layers (all in `src/lib`):

- **`sanitize.ts`** — structural firewall for untrusted payloads. Rehydrated
  saves and restored files are coerced into a complete `DeskData` or rejected;
  corrupt data can never brick the desk or poison the books.
- **`store.ts`** — persistence is versioned (`version: 1` + `migrate`) and the
  storage wrapper never throws on quota errors or unreadable saves.
- **`autosave.ts`** — one snapshot of the books per day, three days deep
  (`como-backup-0…2`). Restore from House → «بازیابی آخرین پشتیبان».
- Manual export/import stays in House («دانلود دفتر» / «بازگردانی»).

## SMS

The Wire view sends through the server function to `api.sms.ir`
(credit / bulk / like-to-like / verify). Without an API key configured,
messages stay in the on-device practice log. The key is entered by the café in
House/Wire and lives only in that device's localStorage.
