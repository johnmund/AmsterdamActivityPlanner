import { activities as staticActivities } from '../data/activities.js';

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
      headers: { Accept: 'text/plain' }
    });

    if (!response.ok) {
      throw new Error(`Fetch failed with ${response.status}`);
    }

    const rawText = await response.text();
    const snippet = toSnippet(rawText);
    const host = new URL(sourceUrl).hostname.replace(/^www\./, '');
    const title = category === 'event'
      ? `Live event idea from ${host}`
      : `Live route idea from ${host}`;

    return {
      id: `live-${category}-${Date.now()}`,
      title,
      category,
      day: 1,
      dateLabel: 'Live source',
      description: snippet || 'Live source preview loaded from the public website.',
      location: host,
      lat: 52.3676,
      lng: 4.9041,
      sourceUrl: sourceUrl,
      sourceLabel: 'Live source preview',
      month: 'dynamic'
    };
  } catch (error) {
    console.info('Live content fetch skipped', error.message);
    return null;
  }
}

export async function loadMonthContent(monthKey) {
  const eventSources = [
    'https://www.iamsterdam.com/en/whats-on/calendar',
    'https://www.amsterdam.info/events/',
    'https://www.eventbrite.com/d/netherlands--amsterdam/events/'
  ];

  const routeSources = [
    'https://www.iamsterdam.com/en/see-and-do/nature-and-active/walking-and-cycling-routes',
    'https://www.iamsterdam.com/en/see-and-do/nature-and-active/walking-and-cycling-routes/public-art-walking-route'
  ];

  const monthLabel = monthKey;
  const seededEvents = staticActivities.filter(item => ['market', 'concert', 'event'].includes(item.category));
  const seededRoutes = staticActivities.filter(item => ['route', 'walking-tour', 'brewery'].includes(item.category));

  const eventCandidates = seededEvents.map(item => ({
    ...item,
    sourceLabel: 'Seeded planner content',
    month: monthLabel
  }));

  const routeCandidates = seededRoutes.map(item => ({
    ...item,
    sourceLabel: 'Seeded planner content',
    month: 'static'
  }));

  const liveEventCandidates = (await Promise.all(eventSources.map(source => fetchLiveCandidate(source, 'event'))))
    .filter(Boolean);
  const liveRouteCandidates = (await Promise.all(routeSources.map(source => fetchLiveCandidate(source, 'route'))))
    .filter(Boolean);

  const monthContent = {
    monthLabel,
    events: [...eventCandidates, ...liveEventCandidates],
    routes: [...routeCandidates, ...liveRouteCandidates],
    eventSources,
    routeSources
  };

  return monthContent;
}
