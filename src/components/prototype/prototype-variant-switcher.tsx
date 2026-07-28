"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export type PrototypeVariant = "A" | "B" | "C";

const variants: PrototypeVariant[] = ["A", "B", "C"];

const labels: Record<PrototypeVariant, string> = {
  A: "Operations ledger",
  B: "Production board",
  C: "Studio pulse",
};

export function PrototypeVariantSwitcher({
  variant,
  onChange,
}: {
  variant: PrototypeVariant;
  onChange: (variant: PrototypeVariant) => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing =
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";

      if (isEditing || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;

      event.preventDefault();
      const currentIndex = variants.indexOf(variant);
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (currentIndex + direction + variants.length) % variants.length;
      onChange(variants[nextIndex]);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onChange, variant]);

  if (process.env.NODE_ENV === "production") return null;

  const currentIndex = variants.indexOf(variant);
  const previous = variants[(currentIndex - 1 + variants.length) % variants.length];
  const next = variants[(currentIndex + 1) % variants.length];

  return (
    <div
      aria-label="Dashboard prototype variant"
      className="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/12 bg-[#0b0f14]/92 p-1.5 text-white shadow-[0_18px_60px_rgba(0,0,0,0.38)] backdrop-blur-xl"
      role="group"
    >
      <Button
        aria-label={`Show variant ${previous}`}
        className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        onClick={() => onChange(previous)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ArrowLeft className="size-3.5" />
      </Button>
      <div className="min-w-[180px] px-3 text-center">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#2dd4bf]">
          Prototype {variant}
        </p>
        <p className="mt-0.5 text-xs font-medium text-white">{labels[variant]}</p>
      </div>
      <Button
        aria-label={`Show variant ${next}`}
        className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        onClick={() => onChange(next)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ArrowRight className="size-3.5" />
      </Button>
    </div>
  );
}
