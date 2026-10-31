# COMO Desk

A single-desk café operating app for COMO coffee, Bandar Abbas: point of sale,
tickets, inventory (cellar), books (sales / expenses / drawer), guests
(loyalty), customer care (birthday / win-back / milestone texts), SMS
campaigns, and house settings. Persian-first RTL UI with an English toggle.

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

On a fresh clone, fetch the PEC gateway client submodule once:

```sh
git submodule update --init
```

## Desktop app

COMO Desk also ships as a Tauri desktop app for Windows, macOS (Intel and
Apple Silicon), and Linux. The desktop bundle keeps the books on that computer.

To run the desktop shell locally, install the [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)
for your operating system, then run:

```sh
npm run tauri:dev
```

To create a native release bundle for your current operating system:

```sh
npm run tauri -- build
```

Pushing a version tag such as `v1.8.0` builds and publishes installers for all
supported desktop platforms through GitHub Actions. The installers are
unsigned; Windows and macOS may show their standard first-run security prompts.

The packaged desktop shell is the static app. Features that need a Node server
(the SMS proxy, the PEC card terminal bridge and the Parsian gateway) run in the
web deployment or the local `npm run dev` server, not inside the packaged
shell.

## Where the data lives

The books run **client-side**: zustand persisted to `localStorage` under
`como-desk-v1`. On the desktop/local build nothing leaves the device.

When the web build is deployed, the customer stats the separate menu site shows
(name, phone, points, stamps, visits, spend, birthday) are mirrored to the
hosted database through `/api/public/sync`, and the menu site reads them with
`/api/public/customer`. That mirror is the only data that leaves the desk;
`PUBLIC_API_KEY` (server) and `VITE_PUBLIC_API_KEY` (browser, must match)
authorise the write side.

Durability layers (all in `src/lib`):

- **`sanitize.ts`** — structural firewall for untrusted payloads. Rehydrated
  saves and restored files are coerced into a complete `DeskData` or rejected;
  corrupt data can never brick the desk or poison the books.
- **`store.ts`** — persistence is versioned (`version: 3` + `migrate`) and the
  storage wrapper never throws on quota errors or unreadable saves.
- **`autosave.ts`** — one snapshot of the books per day, three days deep
  (`como-backup-0…2`). Restore from House → «بازیابی آخرین پشتیبان».
- Manual export/import stays in House («دانلود دفتر» / «بازگردانی»).

Keep in mind the SMS key and PEC merchant PIN are part of the books' settings,
so they are present in the localStorage save, the rotating autosave slots and a
manually exported `como-desk.json`.

## Customer care

With **Customer care** switched on in the Guests screen, the desk sends the
care messages that are due at boot (and from «ارسال اکنون»):

- a birthday text within a week of the birthday, once a year;
- a win-back text once a guest has been quiet for `careQuietDays` (default 21);
- a thank-you at 10 / 25 / 50 / 100 visits.

At most `CARE_DAILY_CAP` (12) messages go out per day, one per guest per day,
and every send is stamped on the guest so a reload cannot repeat it. Existing
installs upgrade with care **off** — it is opt-in for data that was created
before the feature, so nothing is texted without the café turning it on.

## SMS

The Wire view sends through the server function to `api.sms.ir`
(credit / bulk / like-to-like / verify). Without an API key configured,
messages stay in the on-device practice log. The key is entered by the café in
House/Wire and lives in that device's local data (see above for backups).
