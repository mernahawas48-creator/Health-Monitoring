# AstroVitalis

AstroVitalis is a NASA Space Apps MVP for exploring a fictional astronaut's health and environment telemetry. All measurements, anomalies, and guidance are simulated.

## Run locally

Use Python 3.11+ and Node 20.19+ or 22.12+.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
npm.cmd --prefix frontend install
```

Start FastAPI and Vite from the project root in separate terminals.

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
npm.cmd --prefix frontend run dev
```

Open http://localhost:5173. FastAPI's OpenAPI UI is at http://127.0.0.1:8000/docs.

## Production build and offline demo

Keep FastAPI running and start the production preview.

```powershell
npm.cmd --prefix frontend run build
npm.cmd --prefix frontend run preview
```

Open http://localhost:4173. Once the service worker controls the page, visit the sections and time windows you want available offline. The app shell is precached. Only successful responses under /api/demo/ are eligible for runtime caching. Installation is available through compatible browsers on localhost or HTTPS.

## API

GET /api/health reports service status. GET /api/demo/dashboard/{section}?hours=24 returns one of six sections, with a 12, 24, or 72 hour history. Timestamps are UTC. Hourly sample endpoints are inclusive, so a 24-hour range contains 25 points. The simulator integrates hourly dose rates with the trapezoidal rule and converts µSv to mSv. Daily sleep and mood readings are held until the next daily reading. Cross-factor trends use per-series min–max scaling, with raw values in the tooltip. Alerts are scripted mission events.

## Integration points

The protocols in backend/contracts.py define boundaries for a future database, NASA RadLab and DONKI, CAD/dosimeters, wearables, voice AI, and ML anomaly analysis. The frontend uses the same-origin Vite proxy in development and preview. Serve the built app and route /api to FastAPI on the same origin in deployment.
