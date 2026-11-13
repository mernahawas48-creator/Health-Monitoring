import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowDown, ArrowUp, AudioLines, CircleAlert, Clock3, FlaskConical, Gauge,
  HeartPulse, LayoutGrid, MapPin, Moon, Orbit, Radio, Radiation, ShieldCheck, Wind,
} from 'lucide-react';
import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getDashboard } from './api';
import './styles.css';

const sections = {
  overview: { label: 'Overview', title: 'Mission Overview', description: 'Crew health, radiation exposure, and mission alerts.', icon: LayoutGrid },
  radiation: { label: 'Radiation', title: 'Radiation Exposure', description: 'Dosimeter readings, mission accumulation, and protection guidance.', icon: Radiation },
  vitals: { label: 'Vitals', title: 'Crew Vitals', description: 'Cardiovascular, respiratory, and metabolic telemetry.', icon: HeartPulse },
  wellbeing: { label: 'Wellbeing', title: 'Crew Wellbeing', description: 'Rest, stress, and crew check-ins.', icon: Moon },
  environment: { label: 'Environment', title: 'Cabin Environment', description: 'Habitat conditions and crew activity.', icon: Wind },
  insights: { label: 'Insights & Safety', title: 'Insights & Safety', description: 'Compare telemetry around scripted events and review the mission log.', icon: ShieldCheck },
};
const colors = ['#65e6cd', '#b6a1ff', '#ffc381', '#73b8ff'];
const metricIcons = { heart: HeartPulse, dose: Radiation, sleep: Moon, spo2: Wind, cumulative: Gauge, co2: Wind };
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });
const utcTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
const utcDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });
const timestamp = (value) => `${utcDate.format(new Date(value))} · ${utcTime.format(new Date(value))} UTC`;

function currentSection() {
  const key = window.location.hash.slice(1);
  return Object.hasOwn(sections, key) ? key : 'overview';
}

function Sidebar({ section }) {
  return <aside className="sidebar">
    <a href="#overview" className="brand"><span className="brand-icon"><Orbit size={24} /></span><span>AstroVitalis<small>CREW HEALTH MONITOR</small></span></a>
    <div className="nav-caption">MISSION WORKSPACE</div>
    <nav aria-label="Mission workspace">
      {Object.entries(sections).map(([key, { label, icon: Icon }]) => <a key={key} href={`#${key}`}
        aria-current={section === key ? 'page' : undefined}><Icon size={18} />{label}</a>)}
    </nav>
    <div className="sidebar-note"><FlaskConical size={16} /><span>NASA Space Apps MVP<br /><small>Simulated mission telemetry</small></span></div>
  </aside>;
}

function Crew({ astronaut }) {
  return <section className="crew panel" aria-label="Crew profile and mission context">
    <div className="crew-profile"><div className="avatar">{astronaut.initials}</div><div>
      <div className="eyebrow">CREW MEMBER</div><h2>{astronaut.name}</h2><p>{astronaut.role}</p>
    </div></div>
    <div className="crew-detail"><Orbit size={20} /><div><div className="eyebrow">MISSION</div><strong>{astronaut.mission}</strong><p>Mission day {astronaut.mission_day}</p></div></div>
    <div className="crew-detail"><MapPin size={20} /><div><div className="eyebrow">LOCATION & ACTIVITY</div><strong>{astronaut.location}</strong><p>{astronaut.activity}</p></div></div>
  </section>;
}

function MetricCard({ metric, color }) {
  const Icon = metricIcons[metric.id] || Activity;
  const last = metric.samples.at(-1).value;
  const delta = last - metric.samples[0].value;
  const Trend = delta < 0 ? ArrowDown : ArrowUp;
  return <article className="metric panel" style={{ '--metric': color }}>
    <div className="metric-top"><span className="metric-icon"><Icon size={18} /></span><span className="eyebrow">{metric.quality}</span></div>
    <h3>{metric.label}</h3>
    <div className="reading">{number.format(last)} <small>{metric.unit}</small></div>
    <div className="metric-footer">
      <span className="delta">{Math.abs(delta) >= .001 && <Trend size={13} />}{delta === 0 ? 'No change' : `${number.format(Math.abs(delta))} ${metric.unit}`}</span>
      <span>{metric.source}</span>
    </div>
  </article>;
}

