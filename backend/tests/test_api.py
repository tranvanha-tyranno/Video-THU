from fastapi.testclient import TestClient

from app.main import app


def test_video_studio_api_exposes_only_the_active_workflow():
    with TestClient(app) as client:
        assert client.get("/health").json()["service"] == "autotyranno-video-studio"
        paths = client.get("/openapi.json").json()["paths"]
        assert "/studio/projects" in paths
        assert all(path == "/health" or path.startswith("/studio/") for path in paths)
        assert client.get("/media/old-upload.jpg").status_code == 404
