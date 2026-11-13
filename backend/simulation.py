from datetime import datetime, timedelta, timezone
from math import sin

from .contracts import Astronaut, Hours, Metric, Notice, Sample

END = datetime(2026, 4, 18, 14, 0, tzinfo=timezone.utc)
MISSION_START = END - timedelta(days=42)
SPECS = {
    "heart": ("Heart rate", "bpm", "Wearable", 68, 5),
    "hrv": ("Heart rate variability", "ms", "Wearable", 59, 8),
    "sys": ("Systolic pressure", "mmHg", "Blood pressure cuff", 117, 4),
    "dia": ("Diastolic pressure", "mmHg", "Blood pressure cuff", 75, 3),
    "spo2": ("Oxygen saturation", "%", "Pulse oximeter", 98, .5),
    "glucose": ("Glucose", "mg/dL", "Glucose sensor", 98, 10),
    "dose": ("Dose rate", "µSv/h", "Personal dosimeter", 14.5, 2.1),
    "cumulative": ("Cumulative mission dose", "mSv", "Integrated dosimeter", 0, 0),
    "sleep": ("Sleep duration", "h", "Sleep wearable", 7.4, .6),
    "quality": ("Sleep quality", "/100", "Sleep wearable", 86, 6),
    "stress": ("Stress index", "/100", "Wearable estimate", 34, 9),
    "mood": ("Mood check-in", "/10", "Crew log", 8, .9),
    "temp": ("Cabin temperature", "°C", "Cabin sensor", 22.4, .5),
    "co2": ("Carbon dioxide", "ppm", "Cabin sensor", 790, 80),
    "air": ("Cabin air quality", "/100", "Cabin sensor estimate", 93, 2),
    "gravity": ("Residual acceleration", "µg", "Accelerometer", 34, 6),
    "activity": ("Activity", "min/h", "Wearable", 13, 8),
}
SECTIONS = {
    "overview": ("heart", "dose", "sleep", "spo2"),
    "radiation": ("dose", "cumulative"),
    "vitals": ("heart", "hrv", "sys", "dia", "spo2", "glucose"),
    "wellbeing": ("sleep", "quality", "stress", "mood"),
    "environment": ("temp", "co2", "air", "gravity", "activity"),
    "insights": ("co2", "stress", "heart", "activity"),
}
GUIDANCE = {
    "overview": ["Review the radiation and cabin events in the simulated mission log."],
    "radiation": ["For the drill, confirm dosimeter readings with mission control and review the mission shelter plan before EVA."],
    "vitals": ["For the drill, repeat an unexpected reading at rest and record its activity context."],
    "wellbeing": ["Log rest interruptions and review the next sleep opportunity with the crew lead."],
    "environment": ["For the drill, check the cabin ventilation log alongside activity and CO₂."],
    "insights": ["Compare event timestamps and review the original readings with mission control before acting on a simulated flag."],
}


def value_at(key: str, hour: int) -> float:
    _, _, _, base, amplitude = SPECS[key]
    if key in {"sleep", "quality", "mood"}:
        hour = hour // 24 * 24
    phase = {"hrv": 2.8, "air": 2.9, "sleep": 1.5, "dose": .8}.get(key, 0)
    wave = .67 * sin(hour / 3.8 + phase) + .33 * sin(hour / 1.6)
    event = max(0, 1 - abs(hour - 996) / 4)
    uplift = {"dose": 10, "co2": 145, "stress": 12, "heart": 7, "activity": 11}.get(key, 0)
    return round(base + amplitude * wave + uplift * event, 2)


def integrated_dose() -> list[float]:
    # Trapezoidal integration: µSv/h × 1 h ÷ 1000 = mSv.
    totals = [0.0]
    for hour in range(1, 42 * 24 + 1):
        interval = (value_at("dose", hour - 1) + value_at("dose", hour)) / 2
        totals.append(totals[-1] + interval / 1000)
    return totals


DOSE_TOTALS = integrated_dose()


class Simulation:
    def astronaut(self) -> Astronaut:
        return Astronaut(
            name="Maya Chen", initials="MC", role="Flight Engineer", mission="ORION-07",
            mission_day=42, location="Low Earth Orbit · Habitation module",
            activity="In-cabin operations · EVA planning",
        )

    def metric(self, key: str, hours: Hours) -> Metric:
        label, unit, source, _, _ = SPECS[key]
        end_hour = 42 * 24
        return Metric(id=key, label=label, unit=unit, source=f"Simulated {source.lower()}",
                      samples=[
                          Sample(timestamp=MISSION_START + timedelta(hours=hour),
                                 value=round(DOSE_TOTALS[hour], 4) if key == "cumulative" else value_at(key, hour))
                          for hour in range(end_hour - hours, end_hour + 1)
                      ])

    def alert_history(self) -> list[Notice]:
        return [
            Notice(timestamp=END - timedelta(hours=12), title="Radiation excursion",
                   detail="Scripted dosimeter excursion during an orbital pass. Review the event before EVA planning.", severity="watch"),
            Notice(timestamp=END - timedelta(hours=13), title="Cabin CO₂ trending upward",
                   detail="Scripted CO₂ increase overlaps a period of higher crew activity.", severity="watch"),
            Notice(timestamp=END - timedelta(hours=28), title="Crew rest check-in",
                   detail="Review the simulated rest log during the next crew handover.", severity="info"),
        ]
