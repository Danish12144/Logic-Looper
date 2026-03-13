import { CloudOff, Wifi } from "lucide-react";

export default function OfflineBadge({ isOnline, syncStatus }) {
  const syncing = syncStatus === "syncing";

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium"
      data-testid="offline-sync-indicator"
    >
      {isOnline ? (
        <>
          <Wifi className="h-3.5 w-3.5 text-primary" />
          <span data-testid="offline-sync-indicator-online-text">
            {syncing ? "Syncing..." : "Online"}
          </span>
        </>
      ) : (
        <>
          <CloudOff className="h-3.5 w-3.5 text-accent" />
          <span data-testid="offline-sync-indicator-offline-text">Offline Mode</span>
        </>
      )}
    </div>
  );
}