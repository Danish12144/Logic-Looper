import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LogOut } from "lucide-react";
import OfflineBadge from "../common/OfflineBadge";
import StreakBadge from "../game/StreakBadge";
import { Button } from "../ui/button";
import { logoutThunk } from "../../store/authSlice";

const NoiseOverlay = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.04;
  background-image: radial-gradient(#ffffff 0.6px, transparent 0.6px);
  background-size: 4px 4px;
`;

const navLinkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm transition-colors ${
    isActive ? "bg-primary text-black" : "bg-white/5 text-white/80 hover:bg-white/10"
  }`;

export default function GameLayout({ title, subtitle, children }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { isOnline, syncStatus } = useSelector((state) => state.game);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0F0818] text-white" data-testid="app-game-layout">
      <NoiseOverlay />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#1A0B2E,#0F0818)] p-5 backdrop-blur-xl" data-testid="top-navigation-shell">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl" data-testid="page-main-title">
                {title}
              </h1>
              <p className="text-sm text-white/70" data-testid="page-main-subtitle">
                {subtitle}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <OfflineBadge isOnline={isOnline} syncStatus={syncStatus} />
              <StreakBadge streak={user?.streak ?? 0} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav className="flex flex-wrap items-center gap-2" data-testid="main-route-navigation">
              <NavLink to="/" className={navLinkClass} data-testid="nav-link-home">
                Home
              </NavLink>
              <NavLink to="/play" className={navLinkClass} data-testid="nav-link-play">
                Play
              </NavLink>
              <NavLink to="/dashboard" className={navLinkClass} data-testid="nav-link-dashboard">
                Dashboard
              </NavLink>
              <NavLink to="/leaderboard" className={navLinkClass} data-testid="nav-link-leaderboard">
                Leaderboard
              </NavLink>
              <NavLink to="/settings" className={navLinkClass} data-testid="nav-link-settings">
                Settings
              </NavLink>
            </nav>

            <div className="flex items-center gap-2" data-testid="header-user-area">
              <span className="text-sm text-white/80" data-testid="header-user-label">
                {user ? user.name : "Not signed in"}
              </span>
              {user && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => dispatch(logoutThunk())}
                  className="rounded-full border-white/20"
                  data-testid="logout-button"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </header>

        <main data-testid="page-content-shell">{children}</main>
      </div>
    </div>
  );
}