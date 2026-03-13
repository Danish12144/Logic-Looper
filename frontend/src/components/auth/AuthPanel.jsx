import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { guestLoginThunk, googleLoginThunk } from "../../store/authSlice";

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
console.log("Google Client:", googleClientId);
export default function AuthPanel() {
  const dispatch = useDispatch();
  const status = useSelector((state) => state.auth.status);
  const user = useSelector((state) => state.auth.user);
  const [guestName, setGuestName] = useState("");

  if (user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4" data-testid="auth-user-card">
        <p className="text-sm text-white/70" data-testid="auth-user-mode-label">
          Signed in as
        </p>
        <p className="font-semibold" data-testid="auth-user-name-value">{user.name}</p>
      </div>
    );
  }

  const continueAsGuest = async () => {
    if (guestName.trim().length < 2) {
      toast.error("Please enter at least 2 characters for guest name.");
      return;
    }
    try {
      await dispatch(guestLoginThunk(guestName.trim())).unwrap();
      toast.success("Guest profile created.");
    } catch {
      toast.error("Unable to continue as guest.");
    }
  };

  const onGoogleSuccess = async (response) => {
    if (!response.credential) return;
    try {
      await dispatch(googleLoginThunk(response.credential)).unwrap();
      toast.success("Google login successful.");
    } catch {
      toast.error("Google login failed.");
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl" data-testid="auth-panel-container">
      <div>
        <p className="font-semibold" data-testid="auth-panel-title">Sign in to save streaks</p>
        <p className="text-sm text-white/70" data-testid="auth-panel-description">
          Play as guest now, connect Google when credentials are set.
        </p>
      </div>

      <div className="space-y-2">
        <Input
          value={guestName}
          onChange={(event) => setGuestName(event.target.value)}
          placeholder="Guest name"
          className="border-white/20 bg-black/30"
          data-testid="guest-name-input"
        />
        <Button
          type="button"
          onClick={continueAsGuest}
          disabled={status === "loading"}
          className="w-full rounded-full bg-primary text-black hover:bg-primary/90"
          data-testid="guest-login-button"
        >
          Continue as guest
        </Button>
      </div>

      {googleClientId ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3" data-testid="google-login-wrapper">
          {/* REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH */}
          <GoogleLogin onSuccess={onGoogleSuccess} onError={() => toast.error("Google login cancelled.")} />
        </div>
      ) : (
        <p className="text-xs text-white/60" data-testid="google-login-disabled-message">
          Google OAuth is ready in code. Add REACT_APP_GOOGLE_CLIENT_ID to enable button.
        </p>
      )}
    </div>
  );
}