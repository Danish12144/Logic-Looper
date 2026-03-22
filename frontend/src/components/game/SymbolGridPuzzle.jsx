import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

export default function SymbolGridPuzzle({
  puzzle,
  solved,
  startedAt,
  setStartedAt,
  onSolve,
}) {
  const [playerGrid, setPlayerGrid] = useState(
    puzzle.data.grid.map((row) => [...row])
  );

  useEffect(() => {
    setPlayerGrid(puzzle.data.grid.map((row) => [...row]));
  }, [puzzle.id]);

  const toggleCell = (r, c) => {
    if (!puzzle.data.hiddenCells.includes(`${r}-${c}`)) return;
    if (!startedAt) setStartedAt(Date.now());
    setPlayerGrid((prev) => {
      const next = prev.map((row) => [...row]);
      const cur = next[r][c];
      next[r][c] = cur === null ? "◆" : cur === "◆" ? "▲" : null;
      return next;
    });
  };

  const checkSolution = () => {
    const filled = playerGrid.every((row) => row.every((c) => c !== null));
    if (!filled) {
      toast.error("Fill all empty cells first!");
      return;
    }
    if (JSON.stringify(playerGrid) === puzzle.solution) {
      const secondsSpent = startedAt
        ? Math.max(5, Math.floor((Date.now() - startedAt) / 1000))
        : 30;
      onSolve(secondsSpent);
    } else {
      toast.error("Not quite right. Keep trying!");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {playerGrid.map((row, r) =>
          row.map((cell, c) => {
            const isHidden = puzzle.data.hiddenCells.includes(`${r}-${c}`);
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => toggleCell(r, c)}
                disabled={solved || !isHidden}
                className={`aspect-square rounded-xl border text-2xl font-bold transition-all
                  ${isHidden
                    ? "cursor-pointer border-primary/40 bg-primary/10 hover:bg-primary/20 active:scale-95"
                    : "cursor-default border-white/10 bg-black/40"
                  }
                  ${cell === "◆" ? "text-cyan-400" : "text-purple-400"}
                `}
              >
                {cell ?? ""}
              </button>
            );
          })
        )}
      </div>

      <div className="flex justify-between text-xs text-white/50 px-1">
        <span>◆ ▲ — Tap empty cell to cycle</span>
        <span>2 of each per row and column</span>
      </div>

      {!solved && (
        <Button
          type="button"
          onClick={checkSolution}
          className="w-full rounded-full bg-primary text-black font-semibold"
        >
          Submit Grid
        </Button>
      )}

      {solved && (
        <p className="text-center text-green-400 font-semibold">
          Grid Solved! ✓
        </p>
      )}
    </div>
  );
}
