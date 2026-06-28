import { activities as staticActivities } from '../data/activities.js';

const cache = new Map();

const eventCategories = ['market', 'concert', 'event'];

function buildMonthContent(monthKey) {
  const seededEvents = staticActivities.filter(item => eventCategories.includes(item.category));
  const seededOther = staticActivities.filter(item => !eventCategories.includes(item.category));

  return {
    monthLabel: monthKey,
    events: seededEvents.map(item => ({ ...item, sourceLabel: 'Curated planner content', month: monthKey })),
    routes: seededOther.map(item => ({ ...item, sourceLabel: 'Curated planner content', month: 'static' }))
  };
}

// Content is curated in app/data/activities.js. We previously tried to scrape
// live events through a text proxy, but it only ever yielded generic snippets
// with no real location, so those placeholder items were removed. `onUpdate`
// is kept in the signature so callers don't need to change if a real live
// source (with structured data + coordinates) is wired up later.
export async function loadMonthContent(monthKey, _onUpdate) {
  if (cache.has(monthKey)) {
    return cache.get(monthKey);
  }
  const content = buildMonthContent(monthKey);
  cache.set(monthKey, content);
  return content;
}
