from datetime import datetime
from typing import Literal, Protocol

from pydantic import BaseModel, Field

Section = Literal["overview", "radiation", "vitals", "wellbeing", "environment", "insights"]
Hours = Literal[12, 24, 72]


class Sample(BaseModel):
    timestamp: datetime
    value: float


class Metric(BaseModel):
    id: str
    label: str
    unit: str
    source: str
    quality: Literal["simulated"] = "simulated"
    samples: list[Sample]


class Notice(BaseModel):
    timestamp: datetime
    title: str
    detail: str
    severity: Literal["watch", "info"]
    simulated: Literal[True] = True


class Astronaut(BaseModel):
    name: str
    initials: str
    role: str
    mission: str
    mission_day: int
    location: str
    activity: str


class Dashboard(BaseModel):
    section: Section
    timestamp: datetime
    simulation: Literal[True] = True
    astronaut: Astronaut
    metrics: list[Metric]
    alerts: list[Notice]
    guidance: list[str] = Field(default_factory=list)


class MissionRepository(Protocol):
    def astronaut(self) -> Astronaut: ...
    def alert_history(self) -> list[Notice]: ...


class TelemetrySource(Protocol):
    """Adapter boundary for dosimeters, wearables and cabin systems."""
    def metric(self, key: str, hours: Hours) -> Metric: ...


class SpaceWeatherSource(Protocol):
    """Adapter boundary for NASA DONKI and RadLab context."""
    async def notices(self, start: datetime, end: datetime) -> list[Notice]: ...


class VoiceAnalyzer(Protocol):
    async def analyze(self, audio: bytes, content_type: str) -> dict[str, float]: ...


class AnomalyAnalyzer(Protocol):
    def analyze(self, metrics: list[Metric]) -> list[Notice]: ...
