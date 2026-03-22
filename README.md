# Logic Looper 🧩

A daily logic puzzle game where one unique puzzle is generated every day based on the current date. Every player in the world gets the same puzzle on the same day.

**Live Demo:** [logic-looper-theta.vercel.app](https://logic-looper-theta.vercel.app)

---

## Features

- **5 Puzzle Types** — Number Matrix, Pattern Matching, Sequence Solver, Binary Logic, and Symbol Grid (interactive 4x4 grid)
- **Offline-First** — Puzzles are generated on-device using date-based seed. No internet required to play
- **Daily Streaks** — Track your streak with midnight local reset and hint limits
- **Guest & Google Login** — JWT-based auth. Play instantly as guest or sign in with Google
- **Global Leaderboard** — Compete with players worldwide based on total score
- **Stats Dashboard** — Heatmap, streak history, total score, and solve count
- **PWA Ready** — Service Worker caches app shell for fast reloads
- **Mobile-First** — Fully responsive across all screen sizes

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (CRA + Craco), Redux Toolkit, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python), PyMongo / Motor, JWT Auth |
| Database | MongoDB Atlas |
| Deployment | Vercel (frontend), Render (backend) |
| Monitoring | UptimeRobot (keep-alive pings) |

---

## Project Structure

```
Logic-Looper/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── auth/          # AuthPanel, Google OAuth
│       │   ├── game/          # PuzzleBoard, PuzzleCard, SymbolGridPuzzle
│       │   ├── layout/        # GameLayout, navigation
│       │   └── ui/            # Button, Input (shadcn)
│       ├── pages/             # HomePage, PlayPage, DashboardPage, LeaderboardPage, SettingsPage
│       ├── store/             # Redux slices — auth, game, leaderboard, settings
│       ├── services/          # api.js (axios), db.js (IndexedDB)
│       ├── game/              # puzzleGenerator.js — all 5 puzzle types
│       ├── constants/         # puzzleTypes.js
│       └── utils/             # date.js, streak.js
└── backend/
    └── server.py              # FastAPI app — all routes and models
```

---

## Puzzle Types

| Puzzle | Description |
|--------|-------------|
| Number Matrix | Find the missing value in a 3x3 logic matrix |
| Pattern Matching | Identify the missing symbol in a repeating sequence |
| Sequence Solver | Predict the next value in a number chain |
| Binary Logic | Evaluate a truth table with a missing output |
| Symbol Grid | Fill a 4x4 grid so each row and column has exactly 2 of each symbol |

---

## How It Works

1. Puzzle is generated on-device using `SHA256(date + secret_key)` as seed
2. Player solves puzzles offline — progress saved to IndexedDB
3. After each solve, score is synced to FastAPI backend
4. MongoDB Atlas stores user data, scores, and streaks
5. Leaderboard fetched live from backend

---

## Environment Variables

### Frontend (`.env`)
```
REACT_APP_BACKEND_URL=https://logic-looper-1.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_PUZZLE_SECRET_KEY=your_secret_key
```

### Backend (`.env`)
```
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
DB_NAME=logic_looper
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
CORS_ORIGINS=https://logic-looper-theta.vercel.app
```

---

## Running Locally

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```

---

## Deployment

- **Frontend** → Push to `main` branch → Vercel auto-deploys
- **Backend** → Push to `main` branch → Render auto-deploys
- **Database** → MongoDB Atlas M0 free tier, IP Access set to `0.0.0.0/0` for Render's dynamic IPs

---

## Challenges Solved

**Render Cold Start** — Free tier spins down after inactivity. Fixed with UptimeRobot pinging every 5 minutes.

**CORS Configuration** — Configured FastAPI CORSMiddleware with correct allowed origins for Vercel domain.

**MongoDB Atlas SSL** — Render's dynamic IPs were blocked by Atlas IP Access List. Fixed by allowing `0.0.0.0/0`.

---

