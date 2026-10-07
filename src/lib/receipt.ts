import { formatToman, formatWhen, tx } from "./format";
import type { Customer, Lang, Order, Settings } from "./types";

export type ReceiptDoc = {
  dir: "rtl" | "ltr";
  lang: Lang;
  kicker: string;
  address: string;
  instagram: string;
  phone: string;
  number: string;
  when: string;
  lines: { title: string; sub: string; amount: string }[];
  rows: { label: string; value: string }[];
  totalLabel: string;
  total: string;
  pay: string;
  note: string;
  pause: string;
  loyalty: string;
  footer: string;
};

const PAUSES: Record<Lang, string[]> = {
  fa: [
    "یک دقیقه. قبل از اولین جرعه.",
    "قهوه بهانه است. مکث اصل ماجراست.",
    "این فیش یک مکث کوچک است.",
  ],
  en: [
    "One minute. Before the first sip.",
    "Coffee is the excuse. The pause is the point.",
    "This ticket is a small pause.",
  ],
};

function payLabel(pay: Order["pay"], lang: Lang) {
  if (pay === "cash") return tx(lang, "نقد", "Cash");
  if (pay === "card") return tx(lang, "کارت", "Card");
  if (pay === "wallet") return tx(lang, "اعتبار کومو", "Store credit");
  return tx(lang, "آنلاین", "Online");
}

export function buildReceiptDoc(order: Order, customer: Customer | undefined, settings: Settings): ReceiptDoc {
  const lang = settings.lang;
  const rows: { label: string; value: string }[] = [
    { label: tx(lang, "جمع", "Subtotal"), value: formatToman(order.subtotal, lang) },
  ];
  if (order.manualOff) rows.push({ label: tx(lang, "تخفیف", "Discount"), value: formatToman(order.manualOff, lang) });
  if (order.stampOff) rows.push({ label: tx(lang, "مهر رایگان", "Stamp"), value: formatToman(order.stampOff, lang) });
  if (order.giftOff) rows.push({ label: tx(lang, "هدیه تولد", "Birthday"), value: formatToman(order.giftOff, lang) });
  if (order.tierOff) rows.push({ label: tx(lang, "تخفیف سطح", "Tier"), value: formatToman(order.tierOff, lang) });
  if (order.pointsOff) rows.push({ label: tx(lang, "امتیاز", "Points"), value: formatToman(order.pointsOff, lang) });

  const loyaltyBits: string[] = [];
  if (order.guestName) loyaltyBits.push(order.guestName);
  if (order.pointsEarned) {
    loyaltyBits.push(tx(lang, `${order.pointsEarned} امتیاز این فیش`, `${order.pointsEarned} pts`));
  }
  if (order.bonusPoints) {
    loyaltyBits.push(tx(lang, `${order.bonusPoints} امتیاز معرفی`, `${order.bonusPoints} referral`));
  }
  if (typeof order.stampsAfter === "number") {
    loyaltyBits.push(
      tx(
        lang,
        `مهر ${order.stampsAfter} از ${settings.stampGoal}`,
        `stamps ${order.stampsAfter}/${settings.stampGoal}`,
      ),
    );
  }
  if (typeof order.pointsAfter === "number") {
    loyaltyBits.push(tx(lang, `مانده امتیاز ${order.pointsAfter}`, `${order.pointsAfter} pts left`));
  }
  if (!order.guestName) {
    loyaltyBits.push(tx(lang, "بدون مهر — شماره نگرفتیم", "No stamp — no number"));
  }

  const pause = PAUSES[lang][order.number % PAUSES[lang].length] ?? PAUSES[lang][0]!;

  return {
    dir: lang === "fa" ? "rtl" : "ltr",
    lang,
    kicker: "COFFEE. PEOPLE. MOMENTS.",
    address: lang === "fa" ? settings.addressFa : settings.addressEn,
    instagram: settings.instagram,
    phone: settings.phone,
    number: tx(lang, `فیش ${order.number}`, `Ticket ${order.number}`),
    when: formatWhen(order.at, lang),
    lines: order.lines.map((line) => {
      const mods = line.mods.map((mod) => (lang === "fa" ? mod.nameFa : mod.nameEn)).join(tx(lang, "، ", ", "));
      const title = `${line.qty} × ${lang === "fa" ? line.nameFa : line.nameEn}`;
      const sub = lang === "fa" ? line.nameEn : line.nameFa;
      return {
        title: mods ? `${title} · ${mods}` : title,
        sub,
        amount: formatToman(line.unitPrice * line.qty, lang),
      };
    }),
    rows,
    totalLabel: tx(lang, "قابل پرداخت", "Due"),
    total: formatToman(order.total, lang),
    pay: payLabel(order.pay, lang),
    note: order.note,
    pause,
    loyalty: loyaltyBits.join(" · "),
    footer: customer ? "" : "",
  };
}

