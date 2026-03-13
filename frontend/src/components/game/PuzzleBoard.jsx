import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";

const renderPuzzleData = (puzzle) => {
  if (puzzle.type === "number_matrix") {
    return (
      <div className="grid grid-cols-3 gap-2" data-testid="puzzle-number-matrix-grid">
        {puzzle.data.matrix.flat().map((value, index) => (
          <div
            key={index}
            className="flex aspect-square items-center justify-center rounded-lg border border-white/10 bg-black/30 font-mono text-lg"
            data-testid={`number-matrix-cell-${index}`}
          >
            {value ?? "?"}
          </div>
        ))}
      </div>
    );
  }

  if (puzzle.type === "pattern_matching") {
    return (
      <div className="flex flex-wrap gap-2" data-testid="puzzle-pattern-sequence-row">
        {puzzle.data.sequence.map((value, index) => (
          <span
            key={index}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/30 font-mono text-2xl"
            data-testid={`pattern-sequence-item-${index}`}
          >
            {value}
          </span>
        ))}
      </div>
    );
  }

  if (puzzle.type === "sequence_solver") {
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid="puzzle-sequence-row">
        {puzzle.data.sequence.map((value, index) => (
          <span
            key={index}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-lg"
            data-testid={`sequence-row-item-${index}`}
          >
            {value}
          </span>
        ))}
        <span className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-lg" data-testid="sequence-row-missing-item">
          ?
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="puzzle-binary-logic-table">
      <p className="text-sm text-white/80" data-testid="binary-operator-label">
        Operator: <span className="font-semibold">{puzzle.data.operator}</span>
      </p>
      {puzzle.data.rows.map((row, index) => (
        <div
          key={index}
          className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/30 p-2 font-mono"
          data-testid={`binary-row-${index}`}
        >
          <span data-testid={`binary-row-${index}-left`}>{row.left}</span>
          <span data-testid={`binary-row-${index}-right`}>{row.right}</span>
          <span data-testid={`binary-row-${index}-result`}>{row.result}</span>
        </div>
      ))}
    </div>
  );
};

export default function PuzzleBoard({
  puzzle,
  solved,
  hintsRemaining,
  timedChallenge,
  reducedMotion,
  onUseHint,
  onSolve,
}) {
  const [selected, setSelected] = useState(null);
  const [hintText, setHintText] = useState("");
  const [startedAt, setStartedAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(120);

  useEffect(() => {
    setSelected(null);
    setHintText("");
    setStartedAt(null);
    setRemainingSeconds(120);
  }, [puzzle.id]);

  useEffect(() => {
    if (!timedChallenge || solved || !startedAt) return;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timedChallenge, solved, startedAt]);

  useEffect(() => {
    if (remainingSeconds === 0 && !solved) {
      setSelected(null);
    }
  }, [remainingSeconds, solved]);

  const animationProps = useMemo(
    () => (reducedMotion ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }),
    [reducedMotion],
  );

  const handleHint = () => {
    if (hintsRemaining < 1) return;
    if (!startedAt) setStartedAt(Date.now());
    onUseHint();
    setHintText(puzzle.hint);
  };

  const handleOptionPick = (value) => {
    if (solved || remainingSeconds === 0) return;
    if (!startedAt) setStartedAt(Date.now());

    setSelected(value);
    if (`${value}` === `${puzzle.solution}`) {
      const origin = startedAt || Date.now();
      const secondsSpent = Math.max(5, Math.floor((Date.now() - origin) / 1000));
      onSolve(secondsSpent);
    } else {
      toast.error("Incorrect solution. Try again.");
    }
  };

  return (
    <motion.section
      {...animationProps}
      transition={{ duration: 0.35 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
      data-testid="active-puzzle-board"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold capitalize" data-testid="active-puzzle-title">
          {puzzle.type.replaceAll("_", " ")}
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-accent/20 px-2 py-1 text-accent" data-testid="active-puzzle-difficulty">
            {puzzle.difficulty}
          </span>
          {timedChallenge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/20 px-2 py-1 text-secondary" data-testid="active-puzzle-timer">
              <Timer className="h-3.5 w-3.5" />
              {remainingSeconds}s
            </span>
          )}
        </div>
      </div>

      <p className="mb-4 text-sm text-white/80" data-testid="active-puzzle-prompt">
        {puzzle.prompt}
      </p>

      <div className="mb-5">{renderPuzzleData(puzzle)}</div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {puzzle.options.map((option) => (
          <Button
            key={`${puzzle.id}-${option}`}
            type="button"
            variant={selected === option ? "secondary" : "outline"}
            onClick={() => handleOptionPick(option)}
            className="h-12 border-white/20 bg-white/5 text-base"
            data-testid={`answer-option-${option}`}
          >
            {option}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={handleHint}
          disabled={hintsRemaining < 1}
          className="rounded-full border border-white/20"
          data-testid="use-hint-button"
        >
          <Lightbulb className="mr-2 h-4 w-4" />
          Use hint ({hintsRemaining} left)
        </Button>
        <span className="text-sm" data-testid="active-puzzle-solved-state">
          {solved ? "Solved ✓" : "Awaiting answer"}
        </span>
      </div>

      {hintText && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm" data-testid="active-puzzle-hint-text">
          Hint: {hintText}
        </div>
      )}
    </motion.section>
  );
}