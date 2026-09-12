import type { TopologyDryRunReport } from "../model/types";

export function CadImportNotice({ report }: { report?: TopologyDryRunReport["cadImport"] }) {
  if (!report?.warnings.length) return null;
  return (
    <aside
      aria-label="هشدارهای خواندن فایل CAD"
      className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-6 text-amber-800 dark:text-amber-200"
    >
      <h2 className="font-bold">
        {report.partial ? "بخشی از محتوای CAD خوانده نشده" : "فایل CAD با هشدار خوانده شد"}
      </h2>
      <p className="mt-1">
        {report.partial
          ? "نتایج تحلیل و ترمیم فقط مربوط به عارضه‌های خوانده‌شده است. پیش از استفاده از خروجی نهایی، نقشه را با فایل اصلی تطبیق دهید."
          : "بعضی مرزها با ساختار جایگزین خوانده شده‌اند؛ شکل و توپولوژی آن‌ها را در نتایج بررسی کنید."}
      </p>
      {report.warnings.some((w) => w.code === "CAD_MISSING_BLOCK") && (
        <p className="mt-2">تعریف یک یا چند Block پیدا نشد و محتوای آن‌ها در نقشهٔ واردشده نیست.</p>
      )}
      {report.partial && report.warnings.some((w) => w.code === "CAD_POLYGON_FALLBACK") && (
        <p className="mt-2">
          ساختار بعضی مرزهای پلیگون نیز هنگام خواندن تغییر کرده و نیازمند بررسی است.
        </p>
      )}
      <details className="mt-2">
        <summary className="cursor-pointer font-medium">جزئیات هشدارها</summary>
        <ul className="mt-2 space-y-2" dir="ltr">
          {report.warnings.map((warning, index) => (
            <li className="break-words text-left text-[11px]" key={`${warning.code}-${index}`}>
              {warning.message}
            </li>
          ))}
        </ul>
      </details>
    </aside>
  );
}