function esc(value: string) {
  return value
    .replaceAll("&", "\u0026amp;")
    .replaceAll("<", "\u0026lt;")
    .replaceAll(">", "\u0026gt;")
    .replaceAll('"', "\u0026quot;");
}

export function receiptHtml(doc: ReceiptDoc, paper: 58 | 80) {
  const width = paper === 58 ? "54mm" : "72mm";
  const lines = doc.lines
    .map(
      (line) => `<tr>
        <td style="padding:4px 0; vertical-align:top">
          <div style="font-weight:700">${esc(line.title)}</div>
          <div style="color:#555; font-size:11px">${esc(line.sub)}</div>
        </td>
        <td style="padding:4px 0 4px 8px; text-align:end; white-space:nowrap; vertical-align:top">${esc(line.amount)}</td>
      </tr>`,
    )
    .join("");
  const rows = doc.rows
    .map(
      (row) =>
        `<tr><td style="padding:2px 0; color:#333">${esc(row.label)}</td><td style="padding:2px 0; text-align:end">${esc(row.value)}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html dir="${doc.dir}" lang="${doc.lang}"><head><meta charset="utf-8"><title>COMO</title>
    <style>
      @page { size: ${paper}mm auto; margin: 4mm; }
      html, body { margin: 0; padding: 0; background: #fff; color: #111; }
      body { font-family: Vazirmatn, "DejaVu Sans", sans-serif; width: ${width}; font-size: 12px; }
      h1 { font-size: 28px; letter-spacing: 0.18em; text-align: center; margin: 0; }
      .center { text-align: center; }
      .rule { border-top: 1px dashed #111; margin: 8px 0; }
      table { width: 100%; border-collapse: collapse; }
      .total { font-size: 16px; font-weight: 700; }
    </style></head><body>
    <h1>COMO</h1>
    <p class="center" style="letter-spacing:.14em; font-size:10px; margin:4px 0">${esc(doc.kicker)}</p>
    <p class="center" style="margin:0">${esc(doc.address)}</p>
    ${doc.phone ? `<p class="center" style="margin:0">${esc(doc.phone)}</p>` : ""}
    <p class="center" style="margin:0">${esc(doc.instagram)}</p>
    <div class="rule"></div>
    <table><tr><td>${esc(doc.number)}</td><td style="text-align:end">${esc(doc.when)}</td></tr></table>
    <div class="rule"></div>
    <table>${lines}</table>
    <div class="rule"></div>
    <table>${rows}</table>
    <table class="total"><tr><td>${esc(doc.totalLabel)}</td><td style="text-align:end">${esc(doc.total)}</td></tr></table>
    <p>${esc(doc.pay)}</p>
    ${doc.note ? `<p>${esc(doc.note)}</p>` : ""}
    <div class="rule"></div>
    <p>${esc(doc.loyalty)}</p>
    <p class="center" style="font-style:italic">${esc(doc.pause)}</p>
    <p class="center">EST. 2026</p>
    </body></html>`;
}

export function printReceipt(doc: ReceiptDoc, paper: 58 | 80) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const target = frame.contentDocument;
  const win = frame.contentWindow;
  if (!target || !win) {
    frame.remove();
    return;
  }
  target.open();
  target.write(receiptHtml(doc, paper));
  target.close();
  window.setTimeout(() => {
    win.focus();
    win.print();
    window.setTimeout(() => frame.remove(), 1200);
  }, 200);
}

