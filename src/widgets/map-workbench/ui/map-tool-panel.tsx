import type { ReactNode } from "react";

import { BadgeCheck, BrainCircuit, LayoutDashboard, PanelLeftClose, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

import { MAP_TOOLS, type MapToolId } from "../model/map-tools";

const TOOL_ICONS = {
  topology: Wrench,
  "smart-analysis": BrainCircuit,
  "layer-quality": BadgeCheck,
} satisfies Record<MapToolId, typeof Wrench>;

interface MapToolPanelProps {
  activeTool: MapToolId | null;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: MapToolId) => void;
}

const tooltipClassName =
  "pointer-events-none absolute left-auto right-[calc(100%+0.75rem)] top-1/2 z-50 w-max -translate-y-1/2 translate-x-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-slate-100 opacity-0 shadow-xl transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100";

export function MapToolPanel({
  activeTool,
  children,
  isOpen,
  onClose,
  onSelectTool,
}: MapToolPanelProps) {
  const selectedTool = MAP_TOOLS.find((tool) => tool.id === activeTool);

  return (
    <aside
      aria-label="ابزارهای نقشه"
      className="fixed right-6 top-1/2 z-20 h-[min(34rem,calc(100dvh-2rem))] -translate-y-1/2"
    >
      <section
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`absolute inset-y-0 right-14 z-10 overflow-hidden border-y border-l border-slate-700/70 bg-slate-950/95 shadow-[0_24px_70px_-20px_rgba(2,6,23,0.8)] backdrop-blur-xl transition-[width,opacity] duration-500 ease-in-out ${
          isOpen
            ? "w-[min(22rem,calc(100vw-6.5rem))] rounded-l-2xl opacity-100"
            : "pointer-events-none w-0 opacity-0"
        }`}
      >
        <div className="flex h-full w-[min(22rem,calc(100vw-6.5rem))] flex-col" dir="rtl">
          <header className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
            <h2 className="min-w-0 truncate text-sm font-bold text-slate-100">
              {selectedTool?.label}
            </h2>
            <button
              type="button"
              aria-label="بستن فرم"
              title="بستن فرم"
              onClick={onClose}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <PanelLeftClose className="size-5 rotate-180" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </section>

      <div
        className={`relative z-20 flex h-full w-14 flex-col justify-between overflow-visible border border-slate-700/70 bg-slate-950/95 shadow-[0_24px_70px_-20px_rgba(2,6,23,0.8)] backdrop-blur-xl transition-[border-radius] duration-500 ${
          isOpen ? "rounded-r-2xl" : "rounded-2xl"
        }`}
        dir="rtl"
      >
        <nav aria-label="انتخاب ابزار" className="space-y-2 p-2">
          {MAP_TOOLS.map((tool) => {
            const Icon = TOOL_ICONS[tool.id];
            const isActive = activeTool === tool.id;

            return (
              <button
                key={tool.id}
                type="button"
                aria-pressed={isActive}
                aria-label={tool.label}
                onClick={() => onSelectTool(tool.id)}
                className={`group relative flex h-10 w-full items-center justify-center rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isActive
                    ? "bg-emerald-500 font-semibold text-white shadow-[0_8px_22px_-10px_rgba(16,185,129,0.9)]"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="size-5 shrink-0" />
                <span role="tooltip" className={tooltipClassName}>
                  {tool.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-2">
          <Link
            to="/dashboard"
            aria-label="رفتن به داشبورد"
            className="group relative flex h-10 w-full items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <LayoutDashboard className="size-5" />
            <span role="tooltip" className={tooltipClassName}>
              رفتن به داشبورد
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
