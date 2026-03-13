import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Trophy, Target, Zap } from "lucide-react";
import GameLayout from "../components/layout/GameLayout";
import Heatmap365 from "../components/game/Heatmap365";
import { getAllDailyActivities } from "../services/db";
import { fetchHeatmap } from "../services/api";

export default function DashboardPage() {
  const { user, token } = useSelector((state) => state.auth);
  const solvedToday = Object.keys(useSelector((state) => state.game.solvedById)).length;
  const [activities, setActivities] = useState({});

  useEffect(() => {
    const hydrate = async () => {
      const local = await getAllDailyActivities();
      let merged = { ...local };

      if (token) {
        try {
          const remote = await fetchHeatmap(token);
          remote.points.forEach((point) => {
            merged[point.day_key] = {
              ...(merged[point.day_key] || {}),
              completed: point.completed,
              score: point.score,
              difficulty: point.difficulty,
              synced: true,
            };
          });
        } catch {
          // silent fallback to local-only heatmap
        }
      }

      setActivities(merged);
    };
    hydrate();
  }, [solvedToday, token]);

  return (
    <GameLayout title="Progress Dashboard" subtitle="Track streak power, score growth, and daily completion.">
      <section className="grid gap-4 md:grid-cols-3" data-testid="dashboard-metrics-grid">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5" data-testid="dashboard-card-streak">
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
            <Zap className="h-4 w-4 text-accent" /> Current streak
          </p>
          <p className="text-3xl font-black" data-testid="dashboard-current-streak-value">
            {user?.streak ?? 0}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5" data-testid="dashboard-card-score">
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
            <Trophy className="h-4 w-4 text-primary" /> Total score
          </p>
          <p className="text-3xl font-black" data-testid="dashboard-total-score-value">
            {user?.total_score ?? 0}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5" data-testid="dashboard-card-solved">
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-secondary" /> Solved today
          </p>
          <p className="text-3xl font-black" data-testid="dashboard-solved-today-value">
            {solvedToday}
          </p>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5" data-testid="dashboard-insight-panel">
        <h2 className="mb-2 text-lg font-bold" data-testid="dashboard-insight-title">
          Retention insight
        </h2>
        <p className="text-sm text-white/75" data-testid="dashboard-insight-text">
          Keep your streak active by solving at least one puzzle every day before midnight local time.
        </p>
      </section>

      <div className="mt-6" data-testid="dashboard-heatmap-container">
        <Heatmap365 activities={activities} />
      </div>
    </GameLayout>
  );
}