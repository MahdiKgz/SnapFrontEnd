import { BrainCircuit } from "lucide-react";

export function ToolPlaceholder() {
  return (
    <div className="rounded-xl border border-border bg-card/70 p-4 text-center">
      <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
        <BrainCircuit className="size-5" />
      </span>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        این ابزار در نسخه نمایشی به‌زودی در دسترس قرار می‌گیرد.
      </p>
    </div>
  );
}
