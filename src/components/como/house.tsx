import { useMemo, useState } from "react";
import { toast } from "sonner";
import { readAutoBackup } from "@/lib/autosave";
import { Btn, Field, fieldClass } from "@/components/como/bits";
import { CATEGORIES } from "@/lib/catalog";
import { formatMenu, formatToman, formatWhen, tx, unitLabel } from "@/lib/format";
import { buildReceiptDoc, printReceipt } from "@/lib/receipt";
import { snapshotOf } from "@/lib/seed";
import { useCafe } from "@/lib/store";
import type { CategoryId, MenuItem, RecipeUse } from "@/lib/types";

export function House() {
  const store = useCafe();
  const lang = store.settings.lang;
  const settings = store.settings;
  const [arm, setArm] = useState(false);
  const [restoreArm, setRestoreArm] = useState(false);
  const [draft, setDraft] = useState<MenuItem>(() => ({
    id: "",
    nameFa: "",
    nameEn: "",
    category: "hot-coffee",
    price: 200_000,
    recipe: [],
    active: true,
  }));
  const [editing, setEditing] = useState(false);
  const [componentSku, setComponentSku] = useState(store.stock[0]?.sku ?? "");
  const [componentQty, setComponentQty] = useState(1);
  const costOf = (sku: string) => store.stock.find((item) => item.sku === sku)?.cost ?? 0;
  const recipeCost = useMemo(
    () => draft.recipe.reduce((sum, use) => sum + costOf(use.sku) * use.qty, 0),
    [draft.recipe, store.stock],
  );
  const saveDraft = () => {
    if (
      store.saveMenuItem({
        id: draft.id,
        nameFa: draft.nameFa,
        nameEn: draft.nameEn,
        category: draft.category,
        price: draft.price,
        recipe: draft.recipe,
      })
    ) {
      setEditing(false);
      setDraft({
        id: "",
        nameFa: "",
        nameEn: "",
        category: "hot-coffee",
        price: 200_000,
        recipe: [],
        active: true,
      });
      toast(tx(lang, "منو ذخیره شد", "Menu item saved"));
    } else toast(tx(lang, "نام، قیمت و مواد را بررسی کن", "Check the names, price, and recipe"));
  };

  const patch = store.patchSettings;
  const number = (
    key:
      | "pointsPer"
      | "pointValue"
      | "stampGoal"
      | "compCap"
      | "slowStart"
      | "slowEnd"
      | "referralBonus"
      | "float",
    value: string,
  ) => {
    const next = Number(value);
    if (Number.isFinite(next)) patch({ [key]: next });
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-medium">{tx(lang, "خانه", "House")}</h1>
      <p className="mt-1 text-sm text-mute">
        {tx(
          lang,
          "کوچه هفتم خیابان طلوع. داده‌ها روی همین دستگاه می‌مانند.",
          "7th alley of Tolou St. The books stay on this device.",
        )}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label={tx(lang, "نشانی فارسی", "Persian address")}>
          <input
            className={fieldClass}
            value={settings.addressFa}
            onChange={(event) => patch({ addressFa: event.target.value })}
          />
        </Field>
        <Field label={tx(lang, "نشانی انگلیسی", "English address")}>
          <input
            className={fieldClass}
            value={settings.addressEn}
            onChange={(event) => patch({ addressEn: event.target.value })}
          />
        </Field>
        <Field label={tx(lang, "تلفن کافه", "Cafe phone")}>
          <input
            dir="ltr"
            className={fieldClass}
            value={settings.phone}
            onChange={(event) => patch({ phone: event.target.value })}
          />
        </Field>
        <Field label="Instagram">
          <input
            dir="ltr"
            className={fieldClass}
            value={settings.instagram}
            onChange={(event) => patch({ instagram: event.target.value })}
          />
        </Field>
      </div>

      <h2 className="mt-8 text-lg font-medium">{tx(lang, "هزینه‌ها", "Expenses")}</h2>
      <p className="mt-1 text-sm text-mute">
        {tx(
          lang,
          "هر هزینه یک ستون آزاد دارد. اسمش را اینجا بنویس؛ در دفتر، همان اسم بالای آن ستون می‌نشیند.",
          "Every expense carries one free column. Name it here and that name sits above it in the books.",
        )}
      </p>
      <div className="mt-3 max-w-sm">
        <Field label={tx(lang, "نام ستون آزاد", "Free column name")}>
          <input
            className={fieldClass}
            placeholder={tx(lang, "تأمین‌کننده، پرداخت‌کننده…", "Supplier, paid by…")}
            value={settings.expenseCustomLabel}
            onChange={(event) => patch({ expenseCustomLabel: event.target.value })}
          />
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
          <input
            type="checkbox"
            checked={settings.autoPrint}
            onChange={(event) => patch({ autoPrint: event.target.checked })}
          />
          {tx(lang, "چاپ خودکار فیش", "Auto-print tickets")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.autoSms}
            onChange={(event) => patch({ autoSms: event.target.checked })}
          />
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
        <Num
          label={tx(lang, "تومان برای یک امتیاز", "Toman per point")}
          value={settings.pointsPer}
          onChange={(value) => number("pointsPer", value)}
        />
        <Num
          label={tx(lang, "ارزش هر امتیاز", "Value of a point")}
          value={settings.pointValue}
          onChange={(value) => number("pointValue", value)}
        />
        <Num
          label={tx(lang, "مهر لازم", "Stamps needed")}
          value={settings.stampGoal}
          onChange={(value) => number("stampGoal", value)}
        />
        <Num
          label={tx(lang, "سقف مهمانی، ۰ یعنی آزاد", "Comp cap, 0 is open")}
          value={settings.compCap}
          onChange={(value) => number("compCap", value)}
        />
        <Num
          label={tx(lang, "شروع ساعت آرام", "Slow hour starts")}
          value={settings.slowStart}
          onChange={(value) => number("slowStart", value)}
        />
        <Num
          label={tx(lang, "پایان ساعت آرام", "Slow hour ends")}
          value={settings.slowEnd}
          onChange={(value) => number("slowEnd", value)}
        />
        <Num
          label={tx(lang, "امتیاز معرفی", "Referral points")}
          value={settings.referralBonus}
          onChange={(value) => number("referralBonus", value)}
        />
        <Num
          label={tx(lang, "تنخواه", "Float")}
          value={settings.float}
          onChange={(value) => number("float", value)}
        />
      </div>

      <h2 className="mt-8 text-lg font-medium">
        {tx(lang, "منو و بهای تمام‌شده", "Menu and recipe costing")}
      </h2>
      <p className="mt-1 text-sm text-mute">
        {tx(
          lang,
          "مواد از انبار انتخاب می‌شوند؛ مصرف فروش و بهای هر رسپی به‌روز می‌شود.",
          "Recipes use cellar stock. Sales consume these quantities and recipe cost follows current ingredient costs.",
        )}
      </p>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {store.menu.map((item) => (
          <li key={item.id} className="py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{lang === "fa" ? item.nameFa : item.nameEn}</span>
                <span className="text-xs text-mute">
                  {item.recipe.length} {tx(lang, "ماده", "ingredients")} · {tx(lang, "بها", "cost")}{" "}
                  {formatToman(
                    item.recipe.reduce((sum, use) => sum + costOf(use.sku) * use.qty, 0),
                    lang,
                  )}
                </span>
              </span>
              <input
                aria-label={tx(lang, "قیمت به هزار تومان", "Price in thousands of toman")}
                dir="ltr"
                type="number"
                min="1"
                className="h-11 w-28 border border-line bg-sheet px-2 text-center"
                value={Math.round(item.price / 1000)}
                onChange={(event) => store.setPrice(item.id, Number(event.target.value) * 1000)}
              />
              <button
                type="button"
                className="h-11 px-2 text-xs underline"
                onClick={() => {
                  setDraft({ ...item, recipe: item.recipe.map((use) => ({ ...use })) });
                  setEditing(true);
                }}
              >
                {tx(lang, "ویرایش", "Edit")}
              </button>
              <button
                type="button"
                className="h-11 px-2 text-xs"
                onClick={() => store.toggleItem(item.id)}
              >
                {item.active ? tx(lang, "فعال", "On") : tx(lang, "تمام", "86")}
              </button>
              <button
                type="button"
                className="h-11 px-2 text-xs text-stamp"
                onClick={() => {
                  if (!store.removeMenuItem(item.id))
                    toast(
                      tx(
                        lang,
                        "این آیتم در فروش‌های قبلی ثبت شده؛ به‌جایش غیرفعالش کن.",
                        "This item is in ticket history; deactivate it instead.",
                      ),
                    );
                }}
              >
                {tx(lang, "حذف", "Delete")}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {editing ? (
        <div className="mt-4 grid gap-2 border border-line bg-sheet p-4 sm:grid-cols-2">
          <input
            className={fieldClass}
            placeholder={tx(lang, "نام فارسی", "Persian name")}
            value={draft.nameFa}
            onChange={(event) => setDraft({ ...draft, nameFa: event.target.value })}
          />
          <input
            className={fieldClass}
            placeholder={tx(lang, "نام انگلیسی", "English name")}
            value={draft.nameEn}
            onChange={(event) => setDraft({ ...draft, nameEn: event.target.value })}
          />
          <select
            className={fieldClass}
            value={draft.category}
            onChange={(event) => setDraft({ ...draft, category: event.target.value as CategoryId })}
          >
            {CATEGORIES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {tx(lang, entry.fa, entry.en)}
              </option>
            ))}
          </select>
          <Field label={tx(lang, "قیمت (تومان)", "Price (toman)")}>
            <input
              dir="ltr"
              type="number"
              min="1"
              className={fieldClass}
              value={draft.price}
              onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })}
            />
          </Field>
          <div className="sm:col-span-2">
            <p className="text-sm font-medium">{tx(lang, "دستور هر پرس", "Recipe per serving")}</p>
            {draft.recipe.map((use) => {
              const ingredient = store.stock.find((entry) => entry.sku === use.sku);
              return (
                <div key={use.sku} className="mt-2 flex items-center gap-2 text-sm">
                  <span className="flex-1">
                    {ingredient ? (lang === "fa" ? ingredient.nameFa : ingredient.nameEn) : use.sku}
                  </span>
                  <span dir="ltr">
                    {use.qty} {ingredient ? unitLabel(ingredient.unit, lang) : ""}
                  </span>
                  <span className="text-mute">{formatToman(costOf(use.sku) * use.qty, lang)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        recipe: draft.recipe.filter((row) => row.sku !== use.sku),
                      })
                    }
                    aria-label={tx(lang, "حذف ماده", "Remove ingredient")}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
              <select
                className={fieldClass}
                value={componentSku}
                onChange={(event) => setComponentSku(event.target.value)}
              >
                {store.stock.map((ingredient) => (
                  <option key={ingredient.sku} value={ingredient.sku}>
                    {lang === "fa" ? ingredient.nameFa : ingredient.nameEn} ·{" "}
                    {unitLabel(ingredient.unit, lang)}
                  </option>
                ))}
              </select>
              <input
                dir="ltr"
                className={fieldClass}
                type="number"
                min="0.001"
                step="0.001"
                value={componentQty}
                onChange={(event) => setComponentQty(Number(event.target.value))}
              />
              <Btn
                tone="line"
                onClick={() => {
                  if (componentSku && componentQty > 0 && Number.isFinite(componentQty)) {
                    const found = draft.recipe.find((use) => use.sku === componentSku);
                    const recipe: RecipeUse[] = found
                      ? draft.recipe.map((use) =>
                          use.sku === componentSku
                            ? { ...use, qty: Math.round((use.qty + componentQty) * 1000) / 1000 }
                            : use,
                        )
                      : [...draft.recipe, { sku: componentSku, qty: componentQty }];
                    setDraft({ ...draft, recipe });
                  }
                }}
              >
                {tx(lang, "افزودن ماده", "Add ingredient")}
              </Btn>
            </div>
            <p className="mt-2 text-sm">
              {tx(lang, "بهای مواد هر پرس", "Ingredient cost per serving")}:{" "}
              <strong>{formatToman(recipeCost, lang)}</strong> ·{" "}
              {tx(lang, "حاشیه پیش از هزینه‌های دیگر", "Margin before other costs")}:{" "}
              <strong>{formatToman(draft.price - recipeCost, lang)}</strong>
            </p>
          </div>
          <div className="flex gap-2">
            <Btn onClick={saveDraft}>{tx(lang, "ذخیره آیتم", "Save item")}</Btn>
            <Btn tone="line" onClick={() => setEditing(false)}>
              {tx(lang, "انصراف", "Cancel")}
            </Btn>
          </div>
        </div>
      ) : (
        <Btn
          className="mt-4"
          onClick={() => {
            setDraft({
              id: "",
              nameFa: "",
              nameEn: "",
              category: "hot-coffee",
              price: 200_000,
              recipe: [],
              active: true,
            });
            setEditing(true);
          }}
        >
          {tx(lang, "افزودن آیتم منو", "Add menu item")}
        </Btn>
      )}

      <h2 className="mt-8 text-lg font-medium">{tx(lang, "نسخه", "Copy")}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn
          tone="line"
          onClick={() => {
            const blob = new Blob([JSON.stringify(snapshotOf(store))], {
              type: "application/json",
            });
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
          {arm
            ? tx(lang, "بله، از نو", "Yes, start over")
            : tx(lang, "پاک کردن شیفت نمونه", "Clear the sample shift")}
        </Btn>
      </div>

      <h2 className="mt-8 text-lg font-medium">
        {tx(lang, "پشتیبان روزانه", "Daily auto-backup")}
      </h2>
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
          {restoreArm
            ? tx(lang, "بله، برگردان", "Yes, restore it")
            : tx(lang, "بازیابی آخرین پشتیبان", "Restore the last backup")}
        </Btn>
      </div>
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        dir="ltr"
        type="number"
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
