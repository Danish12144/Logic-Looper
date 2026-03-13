import { motion } from "framer-motion";
import { generateHeatmapGrid } from "../../utils/heatmap";

const intensityClass = {
  0: "bg-white/5",
  1: "bg-primary/40",
  2: "bg-secondary/50",
  3: "bg-accent/60",
  4: "bg-green-400/80",
};

export default function Heatmap365({ activities }) {
  const columns = generateHeatmapGrid(activities);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4" data-testid="daily-heatmap-section">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold" data-testid="daily-heatmap-title">Daily Activity Heatmap</h3>
        <p className="text-xs text-white/70" data-testid="daily-heatmap-subtitle">365/366 day view</p>
      </div>

      <div className="overflow-x-auto" data-testid="daily-heatmap-grid-wrapper">
        <div className="flex gap-1 min-w-max pb-2">
          {columns.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-rows-7 gap-1">
              {week.map((cell) => (
                <motion.div
                  key={cell.dayKey}
                  layout
                  initial={{ scale: 0.8, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  title={`${cell.dayKey} • Level ${cell.intensity}`}
                  className={`h-3.5 w-3.5 rounded-sm ${intensityClass[cell.intensity]} ${
                    cell.isToday ? "ring-1 ring-white" : ""
                  }`}
                  data-testid={`heatmap-cell-${cell.dayKey}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/70" data-testid="daily-heatmap-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className={`h-3 w-3 rounded-sm ${intensityClass[level]}`} />
        ))}
        <span>More</span>
      </div>
    </section>
  );
}