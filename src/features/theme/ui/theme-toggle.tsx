import { useSyncExternalStore } from "react";

import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

import { getTheme, setTheme, subscribeTheme } from "../model/theme-store";

export function ThemeToggle({
  className,
  showLabel = false,
  side = "bottom",
}: {
  className?: string;
  showLabel?: boolean;
  side?: "bottom" | "left";
}) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "light");
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = nextTheme === "dark" ? "تغییر به تم تیره" : "تغییر به تم روشن";
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <Tooltip content={label} side={side}>
      <button
        type="button"
        aria-label={label}
        onClick={() => setTheme(nextTheme)}
        className={cn(
          "flex size-10 shrink-0 items-center justify-center gap-3 rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          showLabel && "w-full justify-start px-4 text-sm",
          className,
        )}
      >
        <Icon className="size-5 shrink-0" />
        {showLabel && <span>{label}</span>}
      </button>
    </Tooltip>
  );
}
