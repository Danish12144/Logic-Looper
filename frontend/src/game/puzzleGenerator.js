import { PUZZLE_TYPES } from "../constants/puzzleTypes";
import { addDaysToKey, getDayOfYear } from "../utils/date";
import { sha256 } from "js-sha256";

const symbols = ["◆", "▲", "■", "●", "✦", "⬢"];
const PUZZLE_SECRET_KEY = process.env.REACT_APP_PUZZLE_SECRET_KEY;

if (!PUZZLE_SECRET_KEY) {
  throw new Error("REACT_APP_PUZZLE_SECRET_KEY is required for SHA256 puzzle seed generation");
}

const seedFromString = (dayKey) => {
  const digest = sha256(`${dayKey}-${PUZZLE_SECRET_KEY}`);
  return Number.parseInt(digest.slice(0, 8), 16);
};

const createRng = (seedValue) => {
  let seed = seedValue;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
};

const pick = (rng, list) => list[Math.floor(rng() * list.length)];

const difficultyLevel = (dayKey) => {
  const day = getDayOfYear(dayKey);
  if (day < 90) return "Easy";
  if (day < 220) return "Medium";
  return "Hard";
};

const createNumberMatrix = (rng) => {
  const rowBase = Math.floor(rng() * 7) + 2;
  const colBase = Math.floor(rng() * 5) + 3;
  const start = Math.floor(rng() * 10) + 4;
  const matrix = Array.from({ length: 3 }, (_, r) =>
    Array.from({ length: 3 }, (_, c) => start + rowBase * r + colBase * c),
  );
  const missingIndex = Math.floor(rng() * 9);
  const missingRow = Math.floor(missingIndex / 3);
  const missingCol = missingIndex % 3;
  const answer = matrix[missingRow][missingCol];
  matrix[missingRow][missingCol] = null;

  const options = [answer, answer + rowBase, answer - colBase, answer + colBase + 2]
    .map((value) => Math.max(value, 1))
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .slice(0, 4)
    .sort(() => rng() - 0.5);

  return {
    prompt: "Complete the matrix by selecting the missing value.",
    data: { matrix },
    options,
    solution: answer,
    hint: "Rows and columns both increase with fixed steps.",
  };
};

const createPatternPuzzle = (rng) => {
  const patternLength = 3;
  const base = Array.from({ length: patternLength }, () => pick(rng, symbols));
  const sequence = Array.from({ length: 7 }, (_, index) => base[index % patternLength]);
  const missingIndex = Math.floor(rng() * sequence.length);
  const answer = sequence[missingIndex];
  sequence[missingIndex] = "?";

  const options = [answer, ...symbols.filter((item) => item !== answer).slice(0, 3)].sort(
    () => rng() - 0.5,
  );

  return {
    prompt: "Identify the missing symbol in the repeating pattern.",
    data: { sequence },
    options,
    solution: answer,
    hint: "The pattern cycles every 3 symbols.",
  };
};

const createSequenceSolver = (rng, dayKey) => {
  const day = getDayOfYear(dayKey);
  const useMultiplier = day > 120 && rng() > 0.55;
  let sequence = [];
  let answer = 0;
  let hint = "";

  if (useMultiplier) {
    const start = Math.floor(rng() * 4) + 2;
    const multiplier = Math.floor(rng() * 2) + 2;
    sequence = [start, start * multiplier, start * multiplier ** 2, start * multiplier ** 3];
    answer = start * multiplier ** 4;
    hint = "Each value is multiplied by the same number.";
  } else {
    const start = Math.floor(rng() * 20) + 5;
    const step = Math.floor(rng() * 7) + 2;
    sequence = [start, start + step, start + step * 2, start + step * 3];
    answer = start + step * 4;
    hint = "This sequence increases with a constant difference.";
  }

  const options = [answer, answer + 2, answer - 2, answer + 5]
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort(() => rng() - 0.5);

  return {
    prompt: "Choose the next value in the sequence.",
    data: { sequence },
    options,
    solution: answer,
    hint,
  };
};

