import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import GameLayout from "../components/layout/GameLayout";
import PuzzleCard from "../components/game/PuzzleCard";
import PuzzleBoard from "../components/game/PuzzleBoard";
import {
  hydrateDay,
  incrementHintUsage,
  markBatchSynced,
  markPuzzleSolved,
  selectPuzzle,
  setSyncStatus,
} from "../store/gameSlice";
import { applyStatsUpdate } from "../store/authSlice";
import {
  cacheDailyPuzzles,
  getAllDailyActivities,
  getCachedDailyPuzzles,
  loadDailyProgress,
  saveDailyActivity,
  saveDailyProgress,
} from "../services/db";
import { syncDailyScore } from "../services/api";
import { generatePuzzleWindow } from "../game/puzzleGenerator";
import { getLocalDayKey } from "../utils/date";
import { calculateStreakFromDays } from "../utils/streak";

export default function PlayPage() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const settings = useSelector((state) => state.settings);
  const [activityMap, setActivityMap] = useState({});
  const {
    dayKey,
    puzzles,
    selectedPuzzleId,
    hydrationComplete,
    solvedById,
    hintsUsed,
    hintLimit,
    pendingEvents,
    isOnline,
  } = useSelector((state) => state.game);

  const selectedPuzzle = useMemo(
    () => puzzles.find((item) => item.id === selectedPuzzleId) || puzzles[0] || null,
    [puzzles, selectedPuzzleId],
  );

  useEffect(() => {
    const hydrate = async () => {
      const todayKey = getLocalDayKey();
      let todayPuzzles = await getCachedDailyPuzzles(todayKey);
      if (!todayPuzzles) {
        const lazyWindow = generatePuzzleWindow(todayKey, 8);
        await Promise.all(
          Object.entries(lazyWindow).map(([key, value]) => cacheDailyPuzzles(key, value)),
        );
        todayPuzzles = lazyWindow[todayKey];
      }

      const progress = await loadDailyProgress(todayKey);
      const activities = await getAllDailyActivities();
      setActivityMap(activities);
      dispatch(hydrateDay({ dayKey: todayKey, puzzles: todayPuzzles, progress }));
    };

    hydrate();
  }, [dispatch]);

  useEffect(() => {
    if (!dayKey || !hydrationComplete) return;
    saveDailyProgress(dayKey, { solvedById, hintsUsed, pendingEvents });
  }, [dayKey, hydrationComplete, solvedById, hintsUsed, pendingEvents]);

  useEffect(() => {
    const dayTimer = setInterval(async () => {
      const currentDay = getLocalDayKey();
      if (currentDay !== dayKey) {
        let dailyPuzzles = await getCachedDailyPuzzles(currentDay);
        if (!dailyPuzzles) {
          const lazyWindow = generatePuzzleWindow(currentDay, 8);
          await Promise.all(
            Object.entries(lazyWindow).map(([key, value]) => cacheDailyPuzzles(key, value)),
          );
          dailyPuzzles = lazyWindow[currentDay];
        }
        const progress = await loadDailyProgress(currentDay);
        const activities = await getAllDailyActivities();
        setActivityMap(activities);
        dispatch(hydrateDay({ dayKey: currentDay, puzzles: dailyPuzzles, progress }));
      }
    }, 60000);
    return () => clearInterval(dayTimer);
  }, [dayKey, dispatch]);

  useEffect(() => {
    if (!token || !isOnline || pendingEvents.length === 0) return;

    const sync = async () => {
      dispatch(setSyncStatus("syncing"));
      try {
        const eventToSync = pendingEvents[0];
        const response = await syncDailyScore(token, eventToSync);
        dispatch(markBatchSynced(1));
        dispatch(applyStatsUpdate(response));

        const existing = await getAllDailyActivities();
        const current = existing[eventToSync.day_key] || {};
        await saveDailyActivity(eventToSync.day_key, {
          ...current,
          completed: true,
          synced: true,
          score: Math.max(current.score || 0, eventToSync.score),
          difficulty: current.difficulty || selectedPuzzle?.difficulty || "Easy",
          updatedAt: new Date().toISOString(),
        });
        setActivityMap((prev) => ({
          ...prev,
          [eventToSync.day_key]: {
            ...current,
            completed: true,
            synced: true,
            score: Math.max(current.score || 0, eventToSync.score),
            difficulty: current.difficulty || selectedPuzzle?.difficulty || "Easy",
            updatedAt: new Date().toISOString(),
          },
        }));

        dispatch(setSyncStatus("idle"));
        toast.success("Progress synced.");
      } catch {
        dispatch(setSyncStatus("error"));
      }
    };

    sync();
  }, [pendingEvents, token, isOnline, dispatch, selectedPuzzle?.difficulty]);

  const onPuzzleSolved = async (secondsSpent) => {
    if (!selectedPuzzle) return;
    const score = Math.max(80, 220 - secondsSpent * 2 - hintsUsed * 5);
    const eventPayload = {
      puzzle_id: selectedPuzzle.id,
      puzzle_type: selectedPuzzle.type,
      day_key: dayKey,
      score,
      time_spent_seconds: secondsSpent,
      hints_used: hintsUsed,
      completed_at: new Date().toISOString(),
    };

    dispatch(markPuzzleSolved({ puzzleId: selectedPuzzle.id, eventPayload }));

    const existing = await getAllDailyActivities();
    await saveDailyActivity(dayKey, {
      ...(existing[dayKey] || {}),
      completed: true,
      score,
      difficulty: selectedPuzzle.difficulty,
      synced: false,
      updatedAt: new Date().toISOString(),
    });
    setActivityMap((prev) => ({
      ...prev,
      [dayKey]: {
        ...(prev[dayKey] || {}),
        completed: true,
        score,
        difficulty: selectedPuzzle.difficulty,
        synced: false,
        updatedAt: new Date().toISOString(),
      },
    }));

    const completedDays = Object.entries(existing)
      .filter(([, value]) => value?.completed)
      .map(([key]) => key);
    if (!completedDays.includes(dayKey)) completedDays.push(dayKey);

    const localStreak = calculateStreakFromDays(completedDays, dayKey);
    const currentSolved = (user?.total_solved || 0) + 1;
    const currentScore = (user?.total_score || 0) + score;
    dispatch(
      applyStatsUpdate({
        streak: localStreak,
        longest_streak: Math.max(user?.longest_streak || 0, localStreak),
        total_solved: currentSolved,
        total_score: currentScore,
      }),
    );

    toast.success("Puzzle solved! Great loop.");
  };

  const onUseHint = () => {
    dispatch(incrementHintUsage());
  };

  const onSelectPuzzle = (puzzleId) => {
    dispatch(selectPuzzle(puzzleId));
  };

  const completed = Object.keys(solvedById).length;
  const recentDays = Array.from({ length: 7 }, (_, idx) => {
    const day = new Date();
    day.setDate(day.getDate() - idx);
    return getLocalDayKey(day);
  });

  return (
    <GameLayout title="Daily Loop" subtitle="Current day + next 7 are lazy-loaded and available offline.">
      <section className="grid gap-6 lg:grid-cols-[360px_1fr]" data-testid="play-page-main-grid">
        <aside className="space-y-3" data-testid="play-page-puzzle-list">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4" data-testid="play-page-progress-summary">
            <p className="text-xs uppercase tracking-wide text-white/60" data-testid="play-page-day-key">
              {dayKey}
            </p>
            <p className="mt-2 text-lg font-semibold" data-testid="play-page-completion-count">
              {completed}/{puzzles.length} solved today
            </p>
            <p className="text-sm text-white/70" data-testid="play-page-hints-remaining">
              Hints remaining: {Math.max(hintLimit - hintsUsed, 0)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4" data-testid="daily-unlock-strip">
            <p className="mb-3 text-xs uppercase text-white/60">Daily Unlocks</p>
            <div className="space-y-2">
              {recentDays.map((key) => {
                const isToday = key === dayKey;
                const isCompleted = Boolean(activityMap[key]?.completed);
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      isToday ? "bg-primary/20" : "bg-black/20"
                    }`}
                    data-testid={`unlock-row-${key}`}
                  >
                    <span>{key}</span>
                    <span className="text-xs text-white/70" data-testid={`unlock-row-${key}-status`}>
                      {isToday ? "Unlocked" : isCompleted ? "Completed" : "Locked"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {puzzles.map((puzzle) => (
            <PuzzleCard
              key={puzzle.id}
              puzzle={puzzle}
              isSolved={Boolean(solvedById[puzzle.id])}
              isActive={selectedPuzzle?.id === puzzle.id}
              onSelect={onSelectPuzzle}
            />
          ))}
        </aside>

        <div data-testid="play-page-board-container">
          {selectedPuzzle && (
            <PuzzleBoard
              puzzle={selectedPuzzle}
              solved={Boolean(solvedById[selectedPuzzle.id])}
              hintsRemaining={Math.max(hintLimit - hintsUsed, 0)}
              timedChallenge={settings.timedChallenge}
              reducedMotion={settings.reducedMotion}
              onUseHint={onUseHint}
              onSolve={onPuzzleSolved}
            />
          )}
        </div>
      </section>
    </GameLayout>
  );
}