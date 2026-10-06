import { useState } from "react";
import { toast } from "sonner";
import { readAutoBackup } from "@/lib/autosave";
import { Btn, Field, fieldClass } from "@/components/como/bits";
import { CATEGORIES } from "@/lib/catalog";
import { formatMenu, formatWhen, tx } from "@/lib/format";
import { buildReceiptDoc, printReceipt } from "@/lib/receipt";
import { snapshotOf } from "@/lib/seed";
import { useCafe } from "@/lib/store";
import type { CategoryId } from "@/lib/types";

export function House() {
  const store = useCafe();
  const lang = store.settings.lang;
  const settings = store.settings;
  const [arm, setArm] = useState(false);
  const [restoreArm, setRestoreArm] = useState(false);
  const [nameFa, setNameFa] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [category, setCategory] = useState<CategoryId>("hot-coffee");
  const [price, setPrice] = useState(200);

  const patch = store.patchSettings;
  const number = (
    key: "pointsPer" | "pointValue" | "stampGoal" | "compCap" | "slowStart" | "slowEnd" | "referralBonus" | "float",
    value: string,
  ) => {
    const next = Number(value);
    if (Number.isFinite(next)) patch({ [key]: next });
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-medium">{tx(lang, "خانه", "House")}</h1>
      <p className="mt-1 text-sm text-mute">
        {tx(lang, "کوچه هفتم خیابان طلوع. داده‌ها روی همین دستگاه می‌مانند.", "7th alley of Tolou St. The books stay on this device.")}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label={tx(lang, "نشانی فارسی", "Persian address")}>
          <input className={fieldClass} value={settings.addressFa} onChange={(event) => patch({ addressFa: event.target.value })} />
        </Field>
        <Field label={tx(lang, "نشانی انگلیسی", "English address")}>
          <input className={fieldClass} value={settings.addressEn} onChange={(event) => patch({ addressEn: event.target.value })} />
        </Field>
        <Field label={tx(lang, "تلفن کافه", "Cafe phone")}>
          <input dir="ltr" className={fieldClass} value={settings.phone} onChange={(event) => patch({ phone: event.target.value })} />
        </Field>
        <Field label="Instagram">
          <input dir="ltr" className={fieldClass} value={settings.instagram} onChange={(event) => patch({ instagram: event.target.value })} />
        </Field>
      </div>

      <h2 className="mt-8 text-lg font-medium">{tx(lang, "چاپگر حرارتی", "Thermal printer")}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {([80, 58] as const).map((paper) => (
          <button
            key={paper}
            type="button"
            onClick={() => patch({ paper })}
            className={`h-11 px-3 text-sm ${settings.paper === paper ? "bg-ink text-paper" : "border border-line"}`}
          >
            {paper} mm
          </button>
        ))}
        {([9600, 115200] as const).map((baud) => (
          <button
            key={baud}
            type="button"
            onClick={() => patch({ baud })}
            className={`h-11 px-3 text-sm ${settings.baud === baud ? "bg-ink text-paper" : "border border-line"}`}
          >
            {baud}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={settings.autoPrint} onChange={(event) => patch({ autoPrint: event.target.checked })} />
          {tx(lang, "چاپ خودکار فیش", "Auto-print tickets")}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={settings.autoSms} onChange={(event) => patch({ autoSms: event.target.checked })} />
          {tx(lang, "پیامک خودکار فیش", "Auto-text tickets")}
        </label>
      </div>
      <Btn
        className="mt-3"
        tone="line"
        onClick={() => {
          const order = store.orders[0];
          if (!order) return;
          const guest = store.customers.find((entry) => entry.id === order.customerId);
          printReceipt(buildReceiptDoc(order, guest, settings), settings.paper);
        }}
      >
        {tx(lang, "چاپ آزمایشی آخرین فیش", "Test-print the last ticket")}
      </Btn>

      <h2 className="mt-8 text-lg font-medium">{tx(lang, "قانون وفاداری", "Loyalty rules")}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Num label={tx(lang, "تومان برای یک امتیاز", "Toman per point")} value={settings.pointsPer} onChange={(value) => number("pointsPer", value)} />
        <Num label={tx(lang, "ارزش هر امتیاز", "Value of a point")} value={settings.pointValue} onChange={(value) => number("pointValue", value)} />
        <Num label={tx(lang, "مهر لازم", "Stamps needed")} value={settings.stampGoal} onChange={(value) => number("stampGoal", value)} />
        <Num label={tx(lang, "سقف مهمانی، ۰ یعنی آزاد", "Comp cap, 0 is open")} value={settings.compCap} onChange={(value) => number("compCap", value)} />
        <Num label={tx(lang, "شروع ساعت آرام", "Slow hour starts")} value={settings.slowStart} onChange={(value) => number("slowStart", value)} />
        <Num label={tx(lang, "پایان ساعت آرام", "Slow hour ends")} value={settings.slowEnd} onChange={(value) => number("slowEnd", value)} />
        <Num label={tx(lang, "امتیاز معرفی", "Referral points")} value={settings.referralBonus} onChange={(value) => number("referralBonus", value)} />
        <Num label={tx(lang, "تنخواه", "Float")} value={settings.float} onChange={(value) => number("float", value)} />
      </div>

      <h2 className="mt-8 text-lg font-medium">{tx(lang, "قیمت منو، به هزار", "Menu prices, in thousands")}</h2>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {store.menu.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block text-sm">{lang === "fa" ? item.nameFa : item.nameEn}</span>
              <span className="text-xs text-mute">{tx(lang, CATEGORIES.find((entry) => entry.id === item.category)?.fa ?? "", CATEGORIES.find((entry) => entry.id === item.category)?.en ?? "")}</span>
            </span>
            <input
              dir="ltr"
              type="number"
              className="h-11 w-24 border border-line bg-sheet px-2 text-center"
              value={Math.round(item.price / 1000)}
              onChange={(event) => store.setPrice(item.id, Number(event.target.value) * 1000)}
            />
            <span className="w-10 text-xs text-mute">{formatMenu(item.price, lang)}</span>
            <button type="button" className="h-11 px-2 text-xs" onClick={() => store.toggleItem(item.id)}>
              {item.active ? tx(lang, "هست", "On") : tx(lang, "تمام", "86")}
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-4 grid gap-2 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          store.addMenuItem({ nameFa, nameEn, category, price: price * 1000 });
          setNameFa("");
          setNameEn("");
        }}
      >
        <input className={fieldClass} placeholder={tx(lang, "نام فارسی", "Persian name")} value={nameFa} onChange={(event) => setNameFa(event.target.value)} />
        <input className={fieldClass} placeholder={tx(lang, "نام انگلیسی", "English name")} value={nameEn} onChange={(event) => setNameEn(event.target.value)} />
        <select className={fieldClass} value={category} onChange={(event) => setCategory(event.target.value as CategoryId)}>
          {CATEGORIES.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {tx(lang, entry.fa, entry.en)}
            </option>
          ))}
        </select>
        <input dir="ltr" type="number" className={fieldClass} value={price} onChange={(event) => setPrice(Number(event.target.value))} />
        <Btn type="submit">{tx(lang, "افزودن به منو", "Add to the menu")}</Btn>
      </form>

      <h2 className="mt-8 text-lg font-medium">{tx(lang, "نسخه", "Copy")}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn
          tone="line"
          onClick={() => {
            const blob = new Blob([JSON.stringify(snapshotOf(store))], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "como-desk.json";
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          {tx(lang, "دانلود دفتر", "Download the books")}
        </Btn>
        <label className="inline-flex h-12 cursor-pointer items-center border border-line bg-sheet px-4 text-sm">
          {tx(lang, "بازگردانی", "Restore")}
          <input
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void file.text().then((text) => {
                if (text.length > 2_000_000) return;
                try {
                  store.importBackup(JSON.parse(text) as unknown);
                } catch {
                  /* ignore bad files */
                }
              });
            }}
          />
        </label>
        <Btn tone="stamp" onClick={() => (arm ? store.reset() : setArm(true))}>
          {arm ? tx(lang, "بله، از نو", "Yes, start over") : tx(lang, "پاک کردن شیفت نمونه", "Clear the sample shift")}
        </Btn>
      </div>

      <h2 className="mt-8 text-lg font-medium">{tx(lang, "پشتیبان روزانه", "Daily auto-backup")}</h2>
      <p className="mt-2 max-w-xl text-xs text-mute">
        {tx(
          lang,
          "روزی یک نسخه از دفتر روی همین دستگاه نگه داشته می‌شود — سه روز عقب. اگر بازیابی یا پاک‌کردن اشتباه بود، اینجا برگرد.",
          "One copy of the books per day is kept on this device — three days deep. If a restore or a reset went wrong, step back here.",
        )}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Btn
          tone="line"
          onClick={() => {
            const backup = readAutoBackup();
            if (!backup) {
              toast(tx(lang, "هنوز پشتیبانی نیست", "No backup yet"));
              return;
            }
            if (!restoreArm) {
              setRestoreArm(true);
              toast(
                tx(
                  lang,
                  `نسخه ${formatWhen(backup.at, lang)} — دوباره بزن تا برگردد`,
                  `Backup of ${formatWhen(backup.at, lang)} — press again to restore`,
                ),
              );
              return;
            }
            setRestoreArm(false);
            if (store.importBackup(backup.data)) {
              toast(tx(lang, "دفتر برگشت", "The books came back"));
            } else {
              toast(tx(lang, "نسخه خوانده نشد", "The backup could not be read"));
            }
          }}
        >
          {restoreArm ? tx(lang, "بله، برگردان", "Yes, restore it") : tx(lang, "بازیابی آخرین پشتیبان", "Restore the last backup")}
        </Btn>
      </div>
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <input dir="ltr" type="number" className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
