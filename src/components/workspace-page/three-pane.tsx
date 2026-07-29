import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ThreePaneProps = ComponentPropsWithoutRef<"div"> & {
  master: ReactNode;
  detail: ReactNode;
  inspector: ReactNode;
  density?: "default" | "compact";
};

export function ThreePane({
  master,
  detail,
  inspector,
  density = "default",
  className,
  ...props
}: ThreePaneProps) {
  return (
    <div
      data-slot="three-pane"
      data-density={density}
      className={cn(
        "grid min-h-0 min-w-0",
        density === "default" && "gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]",
        density === "compact" && "gap-0 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_300px]",
        className,
      )}
      {...props}
    >
      <div className="min-h-0 min-w-0">{master}</div>
      <div className="min-h-0 min-w-0">{detail}</div>
      <aside className="min-h-0 min-w-0 lg:col-span-2 xl:col-span-1">{inspector}</aside>
    </div>
  );
}