function Trends({ metrics, alerts, compare }) {
  const [metricId, setMetricId] = useState(metrics[0].id);
  const active = metrics.find(metric => metric.id === metricId) || metrics[0];
  const series = compare ? metrics : [active];
  const ranges = series.map(({ samples }) => {
    const values = samples.map(({ value }) => value);
    return [Math.min(...values), Math.max(...values)];
  });
  const rows = active.samples.map(({ timestamp: time }, index) => ({
    time,
    ...Object.fromEntries(series.map(({ id, samples }, j) => {
      const value = samples[index].value;
      const [min, max] = ranges[j];
      return [id, compare ? (max === min ? 50 : 100 * (value - min) / (max - min)) : value];
    })),
  }));
  const events = alerts.filter(alert => alert.severity === 'watch' && rows.some(row => row.time === alert.timestamp));
  return <section className="panel trends">
    <div className="panel-header"><div><h2>{compare ? 'Cross-factor trends' : 'Telemetry trends'}</h2>
      <p>{compare ? 'Each signal scaled to its own range · hover for readings' : 'Historical readings · UTC'}</p></div>
      {!compare && <select aria-label="Chart metric" value={active.id} onChange={event => setMetricId(event.target.value)}>
        {metrics.map(metric => <option key={metric.id} value={metric.id}>{metric.label}</option>)}
      </select>}
    </div>
    <div className="chart" role="group" aria-label={compare ? 'Cross-factor time series' : `${active.label} time series in ${active.unit}`}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <ComposedChart data={rows} margin={{ top: 12, right: 8, bottom: 4, left: 1 }}>
          <defs><linearGradient id="telemetry-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors[0]} stopOpacity={.25} /><stop offset="100%" stopColor={colors[0]} stopOpacity={.02} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#253249" strokeDasharray="4 5" />
          <XAxis dataKey="time" tickFormatter={value => rows.length > 25 ? utcDate.format(new Date(value)) : utcTime.format(new Date(value))} tick={{ fill: '#9dacc2', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis domain={compare ? [0, 100] : ['auto', 'auto']} width={42} tickFormatter={number.format} tick={{ fill: '#9dacc2', fontSize: 11 }} tickLine={false} axisLine={false} />
          {compare && events.map(event => <ReferenceLine key={event.title} x={event.timestamp}
            stroke="#ffc381" strokeDasharray="4 4" />)}
          <Tooltip cursor={{ stroke: '#65778f' }} content={({ active: visible, label }) => {
            const index = rows.findIndex(row => row.time === label);
            return visible && index >= 0 ? <div className="chart-tooltip"><strong>{timestamp(label)}</strong>
              {series.map(({ id, label: title, unit, samples }) => <div key={id}>{title} · {number.format(samples[index].value)} {unit}</div>)}
            </div> : null;
          }} />
          {compare ? series.map(({ id }, index) => <Line key={id} type="linear" dataKey={id} stroke={colors[index]} strokeWidth={2} dot={false} isAnimationActive={false} />)
            : <Area type="linear" dataKey={active.id} stroke={colors[0]} strokeWidth={2} fill="url(#telemetry-fill)" isAnimationActive={false} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    {compare && <><div className="legend">{series.map(({ id, label }, index) => <span key={id}><i style={{ background: colors[index] }} />{label}</span>)}</div>
      <div className="event-list">{events.map(alert =>
        <span key={alert.title}><CircleAlert size={14} />{utcTime.format(new Date(alert.timestamp))} UTC · {alert.title}</span>)}</div></>}
    {!compare && <p className="chart-unit">Unit · {active.unit}</p>}
  </section>;
}

function Alerts({ alerts, history }) {
  const shown = history ? alerts : alerts.slice(0, 2);
  return <section className="panel alerts">
    <div className="panel-header"><div><h2>{history ? 'Alert history' : 'Mission alerts'}</h2><p>Simulated mission events</p></div><span className="alert-count">{shown.length}</span></div>
    <div className="alert-list">{shown.map(alert => <article key={alert.title} className="alert">
      <span className={`alert-icon ${alert.severity}`}><CircleAlert size={17} /></span>
      <div><div className="alert-meta">{alert.severity} · {timestamp(alert.timestamp)}</div><h3>{alert.title}</h3><p>{alert.detail}</p></div>
    </article>)}</div>
    {!history && <a className="history-link" href="#insights">View alert history <span aria-hidden="true">→</span></a>}
  </section>;
}

function App() {
  const [section, setSection] = useState(currentSection);
  const [hours, setHours] = useState(24);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState(null);
  const requestKey = `${section}/${hours}/${retry}`;
  useEffect(() => {
    const update = () => setSection(currentSection());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    getDashboard(section, hours, controller.signal)
      .then(data => setResult({ requestKey, data }))
      .catch(error => {
        if (!controller.signal.aborted) setResult({ requestKey, error: error.message });
      });
    return () => controller.abort();
  }, [section, hours, requestKey]);
  const active = result?.requestKey === requestKey ? result : null;
  const data = active?.data;
  const { title, description } = sections[section];
  return <div className="layout">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content').focus(); }}>Skip to content</a>
    <Sidebar section={section} />
    <div className="workspace">
      <header className="topbar"><div className="console"><Radio size={17} /> MISSION CONTROL</div><span className="simulation"><FlaskConical size={14} /> SIMULATION MODE</span></header>
      <main id="main-content" tabIndex={-1}>
        <div className="page-heading"><div><h1>{title}</h1><p>{description}</p></div>
          <div className="ranges" role="group" aria-label="Telemetry time window">
            {[12, 24, 72].map(value => <button key={value} type="button" aria-pressed={hours === value} onClick={() => setHours(value)}>{value}h</button>)}
          </div>
        </div>
        {!active && <div className="panel state" role="status">Loading mission telemetry…</div>}
        {active?.error && <div className="panel state" role="alert"><CircleAlert size={20} /><span>{active.error} If offline, open a section and time window previously loaded on this device.</span><button onClick={() => setRetry(value => value + 1)}>Retry</button></div>}
        {data && <>
          {data.cached && <div className="panel cache-note" role="status">Offline · showing previously loaded simulation data.</div>}
          <Crew astronaut={data.astronaut} />
          <div className="section-heading"><h2>Telemetry snapshot</h2><span><Clock3 size={14} /> {timestamp(data.timestamp)}</span></div>
          <div className="metric-grid">{data.metrics.map((metric, index) => <MetricCard key={metric.id} metric={metric} color={colors[index % colors.length]} />)}</div>
          <div className="analysis-grid">
            <Trends key={section} metrics={data.metrics} alerts={data.alerts} compare={section === 'insights'} />
            <Alerts alerts={data.alerts} history={section === 'insights'} />
          </div>
          <section className="panel guidance"><ShieldCheck size={21} /><div><h2>Simulated guidance</h2>{data.guidance.map(item => <p key={item}>{item}</p>)}</div></section>
          {section === 'wellbeing' && <section className="panel guidance"><AudioLines size={21} /><div><h2>Voice emotion analysis</h2><p>Integration pending. Voice capture is disabled in this demo.</p></div></section>}
        </>}
        <footer>AstroVitalis · NASA Space Apps MVP <span>Simulated readings and guidance</span></footer>
      </main>
    </div>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
