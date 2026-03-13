import { Flame } from "lucide-react";

export default function StreakBadge({ streak = 0 }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-gradient-to-r from-accent/20 to-secondary/20 px-4 py-1.5 text-sm font-semibold text-accent"
      data-testid="streak-counter-badge"
    >
      <Flame className="h-4 w-4" />
      <span data-testid="streak-counter-value">{streak} day streak</span>
    </div>
  );
}