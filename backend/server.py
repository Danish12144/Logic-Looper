import logging
import os
import uuid
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, Request
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field, field_validator
from starlette.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")
GOOGLE_OAUTH_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID")

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
jwt_secret = os.environ["JWT_SECRET"]
db_name = os.environ["DB_NAME"]
google_client_id = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI(title="Logic Looper API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMITS = {"auth": 12, "leaderboard": 40}
rate_limit_cache: Dict[str, deque] = defaultdict(deque)


class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    mode: Literal["guest", "google"]
    name: str
    email: Optional[str] = None
    picture: Optional[str] = None
    streak: int = 0
    longest_streak: int = 0
    total_solved: int = 0
    total_score: int = 0


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


class GuestLoginRequest(BaseModel):
    name: str = Field(min_length=2, max_length=24)


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(min_length=10)


class PuzzleEvent(BaseModel):
    puzzle_id: str = Field(min_length=6, max_length=120)
    puzzle_type: Literal[
        "number_matrix",
        "pattern_matching",
        "sequence_solver",
        "binary_logic",
        "deduction_grid",
    ]
    day_key: str = Field(min_length=10, max_length=10)
    score: int = Field(ge=0, le=500)
    time_spent_seconds: int = Field(ge=0, le=3600)
    hints_used: int = Field(ge=0, le=3)
    completed_at: str = Field(min_length=20, max_length=40)

    @field_validator("day_key")
    @classmethod
    def validate_day_key(cls, value: str) -> str:
        try:
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError("day_key must be in YYYY-MM-DD format") from exc
        return value


class SyncProgressRequest(BaseModel):
    puzzle_events: List[PuzzleEvent] = Field(min_length=1, max_length=5)


class DailyScoreSyncRequest(BaseModel):
    puzzle_event: PuzzleEvent


class SyncProgressResponse(BaseModel):
    accepted: int
    streak: int
    longest_streak: int
    total_solved: int
    total_score: int
    writes_today: int


class LeaderboardEntry(BaseModel):
    rank: int
    name: str
    mode: str
    streak: int
    total_score: int
    total_solved: int


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    generated_at: str


class HeatmapPoint(BaseModel):
    day_key: str
    score: int
    difficulty: str
    completed: bool


class HeatmapResponse(BaseModel):
    points: List[HeatmapPoint]


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_token(user_id: str) -> str:
    expiry = datetime.now(timezone.utc) + timedelta(days=7)
    payload = {"sub": user_id, "exp": expiry}
    return jwt.encode(payload, jwt_secret, algorithm="HS256")


def parse_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    return authorization.split("Bearer ", maxsplit=1)[1].strip()


async def current_user(
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    token = parse_bearer_token(authorization)
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject")

    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return user_doc


def enforce_rate_limit(key: str, identifier: str) -> None:
    max_requests = RATE_LIMITS[key]
    cache_key = f"{key}:{identifier}"
    now = datetime.now(timezone.utc)
    request_queue = rate_limit_cache[cache_key]

    while request_queue and (now - request_queue[0]).total_seconds() > RATE_LIMIT_WINDOW_SECONDS:
        request_queue.popleft()

    if len(request_queue) >= max_requests:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded for {key}. Try again in a minute.",
        )
    request_queue.append(now)


def get_rate_limit_identifier(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    if request.client and request.client.host:
        return request.client.host

    return "unknown"


def calculate_streak(solved_dates: List[str]) -> int:
    if not solved_dates:
        return 0
    unique_sorted = sorted(set(solved_dates), reverse=True)
    today = datetime.now().date()
    first_date = datetime.strptime(unique_sorted[0], "%Y-%m-%d").date()
    if first_date == today:
        anchor = today
    elif first_date == today - timedelta(days=1):
        anchor = today - timedelta(days=1)
    else:
        return 0

    streak = 0
    for index, solved_day in enumerate(unique_sorted):
        solved_date = datetime.strptime(solved_day, "%Y-%m-%d").date()
        expected_day = anchor - timedelta(days=index)
        if solved_date == expected_day:
            streak += 1
        else:
            break
    return streak


def validate_puzzle_event_security(event: PuzzleEvent) -> None:
    day_date = datetime.strptime(event.day_key, "%Y-%m-%d").date()
    today = datetime.now().date()
    if day_date > today:
        raise HTTPException(status_code=400, detail="Future dates are not allowed")
    if event.time_spent_seconds < 5:
        raise HTTPException(status_code=400, detail="Unrealistic completion time")
    if event.score < 0 or event.score > 500:
        raise HTTPException(status_code=400, detail="Invalid score range")


def user_to_public(user_doc: Dict[str, Any]) -> UserPublic:
    return UserPublic(
        id=user_doc["id"],
        mode=user_doc["mode"],
        name=user_doc["name"],
        email=user_doc.get("email"),
        picture=user_doc.get("picture"),
        streak=user_doc.get("streak", 0),
        longest_streak=user_doc.get("longest_streak", 0),
        total_solved=user_doc.get("total_solved", 0),
        total_score=user_doc.get("total_score", 0),
    )


@api_router.get("/")
async def root() -> Dict[str, str]:
    return {"message": "Logic Looper API ready"}


@api_router.post("/auth/guest", response_model=AuthResponse)
async def guest_login(payload: GuestLoginRequest, request: Request) -> AuthResponse:
    enforce_rate_limit("auth", get_rate_limit_identifier(request))

    user_id = str(uuid.uuid4())
    now_iso = utc_now_iso()
    user_doc = {
        "id": user_id,
        "mode": "guest",
        "name": payload.name.strip(),
        "email": None,
        "picture": None,
        "streak": 0,
        "longest_streak": 0,
        "total_solved": 0,
        "total_score": 0,
        "solved_dates": [],
        "writes_today": 0,
        "writes_day_key": datetime.now().strftime("%Y-%m-%d"),
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    await db.users.insert_one(user_doc)
    return AuthResponse(token=create_token(user_id), user=user_to_public(user_doc))


@api_router.post("/auth/google", response_model=AuthResponse)
async def google_login(payload: GoogleLoginRequest, request: Request) -> AuthResponse:
    enforce_rate_limit("auth", get_rate_limit_identifier(request))

    if not google_client_id:
        raise HTTPException(
            status_code=503,
            detail="Google OAuth is not configured yet. Add GOOGLE_OAUTH_CLIENT_ID in backend .env.",
        )

    try:
        verification = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": payload.id_token},
            timeout=8,
        )
        verification.raise_for_status()
        token_data = verification.json()
    except requests.RequestException as exc:
        raise HTTPException(status_code=401, detail="Unable to verify Google token") from exc

    if token_data.get("aud") != google_client_id:
        raise HTTPException(status_code=401, detail="Google token audience mismatch")

    google_sub = token_data.get("sub")
    name = token_data.get("name") or "Google Player"
    email = token_data.get("email")
    picture = token_data.get("picture")
    if not google_sub:
        raise HTTPException(status_code=401, detail="Invalid Google token subject")

    existing_user = await db.users.find_one({"google_sub": google_sub}, {"_id": 0})
    if existing_user:
        await db.users.update_one(
            {"id": existing_user["id"]},
            {"$set": {"name": name, "email": email, "picture": picture, "updated_at": utc_now_iso()}},
        )
        refreshed = await db.users.find_one({"id": existing_user["id"]}, {"_id": 0})
        return AuthResponse(token=create_token(refreshed["id"]), user=user_to_public(refreshed))

    user_id = str(uuid.uuid4())
    now_iso = utc_now_iso()
    user_doc = {
        "id": user_id,
        "mode": "google",
        "google_sub": google_sub,
        "name": name,
        "email": email,
        "picture": picture,
        "streak": 0,
        "longest_streak": 0,
        "total_solved": 0,
        "total_score": 0,
        "solved_dates": [],
        "writes_today": 0,
        "writes_day_key": datetime.now().strftime("%Y-%m-%d"),
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    await db.users.insert_one(user_doc)
    return AuthResponse(token=create_token(user_id), user=user_to_public(user_doc))


@api_router.get("/auth/me", response_model=UserPublic)
async def me(user_doc: Dict[str, Any] = Depends(current_user)) -> UserPublic:
    return user_to_public(user_doc)


@api_router.post("/progress/sync", response_model=SyncProgressResponse)
async def sync_progress(payload: SyncProgressRequest, user_doc: Dict[str, Any] = Depends(current_user)) -> SyncProgressResponse:
    day_key = datetime.now().strftime("%Y-%m-%d")
    writes_today = user_doc.get("writes_today", 0)
    writes_day_key = user_doc.get("writes_day_key")
    if writes_day_key != day_key:
        writes_today = 0

    event_count = len(payload.puzzle_events)
    if writes_today + event_count > 10:
        raise HTTPException(status_code=429, detail="Daily write budget exceeded")

    solved_dates = list(user_doc.get("solved_dates", []))
    solved_total = user_doc.get("total_solved", 0)
    score_total = user_doc.get("total_score", 0)

    for event in payload.puzzle_events:
        validate_puzzle_event_security(event)
        solved_total += 1
        score_total += event.score
        solved_dates.append(event.day_key)
        await db.daily_scores.update_one(
            {"user_id": user_doc["id"], "puzzle_id": event.puzzle_id},
            {"$set": {
                "user_id": user_doc["id"],
                "day_key": event.day_key,
                "puzzle_id": event.puzzle_id,
                "puzzle_type": event.puzzle_type,
                "score": event.score,
                "time_spent_seconds": event.time_spent_seconds,
                "hints_used": event.hints_used,
                "completed_at": event.completed_at,
                "updated_at": utc_now_iso(),
            }},
            upsert=True,
        )

    streak = calculate_streak(solved_dates)
    longest_streak = max(user_doc.get("longest_streak", 0), streak)
    writes_today += event_count

    await db.users.update_one(
        {"id": user_doc["id"]},
        {"$set": {
            "solved_dates": sorted(set(solved_dates)),
            "streak": streak,
            "longest_streak": longest_streak,
            "total_solved": solved_total,
            "total_score": score_total,
            "writes_today": writes_today,
            "writes_day_key": day_key,
            "updated_at": utc_now_iso(),
        }},
    )

    return SyncProgressResponse(
        accepted=event_count,
        streak=streak,
        longest_streak=longest_streak,
        total_solved=solved_total,
        total_score=score_total,
        writes_today=writes_today,
    )


@api_router.post("/sync/daily-scores", response_model=SyncProgressResponse)
async def sync_daily_scores(payload: DailyScoreSyncRequest, user_doc: Dict[str, Any] = Depends(current_user)) -> SyncProgressResponse:
    event = payload.puzzle_event
    validate_puzzle_event_security(event)

    day_key = datetime.now().strftime("%Y-%m-%d")
    writes_today = user_doc.get("writes_today", 0)
    writes_day_key = user_doc.get("writes_day_key")
    if writes_day_key != day_key:
        writes_today = 0
    if writes_today + 1 > 10:
        raise HTTPException(status_code=429, detail="Daily write budget exceeded")

    existing = await db.daily_scores.find_one(
        {"user_id": user_doc["id"], "puzzle_id": event.puzzle_id, "day_key": event.day_key},
        {"_id": 0},
    )
    if existing:
        raise HTTPException(status_code=409, detail="Duplicate entry for same day")

    await db.daily_scores.insert_one({
        "user_id": user_doc["id"],
        "day_key": event.day_key,
        "puzzle_id": event.puzzle_id,
        "puzzle_type": event.puzzle_type,
        "score": event.score,
        "time_spent_seconds": event.time_spent_seconds,
        "hints_used": event.hints_used,
        "completed_at": event.completed_at,
        "updated_at": utc_now_iso(),
    })

    solved_dates = list(user_doc.get("solved_dates", []))
    solved_dates.append(event.day_key)
    solved_total = user_doc.get("total_solved", 0) + 1
    score_total = user_doc.get("total_score", 0) + event.score
    streak = calculate_streak(solved_dates)
    longest_streak = max(user_doc.get("longest_streak", 0), streak)
    writes_today += 1

    await db.users.update_one(
        {"id": user_doc["id"]},
        {"$set": {
            "solved_dates": sorted(set(solved_dates)),
            "streak": streak,
            "longest_streak": longest_streak,
            "total_solved": solved_total,
            "total_score": score_total,
            "writes_today": writes_today,
            "writes_day_key": day_key,
            "updated_at": utc_now_iso(),
        }},
    )

    return SyncProgressResponse(
        accepted=1,
        streak=streak,
        longest_streak=longest_streak,
        total_solved=solved_total,
        total_score=score_total,
        writes_today=writes_today,
    )


@api_router.get("/leaderboard", response_model=LeaderboardResponse)
async def leaderboard(request: Request) -> LeaderboardResponse:
    enforce_rate_limit("leaderboard", get_rate_limit_identifier(request))
    users = await db.users.find({}, {"_id": 0}).sort("total_score", -1).limit(25).to_list(25)

    entries = []
    for index, user_doc in enumerate(users, start=1):
        entries.append(
            LeaderboardEntry(
                rank=index,
                name=user_doc.get("name", "Player"),
                mode=user_doc.get("mode", "guest"),
                streak=user_doc.get("streak", 0),
                total_score=user_doc.get("total_score", 0),
                total_solved=user_doc.get("total_solved", 0),
            )
        )

    return LeaderboardResponse(entries=entries, generated_at=utc_now_iso())


@api_router.get("/stats/me", response_model=UserPublic)
async def my_stats(user_doc: Dict[str, Any] = Depends(current_user)) -> UserPublic:
    return user_to_public(user_doc)


@api_router.get("/stats/heatmap", response_model=HeatmapResponse)
async def my_heatmap(user_doc: Dict[str, Any] = Depends(current_user)) -> HeatmapResponse:
    docs = (
        await db.daily_scores.find({"user_id": user_doc["id"]}, {"_id": 0})
        .sort("day_key", -1)
        .limit(400)
        .to_list(400)
    )

    by_day: Dict[str, Dict[str, Any]] = {}
    for doc in docs:
        day_key = doc.get("day_key")
        if day_key not in by_day:
            by_day[day_key] = {
                "day_key": day_key,
                "score": doc.get("score", 0),
                "difficulty": "Hard" if doc.get("score", 0) >= 200 else "Medium" if doc.get("score", 0) >= 150 else "Easy",
                "completed": True,
            }
        else:
            by_day[day_key]["score"] = max(by_day[day_key]["score"], doc.get("score", 0))

    points = [HeatmapPoint(**value) for value in by_day.values()]
    return HeatmapResponse(points=points)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "https://logic-looper-theta.vercel.app").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()
