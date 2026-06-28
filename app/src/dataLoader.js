import { activities as staticActivities } from '../data/activities.js';

const cache = new Map();

function toSnippet(text) {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

async function fetchLiveCandidate(sourceUrl, category) {
  const normalizedUrl = sourceUrl.replace(/^https?:\/\//, '');
  const proxiedUrl = `https://r.jina.ai/http://${normalizedUrl}`;

  try {
    const response = await fetch(proxiedUrl, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) throw new Error(`Fetch failed with ${response.status}`);

    const rawText = await response.text();
    const snippet = toSnippet(rawText);
    const host = new URL(sourceUrl).hostname.replace(/^www\./, '');

    return {
      id: `live-${category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `Live ${category} idea from ${host}`,
      category,
      day: 1,
      dateLabel: 'Live source',
      description: snippet || 'Live source preview loaded from the public website.',
      location: host,
      lat: 52.3676,
      lng: 4.9041,
      sourceUrl,
      sourceLabel: 'Live source preview',
      month: 'dynamic'
    };
  } catch (error) {
    console.info('Live content fetch skipped', error.message);
    return null;
  }
}

function buildStaticContent(monthKey) {
  const eventCategories = ['market', 'concert', 'event'];
  const seededEvents = staticActivities.filter(item => eventCategories.includes(item.category));
  const seededOther = staticActivities.filter(item => !eventCategories.includes(item.category));

  return {
    monthLabel: monthKey,
    events: seededEvents.map(item => ({ ...item, sourceLabel: 'Seeded planner content', month: monthKey })),
    routes: seededOther.map(item => ({ ...item, sourceLabel: 'Seeded planner content', month: 'static' }))
  };
}

export async function loadMonthContent(monthKey, onUpdate) {
  if (cache.has(monthKey)) {
    return cache.get(monthKey);
  }

  const staticContent = buildStaticContent(monthKey);

  const eventSources = [
    'https://www.iamsterdam.com/en/whats-on/calendar',
    'https://www.amsterdam.info/events/',
    'https://www.eventbrite.com/d/netherlands--amsterdam/events/'
  ];

  const routeSources = [
    'https://www.iamsterdam.com/en/see-and-do/nature-and-active/walking-and-cycling-routes',
    'https://www.iamsterdam.com/en/see-and-do/nature-and-active/walking-and-cycling-routes/public-art-walking-route'
  ];

  Promise.all([
    ...eventSources.map(s => fetchLiveCandidate(s, 'event')),
    ...routeSources.map(s => fetchLiveCandidate(s, 'route'))
  ]).then(results => {
    const live = results.filter(Boolean);
    const eventCats = ['market', 'concert', 'event'];
    const liveEvents = live.filter(r => eventCats.includes(r.category));
    const liveRoutes = live.filter(r => !eventCats.includes(r.category));

    const merged = {
      ...staticContent,
      events: [...staticContent.events, ...liveEvents],
      routes: [...staticContent.routes, ...liveRoutes]
    };
    cache.set(monthKey, merged);
    if (onUpdate) onUpdate(merged);
  }).catch(() => {
    cache.set(monthKey, staticContent);
    if (onUpdate) onUpdate(staticContent);
  });

  return staticContent;
}
