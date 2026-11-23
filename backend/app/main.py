from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .studio import router as studio_router
from .studio_dashboard import router as dashboard_router

app = FastAPI(title="AutoTyranno Video Studio API", version="0.1.0")
app.include_router(studio_router)
app.include_router(dashboard_router)


@app.middleware("http")
async def local_studio_origin(request: Request, call_next):
    origin=request.headers.get("origin")
    if request.url.path.startswith('/studio') and request.method not in ['GET','HEAD','OPTIONS'] and origin:
        if origin not in {'http://localhost:3000','http://127.0.0.1:3000','http://localhost:8000','http://127.0.0.1:8000'}:
            return JSONResponse(status_code=403,content={'detail':'Studio local chỉ nhận thao tác từ web local.'})
    return await call_next(request)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins) or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "autotyranno-video-studio",
        "time": datetime.now(timezone.utc).isoformat(),
    }
