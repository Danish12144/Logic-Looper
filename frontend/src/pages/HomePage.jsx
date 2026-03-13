import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Brain, Sparkles, Trophy } from "lucide-react";
import GameLayout from "../components/layout/GameLayout";
import AuthPanel from "../components/auth/AuthPanel";
import { Button } from "../components/ui/button";

const heroImage =
  "https://images.unsplash.com/photo-1733151451051-d24d64467b7f?auto=format&fit=crop&w=1400&q=80";

export default function HomePage() {
  return (
    <GameLayout
      title="Logic Looper"
      subtitle="365 date-seeded logic loops. Play daily, keep the streak burning."
    >
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]" data-testid="homepage-main-grid">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
          data-testid="homepage-hero-card"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden" data-testid="homepage-hero-image-container">
            <img
              src={heroImage}
              alt="Neon abstract puzzle world"
              className="h-full w-full object-cover object-center"
              data-testid="homepage-hero-image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0818] via-[#0F0818]/40 to-transparent" />
          </div>
          <div className="space-y-5 p-6">
            <h2 className="text-2xl font-bold sm:text-3xl" data-testid="homepage-hero-title">
              Brain gym meets arcade energy.
            </h2>
            <p className="max-w-xl text-sm text-white/80 sm:text-base" data-testid="homepage-hero-description">
              Deterministic daily puzzles are generated on your device, solved offline, and synced in batches for lightweight backend usage.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-primary px-6 text-black hover:bg-primary/90" data-testid="homepage-start-play-button">
                <Link to="/play">Start today&apos;s loop</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-white/20" data-testid="homepage-open-leaderboard-button">
                <Link to="/leaderboard">Open leaderboard</Link>
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6" data-testid="homepage-sidebar-stack">
          <AuthPanel />

          <div className="grid gap-3" data-testid="homepage-feature-cards-grid">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4" data-testid="feature-card-offline-first">
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
                <Brain className="h-4 w-4 text-primary" />
                Offline-first
              </p>
              <p className="text-xs text-white/70" data-testid="feature-card-offline-first-text">
                Cached in IndexedDB with compressed progress snapshots.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4" data-testid="feature-card-daily-streaks">
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-secondary" />
                Daily streaks
              </p>
              <p className="text-xs text-white/70" data-testid="feature-card-daily-streaks-text">
                Visual streak tracking with midnight local reset and hint limits.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4" data-testid="feature-card-leaderboard">
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
                <Trophy className="h-4 w-4 text-accent" />
                Lean sync model
              </p>
              <p className="text-xs text-white/70" data-testid="feature-card-leaderboard-text">
                Progress sync runs every 5 solved puzzles to keep writes minimal.
              </p>
            </div>
          </div>
        </div>
      </section>
    </GameLayout>
  );
}