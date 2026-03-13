import { motion } from "framer-motion";

export default function PuzzleCard({ puzzle, isSolved, isActive, onSelect }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(puzzle.id)}
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
        isActive
          ? "border-primary/70 bg-primary/10"
          : "border-white/10 bg-white/5 hover:border-primary/30"
      }`}
      data-testid={`puzzle-card-${puzzle.type}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="font-semibold" data-testid={`puzzle-card-${puzzle.type}-title`}>
          {puzzle.type.replaceAll("_", " ")}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            isSolved ? "bg-green-400/20 text-green-300" : "bg-white/10 text-white/70"
          }`}
          data-testid={`puzzle-card-${puzzle.type}-status`}
        >
          {isSolved ? "Solved" : "Pending"}
        </span>
      </div>
      <p className="text-xs text-white/70" data-testid={`puzzle-card-${puzzle.type}-difficulty`}>
        Difficulty: {puzzle.difficulty}
      </p>
    </motion.button>
  );
}