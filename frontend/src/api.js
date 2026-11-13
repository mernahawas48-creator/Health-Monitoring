export async function getDashboard(section, hours, signal) {
  let response;
  try {
    response = await fetch(`/api/demo/dashboard/${section}?hours=${hours}`, { signal });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error('Mission telemetry is temporarily unavailable.');
  }
  if (!response.ok) throw new Error('Mission telemetry is temporarily unavailable.');
  const data = await response.json();
  return { ...data, cached: !navigator.onLine };
}
