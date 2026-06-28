import { createCalendarView } from './calendar.js';
import { createMapView } from './map.js';
import { loadMonthContent } from './dataLoader.js';
import { contentSources } from './contentSources.js';
import { activities } from '../data/activities.js';

const categoryLabels = {
  all: 'All',
  route: 'Routes',
  market: 'Markets',
  concert: 'Concerts',
  restaurant: 'Restaurants',
  brewery: 'Breweries',
  event: 'Events',
  'walking-tour': 'Walking tours'
};

export function createApp(root) {
  const state = {
    selectedCategory: 'all',
    selectedActivityId: null,
    view: 'month',
    selectedDay: 1,
    monthOffset: 0,
    monthData: null,
    loading: false
  };

  root.innerHTML = `
    <div style="display:grid;grid-template-columns:1.15fr 0.85fr;min-height:100vh;">
      <section style="padding:24px;background:linear-gradient(180deg,#f8fbff 0%,#f4f7fb 100%);">
        <h1 style="margin:0 0 8px;font-size:30px;">Amsterdam July planner</h1>
        <p style="margin:0 0 16px;color:#4d5870;max-width:700px;">A two-part planner for city events and idea-driven activities, with map links and route details built in.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center;">
          <button data-view="month" class="view-button active">Month</button>
          <button data-view="week" class="view-button">Week</button>
          <button data-view="day" class="view-button">Day</button>
          <div style="margin-left:auto;display:flex;gap:8px;align-items:center;">
            <button id="month-back" style="border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:6px 10px;cursor:pointer;">←</button>
            <div id="month-label" style="font-weight:700;min-width:120px;text-align:center;"></div>
            <button id="month-forward" style="border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:6px 10px;cursor:pointer;">→</button>
          </div>
        </div>
        <div id="calendar" style="background:#ffffff;border:1px solid #e7ebf2;border-radius:16px;padding:16px;box-shadow:0 10px 30px rgba(15,23,42,0.04);"></div>
        <div style="margin-top:18px;background:#ffffff;border:1px solid #e7ebf2;border-radius:16px;padding:16px;box-shadow:0 10px 30px rgba(15,23,42,0.04);">
          <h2 style="margin:0 0 10px;font-size:20px;">Activities</h2>
          <div id="activity-list" style="display:flex;flex-direction:column;gap:8px;"></div>
        </div>
        <div style="margin-top:18px;background:#ffffff;border:1px solid #e7ebf2;border-radius:16px;padding:16px;box-shadow:0 10px 30px rgba(15,23,42,0.04);">
          <h3 style="margin:0 0 8px;font-size:16px;">Public content sources</h3>
          <div style="font-size:13px;color:#64748b;">Events: ${contentSources.events.join(', ')}</div>
          <div style="font-size:13px;color:#64748b;margin-top:6px;">Routes: ${contentSources.routes.join(', ')}</div>
        </div>
      </section>
      <aside style="padding:24px;background:#ffffff;border-left:1px solid #e7ebf2;display:flex;flex-direction:column;gap:16px;">
        <div>
          <h2 style="margin:0 0 8px;font-size:20px;">Filters</h2>
          <div id="filters" style="display:flex;flex-wrap:wrap;gap:8px;"></div>
        </div>
        <div id="details" style="border:1px solid #e7ebf2;border-radius:12px;padding:16px;background:#fbfcff;"></div>
        <div id="map" style="height:320px;border-radius:12px;overflow:hidden;border:1px solid #e7ebf2;"></div>
      </aside>
    </div>
  `;

  const buttons = root.querySelectorAll('.view-button');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      state.view = button.dataset.view;
      render();
    });
  });

  root.querySelector('#month-back').addEventListener('click', () => {
    state.monthOffset -= 1;
    state.selectedActivityId = null;
    loadData();
  });

  root.querySelector('#month-forward').addEventListener('click', () => {
    state.monthOffset += 1;
    state.selectedActivityId = null;
    loadData();
  });

  loadData();

  async function loadData() {
    state.loading = true;
    state.monthData = await loadMonthContent(getMonthKey(state.monthOffset));
    state.loading = false;
    render();
  }

  function render() {
    const monthData = state.monthData || { events: [], routes: [] };
    const mergedActivities = [...monthData.events, ...monthData.routes];
    const currentMonthDate = getMonthDate(state.monthOffset);
    const filteredActivities = getFilteredActivities(mergedActivities);
    const eventActivities = filteredActivities.filter(item => ['market', 'concert', 'event'].includes(item.category));
    const activityIdeas = filteredActivities.filter(item => ['route', 'restaurant', 'brewery', 'walking-tour'].includes(item.category));
    const calendarEl = root.querySelector('#calendar');
    const activityListEl = root.querySelector('#activity-list');
    const detailsEl = root.querySelector('#details');
    const filtersEl = root.querySelector('#filters');
    const mapEl = root.querySelector('#map');

    calendarEl.innerHTML = '';
    createCalendarView(calendarEl, eventActivities, state.view, state.selectedDay, (activity, day) => {
      state.selectedActivityId = activity?.id ?? null;
      state.selectedDay = day ?? state.selectedDay;
      render();
    }, currentMonthDate);

    activityListEl.innerHTML = '';
    const activityHeading = document.createElement('div');
    activityHeading.style.color = '#64748b';
    activityHeading.style.fontSize = '13px';
    activityHeading.style.marginBottom = '4px';
    activityHeading.textContent = 'Routes, walking tours, breweries, and food stops';
    activityListEl.appendChild(activityHeading);

    activityIdeas.forEach(activity => {
      const card = document.createElement('button');
      card.style.border = '1px solid #e2e8f0';
      card.style.borderRadius = '10px';
      card.style.background = state.selectedActivityId === activity.id ? '#eef4ff' : '#fbfdff';
      card.style.padding = '10px 12px';
      card.style.textAlign = 'left';
      card.style.cursor = 'pointer';
      card.innerHTML = `<div style="font-weight:700;">${activity.title}</div><div style="color:#64748b;font-size:13px;margin-top:4px;">${activity.dateLabel} · ${activity.location}</div>`;
      card.addEventListener('click', () => {
        state.selectedActivityId = activity.id;
        render();
      });
      activityListEl.appendChild(card);
    });

    if (!activityIdeas.length) {
      const empty = document.createElement('div');
      empty.style.color = '#64748b';
      empty.style.fontSize = '13px';
      empty.textContent = 'No activity ideas in the current filter.';
      activityListEl.appendChild(empty);
    }

    filtersEl.innerHTML = '';
    const categories = ['all', ...new Set(mergedActivities.map(item => item.category))];
    categories.forEach(category => {
      const button = document.createElement('button');
      button.textContent = categoryLabels[category] || category;
      button.style.padding = '6px 10px';
      button.style.borderRadius = '999px';
      button.style.border = '1px solid #cbd5e1';
      button.style.background = category === state.selectedCategory ? '#162033' : '#ffffff';
      button.style.color = category === state.selectedCategory ? '#ffffff' : '#162033';
      button.style.cursor = 'pointer';
      button.addEventListener('click', () => {
        state.selectedCategory = category;
        state.selectedActivityId = null;
        render();
      });
      filtersEl.appendChild(button);
    });

    const selectedActivity = filteredActivities.find(item => item.id === state.selectedActivityId) || filteredActivities[0] || null;
    if (selectedActivity) {
      const routeDetailBlock = selectedActivity.routeSummary
        ? `<div style="margin:10px 0;padding:10px 12px;border-radius:10px;background:#eef4ff;color:#24407a;font-size:13px;">${selectedActivity.routeSummary}</div>`
        : '';
      const metadataBlock = selectedActivity.duration || selectedActivity.distance
        ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 0;color:#64748b;font-size:13px;">${selectedActivity.duration ? `<span>⏱ ${selectedActivity.duration}</span>` : ''}${selectedActivity.distance ? `<span>🗺 ${selectedActivity.distance}</span>` : ''}</div>`
        : '';
      const routeLinks = selectedActivity.sourceUrl || selectedActivity.mapUrl
        ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
            ${selectedActivity.sourceUrl ? `<a href="${selectedActivity.sourceUrl}" target="_blank" style="text-decoration:none;background:#2563eb;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">Route details</a>` : ''}
            ${selectedActivity.mapUrl ? `<a href="${selectedActivity.mapUrl}" target="_blank" style="text-decoration:none;background:#0f766e;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">Open route in maps</a>` : ''}
          </div>`
        : '';

      detailsEl.innerHTML = `
        <h3 style="margin:0 0 8px;">${selectedActivity.title}</h3>
        <p style="margin:0 0 8px;color:#4d5870;">${selectedActivity.dateLabel}</p>
        <p style="margin:0 0 8px;">${selectedActivity.description}</p>
        <p style="margin:0 0 8px;color:#4d5870;">${selectedActivity.location}</p>
        ${routeDetailBlock}
        ${metadataBlock}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
          <a href="https://www.google.com/maps/dir/?api=1&origin=Keizersgracht+61+Amsterdam&destination=${selectedActivity.lat},${selectedActivity.lng}&travelmode=bicycling" target="_blank" style="text-decoration:none;background:#162033;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">Bike directions</a>
          <a href="https://www.google.com/maps/dir/?api=1&origin=Keizersgracht+61+Amsterdam&destination=${selectedActivity.lat},${selectedActivity.lng}&travelmode=transit" target="_blank" style="text-decoration:none;background:#2563eb;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">Metro directions</a>
          <a href="https://maps.apple.com/?saddr=Keizersgracht+61+Amsterdam&daddr=${selectedActivity.lat},${selectedActivity.lng}" target="_blank" style="text-decoration:none;background:#0f766e;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">Download to iPhone</a>
          ${selectedActivity.category === 'walking-tour' ? `<a href="https://www.google.com/maps/dir/?api=1&origin=Keizersgracht+61+Amsterdam&destination=${selectedActivity.lat},${selectedActivity.lng}&travelmode=walking" target="_blank" style="text-decoration:none;background:#7c3aed;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">Start walk</a>` : ''}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
          <button id="share-activity" style="border:0;background:#f59e0b;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;cursor:pointer;">Share</button>
        </div>
        ${routeLinks}
      `;
    } else {
      detailsEl.innerHTML = '<p style="margin:0;color:#4d5870;">Select an activity to see details.</p>';
    }

    const shareButton = root.querySelector('#share-activity');
    if (shareButton && selectedActivity) {
      shareButton.addEventListener('click', async () => {
        const shareText = `${selectedActivity.title} — ${selectedActivity.dateLabel} — ${selectedActivity.location}`;
        const shareUrl = selectedActivity.sourceUrl || `https://maps.google.com/?q=${selectedActivity.lat},${selectedActivity.lng}`;
        if (navigator.share) {
          try {
            await navigator.share({ title: selectedActivity.title, text: shareText, url: shareUrl });
          } catch (error) {
            console.info('Share cancelled', error);
          }
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`, '_blank');
        }
      });
    }

    root.querySelector('#month-label').textContent = state.monthData ? state.monthData.monthLabel : 'Loading…';

    createMapView(mapEl, filteredActivities, selectedActivity);
  }

  function getFilteredActivities(mergedActivities) {
    if (state.selectedCategory === 'all') return mergedActivities;
    return mergedActivities.filter(item => item.category === state.selectedCategory);
  }

  function getMonthDate(offset) {
    return new Date(2026, 6 + offset, 1);
  }

  function getMonthKey(offset) {
    const base = getMonthDate(offset);
    return base.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }
}