async function paint(doc: ReceiptDoc, width: number) {
  const height = 360 + doc.lines.length * 72 + doc.rows.length * 28;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  try {
    await document.fonts.load("700 42px Vazirmatn");
    await document.fonts.load("400 22px Vazirmatn");
  } catch {
    /* system fallback still draws */
  }
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#000";
  ctx.textBaseline = "top";
  const rtl = doc.dir === "rtl";
  const margin = 24;
  let y = 20;
  const center = (text: string, size: number, weight = "700") => {
    ctx.font = `${weight} ${size}px Vazirmatn, "DejaVu Sans", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(text, width / 2, y);
    y += size + 10;
  };
  const row = (left: string, right: string, size = 22, weight = "400") => {
    ctx.font = `${weight} ${size}px Vazirmatn, "DejaVu Sans", sans-serif`;
    ctx.textAlign = rtl ? "right" : "left";
    ctx.fillText(left, rtl ? width - margin : margin, y, width - margin * 2 - 8);
    ctx.textAlign = rtl ? "left" : "right";
    ctx.fillText(right, rtl ? margin : width - margin, y);
    y += size + 8;
  };
  center("COMO", 42);
  center(doc.kicker, 14, "400");
  center(doc.address, 18, "400");
  if (doc.phone) center(doc.phone, 16, "400");
  center(doc.instagram, 16, "400");
  y += 6;
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(width - margin, y);
  ctx.stroke();
  y += 12;
  row(doc.number, doc.when, 18);
  y += 4;
  for (const line of doc.lines) {
    row(line.title, line.amount, 22, "700");
    ctx.font = `400 16px Vazirmatn, "DejaVu Sans", sans-serif`;
    ctx.textAlign = rtl ? "right" : "left";
    ctx.fillText(line.sub, rtl ? width - margin : margin, y);
    y += 26;
  }
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(width - margin, y);
  ctx.stroke();
  y += 12;
  for (const entry of doc.rows) row(entry.label, entry.value, 18);
  row(doc.totalLabel, doc.total, 26, "700");
  row(doc.pay, "", 18);
  if (doc.note) {
    ctx.font = `400 16px Vazirmatn, "DejaVu Sans", sans-serif`;
    ctx.textAlign = rtl ? "right" : "left";
    ctx.fillText(doc.note, rtl ? width - margin : margin, y, width - margin * 2);
    y += 28;
  }
  y += 8;
  ctx.font = `400 16px Vazirmatn, "DejaVu Sans", sans-serif`;
  ctx.textAlign = "center";
  const loyalty = doc.loyalty.length > 80 ? `${doc.loyalty.slice(0, 80)}…` : doc.loyalty;
  ctx.fillText(loyalty, width / 2, y, width - margin * 2);
  y += 28;
  ctx.font = `italic 500 18px Fraunces, Vazirmatn, serif`;
  ctx.fillText(doc.pause, width / 2, y, width - margin * 2);
  return canvas;
}

function raster(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Uint8Array([0x1b, 0x40]);
  const { width, height } = canvas;
  const image = ctx.getImageData(0, 0, width, height);
  const widthBytes = Math.ceil(width / 8);
  const dots = new Uint8Array(widthBytes * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const lum = (image.data[index] ?? 255) * 0.3 + (image.data[index + 1] ?? 255) * 0.59 + (image.data[index + 2] ?? 255) * 0.11;
      if (lum < 170) dots[y * widthBytes + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  const header = new Uint8Array([
    0x1b, 0x40,
    0x1d, 0x76, 0x30, 0x00,
    widthBytes & 0xff,
    (widthBytes >> 8) & 0xff,
    height & 0xff,
    (height >> 8) & 0xff,
  ]);
  const tail = new Uint8Array([0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x00]);
  const out = new Uint8Array(header.length + dots.length + tail.length);
  out.set(header, 0);
  out.set(dots, header.length);
  out.set(tail, header.length + dots.length);
  return out;
}

export function drawerPulse() {
  return new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);
}

export async function receiptBytes(doc: ReceiptDoc, paper: 58 | 80, kick: boolean) {
  const canvas = await paint(doc, paper === 80 ? 576 : 384);
  const body = raster(canvas);
  if (!kick) return body;
  const pulse = drawerPulse();
  const out = new Uint8Array(pulse.length + body.length);
  out.set(pulse, 0);
  out.set(body, pulse.length);
  return out;
}

type SerialPortLike = {
  open: (options: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
  writable: WritableStream<Uint8Array> | null;
};

export function serialAvailable() {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

export async function sendToPrinter(bytes: Uint8Array, baud: number) {
  const serial = (navigator as Navigator & { serial?: { requestPort: () => Promise<SerialPortLike> } }).serial;
  if (!serial) throw new Error("Web Serial فقط در Chrome روی اتصال امن هست");
  const port = await serial.requestPort();
  await port.open({ baudRate: baud });
  const writable = port.writable;
  if (!writable) throw new Error("درگاه نوشتن ندارد");
  const writer = writable.getWriter();
  try {
    const size = 4096;
    for (let index = 0; index < bytes.length; index += size) {
      await writer.write(bytes.subarray(index, index + size));
    }
  } finally {
    writer.releaseLock();
    await port.close();
  }
}

export function downloadBytes(bytes: Uint8Array, filename: string) {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  const blob = new Blob([copy], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
