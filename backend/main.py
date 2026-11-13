from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .contracts import Dashboard, MissionRepository, Section, TelemetrySource
from .simulation import END, GUIDANCE, SECTIONS, Simulation

app = FastAPI(title="AstroVitalis", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                   "http://localhost:4173", "http://127.0.0.1:4173"],
    allow_methods=["GET"],
)
simulation = Simulation()
repository: MissionRepository = simulation
telemetry: TelemetrySource = simulation
WINDOWS = {"12": 12, "24": 24, "72": 72}


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "simulation": True}


@app.get("/api/demo/dashboard/{section}", response_model=Dashboard)
def dashboard(section: Section, hours: Literal["12", "24", "72"] = "24") -> Dashboard:
    return Dashboard(
        section=section, timestamp=END, astronaut=repository.astronaut(),
        metrics=[telemetry.metric(key, WINDOWS[hours]) for key in SECTIONS[section]],
        alerts=repository.alert_history(), guidance=GUIDANCE[section],
    )
