import { EyeOff } from "lucide-react";
import type { SegmentResult } from "@/lib/results/segments";
import { suppressionText } from "./segment-utils";

/** Lists groups withheld for confidentiality. Never shows their counts or scores. */
export function HiddenGroupsList({ groups, className }: { groups: SegmentResult[]; className?: string }) {
  if (groups.length === 0) return null;
  return (
    <div className={className}>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-navy-800">
        <EyeOff className="h-3.5 w-3.5 text-muted" aria-hidden />
        Hidden for privacy ({groups.length})
      </p>
      <ul className="mt-1.5 space-y-1 text-xs text-muted">
        {groups.map((g) => (
          <li key={g.key}>
            <span className="font-medium text-navy-800">{g.label}</span> — {suppressionText(g)}
          </li>
        ))}
      </ul>
    </div>
  );
}
