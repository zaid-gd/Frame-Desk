import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageToolbarProps = ComponentPropsWithoutRef<"div"> & {
  primary?: ReactNode;
  secondary?: ReactNode;
  sticky?: boolean;
};

export function PageToolbar({
  primary,
  secondary,
  sticky = false,
  className,
  children,
  ...props
}: PageToolbarProps) {
  return (
    <div
      data-slot="page-toolbar"
      className={cn(
        "flex min-h-11 min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
        sticky && "sticky top-0 z-20 border-b border-border bg-background/95 py-2 backdrop-blur",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {primary}
        {children}
      </div>
      {secondary ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {secondary}
        </div>
      ) : null}
    </div>
  );
}
