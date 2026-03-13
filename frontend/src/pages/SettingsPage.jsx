import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import GameLayout from "../components/layout/GameLayout";
import { Button } from "../components/ui/button";
import { hydrateSettings, toggleReducedMotion, toggleTimedChallenge } from "../store/settingsSlice";
import { loadSettings, saveSettings } from "../services/db";

export default function SettingsPage() {
  const dispatch = useDispatch();
  const settings = useSelector((state) => state.settings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const bootstrapSettings = async () => {
      const stored = await loadSettings();
      dispatch(hydrateSettings(stored));
      setHydrated(true);
    };
    bootstrapSettings();
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated) return;
    saveSettings(settings);
  }, [hydrated, settings]);

  return (
    <GameLayout title="Settings" subtitle="Customize challenge mode and reduce motion for comfort.">
      <section className="space-y-4" data-testid="settings-page-stack">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5" data-testid="setting-card-timed-challenge">
          <p className="mb-1 font-semibold" data-testid="setting-timed-challenge-title">Timed challenge</p>
          <p className="mb-3 text-sm text-white/70" data-testid="setting-timed-challenge-description">
            Adds a 120 second timer to each puzzle.
          </p>
          <Button
            type="button"
            variant={settings.timedChallenge ? "secondary" : "outline"}
            onClick={() => dispatch(toggleTimedChallenge())}
            className="rounded-full border-white/20"
            data-testid="toggle-timed-challenge-button"
          >
            {settings.timedChallenge ? "Disable" : "Enable"} timed mode
          </Button>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5" data-testid="setting-card-reduced-motion">
          <p className="mb-1 font-semibold" data-testid="setting-reduced-motion-title">Reduced motion</p>
          <p className="mb-3 text-sm text-white/70" data-testid="setting-reduced-motion-description">
            Minimizes visual animation and transitions.
          </p>
          <Button
            type="button"
            variant={settings.reducedMotion ? "secondary" : "outline"}
            onClick={() => dispatch(toggleReducedMotion())}
            className="rounded-full border-white/20"
            data-testid="toggle-reduced-motion-button"
          >
            {settings.reducedMotion ? "Disable" : "Enable"} reduced motion
          </Button>
        </article>
      </section>
    </GameLayout>
  );
}