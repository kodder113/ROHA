import { cn } from "@/lib/utils";

/**
 * Outline button for navy backgrounds. Defined separately because
 * `buttonClasses` concatenates without merging conflicting utilities.
 */
export function darkOutlineButton(size: "md" | "lg" = "lg", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-navy-500 font-medium text-white transition-all duration-150 hover:border-navy-300 hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400",
    size === "lg" ? "h-12 px-6 text-base" : "h-10 px-4 text-sm",
    className,
  );
}