const createBinaryLogic = (rng) => {
  const operators = ["AND", "OR", "XOR"];
  const operator = pick(rng, operators);
  const rows = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ];

  const evaluate = (left, right) => {
    if (operator === "AND") return left & right;
    if (operator === "OR") return left | right;
    return left ^ right;
  };

  const answers = rows.map(([left, right]) => evaluate(left, right));
  const missingIndex = Math.floor(rng() * rows.length);
  const solution = answers[missingIndex];

  return {
    prompt: `Fill the missing output for ${operator}.`,
    data: {
      operator,
      rows: rows.map((row, index) => ({
        left: row[0],
        right: row[1],
        result: index === missingIndex ? "?" : answers[index],
      })),
    },
    options: [0, 1],
    solution,
    hint: `${operator} follows standard binary logic for each input pair.`,
  };
};
const createSymbolGrid = (rng) => {
  const S = ["◆", "▲"];
  const grid = Array.from({ length: 4 }, () => Array(4).fill(null));

  const isValid = (g, row, col, symbol) => {
    const rowCount = g[row].filter((c) => c === symbol).length;
    const colCount = g.map((r) => r[col]).filter((c) => c === symbol).length;
    if (col >= 2 && g[row][col-1] === symbol && g[row][col-2] === symbol) return false;
    if (col >= 1 && col < 3 && g[row][col-1] === symbol && g[row][col+1] === symbol) return false;
    if (row >= 2 && g[row-1][col] === symbol && g[row-2][col] === symbol) return false;
    if (row >= 1 && row < 3 && g[row-1][col] === symbol && g[row+1] && g[row+1][col] === symbol) return false;
    return rowCount < 2 && colCount < 2;
  };

  const fill = (g, row, col) => {
    if (row === 4) return true;
    const nextRow = col === 3 ? row + 1 : row;
    const nextCol = col === 3 ? 0 : col + 1;
    const order = rng() > 0.5 ? [S[0], S[1]] : [S[1], S[0]];
    for (const sym of order) {
      if (isValid(g, row, col, sym)) {
        g[row][col] = sym;
        if (fill(g, nextRow, nextCol)) return true;
        g[row][col] = null;
      }
    }
    return false;
  };

  fill(grid, 0, 0);

  const solution = grid.map((row) => [...row]);
  const allCells = Array.from({ length: 16 }, (_, i) => i);
  const shuffled = allCells.sort(() => rng() - 0.5);
  const hiddenCells = shuffled.slice(0, 8).map((idx) => `${Math.floor(idx / 4)}-${idx % 4}`);
  hiddenCells.forEach((key) => {
    const [r, c] = key.split("-").map(Number);
    grid[r][c] = null;
  });

  return {
    prompt: "Fill the grid: each row and column must have exactly 2 of each symbol. No 3 same in a row.",
    data: { grid, hiddenCells },
    options: ["◆", "▲"],
    solution: JSON.stringify(solution),
    hint: "Start with rows or columns that already have one symbol placed.",
  };
};

export const validatePuzzleAnswer = (puzzle, answer) => `${puzzle.solution}` === `${answer}`;

export const generatePuzzle = (dayKey, puzzleType) => {
  const seed = seedFromString(`${dayKey}-${puzzleType}`);
  const rng = createRng(seed);

  let generated;
  if (puzzleType === "number_matrix") generated = createNumberMatrix(rng);
  else if (puzzleType === "pattern_matching") generated = createPatternPuzzle(rng);
  else if (puzzleType === "sequence_solver") generated = createSequenceSolver(rng, dayKey);
  else if (puzzleType === "symbol_grid") generated = createSymbolGrid(rng);
  else generated = createBinaryLogic(rng);

  return {
    id: `${dayKey}-${puzzleType}`,
    dayKey,
    type: puzzleType,
    difficulty: difficultyLevel(dayKey),
    ...generated,
  };
};

export const generatePuzzleWindow = (startDayKey, days = 8) => {
  const windowData = {};
  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const dayKey = addDaysToKey(startDayKey, dayOffset);
    windowData[dayKey] = PUZZLE_TYPES.map((type) => generatePuzzle(dayKey, type.id));
  }
  return windowData;
};
